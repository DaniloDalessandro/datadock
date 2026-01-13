"""
Utilitários de cache para o módulo data_import
"""

import hashlib
import json
from functools import wraps

from django.core.cache import cache


def make_cache_key(prefix, **kwargs):
    """
    Gera uma chave de cache consistente a partir de prefixo e parâmetros
    """
    params = json.dumps(kwargs, sort_keys=True)
    params_hash = hashlib.md5(params.encode()).hexdigest()
    return f"{prefix}:{params_hash}"


def cache_view_result(timeout=300, key_prefix="view"):
    """
    Decorator para fazer cache de resultados de views

    Uso:
        @cache_view_result(timeout=600, key_prefix='process_list')
        def get(self, request):
            ...
    """

    def decorator(func):
        @wraps(func)
        def wrapper(self, request, *args, **kwargs):
            cache_params = {
                "path": request.path,
                "query": dict(request.GET),
                "user_id": request.user.id if request.user.is_authenticated else None,
            }
            cache_key = make_cache_key(key_prefix, **cache_params)

            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result

            result = func(self, request, *args, **kwargs)
            cache.set(cache_key, result, timeout)

            return result

        return wrapper

    return decorator


def invalidate_cache_pattern(pattern):
    """
    Invalida todas as chaves de cache que correspondem a um padrão
    """
    try:
        cache.delete_pattern(f"{pattern}*")
    except AttributeError:
        # Fallback: para cache em memória local, limpa tudo
        cache.clear()


def invalidate_process_caches(process_id=None):
    """
    Invalida caches relacionados aos processos de importação de dados
    """
    patterns = [
        "view:process_list",
        "view:process_detail",
        "view:process_data",
        "view:analytics",
    ]

    for pattern in patterns:
        invalidate_cache_pattern(pattern)

    if process_id:
        cache.delete(f"process:{process_id}")
        cache.delete(f"process_data:{process_id}")
