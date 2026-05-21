"""
Password hashing service using Argon2 for secure storage.
"""

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError


class PasswordHandler:
    """Handles password hashing and verification using Argon2id algorithm."""
    
    _hasher = PasswordHasher()
    
    @classmethod
    def hash_password(cls, password: str) -> str:
        """
        Hash a password using Argon2id algorithm.
        
        Args:
            password: Plain text password to hash
            
        Returns:
            Argon2 hash string with salt embedded
        """
        return cls._hasher.hash(password)
    
    @classmethod
    def verify_password(cls, password: str, hash: str) -> bool:
        """
        Verify a password against an Argon2 hash.
        
        Args:
            password: Plain text password to verify
            hash: Argon2 hash to verify against
            
        Returns:
            True if password matches hash, False otherwise
        """
        try:
            cls._hasher.verify(hash, password)
            return True
        except (VerifyMismatchError, VerificationError):
            return False
