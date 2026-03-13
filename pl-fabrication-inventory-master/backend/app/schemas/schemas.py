"""Pydantic schemas for API request/response models."""
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum


# Enums
class WorkOrderStatus(str, Enum):
    QUEUED = "queued"
    IN_PROGRESS = "in-progress"
    QC = "qc"
    COMPLETE = "complete"
    ON_HOLD = "on-hold"
    CANCELLED = "cancelled"


class StepStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in-progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"
    FAILED = "failed"


class DeviceStatus(str, Enum):
    IN_PRODUCTION = "in-production"
    QC_PENDING = "qc-pending"
    QC_PASSED = "qc-passed"
    QC_FAILED = "qc-failed"
    SOLD = "sold"
    SHIPPED = "shipped"
    RETURNED = "returned"


class BOMStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"


# ============ Supplier Schemas ============
class SupplierBase(BaseModel):
    name: str
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class SupplierResponse(SupplierBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime


# ============ Component Schemas ============
class ComponentBase(BaseModel):
    sku: str
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    unit_of_measure: str = "ea"
    unit_cost: float = 0.0
    current_stock: int = 0
    min_stock: int = 0
    max_stock: int = 1000
    reorder_point: int = 0
    location: Optional[str] = None
    lot_number: Optional[str] = None
    supplier_id: Optional[int] = None
    lead_time_days: int = 7


class ComponentCreate(ComponentBase):
    pass


class ComponentUpdate(BaseModel):
    sku: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    unit_of_measure: Optional[str] = None
    unit_cost: Optional[float] = None
    current_stock: Optional[int] = None
    min_stock: Optional[int] = None
    max_stock: Optional[int] = None
    reorder_point: Optional[int] = None
    location: Optional[str] = None
    lot_number: Optional[str] = None
    supplier_id: Optional[int] = None
    lead_time_days: Optional[int] = None
    is_active: Optional[bool] = None


class ComponentResponse(ComponentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    is_active: bool = True
    supplier: Optional[SupplierResponse] = None
    created_at: datetime
    updated_at: datetime


class StockAdjustment(BaseModel):
    quantity: int
    lot_number: Optional[str] = None
    notes: Optional[str] = None


# ============ BOM Schemas ============
class BOMItemBase(BaseModel):
    component_id: int
    quantity: float = 1.0
    notes: Optional[str] = None


class BOMItemCreate(BOMItemBase):
    pass


class BOMItemResponse(BOMItemBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    component: Optional[ComponentResponse] = None


class BOMBase(BaseModel):
    name: str
    version: str = "1.0"
    description: Optional[str] = None


class BOMCreate(BOMBase):
    items: List[BOMItemCreate] = []


class BOMUpdate(BaseModel):
    name: Optional[str] = None
    version: Optional[str] = None
    description: Optional[str] = None
    status: Optional[BOMStatus] = None
    items: Optional[List[BOMItemCreate]] = None


class BOMResponse(BOMBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: BOMStatus
    total_cost: float
    created_by: Optional[str] = None
    items: List[BOMItemResponse] = []
    created_at: datetime
    updated_at: datetime


# ============ Work Order Step Schemas ============
class WorkOrderStepBase(BaseModel):
    name: str
    description: Optional[str] = None
    phase: Optional[str] = None
    estimated_minutes: int = 0
    requires_qc: bool = False


class WorkOrderStepCreate(WorkOrderStepBase):
    step_id: Optional[int] = None


class WorkOrderStepResponse(WorkOrderStepBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    work_order_id: int
    step_id: Optional[int] = None
    status: StepStatus
    actual_minutes: Optional[int] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    completed_by: Optional[str] = None
    notes: Optional[str] = None


# ============ Work Order Schemas ============
class WorkOrderBase(BaseModel):
    bom_id: int
    quantity: int = 1
    priority: str = "normal"
    assigned_to: Optional[str] = None
    notes: Optional[str] = None


class WorkOrderCreate(WorkOrderBase):
    steps: Optional[List[WorkOrderStepCreate]] = None


class WorkOrderUpdate(BaseModel):
    status: Optional[WorkOrderStatus] = None
    priority: Optional[str] = None
    current_step_index: Optional[int] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None


class WorkOrderResponse(WorkOrderBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    order_number: str
    status: WorkOrderStatus
    current_step_index: int
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    bom: Optional[BOMResponse] = None
    steps: List[WorkOrderStepResponse] = []
    created_at: datetime
    updated_at: datetime


# ============ Device Schemas ============
class PLCharacteristics(BaseModel):
    peakWavelength: Optional[float] = None
    intensity: Optional[float] = None
    fwhm: Optional[float] = None
    efficacy: Optional[float] = None


class QCMeasurement(BaseModel):
    name: str
    value: float
    unit: str
    passed: bool


class QCRecord(BaseModel):
    id: str
    passed: bool
    performedAt: str
    performedBy: str
    measurements: Optional[List[QCMeasurement]] = None
    defectCodes: Optional[List[str]] = None
    notes: Optional[str] = None


class BuildHistoryItem(BaseModel):
    id: str
    timestamp: str
    eventType: str
    description: str
    performedBy: Optional[str] = None


class CustomerInfo(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    notes: Optional[str] = None


class DeviceBase(BaseModel):
    serial_number: str
    work_order_id: int
    bom_name: Optional[str] = None


class DeviceCreate(DeviceBase):
    status: DeviceStatus = DeviceStatus.IN_PRODUCTION
    pl_characteristics: Optional[PLCharacteristics] = None


class DeviceUpdate(BaseModel):
    status: Optional[DeviceStatus] = None
    pl_characteristics: Optional[dict] = None
    qc_records: Optional[List[dict]] = None
    build_history: Optional[List[dict]] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_company: Optional[str] = None
    customer_notes: Optional[str] = None
    sold_date: Optional[datetime] = None
    sale_price: Optional[float] = None
    invoice_number: Optional[str] = None
    is_paid: Optional[bool] = None
    paid_date: Optional[datetime] = None
    dispatch_date: Optional[datetime] = None
    shipped_date: Optional[datetime] = None
    tracking_number: Optional[str] = None
    notes: Optional[str] = None


class SaleData(BaseModel):
    customer_name: str
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_company: Optional[str] = None
    sale_price: Optional[float] = None
    invoice_number: Optional[str] = None
    notes: Optional[str] = None


class ShipData(BaseModel):
    dispatch_date: str
    tracking_number: Optional[str] = None


class PaymentData(BaseModel):
    is_paid: bool
    paid_date: Optional[str] = None


class DeviceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    serial_number: str
    work_order_id: int
    bom_name: Optional[str] = None
    status: DeviceStatus
    manufactured_at: Optional[datetime] = None
    pl_characteristics: Optional[dict] = None
    qc_records: Optional[List[dict]] = []
    build_history: Optional[List[dict]] = []
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_company: Optional[str] = None
    customer_notes: Optional[str] = None
    sold_date: Optional[datetime] = None
    sale_price: Optional[float] = None
    invoice_number: Optional[str] = None
    is_paid: bool = False
    paid_date: Optional[datetime] = None
    dispatch_date: Optional[datetime] = None
    shipped_date: Optional[datetime] = None
    tracking_number: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ============ Quality Check Schemas ============
class QualityCheckCreate(BaseModel):
    work_order_id: int
    step_id: Optional[int] = None
    checkpoint_name: str
    result: str
    measurements: Optional[dict] = None
    notes: Optional[str] = None
    checked_by: str


class QualityCheckResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    work_order_id: int
    step_id: Optional[int] = None
    checkpoint_name: str
    result: str
    measurements: Optional[dict] = None
    notes: Optional[str] = None
    checked_by: str
    checked_at: datetime


# ============ Component Usage Schemas ============
class ComponentUsageCreate(BaseModel):
    component_id: int
    lot_number: Optional[str] = None
    quantity_used: float = 1.0


class ComponentUsageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    device_id: int
    component_id: int
    component: Optional[ComponentResponse] = None
    lot_number: Optional[str] = None
    quantity_used: float
    used_at: datetime


# ============ Device History ============
class DeviceHistory(BaseModel):
    device: DeviceResponse
    work_order: Optional[WorkOrderResponse] = None
    quality_checks: List[QualityCheckResponse] = []
    component_usage: List[ComponentUsageResponse] = []
