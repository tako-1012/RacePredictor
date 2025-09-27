"""Add missing columns to custom_workout_templates

Revision ID: 006_add_missing_columns
Revises: 005_template_categories_sqlite
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '006_add_missing_columns'
down_revision = 'd4bb47b6507f'
branch_labels = None
depends_on = None


def upgrade():
    # Add missing columns to custom_workout_templates table
    op.add_column('custom_workout_templates', sa.Column('created_from', sa.String(50), nullable=True, server_default='manual'))
    op.add_column('custom_workout_templates', sa.Column('last_used', sa.DateTime(), nullable=True))


def downgrade():
    # Drop columns
    op.drop_column('custom_workout_templates', 'last_used')
    op.drop_column('custom_workout_templates', 'created_from')
