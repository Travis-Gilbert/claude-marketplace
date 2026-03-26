from django.contrib import admin
from django.http import JsonResponse
from django.urls import path

from api.router import api
from api.mcp import mcp_sse, mcp_messages


def health(request):
    """Lightweight health endpoint. No DB query, instant response."""
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("health/", health, name="health"),
    path("admin/", admin.site.urls),
    path("api/", api.urls),
    path("mcp/", mcp_sse, name="mcp-sse"),
    path("mcp/messages/", mcp_messages, name="mcp-messages"),
]
