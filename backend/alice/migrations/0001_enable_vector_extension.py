from django.db import migrations


def enable_vector(apps, schema_editor):
    if schema_editor.connection.vendor == "postgresql":
        schema_editor.execute("CREATE EXTENSION IF NOT EXISTS vector;")


def disable_vector(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.RunPython(enable_vector, disable_vector),
    ]
