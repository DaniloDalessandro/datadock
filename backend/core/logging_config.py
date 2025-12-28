"""
Structured logging configuration for DataPort
"""

import json
import logging
from datetime import datetime


class JSONFormatter(logging.Formatter):
    """
    Custom JSON formatter for structured logging
    """

    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add request ID if available
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id

        # Add user info if available
        if hasattr(record, "user_id"):
            log_data["user_id"] = record.user_id
        if hasattr(record, "username"):
            log_data["username"] = record.username

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Add extra fields
        if hasattr(record, "extra_data"):
            log_data["extra"] = record.extra_data

        # Add performance metrics if available
        if hasattr(record, "duration_ms"):
            log_data["duration_ms"] = record.duration_ms

        return json.dumps(log_data, ensure_ascii=False)


class RequestContextFilter(logging.Filter):
    """
    Filter to add request context to log records
    """

    def filter(self, record):
        # Try to get request from thread local storage
        from threading import current_thread

        thread = current_thread()

        if hasattr(thread, "request"):
            request = thread.request

            # Add request ID
            if hasattr(request, "request_id"):
                record.request_id = request.request_id

            # Add user info
            if hasattr(request, "user") and request.user.is_authenticated:
                record.user_id = request.user.id
                record.username = request.user.username

        return True


# Logging configuration dictionary
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "()": "core.logging_config.JSONFormatter",
        },
        "verbose": {
            "format": "[{asctime}] {levelname} {name} {module}.{funcName}:{lineno} - {message}",
            "style": "{",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
        "simple": {
            "format": "{levelname} {message}",
            "style": "{",
        },
    },
    "filters": {
        "request_context": {
            "()": "core.logging_config.RequestContextFilter",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
            "filters": ["request_context"],
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": "logs/dataport.log",
            "maxBytes": 10485760,  # 10MB
            "backupCount": 5,
            "formatter": "json",
            "filters": ["request_context"],
        },
        "error_file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": "logs/errors.log",
            "maxBytes": 10485760,  # 10MB
            "backupCount": 5,
            "formatter": "json",
            "level": "ERROR",
            "filters": ["request_context"],
        },
    },
    "loggers": {
        "django": {
            "handlers": ["console", "file"],
            "level": "INFO",
            "propagate": False,
        },
        "data_import": {
            "handlers": ["console", "file", "error_file"],
            "level": "INFO",
            "propagate": False,
        },
        "accounts": {
            "handlers": ["console", "file", "error_file"],
            "level": "INFO",
            "propagate": False,
        },
    },
    "root": {
        "handlers": ["console", "file"],
        "level": "INFO",
    },
}
