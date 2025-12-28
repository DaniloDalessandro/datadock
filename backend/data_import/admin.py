from django.contrib import admin

from .models import DataImportProcess


@admin.register(DataImportProcess)
class DataImportProcessAdmin(admin.ModelAdmin):
    list_display = (
        "table_name",
        "endpoint_url",
        "status",
        "record_count",
        "created_at",
    )
    list_filter = ("status", "created_at")
    search_fields = ("table_name", "endpoint_url")
    readonly_fields = ("created_at", "updated_at")
    ordering = ("-created_at",)
