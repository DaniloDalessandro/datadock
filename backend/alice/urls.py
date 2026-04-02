"""
Alice App URLs
"""

from django.urls import path

from .views import AliceAgentView, AliceChatView, AliceHealthView

app_name = "alice"

urlpatterns = [
    path("chat/", AliceChatView.as_view(), name="chat"),
    path("agent/", AliceAgentView.as_view(), name="agent"),
    path("health/", AliceHealthView.as_view(), name="health"),
]
