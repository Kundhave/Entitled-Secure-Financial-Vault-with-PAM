from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db
from models import User, VaultItem, VaultRecord, AccessRequest, PrivilegeSession, AuditLog, RoleEnum, RequestStatusEnum
from schemas import *
from security import (
    hash_password, verify_password, create_access_token,
    decrypt_data, decrypt_totp_secret, verify_totp, generate_totp_uri
)
from dependencies import get_current_user, require_employee, require_admin, require_auditor
from audit import create_audit_log
from datetime import datetime, timedelta
from config import get_settings
import json
import qrcode
import io
import base64
from typing import List

app = FastAPI(title="ENTITLED - Secure Financial Vault")

settings = get_settings()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)



@app.get("/")
def root():
    return {"message": "ENTITLED API - Secure Financial Vault with PAM"}


# ==================== AUTH ENDPOINTS ====================

@app.post("/api/auth/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user and return JWT token"""
    user = db.query(User).filter(User.username == request.username).first()
    
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    # Create JWT token
    access_token = create_access_token(
        data={"user_id": str(user.id), "role": user.role.value}
    )
    
    # Audit log
    create_audit_log(db, user, "LOGIN")
    db.commit()

    
    return TokenResponse(
    access_token=access_token,
    user_id=str(user.id),
    username=user.username,
    role=user.role.value
)



@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return current_user


@app.get("/api/auth/qr-code", response_model=QRCodeResponse)
def get_qr_code(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get QR code for MFA setup (Microsoft Authenticator compatible)"""
    # Decrypt TOTP secret
    totp_secret = decrypt_totp_secret(current_user.totp_secret)
    
    # Generate provisioning URI
    uri = generate_totp_uri(totp_secret, current_user.username)
    
    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return QRCodeResponse(
        qr_code_base64=img_str,
        secret=totp_secret
    )


# ==================== VAULT ENDPOINTS ====================

@app.get("/api/vault/items", response_model=List[VaultItemResponse])
def list_vault_items(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all vault items (titles only for employees/admins)"""
    if current_user.role == RoleEnum.AUDITOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Auditors cannot access vault items"
        )
    
    vault_items = db.query(VaultItem).all()
    return vault_items


@app.post("/api/vault/access", response_model=VaultItemWithRecords)
def access_vault_item(
    request: PrivilegeSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Access vault item data with MFA verification.
    For employees: requires approved access request.
    For admins: direct access with MFA.
    """
    if current_user.role == RoleEnum.AUDITOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Auditors cannot access vault data"
        )
    
    # Verify TOTP
    totp_secret = decrypt_totp_secret(current_user.totp_secret)
    if not verify_totp(totp_secret, request.totp_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid MFA token"
        )
    
    # Check if vault item exists
    vault_item = db.query(VaultItem).filter(VaultItem.id == request.vault_item_id).first()
    if not vault_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vault item not found"
        )
    
    # For employees: check approved access request
    if current_user.role == RoleEnum.EMPLOYEE:
        approved_request = db.query(AccessRequest).filter(
            AccessRequest.employee_id == current_user.id,
            AccessRequest.vault_item_id == request.vault_item_id,
            AccessRequest.status == RequestStatusEnum.APPROVED
        ).first()
        
        if not approved_request:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No approved access request for this vault item"
            )
    
    # Create privilege session
    now = datetime.utcnow()
    expires_at = now + timedelta(minutes=settings.PRIVILEGE_SESSION_DURATION_MINUTES)
    
    privilege_session = PrivilegeSession(
        user_id=current_user.id,
        vault_item_id=request.vault_item_id,
        started_at=now,
        expires_at=expires_at,
        is_active=True
    )
    db.add(privilege_session)
    
    # Audit log
    create_audit_log(
        db,
        current_user,
        "VAULT_ACCESS_GRANTED",
        vault_item_id=request.vault_item_id,
        metadata={"session_id": str(privilege_session.id)}
    )
    
    db.commit()
    
    # Retrieve and decrypt vault records
    records = db.query(VaultRecord).filter(VaultRecord.vault_item_id == request.vault_item_id).all()
    
    decrypted_records = []
    for record in records:
        decrypted_json = decrypt_data(record.encrypted_payload)
        data = json.loads(decrypted_json)
        decrypted_records.append(VaultRecordDecrypted(
            id=record.id,
            **data
        ))
    
    return VaultItemWithRecords(
        vault_item=vault_item,
        records=decrypted_records
    )


@app.get("/api/vault/check-session/{vault_item_id}")
def check_privilege_session(
    vault_item_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if user has an active privilege session for a vault item"""
    now = datetime.utcnow()
    
    active_session = db.query(PrivilegeSession).filter(
        PrivilegeSession.user_id == current_user.id,
        PrivilegeSession.vault_item_id == vault_item_id,
        PrivilegeSession.is_active == True,
        PrivilegeSession.expires_at > now
    ).first()
    
    if active_session:
        return {
            "has_active_session": True,
            "expires_at": active_session.expires_at.isoformat(),
            "session_id": str(active_session.id)
        }
    else:
        # Deactivate expired sessions
        db.query(PrivilegeSession).filter(
            PrivilegeSession.user_id == current_user.id,
            PrivilegeSession.vault_item_id == vault_item_id,
            PrivilegeSession.is_active == True,
            PrivilegeSession.expires_at <= now
        ).update({"is_active": False})
        db.commit()
        
        return {
            "has_active_session": False
        }


# ==================== ACCESS REQUEST ENDPOINTS ====================

@app.post("/api/requests/create")
def create_access_request(
    request: AccessRequestCreate,
    current_user: User = Depends(require_employee),
    db: Session = Depends(get_db)
):
    """Employee creates access request for a vault item"""
    # Verify vault item exists
    vault_item = db.query(VaultItem).filter(VaultItem.id == request.vault_item_id).first()
    if not vault_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vault item not found"
        )
    
    # Verify admin exists and is an admin
    admin = db.query(User).filter(User.id == request.admin_id).first()
    if not admin or admin.role != RoleEnum.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid admin selected"
        )
    
    # Create request
    access_request = AccessRequest(
        employee_id=current_user.id,
        admin_id=request.admin_id,
        vault_item_id=request.vault_item_id,
        reason=request.reason,
        status=RequestStatusEnum.PENDING # Explicitly set status
    )
    db.add(access_request)
    
    # Audit log
    create_audit_log(
        db,
        current_user,
        "ACCESS_REQUEST_CREATED",
        vault_item_id=request.vault_item_id,
        target_user_id=request.admin_id,
        metadata={"request_id": str(access_request.id), "reason": request.reason}
    )
    
    db.commit()
    
    return {"message": "Access request created", "request_id": str(access_request.id)}


