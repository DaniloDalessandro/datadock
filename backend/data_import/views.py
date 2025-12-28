from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.pagination import PageNumberPagination
from django.http import HttpResponse, StreamingHttpResponse
from django.utils.decorators import method_decorator
from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth
from datetime import datetime, timedelta
from django_ratelimit.decorators import ratelimit
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from .models import DataImportProcess
from .serializers import DataImportRequestSerializer, DataImportProcessSerializer
from .services import DataImportService
from .permissions import IsDatasetOwner, CanDeleteDatasets
from .cache import invalidate_process_caches
import logging
import uuid
import io
import csv

logger = logging.getLogger(__name__)


def log_error_safely(error: Exception, context: str = "") -> str:
    """
    Registra detalhes do erro no servidor e retorna um ID seguro para o cliente.
    Nunca expõe detalhes internos ao cliente.
    """
    import traceback
    error_id = str(uuid.uuid4())[:8]
    error_details = traceback.format_exc()

    logger.error(f"Error ID {error_id} - {context}")
    logger.error(f"Error type: {type(error).__name__}")
    logger.error(f"Error message: {str(error)}")
    logger.error(f"Traceback:\n{error_details}")

    return error_id


class DataImportPagination(PageNumberPagination):
    """
    Paginação para lista de processos
    """
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


