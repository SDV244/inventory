# API Reference - BioCellux BioPanel PBM

## 📋 Tabla de Contenidos

1. [Información General](#información-general)
2. [Autenticación](#autenticación)
3. [Proveedores](#proveedores-suppliers)
4. [Componentes](#componentes-components)
5. [Bill of Materials](#bill-of-materials-bom)
6. [Fabricación](#fabricación-fabrication)
7. [Dispositivos](#dispositivos-devices)
8. [Reportes](#reportes-reports)
9. [Códigos de Estado](#códigos-de-estado)

---

## Información General

### Base URL

```
http://localhost:8000/api/v1
```

### Formato de Respuesta

Todas las respuestas están en formato JSON.

### Documentación Interactiva

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "version": "0.1.0"
}
```

---

## Autenticación

> ⚠️ **Nota**: Actualmente el API no requiere autenticación. Esta funcionalidad se agregará en versiones futuras.

---

## Proveedores (Suppliers)

### Listar Proveedores

```http
GET /api/v1/suppliers
```

**Query Parameters:**
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| skip | integer | 0 | Registros a omitir |
| limit | integer | 100 | Máximo de registros |

**Response 200:**
```json
[
  {
    "id": 1,
    "name": "Electronics Corp",
    "contact_name": "Juan Pérez",
    "email": "juan@electronics.com",
    "phone": "+57 300 123 4567",
    "address": "Bogotá, Colombia",
    "notes": "Proveedor principal de LEDs",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

### Crear Proveedor

```http
POST /api/v1/suppliers
```

**Request Body:**
```json
{
  "name": "Electronics Corp",
  "contact_name": "Juan Pérez",
  "email": "juan@electronics.com",
  "phone": "+57 300 123 4567",
  "address": "Bogotá, Colombia",
  "notes": "Proveedor principal de LEDs"
}
```

**Response 201:** Proveedor creado

### Obtener Proveedor

```http
GET /api/v1/suppliers/{supplier_id}
```

**Response 200:** Proveedor específico
**Response 404:** Proveedor no encontrado

### Actualizar Proveedor

```http
PUT /api/v1/suppliers/{supplier_id}
```

**Request Body:** Campos a actualizar (parcial permitido)

### Eliminar Proveedor

```http
DELETE /api/v1/suppliers/{supplier_id}
```

**Response 204:** Eliminado exitosamente
**Response 409:** No se puede eliminar (tiene componentes asociados)

---

## Componentes (Components)

### Listar Componentes

```http
GET /api/v1/components
```

**Query Parameters:**
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| skip | integer | 0 | Registros a omitir |
| limit | integer | 100 | Máximo de registros |
| category | string | null | Filtrar por categoría (AS, KR, NX, EL, PQ, PT, EQ, HE) |
| search | string | null | Buscar por nombre o SKU |

**Response 200:**
```json
[
  {
    "id": 1,
    "sku": "EL-LED-660-01",
    "name": "LED 660nm 3W SMD",
    "category": "EL",
    "description": "LED rojo para fotobiomodulación",
    "unit": "pcs",
    "quantity_on_hand": 150,
    "reorder_point": 50,
    "unit_cost": 1.50,
    "lot_number": "LOT2024-001",
    "received_date": "2024-01-10T00:00:00Z",
    "supplier_id": 1,
    "supplier": {
      "id": 1,
      "name": "Electronics Corp"
    },
    "created_at": "2024-01-10T10:00:00Z",
    "updated_at": "2024-01-15T14:30:00Z"
  }
]
```

### Componentes con Stock Bajo

```http
GET /api/v1/components/low-stock
```

**Response 200:** Lista de componentes donde `quantity_on_hand <= reorder_point`

### Crear Componente

```http
POST /api/v1/components
```

**Request Body:**
```json
{
  "sku": "EL-LED-660-01",
  "name": "LED 660nm 3W SMD",
  "category": "EL",
  "description": "LED rojo para fotobiomodulación",
  "unit": "pcs",
  "quantity_on_hand": 0,
  "reorder_point": 50,
  "unit_cost": 1.50,
  "supplier_id": 1
}
```

**Categorías válidas:**
- `AS` - Accesorios
- `KR` - Carcasa
- `NX` - Conexiones
- `EL` - Electrónica
- `PQ` - Empaque
- `PT` - Potencia
- `EQ` - Equipos
- `HE` - Herramientas

### Obtener Componente

```http
GET /api/v1/components/{component_id}
```

### Actualizar Componente

```http
PUT /api/v1/components/{component_id}
```

### Eliminar Componente

```http
DELETE /api/v1/components/{component_id}
```

**Response 409:** No se puede eliminar si está usado en algún BOM

### Recibir Stock

```http
POST /api/v1/components/{component_id}/receive
```

**Request Body:**
```json
{
  "quantity": 100,
  "lot_number": "LOT2024-002",
  "notes": "Pedido #PO-2024-015"
}
```

**Response 200:** Componente actualizado con nuevo stock

### Consumir Stock

```http
POST /api/v1/components/{component_id}/consume
```

**Request Body:**
```json
{
  "quantity": 15,
  "notes": "Usado en WO-2024-001"
}
```

**Response 200:** Componente actualizado
**Response 400:** Stock insuficiente

---

## Bill of Materials (BOM)

### Listar BOMs

```http
GET /api/v1/boms
```

**Query Parameters:**
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| skip | integer | 0 | Registros a omitir |
| limit | integer | 100 | Máximo de registros |
| active_only | boolean | false | Solo BOMs activos |

**Response 200:**
```json
[
  {
    "id": 1,
    "name": "BioPanel PBM LTP15-Plus",
    "version": "1.0",
    "description": "Dispositivo de fotobiomodulación",
    "is_active": true,
    "total_cost": 52.45,
    "items": [
      {
        "id": 1,
        "component_id": 1,
        "quantity_required": 8,
        "notes": "LEDs rojos 660nm",
        "component": {
          "id": 1,
          "sku": "EL-LED-660-01",
          "name": "LED 660nm 3W SMD",
          "unit_cost": 1.50
        }
      }
    ],
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
]
```

### Crear BOM

```http
POST /api/v1/boms
```

**Request Body:**
```json
{
  "name": "BioPanel PBM LTP15-Plus",
  "version": "1.0",
  "description": "Dispositivo de fotobiomodulación",
  "is_active": true,
  "items": [
    {
      "component_id": 1,
      "quantity_required": 8,
      "notes": "LEDs rojos 660nm"
    },
    {
      "component_id": 2,
      "quantity_required": 7,
      "notes": "LEDs NIR 850nm"
    }
  ]
}
```

### Obtener BOM

```http
GET /api/v1/boms/{bom_id}
```

### Actualizar BOM

```http
PUT /api/v1/boms/{bom_id}
```

### Eliminar BOM

```http
DELETE /api/v1/boms/{bom_id}
```

**Response 409:** No se puede eliminar si tiene órdenes de trabajo asociadas

### Clonar BOM

```http
POST /api/v1/boms/{bom_id}/clone
```

**Request Body:**
```json
{
  "new_version": "1.1",
  "new_name": "BioPanel PBM LTP15-Plus"
}
```

Crea una copia del BOM con nueva versión. Útil para crear revisiones.

---

## Fabricación (Fabrication)

### Pasos de Fabricación

#### Listar Pasos Template

```http
GET /api/v1/fabrication-steps
```

**Query Parameters:**
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| active_only | boolean | true | Solo pasos activos |

**Response 200:**
```json
[
  {
    "id": 1,
    "name": "Adecuación Ranuras y Perforaciones",
    "sequence": 1,
    "phase": "CAJA",
    "block": "J",
    "estimated_minutes": 15,
    "requires_qc": false,
    "qc_type": null,
    "is_active": true
  }
]
```

**Bloques de Fabricación:**
- `J` - CAJA (pasos 1-10)
- `M` - MAIN (pasos 11-15)
- `B` - BATTERY (pasos 16-20)
- `K` - PACKAGE (pasos 21-22)

#### Crear Paso Template

```http
POST /api/v1/fabrication-steps
```

#### Actualizar Paso Template

```http
PUT /api/v1/fabrication-steps/{step_id}
```

---

### Órdenes de Trabajo

#### Listar Órdenes de Trabajo

```http
GET /api/v1/work-orders
```

**Query Parameters:**
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| skip | integer | 0 | Registros a omitir |
| limit | integer | 100 | Máximo de registros |
| status | string | null | Filtrar por estado |

**Estados válidos:**
- `PENDING` - Pendiente
- `IN_PROGRESS` - En progreso
- `COMPLETED` - Completado
- `CANCELLED` - Cancelado

**Response 200:**
```json
[
  {
    "id": 1,
    "serial_number": "BP-2024-0001",
    "bom_id": 1,
    "status": "IN_PROGRESS",
    "current_step": 5,
    "notes": "Unidad para cliente VIP",
    "started_at": "2024-01-15T08:00:00Z",
    "completed_at": null,
    "bom": {
      "id": 1,
      "name": "BioPanel PBM LTP15-Plus",
      "version": "1.0"
    },
    "steps": [
      {
        "id": 1,
        "step_id": 1,
        "status": "COMPLETED",
        "operator": "Carlos",
        "started_at": "2024-01-15T08:00:00Z",
        "completed_at": "2024-01-15T08:15:00Z",
        "notes": null,
        "step": {
          "id": 1,
          "name": "Adecuación Ranuras y Perforaciones",
          "sequence": 1,
          "phase": "CAJA"
        }
      }
    ],
    "created_at": "2024-01-15T07:45:00Z"
  }
]
```

#### Crear Orden de Trabajo

```http
POST /api/v1/work-orders
```

**Request Body:**
```json
{
  "serial_number": "BP-2024-0001",
  "bom_id": 1,
  "notes": "Unidad para cliente VIP"
}
```

Al crear una orden de trabajo, automáticamente se crean todos los pasos basados en los templates activos.

#### Obtener Orden de Trabajo

```http
GET /api/v1/work-orders/{work_order_id}
```

#### Actualizar Orden de Trabajo

```http
PUT /api/v1/work-orders/{work_order_id}
```

#### Iniciar Paso

```http
POST /api/v1/work-orders/{work_order_id}/start-step
```

**Request Body:**
```json
{
  "operator": "Carlos",
  "notes": "Iniciando paso"
}
```

Inicia el siguiente paso pendiente. Cambia el estado de la orden a `IN_PROGRESS` si es el primer paso.

#### Completar Paso

```http
POST /api/v1/work-orders/{work_order_id}/complete-step
```

**Request Body:**
```json
{
  "notes": "Paso completado sin problemas"
}
```

**Response 400:** Si el paso requiere QC y no se ha registrado.

#### Registrar Control de Calidad

```http
POST /api/v1/work-orders/{work_order_id}/quality-check
```

**Request Body:**
```json
{
  "step_id": 14,
  "checkpoint_name": "660nm Wavelength Verification",
  "check_type": "wavelength",
  "result": "PASS",
  "measured_value": 662.5,
  "target_value": 660,
  "tolerance": 10,
  "unit": "nm",
  "inspector": "María",
  "notes": "Dentro de tolerancia"
}
```

**Resultados válidos:**
- `PASS` - Aprobado
- `FAIL` - Rechazado
- `CONDITIONAL` - Aprobado con condiciones

#### Listar Controles de Calidad

```http
GET /api/v1/work-orders/{work_order_id}/quality-checks
```

---

## Dispositivos (Devices)

### Listar Dispositivos

```http
GET /api/v1/devices
```

**Query Parameters:**
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| skip | integer | 0 | Registros a omitir |
| limit | integer | 100 | Máximo de registros |
| status | string | null | Filtrar por estado |

**Estados válidos:**
- `MANUFACTURED` - Fabricado
- `QC_PASSED` - QC aprobado
- `SHIPPED` - Enviado
- `RETURNED` - Devuelto
- `SCRAPPED` - Descartado

**Response 200:**
```json
[
  {
    "id": 1,
    "serial_number": "BP-2024-0001",
    "status": "QC_PASSED",
    "work_order_id": 1,
    "pl_wavelength_nm": 660.5,
    "pl_intensity": 95.2,
    "calibration_date": "2024-01-15T00:00:00Z",
    "manufactured_at": "2024-01-15T16:30:00Z",
    "notes": "Unidad premium",
    "work_order": {
      "id": 1,
      "serial_number": "BP-2024-0001"
    },
    "component_usage": [
      {
        "id": 1,
        "component_id": 1,
        "lot_number": "LOT2024-001",
        "quantity_used": 8,
        "component": {
          "id": 1,
          "sku": "EL-LED-660-01",
          "name": "LED 660nm 3W SMD"
        }
      }
    ]
  }
]
```

### Crear Dispositivo

```http
POST /api/v1/devices
```

**Request Body:**
```json
{
  "work_order_id": 1,
  "pl_wavelength_nm": 660.5,
  "pl_intensity": 95.2,
  "calibration_date": "2024-01-15",
  "notes": "Unidad premium",
  "component_usage": [
    {
      "component_id": 1,
      "lot_number": "LOT2024-001",
      "quantity_used": 8
    }
  ]
}
```

**Response 400:** La orden de trabajo debe estar completada

### Obtener Dispositivo

```http
GET /api/v1/devices/{serial}
```

### Actualizar Dispositivo

```http
PUT /api/v1/devices/{serial}
```

### Historial del Dispositivo

```http
GET /api/v1/devices/{serial}/history
```

**Response 200:**
```json
{
  "device": { /* datos del dispositivo */ },
  "work_order": { /* datos de la orden de trabajo */ },
  "quality_checks": [ /* todos los QC realizados */ ],
  "component_usage": [ /* componentes usados con detalles */ ]
}
```

Proporciona trazabilidad completa del dispositivo.

### Agregar Uso de Componente

```http
POST /api/v1/devices/{serial}/component-usage
```

**Request Body:**
```json
{
  "component_id": 5,
  "lot_number": "LOT2024-003",
  "quantity_used": 1
}
```

---

## Reportes (Reports)

### Estado de Inventario

```http
GET /api/v1/reports/inventory-status
```

**Response 200:**
```json
{
  "total_components": 45,
  "total_value": 2345.67,
  "low_stock_count": 5,
  "out_of_stock_count": 2,
  "components_by_category": {
    "EL": 15,
    "PT": 8,
    "NX": 10,
    "AS": 7,
    "KR": 3,
    "PQ": 2
  }
}
```

### Resumen de Producción

```http
GET /api/v1/reports/production-summary
```

**Query Parameters:**
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| days | integer | 30 | Período en días (1-365) |

**Response 200:**
```json
{
  "total_work_orders": 15,
  "pending": 2,
  "in_progress": 3,
  "completed": 9,
  "cancelled": 1,
  "devices_produced": 9,
  "avg_completion_time_hours": 4.5
}
```

### Métricas de Calidad

```http
GET /api/v1/reports/quality-metrics
```

**Query Parameters:**
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| days | integer | 30 | Período en días (1-365) |

**Response 200:**
```json
{
  "total_checks": 45,
  "pass_count": 42,
  "fail_count": 2,
  "conditional_count": 1,
  "pass_rate": 93.33,
  "checks_by_checkpoint": {
    "660nm Wavelength Verification": {
      "PASS": 14,
      "FAIL": 1
    },
    "850nm Wavelength Verification": {
      "PASS": 15
    }
  }
}
```

---

## Códigos de Estado

| Código | Descripción |
|--------|-------------|
| 200 | Éxito |
| 201 | Creado |
| 204 | Sin contenido (eliminación exitosa) |
| 400 | Error de validación / Solicitud inválida |
| 404 | Recurso no encontrado |
| 409 | Conflicto (duplicado, restricción de integridad) |
| 500 | Error interno del servidor |

### Formato de Error

```json
{
  "detail": "Descripción del error"
}
```

---

## Ejemplos de Uso

### Flujo Completo de Fabricación

```bash
# 1. Crear orden de trabajo
curl -X POST http://localhost:8000/api/v1/work-orders \
  -H "Content-Type: application/json" \
  -d '{"serial_number":"BP-2024-0010","bom_id":1}'

# 2. Iniciar primer paso
curl -X POST http://localhost:8000/api/v1/work-orders/1/start-step \
  -H "Content-Type: application/json" \
  -d '{"operator":"Carlos"}'

# 3. Completar paso
curl -X POST http://localhost:8000/api/v1/work-orders/1/complete-step \
  -H "Content-Type: application/json" \
  -d '{"notes":"OK"}'

# 4. Registrar QC cuando se requiere
curl -X POST http://localhost:8000/api/v1/work-orders/1/quality-check \
  -H "Content-Type: application/json" \
  -d '{"step_id":14,"checkpoint_name":"660nm Wavelength","check_type":"wavelength","result":"PASS","measured_value":661,"inspector":"María"}'

# 5. Crear dispositivo final
curl -X POST http://localhost:8000/api/v1/devices \
  -H "Content-Type: application/json" \
  -d '{"work_order_id":1,"pl_wavelength_nm":661}'
```

---

*Última actualización: Marzo 2024*
