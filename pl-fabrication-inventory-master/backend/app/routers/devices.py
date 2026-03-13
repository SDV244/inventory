"""Device management endpoints."""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Device, WorkOrder, DeviceStatus
from app.schemas import (
    DeviceCreate, DeviceUpdate, DeviceResponse,
    SaleData, ShipData, PaymentData
)

router = APIRouter(prefix="/devices", tags=["Devices"])


@router.get("", response_model=List[DeviceResponse])
def list_devices(
    skip: int = 0,
    limit: int = 1000,
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    """List all devices."""
    query = db.query(Device)
    
    if status_filter:
        try:
            status_enum = DeviceStatus(status_filter)
            query = query.filter(Device.status == status_enum)
        except ValueError:
            pass
    
    return query.order_by(Device.created_at.desc()).offset(skip).limit(limit).all()


@router.post("", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
def create_device(device: DeviceCreate, db: Session = Depends(get_db)):
    """Create a new device."""
    # Check if serial number exists
    existing = db.query(Device).filter(Device.serial_number == device.serial_number).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Device with serial number '{device.serial_number}' already exists"
        )
    
    db_device = Device(
        serial_number=device.serial_number,
        work_order_id=device.work_order_id,
        bom_name=device.bom_name,
        status=device.status,
        pl_characteristics=device.pl_characteristics.model_dump() if device.pl_characteristics else None,
        qc_records=[],
        build_history=[{
            "id": f"bh-{int(datetime.utcnow().timestamp() * 1000)}",
            "timestamp": datetime.utcnow().isoformat(),
            "eventType": "created",
            "description": "Dispositivo creado"
        }]
    )
    
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    return db_device


@router.get("/{device_id}", response_model=DeviceResponse)
def get_device(device_id: int, db: Session = Depends(get_db)):
    """Get a device by ID."""
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device {device_id} not found"
        )
    return device


@router.get("/serial/{serial}", response_model=DeviceResponse)
def get_device_by_serial(serial: str, db: Session = Depends(get_db)):
    """Get a device by serial number."""
    device = db.query(Device).filter(Device.serial_number == serial).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device '{serial}' not found"
        )
    return device


@router.put("/{device_id}", response_model=DeviceResponse)
def update_device(
    device_id: int,
    device_update: DeviceUpdate,
    db: Session = Depends(get_db)
):
    """Update a device."""
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device {device_id} not found"
        )
    
    update_data = device_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(device, field, value)
    
    device.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(device)
    return device


@router.post("/{device_id}/sell", response_model=DeviceResponse)
def sell_device(
    device_id: int,
    sale_data: SaleData,
    db: Session = Depends(get_db)
):
    """Mark a device as sold with customer info."""
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device {device_id} not found"
        )
    
    device.status = DeviceStatus.SOLD
    device.customer_name = sale_data.customer_name
    device.customer_email = sale_data.customer_email
    device.customer_phone = sale_data.customer_phone
    device.customer_company = sale_data.customer_company
    device.customer_notes = sale_data.notes
    device.sale_price = sale_data.sale_price
    device.invoice_number = sale_data.invoice_number
    device.sold_date = datetime.utcnow()
    device.updated_at = datetime.utcnow()
    
    # Add to build history
    history = device.build_history or []
    history.append({
        "id": f"bh-{int(datetime.utcnow().timestamp() * 1000)}",
        "timestamp": datetime.utcnow().isoformat(),
        "eventType": "sold",
        "description": f"Vendido a {sale_data.customer_name}" + (f" ({sale_data.customer_company})" if sale_data.customer_company else "")
    })
    device.build_history = history
    
    db.commit()
    db.refresh(device)
    return device


@router.post("/{device_id}/ship", response_model=DeviceResponse)
def ship_device(
    device_id: int,
    ship_data: ShipData,
    db: Session = Depends(get_db)
):
    """Mark a device as shipped."""
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device {device_id} not found"
        )
    
    device.status = DeviceStatus.SHIPPED
    device.dispatch_date = datetime.fromisoformat(ship_data.dispatch_date.replace('Z', '+00:00')) if ship_data.dispatch_date else datetime.utcnow()
    device.shipped_date = datetime.utcnow()
    device.tracking_number = ship_data.tracking_number
    device.updated_at = datetime.utcnow()
    
    # Add to build history
    history = device.build_history or []
    history.append({
        "id": f"bh-{int(datetime.utcnow().timestamp() * 1000)}",
        "timestamp": datetime.utcnow().isoformat(),
        "eventType": "shipped",
        "description": f"Despachado" + (f" - Tracking: {ship_data.tracking_number}" if ship_data.tracking_number else "")
    })
    device.build_history = history
    
    db.commit()
    db.refresh(device)
    return device


@router.post("/{device_id}/payment", response_model=DeviceResponse)
def update_payment(
    device_id: int,
    payment_data: PaymentData,
    db: Session = Depends(get_db)
):
    """Update payment status."""
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device {device_id} not found"
        )
    
    device.is_paid = payment_data.is_paid
    if payment_data.is_paid:
        device.paid_date = datetime.fromisoformat(payment_data.paid_date.replace('Z', '+00:00')) if payment_data.paid_date else datetime.utcnow()
        # Add to build history
        history = device.build_history or []
        history.append({
            "id": f"bh-{int(datetime.utcnow().timestamp() * 1000)}",
            "timestamp": datetime.utcnow().isoformat(),
            "eventType": "note",
            "description": "Pago confirmado"
        })
        device.build_history = history
    else:
        device.paid_date = None
    
    device.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(device)
    return device


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_device(device_id: int, db: Session = Depends(get_db)):
    """Delete a device."""
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device {device_id} not found"
        )
    
    db.delete(device)
    db.commit()
    return None
