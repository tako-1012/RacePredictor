"""fix_password_column_name

Revision ID: 6aba35c329c4
Revises: 006_add_missing_columns
Create Date: 2025-09-25 04:30:07.173467

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6aba35c329c4'
down_revision: Union[str, None] = '006_add_missing_columns'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename password_hash column to hashed_password
    op.alter_column('users', 'password_hash', new_column_name='hashed_password')


def downgrade() -> None:
    # Rename hashed_password column back to password_hash
    op.alter_column('users', 'hashed_password', new_column_name='password_hash')
