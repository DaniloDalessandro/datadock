"""
Utilitários de health check para monitoramento do sistema
"""

import logging
from datetime import datetime

from django.core.cache import cache
from django.db import connection

logger = logging.getLogger(__name__)


def check_database():
    """
    Verifica se a conexão com o database está saudável
    """
    try:
        connection.ensure_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        return {"status": "healthy", "message": "Database connection OK"}
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "message": f"Database connection failed: {str(e)}",
        }


def check_cache():
    """
    Verifica se o cache (Redis) está saudável
    """
    try:
        test_key = "__health_check__"
        test_value = "ok"
        cache.set(test_key, test_value, timeout=10)
        result = cache.get(test_key)

        if result == test_value:
            cache.delete(test_key)
            return {"status": "healthy", "message": "Cache connection OK"}
        else:
            return {"status": "degraded", "message": "Cache read/write mismatch"}
    except Exception as e:
        logger.error(f"Cache health check failed: {str(e)}")
        return {"status": "unhealthy", "message": f"Cache connection failed: {str(e)}"}


def check_celery():
    """
    Verifica se os workers do Celery estão rodando
    """
    try:
        from celery import current_app

        inspect = current_app.control.inspect(timeout=2.0)
        stats = inspect.stats()

        if stats:
            worker_count = len(stats)
            return {
                "status": "healthy",
                "message": f"{worker_count} Celery worker(s) active",
                "workers": list(stats.keys()),
            }
        else:
            return {
                "status": "degraded",
                "message": "No Celery workers detected (tasks will queue)",
            }
    except Exception as e:
        logger.error(f"Celery health check failed: {str(e)}")
        return {"status": "degraded", "message": f"Celery check failed: {str(e)}"}


def check_disk_space():
    """
    Verifica espaço disponível em disco
    """
    try:
        import shutil

        from django.conf import settings

        total, used, free = shutil.disk_usage(settings.BASE_DIR)

        total_gb = total / (1024**3)
        used_gb = used / (1024**3)
        free_gb = free / (1024**3)
        used_percent = (used / total) * 100

        if used_percent > 90:
            status = "critical"
            message = f"Disk space critical: {used_percent:.1f}% used"
        elif used_percent > 80:
            status = "degraded"
            message = f"Disk space low: {used_percent:.1f}% used"
        else:
            status = "healthy"
            message = f"Disk space OK: {used_percent:.1f}% used"

        return {
            "status": status,
            "message": message,
            "total_gb": round(total_gb, 2),
            "used_gb": round(used_gb, 2),
            "free_gb": round(free_gb, 2),
            "used_percent": round(used_percent, 1),
        }
    except Exception as e:
        logger.error(f"Disk space check failed: {str(e)}")
        return {"status": "unknown", "message": f"Disk check failed: {str(e)}"}


def get_system_health():
    """
    Retorna status de saúde geral do sistema
    """
    checks = {
        "database": check_database(),
        "cache": check_cache(),
        "celery": check_celery(),
        "disk": check_disk_space(),
    }

    # Determina status geral baseado nos componentes
    statuses = [check["status"] for check in checks.values()]

    if "critical" in statuses or "unhealthy" in statuses:
        overall_status = "unhealthy"
    elif "degraded" in statuses:
        overall_status = "degraded"
    else:
        overall_status = "healthy"

    return {
        "status": overall_status,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "checks": checks,
    }
