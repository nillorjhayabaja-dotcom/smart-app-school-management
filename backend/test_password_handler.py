"""Quick test for password handler implementation."""

from app.core import PasswordHandler


def test_password_handler():
    """Test password hashing and verification."""
    password = "test_password_123"
    wrong_password = "wrong_password"
    
    # Test hash generation
    hash1 = PasswordHandler.hash_password(password)
    hash2 = PasswordHandler.hash_password(password)
    
    print(f"Hash 1: {hash1}")
    print(f"Hash 2: {hash2}")
    print(f"Hashes are different (salt is different): {hash1 != hash2}")
    
    # Test correct password verification
    assert PasswordHandler.verify_password(password, hash1), "Correct password should verify"
    print("✓ Correct password verification passed")
    
    # Test wrong password verification
    assert not PasswordHandler.verify_password(wrong_password, hash1), "Wrong password should not verify"
    print("✓ Wrong password verification passed")
    
    # Test with hash2
    assert PasswordHandler.verify_password(password, hash2), "Same password should verify with different hash"
    print("✓ Same password with different hash passed")
    
    print("\n✅ All password handler tests passed!")


if __name__ == "__main__":
    test_password_handler()
