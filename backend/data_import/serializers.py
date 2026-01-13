import os

from rest_framework import serializers

from .models import DataImportProcess


class DataImportRequestSerializer(serializers.Serializer):
    """
    Serializer para requisição de importação de dados
    Suporta tanto URL de endpoint quanto upload de arquivo
    """

    IMPORT_TYPE_CHOICES = [
        ("endpoint", "Endpoint URL"),
        ("file", "Arquivo (Excel/CSV)"),
    ]

    import_type = serializers.ChoiceField(
        choices=IMPORT_TYPE_CHOICES,
        required=True,
        help_text="Tipo de importação: endpoint ou arquivo",
    )
    endpoint_url = serializers.URLField(
        required=False,
        allow_blank=True,
        help_text="URL do endpoint externo para importar dados",
    )
    file = serializers.FileField(
        required=False,
        allow_empty_file=False,
        help_text="Arquivo Excel (.xlsx) ou CSV (.csv) para importar",
    )
    table_name = serializers.CharField(
        required=True, max_length=255, help_text="Nome da tabela a ser criada"
    )

    def validate(self, data):
        """
        Valida que endpoint_url ou file foi fornecido de acordo com import_type
        """
        import_type = data.get("import_type")
        endpoint_url = data.get("endpoint_url")
        file = data.get("file")

        if import_type == "endpoint":
            if not endpoint_url:
                raise serializers.ValidationError(
                    {
                        "endpoint_url": 'URL do endpoint é obrigatória quando o tipo é "endpoint"'
                    }
                )
        elif import_type == "file":
            if not file:
                raise serializers.ValidationError(
                    {"file": 'Arquivo é obrigatório quando o tipo é "file"'}
                )

            self._validate_file_upload(file)

        return data

    def _validate_file_upload(self, file):
        """
        Validação abrangente de upload de arquivo
        """
        MAX_FILE_SIZE = 50 * 1024 * 1024
        if file.size > MAX_FILE_SIZE:
            raise serializers.ValidationError(
                {
                    "file": "Arquivo muito grande. Tamanho máximo: {MAX_FILE_SIZE // (1024*1024)}MB"
                }
            )

        # Previne path traversal
        filename = os.path.basename(file.name)
        if ".." in filename or "/" in filename or "\\" in filename:
            raise serializers.ValidationError({"file": "Nome de arquivo inválido"})

        allowed_extensions = [".xlsx", ".xls", ".csv"]
        file_name_lower = filename.lower()
        if not any(file_name_lower.endswith(ext) for ext in allowed_extensions):
            raise serializers.ValidationError(
                {
                    "file": f'Formato de arquivo não suportado. Use: {", ".join(allowed_extensions)}'
                }
            )

        # Validação de magic bytes do arquivo
        file.seek(0)
        file_header = file.read(8)
        file.seek(0)

        is_valid = False
        if file_name_lower.endswith(".xlsx"):
            is_valid = file_header[:2] == b"PK"
        elif file_name_lower.endswith(".xls"):
            is_valid = file_header[:8] in [
                b"\xd0\xcf\x11\xa0\xa1\xb1\x1a\xe1",
                b"\x09\x08\x10\x00\x00\x06\x05\x00",
            ]
        elif file_name_lower.endswith(".csv"):
            is_valid = True

        if not is_valid and not file_name_lower.endswith(".csv"):
            raise serializers.ValidationError(
                {"file": "Arquivo não corresponde ao formato declarado na extensão"}
            )

        if file_name_lower.endswith(".csv"):
            file.seek(0)
            try:
                import csv

                first_chunk = file.read(8192).decode("utf-8", errors="ignore")
                file.seek(0)

                sniffer = csv.Sniffer()
                try:
                    sniffer.sniff(first_chunk)
                except csv.Error:
                    raise serializers.ValidationError(
                        {"file": "Arquivo CSV inválido ou corrompido"}
                    )
            except Exception as e:
                raise serializers.ValidationError(
                    {"file": "Não foi possível validar o arquivo CSV"}
                )

        file.seek(0)

    def validate_table_name(self, value):
        """
        Valida nome da tabela para prevenir SQL injection e duplicatas
        """
        cleaned = "".join(c for c in value if c.isalnum() or c == "_")
        if not cleaned:
            raise serializers.ValidationError(
                "Nome da tabela deve conter apenas letras, numeros e underscore"
            )
        if cleaned[0].isdigit():
            raise serializers.ValidationError(
                "Nome da tabela nao pode comecar com numero"
            )

        cleaned_lower = cleaned.lower()
        if DataImportProcess.objects.filter(table_name=cleaned_lower).exists():
            raise serializers.ValidationError(
                'Já existe um dataset com o nome "{cleaned_lower}". Por favor, escolha outro nome.'
            )

        return cleaned_lower


class DataImportProcessSerializer(serializers.ModelSerializer):
    """
    Serializer para o model DataImportProcess
    """

    created_by_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = DataImportProcess
        fields = [
            "id",
            "table_name",
            "endpoint_url",
            "status",
            "status_display",
            "record_count",
            "column_structure",
            "error_message",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_created_by_name(self, obj):
        """
        Obtém o nome do usuário que criou esta importação
        """
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.email
        return None
