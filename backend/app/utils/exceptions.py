class NotFoundError(Exception):
    """Raised when a requested entity does not exist."""


class ValidationFailedError(Exception):
    """Raised when input data fails domain-level validation (not schema-level)."""
