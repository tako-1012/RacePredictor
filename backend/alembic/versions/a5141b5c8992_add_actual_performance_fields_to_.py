"""add_actual_performance_fields_to_workouts

Revision ID: a5141b5c8992
Revises: 5f00aaf6c5ec
Create Date: 2025-09-25 04:39:51.058996

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a5141b5c8992'
down_revision: Union[str, None] = '5f00aaf6c5ec'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add actual performance fields to workouts table
    op.add_column('workouts', sa.Column('target_distance_meters', sa.Integer(), nullable=True))
    op.add_column('workouts', sa.Column('target_times_seconds', sa.JSON(), nullable=True))
    op.add_column('workouts', sa.Column('actual_distance_meters', sa.Integer(), nullable=True))
    op.add_column('workouts', sa.Column('actual_times_seconds', sa.JSON(), nullable=True))
    op.add_column('workouts', sa.Column('completed', sa.Boolean(), nullable=True, server_default='false'))
    op.add_column('workouts', sa.Column('completion_rate', sa.Float(), nullable=True))  # 0.0-1.0 (0%-100%)


def downgrade() -> None:
    # Remove actual performance fields from workouts table
    op.drop_column('workouts', 'completion_rate')
    op.drop_column('workouts', 'completed')
    op.drop_column('workouts', 'actual_times_seconds')
    op.drop_column('workouts', 'actual_distance_meters')
    op.drop_column('workouts', 'target_times_seconds')
    op.drop_column('workouts', 'target_distance_meters')
