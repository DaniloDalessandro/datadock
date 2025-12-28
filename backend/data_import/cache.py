"""
Cache utilities for data_import app
"""

import hashlib
import json
from functools import wraps

from django.core.cache import cache


def make_cache_key(prefix, **kwargs):
    """
    Generate a consistent cache key from prefix and parameters
    """
    # Sort kwargs to ensure consistent key generation
    params = json.dumps(kwargs, sort_keys=True)
    params_hash = hashlib.md5(params.encode()).hexdigest()
    return f"{prefix}:{params_hash}"


def cache_view_result(timeout=300, key_prefix="view"):
    """
    Decorator to cache view results
    Usage:
        @cache_view_result(timeout=600, key_prefix='process_list')
        def get(self, request):
            ...
    """

    def decorator(func):
        @wraps(func)
        def wrapper(self, request, *args, **kwargs):
            # Build cache key from request parameters
            cache_params = {
                "path": request.path,
                "query": dict(request.GET),
                "user_id": request.user.id if request.user.is_authenticated else None,
            }
            cache_key = make_cache_key(key_prefix, **cache_params)

            # Try to get from cache
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result

            # Execute view and cache result
            result = func(self, request, *args, **kwargs)
            cache.set(cache_key, result, timeout)

            return result

        return wrapper

    return decorator


def invalidate_cache_pattern(pattern):
    """
    Invalidate all cache keys matching a pattern
    """
    try:
        # For django-redis backend
        cache.delete_pattern(f"{pattern}*")
    except AttributeError:
        # For local memory cache, clear all
        cache.clear()


def invalidate_process_caches(process_id=None):
    """
    Invalidate caches related to data import processes
    """
    patterns = [
        "view:process_list",
        "view:process_detail",
        "view:process_data",
        "view:analytics",
    ]

    for pattern in patterns:
        invalidate_cache_pattern(pattern)

    # Also invalidate specific process cache if provided
    if process_id:
        cache.delete(f"process:{process_id}")
        cache.delete(f"process_data:{process_id}")
