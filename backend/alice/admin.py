from django.contrib import admin
from .models import DatasetEmbedding, ConversationSession, ConversationMessage


@admin.register(DatasetEmbedding)
class DatasetEmbeddingAdmin(admin.ModelAdmin):
    list_display = ["dataset", "created_at", "updated_at"]
    readonly_fields = ["embedding", "created_at", "updated_at"]


class ConversationMessageInline(admin.TabularInline):
    model = ConversationMessage
    extra = 0
    readonly_fields = ["role", "content", "steps", "created_at"]
    can_delete = False


@admin.register(ConversationSession)
class ConversationSessionAdmin(admin.ModelAdmin):
    list_display = ["session_id", "user", "created_at", "updated_at"]
    readonly_fields = ["session_id", "created_at", "updated_at"]
    inlines = [ConversationMessageInline]


@admin.register(ConversationMessage)
class ConversationMessageAdmin(admin.ModelAdmin):
    list_display = ["session", "role", "created_at"]
    list_filter = ["role"]
    readonly_fields = ["created_at"]
