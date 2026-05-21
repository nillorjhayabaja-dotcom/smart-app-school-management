"""
Integration tests for authentication API endpoints.

Tests cover:
- Login with valid/invalid credentials
- Token refresh
- Logout
- Current user info
- Password change
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, test_user):
    """Test successful login with valid credentials."""
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "TestPassword123",
        },
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert "expires_in" in data


@pytest.mark.asyncio
async def test_login_invalid_email(client: AsyncClient):
    """Test login with non-existent email."""
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "nonexistent@example.com",
            "password": "WrongPassword123",
        },
    )
    
    assert response.status_code == 401
    data = response.json()
    assert "Invalid email or password" in data["message"]


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient, test_user):
    """Test login with wrong password."""
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "WrongPassword123",
        },
    )
    
    assert response.status_code == 401
    data = response.json()
    assert "Invalid email or password" in data["message"]


@pytest.mark.asyncio
async def test_login_invalid_email_format(client: AsyncClient):
    """Test login with invalid email format."""
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "invalid-email",
            "password": "TestPassword123",
        },
    )
    
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient, test_user):
    """Test token refresh with valid refresh token."""
    # First login to get tokens
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "TestPassword123",
        },
    )
    
    refresh_token = login_response.json()["refresh_token"]
    
    # Refresh the token
    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_refresh_token_invalid(client: AsyncClient):
    """Test refresh with invalid token."""
    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": "invalid-token"},
    )
    
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_logout(client: AsyncClient, auth_headers):
    """Test logout with valid token."""
    response = await client.post(
        "/api/v1/auth/logout",
        headers=auth_headers,
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Successfully logged out"


@pytest.mark.asyncio
async def test_logout_unauthorized(client: AsyncClient):
    """Test logout without authentication."""
    response = await client.post("/api/v1/auth/logout")
    
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user(client: AsyncClient, auth_headers, test_user):
    """Test getting current user info."""
    response = await client.get(
        "/api/v1/auth/me",
        headers=auth_headers,
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(test_user.id)
    assert data["email"] == test_user.email
    assert data["first_name"] == test_user.first_name
    assert data["last_name"] == test_user.last_name


@pytest.mark.asyncio
async def test_get_current_user_unauthorized(client: AsyncClient):
    """Test getting current user without authentication."""
    response = await client.get("/api/v1/auth/me")
    
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_change_password(client: AsyncClient, auth_headers, test_user):
    """Test changing password."""
    response = await client.put(
        "/api/v1/auth/password",
        headers=auth_headers,
        json={
            "current_password": "TestPassword123",
            "new_password": "NewPassword456",
        },
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Password changed successfully"
    
    # Verify new password works
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "NewPassword456",
        },
    )
    assert login_response.status_code == 200


@pytest.mark.asyncio
async def test_change_password_wrong_current(client: AsyncClient, auth_headers):
    """Test changing password with wrong current password."""
    response = await client.put(
        "/api/v1/auth/password",
        headers=auth_headers,
        json={
            "current_password": "WrongPassword",
            "new_password": "NewPassword456",
        },
    )
    
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """Test health check endpoint."""
    response = await client.get("/health")
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"