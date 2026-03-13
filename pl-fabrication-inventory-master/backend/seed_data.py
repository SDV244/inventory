"""Seed script to populate the database with sample inventory and work order data."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timezone, timedelta
from app.database import SessionLocal, engine, Base
from app.models.models import (
    Supplier, Component, BillOfMaterials, BOMItem, BOMStatus,
    FabricationStep, WorkOrder, WorkOrderStep, WorkOrderStatus, StepStatus,
    Device, DeviceStatus, QualityCheck, QCResult
)

def utc_now():
    return datetime.now(timezone.utc)

def seed_database():
    """Populate the database with sample data."""
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Clear existing data
        db.query(QualityCheck).delete()
        db.query(WorkOrderStep).delete()
        db.query(Device).delete()
        db.query(WorkOrder).delete()
        db.query(BOMItem).delete()
        db.query(BillOfMaterials).delete()
        db.query(FabricationStep).delete()
        db.query(Component).delete()
        db.query(Supplier).delete()
        db.commit()
        
        print("Creating suppliers...")
        suppliers = [
            Supplier(name="DigiKey Electronics", contact_email="sales@digikey.com", phone="+1-800-344-4539", address="701 Brooks Ave S, Thief River Falls, MN 56701"),
            Supplier(name="Mouser Electronics", contact_email="sales@mouser.com", phone="+1-800-346-6873", address="1000 N Main St, Mansfield, TX 76063"),
            Supplier(name="Thorlabs Inc", contact_email="sales@thorlabs.com", phone="+1-973-300-3000", address="56 Sparta Ave, Newton, NJ 07860"),
            Supplier(name="Newport Corporation", contact_email="sales@newport.com", phone="+1-800-222-6440", address="1791 Deere Ave, Irvine, CA 92606"),
            Supplier(name="Edmund Optics", contact_email="sales@edmundoptics.com", phone="+1-856-547-3488", address="101 E Gloucester Pike, Barrington, NJ 08007"),
        ]
        db.add_all(suppliers)
        db.commit()
        
        print("Creating components...")
        components = [
            # Optical components
            Component(sku="OPT-LED-405", name="405nm UV LED Module", description="High-power 405nm UV LED for PL excitation", category="Optical", unit_cost=45.00, current_stock=50, min_stock=10, reorder_point=15, location="Shelf A1", supplier_id=3),
            Component(sku="OPT-LED-450", name="450nm Blue LED Module", description="High-power 450nm blue LED module", category="Optical", unit_cost=38.00, current_stock=75, min_stock=15, reorder_point=20, location="Shelf A1", supplier_id=3),
            Component(sku="OPT-FILT-LP500", name="500nm Longpass Filter", description="Optical longpass filter, cuts below 500nm", category="Optical", unit_cost=125.00, current_stock=30, min_stock=5, reorder_point=8, location="Shelf A2", supplier_id=5),
            Component(sku="OPT-FILT-BP550", name="550nm Bandpass Filter", description="50nm bandwidth bandpass filter centered at 550nm", category="Optical", unit_cost=185.00, current_stock=20, min_stock=5, reorder_point=8, location="Shelf A2", supplier_id=5),
            Component(sku="OPT-LENS-COL", name="Collimating Lens Assembly", description="Aspheric collimating lens, AR coated", category="Optical", unit_cost=75.00, current_stock=40, min_stock=10, reorder_point=15, location="Shelf A3", supplier_id=4),
            Component(sku="OPT-LENS-FOC", name="Focusing Lens 25mm", description="25mm focal length focusing lens", category="Optical", unit_cost=55.00, current_stock=45, min_stock=10, reorder_point=15, location="Shelf A3", supplier_id=4),
            
            # Electronic components
            Component(sku="ELEC-DRV-LED", name="LED Driver Board", description="Constant current LED driver, adjustable 100-500mA", category="Electronics", unit_cost=28.00, current_stock=60, min_stock=15, reorder_point=20, location="Shelf B1", supplier_id=1),
            Component(sku="ELEC-MCU-ESP32", name="ESP32 Microcontroller", description="ESP32-WROOM-32 module for device control", category="Electronics", unit_cost=8.50, current_stock=100, min_stock=25, reorder_point=30, location="Shelf B2", supplier_id=1),
            Component(sku="ELEC-SENS-SPEC", name="Spectrometer Module", description="Compact spectrometer 350-800nm range", category="Electronics", unit_cost=320.00, current_stock=15, min_stock=3, reorder_point=5, location="Shelf B3", supplier_id=3),
            Component(sku="ELEC-PSU-12V", name="12V Power Supply", description="12V 3A regulated power supply", category="Electronics", unit_cost=18.00, current_stock=80, min_stock=20, reorder_point=25, location="Shelf B4", supplier_id=2),
            Component(sku="ELEC-CONN-USB", name="USB-C Connector Board", description="USB-C connector with ESD protection", category="Electronics", unit_cost=4.50, current_stock=150, min_stock=40, reorder_point=50, location="Shelf B5", supplier_id=1),
            Component(sku="ELEC-DISP-OLED", name="OLED Display 1.3in", description="128x64 OLED display module, I2C", category="Electronics", unit_cost=12.00, current_stock=65, min_stock=15, reorder_point=20, location="Shelf B6", supplier_id=2),
            
            # Mechanical components
            Component(sku="MECH-CASE-STD", name="Standard Enclosure", description="Aluminum enclosure 150x100x50mm, black anodized", category="Mechanical", unit_cost=35.00, current_stock=40, min_stock=10, reorder_point=15, location="Shelf C1", supplier_id=2),
            Component(sku="MECH-CASE-PRO", name="Pro Enclosure", description="Premium aluminum enclosure with heatsink fins", category="Mechanical", unit_cost=65.00, current_stock=25, min_stock=5, reorder_point=8, location="Shelf C1", supplier_id=2),
            Component(sku="MECH-BRKT-OPT", name="Optical Rail Bracket", description="Precision optical mounting bracket", category="Mechanical", unit_cost=22.00, current_stock=55, min_stock=15, reorder_point=20, location="Shelf C2", supplier_id=4),
            Component(sku="MECH-SCRW-KIT", name="Fastener Kit M3", description="M3 screw assortment (100pcs)", category="Mechanical", unit_cost=8.00, current_stock=30, min_stock=5, reorder_point=8, location="Shelf C3", supplier_id=2),
            Component(sku="MECH-GSKT-SIL", name="Silicone Gasket Set", description="IP65 rated silicone gasket kit", category="Mechanical", unit_cost=6.50, current_stock=45, min_stock=10, reorder_point=15, location="Shelf C4", supplier_id=2),
            
            # Cables and connectors
            Component(sku="CABL-PWR-INT", name="Internal Power Cable", description="Internal power distribution cable 200mm", category="Cables", unit_cost=3.50, current_stock=120, min_stock=30, reorder_point=40, location="Shelf D1", supplier_id=1),
            Component(sku="CABL-SIG-FFC", name="FFC Signal Cable", description="20-pin FFC cable for display", category="Cables", unit_cost=2.50, current_stock=100, min_stock=25, reorder_point=35, location="Shelf D2", supplier_id=1),
            Component(sku="CABL-USB-C", name="USB-C Cable 1m", description="USB-C to USB-A cable, 1 meter", category="Cables", unit_cost=5.00, current_stock=80, min_stock=20, reorder_point=30, location="Shelf D3", supplier_id=2),
        ]
        db.add_all(components)
        db.commit()
        
        print("Creating fabrication steps...")
        fab_steps = [
            FabricationStep(name="Incoming Inspection", sequence=1, phase="Preparation", description="Verify all components against BOM", estimated_minutes=15, requires_qc=True),
            FabricationStep(name="PCB Assembly", sequence=2, phase="Assembly", description="Assemble main control PCB", estimated_minutes=45, requires_qc=False),
            FabricationStep(name="Optical Assembly", sequence=3, phase="Assembly", description="Mount optical components on rail", estimated_minutes=30, requires_qc=True),
            FabricationStep(name="LED Module Install", sequence=4, phase="Assembly", description="Install and align LED module", estimated_minutes=20, requires_qc=False),
            FabricationStep(name="Wiring Harness", sequence=5, phase="Assembly", description="Install internal wiring", estimated_minutes=25, requires_qc=False),
            FabricationStep(name="Enclosure Assembly", sequence=6, phase="Assembly", description="Mount components in enclosure", estimated_minutes=20, requires_qc=False),
            FabricationStep(name="Firmware Flash", sequence=7, phase="Programming", description="Flash firmware and calibration data", estimated_minutes=10, requires_qc=False),
            FabricationStep(name="Optical Alignment", sequence=8, phase="Calibration", description="Fine-tune optical alignment", estimated_minutes=30, requires_qc=True),
            FabricationStep(name="Electrical Test", sequence=9, phase="Testing", description="Verify all electrical connections", estimated_minutes=15, requires_qc=True),
            FabricationStep(name="PL Performance Test", sequence=10, phase="Testing", description="Measure PL characteristics", estimated_minutes=20, requires_qc=True),
            FabricationStep(name="Final QC", sequence=11, phase="Quality", description="Final quality inspection", estimated_minutes=15, requires_qc=True),
            FabricationStep(name="Packaging", sequence=12, phase="Shipping", description="Package device for shipping", estimated_minutes=10, requires_qc=False),
        ]
        db.add_all(fab_steps)
        db.commit()
        
        print("Creating BOMs...")
        # Standard PL Detector BOM
        bom_standard = BillOfMaterials(
            name="PL Detector Standard",
            version="2.1",
            description="Standard photoluminescence detector for general lab use",
            status=BOMStatus.ACTIVE,
            total_cost=650.00,
            created_by="Engineering"
        )
        db.add(bom_standard)
        db.commit()
        
        # Pro PL Detector BOM
        bom_pro = BillOfMaterials(
            name="PL Detector Pro",
            version="1.0",
            description="Professional-grade PL detector with spectrometer",
            status=BOMStatus.ACTIVE,
            total_cost=1250.00,
            created_by="Engineering"
        )
        db.add(bom_pro)
        db.commit()
        
        # Research PL System BOM
        bom_research = BillOfMaterials(
            name="PL Research System",
            version="1.0",
            description="High-end research-grade PL measurement system",
            status=BOMStatus.DRAFT,
            total_cost=2100.00,
            created_by="Engineering"
        )
        db.add(bom_research)
        db.commit()
        
        # Get component references
        comp_dict = {c.sku: c for c in db.query(Component).all()}
        
        # Standard BOM items
        standard_items = [
            BOMItem(bom_id=bom_standard.id, component_id=comp_dict["OPT-LED-405"].id, quantity=1, notes="Main excitation source"),
            BOMItem(bom_id=bom_standard.id, component_id=comp_dict["OPT-FILT-LP500"].id, quantity=1),
            BOMItem(bom_id=bom_standard.id, component_id=comp_dict["OPT-LENS-COL"].id, quantity=1),
            BOMItem(bom_id=bom_standard.id, component_id=comp_dict["OPT-LENS-FOC"].id, quantity=1),
            BOMItem(bom_id=bom_standard.id, component_id=comp_dict["ELEC-DRV-LED"].id, quantity=1),
            BOMItem(bom_id=bom_standard.id, component_id=comp_dict["ELEC-MCU-ESP32"].id, quantity=1),
            BOMItem(bom_id=bom_standard.id, component_id=comp_dict["ELEC-PSU-12V"].id, quantity=1),
            BOMItem(bom_id=bom_standard.id, component_id=comp_dict["ELEC-CONN-USB"].id, quantity=1),
            BOMItem(bom_id=bom_standard.id, component_id=comp_dict["ELEC-DISP-OLED"].id, quantity=1),
            BOMItem(bom_id=bom_standard.id, component_id=comp_dict["MECH-CASE-STD"].id, quantity=1),
            BOMItem(bom_id=bom_standard.id, component_id=comp_dict["MECH-BRKT-OPT"].id, quantity=2),
            BOMItem(bom_id=bom_standard.id, component_id=comp_dict["MECH-SCRW-KIT"].id, quantity=1),
            BOMItem(bom_id=bom_standard.id, component_id=comp_dict["CABL-PWR-INT"].id, quantity=2),
            BOMItem(bom_id=bom_standard.id, component_id=comp_dict["CABL-SIG-FFC"].id, quantity=1),
            BOMItem(bom_id=bom_standard.id, component_id=comp_dict["CABL-USB-C"].id, quantity=1),
        ]
        db.add_all(standard_items)
        
        # Pro BOM items
        pro_items = [
            BOMItem(bom_id=bom_pro.id, component_id=comp_dict["OPT-LED-405"].id, quantity=1),
            BOMItem(bom_id=bom_pro.id, component_id=comp_dict["OPT-LED-450"].id, quantity=1, notes="Secondary excitation"),
            BOMItem(bom_id=bom_pro.id, component_id=comp_dict["OPT-FILT-LP500"].id, quantity=1),
            BOMItem(bom_id=bom_pro.id, component_id=comp_dict["OPT-FILT-BP550"].id, quantity=1),
            BOMItem(bom_id=bom_pro.id, component_id=comp_dict["OPT-LENS-COL"].id, quantity=2),
            BOMItem(bom_id=bom_pro.id, component_id=comp_dict["OPT-LENS-FOC"].id, quantity=1),
            BOMItem(bom_id=bom_pro.id, component_id=comp_dict["ELEC-DRV-LED"].id, quantity=2),
            BOMItem(bom_id=bom_pro.id, component_id=comp_dict["ELEC-MCU-ESP32"].id, quantity=1),
            BOMItem(bom_id=bom_pro.id, component_id=comp_dict["ELEC-SENS-SPEC"].id, quantity=1, notes="Core measurement module"),
            BOMItem(bom_id=bom_pro.id, component_id=comp_dict["ELEC-PSU-12V"].id, quantity=1),
            BOMItem(bom_id=bom_pro.id, component_id=comp_dict["ELEC-CONN-USB"].id, quantity=1),
            BOMItem(bom_id=bom_pro.id, component_id=comp_dict["ELEC-DISP-OLED"].id, quantity=1),
            BOMItem(bom_id=bom_pro.id, component_id=comp_dict["MECH-CASE-PRO"].id, quantity=1),
            BOMItem(bom_id=bom_pro.id, component_id=comp_dict["MECH-BRKT-OPT"].id, quantity=3),
            BOMItem(bom_id=bom_pro.id, component_id=comp_dict["MECH-SCRW-KIT"].id, quantity=1),
            BOMItem(bom_id=bom_pro.id, component_id=comp_dict["MECH-GSKT-SIL"].id, quantity=1),
            BOMItem(bom_id=bom_pro.id, component_id=comp_dict["CABL-PWR-INT"].id, quantity=3),
            BOMItem(bom_id=bom_pro.id, component_id=comp_dict["CABL-SIG-FFC"].id, quantity=1),
            BOMItem(bom_id=bom_pro.id, component_id=comp_dict["CABL-USB-C"].id, quantity=1),
        ]
        db.add_all(pro_items)
        db.commit()
        
        print("Creating work orders...")
        steps = db.query(FabricationStep).order_by(FabricationStep.sequence).all()
        
        # Work Order 1 - Completed
        wo1 = WorkOrder(
            order_number="WO-2024-001",
            bom_id=bom_standard.id,
            quantity=1,
            status=WorkOrderStatus.COMPLETE,
            priority="normal",
            assigned_to="John Smith",
            started_at=utc_now() - timedelta(days=7),
            completed_at=utc_now() - timedelta(days=5),
            notes="First production unit"
        )
        db.add(wo1)
        db.commit()
        
        # Add completed steps for WO1
        for i, step in enumerate(steps):
            wo_step = WorkOrderStep(
                work_order_id=wo1.id,
                step_id=step.id,
                name=step.name,
                description=step.description,
                phase=step.phase,
                estimated_minutes=step.estimated_minutes,
                actual_minutes=step.estimated_minutes + (i % 3) * 5,
                requires_qc=step.requires_qc,
                status=StepStatus.COMPLETED,
                started_at=utc_now() - timedelta(days=7) + timedelta(hours=i),
                completed_at=utc_now() - timedelta(days=7) + timedelta(hours=i+1),
                completed_by="John Smith"
            )
            db.add(wo_step)
        
        # Add device for WO1
        device1 = Device(
            serial_number="PLD-STD-2024-0001",
            work_order_id=wo1.id,
            bom_name="PL Detector Standard",
            status=DeviceStatus.SOLD,
            manufactured_at=utc_now() - timedelta(days=5),
            pl_characteristics={"peakWavelength": 525, "intensity": 0.92, "fwhm": 35, "efficacy": 0.88},
            qc_records=[{"id": 1, "passed": True, "performedAt": (utc_now() - timedelta(days=5)).isoformat(), "performedBy": "QC Team", "notes": "All tests passed"}],
            customer_name="Dr. Sarah Chen",
            customer_email="schen@university.edu",
            customer_company="State University",
            sold_date=utc_now() - timedelta(days=4),
            sale_price=1200.00,
            invoice_number="INV-2024-0042",
            is_paid=True,
            paid_date=utc_now() - timedelta(days=3),
            shipped_date=utc_now() - timedelta(days=2),
            tracking_number="1Z999AA10123456784"
        )
        db.add(device1)
        
        # Work Order 2 - In Progress
        wo2 = WorkOrder(
            order_number="WO-2024-002",
            bom_id=bom_pro.id,
            quantity=1,
            status=WorkOrderStatus.IN_PROGRESS,
            priority="high",
            current_step_index=5,
            assigned_to="Maria Garcia",
            started_at=utc_now() - timedelta(days=2),
            notes="Rush order for research lab"
        )
        db.add(wo2)
        db.commit()
        
        # Add steps for WO2 (partially completed)
        for i, step in enumerate(steps):
            status = StepStatus.COMPLETED if i < 5 else (StepStatus.IN_PROGRESS if i == 5 else StepStatus.PENDING)
            wo_step = WorkOrderStep(
                work_order_id=wo2.id,
                step_id=step.id,
                name=step.name,
                description=step.description,
                phase=step.phase,
                estimated_minutes=step.estimated_minutes,
                actual_minutes=step.estimated_minutes if i < 5 else None,
                requires_qc=step.requires_qc,
                status=status,
                started_at=utc_now() - timedelta(days=2) + timedelta(hours=i) if i <= 5 else None,
                completed_at=utc_now() - timedelta(days=2) + timedelta(hours=i+1) if i < 5 else None,
                completed_by="Maria Garcia" if i < 5 else None
            )
            db.add(wo_step)
        
        # Work Order 3 - In QC
        wo3 = WorkOrder(
            order_number="WO-2024-003",
            bom_id=bom_standard.id,
            quantity=2,
            status=WorkOrderStatus.QC,
            priority="normal",
            current_step_index=10,
            assigned_to="John Smith",
            started_at=utc_now() - timedelta(days=4),
            notes="Batch of 2 standard units"
        )
        db.add(wo3)
        db.commit()
        
        # Add steps for WO3
        for i, step in enumerate(steps):
            status = StepStatus.COMPLETED if i < 10 else (StepStatus.IN_PROGRESS if i == 10 else StepStatus.PENDING)
            wo_step = WorkOrderStep(
                work_order_id=wo3.id,
                step_id=step.id,
                name=step.name,
                description=step.description,
                phase=step.phase,
                estimated_minutes=step.estimated_minutes,
                requires_qc=step.requires_qc,
                status=status
            )
            db.add(wo_step)
        
        # Add devices for WO3 (2 units)
        device2 = Device(
            serial_number="PLD-STD-2024-0002",
            work_order_id=wo3.id,
            bom_name="PL Detector Standard",
            status=DeviceStatus.QC_PENDING,
            manufactured_at=utc_now() - timedelta(days=1)
        )
        device3 = Device(
            serial_number="PLD-STD-2024-0003",
            work_order_id=wo3.id,
            bom_name="PL Detector Standard",
            status=DeviceStatus.QC_PENDING,
            manufactured_at=utc_now() - timedelta(days=1)
        )
        db.add_all([device2, device3])
        
        # Work Order 4 - Queued
        wo4 = WorkOrder(
            order_number="WO-2024-004",
            bom_id=bom_pro.id,
            quantity=1,
            status=WorkOrderStatus.QUEUED,
            priority="normal",
            notes="Customer order - ABC Labs"
        )
        db.add(wo4)
        db.commit()
        
        # Add pending steps for WO4
        for step in steps:
            wo_step = WorkOrderStep(
                work_order_id=wo4.id,
                step_id=step.id,
                name=step.name,
                description=step.description,
                phase=step.phase,
                estimated_minutes=step.estimated_minutes,
                requires_qc=step.requires_qc,
                status=StepStatus.PENDING
            )
            db.add(wo_step)
        
        # Work Order 5 - On Hold
        wo5 = WorkOrder(
            order_number="WO-2024-005",
            bom_id=bom_standard.id,
            quantity=3,
            status=WorkOrderStatus.ON_HOLD,
            priority="low",
            current_step_index=2,
            assigned_to="Maria Garcia",
            started_at=utc_now() - timedelta(days=10),
            notes="On hold - waiting for OPT-FILT-LP500 restock"
        )
        db.add(wo5)
        db.commit()
        
        # Add some QC records
        qc1 = QualityCheck(
            work_order_id=wo1.id,
            step_id=steps[2].id,
            checkpoint_name="Optical Alignment Check",
            result=QCResult.PASS,
            measurements={"alignment_offset": 0.02, "beam_diameter": 2.1},
            checked_by="QC Team"
        )
        qc2 = QualityCheck(
            work_order_id=wo1.id,
            step_id=steps[9].id,
            checkpoint_name="PL Performance",
            result=QCResult.PASS,
            measurements={"peak_wavelength": 525, "intensity": 0.92, "fwhm": 35},
            checked_by="QC Team"
        )
        db.add_all([qc1, qc2])
        
        db.commit()
        print("✅ Database seeded successfully!")
        print(f"   - {len(suppliers)} suppliers")
        print(f"   - {len(components)} components")
        print(f"   - {len(fab_steps)} fabrication steps")
        print(f"   - 3 BOMs (Standard, Pro, Research)")
        print(f"   - 5 work orders (various statuses)")
        print(f"   - 3 devices")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
