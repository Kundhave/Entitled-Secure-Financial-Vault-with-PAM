from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from models import RoleEnum, RequestStatusEnum


# Auth schemas
class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    username: str
    role: RoleEnum


class MFAVerifyRequest(BaseModel):
    totp_token: str


# User schemas
class UserBase(BaseModel):
    username: str
    role: RoleEnum


class UserResponse(BaseModel):
    id: UUID
    username: str
    role: RoleEnum
    created_at: datetime
    
    class Config:
        from_attributes = True


# Vault Item schemas
class VaultItemResponse(BaseModel):
    id: UUID
    title: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# Vault Record schemas (decrypted)
class VaultRecordDecrypted(BaseModel):
    id: UUID
    investment_name: str
    invested_amount: float
    investment_date: str
    instrument_type: str
    remarks: str


class VaultItemWithRecords(BaseModel):
    vault_item: VaultItemResponse
    records: List[VaultRecordDecrypted]


# Access Request schemas
class AccessRequestCreate(BaseModel):
    vault_item_id: UUID
    admin_id: UUID
    reason: str


class AccessRequestResponse(BaseModel):
    id: UUID
    employee_id: UUID
    employee_username: str
    admin_id: UUID
    admin_username: str
    vault_item_id: UUID
    vault_item_title: str
    reason: str
    status: RequestStatusEnum
    created_at: datetime
    decided_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class AccessRequestDecision(BaseModel):
    request_id: UUID
    decision: str  # "approve" or "reject"


# Privilege Session schemas
class PrivilegeSessionCreate(BaseModel):
    vault_item_id: UUID
    totp_token: str


class PrivilegeSessionResponse(BaseModel):
    id: UUID
    user_id: UUID
    vault_item_id: UUID
    started_at: datetime
    expires_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True


# Audit Log schemas
class AuditLogResponse(BaseModel):
    id: UUID
    actor_id: UUID
    actor_username: str
    action: str
    vault_item_id: Optional[UUID]
    vault_item_title: Optional[str]
    target_user_id: Optional[UUID]
    target_username: Optional[str]
    timestamp: datetime
    metadata: Optional[str]
    
    class Config:
        from_attributes = True


# MFA schemas
class QRCodeResponse(BaseModel):
    qr_code_base64: str
    secret: str  # For manual entry in authenticator
