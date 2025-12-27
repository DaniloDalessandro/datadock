#!/usr/bin/env python
"""
Script para corrigir problemas de encoding nos dados importados
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from data_import.models import DataImportProcess, ImportedDataRecord

def fix_soft_hyphens():
    """Remove soft hyphens (\xad) dos dados"""
    print("Procurando registros com soft hyphens...")

    # Busca o processo danilo154154
    try:
        process = DataImportProcess.objects.get(table_name='danilo154154')
        print(f"Processo encontrado: {process.table_name} (ID: {process.id})")

        records = ImportedDataRecord.objects.filter(process=process)
        total = records.count()
        print(f"Total de registros: {total}")

        fixed_count = 0
        for record in records:
            changed = False
            for key, value in record.data.items():
                if isinstance(value, str) and '\xad' in value:
                    # Remove soft hyphens
                    new_value = value.replace('\xad', '')
                    record.data[key] = new_value
                    changed = True
                    print(f"  Corrigido: '{value}' -> '{new_value}'")

            if changed:
                record.save()
                fixed_count += 1

        print(f"\nTotal de registros corrigidos: {fixed_count}")

    except DataImportProcess.DoesNotExist:
        print("Processo 'danilo154154' não encontrado!")

if __name__ == '__main__':
    fix_soft_hyphens()
