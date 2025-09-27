"""Add user profiles and race schedules

Revision ID: 003_add_user_profiles_and_race_schedules
Revises: 002_add_race_types
Create Date: 2025-01-13 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003_add_user_profiles_and_race_schedules'
down_revision = '002_add_race_types'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create user_profiles table
    op.create_table('user_profiles',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('age', sa.Integer(), nullable=True),
        sa.Column('gender', sa.String(length=10), nullable=True),
        sa.Column('height_cm', sa.Float(), nullable=True),
        sa.Column('weight_kg', sa.Float(), nullable=True),
        sa.Column('bmi', sa.Float(), nullable=True),
        sa.Column('resting_hr', sa.Integer(), nullable=True),
        sa.Column('max_hr', sa.Integer(), nullable=True),
        sa.Column('vo2_max', sa.Float(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', name='uq_user_profiles_user_id')
    )

    # Create race_schedules table
    op.create_table('race_schedules',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('race_name', sa.String(length=255), nullable=False),
        sa.Column('race_date', sa.Date(), nullable=False),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('race_type', sa.String(length=10), nullable=False),
        sa.Column('distance', sa.String(length=50), nullable=False),
        sa.Column('custom_distance_m', sa.Integer(), nullable=True),
        sa.Column('target_time_seconds', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='scheduled'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create personal_bests table
    op.create_table('personal_bests',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('race_type', sa.String(length=10), nullable=False),
        sa.Column('distance', sa.String(length=50), nullable=False),
        sa.Column('custom_distance_m', sa.Integer(), nullable=True),
        sa.Column('time_seconds', sa.Integer(), nullable=False),
        sa.Column('achieved_date', sa.Date(), nullable=False),
        sa.Column('race_name', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Extend race_results table with new fields
    op.add_column('race_results', sa.Column('race_type', sa.String(length=10), nullable=True))
    op.add_column('race_results', sa.Column('custom_distance_m', sa.Integer(), nullable=True))

    # Create indexes for better performance
    op.create_index('ix_user_profiles_user_id', 'user_profiles', ['user_id'])
    op.create_index('ix_race_schedules_user_id', 'race_schedules', ['user_id'])
    op.create_index('ix_race_schedules_race_date', 'race_schedules', ['race_date'])
    op.create_index('ix_race_schedules_status', 'race_schedules', ['status'])
    op.create_index('ix_personal_bests_user_id', 'personal_bests', ['user_id'])
    op.create_index('ix_personal_bests_race_type', 'personal_bests', ['race_type'])
    op.create_index('ix_personal_bests_distance', 'personal_bests', ['distance'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_personal_bests_distance', table_name='personal_bests')
    op.drop_index('ix_personal_bests_race_type', table_name='personal_bests')
    op.drop_index('ix_personal_bests_user_id', table_name='personal_bests')
    op.drop_index('ix_race_schedules_status', table_name='race_schedules')
    op.drop_index('ix_race_schedules_race_date', table_name='race_schedules')
    op.drop_index('ix_race_schedules_user_id', table_name='race_schedules')
    op.drop_index('ix_user_profiles_user_id', table_name='user_profiles')

    # Drop new columns from race_results
    op.drop_column('race_results', 'custom_distance_m')
    op.drop_column('race_results', 'race_type')

    # Drop tables
    op.drop_table('personal_bests')
    op.drop_table('race_schedules')
    op.drop_table('user_profiles')
