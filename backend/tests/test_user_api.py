"""
Integration tests for user management API endpoints.

Tests cover:
- User CRUD operations
- User listing with pagination
- User search
- Role assignment
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_users(client: AsyncClient, auth_headers, test_user):
    """Test listing users with pagination."""
    response = await client.get(
        "/api/v1/users",
        headers=auth_headers,
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "page_size" in data
    assert "pages" in data
    assert len(data["items"]) >= 1


@pytest.mark.asyncio
async def test_list_users_unauthorized(client: AsyncClient):
    """Test listing users without authentication."""
    response = await client.get("/api/v1/users")
    
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_user(client: AsyncClient, auth_headers):
    """Test creating a new user."""
    response = await client.post(
        "/api/v1/users",
        headers=auth_headers,
        json={
            "email": "newuser@example.com",
            "first_name": "New",
            "last_name": "User",
            "password": "NewPassword123",
        },
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["first_name"] == "New"
    assert data["last_name"] == "User"
    assert "id" in data


@pytest.mark.asyncio
async def test_create_user_duplicate_email(client: AsyncClient, auth_headers, test_user):
    """Test creating a user with duplicate email."""
    response = await client.post(
        "/api/v1/users",
        headers=auth_headers,
        json={
            "email": "test@example.com",  # Same as test_user
            "first_name": "Duplicate",
            "last_name": "User",
            "password": "NewPassword123",
        },
    )
    
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_create_user_invalid_email(client: AsyncClient, auth_headers):
    """Test creating a user with invalid email."""
    response = await client.post(
        "/api/v1/users",
        headers=auth_headers,
        json={
            "email": "invalid-email",
            "first_name": "Invalid",
            "last_name": "User",
            "password": "NewPassword123",
        },
    )
    
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_user(client: AsyncClient, auth_headers, test_user):
    """Test getting a specific user."""
    response = await client.get(
        f"/api/v1/users/{test_user.id}",
        headers=auth_headers,
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(test_user.id)
    assert data["email"] == test_user.email


@pytest.mark.asyncio
async def test_get_user_not_found(client: AsyncClient, auth_headers):
    """Test getting a non-existent user."""
    response = await client.get(
        "/api/v1/users/00000000-0000-0000-0000-000000000000",
        headers=auth_headers,
    )
    
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_user(client: AsyncClient, auth_headers, test_user):
    """Test updating a user."""
    response = await client.put(
        f"/api/v1/users/{test_user.id}",
        headers=auth_headers,
        json={
            "first_name": "Updated",
            "last_name": "Name",
        },
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "Updated"
    assert data["last_name"] == "Name"


@pytest.mark.asyncio
async def test_update_user_not_found(client: AsyncClient, auth_headers):
    """Test updating a non-existent user."""
    response = await client.put(
        "/api/v1/users/00000000-0000-0000-0000-000000000000",
        headers=auth_headers,
        json={
            "first_name": "Updated",
        },
    )
    
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_user(client: AsyncClient, admin_auth_headers, test_user):
    """Test deleting a user."""
    # Create a user to delete
    create_response = await client.post(
        "/api/v1/users",
        headers=admin_auth_headers,
        json={
            "email": "todelete@example.com",
            "first_name": "To",
            "last_name": "Delete",
            "password": "DeletePassword123",
        },
    )
    user_to_delete = create_response.json()
    
    # Delete the user
    response = await client.delete(
        f"/api/v1/users/{user_to_delete['id']}",
        headers=admin_auth_headers,
    )
    
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_self(client: AsyncClient, auth_headers, test_user):
    """Test that users cannot delete themselves."""
    response = await client.delete(
        f"/api/v1/users/{test_user.id}",
        headers=auth_headers,
    )
    
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_search_users(client: AsyncClient, auth_headers, test_user):
    """Test searching users by name or email."""
    response = await client.get(
        "/api/v1/users?search=test@example.com",
        headers=auth_headers,
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) >= 1
    assert data["items"][0]["email"] == "test@example.com"


@pytest.mark.asyncio
async def test_get_user_roles(client: AsyncClient, auth_headers, test_user):
    """Test getting user roles."""
    response = await client.get(
        f"/api/v1/users/{test_user.id}/roles",
        headers=auth_headers,
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_assign_roles(client: AsyncClient, admin_auth_headers, test_user, test_role):
    """Test assigning roles to a user."""
    response = await client.post(
        f"/api/v1/users/{test_user.id}/roles",
        headers=admin_auth_headers,
        json={
            "role_ids": [str(test_role.id)],
        },
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert any(r["id"] == str(test_role.id) for r in data)


@pytest.mark.asyncio
async def test_remove_role(client: AsyncClient, admin_auth_headers, test_user, test_role):
    """Test removing a role from a user."""
    # First assign the role
    await client.post(
        f"/api/v1/users/{test_user.id}/roles",
        headers=admin_auth_headers,
        json={
            "role_ids": [str(test_role.id)],
        },
    )
    
    # Then remove it
    response = await client.delete(
        f"/api/v1/users/{test_user.id}/roles/{test_role.id}",
        headers=admin_auth_headers,
    )
    
    assert response.status_code == 204
    
    # Verify it's gone
    roles_response = await client.get(
        f"/api/v1/users/{test_user.id}/roles",
        headers=admin_auth_headers,
    )
    roles = roles_response.json()
    assert not any(r["id"] == str(test_role.id) for r in roles)