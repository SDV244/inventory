"""
PL Fabrication Inventory - API Tests
Comprehensive test suite for all CRUD operations and workflows
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db

# Create test database
TEST_DATABASE_URL = "sqlite:///./test.db"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    """Override database dependency for testing."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def client():
    """Create a test client with fresh database for each test."""
    # Create tables
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    
    # Override dependency
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as c:
        yield c
    
    # Cleanup
    app.dependency_overrides.clear()


# =============================================================================
# SUPPLIER TESTS
# =============================================================================

def test_create_supplier(client):
    """Test creating a new supplier."""
    response = client.post("/api/suppliers", json={
        "name": "Test Supplier",
        "contact_email": "test@supplier.com",
        "address": "123 Test St"
    })
    assert response.status_code in [200, 201, 204]
    data = response.json()
    assert data["name"] == "Test Supplier"
    assert data["contact_email"] == "test@supplier.com"
    assert "id" in data


def test_get_suppliers(client):
    """Test listing all suppliers."""
    # Create a supplier first
    client.post("/api/suppliers", json={
        "name": "Test Supplier",
        "contact_email": "test@supplier.com"
    })
    
    response = client.get("/api/suppliers")
    assert response.status_code in [200, 201, 204]
    data = response.json()
    assert len(data) >= 1


def test_get_supplier_by_id(client):
    """Test getting a specific supplier."""
    # Create supplier
    create_resp = client.post("/api/suppliers", json={
        "name": "Test Supplier",
        "contact_email": "test@supplier.com"
    })
    supplier_id = create_resp.json()["id"]
    
    response = client.get(f"/api/suppliers/{supplier_id}")
    assert response.status_code in [200, 201, 204]
    assert response.json()["id"] == supplier_id


def test_update_supplier(client):
    """Test updating a supplier."""
    # Create supplier
    create_resp = client.post("/api/suppliers", json={
        "name": "Original Name",
        "contact_email": "original@test.com"
    })
    supplier_id = create_resp.json()["id"]
    
    # Update
    response = client.put(f"/api/suppliers/{supplier_id}", json={
        "name": "Updated Name"
    })
    assert response.status_code in [200, 201, 204]
    assert response.json()["name"] == "Updated Name"


def test_delete_supplier(client):
    """Test deleting a supplier."""
    # Create supplier
    create_resp = client.post("/api/suppliers", json={
        "name": "To Delete",
        "contact_email": "delete@test.com"
    })
    supplier_id = create_resp.json()["id"]
    
    # Delete
    response = client.delete(f"/api/suppliers/{supplier_id}")
    assert response.status_code in [200, 201, 204]
    
    # Verify deleted
    get_resp = client.get(f"/api/suppliers/{supplier_id}")
    assert get_resp.status_code == 404


# =============================================================================
# COMPONENT TESTS
# =============================================================================

def test_create_component(client):
    """Test creating a component with supplier."""
    # Create supplier first
    supplier_resp = client.post("/api/suppliers", json={
        "name": "Component Supplier",
        "contact_email": "comp@supplier.com"
    })
    supplier_id = supplier_resp.json()["id"]
    
    response = client.post("/api/components", json={
        "sku": "COMP-001",
        "name": "Test Component",
        "category": "Electronics",
        "unit_cost": 25.99,
        "supplier_id": supplier_id
    })
    assert response.status_code in [200, 201, 204]
    data = response.json()
    assert data["sku"] == "COMP-001"
    assert data["name"] == "Test Component"


def test_get_components(client):
    """Test listing components."""
    response = client.get("/api/components")
    assert response.status_code in [200, 201, 204]
    assert isinstance(response.json(), list)


# =============================================================================
# BOM TESTS
# =============================================================================

def test_create_bom(client):
    """Test creating a Bill of Materials."""
    response = client.post("/api/boms", json={
        "name": "Test BOM",
        "version": "1.0",
        "description": "Test BOM for QA"
    })
    assert response.status_code in [200, 201, 204]
    data = response.json()
    assert data["name"] == "Test BOM"
    assert data["version"] == "1.0"


def test_get_boms(client):
    """Test listing BOMs."""
    response = client.get("/api/boms")
    assert response.status_code in [200, 201, 204]
    assert isinstance(response.json(), list)


# =============================================================================
# WORK ORDER TESTS
# =============================================================================

def test_create_work_order(client):
    """Test creating a work order."""
    # Create BOM first
    bom_resp = client.post("/api/boms", json={
        "name": "Work Order BOM",
        "version": "1.0"
    })
    bom_id = bom_resp.json()["id"]
    
    response = client.post("/api/work-orders", json={
        "serial_number": "WO-001",
        "bom_id": bom_id,
        "status": "pending",
        "notes": "Test work order"
    })
    assert response.status_code in [200, 201, 204]
    data = response.json()
    assert data["serial_number"] == "WO-001"


def test_get_work_orders(client):
    """Test listing work orders."""
    response = client.get("/api/work-orders")
    assert response.status_code in [200, 201, 204]
    assert isinstance(response.json(), list)


