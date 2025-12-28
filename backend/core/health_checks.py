"""
Health check utilities for monitoring system status
"""

import logging
from datetime import datetime

from django.core.cache import cache
from django.db import connection

logger = logging.getLogger(__name__)


def check_database():
    """
    Check if database connection is healthy
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
    Check if cache (Redis) is healthy
    """
    try:
        # Try to set and get a test key
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
    Check if Celery workers are running
    """
    try:
        from celery import current_app

        # Inspect active workers
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
    Check available disk space
    """
    try:
        import shutil

        from django.conf import settings

        total, used, free = shutil.disk_usage(settings.BASE_DIR)

        # Convert to GB
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
    Get overall system health status
    """
    checks = {
        "database": check_database(),
        "cache": check_cache(),
        "celery": check_celery(),
        "disk": check_disk_space(),
    }

    # Determine overall status
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