@app.get("/api/requests/my-requests", response_model=List[AccessRequestResponse])
def get_my_requests(
    current_user: User = Depends(require_employee),
    db: Session = Depends(get_db)
):
    """Get all access requests created by the current employee"""
    requests = db.query(AccessRequest).filter(
        AccessRequest.employee_id == current_user.id
    ).all()
    
    result = []
    for req in requests:
        result.append(AccessRequestResponse(
            id=req.id,
            employee_id=req.employee_id,
            employee_username=req.employee.username,
            admin_id=req.admin_id,
            admin_username=req.admin.username,
            vault_item_id=req.vault_item_id,
            vault_item_title=req.vault_item.title,
            reason=req.reason,
            status=req.status,
            created_at=req.created_at,
            decided_at=req.decided_at
        ))
    
    return result


@app.get("/api/requests/pending", response_model=List[AccessRequestResponse])
def get_pending_requests(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get all pending access requests assigned to the current admin"""
    requests = db.query(AccessRequest).filter(
        AccessRequest.admin_id == current_user.id,
        AccessRequest.status == RequestStatusEnum.PENDING
    ).all()
    
    result = []
    for req in requests:
        result.append(AccessRequestResponse(
            id=req.id,
            employee_id=req.employee_id,
            employee_username=req.employee.username,
            admin_id=req.admin_id,
            admin_username=req.admin.username,
            vault_item_id=req.vault_item_id,
            vault_item_title=req.vault_item.title,
            reason=req.reason,
            status=req.status,
            created_at=req.created_at,
            decided_at=req.decided_at
        ))
    
    return result


@app.post("/api/requests/decide")
def decide_request(
    decision: AccessRequestDecision,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin approves or rejects an access request"""
    # Get the request
    access_request = db.query(AccessRequest).filter(
        AccessRequest.id == decision.request_id
    ).first()
    
    if not access_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Access request not found"
        )
    
    # Verify admin owns this request
    if access_request.admin_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only decide on requests assigned to you"
        )
    
    # Check if already decided
    if access_request.status != RequestStatusEnum.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request already decided"
        )
    
    # Update status
    if decision.decision.lower() == "approve":
        access_request.status = RequestStatusEnum.APPROVED
        action = "ACCESS_REQUEST_APPROVED"
    elif decision.decision.lower() == "reject":
        access_request.status = RequestStatusEnum.REJECTED
        action = "ACCESS_REQUEST_REJECTED"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid decision. Must be 'approve' or 'reject'"
        )
    
    access_request.decided_at = datetime.utcnow()
    
    # Audit log
    create_audit_log(
        db,
        current_user,
        action,
        vault_item_id=access_request.vault_item_id,
        target_user_id=access_request.employee_id,
        metadata={"request_id": str(access_request.id)}
    )
    
    db.commit()
    
    return {"message": f"Request {decision.decision}d", "status": access_request.status}


# ==================== ADMIN ENDPOINTS ====================

@app.get("/api/admin/users", response_model=List[UserResponse])
def list_admins(
    current_user: User = Depends(require_employee),
    db: Session = Depends(get_db)
):
    """List all admin users (for employee to select when requesting access)"""
    admins = db.query(User).filter(User.role == RoleEnum.ADMIN).all()
    return admins


# ==================== AUDIT ENDPOINTS ====================

@app.get("/api/audit/logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    current_user: User = Depends(require_auditor),
    db: Session = Depends(get_db)
):
    """Get all audit logs (auditor only)"""
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()
    
    result = []
    for log in logs:
        result.append(AuditLogResponse(
            id=log.id,
            actor_id=log.actor_id,
            actor_username=log.actor.username,
            action=log.action,
            vault_item_id=log.vault_item_id,
            vault_item_title=log.vault_item.title if log.vault_item else None,
            target_user_id=log.target_user_id,
            target_username=log.target_user.username if log.target_user else None,
            timestamp=log.timestamp,
            metadata=log.log_metadata

        ))
    
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
