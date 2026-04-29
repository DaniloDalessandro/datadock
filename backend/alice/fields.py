import json

from django.db import models


class AdaptiveVectorField(models.Field):
    """vector(N) no PostgreSQL, text no SQLite."""

    def __init__(self, dimensions=None, **kwargs):
        self.dimensions = dimensions
        super().__init__(**kwargs)

    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()
        if self.dimensions is not None:
            kwargs["dimensions"] = self.dimensions
        return name, path, args, kwargs

    def db_type(self, connection):
        if connection.vendor == "postgresql":
            return f"vector({self.dimensions})"
        return "text"

    def from_db_value(self, value, expression, connection):
        if value is None or connection.vendor == "postgresql":
            return value
        if isinstance(value, str):
            return json.loads(value)
        return value

    def to_python(self, value):
        if value is None or isinstance(value, list):
            return value
        if isinstance(value, str):
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                pass
        return value

    def get_prep_value(self, value):
        if value is None:
            return None
        if isinstance(value, (list, tuple)):
            return json.dumps(list(value))
        return value
