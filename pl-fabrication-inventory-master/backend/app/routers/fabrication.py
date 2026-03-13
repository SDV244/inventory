"""Fabrication/work order management endpoints."""
from typing import List, Optional
from datetime import datetime
import random
import string
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import (
    WorkOrder, WorkOrderStep, BillOfMaterials, Device, FabricationStep,
    WorkOrderStatus as WOStatus, StepStatus, DeviceStatus
)
from app.schemas import (
    WorkOrderCreate, WorkOrderUpdate, WorkOrderResponse,
    WorkOrderStepResponse
)

router = APIRouter(prefix="/fabrication", tags=["Fabrication"])

# 23 Fabrication steps for BioCellux BioPanel PBM
FABRICATION_STEPS = [
    {"id": 1, "name": "Inspección de Componentes", "phase": "Preparación", "estimatedMinutes": 30, "requiresQC": True},
    {"id": 2, "name": "Preparación de PCB", "phase": "Preparación", "estimatedMinutes": 20, "requiresQC": False},
    {"id": 3, "name": "Preparación de Área de Trabajo", "phase": "Preparación", "estimatedMinutes": 15, "requiresQC": False},
    {"id": 4, "name": "Aplicación Pasta de Soldadura", "phase": "SMD", "estimatedMinutes": 25, "requiresQC": False},
    {"id": 5, "name": "Colocación Componentes SMD", "phase": "SMD", "estimatedMinutes": 45, "requiresQC": False},
    {"id": 6, "name": "Soldadura por Reflujo", "phase": "SMD", "estimatedMinutes": 30, "requiresQC": True},
    {"id": 7, "name": "Inspección Visual SMD", "phase": "SMD", "estimatedMinutes": 20, "requiresQC": True},
    {"id": 8, "name": "Montaje LEDs", "phase": "Ensamblaje LED", "estimatedMinutes": 60, "requiresQC": False},
    {"id": 9, "name": "Soldadura Manual LEDs", "phase": "Ensamblaje LED", "estimatedMinutes": 45, "requiresQC": False},
    {"id": 10, "name": "Test Funcional LEDs", "phase": "Ensamblaje LED", "estimatedMinutes": 30, "requiresQC": True},
    {"id": 11, "name": "Preparación Carcasa", "phase": "Carcasa", "estimatedMinutes": 20, "requiresQC": False},
    {"id": 12, "name": "Instalación Disipador", "phase": "Carcasa", "estimatedMinutes": 25, "requiresQC": False},
    {"id": 13, "name": "Montaje PCB en Carcasa", "phase": "Carcasa", "estimatedMinutes": 30, "requiresQC": False},
    {"id": 14, "name": "Cableado Interno", "phase": "Conexiones", "estimatedMinutes": 35, "requiresQC": False},
    {"id": 15, "name": "Conexión Panel de Control", "phase": "Conexiones", "estimatedMinutes": 25, "requiresQC": False},
    {"id": 16, "name": "Test de Continuidad", "phase": "Conexiones", "estimatedMinutes": 20, "requiresQC": True},
    {"id": 17, "name": "Cierre de Carcasa", "phase": "Ensamblaje Final", "estimatedMinutes": 20, "requiresQC": False},
    {"id": 18, "name": "Test de Seguridad Eléctrica", "phase": "QC Final", "estimatedMinutes": 25, "requiresQC": True},
    {"id": 19, "name": "Calibración de Intensidad", "phase": "QC Final", "estimatedMinutes": 35, "requiresQC": True},
    {"id": 20, "name": "Medición Espectral", "phase": "QC Final", "estimatedMinutes": 30, "requiresQC": True},
    {"id": 21, "name": "Test de Burn-in", "phase": "QC Final", "estimatedMinutes": 120, "requiresQC": True},
    {"id": 22, "name": "Inspección Visual Final", "phase": "QC Final", "estimatedMinutes": 20, "requiresQC": True},
    {"id": 23, "name": "Empaque y Etiquetado", "phase": "Empaque", "estimatedMinutes": 25, "requiresQC": False},
]


