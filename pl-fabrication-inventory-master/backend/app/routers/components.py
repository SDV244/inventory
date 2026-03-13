"""Component/inventory management endpoints."""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models import Component, Supplier
from app.schemas import (
    ComponentCreate, ComponentUpdate, ComponentResponse, StockAdjustment
)

router = APIRouter(prefix="/components", tags=["Components"])


@router.get("", response_model=List[ComponentResponse])
def list_components(
    skip: int = 0,
    limit: int = 1000,
    category: Optional[str] = None,
    is_active: bool = True,
    db: Session = Depends(get_db)
):
    """List all components with optional filtering."""
    query = db.query(Component).options(joinedload(Component.supplier))
    
    if category:
        query = query.filter(Component.category == category)
    
    query = query.filter(Component.is_active == is_active)
    
    return query.order_by(Component.sku).offset(skip).limit(limit).all()


@router.post("", response_model=ComponentResponse, status_code=status.HTTP_201_CREATED)
def create_component(component: ComponentCreate, db: Session = Depends(get_db)):
    """Create a new component."""
    # Validate supplier if provided
    if component.supplier_id:
        supplier = db.query(Supplier).filter(Supplier.id == component.supplier_id).first()
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Supplier {component.supplier_id} not found"
            )
    
    db_component = Component(**component.model_dump())
    
    try:
        db.add(db_component)
        db.commit()
        db.refresh(db_component)
        return db.query(Component).options(
            joinedload(Component.supplier)
        ).filter(Component.id == db_component.id).first()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Component with SKU '{component.sku}' already exists"
        )


@router.get("/{component_id}", response_model=ComponentResponse)
def get_component(component_id: int, db: Session = Depends(get_db)):
    """Get a component by ID."""
    component = db.query(Component).options(
        joinedload(Component.supplier)
    ).filter(Component.id == component_id).first()
    
    if not component:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Component {component_id} not found"
        )
    return component


@router.put("/{component_id}", response_model=ComponentResponse)
def update_component(
    component_id: int,
    component_update: ComponentUpdate,
    db: Session = Depends(get_db)
):
    """Update a component."""
    component = db.query(Component).filter(Component.id == component_id).first()
    if not component:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Component {component_id} not found"
        )
    
    # Validate supplier if being updated
    update_data = component_update.model_dump(exclude_unset=True)
    if "supplier_id" in update_data and update_data["supplier_id"]:
        supplier = db.query(Supplier).filter(Supplier.id == update_data["supplier_id"]).first()
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Supplier {update_data['supplier_id']} not found"
            )
    
    for field, value in update_data.items():
        setattr(component, field, value)
    
    component.updated_at = datetime.utcnow()
    
    try:
        db.commit()
        db.refresh(component)
        return db.query(Component).options(
            joinedload(Component.supplier)
        ).filter(Component.id == component.id).first()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Component with SKU '{update_data.get('sku')}' already exists"
        )


@router.delete("/{component_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_component(component_id: int, db: Session = Depends(get_db)):
    """Delete a component."""
    component = db.query(Component).filter(Component.id == component_id).first()
    if not component:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Component {component_id} not found"
        )
    
    db.delete(component)
    db.commit()
    return None


@router.post("/{component_id}/receive", response_model=ComponentResponse)
def receive_stock(
    component_id: int,
    adjustment: StockAdjustment,
    db: Session = Depends(get_db)
):
    """Receive stock for a component."""
    component = db.query(Component).filter(Component.id == component_id).first()
    if not component:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Component {component_id} not found"
        )
    
    component.current_stock += adjustment.quantity
    if adjustment.lot_number:
        component.lot_number = adjustment.lot_number
    component.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(component)
    return db.query(Component).options(
        joinedload(Component.supplier)
    ).filter(Component.id == component.id).first()


@router.post("/{component_id}/consume", response_model=ComponentResponse)
def consume_stock(
    component_id: int,
    adjustment: StockAdjustment,
    db: Session = Depends(get_db)
):
    """Consume stock for a component."""
    component = db.query(Component).filter(Component.id == component_id).first()
    if not component:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Component {component_id} not found"
        )
    
    if component.current_stock < adjustment.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock. Available: {component.current_stock}"
        )
    
    component.current_stock -= adjustment.quantity
    component.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(component)
    return db.query(Component).options(
        joinedload(Component.supplier)
    ).filter(Component.id == component.id).first()


@router.get("/categories/list")
def list_categories(db: Session = Depends(get_db)):
    """List all component categories."""
    categories = db.query(Component.category).distinct().filter(
        Component.category.isnot(None)
    ).all()
    return [c[0] for c in categories if c[0]]
