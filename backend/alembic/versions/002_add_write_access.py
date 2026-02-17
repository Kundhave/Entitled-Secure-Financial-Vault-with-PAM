"""Add access_type to access_requests and privilege_sessions

Revision ID: 002_add_write_access
Revises: 482a7496406d
Create Date: 2026-02-07 14:10:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002_add_write_access'
down_revision = 'rename_auditlog_metadata'  # Use actual revision ID from previous migration
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create AccessTypeEnum if it doesn't exist
    op.execute("CREATE TYPE accesstypeenum AS ENUM ('read', 'write')")
    
    # Add access_type column to access_requests table
    # Default to 'read' for backward compatibility with existing requests
    op.add_column('access_requests', 
        sa.Column('access_type', sa.Enum('read', 'write', name='accesstypeenum'), 
                  nullable=False, server_default='read')
    )
    
    # Add access_type column to privilege_sessions table
    # Default to 'read' for backward compatibility with existing sessions
    op.add_column('privilege_sessions',
        sa.Column('access_type', sa.Enum('read', 'write', name='accesstypeenum'),
                  nullable=False, server_default='read')
    )


def downgrade() -> None:
    # Remove access_type columns
    op.drop_column('privilege_sessions', 'access_type')
    op.drop_column('access_requests', 'access_type')
    
    # Drop the enum type
    op.execute('DROP TYPE IF EXISTS accesstypeenum')
