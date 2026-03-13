"""SQLAlchemy ORM models for PL Device Fabrication Inventory."""
from datetime import datetime, timezone
from typing import Optional
import enum


def utc_now() -> datetime:
    """Return current UTC time (timezone-aware)."""
    return datetime.now(timezone.utc)

from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, DateTime,
    ForeignKey, Enum, JSON, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from app.database import Base


class WorkOrderStatus(str, enum.Enum):
    """Work order status enumeration."""
    QUEUED = "queued"
    IN_PROGRESS = "in-progress"
    QC = "qc"
    COMPLETE = "complete"
    ON_HOLD = "on-hold"
    CANCELLED = "cancelled"


class StepStatus(str, enum.Enum):
    """Fabrication step status enumeration."""
    PENDING = "pending"
    IN_PROGRESS = "in-progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"
    FAILED = "failed"


class QCResult(str, enum.Enum):
    """Quality check result enumeration."""
    PASS = "pass"
    FAIL = "fail"
    CONDITIONAL = "conditional"


class DeviceStatus(str, enum.Enum):
    """Device status enumeration."""
    IN_PRODUCTION = "in-production"
    QC_PENDING = "qc-pending"
    QC_PASSED = "qc-passed"
    QC_FAILED = "qc-failed"
    SOLD = "sold"
    SHIPPED = "shipped"
    RETURNED = "returned"


class BOMStatus(str, enum.Enum):
    """BOM status enumeration."""
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"


class Supplier(Base):
    """Supplier model for component vendors."""
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    contact_email = Column(String(255))
    phone = Column(String(50))
    address = Column(Text)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    components = relationship("Component", back_populates="supplier")


class Component(Base):
    """Component/inventory item model."""
    __tablename__ = "components"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(100), nullable=False, unique=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(100), index=True)
    unit_of_measure = Column(String(20), default="ea")
    unit_cost = Column(Float, default=0.0)
    current_stock = Column(Integer, default=0, nullable=False)
    min_stock = Column(Integer, default=0)
    max_stock = Column(Integer, default=1000)
    reorder_point = Column(Integer, default=0)
    location = Column(String(100))
    lot_number = Column(String(100))
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    lead_time_days = Column(Integer, default=7)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    supplier = relationship("Supplier", back_populates="components")
    bom_items = relationship("BOMItem", back_populates="component")
    usage_records = relationship("ComponentUsage", back_populates="component")

    __table_args__ = (
        Index("ix_components_category_sku", "category", "sku"),
    )


class BillOfMaterials(Base):
    """Bill of Materials model for device recipes."""
    __tablename__ = "bill_of_materials"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    version = Column(String(50), nullable=False, default="1.0")
    description = Column(Text)
    status = Column(Enum(BOMStatus), default=BOMStatus.DRAFT)
    total_cost = Column(Float, default=0.0)
    created_by = Column(String(255))
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    items = relationship("BOMItem", back_populates="bom", cascade="all, delete-orphan")
    work_orders = relationship("WorkOrder", back_populates="bom")

    __table_args__ = (
        UniqueConstraint("name", "version", name="uq_bom_name_version"),
    )


class BOMItem(Base):
    """BOM line item linking components to a BOM."""
    __tablename__ = "bom_items"

    id = Column(Integer, primary_key=True, index=True)
    bom_id = Column(Integer, ForeignKey("bill_of_materials.id", ondelete="CASCADE"), nullable=False)
    component_id = Column(Integer, ForeignKey("components.id"), nullable=False)
    quantity = Column(Float, nullable=False, default=1.0)
    notes = Column(Text)

    # Relationships
    bom = relationship("BillOfMaterials", back_populates="items")
    component = relationship("Component", back_populates="bom_items")

    __table_args__ = (
        UniqueConstraint("bom_id", "component_id", name="uq_bom_component"),
    )


class FabricationStep(Base):
    """Fabrication step template."""
    __tablename__ = "fabrication_steps"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    sequence = Column(Integer, nullable=False)
    phase = Column(String(100))
    description = Column(Text)
    estimated_minutes = Column(Integer, default=0)
    requires_qc = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    work_order_steps = relationship("WorkOrderStep", back_populates="step")
    quality_checks = relationship("QualityCheck", back_populates="step")

    __table_args__ = (
        Index("ix_fab_steps_sequence", "sequence"),
    )


