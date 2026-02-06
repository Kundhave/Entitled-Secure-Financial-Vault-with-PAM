from passlib.hash import argon2
from jose import JWTError, jwt
from datetime import datetime, timedelta
from config import get_settings
from cryptography.fernet import Fernet
import base64
import pyotp

settings = get_settings()

# Initialize Fernet cipher with the encryption key
cipher_suite = Fernet(settings.ENCRYPTION_KEY.encode())


# Password hashing with Argon2
def hash_password(password: str) -> str:
    """Hash password using Argon2 with automatic salting"""
    return argon2.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against Argon2 hash"""
    return argon2.verify(plain_password, hashed_password)


# AES-256 encryption for sensitive data
def encrypt_data(data: str) -> str:
    """Encrypt data using AES-256 (via Fernet)"""
    encrypted_bytes = cipher_suite.encrypt(data.encode())
    return encrypted_bytes.decode()


def decrypt_data(encrypted_data: str) -> str:
    """Decrypt data using AES-256 (via Fernet)"""
    decrypted_bytes = cipher_suite.decrypt(encrypted_data.encode())
    return decrypted_bytes.decode()


# JWT token creation
def create_access_token(data: dict, expires_delta: timedelta = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str):
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


# TOTP (Microsoft Authenticator compatible)
def generate_totp_secret() -> str:
    """Generate a random TOTP secret"""
    return pyotp.random_base32()


def encrypt_totp_secret(secret: str) -> str:
    """Encrypt TOTP secret before storing in database"""
    return encrypt_data(secret)


def decrypt_totp_secret(encrypted_secret: str) -> str:
    """Decrypt TOTP secret from database"""
    return decrypt_data(encrypted_secret)


def generate_totp_uri(secret: str, username: str) -> str:
    """Generate otpauth URI for QR code"""
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=username, issuer_name="ENTITLED Vault")


def verify_totp(secret: str, token: str) -> bool:
    """Verify TOTP token"""
    totp = pyotp.TOTP(secret)
    return totp.verify(token, valid_window=1)  # Allow 1 step window for clock drift