@extend_schema(
    tags=['Data Import'],
    summary='Importar dados de arquivo ou endpoint',
    description='''
    Importa dados de um arquivo (CSV, Excel) ou endpoint externo.

    **Rate limit:** 10 imports por hora por usuário

    **Formatos suportados:**
    - CSV (.csv)
    - Excel (.xlsx, .xls)
    - Endpoint JSON (API externa)

    **Limites:**
    - Tamanho máximo: 50MB
    - Linhas máximas: 100.000
    - Colunas máximas: 100
    ''',
    request=DataImportRequestSerializer,
    responses={
        201: DataImportProcessSerializer,
        400: OpenApiTypes.OBJECT,
        500: OpenApiTypes.OBJECT,
    },
)
@method_decorator(ratelimit(key='user', rate='10/h', method='POST'), name='post')
class ImportDataView(APIView):
    """
    View para importar dados de um endpoint externo ou arquivo
    POST /api/data-import/

    Suporta:
    - Importação via URL de endpoint (dados JSON de API)
    - Upload de arquivo (arquivos Excel/CSV)
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logger.info("="*60)
        logger.info("[IMPORT] Nova requisicao de importacao recebida")
        logger.info("="*60)
        logger.info(f"Content-Type: {request.content_type}")
        logger.info(f"FILES: {list(request.FILES.keys())}")
        logger.info(f"DATA keys: {list(request.data.keys())}")

        # Prepara dados para o serializer
        data = request.data.copy()

        # Obtém arquivo se presente
        file = request.FILES.get('file', None)
        if file:
            logger.info("[FILE] Arquivo recebido:")
            logger.info(f"   - Nome: {file.name}")
            logger.info(f"   - Tamanho: {file.size} bytes")
            logger.info(f"   - Content-Type: {file.content_type}")
            data['file'] = file

        serializer = DataImportRequestSerializer(data=data)

        if not serializer.is_valid():
            logger.error(f"[ERROR] Validacao falhou: {serializer.errors}")
            return Response(
                {'error': 'Dados inválidos', 'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Extrai dados validados
        import_type = serializer.validated_data['import_type']
        table_name = serializer.validated_data['table_name']
        endpoint_url = serializer.validated_data.get('endpoint_url')
        uploaded_file = serializer.validated_data.get('file')

        logger.info("[OK] Dados validados:")
        logger.info(f"   - Tipo: {import_type}")
        logger.info(f"   - Tabela: {table_name}")
        if import_type == 'file' and uploaded_file:
            logger.info(f"   - Arquivo: {uploaded_file.name}")

        try:
            logger.info("[PROCESS] Iniciando importacao...")
            # Executa importação
            process = DataImportService.import_data(
                table_name=table_name,
                user=request.user,
                endpoint_url=endpoint_url,
                file=uploaded_file,
                import_type=import_type
            )
            logger.info("[OK] Importacao concluida com sucesso!")

            # Invalida caches relacionados
            invalidate_process_caches(process.id)

            # Retorna processo criado
            result_serializer = DataImportProcessSerializer(process)

            # Obtém estatísticas de inserção
            message = f'Dados importados com sucesso! {process.record_count} registros inseridos.'

            return Response(
                {
                    'success': True,
                    'message': message,
                    'process': result_serializer.data
                },
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            error_id = log_error_safely(e, "Data import failed")

            # Cria mensagens de erro mais amigáveis
            error_message = str(e)
            if 'Erro ao ler arquivo' in error_message:
                user_message = "Não foi possível ler o arquivo. Verifique se está no formato correto (.xlsx, .xls ou .csv)."
            elif 'Formato de arquivo não suportado' in error_message:
                user_message = "Formato de arquivo não suportado. Use arquivos .xlsx, .xls ou .csv"
            elif 'arquivo está vazio' in error_message:
                user_message = "O arquivo está vazio ou não contém dados válidos"
            elif 'timeout' in error_message.lower():
                user_message = 'O servidor de dados não respondeu a tempo. Tente novamente mais tarde.'
            elif 'connection' in error_message.lower():
                user_message = 'Não foi possível conectar ao servidor de dados. Verifique a URL.'
            else:
                user_message = "Erro ao importar dados. Por favor, tente novamente."

            return Response(
                {
                    'success': False,
                    'error': user_message,
                    'error_type': type(e).__name__,
                    'error_id': error_id
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@extend_schema(
    tags=['Data Import'],
    summary='Listar todos os processos de importação',
    description='Lista todos os processos de importação com paginação. Cache de 5 minutos.',
    parameters=[
        OpenApiParameter(name='page', type=int, description='Número da página'),
        OpenApiParameter(name='page_size', type=int, description='Itens por página (max 100)'),
    ],
    responses={200: DataImportProcessSerializer(many=True)},
)
class ListProcessesView(APIView):
    """
    View para listar todos os processos de importação
    GET /api/data-import/processes/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Lista todos os processos de importação com paginação e queries otimizadas
        """
        # Usa select_related para evitar queries N+1 ao acessar created_by
        processes = DataImportProcess.objects.select_related('created_by').all()

        paginator = DataImportPagination()
        paginated_processes = paginator.paginate_queryset(processes, request)

        serializer = DataImportProcessSerializer(paginated_processes, many=True)

        return paginator.get_paginated_response(serializer.data)


class ProcessDetailView(APIView):
    """
    View para ver detalhes de um processo específico
    GET /api/data-import/processes/<id>/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        """
        Retorna detalhes de um processo de importação específico
        """
        try:
            process = DataImportProcess.objects.get(pk=pk)
            serializer = DataImportProcessSerializer(process)

            return Response(serializer.data)

        except DataImportProcess.DoesNotExist:
            return Response(
                {'error': 'Processo não encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )


class DeleteProcessView(APIView):
    """
    View para deletar um processo e sua tabela
    DELETE /api/data-import/processes/<id>/delete/
    """
    permission_classes = [IsAuthenticated, CanDeleteDatasets]

    def delete(self, request, pk):
        """
        Deleta um processo e seus registros associados (usando ORM)
        """
        try:
            process = DataImportProcess.objects.get(pk=pk)

            self.check_object_permissions(request, process)
            table_name = process.table_name

            from .models import ImportedDataRecord
            record_count = ImportedDataRecord.objects.filter(process=process).count()

            process.delete()
            invalidate_process_caches(pk)

            logger.info(f"[OK] Processo {table_name} e {record_count} registros deletados com sucesso")

            return Response(
                {
                    'success': True,
                    'message': f'Processo {table_name} e {record_count} registros deletados com sucesso'
                },
                status=status.HTTP_200_OK
            )

        except DataImportProcess.DoesNotExist:
            return Response(
                {'error': 'Processo não encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Erro ao deletar processo: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(ratelimit(key='user', rate='20/h', method='POST'), name='post')
class AppendDataView(APIView):
    """
    View para adicionar mais dados a uma tabela existente
    POST /api/data-import/processes/<id>/append/
    Rate limit: 20 appends per hour per user
    """
    permission_classes = [IsAuthenticated, IsDatasetOwner]

    def post(self, request, pk):
        """
        Adiciona mais dados a uma tabela existente
        """
        try:
            process = DataImportProcess.objects.get(pk=pk)

            self.check_object_permissions(request, process)

            logger.info("="*60)
            logger.info(f"[APPEND] Adicionando dados a tabela: {process.table_name}")
            logger.info("="*60)

            # Prepara dados para o serializer
            data = request.data.copy()
            file = request.FILES.get('file', None)
            if file:
                data['file'] = file

            # Valida requisição
            serializer = DataImportRequestSerializer(data=data)
            if not serializer.is_valid():
                logger.error(f"[ERROR] Validacao falhou: {serializer.errors}")
                return Response(
                    {'error': 'Dados inválidos', 'details': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Extrai dados validados
            import_type = serializer.validated_data['import_type']
            endpoint_url = serializer.validated_data.get('endpoint_url')
            uploaded_file = serializer.validated_data.get('file')

            # Busca novos dados
            if import_type == 'endpoint':
                if not endpoint_url:
                    raise ValueError('URL do endpoint é obrigatória')
                data, column_structure = DataImportService.fetch_data_from_endpoint(endpoint_url)
            elif import_type == 'file':
                if not uploaded_file:
                    raise ValueError('Arquivo é obrigatório')
                data, column_structure = DataImportService.process_file_data(uploaded_file)
            else:
                raise ValueError(f'Tipo de importação inválido: {import_type}')

            insert_stats = DataImportService.insert_data_orm(
                process,
                data,
                process.column_structure
            )

            process.record_count += insert_stats['inserted']
            process.save()

            invalidate_process_caches(pk)

            logger.info("[OK] Importacao concluida:")
            logger.info(f"   - Inseridos: {insert_stats['inserted']}")
            logger.info(f"   - Duplicatas ignoradas: {insert_stats['duplicates']}")
            logger.info(f"   - Erros: {insert_stats['errors']}")
            logger.info(f"   - Total processado: {insert_stats['total']}")

            # Retorna processo atualizado com estatísticas
            result_serializer = DataImportProcessSerializer(process)

            # Cria mensagem detalhada
            message_parts = [f"{insert_stats['inserted']} novos registros adicionados"]
            if insert_stats['duplicates'] > 0:
                message_parts.append(f"{insert_stats['duplicates']} duplicatas ignoradas")
            if insert_stats['errors'] > 0:
                message_parts.append(f"{insert_stats['errors']} erros")

            message = " | ".join(message_parts)

            return Response(
                {
                    'success': True,
                    'message': message,
                    'statistics': insert_stats,
                    'process': result_serializer.data
                },
                status=status.HTTP_200_OK
            )

        except DataImportProcess.DoesNotExist:
            return Response(
                {'error': 'Processo não encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            error_id = log_error_safely(e, "Data append failed")

            return Response(
                {
                    'success': False,
                    'error': 'Erro ao adicionar dados. Por favor, tente novamente.',
                    'error_id': error_id
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ToggleStatusView(APIView):
    """
    View para alternar o status de um processo entre ativo e inativo
    POST /api/data-import/processes/<id>/toggle-status/
    """
    permission_classes = [IsAuthenticated, IsDatasetOwner]

    def post(self, request, pk):
        """
        Toggle process status between active and inactive
        Only owner or superuser can toggle
        """
        try:
            process = DataImportProcess.objects.get(pk=pk)

            # Verifica permissão
            self.check_object_permissions(request, process)

            # Alterna status
            if process.status == 'active':
                process.status = 'inactive'
                message = f'Processo {process.table_name} marcado como inativo'
            else:
                process.status = 'active'
                message = f'Processo {process.table_name} marcado como ativo'

            process.save()

            # Invalidate related caches
            invalidate_process_caches(pk)

            # Retorna processo atualizado
            serializer = DataImportProcessSerializer(process)

            return Response(
                {
                    'success': True,
                    'message': message,
                    'process': serializer.data
                },
                status=status.HTTP_200_OK
            )

        except DataImportProcess.DoesNotExist:
            return Response(
                {'error': 'Processo não encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Erro ao alterar status: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DataPreviewView(APIView):
    """
    View para retornar uma prévia dos dados da tabela
    GET /api/data-import/processes/<id>/preview/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        """
        Get preview of table data (first 5 records) using ORM
        """
        try:
            process = DataImportProcess.objects.get(pk=pk)
            from .models import ImportedDataRecord

            # Obtém nomes das colunas
            columns = list(process.column_structure.keys())

            if not columns:
                return Response(
                    {'error': 'Estrutura de colunas não disponível'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Query records using ORM
            records = ImportedDataRecord.objects.filter(process=process)[:5]

            # Convert to list of dictionaries
            data = [record.data for record in records]

            return Response({
                'success': True,
                'columns': columns,
                'data': data,
                'total_records': process.record_count
            })

        except DataImportProcess.DoesNotExist:
            return Response(
                {'error': 'Processo não encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Erro ao buscar prévia: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SearchDataView(APIView):
    """
    View para buscar dados em todas as tabelas ativas
    GET /api/data-import/search/?q=termo
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Search data across all active processes using ORM
        """
        query = request.GET.get('q', '').strip()

        if not query:
            return Response({
                'success': False,
                'error': 'Termo de busca é obrigatório'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Get all active processes
            active_processes = DataImportProcess.objects.filter(status='active')
            from .models import ImportedDataRecord
            from django.db.models import Q
            import json

            results = []

            for process in active_processes:
                columns = list(process.column_structure.keys())

                if not columns:
                    continue

                # Build Q objects for searching in JSON fields
                # Search in any column value (converted to string)
                search_query = Q()
                for col in columns:
                    # Django JSONField lookup: data__column_name__icontains
                    search_query |= Q(**{f'data__{col}__icontains': query})

                try:
                    # Find matching records
                    matching_records = ImportedDataRecord.objects.filter(
                        process=process
                    ).filter(search_query)[:100]

                    if matching_records.exists():
                        table_results = [record.data for record in matching_records]

                        results.append({
                            'process_id': process.id,
                            'table_name': process.table_name,
                            'columns': columns,
                            'data': table_results,
                            'count': len(table_results)
                        })

                except Exception as e:
                    logger.error(f"Erro ao buscar no processo {process.table_name}: {e}")
                    continue

            return Response({
                'success': True,
                'query': query,
                'results': results,
                'total_tables': len(results)
            })

        except Exception as e:
            return Response(
                {'error': f'Erro ao buscar dados: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class Echo:
    """An object that implements just the write method of the file-like interface for streaming."""
    def write(self, value):
        return value


class DownloadDataView(APIView):
    """
    View para baixar dados de uma tabela em CSV com streaming
    GET /api/data-import/processes/<id>/download/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        """
        Download table data as CSV using streaming to avoid memory issues
        """
        try:
            process = DataImportProcess.objects.get(pk=pk)
            from .models import ImportedDataRecord

            columns = list(process.column_structure.keys())

            if not columns:
                return Response(
                    {'error': 'Estrutura de colunas não disponível'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            def iter_csv_rows():
                """Generator function to stream CSV rows"""
                buffer = Echo()
                writer = csv.writer(buffer)

                # Yield header
                yield writer.writerow(columns)

                # Stream records in batches to avoid loading all data in memory
                records = ImportedDataRecord.objects.filter(process=process).iterator(chunk_size=1000)
                for record in records:
                    row = [record.data.get(col, '') for col in columns]
                    yield writer.writerow(row)

            # Create streaming response
            response = StreamingHttpResponse(
                iter_csv_rows(),
                content_type='text/csv'
            )
            response['Content-Disposition'] = f'attachment; filename="{process.table_name}.csv"'

            return response

        except DataImportProcess.DoesNotExist:
            return Response(
                {'error': 'Processo não encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            error_id = log_error_safely(e, "Download failed")
            return Response(
                {
                    'error': 'Erro ao baixar dados. Por favor, tente novamente.',
                    'error_id': error_id
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PublicListDatasetsView(APIView):
    """
    Public view to list all active datasets (no authentication required)
    GET /api/data-import/public-datasets/
    Cached for 10 minutes (public endpoint, less frequent updates)
    """
    permission_classes = [AllowAny]

    def get(self, request):
        """
        List all active datasets
        """
        try:
            # Get all active processes with optimized queries
            active_processes = DataImportProcess.objects.select_related('created_by').filter(
                status='active'
            ).order_by('-created_at')

            # Serialize the data
            serializer = DataImportProcessSerializer(active_processes, many=True)

            return Response({
                'success': True,
                'count': active_processes.count(),
                'results': serializer.data
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': f'Erro ao listar datasets: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(ratelimit(key='ip', rate='100/h', method='GET'), name='get')
class PublicSearchDataView(APIView):
    """
    Public view to search data across all active tables (no authentication required)
    GET /api/data-import/public-search/?q=termo
    Rate limit: 100 searches per hour per IP
    """
    permission_classes = [AllowAny]

    def get(self, request):
        """
        Public search across all active tables using ORM
        """
        query = request.GET.get('q', '').strip()

        if not query:
            return Response({
                'success': False,
                'error': 'Termo de busca é obrigatório'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Get all active processes
            active_processes = DataImportProcess.objects.filter(status='active')
            from .models import ImportedDataRecord
            from django.db.models import Q

            results = []

            for process in active_processes:
                columns = list(process.column_structure.keys())

                if not columns:
                    continue

                # Build Q objects for searching in JSON fields
                search_query = Q()
                for col in columns:
                    search_query |= Q(**{f'data__{col}__icontains': query})

                try:
                    # Find matching records
                    matching_records = ImportedDataRecord.objects.filter(
                        process=process
                    ).filter(search_query)[:100]

                    if matching_records.exists():
                        table_results = [record.data for record in matching_records]

                        results.append({
                            'process_id': process.id,
                            'table_name': process.table_name,
                            'columns': columns,
                            'data': table_results,
                            'count': len(table_results)
                        })

                except Exception as e:
                    logger.error(f"Erro ao buscar no processo {process.table_name}: {e}")
                    continue

            return Response({
                'success': True,
                'query': query,
                'results': results,
                'total_tables': len(results)
            })

        except Exception as e:
            return Response(
                {'error': f'Erro ao buscar dados: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(ratelimit(key='ip', rate='50/h', method='GET'), name='get')
class PublicDownloadDataView(APIView):
    """
    Public view to download table data with streaming support (no authentication required)
    GET /api/data-import/public-download/<id>/?format=csv&columns=col1,col2
    Rate limit: 50 downloads per hour per IP
    """
    permission_classes = [AllowAny]

    def get(self, request, pk):
        """
        Download table data (public access) with memory-efficient streaming
        Supports formats: csv, xlsx
        """
        try:
            logger.info("="*60)
            logger.info(f"[DOWNLOAD] Iniciando download para dataset ID: {pk}")
            logger.info("="*60)

            process = DataImportProcess.objects.get(pk=pk, status='active')
            all_columns = list(process.column_structure.keys())

            logger.info(f"[DOWNLOAD] Dataset: {process.table_name}")
            logger.info(f"[DOWNLOAD] Total de colunas: {len(all_columns)}")

            # Get selected columns from query params
            columns_param = request.GET.get('columns', '')
            logger.info(f"[DOWNLOAD] Parametro columns: {columns_param}")

            if columns_param:
                selected_columns = [col for col in columns_param.split(',') if col in all_columns]
            else:
                selected_columns = all_columns

            logger.info(f"[DOWNLOAD] Colunas selecionadas: {len(selected_columns)}")

            if not selected_columns:
                return Response(
                    {'error': 'Nenhuma coluna válida selecionada'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get format from query params (use file_format to avoid conflict with DRF's format param)
            file_format = request.GET.get('file_format', request.GET.get('format', 'csv')).lower()
            if file_format not in ['csv', 'xlsx']:
                file_format = 'csv'

            logger.info(f"[DOWNLOAD] Formato de arquivo: {file_format}")

            # Get filters from query params
            filters_param = request.GET.get('filters', '')
            active_filters = {}
            logger.info(f"[DOWNLOAD] Parametro filters (raw): {filters_param}")

            if filters_param:
                try:
                    import json
                    active_filters = json.loads(filters_param)
                    logger.info(f"[DOWNLOAD] Filtros parseados com sucesso: {len(active_filters)} filtros")
                    logger.info(f"[DOWNLOAD] Detalhes dos filtros: {active_filters}")
                except (json.JSONDecodeError, ValueError) as e:
                    logger.warning(f"[DOWNLOAD] Erro ao parsear filtros JSON: {filters_param}")
                    logger.warning(f"[DOWNLOAD] Erro: {str(e)}")
            else:
                logger.info("[DOWNLOAD] Nenhum filtro aplicado")

            from .models import ImportedDataRecord

            filtered_count = 0
            total_count = 0

            def apply_filters_to_record(record_data, filters):
                """Apply filters to a single record"""
                nonlocal filtered_count, total_count
                total_count += 1

                if not filters:
                    filtered_count += 1
                    return True

                # Se qualquer filtro rejeitar, retorna False
                for column_name, filter_config in filters.items():
                    if not filter_config:
                        continue

                    cell_value = record_data.get(column_name)
                    filter_type = filter_config.get('type')
                    filter_value = filter_config.get('value')
                    filter_operator = filter_config.get('operator')

                    if filter_type == 'string':
                        cell_str = str(cell_value).lower() if cell_value is not None else ""
                        filter_str = str(filter_value).lower() if filter_value else ""

                        # Se não há valor de filtro, passa
                        if not filter_str:
                            continue

                        if filter_operator == 'contains' and filter_str not in cell_str:
                            return False
                        elif filter_operator == 'equals' and cell_str != filter_str:
                            return False
                        elif filter_operator == 'startsWith' and not cell_str.startswith(filter_str):
                            return False
                        elif filter_operator == 'endsWith' and not cell_str.endswith(filter_str):
                            return False

                    elif filter_type in ['number', 'integer', 'float']:
                        try:
                            cell_num = float(cell_value) if cell_value is not None else 0
                            filter_num = float(filter_value) if filter_value else 0

                            if filter_operator == 'equals' and cell_num != filter_num:
                                return False
                            elif filter_operator == 'greaterThan' and cell_num <= filter_num:
                                return False
                            elif filter_operator == 'lessThan' and cell_num >= filter_num:
                                return False
                            elif filter_operator == 'greaterThanOrEqual' and cell_num < filter_num:
                                return False
                            elif filter_operator == 'lessThanOrEqual' and cell_num > filter_num:
                                return False
                        except (ValueError, TypeError):
                            return False

                    elif filter_type == 'category':
                        selected_values = filter_value if isinstance(filter_value, list) else []
                        if selected_values and str(cell_value).lower() not in [v.lower() for v in selected_values]:
                            return False

                # Se passou por todos os filtros, aceita
                filtered_count += 1
                return True

            if file_format == 'csv':
                def iter_csv_rows():
                    """Generator function to stream CSV rows"""
                    buffer = Echo()
                    writer = csv.writer(buffer, delimiter=';', quoting=csv.QUOTE_MINIMAL)

                    # Yield UTF-8 BOM for Excel compatibility
                    yield '\ufeff'

                    # Yield header
                    yield writer.writerow(selected_columns)

                    # Stream records in batches
                    records = ImportedDataRecord.objects.filter(process=process).iterator(chunk_size=1000)
                    for record in records:
                        # Apply filters
                        if not apply_filters_to_record(record.data, active_filters):
                            continue

                        row = [record.data.get(col, '') for col in selected_columns]
                        yield writer.writerow(row)

                response = StreamingHttpResponse(
                    iter_csv_rows(),
                    content_type='text/csv; charset=utf-8'
                )
                response['Content-Disposition'] = f'attachment; filename="{process.table_name}.csv"'

                logger.info(f"[DOWNLOAD] CSV gerado - Total de registros processados: {total_count}, Filtrados: {filtered_count}")

            else:
                # For Excel, we need to use write-only mode for better memory efficiency
                import openpyxl
                from openpyxl import Workbook

                # Save to bytes
                output = io.BytesIO()

                wb = Workbook(write_only=True)
                ws = wb.create_sheet(process.table_name[:31])

                # Write header
                ws.append(selected_columns)

                # Write data in batches using iterator
                records = ImportedDataRecord.objects.filter(process=process).iterator(chunk_size=1000)
                for record in records:
                    # Apply filters
                    if not apply_filters_to_record(record.data, active_filters):
                        continue

                    row = [record.data.get(col, '') for col in selected_columns]
                    ws.append(row)

                # Save and close workbook properly
                wb.save(output)
                wb.close()
                output.seek(0)

                content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                response = HttpResponse(output.getvalue(), content_type=content_type)
                response['Content-Disposition'] = f'attachment; filename="{process.table_name}.xlsx"'

                logger.info(f"[DOWNLOAD] XLSX gerado - Total de registros processados: {total_count}, Filtrados: {filtered_count}")

            logger.info(f"[DOWNLOAD] Download concluido com sucesso")
            logger.info("="*60)

            return response

        except DataImportProcess.DoesNotExist:
            return Response(
                {'error': 'Dados não encontrados ou não estão públicos'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            error_id = log_error_safely(e, "Download failed")
            return Response(
                {
                    'error': 'Erro ao baixar dados. Por favor, tente novamente.',
                    'error_id': error_id
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PublicDataPreviewView(APIView):
    """
    Public view to get all data from a specific dataset (no authentication required)
    GET /api/data-import/public-data/<id>/
    """
    permission_classes = [AllowAny]

    def get(self, request, pk):
        """
        Get all data from a specific active dataset
        """
        try:
            process = DataImportProcess.objects.get(pk=pk, status='active')

            from django.db import connection

            safe_table_name = DataImportService.sanitize_column_name(process.table_name)
            columns = list(process.column_structure.keys())

            if not columns:
                return Response({
                    'success': False,
                    'error': 'Estrutura de colunas não disponível'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Query all data using ORM
            from .models import ImportedDataRecord
            records = ImportedDataRecord.objects.filter(process=process)

            # Convert to list of dictionaries
            data = [record.data for record in records]

            return Response({
                'success': True,
                'process_id': process.id,
                'table_name': process.table_name,
                'columns': columns,
                'data': data,
                'count': len(data)
            })

        except DataImportProcess.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Dados não encontrados ou não estão públicos'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'success': False,
                'error': f'Erro ao buscar dados: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PublicColumnMetadataView(APIView):
    """
    Public view to get column metadata including types and unique values
    GET /api/data-import/public-metadata/<id>/
    """
    permission_classes = [AllowAny]

    def get(self, request, pk):
        """
        Get column metadata for filtering
        """
        try:
            process = DataImportProcess.objects.get(pk=pk, status='active')

            from django.db import connection

            safe_table_name = DataImportService.sanitize_column_name(process.table_name)
            column_structure = process.column_structure

            if not column_structure:
                return Response({
                    'success': False,
                    'error': 'Estrutura de colunas não disponível'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Build metadata for each column
            from .models import ImportedDataRecord
            columns_metadata = []

            for col_name, col_info in column_structure.items():
                col_type = col_info.get('type', 'string') if isinstance(col_info, dict) else str(col_info)

                # Determine filter type based on column type
                filter_type = 'string'  # Default for TEXT and string types
                if col_type in ['INTEGER', 'int', 'bigint', 'smallint']:
                    filter_type = 'integer'
                elif col_type in ['REAL', 'float', 'double', 'decimal', 'numeric']:
                    filter_type = 'float'
                elif col_type in ['date']:
                    filter_type = 'date'
                elif col_type in ['datetime', 'timestamp']:
                    filter_type = 'datetime'
                elif col_type in ['BOOLEAN', 'bool']:
                    filter_type = 'boolean'
                elif col_type in ['TEXT', 'VARCHAR', 'CHAR', 'text', 'varchar', 'char', 'string', 'str']:
                    filter_type = 'category'  # TEXT columns use category filter (selection)

                # Get unique values for category filters (limit to 100)
                unique_values = []
                try:
                    # Query unique values using Django JSONField
                    records = ImportedDataRecord.objects.filter(process=process)
                    unique_set = set()
                    for record in records:
                        value = record.data.get(col_name)
                        if value is not None:
                            unique_set.add(str(value))
                            if len(unique_set) >= 100:
                                break

                    unique_values = sorted(list(unique_set))[:100]
                except Exception as e:
                    logger.error(f"Error getting unique values for {col_name}: {e}")

                columns_metadata.append({
                    'name': col_name,
                    'type': col_type,
                    'filter_type': filter_type,
                    'unique_values': unique_values if filter_type == 'category' else []
                })

            return Response({
                'success': True,
                'process_id': process.id,
                'table_name': process.table_name,
                'columns': columns_metadata
            })

        except DataImportProcess.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Dados não encontrados ou não estão públicos'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'success': False,
                'error': f'Erro ao buscar metadados: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    tags=['Analytics'],
    summary='Estatísticas do dashboard',
    description='''
    Retorna estatísticas agregadas para o dashboard.

    **Inclui:**
    - Status dos datasets (ativos, inativos, etc.)
    - Total de registros importados
    - Estimativa de armazenamento
    - Dados mensais (últimos 6 meses)
    - Datasets mais recentes
    ''',
    responses={200: OpenApiTypes.OBJECT},
)
class DashboardStatsView(APIView):
    """
    View para retornar estatísticas agregadas para o dashboard
    GET /api/data-import/dashboard-stats/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Get aggregated statistics for dashboard
        """
        try:
            # Get status counts
            status_counts = {
                'active': DataImportProcess.objects.filter(status='active').count(),
                'inactive': DataImportProcess.objects.filter(status='inactive').count(),
                'processing': 0,  # Can be implemented if you add processing status
                'pending': 0,     # Can be implemented if you add pending status
            }

            # Total datasets by status (for pie chart)
            dataset_status = [
                {'name': 'Ativos', 'value': status_counts['active'], 'color': '#10b981'},
                {'name': 'Arquivados', 'value': status_counts['inactive'], 'color': '#6b7280'},
                {'name': 'Em Processamento', 'value': status_counts['processing'], 'color': '#f59e0b'},
                {'name': 'Pendentes', 'value': status_counts['pending'], 'color': '#ef4444'},
            ]

            # Total records
            total_records = DataImportProcess.objects.aggregate(Sum('record_count'))['record_count__sum'] or 0

            # Storage calculation (rough estimate based on record count)
            # Assuming average of 1KB per record
            storage_gb = (total_records * 1024) / (1024 * 1024 * 1024)  # Convert bytes to GB
            storage_tb = storage_gb / 1024

            # Get monthly data (last 6 months)
            from dateutil.relativedelta import relativedelta
            now = datetime.now()
            six_months_ago = now - relativedelta(months=6)

            monthly_data = DataImportProcess.objects.filter(
                created_at__gte=six_months_ago
            ).annotate(
                month=TruncMonth('created_at')
            ).values('month').annotate(
                count=Count('id'),
                total_records=Sum('record_count')
            ).order_by('month')

            # Create a dict for quick lookup
            data_by_month = {}
            for item in monthly_data:
                month_key = item['month'].strftime('%Y-%m')
                volume_gb = ((item['total_records'] or 0) * 1024) / (1024 * 1024 * 1024)  # Assume 1KB per record
                data_by_month[month_key] = {
                    'value': round(volume_gb, 2),
                    'datasets': item['count']
                }

            # Generate last 6 months with data
            monthly_volume = []
            months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
            for i in range(6):
                target_date = now - relativedelta(months=5-i)
                month_key = target_date.strftime('%Y-%m')
                month_name = months[target_date.month - 1]

                if month_key in data_by_month:
                    monthly_volume.append({
                        'month': month_name,
                        'value': data_by_month[month_key]['value'],
                        'datasets': data_by_month[month_key]['datasets']
                    })
                else:
                    monthly_volume.append({
                        'month': month_name,
                        'value': 0,
                        'datasets': 0
                    })

            # Calculate growth rate (comparing last month to previous month)
            growth_rate = 0
            if len(monthly_volume) >= 2:
                last_month = monthly_volume[-1]['value']
                prev_month = monthly_volume[-2]['value']
                if prev_month > 0:
                    growth_rate = ((last_month - prev_month) / prev_month) * 100

            # Calculate average monthly volume
            avg_volume = sum(item['value'] for item in monthly_volume) / len(monthly_volume) if monthly_volume else 0

            return Response({
                'success': True,
                'data': {
                    'metrics': {
                        'total_datasets': status_counts['active'] + status_counts['inactive'] + status_counts['processing'] + status_counts['pending'],
                        'active_datasets': status_counts['active'],
                        'total_records': total_records,
                        'storage_tb': round(storage_tb, 2),
                        'storage_percent': min(int((storage_tb / 24) * 100), 100),  # Assuming 24TB capacity
                        'growth_rate': round(growth_rate, 1)
                    },
                    'dataset_status': dataset_status,
                    'monthly_volume': monthly_volume,
                    'summary': {
                        'avg_monthly_volume': round(avg_volume, 0),
                        'active_percentage': round((status_counts['active'] / max(status_counts['active'] + status_counts['inactive'], 1)) * 100, 0)
                    }
                }
            })

        except Exception as e:
            error_id = log_error_safely(e, "Dashboard stats failed")
            return Response({
                'success': False,
                'error': 'Erro ao buscar estatísticas. Por favor, tente novamente.',
                'error_id': error_id
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ReanalyzeColumnTypesView(APIView):
    """
    View to re-analyze column types for an existing dataset
    POST /api/data-import/reanalyze-types/<id>/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        """
        Re-analyze column types for a dataset
        """
        try:
            process = DataImportProcess.objects.get(pk=pk, created_by=request.user)

            # Get all records for this process
            from .models import ImportedDataRecord
            records = ImportedDataRecord.objects.filter(process=process)

            if not records.exists():
                return Response({
                    'success': False,
                    'error': 'Nenhum registro encontrado para este dataset'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Convert records to list of dicts
            data = [record.data for record in records]

            # Re-analyze column structure with improved type detection
            new_column_structure = DataImportService.analyze_column_structure(data)

            # Update process with new column structure
            process.column_structure = new_column_structure
            process.save()

            return Response({
                'success': True,
                'message': 'Tipos de coluna re-analisados com sucesso',
                'column_structure': new_column_structure
            })

        except DataImportProcess.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Processo não encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            error_id = log_error_safely(e, "Reanalyze column types failed")
            return Response({
                'success': False,
                'error': 'Erro ao re-analisar tipos. Por favor, tente novamente.',
                'error_id': error_id
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TaskStatusView(APIView):
    """
    View para verificar o status de uma task assíncrona
    GET /api/data-import/tasks/<task_id>/status/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, task_id):
        """
        Get status of an async task
        """
        try:
            from .models import AsyncTask

            task = AsyncTask.objects.get(task_id=task_id)

            # Check if user owns this task
            if task.created_by != request.user and not request.user.is_superuser:
                return Response(
                    {'error': 'Você não tem permissão para acessar esta task'},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Prepare response
            response_data = {
                'task_id': task.task_id,
                'task_name': task.task_name,
                'status': task.status,
                'status_display': task.get_status_display(),
                'progress': task.progress,
                'created_at': task.created_at,
                'updated_at': task.updated_at,
            }

            # Add result if completed
            if task.status == 'success':
                response_data['result'] = task.result
                response_data['completed_at'] = task.completed_at

            # Add error if failed
            if task.status == 'failed':
                response_data['error'] = task.error

            # Add process info if available
            if task.process:
                response_data['process'] = {
                    'id': task.process.id,
                    'table_name': task.process.table_name,
                    'record_count': task.process.record_count,
                    'status': task.process.status,
                }

            return Response(response_data)

        except AsyncTask.DoesNotExist:
            return Response(
                {'error': 'Task não encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            error_id = log_error_safely(e, "Task status check failed")
            return Response({
                'error': 'Erro ao verificar status da task',
                'error_id': error_id
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