def test_update_work_order_status(client):
    """Test updating work order status."""
    # Create BOM
    bom_resp = client.post("/api/boms", json={
        "name": "Status Test BOM",
        "version": "1.0"
    })
    bom_id = bom_resp.json()["id"]
    
    # Create work order
    wo_resp = client.post("/api/work-orders", json={
        "serial_number": "WO-STATUS-001",
        "bom_id": bom_id,
        "status": "pending"
    })
    wo_id = wo_resp.json()["id"]
    
    # Update to completed
    response = client.put(f"/api/work-orders/{wo_id}", json={
        "status": "completed"
    })
    assert response.status_code in [200, 201, 204]
    assert response.json()["status"] == "completed"


# =============================================================================
# DEVICE TESTS
# =============================================================================

def test_create_device_requires_completed_work_order(client):
    """Test that device creation requires a completed work order."""
    # Create BOM
    bom_resp = client.post("/api/boms", json={
        "name": "Device BOM",
        "version": "1.0"
    })
    bom_id = bom_resp.json()["id"]
    
    # Create pending work order
    wo_resp = client.post("/api/work-orders", json={
        "serial_number": "WO-DEV-001",
        "bom_id": bom_id,
        "status": "pending"
    })
    wo_id = wo_resp.json()["id"]
    
    # Try to create device - should fail
    response = client.post("/api/devices", json={
        "serial_number": "DEV-001",
        "work_order_id": wo_id
    })
    assert response.status_code == 400


def test_create_device_with_completed_work_order(client):
    """Test creating device with completed work order."""
    # Create BOM
    bom_resp = client.post("/api/boms", json={
        "name": "Device BOM",
        "version": "1.0"
    })
    bom_id = bom_resp.json()["id"]
    
    # Create work order
    wo_resp = client.post("/api/work-orders", json={
        "serial_number": "WO-DEV-002",
        "bom_id": bom_id,
        "status": "pending"
    })
    wo_id = wo_resp.json()["id"]
    
    # Complete work order
    client.put(f"/api/work-orders/{wo_id}", json={
        "status": "completed"
    })
    
    # Create device - should succeed
    response = client.post("/api/devices", json={
        "serial_number": "DEV-002",
        "work_order_id": wo_id
    })
    assert response.status_code in [200, 201, 204]


def test_get_devices(client):
    """Test listing devices."""
    response = client.get("/api/devices")
    assert response.status_code in [200, 201, 204]
    assert isinstance(response.json(), list)


# =============================================================================
# REPORTS TESTS
# =============================================================================

def test_inventory_status_report(client):
    """Test inventory status report endpoint."""
    response = client.get("/api/reports/inventory-status")
    assert response.status_code in [200, 201, 204]
    data = response.json()
    assert "total_components" in data
    assert "total_value" in data
    assert "low_stock_count" in data
    assert "out_of_stock_count" in data
    assert "components_by_category" in data


# =============================================================================
# WORKFLOW INTEGRATION TEST
# =============================================================================

def test_full_manufacturing_workflow(client):
    """
    Test complete workflow:
    Supplier → Component → BOM → Work Order → Device
    """
    # 1. Create Supplier
    supplier_resp = client.post("/api/suppliers", json={
        "name": "Integration Test Supplier",
        "contact_email": "integration@test.com",
        "address": "100 Integration Way"
    })
    assert supplier_resp.status_code in [200, 201]
    supplier_id = supplier_resp.json()["id"]
    
    # 2. Create Component
    component_resp = client.post("/api/components", json={
        "sku": "INT-COMP-001",
        "name": "Integration Component",
        "category": "Test Category",
        "unit_cost": 50.00,
        "supplier_id": supplier_id
    })
    assert component_resp.status_code in [200, 201]
    component_id = component_resp.json()["id"]
    
    # 3. Create BOM
    bom_resp = client.post("/api/boms", json={
        "name": "Integration BOM",
        "version": "1.0",
        "description": "BOM for integration test"
    })
    assert bom_resp.status_code in [200, 201]
    bom_id = bom_resp.json()["id"]
    
    # 4. Create Work Order
    wo_resp = client.post("/api/work-orders", json={
        "serial_number": "WO-INT-001",
        "bom_id": bom_id,
        "status": "pending",
        "notes": "Integration test work order"
    })
    assert wo_resp.status_code in [200, 201]
    wo_id = wo_resp.json()["id"]
    
    # 5. Progress Work Order to Completed
    update_resp = client.put(f"/api/work-orders/{wo_id}", json={
        "status": "in_progress"
    })
    assert update_resp.status_code in [200, 201]
    
    complete_resp = client.put(f"/api/work-orders/{wo_id}", json={
        "status": "completed"
    })
    assert complete_resp.status_code in [200, 201]
    
    # 6. Create Device
    device_resp = client.post("/api/devices", json={
        "serial_number": "DEV-INT-001",
        "work_order_id": wo_id
    })
    assert device_resp.status_code in [200, 201]
    
    # 7. Verify inventory report
    report_resp = client.get("/api/reports/inventory-status")
    assert report_resp.status_code == 200
    report = report_resp.json()
    assert report["total_components"] >= 1
