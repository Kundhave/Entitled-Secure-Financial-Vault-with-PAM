"""Initial migration - create all tables

Revision ID: 001_initial
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('username', sa.String(), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('role', sa.Enum('employee', 'admin', 'auditor', name='roleenum'), nullable=False),
        sa.Column('totp_secret', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True)
    )
    op.create_index('ix_users_username', 'users', ['username'])
    
    # Create vault_items table
    op.create_table(
        'vault_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True)
    )
    
    # Create vault_records table
    op.create_table(
        'vault_records',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('vault_item_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('encrypted_payload', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['vault_item_id'], ['vault_items.id'])
    )
    
    # Create access_requests table
    op.create_table(
        'access_requests',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('employee_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('admin_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('vault_item_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('status', sa.Enum('pending', 'approved', 'rejected', name='requeststatusenum'), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('decided_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['employee_id'], ['users.id']),
        sa.ForeignKeyConstraint(['admin_id'], ['users.id']),
        sa.ForeignKeyConstraint(['vault_item_id'], ['vault_items.id'])
    )
    
    # Create privilege_sessions table
    op.create_table(
        'privilege_sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('vault_item_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['vault_item_id'], ['vault_items.id'])
    )
    
    # Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('actor_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('vault_item_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('target_user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('metadata', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['actor_id'], ['users.id']),
        sa.ForeignKeyConstraint(['vault_item_id'], ['vault_items.id']),
        sa.ForeignKeyConstraint(['target_user_id'], ['users.id'])
    )


def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('privilege_sessions')
    op.drop_table('access_requests')
    op.drop_table('vault_records')
    op.drop_table('vault_items')
    op.drop_index('ix_users_username')
    op.drop_table('users')
    op.execute('DROP TYPE IF EXISTS roleenum')
    op.execute('DROP TYPE IF EXISTS requeststatusenum')
