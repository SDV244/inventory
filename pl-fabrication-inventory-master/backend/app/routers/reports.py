"""Reporting endpoints."""
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import (
    Component, Device, WorkOrder, BillOfMaterials,
    DeviceStatus, WorkOrderStatus
)

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/inventory-status")
def get_inventory_status(db: Session = Depends(get_db)):
    """Get inventory status report."""
    components = db.query(Component).filter(Component.is_active == True).all()
    
    total_value = sum(c.current_stock * c.unit_cost for c in components)
    low_stock = [c for c in components if c.current_stock <= c.reorder_point]
    out_of_stock = [c for c in components if c.current_stock == 0]
    
    by_category = {}
    for c in components:
        cat = c.category or "Sin categoría"
        if cat not in by_category:
            by_category[cat] = {"count": 0, "value": 0}
        by_category[cat]["count"] += c.current_stock
        by_category[cat]["value"] += c.current_stock * c.unit_cost
    
    return {
        "total_components": len(components),
        "total_value": total_value,
        "low_stock_count": len(low_stock),
        "out_of_stock_count": len(out_of_stock),
        "low_stock_items": [
            {"id": c.id, "sku": c.sku, "name": c.name, "current_stock": c.current_stock, "reorder_point": c.reorder_point}
            for c in low_stock
        ],
        "by_category": by_category
    }


@router.get("/production-summary")
def get_production_summary(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Get production summary report."""
    since = datetime.utcnow() - timedelta(days=days)
    
    work_orders = db.query(WorkOrder).filter(WorkOrder.created_at >= since).all()
    
    total_orders = len(work_orders)
    completed = len([wo for wo in work_orders if wo.status == WorkOrderStatus.COMPLETE])
    in_progress = len([wo for wo in work_orders if wo.status == WorkOrderStatus.IN_PROGRESS])
    queued = len([wo for wo in work_orders if wo.status == WorkOrderStatus.QUEUED])
    
    devices = db.query(Device).filter(Device.created_at >= since).all()
    total_devices = len(devices)
    
    return {
        "period_days": days,
        "total_work_orders": total_orders,
        "completed": completed,
        "in_progress": in_progress,
        "queued": queued,
        "total_devices_produced": total_devices,
        "completion_rate": (completed / total_orders * 100) if total_orders > 0 else 0
    }


@router.get("/sales-summary")
def get_sales_summary(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Get sales summary report."""
    since = datetime.utcnow() - timedelta(days=days)
    
    sold_devices = db.query(Device).filter(
        Device.status.in_([DeviceStatus.SOLD, DeviceStatus.SHIPPED]),
        Device.sold_date >= since
    ).all()
    
    total_sales = len(sold_devices)
    total_revenue = sum(d.sale_price or 0 for d in sold_devices)
    paid_count = len([d for d in sold_devices if d.is_paid])
    pending_payment = sum((d.sale_price or 0) for d in sold_devices if not d.is_paid)
    shipped_count = len([d for d in sold_devices if d.status == DeviceStatus.SHIPPED])
    
    return {
        "period_days": days,
        "total_sales": total_sales,
        "total_revenue": total_revenue,
        "paid_count": paid_count,
        "unpaid_count": total_sales - paid_count,
        "pending_payment_amount": pending_payment,
        "shipped_count": shipped_count,
        "shipped_rate": (shipped_count / total_sales * 100) if total_sales > 0 else 0
    }


@router.get("/devices")
def get_devices_report(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    """Get devices report with optional status filter."""
    query = db.query(Device)
    
    if status_filter:
        try:
            status_enum = DeviceStatus(status_filter)
            query = query.filter(Device.status == status_enum)
        except ValueError:
            pass
    
    devices = query.order_by(Device.created_at.desc()).all()
    
    return {
        "total": len(devices),
        "devices": [
            {
                "serial_number": d.serial_number,
                "bom_name": d.bom_name,
                "status": d.status.value if d.status else None,
                "customer_name": d.customer_name,
                "customer_company": d.customer_company,
                "sale_price": d.sale_price,
                "is_paid": d.is_paid,
                "sold_date": d.sold_date.isoformat() if d.sold_date else None,
                "dispatch_date": d.dispatch_date.isoformat() if d.dispatch_date else None,
                "tracking_number": d.tracking_number
            }
            for d in devices
        ]
    }
