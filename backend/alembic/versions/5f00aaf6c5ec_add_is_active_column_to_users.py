"""add_is_active_column_to_users

Revision ID: 5f00aaf6c5ec
Revises: 6aba35c329c4
Create Date: 2025-09-25 04:33:39.359321

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5f00aaf6c5ec'
down_revision: Union[str, None] = '6aba35c329c4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add is_active column to users table
    op.add_column('users', sa.Column('is_active', sa.String(10), nullable=True, server_default='true'))


def downgrade() -> None:
    # Remove is_active column from users table
    op.drop_column('users', 'is_active')
