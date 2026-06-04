"""Initial schema from database/init.sql.

Revision ID: 20260604_0001
Revises:
Create Date: 2026-06-04
"""

from pathlib import Path

from alembic import op


revision = "20260604_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    sql_path = Path(__file__).resolve().parents[3] / "database" / "init.sql"
    op.get_bind().exec_driver_sql(sql_path.read_text(encoding="utf-8"))


def downgrade() -> None:
    op.execute("DROP SCHEMA public CASCADE")
    op.execute("CREATE SCHEMA public")
    op.execute('GRANT ALL ON SCHEMA public TO public')
