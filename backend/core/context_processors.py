"""
Context processors para adicionar dados globais aos templates
"""

from django.contrib.auth import get_user_model

from data_import.models import DataImportProcess, ImportedDataRecord

User = get_user_model()


def admin_stats(request):
    """
    Adiciona estatísticas ao contexto do admin
    """
    if request.path.startswith("/admin/"):
        return {
            "user_count": User.objects.count(),
            "dataset_count": DataImportProcess.objects.count(),
            "record_count": ImportedDataRecord.objects.count(),
        }
    return {}
