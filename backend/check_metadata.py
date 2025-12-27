#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from data_import.models import DataImportProcess, ImportedDataRecord

# Get process
process = DataImportProcess.objects.get(table_name='danilo154154')
records = ImportedDataRecord.objects.filter(process=process)

# Get unique disciplinas
disciplinas = set()
for record in records:
    disc = record.data.get('disciplina')
    if disc:
        disciplinas.add(disc)

print("Valores únicos de disciplina no banco:")
for d in sorted(disciplinas):
    print(f"  '{d}' - bytes: {d.encode('utf-8')}")
    print(f"  repr: {repr(d)}")
    print()
