from django.urls import path

from .views import (
    AppendDataView,
    DashboardStatsView,
    DataPreviewView,
    DeleteProcessView,
    DownloadDataView,
    ImportDataView,
    ListProcessesView,
    ProcessDetailView,
    PublicColumnMetadataView,
    PublicDataPreviewView,
    PublicDownloadDataView,
    PublicListDatasetsView,
    PublicSearchDataView,
    ReanalyzeColumnTypesView,
    SearchDataView,
    TaskStatusView,
    ToggleStatusView,
)

app_name = "data_import"

urlpatterns = [
    path("", ImportDataView.as_view(), name="import-data"),
    path("processes/", ListProcessesView.as_view(), name="list-processes"),
    path("processes/<int:pk>/", ProcessDetailView.as_view(), name="process-detail"),
    path(
        "processes/<int:pk>/delete/", DeleteProcessView.as_view(), name="delete-process"
    ),
    path("processes/<int:pk>/append/", AppendDataView.as_view(), name="append-data"),
    path(
        "processes/<int:pk>/toggle-status/",
        ToggleStatusView.as_view(),
        name="toggle-status",
    ),
    path("processes/<int:pk>/preview/", DataPreviewView.as_view(), name="data-preview"),
    path("search/", SearchDataView.as_view(), name="search-data"),
    path(
        "processes/<int:pk>/download/", DownloadDataView.as_view(), name="download-data"
    ),
    path("dashboard-stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
    path(
        "processes/<int:pk>/reanalyze-types/",
        ReanalyzeColumnTypesView.as_view(),
        name="reanalyze-types",
    ),
    # Async task status
    path("tasks/<str:task_id>/status/", TaskStatusView.as_view(), name="task-status"),
    # Public endpoints (no authentication required)
    path(
        "public-datasets/",
        PublicListDatasetsView.as_view(),
        name="public-list-datasets",
    ),
    path("public-search/", PublicSearchDataView.as_view(), name="public-search-data"),
    path(
        "public-download/<int:pk>/",
        PublicDownloadDataView.as_view(),
        name="public-download-data",
    ),
    path(
        "public-data/<int:pk>/",
        PublicDataPreviewView.as_view(),
        name="public-data-preview",
    ),
    path(
        "public-metadata/<int:pk>/",
        PublicColumnMetadataView.as_view(),
        name="public-column-metadata",
    ),
]
