# PL Device Fabrication Inventory API

A complete backend system for managing photoluminescence (PL) device fabrication inventory, work orders, quality control, and device traceability.

## Features

- **Inventory Management**: Track components, suppliers, stock levels, and reorder points
- **Bill of Materials (BOM)**: Define and version product recipes with cost calculation
- **Work Order Management**: Create and track fabrication workflows with step-by-step progress
- **Quality Control**: Record quality checks at each fabrication step with pass/fail tracking
- **Device Traceability**: Full component-to-device tracking for compliance and auditing
- **Reporting**: Inventory status, production summaries, and quality metrics

## Tech Stack

- **Python 3.11+**
- **FastAPI** - Modern, fast REST API framework
- **SQLAlchemy** - ORM with relationship mapping
- **SQLite** - Portable database (no server needed)
- **Alembic** - Database migrations
- **Pydantic** - Data validation

## Quick Start

### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run Database Migrations

```bash
# Initialize database with Alembic
alembic upgrade head

# Or let FastAPI create tables automatically (development)
# Tables are created on first run
```

### 4. Start the Server

```bash
# Development
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 5. Access the API

- **API Documentation (Swagger)**: http://localhost:8000/docs
- **Alternative Docs (ReDoc)**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## API Endpoints

### Suppliers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/suppliers` | List all suppliers |
| POST | `/api/suppliers` | Create a supplier |
| GET | `/api/suppliers/{id}` | Get supplier details |
| PUT | `/api/suppliers/{id}` | Update a supplier |
| DELETE | `/api/suppliers/{id}` | Delete a supplier |

### Components (Inventory)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/components` | List components (filter by category, search) |
| POST | `/api/components` | Create a component |
| GET | `/api/components/{id}` | Get component details |
| PUT | `/api/components/{id}` | Update a component |
| DELETE | `/api/components/{id}` | Delete a component |
| GET | `/api/components/low-stock` | Get low stock alerts |
| POST | `/api/components/{id}/receive` | Receive stock |
| POST | `/api/components/{id}/consume` | Consume stock |

### Bill of Materials
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/boms` | List all BOMs |
| POST | `/api/boms` | Create a BOM |
| GET | `/api/boms/{id}` | Get BOM details |
| PUT | `/api/boms/{id}` | Update a BOM |
| DELETE | `/api/boms/{id}` | Delete a BOM |
| POST | `/api/boms/{id}/clone` | Clone BOM with new version |

### Fabrication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/fabrication-steps` | List fabrication step templates |
| POST | `/api/fabrication-steps` | Create a step template |
| PUT | `/api/fabrication-steps/{id}` | Update a step template |
| GET | `/api/work-orders` | List work orders |
| POST | `/api/work-orders` | Create a work order |
| GET | `/api/work-orders/{id}` | Get work order details |
| PUT | `/api/work-orders/{id}` | Update a work order |
| POST | `/api/work-orders/{id}/start-step` | Start next step |
| POST | `/api/work-orders/{id}/complete-step` | Complete current step |
| POST | `/api/work-orders/{id}/quality-check` | Record QC check |
| GET | `/api/work-orders/{id}/quality-checks` | List QC checks |

### Devices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/devices` | List all devices |
| POST | `/api/devices` | Create device from completed work order |
| GET | `/api/devices/{serial}` | Get device by serial number |
| PUT | `/api/devices/{serial}` | Update device |
| GET | `/api/devices/{serial}/history` | Full traceability history |
| POST | `/api/devices/{serial}/component-usage` | Add component usage |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/inventory-status` | Inventory overview and value |
| GET | `/api/reports/production-summary` | Work order statistics |
| GET | `/api/reports/quality-metrics` | QC pass rates and trends |

## Example Workflow

### 1. Set Up Suppliers and Components

```bash
# Create a supplier
curl -X POST http://localhost:8000/api/suppliers \
  -H "Content-Type: application/json" \
  -d '{"name": "Optical Components Inc", "contact_email": "sales@oci.com"}'

# Create a component
curl -X POST http://localhost:8000/api/components \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Quantum Dot Film",
    "sku": "QDF-001",
    "category": "Optical",
    "quantity_on_hand": 100,
    "reorder_point": 20,
    "unit_cost": 150.00,
    "supplier_id": 1
  }'
```

### 2. Create a Bill of Materials

```bash
curl -X POST http://localhost:8000/api/boms \
  -H "Content-Type: application/json" \
  -d '{
    "name": "PL Sensor v1",
    "version": "1.0",
    "description": "Standard PL sensor assembly",
    "items": [
      {"component_id": 1, "quantity_required": 2}
    ]
  }'
```

### 3. Define Fabrication Steps

```bash
curl -X POST http://localhost:8000/api/fabrication-steps \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Substrate Preparation",
    "sequence": 1,
    "estimated_minutes": 30,
    "requires_qc": true
  }'
```

### 4. Create and Process Work Order

```bash
# Create work order
curl -X POST http://localhost:8000/api/work-orders \
  -H "Content-Type: application/json" \
  -d '{"serial_number": "PL-2025-0001", "bom_id": 1}'

# Start first step
curl -X POST http://localhost:8000/api/work-orders/1/start-step \
  -H "Content-Type: application/json" \
  -d '{"operator": "John Smith"}'

# Record QC check
curl -X POST http://localhost:8000/api/work-orders/1/quality-check \
  -H "Content-Type: application/json" \
  -d '{
    "step_id": 1,
    "checkpoint_name": "Surface Inspection",
    "result": "pass",
    "measurements": {"roughness_nm": 2.5},
    "checked_by": "QC Team"
  }'

# Complete step
curl -X POST http://localhost:8000/api/work-orders/1/complete-step \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 5. Create Device Record

```bash
curl -X POST http://localhost:8000/api/devices \
  -H "Content-Type: application/json" \
  -d '{
    "work_order_id": 1,
    "pl_wavelength_nm": 532.5,
    "pl_intensity": 0.85,
    "component_usage": [
      {"component_id": 1, "lot_number": "LOT-2025-001", "quantity_used": 2}
    ]
  }'
```

## Configuration

Environment variables (or `.env` file):

```env
DATABASE_URL=sqlite:///./pl_inventory.db
DEBUG=false
API_PREFIX=/api
```

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Settings
│   ├── database.py          # Database connection
│   ├── models/
│   │   ├── __init__.py
│   │   └── models.py        # SQLAlchemy models
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── schemas.py       # Pydantic schemas
│   └── routers/
│       ├── __init__.py
│       ├── suppliers.py
│       ├── components.py
│       ├── boms.py
│       ├── fabrication.py
│       ├── devices.py
│       └── reports.py
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│       └── 20250101_000000_initial_schema.py
├── alembic.ini
├── requirements.txt
└── README.md
```

## Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest tests/ -v
```

## License

MIT
