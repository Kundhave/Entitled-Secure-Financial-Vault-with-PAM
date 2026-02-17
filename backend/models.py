from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base
import uuid
from datetime import datetime
import enum


class RoleEnum(str, enum.Enum):
    EMPLOYEE = "employee"
    ADMIN = "admin"
    AUDITOR = "auditor"


class RequestStatusEnum(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


# NEW: Access type for vault access (read or write)
class AccessTypeEnum(str, enum.Enum):
    READ = "read"
    WRITE = "write"


class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(
    Enum(
        RoleEnum,
        name="roleenum",
        native_enum=True,
        values_callable=lambda enum_cls: [e.value for e in enum_cls],
    ),
    nullable=False,
)

    totp_secret = Column(String, nullable=False)  # Encrypted TOTP secret
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    access_requests_as_employee = relationship("AccessRequest", foreign_keys="AccessRequest.employee_id", back_populates="employee")
    access_requests_as_admin = relationship("AccessRequest", foreign_keys="AccessRequest.admin_id", back_populates="admin")
    privilege_sessions = relationship("PrivilegeSession", back_populates="user")
    audit_logs_as_actor = relationship("AuditLog", foreign_keys="AuditLog.actor_id", back_populates="actor")
    audit_logs_as_target = relationship("AuditLog", foreign_keys="AuditLog.target_user_id", back_populates="target_user")


class VaultItem(Base):
    __tablename__ = "vault_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    records = relationship("VaultRecord", back_populates="vault_item", cascade="all, delete-orphan")
    access_requests = relationship("AccessRequest", back_populates="vault_item")
    privilege_sessions = relationship("PrivilegeSession", back_populates="vault_item")
    audit_logs = relationship("AuditLog", back_populates="vault_item")


class VaultRecord(Base):
    __tablename__ = "vault_records"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vault_item_id = Column(UUID(as_uuid=True), ForeignKey("vault_items.id"), nullable=False)
    encrypted_payload = Column(Text, nullable=False)  # AES-256 encrypted JSON
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    vault_item = relationship("VaultItem", back_populates="records")


class AccessRequest(Base):
    __tablename__ = "access_requests"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    admin_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    vault_item_id = Column(UUID(as_uuid=True), ForeignKey("vault_items.id"), nullable=False)
    reason = Column(Text, nullable=False)
    # NEW: Access type (read or write)
    access_type = Column(
        Enum(
            AccessTypeEnum,
            name="accesstypeenum",
            native_enum=True,
            values_callable=lambda enum_cls: [e.value for e in enum_cls]
        ),
        nullable=False,
        default=AccessTypeEnum.READ  # Default to read for backward compatibility
    )
    status = Column(
        Enum(
            RequestStatusEnum,
            name="requeststatusenum",
            native_enum=True,
            values_callable=lambda enum_cls: [e.value for e in enum_cls]
        ),
        nullable=False,
        default=RequestStatusEnum.PENDING
    )
    created_at = Column(DateTime, default=datetime.utcnow)
    decided_at = Column(DateTime, nullable=True)
    
    # Relationships
    employee = relationship("User", foreign_keys=[employee_id], back_populates="access_requests_as_employee")
    admin = relationship("User", foreign_keys=[admin_id], back_populates="access_requests_as_admin")
    vault_item = relationship("VaultItem", back_populates="access_requests")


class PrivilegeSession(Base):
    __tablename__ = "privilege_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    vault_item_id = Column(UUID(as_uuid=True), ForeignKey("vault_items.id"), nullable=False)
    # NEW: Track what type of access this session grants
    access_type = Column(
        Enum(
            AccessTypeEnum,
            name="accesstypeenum",
            native_enum=True,
            values_callable=lambda enum_cls: [e.value for e in enum_cls]
        ),
        nullable=False,
        default=AccessTypeEnum.READ
    )
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)  # started_at + 3 minutes
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="privilege_sessions")
    vault_item = relationship("VaultItem", back_populates="privilege_sessions")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)
    vault_item_id = Column(UUID(as_uuid=True), ForeignKey("vault_items.id"), nullable=True)
    target_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    log_metadata = Column(Text, nullable=True)  # JSON string
    
    # Relationships
    actor = relationship("User", foreign_keys=[actor_id], back_populates="audit_logs_as_actor")
    target_user = relationship("User", foreign_keys=[target_user_id], back_populates="audit_logs_as_target")
    vault_item = relationship("VaultItem", back_populates="audit_logs")
