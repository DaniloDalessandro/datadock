"""
Script para re-importar datasets que falharam devido ao erro de serialização Timestamp
"""
import django
import os
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from data_import.models import DataImportProcess, ImportedDataRecord
from data_import.services import DataImportService
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fix_dataset(process_id):
    """Re-importa um dataset específico"""
    try:
        process = DataImportProcess.objects.get(id=process_id)
        logger.info(f"="*60)
        logger.info(f"Processando dataset: {process.table_name} (ID: {process_id})")
        logger.info(f"Endpoint: {process.endpoint_url}")
        logger.info(f"Record count atual: {process.record_count}")
        logger.info(f"="*60)

        # Verifica se é um arquivo
        if not process.endpoint_url.startswith('file:'):
            logger.error("Este dataset não foi importado de arquivo")
            return False

        # Extrai nome do arquivo
        file_name = process.endpoint_url.replace('file:', '')
        file_path = os.path.join(os.path.dirname(__file__), 'media', 'uploads', file_name)

        # Verifica se arquivo existe
        if not os.path.exists(file_path):
            # Tenta sem a pasta uploads
            file_path = os.path.join(os.path.dirname(__file__), 'media', file_name)
            if not os.path.exists(file_path):
                # Tenta no diretório raiz
                file_path = os.path.join(os.path.dirname(__file__), file_name)
                if not os.path.exists(file_path):
                    logger.error(f"Arquivo não encontrado: {file_name}")
                    logger.info(f"Procurado em:")
                    logger.info(f"  - {os.path.join(os.path.dirname(__file__), 'media', 'uploads', file_name)}")
                    logger.info(f"  - {os.path.join(os.path.dirname(__file__), 'media', file_name)}")
                    logger.info(f"  - {os.path.join(os.path.dirname(__file__), file_name)}")
                    return False

        logger.info(f"Arquivo encontrado: {file_path}")

        # Remove registros antigos (se houver)
        old_count = ImportedDataRecord.objects.filter(process=process).count()
        if old_count > 0:
            logger.info(f"Removendo {old_count} registros antigos...")
            ImportedDataRecord.objects.filter(process=process).delete()

        # Re-importa dados com a correção
        logger.info("Re-importando dados com correção de serialização...")
        data, column_structure = DataImportService.process_file_data_from_path(file_path)

        logger.info(f"Dados lidos: {len(data)} registros")
        logger.info(f"Estrutura de colunas: {list(column_structure.keys())}")

        # Insere dados
        insert_stats = DataImportService.insert_data_orm(process, data, column_structure)

        # Atualiza processo
        process.record_count = insert_stats['inserted']
        process.column_structure = column_structure
        process.save()

        logger.info(f"✓ Dataset corrigido com sucesso!")
        logger.info(f"  - Inseridos: {insert_stats['inserted']}")
        logger.info(f"  - Duplicatas: {insert_stats['duplicates']}")
        logger.info(f"  - Erros: {insert_stats['errors']}")
        logger.info(f"  - Total processado: {insert_stats['total']}")

        return True

    except Exception as e:
        logger.error(f"Erro ao processar dataset {process_id}: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

if __name__ == "__main__":
    # IDs dos datasets problemáticos
    problem_datasets = [29, 30, 31, 32]

    logger.info("="*60)
    logger.info("CORREÇÃO DE DATASETS COM ERRO DE SERIALIZAÇÃO")
    logger.info("="*60)

    success_count = 0
    for dataset_id in problem_datasets:
        if fix_dataset(dataset_id):
            success_count += 1
        logger.info("")

    logger.info("="*60)
    logger.info(f"RESUMO: {success_count}/{len(problem_datasets)} datasets corrigidos")
    logger.info("="*60)
