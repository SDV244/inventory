"""Bill of Materials management endpoints."""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models import BillOfMaterials, BOMItem, Component, BOMStatus
from app.schemas import (
    BOMCreate, BOMUpdate, BOMResponse, BOMItemCreate
)

router = APIRouter(prefix="/boms", tags=["Bill of Materials"])


def calculate_bom_cost(db: Session, items: List[BOMItem]) -> float:
    """Calculate total cost of a BOM."""
    total = 0.0
    for item in items:
        component = db.query(Component).filter(Component.id == item.component_id).first()
        if component:
            total += component.unit_cost * item.quantity
    return total


@router.get("", response_model=List[BOMResponse])
def list_boms(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    """List all BOMs."""
    query = db.query(BillOfMaterials).options(
        joinedload(BillOfMaterials.items).joinedload(BOMItem.component)
    )
    
    if status_filter:
        try:
            status_enum = BOMStatus(status_filter)
            query = query.filter(BillOfMaterials.status == status_enum)
        except ValueError:
            pass
    
    return query.order_by(BillOfMaterials.name).offset(skip).limit(limit).all()


@router.post("", response_model=BOMResponse, status_code=status.HTTP_201_CREATED)
def create_bom(bom: BOMCreate, db: Session = Depends(get_db)):
    """Create a new BOM."""
    # Calculate total cost
    total_cost = 0.0
    for item in bom.items:
        component = db.query(Component).filter(Component.id == item.component_id).first()
        if not component:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Component {item.component_id} not found"
            )
        total_cost += component.unit_cost * item.quantity
    
    db_bom = BillOfMaterials(
        name=bom.name,
        version=bom.version,
        description=bom.description,
        status=BOMStatus.DRAFT,
        total_cost=total_cost,
        created_by="Current User"
    )
    
    try:
        db.add(db_bom)
        db.flush()
        
        # Add items
        for item in bom.items:
            db_item = BOMItem(
                bom_id=db_bom.id,
                component_id=item.component_id,
                quantity=item.quantity,
                notes=item.notes
            )
            db.add(db_item)
        
        db.commit()
        
        return db.query(BillOfMaterials).options(
            joinedload(BillOfMaterials.items).joinedload(BOMItem.component)
        ).filter(BillOfMaterials.id == db_bom.id).first()
        
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"BOM with name '{bom.name}' version '{bom.version}' already exists"
        )


@router.get("/{bom_id}", response_model=BOMResponse)
def get_bom(bom_id: int, db: Session = Depends(get_db)):
    """Get a BOM by ID."""
    bom = db.query(BillOfMaterials).options(
        joinedload(BillOfMaterials.items).joinedload(BOMItem.component)
    ).filter(BillOfMaterials.id == bom_id).first()
    
    if not bom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"BOM {bom_id} not found"
        )
    return bom


@router.put("/{bom_id}", response_model=BOMResponse)
def update_bom(
    bom_id: int,
    bom_update: BOMUpdate,
    db: Session = Depends(get_db)
):
    """Update a BOM."""
    bom = db.query(BillOfMaterials).filter(BillOfMaterials.id == bom_id).first()
    if not bom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"BOM {bom_id} not found"
        )
    
    update_data = bom_update.model_dump(exclude_unset=True)
    
    # Handle items separately if provided
    items_data = update_data.pop("items", None)
    
    for field, value in update_data.items():
        setattr(bom, field, value)
    
    # Update items if provided
    if items_data is not None:
        # Delete existing items
        db.query(BOMItem).filter(BOMItem.bom_id == bom_id).delete()
        
        # Calculate new total cost and add items
        total_cost = 0.0
        for item_data in items_data:
            component = db.query(Component).filter(Component.id == item_data.component_id).first()
            if not component:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Component {item_data.component_id} not found"
                )
            total_cost += component.unit_cost * item_data.quantity
            
            db_item = BOMItem(
                bom_id=bom_id,
                component_id=item_data.component_id,
                quantity=item_data.quantity,
                notes=item_data.notes
            )
            db.add(db_item)
        
        bom.total_cost = total_cost
    
    bom.updated_at = datetime.utcnow()
    
    try:
        db.commit()
        return db.query(BillOfMaterials).options(
            joinedload(BillOfMaterials.items).joinedload(BOMItem.component)
        ).filter(BillOfMaterials.id == bom.id).first()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"BOM with name '{update_data.get('name')}' version '{update_data.get('version')}' already exists"
        )


@router.delete("/{bom_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bom(bom_id: int, db: Session = Depends(get_db)):
    """Delete a BOM."""
    bom = db.query(BillOfMaterials).filter(BillOfMaterials.id == bom_id).first()
    if not bom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"BOM {bom_id} not found"
        )
    
    db.delete(bom)
    db.commit()
    return None


@router.post("/{bom_id}/activate", response_model=BOMResponse)
def activate_bom(bom_id: int, db: Session = Depends(get_db)):
    """Activate a BOM."""
    bom = db.query(BillOfMaterials).filter(BillOfMaterials.id == bom_id).first()
    if not bom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"BOM {bom_id} not found"
        )
    
    bom.status = BOMStatus.ACTIVE
    bom.updated_at = datetime.utcnow()
    db.commit()
    
    return db.query(BillOfMaterials).options(
        joinedload(BillOfMaterials.items).joinedload(BOMItem.component)
    ).filter(BillOfMaterials.id == bom.id).first()
