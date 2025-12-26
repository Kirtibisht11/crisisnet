"""
Role Guard Utility
Checks whether a user has permission to access a resource.
"""

from backend.core.auth import decode_token


def require_role(token: str, allowed_roles: list):
    """
    Validates token and checks if user role is allowed.

    Args:
        token (str): JWT token
        allowed_roles (list): list of allowed roles

    Returns:
        dict: decoded token payload if allowed

    Raises:
        PermissionError if unauthorized
    """

    try:
        payload = decode_token(token)
    except ValueError as e:
        raise PermissionError(str(e))

    role = payload.get("role")
    if role not in allowed_roles:
        raise PermissionError("Access denied for this role")

    return payload
