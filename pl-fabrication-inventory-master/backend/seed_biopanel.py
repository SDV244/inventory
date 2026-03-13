"""Seed script for BioPanel PBM LTP15-Plus - BioCellux MDV."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timezone, timedelta
from app.database import SessionLocal, engine, Base
from app.models.models import (
    Supplier, Component, BillOfMaterials, BOMItem, BOMStatus,
    FabricationStep, WorkOrder, WorkOrderStep, WorkOrderStatus, StepStatus,
    Device, DeviceStatus
)

def utc_now():
    return datetime.now(timezone.utc)

def seed_database():
    """Populate the database with BioPanel PBM LTP15-Plus inventory."""
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Clear existing data
        db.query(WorkOrderStep).delete()
        db.query(Device).delete()
        db.query(WorkOrder).delete()
        db.query(BOMItem).delete()
        db.query(BillOfMaterials).delete()
        db.query(FabricationStep).delete()
        db.query(Component).delete()
        db.query(Supplier).delete()
        db.commit()
        
        print("🏭 Creando proveedores...")
        suppliers = [
            Supplier(name="Proveedor Electrónica A", contact_email="ventas@electronicaa.com", phone="+57-300-1234567", address="Bogotá, Colombia"),
            Supplier(name="Proveedor LEDs B", contact_email="ventas@ledsb.com", phone="+57-301-2345678", address="Medellín, Colombia"),
            Supplier(name="Proveedor Baterías C", contact_email="ventas@bateriasc.com", phone="+57-302-3456789", address="Cali, Colombia"),
            Supplier(name="Proveedor Plásticos D", contact_email="ventas@plasticosd.com", phone="+57-303-4567890", address="Barranquilla, Colombia"),
            Supplier(name="Proveedor Empaques E", contact_email="ventas@empaquese.com", phone="+57-304-5678901", address="Bucaramanga, Colombia"),
        ]
        db.add_all(suppliers)
        db.commit()
        
        print("📦 Creando componentes por categoría...")
        
        components = []
        
        # ==========================================
        # AS - ACCESORIOS
        # ==========================================
        components.extend([
            Component(sku="AS-COR-001", name="Correas ajustables", description="Correas para sujeción del panel", category="AS-Accesorios", unit_cost=5.00, current_stock=100, min_stock=20, reorder_point=30, location="Estante A1", supplier_id=4),
            Component(sku="AS-TEN-001", name="Tensores plásticos", description="Tensores para correas", category="AS-Accesorios", unit_cost=1.50, current_stock=200, min_stock=50, reorder_point=75, location="Estante A1", supplier_id=4),
            Component(sku="AS-GUI-001", name="Guía de Usuario impresa", description="Manual de instrucciones BioPanel", category="AS-Accesorios", unit_cost=2.00, current_stock=150, min_stock=30, reorder_point=50, location="Estante A2", supplier_id=5),
            Component(sku="AS-PIN-001", name="Pines de Frecuencia", description="Pines selectores de frecuencia", category="AS-Accesorios", unit_cost=0.80, current_stock=300, min_stock=80, reorder_point=100, location="Estante A2", supplier_id=1),
            Component(sku="AS-ETQ-001", name="Etiqueta Serial", description="Etiqueta con número de serie", category="AS-Accesorios", unit_cost=0.50, current_stock=500, min_stock=100, reorder_point=150, location="Estante A3", supplier_id=5),
            Component(sku="AS-CIN-001", name="Cinta de ensamble", description="Cinta para ensamble y enmascarar", category="AS-Accesorios", unit_cost=8.00, current_stock=30, min_stock=5, reorder_point=10, location="Estante A3", supplier_id=4),
            Component(sku="AS-ESP-001", name="Espaciadores cuadrados", description="Espaciadores de separación", category="AS-Accesorios", unit_cost=0.30, current_stock=400, min_stock=100, reorder_point=150, location="Estante A4", supplier_id=4),
            Component(sku="AS-DIS-001", name="Disipadores de calor", description="Disipadores térmicos pequeños", category="AS-Accesorios", unit_cost=2.50, current_stock=100, min_stock=25, reorder_point=40, location="Estante A4", supplier_id=1),
            Component(sku="AS-VOI-001", name="Tiras Void seguridad", description="Cintas de seguridad void", category="AS-Accesorios", unit_cost=0.40, current_stock=200, min_stock=50, reorder_point=75, location="Estante A5", supplier_id=5),
            Component(sku="AS-PEG-001", name="Pegante UV", description="Adhesivo curable con UV", category="AS-Accesorios", unit_cost=25.00, current_stock=10, min_stock=2, reorder_point=4, location="Estante A5", supplier_id=4),
            Component(sku="AS-CLO-001", name="Cloruro de Metileno", description="Solvente para pegar acrílico", category="AS-Accesorios", unit_cost=15.00, current_stock=8, min_stock=2, reorder_point=3, location="Estante A6", supplier_id=4),
            Component(sku="AS-SIL-001", name="Silicona en barras", description="Barras de silicona caliente", category="AS-Accesorios", unit_cost=0.50, current_stock=100, min_stock=20, reorder_point=30, location="Estante A6", supplier_id=4),
            Component(sku="AS-SOL-001", name="Soldadura Estaño", description="Rollo de soldadura 60/40", category="AS-Accesorios", unit_cost=12.00, current_stock=15, min_stock=3, reorder_point=5, location="Estante A7", supplier_id=1),
            Component(sku="AS-SMD-001", name="Soldadura Líquida SMD", description="Flux y pasta para SMD", category="AS-Accesorios", unit_cost=18.00, current_stock=10, min_stock=2, reorder_point=4, location="Estante A7", supplier_id=1),
            Component(sku="AS-ACR-001", name="Cuadrados acrílico Porta-uSwitch", description="Piezas acrílico para microswitch", category="AS-Accesorios", unit_cost=1.20, current_stock=150, min_stock=30, reorder_point=50, location="Estante A8", supplier_id=4),
            Component(sku="AS-TRA-001", name="Trapecios acrílico luz", description="Conductores luz indicador carga", category="AS-Accesorios", unit_cost=0.80, current_stock=200, min_stock=40, reorder_point=60, location="Estante A8", supplier_id=4),
            Component(sku="AS-TUB-001", name="Tubos Nylon luz", description="Tubos conductores luz ROJO-AZUL", category="AS-Accesorios", unit_cost=0.60, current_stock=200, min_stock=40, reorder_point=60, location="Estante A9", supplier_id=4),
            Component(sku="AS-CUE-001", name="Cueritos puntas correas", description="Terminales de cuero para correas", category="AS-Accesorios", unit_cost=1.00, current_stock=200, min_stock=40, reorder_point=60, location="Estante A9", supplier_id=4),
        ])
        
        # ==========================================
        # KR - CARCASA
        # ==========================================
        components.extend([
            Component(sku="KR-CAJ-001", name="Caja ABS LTP15-Plus", description="Carcasa principal ABS negra", category="KR-Carcasa", unit_cost=35.00, current_stock=50, min_stock=10, reorder_point=15, location="Estante B1", supplier_id=4),
            Component(sku="KR-SEÑ-001", name="Señalización panel", description="Calcomanías de señalización", category="KR-Carcasa", unit_cost=3.00, current_stock=100, min_stock=20, reorder_point=30, location="Estante B2", supplier_id=5),
            Component(sku="KR-DTF-001", name="DTF UV impresión", description="Transfer UV para carcasa", category="KR-Carcasa", unit_cost=8.00, current_stock=60, min_stock=15, reorder_point=25, location="Estante B2", supplier_id=5),
        ])
        
        # ==========================================
        # NX - CONEXIONES
        # ==========================================
        components.extend([
            Component(sku="NX-CAB-001", name="Cable interno 4 hilos", description="Cable conexión interna", category="NX-Conexiones", unit_cost=2.50, current_stock=150, min_stock=30, reorder_point=50, location="Estante C1", supplier_id=1),
            Component(sku="NX-CAB-002", name="Cable 2 hilos", description="Cable para switches y LEDs", category="NX-Conexiones", unit_cost=1.50, current_stock=200, min_stock=40, reorder_point=60, location="Estante C1", supplier_id=1),
            Component(sku="NX-CON-001", name="Conector Housing-2", description="Conector 2 pines con housing", category="NX-Conexiones", unit_cost=0.80, current_stock=300, min_stock=60, reorder_point=100, location="Estante C2", supplier_id=1),
            Component(sku="NX-CON-002", name="Conector Housing-4", description="Conector 4 pines con housing", category="NX-Conexiones", unit_cost=1.20, current_stock=200, min_stock=40, reorder_point=60, location="Estante C2", supplier_id=1),
            Component(sku="NX-CON-003", name="Conector RN batería", description="Conector para batería", category="NX-Conexiones", unit_cost=1.00, current_stock=150, min_stock=30, reorder_point=50, location="Estante C3", supplier_id=1),
            Component(sku="NX-INT-001", name="Interruptor ON/OFF", description="Switch de encendido principal", category="NX-Conexiones", unit_cost=2.00, current_stock=100, min_stock=20, reorder_point=35, location="Estante C3", supplier_id=1),
            Component(sku="NX-INT-002", name="MicroSwitch (uSwitch)", description="Microswitch táctil", category="NX-Conexiones", unit_cost=0.50, current_stock=200, min_stock=40, reorder_point=60, location="Estante C4", supplier_id=1),
            Component(sku="NX-DCK-001", name="Conector DC Socket 1.35mm", description="Jack DC para cargador", category="NX-Conexiones", unit_cost=1.50, current_stock=120, min_stock=25, reorder_point=40, location="Estante C4", supplier_id=1),
            Component(sku="NX-USB-001", name="Puerto USB-C", description="Conector USB-C hembra", category="NX-Conexiones", unit_cost=3.50, current_stock=80, min_stock=15, reorder_point=25, location="Estante C5", supplier_id=1),
            Component(sku="NX-BLU-001", name="Módulo Bluetooth", description="Módulo BT para conectividad", category="NX-Conexiones", unit_cost=8.00, current_stock=40, min_stock=10, reorder_point=15, location="Estante C5", supplier_id=1),
        ])
        
        # ==========================================
        # EL - ELECTRÓNICA
        # ==========================================
        components.extend([
            Component(sku="EL-LED-850", name="LED 850nm IR 5W", description="LED infrarrojo 850nm alta potencia", category="EL-Electrónica", unit_cost=4.50, current_stock=200, min_stock=50, reorder_point=80, location="Estante D1", supplier_id=2),
            Component(sku="EL-LED-660", name="LED 660nm Rojo 5W", description="LED rojo 660nm alta potencia", category="EL-Electrónica", unit_cost=4.00, current_stock=200, min_stock=50, reorder_point=80, location="Estante D1", supplier_id=2),
            Component(sku="EL-LED-EXT", name="LED Ext 3mm verde", description="LED indicador externo verde", category="EL-Electrónica", unit_cost=0.30, current_stock=300, min_stock=60, reorder_point=100, location="Estante D2", supplier_id=2),
            Component(sku="EL-LED-IND", name="LED indicador carga R/A", description="LED bicolor rojo/azul carga", category="EL-Electrónica", unit_cost=0.50, current_stock=200, min_stock=40, reorder_point=60, location="Estante D2", supplier_id=2),
            Component(sku="EL-PLK-LUZ", name="Plak-Luz PCB", description="PCB principal con LEDs", category="EL-Electrónica", unit_cost=45.00, current_stock=40, min_stock=8, reorder_point=12, location="Estante D3", supplier_id=1),
            Component(sku="EL-PLK-CTR", name="Plak-Control PCB", description="PCB de control y driver", category="EL-Electrónica", unit_cost=28.00, current_stock=50, min_stock=10, reorder_point=15, location="Estante D3", supplier_id=1),
            Component(sku="EL-MCU-001", name="Microcontrolador", description="MCU principal del sistema", category="EL-Electrónica", unit_cost=6.00, current_stock=80, min_stock=15, reorder_point=25, location="Estante D4", supplier_id=1),
            Component(sku="EL-DRV-001", name="Driver LED", description="Driver de corriente para LEDs", category="EL-Electrónica", unit_cost=5.50, current_stock=100, min_stock=20, reorder_point=35, location="Estante D4", supplier_id=1),
            Component(sku="EL-SEN-001", name="Sensor temperatura", description="Sensor térmico NTC", category="EL-Electrónica", unit_cost=1.20, current_stock=150, min_stock=30, reorder_point=50, location="Estante D5", supplier_id=1),
        ])
        
        # ==========================================
        # PQ - EMPAQUE
        # ==========================================
        components.extend([
            Component(sku="PQ-CAJ-001", name="Caja cartón BioCellux", description="Caja de empaque final", category="PQ-Empaque", unit_cost=6.00, current_stock=80, min_stock=15, reorder_point=25, location="Estante E1", supplier_id=5),
            Component(sku="PQ-BUR-001", name="Bolsa burbujas", description="Protección de burbujas", category="PQ-Empaque", unit_cost=1.50, current_stock=150, min_stock=30, reorder_point=50, location="Estante E1", supplier_id=5),
            Component(sku="PQ-TER-001", name="Termo encogible", description="Film termoencogible", category="PQ-Empaque", unit_cost=0.80, current_stock=200, min_stock=40, reorder_point=60, location="Estante E2", supplier_id=5),
            Component(sku="PQ-PET-001", name="Bolsas PET", description="Bolsas plásticas PET", category="PQ-Empaque", unit_cost=0.40, current_stock=300, min_stock=60, reorder_point=100, location="Estante E2", supplier_id=5),
        ])
        
        # ==========================================
        # PT - POTENCIA
        # ==========================================
        components.extend([
            Component(sku="PT-BAT-001", name="Batería Litio 18650", description="Celda Li-ion 18650 3.7V", category="PT-Potencia", unit_cost=8.00, current_stock=100, min_stock=20, reorder_point=35, location="Estante F1", supplier_id=3),
            Component(sku="PT-CHG-001", name="Módulo Carga TP4056", description="Módulo cargador de batería", category="PT-Potencia", unit_cost=2.50, current_stock=120, min_stock=25, reorder_point=40, location="Estante F2", supplier_id=1),
            Component(sku="PT-STP-001", name="Módulo StepUp", description="Elevador de voltaje DC-DC", category="PT-Potencia", unit_cost=3.50, current_stock=100, min_stock=20, reorder_point=35, location="Estante F2", supplier_id=1),
            Component(sku="PT-REG-001", name="Regulador voltaje", description="Regulador lineal 5V", category="PT-Potencia", unit_cost=1.00, current_stock=150, min_stock=30, reorder_point=50, location="Estante F3", supplier_id=1),
            Component(sku="PT-CAR-001", name="Cargador DC 5V 2A", description="Adaptador de pared", category="PT-Potencia", unit_cost=10.00, current_stock=60, min_stock=12, reorder_point=20, location="Estante F3", supplier_id=3),
        ])
        
        db.add_all(components)
        db.commit()
        
        print("🔧 Creando pasos de fabricación...")
        
        fab_steps = [
            # PRE-ENSAMBLE
            FabricationStep(name="PRE-01: Alistar Porta-uSwitch", sequence=1, phase="Pre-Ensamble", description="Pegar cuadrados acrílico con Cloruro de Metileno, soldar cable al uSwitch, insertar a presión", estimated_minutes=10, requires_qc=False),
            FabricationStep(name="PRE-02: Alistar Interruptores ON/OFF", sequence=2, phase="Pre-Ensamble", description="Soldar 2 hilos y colocar housing-2", estimated_minutes=5, requires_qc=False),
            FabricationStep(name="PRE-03: Adecuación Plak-Luz", sequence=3, phase="Pre-Ensamble", description="Repasar orificios, estañar y soldar 4-hilos, colocar housings-4", estimated_minutes=15, requires_qc=True),
            FabricationStep(name="PRE-04: Alistar trapecios acrílico", sequence=4, phase="Pre-Ensamble", description="Preparar conductores luz ROJO-AZUL indicador carga", estimated_minutes=5, requires_qc=False),
            FabricationStep(name="PRE-05: Alistar tubos Nylon", sequence=5, phase="Pre-Ensamble", description="Cortar tubos para conducir luz indicador carga", estimated_minutes=5, requires_qc=False),
            FabricationStep(name="PRE-06: Alistar Conector DC 1.35mm", sequence=6, phase="Pre-Ensamble", description="Soldar 2 hilos con conector RN", estimated_minutes=5, requires_qc=False),
            FabricationStep(name="PRE-07: Alistar Batería 18650", sequence=7, phase="Pre-Ensamble", description="Estañar +/-, soldar conector RN, colocar cintas", estimated_minutes=8, requires_qc=True),
            FabricationStep(name="PRE-08: Alistar Correas", sequence=8, phase="Pre-Ensamble", description="Colocar cueritos, tensores, cortar y pegar cintas", estimated_minutes=10, requires_qc=False),
            FabricationStep(name="PRE-09: Cortar Espaciadores", sequence=9, phase="Pre-Ensamble", description="Cortar espaciadores cuadrados, pegar cintas", estimated_minutes=5, requires_qc=False),
            FabricationStep(name="PRE-10: Alistar LED Ext 3mm", sequence=10, phase="Pre-Ensamble", description="Soldar 2 hilos y colocar housing-2", estimated_minutes=5, requires_qc=False),
            
            # J - CAJA
            FabricationStep(name="J-01: Adecuación Caja ABS", sequence=11, phase="J-Caja", description="Realizar ranuras y perforaciones, 15 orificios piso", estimated_minutes=20, requires_qc=True),
            FabricationStep(name="J-02: Impresión Caja ABS", sequence=12, phase="J-Caja", description="Aplicar impresión/etiquetado", estimated_minutes=10, requires_qc=False),
            FabricationStep(name="J-03: Instalar Interruptor ON/OFF", sequence=13, phase="J-Caja", description="Colocar interruptor en posición", estimated_minutes=5, requires_qc=False),
            FabricationStep(name="J-04: Instalar Conector DC 1.35mm", sequence=14, phase="J-Caja", description="Colocar jack de carga", estimated_minutes=5, requires_qc=False),
            FabricationStep(name="J-05: Pegar Porta-uSwitch", sequence=15, phase="J-Caja", description="Fijar porta microswitch con adhesivo", estimated_minutes=5, requires_qc=False),
            FabricationStep(name="J-06: Instalar LED Ext 3mm", sequence=16, phase="J-Caja", description="Pegar LED externo con silicona caliente", estimated_minutes=5, requires_qc=False),
            FabricationStep(name="J-07: Instalar Correas/Tensores", sequence=17, phase="J-Caja", description="Fijar sistema de sujeción", estimated_minutes=8, requires_qc=False),
            FabricationStep(name="J-08: Colocar Etiqueta Serial", sequence=18, phase="J-Caja", description="Aplicar etiqueta con número de serie", estimated_minutes=2, requires_qc=False),
            FabricationStep(name="J-09: Señalización DTF UV", sequence=19, phase="J-Caja", description="Aplicar señalización final (último paso caja)", estimated_minutes=10, requires_qc=True),
            
            # M - MAIN
            FabricationStep(name="M-01: Pegar Plak-Luz", sequence=20, phase="M-Main", description="Fijar PCB de LEDs sobre piso", estimated_minutes=10, requires_qc=False),
            FabricationStep(name="M-02: Colocar Espaciadores", sequence=21, phase="M-Main", description="Instalar espaciadores de separación", estimated_minutes=5, requires_qc=False),
            FabricationStep(name="M-03: Pegar Plak-Control", sequence=22, phase="M-Main", description="Fijar PCB de control", estimated_minutes=10, requires_qc=False),
            FabricationStep(name="M-04: Conexiones Main", sequence=23, phase="M-Main", description="Realizar conexiones entre PCBs", estimated_minutes=15, requires_qc=True),
            
            # B - BATTERY
            FabricationStep(name="B-01: Fijar Batería Litio", sequence=24, phase="B-Battery", description="Instalar y asegurar batería 18650", estimated_minutes=5, requires_qc=False),
            FabricationStep(name="B-02: Soldar Módulo Carga", sequence=25, phase="B-Battery", description="Conectar módulo TP4056", estimated_minutes=10, requires_qc=False),
            FabricationStep(name="B-03: Soldar Módulo StepUp", sequence=26, phase="B-Battery", description="Conectar elevador de voltaje", estimated_minutes=10, requires_qc=False),
            FabricationStep(name="B-04: Instalar Disipadores", sequence=27, phase="B-Battery", description="Colocar disipadores térmicos", estimated_minutes=5, requires_qc=False),
            FabricationStep(name="B-05: Aplicar Pegantes/UV", sequence=28, phase="B-Battery", description="Fijar componentes con adhesivo UV", estimated_minutes=8, requires_qc=True),
            
            # PRUEBAS
            FabricationStep(name="QC-01: Prueba Eléctrica", sequence=29, phase="Pruebas", description="Verificar conexiones y voltajes", estimated_minutes=10, requires_qc=True),
            FabricationStep(name="QC-02: Prueba Funcional LEDs", sequence=30, phase="Pruebas", description="Verificar encendido y potencia de LEDs", estimated_minutes=10, requires_qc=True),
            FabricationStep(name="QC-03: Prueba Carga Batería", sequence=31, phase="Pruebas", description="Verificar ciclo de carga", estimated_minutes=15, requires_qc=True),
            FabricationStep(name="QC-04: Protocolo Final", sequence=32, phase="Pruebas", description="Ejecutar protocolo completo de pruebas", estimated_minutes=20, requires_qc=True),
            
            # K - PACKAGE
            FabricationStep(name="K-01: Documentar Serial", sequence=33, phase="K-Package", description="Registrar número de serie y resultados QC", estimated_minutes=5, requires_qc=False),
            FabricationStep(name="K-02: Incluir Guía Usuario", sequence=34, phase="K-Package", description="Agregar manual de instrucciones", estimated_minutes=2, requires_qc=False),
            FabricationStep(name="K-03: Incluir Accesorios", sequence=35, phase="K-Package", description="Agregar pines, cargador y correas extra", estimated_minutes=5, requires_qc=False),
            FabricationStep(name="K-04: Empaque Protección", sequence=36, phase="K-Package", description="Envolver en burbujas y bolsa PET", estimated_minutes=5, requires_qc=False),
            FabricationStep(name="K-05: Caja Final", sequence=37, phase="K-Package", description="Colocar en caja BioCellux", estimated_minutes=5, requires_qc=False),
            FabricationStep(name="K-06: Termo Encogible", sequence=38, phase="K-Package", description="Aplicar sello termoencogible", estimated_minutes=5, requires_qc=True),
        ]
        
        db.add_all(fab_steps)
        db.commit()
        
        print("📋 Creando BOM BioPanel LTP15-Plus...")
        
        bom = BillOfMaterials(
            name="BioPanel PBM LTP15-Plus",
            version="1.0",
            description="Panel de Fotobiomodulación BioCellux MDV - Modelo LTP15-Plus",
            status=BOMStatus.ACTIVE,
            total_cost=185.00,
            created_by="Ingeniería BioCellux"
        )
        db.add(bom)
        db.commit()
        
        # Get components by SKU
        comp_dict = {c.sku: c for c in db.query(Component).all()}
        
        bom_items = [
            # Accesorios
            BOMItem(bom_id=bom.id, component_id=comp_dict["AS-COR-001"].id, quantity=2, notes="Correas ajustables"),
            BOMItem(bom_id=bom.id, component_id=comp_dict["AS-TEN-001"].id, quantity=4),
            BOMItem(bom_id=bom.id, component_id=comp_dict["AS-GUI-001"].id, quantity=1),
            BOMItem(bom_id=bom.id, component_id=comp_dict["AS-PIN-001"].id, quantity=3),
            BOMItem(bom_id=bom.id, component_id=comp_dict["AS-ETQ-001"].id, quantity=2),
            BOMItem(bom_id=bom.id, component_id=comp_dict["AS-ESP-001"].id, quantity=8),
            BOMItem(bom_id=bom.id, component_id=comp_dict["AS-DIS-001"].id, quantity=2),
            BOMItem(bom_id=bom.id, component_id=comp_dict["AS-ACR-001"].id, quantity=1),
            BOMItem(bom_id=bom.id, component_id=comp_dict["AS-TRA-001"].id, quantity=2),
            BOMItem(bom_id=bom.id, component_id=comp_dict["AS-TUB-001"].id, quantity=2),
            BOMItem(bom_id=bom.id, component_id=comp_dict["AS-CUE-001"].id, quantity=4),
            # Carcasa
            BOMItem(bom_id=bom.id, component_id=comp_dict["KR-CAJ-001"].id, quantity=1),
            BOMItem(bom_id=bom.id, component_id=comp_dict["KR-SEÑ-001"].id, quantity=1),
            BOMItem(bom_id=bom.id, component_id=comp_dict["KR-DTF-001"].id, quantity=1),
            # Conexiones
            BOMItem(bom_id=bom.id, component_id=comp_dict["NX-CAB-001"].id, quantity=2),
            BOMItem(bom_id=bom.id, component_id=comp_dict["NX-CAB-002"].id, quantity=4),
            BOMItem(bom_id=bom.id, component_id=comp_dict["NX-CON-001"].id, quantity=4),
            BOMItem(bom_id=bom.id, component_id=comp_dict["NX-CON-002"].id, quantity=2),
            BOMItem(bom_id=bom.id, component_id=comp_dict["NX-CON-003"].id, quantity=2),
            BOMItem(bom_id=bom.id, component_id=comp_dict["NX-INT-001"].id, quantity=1),
            BOMItem(bom_id=bom.id, component_id=comp_dict["NX-INT-002"].id, quantity=1),
            BOMItem(bom_id=bom.id, component_id=comp_dict["NX-DCK-001"].id, quantity=1),
            # Electrónica
            BOMItem(bom_id=bom.id, component_id=comp_dict["EL-LED-850"].id, quantity=8, notes="LEDs IR principales"),
            BOMItem(bom_id=bom.id, component_id=comp_dict["EL-LED-660"].id, quantity=7, notes="LEDs rojos principales"),
            BOMItem(bom_id=bom.id, component_id=comp_dict["EL-LED-EXT"].id, quantity=1),
            BOMItem(bom_id=bom.id, component_id=comp_dict["EL-LED-IND"].id, quantity=1),
            BOMItem(bom_id=bom.id, component_id=comp_dict["EL-PLK-LUZ"].id, quantity=1),
            BOMItem(bom_id=bom.id, component_id=comp_dict["EL-PLK-CTR"].id, quantity=1),
            BOMItem(bom_id=bom.id, component_id=comp_dict["EL-DRV-001"].id, quantity=1),
            BOMItem(bom_id=bom.id, component_id=comp_dict["EL-SEN-001"].id, quantity=1),
            # Empaque
            BOMItem(bom_id=bom.id, component_id=comp_dict["PQ-CAJ-001"].id, quantity=1),
            BOMItem(bom_id=bom.id, component_id=comp_dict["PQ-BUR-001"].id, quantity=1),
            BOMItem(bom_id=bom.id, component_id=comp_dict["PQ-TER-001"].id, quantity=1),
            BOMItem(bom_id=bom.id, component_id=comp_dict["PQ-PET-001"].id, quantity=1),
            # Potencia
            BOMItem(bom_id=bom.id, component_id=comp_dict["PT-BAT-001"].id, quantity=1),
            BOMItem(bom_id=bom.id, component_id=comp_dict["PT-CHG-001"].id, quantity=1),
            BOMItem(bom_id=bom.id, component_id=comp_dict["PT-STP-001"].id, quantity=1),
            BOMItem(bom_id=bom.id, component_id=comp_dict["PT-CAR-001"].id, quantity=1),
        ]
        
        db.add_all(bom_items)
        db.commit()
        
        print("📝 Creando órdenes de trabajo de ejemplo...")
        
        steps = db.query(FabricationStep).order_by(FabricationStep.sequence).all()
        
        # WO1 - Completada
        wo1 = WorkOrder(
            order_number="WO-BP-2024-001",
            bom_id=bom.id,
            quantity=1,
            status=WorkOrderStatus.COMPLETE,
            priority="normal",
            assigned_to="Carlos Martínez",
            started_at=utc_now() - timedelta(days=5),
            completed_at=utc_now() - timedelta(days=3),
            notes="Primera unidad de producción"
        )
        db.add(wo1)
        db.commit()
        
        for step in steps:
            wo_step = WorkOrderStep(
                work_order_id=wo1.id,
                step_id=step.id,
                name=step.name,
                description=step.description,
                phase=step.phase,
                estimated_minutes=step.estimated_minutes,
                actual_minutes=step.estimated_minutes,
                requires_qc=step.requires_qc,
                status=StepStatus.COMPLETED,
                completed_by="Carlos Martínez"
            )
            db.add(wo_step)
        
        device1 = Device(
            serial_number="BP-LTP15-2024-0001",
            work_order_id=wo1.id,
            bom_name="BioPanel PBM LTP15-Plus",
            status=DeviceStatus.SOLD,
            manufactured_at=utc_now() - timedelta(days=3),
            customer_name="Clínica Bienestar",
            customer_email="compras@clinicabienestar.com",
            customer_company="Clínica Bienestar S.A.S",
            sold_date=utc_now() - timedelta(days=2),
            sale_price=450000.00,
            invoice_number="FV-2024-0156",
            is_paid=True,
            paid_date=utc_now() - timedelta(days=1)
        )
        db.add(device1)
        
        # WO2 - En progreso
        wo2 = WorkOrder(
            order_number="WO-BP-2024-002",
            bom_id=bom.id,
            quantity=1,
            status=WorkOrderStatus.IN_PROGRESS,
            priority="high",
            current_step_index=15,
            assigned_to="Ana López",
            started_at=utc_now() - timedelta(days=1),
            notes="Pedido urgente"
        )
        db.add(wo2)
        db.commit()
        
        for i, step in enumerate(steps):
            status = StepStatus.COMPLETED if i < 15 else (StepStatus.IN_PROGRESS if i == 15 else StepStatus.PENDING)
            wo_step = WorkOrderStep(
                work_order_id=wo2.id,
                step_id=step.id,
                name=step.name,
                description=step.description,
                phase=step.phase,
                estimated_minutes=step.estimated_minutes,
                requires_qc=step.requires_qc,
                status=status,
                completed_by="Ana López" if i < 15 else None
            )
            db.add(wo_step)
        
        # WO3 - En cola
        wo3 = WorkOrder(
            order_number="WO-BP-2024-003",
            bom_id=bom.id,
            quantity=2,
            status=WorkOrderStatus.QUEUED,
            priority="normal",
            notes="Lote de 2 unidades - Cliente Centro Médico Norte"
        )
        db.add(wo3)
        db.commit()
        
        for step in steps:
            wo_step = WorkOrderStep(
                work_order_id=wo3.id,
                step_id=step.id,
                name=step.name,
                description=step.description,
                phase=step.phase,
                estimated_minutes=step.estimated_minutes,
                requires_qc=step.requires_qc,
                status=StepStatus.PENDING
            )
            db.add(wo_step)
        
        db.commit()
        
        print("\n✅ Base de datos poblada exitosamente!")
        print(f"   - {len(suppliers)} proveedores")
        print(f"   - {len(components)} componentes (6 categorías)")
        print(f"   - {len(fab_steps)} pasos de fabricación (5 fases)")
        print(f"   - 1 BOM: BioPanel PBM LTP15-Plus")
        print(f"   - 3 órdenes de trabajo")
        print(f"   - 1 dispositivo completado y vendido")
        print("\n📁 Categorías:")
        print("   • AS-Accesorios (18 items)")
        print("   • KR-Carcasa (3 items)")
        print("   • NX-Conexiones (10 items)")
        print("   • EL-Electrónica (9 items)")
        print("   • PQ-Empaque (4 items)")
        print("   • PT-Potencia (5 items)")
        print("\n🔧 Fases de fabricación:")
        print("   • Pre-Ensamble (10 pasos)")
        print("   • J-Caja (9 pasos)")
        print("   • M-Main (4 pasos)")
        print("   • B-Battery (5 pasos)")
        print("   • Pruebas (4 pasos)")
        print("   • K-Package (6 pasos)")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