def generate_order_number() -> str:
    """Generate a unique work order number."""
    timestamp = datetime.utcnow().strftime("%y%m%d")
    random_suffix = ''.join(random.choices(string.digits, k=4))
    return f"WO-{timestamp}-{random_suffix}"


def generate_serial_number(prefix: str = "PL") -> str:
    """Generate a unique serial number."""
    timestamp = datetime.utcnow().strftime("%y%m%d")
    random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"{prefix}-{timestamp}-{random_suffix}"


@router.get("/work-orders", response_model=List[WorkOrderResponse])
def list_work_orders(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    """List all work orders."""
    query = db.query(WorkOrder).options(
        joinedload(WorkOrder.bom).joinedload(BillOfMaterials.items),
        joinedload(WorkOrder.steps)
    )
    
    if status_filter:
        try:
            status_enum = WOStatus(status_filter)
            query = query.filter(WorkOrder.status == status_enum)
        except ValueError:
            pass
    
    return query.order_by(WorkOrder.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/work-orders", response_model=WorkOrderResponse, status_code=status.HTTP_201_CREATED)
def create_work_order(work_order: WorkOrderCreate, db: Session = Depends(get_db)):
    """Create a new work order."""
    # Validate BOM
    bom = db.query(BillOfMaterials).filter(BillOfMaterials.id == work_order.bom_id).first()
    if not bom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"BOM {work_order.bom_id} not found"
        )
    
    # Create work order
    order_number = generate_order_number()
    db_wo = WorkOrder(
        order_number=order_number,
        bom_id=work_order.bom_id,
        quantity=work_order.quantity,
        priority=work_order.priority,
        assigned_to=work_order.assigned_to,
        notes=work_order.notes,
        status=WOStatus.QUEUED,
        current_step_index=0
    )
    
    db.add(db_wo)
    db.flush()
    
    # Create work order steps
    for idx, step_data in enumerate(FABRICATION_STEPS):
        db_step = WorkOrderStep(
            work_order_id=db_wo.id,
            name=step_data["name"],
            description=step_data["phase"],
            phase=step_data["phase"],
            estimated_minutes=step_data["estimatedMinutes"],
            requires_qc=step_data["requiresQC"],
            status=StepStatus.PENDING
        )
        db.add(db_step)
    
    # Create device records for each unit in quantity
    prefix = bom.name.split()[0] if bom.name else "PL"
    for i in range(work_order.quantity):
        serial = generate_serial_number(prefix)
        device = Device(
            serial_number=serial,
            work_order_id=db_wo.id,
            bom_name=bom.name,
            status=DeviceStatus.IN_PRODUCTION,
            build_history=[{
                "id": f"bh-{int(datetime.utcnow().timestamp() * 1000)}-{i}",
                "timestamp": datetime.utcnow().isoformat(),
                "eventType": "created",
                "description": f"Dispositivo creado - Orden {order_number}"
            }],
            qc_records=[]
        )
        db.add(device)
    
    db.commit()
    
    return db.query(WorkOrder).options(
        joinedload(WorkOrder.bom).joinedload(BillOfMaterials.items),
        joinedload(WorkOrder.steps)
    ).filter(WorkOrder.id == db_wo.id).first()


@router.get("/work-orders/{work_order_id}", response_model=WorkOrderResponse)
def get_work_order(work_order_id: int, db: Session = Depends(get_db)):
    """Get a work order by ID."""
    work_order = db.query(WorkOrder).options(
        joinedload(WorkOrder.bom).joinedload(BillOfMaterials.items),
        joinedload(WorkOrder.steps)
    ).filter(WorkOrder.id == work_order_id).first()
    
    if not work_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Work order {work_order_id} not found"
        )
    return work_order


