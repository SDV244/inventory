# Arquitectura del Sistema - BioCellux BioPanel PBM

## Sistema de Control de Fabricación e Inventario

---

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Arquitectura de Alto Nivel](#arquitectura-de-alto-nivel)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Backend](#backend)
5. [Frontend](#frontend)
6. [Base de Datos](#base-de-datos)
7. [Flujos de Datos](#flujos-de-datos)
8. [Seguridad](#seguridad)
9. [Despliegue](#despliegue)
10. [Consideraciones Futuras](#consideraciones-futuras)

---

## Visión General

### Propósito

Sistema integral para gestionar el proceso de fabricación del dispositivo médico BioPanel PBM LTP15-Plus, incluyendo:

- Control de inventario de componentes
- Definición de recetas de producto (BOM)
- Seguimiento de órdenes de trabajo
- Control de calidad con verificación de especificaciones
- Trazabilidad completa de dispositivos

### Principios de Diseño

1. **Simplicidad**: Arquitectura limpia y mantenible
2. **Portabilidad**: Base de datos SQLite sin servidor
3. **Trazabilidad**: Registro completo de operaciones
4. **Modularidad**: Componentes desacoplados
5. **Escalabilidad**: Preparado para crecer

---

## Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                        USUARIO                                   │
│                     (Navegador Web)                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    React + TypeScript                     │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │   │
│  │  │  Pages  │  │  Hooks  │  │Components│  │  Data   │    │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │   │
│  │                        Vite + TailwindCSS                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                     http://localhost:5173                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ REST API (JSON)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    FastAPI (Python)                       │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │   │
│  │  │ Routers │  │ Schemas │  │ Models  │  │ Config  │    │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │   │
│  │                      SQLAlchemy ORM                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                     http://localhost:8000                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ SQL
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BASE DE DATOS                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                      SQLite                               │   │
│  │                   inventory.db                            │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Stack Tecnológico

### Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 18.x | Framework UI |
| TypeScript | 5.x | Tipado estático |
| Vite | 5.x | Build tool y dev server |
| TailwindCSS | 3.x | Framework CSS utility-first |
| React Router | 6.x | Enrutamiento SPA |
| Axios | 1.x | Cliente HTTP |

### Backend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Python | 3.11+ | Lenguaje |
| FastAPI | 0.109+ | Framework web API |
| SQLAlchemy | 2.x | ORM |
| Pydantic | 2.x | Validación de datos |
| Uvicorn | 0.27+ | Servidor ASGI |

### Base de Datos

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| SQLite | 3.x | Base de datos embebida |

### Herramientas de Desarrollo

| Herramienta | Propósito |
|-------------|-----------|
| Git | Control de versiones |
| npm | Gestor de paquetes frontend |
| pip | Gestor de paquetes Python |
| ESLint | Linting JavaScript/TypeScript |
| Prettier | Formateo de código |

---

## Backend

### Estructura de Directorios

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # Punto de entrada FastAPI
│   ├── config.py            # Configuración de la aplicación
│   ├── database.py          # Conexión a base de datos
│   ├── models/
│   │   ├── __init__.py
│   │   └── models.py        # Modelos SQLAlchemy
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── suppliers.py     # Endpoints de proveedores
│   │   ├── components.py    # Endpoints de componentes
│   │   ├── boms.py          # Endpoints de BOM
│   │   ├── fabrication.py   # Endpoints de fabricación
│   │   ├── devices.py       # Endpoints de dispositivos
│   │   └── reports.py       # Endpoints de reportes
│   └── schemas/
│       ├── __init__.py
│       └── schemas.py       # Schemas Pydantic
├── requirements.txt         # Dependencias
├── inventory.db            # Base de datos (generada)
└── .env                    # Variables de entorno (opcional)
```

### Capas de la Aplicación

```
┌─────────────────────────────────────┐
│           ROUTERS (API)             │  ← Endpoints HTTP
├─────────────────────────────────────┤
│           SCHEMAS                   │  ← Validación entrada/salida
├─────────────────────────────────────┤
│           MODELS                    │  ← Lógica de negocio + ORM
├─────────────────────────────────────┤
│           DATABASE                  │  ← Conexión a SQLite
└─────────────────────────────────────┘
```

### Routers (Endpoints)

| Router | Prefijo | Responsabilidad |
|--------|---------|-----------------|
| suppliers | `/api/v1/suppliers` | CRUD de proveedores |
| components | `/api/v1/components` | Gestión de inventario |
| boms | `/api/v1/boms` | Bill of Materials |
| fabrication | `/api/v1/work-orders` | Órdenes de trabajo y pasos |
| devices | `/api/v1/devices` | Dispositivos finales |
| reports | `/api/v1/reports` | Reportes y métricas |

### Configuración (config.py)

```python
class Settings:
    app_name: str = "PL Fabrication Inventory"
    app_version: str = "0.1.0"
    api_prefix: str = "/api/v1"
    database_url: str = "sqlite:///./inventory.db"
```

### CORS

Configurado para permitir:
- `http://localhost:5173` (desarrollo frontend)
- `http://localhost:3000` (alternativo)
- `https://jarvis.vipmedicalgroup.ai` (producción)

---

## Frontend

### Estructura de Directorios

```
frontend/
├── src/
│   ├── main.tsx              # Punto de entrada
│   ├── App.tsx               # Componente raíz + rutas
│   ├── components/
│   │   ├── ui/               # Componentes base reutilizables
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── MetricCard.tsx
│   │   │   ├── StepTracker.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── StockIndicator.tsx
│   │   └── layout/           # Layout de la aplicación
│   │       ├── Layout.tsx
│   │       ├── Header.tsx
│   │       └── Sidebar.tsx
│   ├── pages/                # Páginas/vistas
│   │   ├── DashboardPage.tsx
│   │   ├── InventoryPage.tsx
│   │   ├── BOMPage.tsx
│   │   ├── ProductionPage.tsx
│   │   ├── DevicesPage.tsx
│   │   ├── QualityPage.tsx
│   │   ├── ReportsPage.tsx
│   │   └── SettingsPage.tsx
│   ├── hooks/                # Custom hooks (API calls)
│   │   ├── useInventory.ts
│   │   ├── useBOM.ts
│   │   ├── useProduction.ts
│   │   ├── useDevices.ts
│   │   ├── useQuality.ts
│   │   └── useDashboard.ts
│   ├── api/                  # Cliente API
│   │   └── client.ts
│   ├── data/                 # Configuración del dispositivo
│   │   ├── deviceConfig.ts   # Pasos, categorías, QC
│   │   └── mockData.ts       # Datos de prueba
│   ├── types/                # Tipos TypeScript
│   │   └── index.ts
│   └── utils/                # Utilidades
│       └── helpers.ts
├── public/                   # Archivos estáticos
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── .env
```

### Patrones de Diseño

#### 1. Custom Hooks para API

```typescript
// useInventory.ts
export function useInventory() {
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchComponents();
  }, []);
  
  const fetchComponents = async () => {
    const data = await api.get('/components');
    setComponents(data);
    setLoading(false);
  };
  
  return { components, loading, refetch: fetchComponents };
}
```

#### 2. Componentes de Presentación

Separación entre lógica (hooks) y presentación (componentes).

#### 3. Configuración Centralizada

`deviceConfig.ts` contiene toda la configuración específica del BioPanel:
- Categorías de componentes
- Pasos de fabricación
- Checkpoints de QC
- BOM por defecto

---

## Base de Datos

### Diagrama Entidad-Relación

```
┌─────────────┐       ┌─────────────────┐
│  Supplier   │──1:N──│    Component    │
└─────────────┘       └─────────────────┘
                              │
                             1:N
                              │
┌─────────────────┐   ┌─────────────────┐
│ BillOfMaterials │──M:N──│   BOMItem   │
└─────────────────┘   └─────────────────┘
        │
       1:N
        │
┌─────────────────┐   ┌─────────────────┐
│   WorkOrder     │──1:N──│WorkOrderStep │
└─────────────────┘   └─────────────────┘
        │                     │
       1:N                   N:1
        │                     │
┌─────────────────┐   ┌─────────────────┐
│  QualityCheck   │   │ FabricationStep │
└─────────────────┘   └─────────────────┘
        
┌─────────────────┐   ┌─────────────────┐
│     Device      │──1:N──│ComponentUsage│
└─────────────────┘   └─────────────────┘
```

### Tablas Principales

#### suppliers
```sql
CREATE TABLE suppliers (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    contact_name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(50),
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### components
```sql
CREATE TABLE components (
    id INTEGER PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(10),
    description TEXT,
    unit VARCHAR(20) DEFAULT 'pcs',
    quantity_on_hand DECIMAL(10,2) DEFAULT 0,
    reorder_point DECIMAL(10,2) DEFAULT 0,
    unit_cost DECIMAL(10,2),
    lot_number VARCHAR(50),
    received_date TIMESTAMP,
    supplier_id INTEGER REFERENCES suppliers(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### bill_of_materials
```sql
CREATE TABLE bill_of_materials (
    id INTEGER PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    version VARCHAR(20) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(name, version)
);
```

#### bom_items
```sql
CREATE TABLE bom_items (
    id INTEGER PRIMARY KEY,
    bom_id INTEGER REFERENCES bill_of_materials(id) ON DELETE CASCADE,
    component_id INTEGER REFERENCES components(id),
    quantity_required DECIMAL(10,2) NOT NULL,
    notes TEXT,
    UNIQUE(bom_id, component_id)
);
```

#### fabrication_steps
```sql
CREATE TABLE fabrication_steps (
    id INTEGER PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    sequence INTEGER NOT NULL,
    phase VARCHAR(50),
    block VARCHAR(10),
    estimated_minutes INTEGER,
    requires_qc BOOLEAN DEFAULT FALSE,
    qc_type VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE
);
```

#### work_orders
```sql
CREATE TABLE work_orders (
    id INTEGER PRIMARY KEY,
    serial_number VARCHAR(50) UNIQUE NOT NULL,
    bom_id INTEGER REFERENCES bill_of_materials(id),
    status VARCHAR(20) DEFAULT 'PENDING',
    current_step INTEGER,
    notes TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### work_order_steps
```sql
CREATE TABLE work_order_steps (
    id INTEGER PRIMARY KEY,
    work_order_id INTEGER REFERENCES work_orders(id) ON DELETE CASCADE,
    step_id INTEGER REFERENCES fabrication_steps(id),
    status VARCHAR(20) DEFAULT 'PENDING',
    operator VARCHAR(100),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    notes TEXT
);
```

#### quality_checks
```sql
CREATE TABLE quality_checks (
    id INTEGER PRIMARY KEY,
    work_order_id INTEGER REFERENCES work_orders(id),
    step_id INTEGER REFERENCES fabrication_steps(id),
    checkpoint_name VARCHAR(100),
    check_type VARCHAR(50),
    result VARCHAR(20),
    measured_value DECIMAL(10,4),
    target_value DECIMAL(10,4),
    tolerance DECIMAL(10,4),
    unit VARCHAR(20),
    inspector VARCHAR(100),
    notes TEXT,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### devices
```sql
CREATE TABLE devices (
    id INTEGER PRIMARY KEY,
    serial_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'MANUFACTURED',
    work_order_id INTEGER UNIQUE REFERENCES work_orders(id),
    pl_wavelength_nm DECIMAL(10,2),
    pl_intensity DECIMAL(10,2),
    calibration_date DATE,
    manufactured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);
```

#### component_usage
```sql
CREATE TABLE component_usage (
    id INTEGER PRIMARY KEY,
    device_id INTEGER REFERENCES devices(id) ON DELETE CASCADE,
    component_id INTEGER REFERENCES components(id),
    lot_number VARCHAR(50),
    quantity_used DECIMAL(10,2)
);
```

---

## Flujos de Datos

### 1. Flujo de Fabricación

```
┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐
│  Crear    │───▶│  Iniciar  │───▶│ Completar │───▶│  Crear    │
│Work Order │    │   Pasos   │    │   Pasos   │    │ Dispositivo│
└───────────┘    └───────────┘    └───────────┘    └───────────┘
                      │                │
                      ▼                ▼
                ┌───────────┐    ┌───────────┐
                │ Registrar │    │ Consumir  │
                │    QC     │    │   Stock   │
                └───────────┘    └───────────┘
```

### 2. Flujo de Inventario

```
┌───────────┐    ┌───────────┐    ┌───────────┐
│  Recibir  │───▶│  Almacenar│───▶│  Consumir │
│  Material │    │   Stock   │    │en Producción│
└───────────┘    └───────────┘    └───────────┘
      │                │               │
      ▼                ▼               ▼
┌───────────┐    ┌───────────┐    ┌───────────┐
│  Registrar│    │  Alertar  │    │  Registrar│
│   Lote    │    │Stock Bajo │    │   Uso     │
└───────────┘    └───────────┘    └───────────┘
```

### 3. Flujo de Trazabilidad

```
┌─────────────────────────────────────────────────────────────┐
│                      DISPOSITIVO                             │
│  Serial: BP-2024-0001                                       │
└─────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  WORK ORDER     │  │  QUALITY CHECKS │  │ COMPONENT USAGE │
│  - 22 pasos     │  │  - Wavelength   │  │  - Lotes        │
│  - Tiempos      │  │  - Visual       │  │  - Cantidades   │
│  - Operadores   │  │  - Electrical   │  │  - Proveedores  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## Seguridad

### Estado Actual

> ⚠️ **Nota**: El sistema actualmente no implementa autenticación ni autorización. Es adecuado para uso en red local controlada.

### Medidas Implementadas

1. **CORS**: Restricción de orígenes permitidos
2. **Validación**: Pydantic valida todos los inputs
3. **SQL Injection**: SQLAlchemy ORM previene inyección SQL
4. **Integridad**: Constraints de base de datos

### Recomendaciones Futuras

1. **Autenticación**: Implementar JWT o OAuth2
2. **Autorización**: Roles (admin, operador, QC)
3. **HTTPS**: Certificado SSL para producción
4. **Auditoría**: Log de cambios críticos
5. **Backup**: Respaldos automáticos

---

## Despliegue

### Desarrollo Local

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

### Producción (Ejemplo)

```bash
# Backend con Gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000

# Frontend - Build estático
npm run build
# Servir dist/ con nginx
```

### Docker (Futuro)

```yaml
# docker-compose.yml (propuesta)
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data
      
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

---

## Consideraciones Futuras

### Escalabilidad

1. **Base de datos**: Migrar a PostgreSQL para mayor concurrencia
2. **Cache**: Redis para sesiones y cache
3. **Workers**: Celery para tareas background
4. **CDN**: Para assets estáticos

### Funcionalidades

1. **Autenticación**: Sistema de usuarios y roles
2. **Notificaciones**: Email/SMS para alertas
3. **Integración**: ERP, contabilidad
4. **Mobile**: App móvil para piso de producción
5. **BI**: Dashboard avanzado con métricas

### Mantenibilidad

1. **Tests**: Unit tests y integration tests
2. **CI/CD**: Pipeline de despliegue automático
3. **Monitoring**: Logs centralizados, métricas
4. **Documentación**: API versionada

---

## Apéndices

### A. Variables de Entorno

```env
# Backend
DATABASE_URL=sqlite:///./inventory.db
APP_ENV=development
DEBUG=true

# Frontend
VITE_API_BASE_URL=http://localhost:8000
```

### B. Dependencias Backend (requirements.txt)

```
fastapi>=0.109.0
uvicorn>=0.27.0
sqlalchemy>=2.0.0
pydantic>=2.0.0
pydantic-settings>=2.0.0
python-multipart>=0.0.6
```

### C. Dependencias Frontend (package.json)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.0.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0"
  }
}
```

---

*Documento de Arquitectura v1.0 - BioCellux BioPanel PBM*
*Última actualización: Marzo 2024*