class WorkOrder(Base):
    """Work order for device fabrication."""
    __tablename__ = "work_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(100), nullable=False, unique=True, index=True)
    bom_id = Column(Integer, ForeignKey("bill_of_materials.id"), nullable=False)
    quantity = Column(Integer, default=1)
    status = Column(Enum(WorkOrderStatus), default=WorkOrderStatus.QUEUED, nullable=False)
    priority = Column(String(20), default="normal")
    current_step_index = Column(Integer, default=0)
    assigned_to = Column(String(255))
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    notes = Column(Text)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    bom = relationship("BillOfMaterials", back_populates="work_orders")
    steps = relationship("WorkOrderStep", back_populates="work_order", cascade="all, delete-orphan")
    quality_checks = relationship("QualityCheck", back_populates="work_order", cascade="all, delete-orphan")
    devices = relationship("Device", back_populates="work_order", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_work_orders_status", "status"),
    )


class WorkOrderStep(Base):
    """Individual step instance in a work order."""
    __tablename__ = "work_order_steps"

    id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(Integer, ForeignKey("work_orders.id", ondelete="CASCADE"), nullable=False)
    step_id = Column(Integer, ForeignKey("fabrication_steps.id"), nullable=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    phase = Column(String(100))
    estimated_minutes = Column(Integer, default=0)
    actual_minutes = Column(Integer)
    requires_qc = Column(Boolean, default=False)
    status = Column(Enum(StepStatus), default=StepStatus.PENDING, nullable=False)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    completed_by = Column(String(255))
    notes = Column(Text)

    # Relationships
    work_order = relationship("WorkOrder", back_populates="steps")
    step = relationship("FabricationStep", back_populates="work_order_steps")


class QualityCheck(Base):
    """Quality check record."""
    __tablename__ = "quality_checks"

    id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(Integer, ForeignKey("work_orders.id", ondelete="CASCADE"), nullable=False)
    step_id = Column(Integer, ForeignKey("fabrication_steps.id"), nullable=True)
    checkpoint_name = Column(String(255), nullable=False)
    result = Column(Enum(QCResult), nullable=False)
    measurements = Column(JSON)  # Flexible JSON for measurement data
    notes = Column(Text)
    checked_by = Column(String(255), nullable=False)
    checked_at = Column(DateTime, default=utc_now)

    # Relationships
    work_order = relationship("WorkOrder", back_populates="quality_checks")
    step = relationship("FabricationStep", back_populates="quality_checks")

    __table_args__ = (
        Index("ix_qc_result", "result"),
    )


class Device(Base):
    """Completed PL device unit with full lifecycle tracking."""
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    serial_number = Column(String(100), nullable=False, unique=True, index=True)
    work_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=False)
    bom_name = Column(String(255))
    
    # Status
    status = Column(Enum(DeviceStatus), default=DeviceStatus.IN_PRODUCTION, nullable=False)
    
    # Manufacturing
    manufactured_at = Column(DateTime, default=utc_now)
    
    # PL Characteristics (JSON for flexibility)
    pl_characteristics = Column(JSON)  # {peakWavelength, intensity, fwhm, efficacy}
    
    # QC Records (JSON array)
    qc_records = Column(JSON, default=list)  # [{id, passed, performedAt, performedBy, measurements, defectCodes, notes}]
    
    # Build History (JSON array)
    build_history = Column(JSON, default=list)  # [{id, timestamp, eventType, description, performedBy}]
    
    # Customer Info
    customer_name = Column(String(255))
    customer_email = Column(String(255))
    customer_phone = Column(String(100))
    customer_company = Column(String(255))
    customer_notes = Column(Text)
    
    # Sale Info
    sold_date = Column(DateTime)
    sale_price = Column(Float)
    invoice_number = Column(String(100))
    
    # Payment Info
    is_paid = Column(Boolean, default=False)
    paid_date = Column(DateTime)
    
    # Dispatch Info
    dispatch_date = Column(DateTime)
    shipped_date = Column(DateTime)
    tracking_number = Column(String(255))
    
    # General
    notes = Column(Text)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    work_order = relationship("WorkOrder", back_populates="devices")
    component_usage = relationship("ComponentUsage", back_populates="device", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_devices_status", "status"),
    )


class ComponentUsage(Base):
    """Track component usage for device traceability."""
    __tablename__ = "component_usage"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id", ondelete="CASCADE"), nullable=False)
    component_id = Column(Integer, ForeignKey("components.id"), nullable=False)
    lot_number = Column(String(100))
    quantity_used = Column(Float, nullable=False, default=1.0)
    used_at = Column(DateTime, default=utc_now)

    # Relationships
    device = relationship("Device", back_populates="component_usage")
    component = relationship("Component", back_populates="usage_records")

    __table_args__ = (
        Index("ix_component_usage_lot", "lot_number"),
    )
