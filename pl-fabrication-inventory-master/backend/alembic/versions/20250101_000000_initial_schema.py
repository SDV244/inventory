"""Initial schema

Revision ID: 001_initial
Revises: 
Create Date: 2025-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Suppliers
    op.create_table('suppliers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('contact_email', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_suppliers_id'), 'suppliers', ['id'], unique=False)

    # Components
    op.create_table('components',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('sku', sa.String(length=100), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('quantity_on_hand', sa.Integer(), nullable=False),
        sa.Column('reorder_point', sa.Integer(), nullable=True),
        sa.Column('unit_cost', sa.Float(), nullable=True),
        sa.Column('supplier_id', sa.Integer(), nullable=True),
        sa.Column('lot_number', sa.String(length=100), nullable=True),
        sa.Column('received_date', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['supplier_id'], ['suppliers.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('sku')
    )
    op.create_index(op.f('ix_components_id'), 'components', ['id'], unique=False)
    op.create_index(op.f('ix_components_sku'), 'components', ['sku'], unique=True)
    op.create_index(op.f('ix_components_category'), 'components', ['category'], unique=False)
    op.create_index('ix_components_category_sku', 'components', ['category', 'sku'], unique=False)

    # Bill of Materials
    op.create_table('bill_of_materials',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('version', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name', 'version', name='uq_bom_name_version')
    )
    op.create_index(op.f('ix_bill_of_materials_id'), 'bill_of_materials', ['id'], unique=False)

    # BOM Items
    op.create_table('bom_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('bom_id', sa.Integer(), nullable=False),
        sa.Column('component_id', sa.Integer(), nullable=False),
        sa.Column('quantity_required', sa.Float(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['bom_id'], ['bill_of_materials.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['component_id'], ['components.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('bom_id', 'component_id', name='uq_bom_component')
    )
    op.create_index(op.f('ix_bom_items_id'), 'bom_items', ['id'], unique=False)

    # Fabrication Steps
    op.create_table('fabrication_steps',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('sequence', sa.Integer(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('estimated_minutes', sa.Integer(), nullable=True),
        sa.Column('requires_qc', sa.Boolean(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_fabrication_steps_id'), 'fabrication_steps', ['id'], unique=False)
    op.create_index('ix_fab_steps_sequence', 'fabrication_steps', ['sequence'], unique=False)

    # Work Orders
    op.create_table('work_orders',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('serial_number', sa.String(length=100), nullable=False),
        sa.Column('bom_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED', name='workorderstatus'), nullable=False),
        sa.Column('current_step', sa.Integer(), nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['bom_id'], ['bill_of_materials.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('serial_number')
    )
    op.create_index(op.f('ix_work_orders_id'), 'work_orders', ['id'], unique=False)
    op.create_index(op.f('ix_work_orders_serial_number'), 'work_orders', ['serial_number'], unique=True)
    op.create_index('ix_work_orders_status', 'work_orders', ['status'], unique=False)

    # Work Order Steps
    op.create_table('work_order_steps',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('work_order_id', sa.Integer(), nullable=False),
        sa.Column('step_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'FAILED', name='stepstatus'), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('operator', sa.String(length=255), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['step_id'], ['fabrication_steps.id'], ),
        sa.ForeignKeyConstraint(['work_order_id'], ['work_orders.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('work_order_id', 'step_id', name='uq_work_order_step')
    )
    op.create_index(op.f('ix_work_order_steps_id'), 'work_order_steps', ['id'], unique=False)

    # Quality Checks
    op.create_table('quality_checks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('work_order_id', sa.Integer(), nullable=False),
        sa.Column('step_id', sa.Integer(), nullable=True),
        sa.Column('checkpoint_name', sa.String(length=255), nullable=False),
        sa.Column('result', sa.Enum('PASS', 'FAIL', 'CONDITIONAL', name='qcresult'), nullable=False),
        sa.Column('measurements', sa.JSON(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('checked_by', sa.String(length=255), nullable=False),
        sa.Column('checked_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['step_id'], ['fabrication_steps.id'], ),
        sa.ForeignKeyConstraint(['work_order_id'], ['work_orders.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_quality_checks_id'), 'quality_checks', ['id'], unique=False)
    op.create_index('ix_qc_result', 'quality_checks', ['result'], unique=False)

    # Devices
    op.create_table('devices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('serial_number', sa.String(length=100), nullable=False),
        sa.Column('work_order_id', sa.Integer(), nullable=False),
        sa.Column('manufactured_at', sa.DateTime(), nullable=True),
        sa.Column('pl_wavelength_nm', sa.Float(), nullable=True),
        sa.Column('pl_intensity', sa.Float(), nullable=True),
        sa.Column('calibration_date', sa.DateTime(), nullable=True),
        sa.Column('status', sa.Enum('ACTIVE', 'SHIPPED', 'RETURNED', 'SCRAPPED', name='devicestatus'), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['work_order_id'], ['work_orders.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('serial_number'),
        sa.UniqueConstraint('work_order_id')
    )
    op.create_index(op.f('ix_devices_id'), 'devices', ['id'], unique=False)
    op.create_index(op.f('ix_devices_serial_number'), 'devices', ['serial_number'], unique=True)
    op.create_index('ix_devices_status', 'devices', ['status'], unique=False)

    # Component Usage
    op.create_table('component_usage',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('device_id', sa.Integer(), nullable=False),
        sa.Column('component_id', sa.Integer(), nullable=False),
        sa.Column('lot_number', sa.String(length=100), nullable=True),
        sa.Column('quantity_used', sa.Float(), nullable=False),
        sa.Column('used_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['component_id'], ['components.id'], ),
        sa.ForeignKeyConstraint(['device_id'], ['devices.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_component_usage_id'), 'component_usage', ['id'], unique=False)
    op.create_index('ix_component_usage_lot', 'component_usage', ['lot_number'], unique=False)


def downgrade() -> None:
    op.drop_table('component_usage')
    op.drop_table('devices')
    op.drop_table('quality_checks')
    op.drop_table('work_order_steps')
    op.drop_table('work_orders')
    op.drop_table('fabrication_steps')
    op.drop_table('bom_items')
    op.drop_table('bill_of_materials')
    op.drop_table('components')
    op.drop_table('suppliers')
