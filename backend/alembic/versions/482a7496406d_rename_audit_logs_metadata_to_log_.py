from alembic import op
import sqlalchemy as sa

revision = "rename_auditlog_metadata"
down_revision = "001_initial"

def upgrade():
    op.add_column(
        "audit_logs",
        sa.Column("log_metadata", sa.Text(), nullable=True),
    )
    op.execute("UPDATE audit_logs SET log_metadata = metadata")
    op.drop_column("audit_logs", "metadata")

def downgrade():
    op.add_column(
        "audit_logs",
        sa.Column("metadata", sa.Text(), nullable=True),
    )
    op.execute("UPDATE audit_logs SET metadata = log_metadata")
    op.drop_column("audit_logs", "log_metadata")
