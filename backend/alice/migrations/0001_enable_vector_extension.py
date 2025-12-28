"""
Habilita a extensão pgvector para suporte a vetores
"""

from django.contrib.postgres.operations import CreateExtension
from django.db import migrations


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        CreateExtension("vector"),
    ]
