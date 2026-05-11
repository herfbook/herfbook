"""lines_as_lookup_table

Revision ID: 275c1409e019
Revises: c60390842191
Create Date: 2026-05-11 06:31:11.725172

BE-02: Promote cigar.line from a free-text VARCHAR column to a proper
community lookup table scoped by brand FK. No data is preserved from
the old `cigars.line` column — pre-release, no production data.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '275c1409e019'
down_revision: Union[str, None] = 'c60390842191'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'lines',
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('brand_id', sa.UUID(), nullable=True),
        sa.Column(
            'id',
            sa.UUID(),
            server_default=sa.text('gen_random_uuid()'),
            nullable=False,
        ),
        sa.Column('source', sa.String(length=20), nullable=False),
        sa.Column('community_key', sa.String(length=200), nullable=True),
        sa.Column('is_imported', sa.Boolean(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(['brand_id'], ['brands.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name', 'brand_id', name='uq_lines_name_brand'),
    )
    op.create_index(op.f('ix_lines_brand_id'), 'lines', ['brand_id'], unique=False)
    op.create_index('ix_lines_brand_id_name', 'lines', ['brand_id', 'name'], unique=False)
    op.create_index(op.f('ix_lines_community_key'), 'lines', ['community_key'], unique=True)

    op.add_column('cigars', sa.Column('line_id', sa.UUID(), nullable=True))
    op.create_index(op.f('ix_cigars_line_id'), 'cigars', ['line_id'], unique=False)
    op.create_foreign_key(
        'fk_cigars_line_id_lines',
        'cigars',
        'lines',
        ['line_id'],
        ['id'],
        ondelete='SET NULL',
    )
    op.drop_column('cigars', 'line')


def downgrade() -> None:
    op.add_column(
        'cigars',
        sa.Column('line', sa.VARCHAR(length=200), autoincrement=False, nullable=True),
    )
    op.drop_constraint('fk_cigars_line_id_lines', 'cigars', type_='foreignkey')
    op.drop_index(op.f('ix_cigars_line_id'), table_name='cigars')
    op.drop_column('cigars', 'line_id')
    op.drop_index(op.f('ix_lines_community_key'), table_name='lines')
    op.drop_index('ix_lines_brand_id_name', table_name='lines')
    op.drop_index(op.f('ix_lines_brand_id'), table_name='lines')
    op.drop_table('lines')