@router.put("/work-orders/{work_order_id}", response_model=WorkOrderResponse)
def update_work_order(
    work_order_id: int,
    work_order_update: WorkOrderUpdate,
    db: Session = Depends(get_db)
):
    """Update a work order."""
    work_order = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    if not work_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Work order {work_order_id} not found"
        )
    
    update_data = work_order_update.model_dump(exclude_unset=True)
    
    # Handle status changes
    if "status" in update_data:
        new_status = update_data["status"]
        if new_status == WOStatus.IN_PROGRESS and not work_order.started_at:
            work_order.started_at = datetime.utcnow()
        elif new_status == WOStatus.COMPLETE:
            work_order.completed_at = datetime.utcnow()
            # Update all devices to qc-passed
            devices = db.query(Device).filter(Device.work_order_id == work_order_id).all()
            for device in devices:
                device.status = DeviceStatus.QC_PASSED
                device.pl_characteristics = {
                    "peakWavelength": 660,
                    "intensity": 100,
                    "fwhm": 20,
                    "efficacy": 45
                }
                history = device.build_history or []
                history.append({
                    "id": f"bh-{int(datetime.utcnow().timestamp() * 1000)}",
                    "timestamp": datetime.utcnow().isoformat(),
                    "eventType": "qc-pass",
                    "description": "Producción completada - Dispositivo listo para venta"
                })
                device.build_history = history
                device.updated_at = datetime.utcnow()
    
    for field, value in update_data.items():
        setattr(work_order, field, value)
    
    work_order.updated_at = datetime.utcnow()
    db.commit()
    
    return db.query(WorkOrder).options(
        joinedload(WorkOrder.bom).joinedload(BillOfMaterials.items),
        joinedload(WorkOrder.steps)
    ).filter(WorkOrder.id == work_order.id).first()


@router.delete("/work-orders/{work_order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_work_order(work_order_id: int, db: Session = Depends(get_db)):
    """Delete a work order and its associated devices."""
    work_order = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    if not work_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Work order {work_order_id} not found"
        )
    
    # Delete associated devices
    db.query(Device).filter(Device.work_order_id == work_order_id).delete()
    
    db.delete(work_order)
    db.commit()
    return None


@router.post("/work-orders/{work_order_id}/steps/{step_index}/complete", response_model=WorkOrderResponse)
def complete_step(
    work_order_id: int,
    step_index: int,
    db: Session = Depends(get_db)
):
    """Complete a work order step."""
    work_order = db.query(WorkOrder).options(
        joinedload(WorkOrder.steps)
    ).filter(WorkOrder.id == work_order_id).first()
    
    if not work_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Work order {work_order_id} not found"
        )
    
    # Get steps sorted by ID
    steps = sorted(work_order.steps, key=lambda s: s.id)
    if step_index >= len(steps):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Step index {step_index} out of range"
        )
    
    step = steps[step_index]
    step.status = StepStatus.COMPLETED
    step.completed_at = datetime.utcnow()
    step.actual_minutes = step.estimated_minutes + random.randint(-5, 10)
    
    # Update work order
    if step_index + 1 < len(steps):
        work_order.current_step_index = step_index + 1
        steps[step_index + 1].status = StepStatus.IN_PROGRESS
        steps[step_index + 1].started_at = datetime.utcnow()
    else:
        work_order.status = WOStatus.QC
    
    work_order.updated_at = datetime.utcnow()
    db.commit()
    
    return db.query(WorkOrder).options(
        joinedload(WorkOrder.bom).joinedload(BillOfMaterials.items),
        joinedload(WorkOrder.steps)
    ).filter(WorkOrder.id == work_order.id).first()


@router.post("/work-orders/{work_order_id}/start", response_model=WorkOrderResponse)
def start_work_order(work_order_id: int, db: Session = Depends(get_db)):
    """Start a work order."""
    work_order = db.query(WorkOrder).options(
        joinedload(WorkOrder.steps)
    ).filter(WorkOrder.id == work_order_id).first()
    
    if not work_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Work order {work_order_id} not found"
        )
    
    work_order.status = WOStatus.IN_PROGRESS
    work_order.started_at = datetime.utcnow()
    work_order.current_step_index = 0
    
    # Start first step
    steps = sorted(work_order.steps, key=lambda s: s.id)
    if steps:
        steps[0].status = StepStatus.IN_PROGRESS
        steps[0].started_at = datetime.utcnow()
    
    work_order.updated_at = datetime.utcnow()
    db.commit()
    
    return db.query(WorkOrder).options(
        joinedload(WorkOrder.bom).joinedload(BillOfMaterials.items),
        joinedload(WorkOrder.steps)
    ).filter(WorkOrder.id == work_order.id).first()
