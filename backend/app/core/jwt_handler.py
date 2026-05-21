"""
JWT token generation and validation module.

This module provides secure JWT token creation, validation, and decoding
with proper error handling and expiration management.
"""

from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional

import jwt
from jwt.exceptions import ExpiredSignatureError, DecodeError, InvalidTokenError

from app.core.settings import Settings


class InvalidTokenException(Exception):
    """Raised when a token is invalid or tampered with."""
    pass


class TokenExpiredException(Exception):
    """Raised when a token has expired."""
    pass


def get_settings() -> Settings:
    """Get application settings."""
    return Settings()


def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token.

    Args:
        data: Payload data to encode in the token (must include "sub" for user ID)
        expires_delta: Custom expiration time. If None, uses default from settings

    Returns:
        JWT token as string

    Raises:
        ValueError: If data doesn't contain "sub" field
    """
    if "sub" not in data:
        raise ValueError('Data must include "sub" field (user ID)')

    settings = get_settings()
    to_encode = data.copy()

    if expires_delta is None:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.access_token_expire_minutes
        )
    else:
        expire = datetime.now(timezone.utc) + expires_delta

    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access"
    })

    encoded_jwt = jwt.encode(
        to_encode,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm
    )
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any]) -> str:
    """
    Create a JWT refresh token with longer expiration.

    Args:
        data: Payload data to encode in the token (must include "sub" for user ID)

    Returns:
        JWT token as string

    Raises:
        ValueError: If data doesn't contain "sub" field
    """
    if "sub" not in data:
        raise ValueError('Data must include "sub" field (user ID)')

    settings = get_settings()
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.refresh_token_expire_days
    )

    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "refresh"
    })

    encoded_jwt = jwt.encode(
        to_encode,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm
    )
    return encoded_jwt


def decode_token(token: str) -> Dict[str, Any]:
    """
    Decode and validate a JWT token without raising exceptions.

    This function catches JWT exceptions and returns None on invalid tokens,
    making it suitable for optional token validation scenarios.

    Args:
        token: JWT token string

    Returns:
        Decoded token payload as dict, or None if token is invalid

    Raises:
        InvalidTokenException: If token format is invalid
        TokenExpiredException: If token has expired
    """
    settings = get_settings()

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm]
        )
        return payload
    except ExpiredSignatureError as e:
        raise TokenExpiredException("Token has expired") from e
    except DecodeError as e:
        raise InvalidTokenException("Invalid token format or signature") from e
    except InvalidTokenError as e:
        raise InvalidTokenException(f"Token validation failed: {str(e)}") from e


def decode_refresh_token(token: str) -> Dict[str, Any]:
    """
    Decode and validate a refresh token.

    Args:
        token: Refresh token string

    Returns:
        Decoded refresh token payload as dict

    Raises:
        InvalidTokenException: If token is invalid or not a refresh token
        TokenExpiredException: If token has expired
    """
    payload = decode_token(token)

    if payload.get("type") != "refresh":
        raise InvalidTokenException("Token is not a refresh token")

    return payload


def verify_token(token: str) -> Dict[str, Any]:
    """
    Verify a JWT token and return its payload.

    This is the primary token verification function that should be used in
    authentication dependencies. It validates the token signature, expiration,
    and ensures it's a valid access token.

    Args:
        token: JWT token string

    Returns:
        Decoded token payload as dict

    Raises:
        InvalidTokenException: If token is invalid or tampered with
        TokenExpiredException: If token has expired
    """
    payload = decode_token(token)

    if payload.get("type") != "access":
        raise InvalidTokenException("Token is not an access token")

    return payload
