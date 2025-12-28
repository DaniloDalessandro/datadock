import os

from rest_framework import serializers

from .models import DataImportProcess


class DataImportRequestSerializer(serializers.Serializer):
    """
    Serializer for data import request
    Supports both endpoint URL and file upload
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
        Validate that either endpoint_url or file is provided based on import_type
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

            # Robust file validation
            self._validate_file_upload(file)

        return data

    def _validate_file_upload(self, file):
        """
        Comprehensive file upload validation
        """
        # 1. File size validation (max 50MB)
        MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB
        if file.size > MAX_FILE_SIZE:
            raise serializers.ValidationError(
                {
                    "file": "Arquivo muito grande. Tamanho máximo: {MAX_FILE_SIZE // (1024*1024)}MB"
                }
            )

        # 2. Filename sanitization - prevent path traversal
        filename = os.path.basename(file.name)
        if ".." in filename or "/" in filename or "\\" in filename:
            raise serializers.ValidationError({"file": "Nome de arquivo inválido"})

        # 3. Extension validation
        allowed_extensions = [".xlsx", ".xls", ".csv"]
        file_name_lower = filename.lower()
        if not any(file_name_lower.endswith(ext) for ext in allowed_extensions):
            raise serializers.ValidationError(
                {
                    "file": f'Formato de arquivo não suportado. Use: {", ".join(allowed_extensions)}'
                }
            )

        # 4. Basic file header validation (magic bytes)
        file.seek(0)
        file_header = file.read(8)
        file.seek(0)

        # Check for common file signatures
        is_valid = False
        if file_name_lower.endswith(".xlsx"):
            # XLSX files start with PK (ZIP signature)
            is_valid = file_header[:2] == b"PK"
        elif file_name_lower.endswith(".xls"):
            # XLS files start with specific signature
            is_valid = file_header[:8] in [
                b"\xd0\xcf\x11\xa0\xa1\xb1\x1a\xe1",
                b"\x09\x08\x10\x00\x00\x06\x05\x00",
            ]
        elif file_name_lower.endswith(".csv"):
            # CSV is plain text, just check if readable
            is_valid = True

        if not is_valid and not file_name_lower.endswith(".csv"):
            raise serializers.ValidationError(
                {"file": "Arquivo não corresponde ao formato declarado na extensão"}
            )

        # 5. Additional content validation for CSV
        if file_name_lower.endswith(".csv"):
            file.seek(0)
            try:
                # Try to read first line as CSV to validate format
                import csv

                first_chunk = file.read(8192).decode("utf-8", errors="ignore")
                file.seek(0)

                # Check if it looks like CSV
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

        # 6. Reset file pointer after all validations
        file.seek(0)

    def validate_table_name(self, value):
        """
        Validate table name to prevent SQL injection and duplicates
        """
        # Remove caracteres especiais e espacos
        cleaned = "".join(c for c in value if c.isalnum() or c == "_")
        if not cleaned:
            raise serializers.ValidationError(
                "Nome da tabela deve conter apenas letras, numeros e underscore"
            )
        # Nao pode comecar com numero
        if cleaned[0].isdigit():
            raise serializers.ValidationError(
                "Nome da tabela nao pode comecar com numero"
            )

        # Verificar se ja existe um dataset com esse nome
        cleaned_lower = cleaned.lower()
        if DataImportProcess.objects.filter(table_name=cleaned_lower).exists():
            raise serializers.ValidationError(
                'Já existe um dataset com o nome "{cleaned_lower}". Por favor, escolha outro nome.'
            )

        return cleaned_lower


class DataImportProcessSerializer(serializers.ModelSerializer):
    """
    Serializer for DataImportProcess model
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
        Get the name of the user who created this import
        """
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.email
        return None
