"""Add race types and update race results

Revision ID: 002_add_race_types
Revises: 001_initial_migration
Create Date: 2024-12-20 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002_add_race_types'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade():
    # Create race_types table
    op.create_table('race_types',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('category', sa.String(length=20), nullable=False),
        sa.Column('default_distance_meters', sa.Integer(), nullable=False),
        sa.Column('is_customizable', sa.Boolean(), nullable=True),
        sa.Column('min_distance_meters', sa.Integer(), nullable=True),
        sa.Column('max_distance_meters', sa.Integer(), nullable=True),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('is_default', sa.Boolean(), nullable=True),
        sa.Column('created_by', sa.String(36), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Update race_results table
    op.add_column('race_results', sa.Column('race_name', sa.String(length=100), nullable=True))
    op.add_column('race_results', sa.Column('race_type_id', sa.String(36), nullable=True))
    op.add_column('race_results', sa.Column('pace_seconds', sa.Float(), nullable=True))
    op.add_column('race_results', sa.Column('total_participants', sa.Integer(), nullable=True))
    op.add_column('race_results', sa.Column('notes', sa.String(length=1000), nullable=True))
    op.add_column('race_results', sa.Column('is_relay', sa.Boolean(), nullable=True))
    op.add_column('race_results', sa.Column('relay_segment', sa.Integer(), nullable=True))
    op.add_column('race_results', sa.Column('team_name', sa.String(length=100), nullable=True))
    op.add_column('race_results', sa.Column('relay_time', sa.String(length=20), nullable=True))
    op.add_column('race_results', sa.Column('segment_place', sa.Integer(), nullable=True))
    op.add_column('race_results', sa.Column('segment_total_participants', sa.Integer(), nullable=True))
    op.add_column('race_results', sa.Column('splits', sa.JSON(), nullable=True))
    op.add_column('race_results', sa.Column('weather', sa.String(length=50), nullable=True))
    op.add_column('race_results', sa.Column('course_type', sa.String(length=50), nullable=True))
    op.add_column('race_results', sa.Column('strategy_notes', sa.String(length=1000), nullable=True))
    op.add_column('race_results', sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True))

    # Add foreign key constraint
    op.create_foreign_key('fk_race_results_race_type_id', 'race_results', 'race_types', ['race_type_id'], ['id'])

    # Update existing race_results to have required fields
    op.execute("UPDATE race_results SET race_name = 'Unknown Race' WHERE race_name IS NULL")
    op.execute("UPDATE race_results SET pace_seconds = time_seconds / (distance_meters / 1000.0) WHERE pace_seconds IS NULL")
    op.execute("UPDATE race_results SET is_relay = false WHERE is_relay IS NULL")

    # Make required columns NOT NULL
    op.alter_column('race_results', 'race_name', nullable=False)
    op.alter_column('race_results', 'pace_seconds', nullable=False)
    op.alter_column('race_results', 'is_relay', nullable=False)

    # Drop old event column
    op.drop_column('race_results', 'event')


def downgrade():
    # Add back event column
    op.add_column('race_results', sa.Column('event', sa.String(length=20), nullable=False))

    # Drop foreign key constraint
    op.drop_constraint('fk_race_results_race_type_id', 'race_results', type_='foreignkey')

    # Drop new columns from race_results
    op.drop_column('race_results', 'strategy_notes')
    op.drop_column('race_results', 'course_type')
    op.drop_column('race_results', 'weather')
    op.drop_column('race_results', 'splits')
    op.drop_column('race_results', 'segment_total_participants')
    op.drop_column('race_results', 'segment_place')
    op.drop_column('race_results', 'relay_time')
    op.drop_column('race_results', 'team_name')
    op.drop_column('race_results', 'relay_segment')
    op.drop_column('race_results', 'is_relay')
    op.drop_column('race_results', 'notes')
    op.drop_column('race_results', 'total_participants')
    op.drop_column('race_results', 'pace_seconds')
    op.drop_column('race_results', 'race_type_id')
    op.drop_column('race_results', 'race_name')
    op.drop_column('race_results', 'updated_at')

    # Drop race_types table
    op.drop_table('race_types')
