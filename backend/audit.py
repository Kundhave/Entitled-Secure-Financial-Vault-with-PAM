from sqlalchemy.orm import Session
from models import AuditLog, User
from typing import Optional
import json
from uuid import UUID


def create_audit_log(
    db: Session,
    actor: User,
    action: str,
    vault_item_id: Optional[UUID] = None,
    target_user_id: Optional[UUID] = None,
    metadata: Optional[dict] = None
):
    """Create an audit log entry"""
    audit_log = AuditLog(
        actor_id=actor.id,
        action=action,
        vault_item_id=vault_item_id,
        target_user_id=target_user_id,
        log_metadata=json.dumps(metadata) if metadata else None
    )
    db.add(audit_log)
    return audit_log
