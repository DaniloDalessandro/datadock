"""
Alice App URLs
"""

from django.urls import path

from .views import AliceChatView, AliceHealthView

app_name = "alice"

urlpatterns = [
    path("chat/", AliceChatView.as_view(), name="chat"),
    path("health/", AliceHealthView.as_view(), name="health"),
]
