# BioCellux - BioPanel PBM LTP15-Plus

## Sistema de Control de Fabricación e Inventario

Sistema web para gestión de inventario y control de fabricación del dispositivo de fotobiomodulación BioPanel PBM.

![Status](https://img.shields.io/badge/status-development-yellow)
![License](https://img.shields.io/badge/license-proprietary-red)

---

## 🎯 Descripción

BioPanel PBM LTP15-Plus es un dispositivo médico de fotobiomodulación diseñado para tratamiento del dolor mediante la emisión controlada de luz en longitudes de onda específicas (660nm rojo visible y 850nm infrarrojo cercano).

Este sistema de software proporciona:
- **Gestión de Inventario**: Control completo de componentes y materiales
- **Control de Producción**: Seguimiento de 22 pasos de fabricación
- **Trazabilidad**: Registro completo desde componentes hasta dispositivo final
- **Control de Calidad**: Verificación de especificaciones técnicas

---

## ✨ Características

### Gestión de Inventario
- 📦 8 categorías de componentes (AS, KR, NX, EL, PQ, PT, EQ, HE)
- 📊 Control de stock con alertas de reorden
- 🏭 Gestión de proveedores
- 📋 Números de lote para trazabilidad

### Bill of Materials (BOM)
- 📝 Definición de recetas de producto
- 🔄 Versionado de BOMs
- 💰 Cálculo automático de costos
- 📎 Clonación para nuevas versiones

### Control de Producción
- 🔧 22 pasos de fabricación organizados en 4 bloques:
  - **J-CAJA**: Ensamble de carcasa (pasos 1-10)
  - **M-MAIN**: Ensamble principal (pasos 11-15)
  - **B-BATTERY**: Ensamble de potencia (pasos 16-20)
  - **K-PACKAGE**: Empaque final (pasos 21-22)
- 👷 Asignación de operadores por paso
- ⏱️ Registro de tiempos de producción

### Control de Calidad
- ✅ Checkpoints de QC en pasos críticos
- 🔴 Verificación de longitud de onda 660nm (±10nm)
- 🟠 Verificación de longitud de onda 850nm (±10nm)
- 📈 Registro de resultados PASS/FAIL/CONDITIONAL

### Registro de Dispositivos
- 🏷️ Serial único por dispositivo
- 📜 Historial completo de fabricación
- 🔍 Trazabilidad de componentes usados
- 📋 Datos de calibración

### Reportes
- 📊 Estado de inventario
- 📈 Resumen de producción
- ✅ Métricas de calidad

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** - Framework UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool
- **TailwindCSS** - Estilos

### Backend
- **Python 3.11+** - Lenguaje
- **FastAPI** - Framework API REST
- **SQLAlchemy** - ORM
- **Pydantic** - Validación de datos

### Base de Datos
- **SQLite** - Base de datos portable (sin servidor)

---

## 📁 Estructura del Proyecto

```
pl-fabrication-inventory/
├── backend/                    # API Python FastAPI
│   ├── app/
│   │   ├── main.py            # Punto de entrada
│   │   ├── config.py          # Configuración
│   │   ├── database.py        # Conexión BD
│   │   ├── models/            # Modelos SQLAlchemy
│   │   ├── routers/           # Endpoints API
│   │   └── schemas/           # Schemas Pydantic
│   ├── requirements.txt       # Dependencias Python
│   └── inventory.db           # Base de datos SQLite
│
├── frontend/                   # Aplicación React
│   ├── src/
│   │   ├── components/        # Componentes UI
│   │   │   ├── ui/           # Componentes base
│   │   │   └── layout/       # Layout principal
│   │   ├── pages/            # Páginas de la app
│   │   ├── hooks/            # Custom hooks
│   │   ├── api/              # Cliente API
│   │   ├── data/             # Configuración BioCellux
│   │   └── types/            # Tipos TypeScript
│   ├── package.json          # Dependencias Node
│   └── vite.config.ts        # Configuración Vite
│
├── docs/                       # Documentación
│   ├── GUIA_INSTALACION_LOCAL.md
│   ├── API_REFERENCE.md
│   ├── USER_MANUAL.md
│   └── ARCHITECTURE.md
│
└── tests/                      # Tests
```

---

## 🚀 Inicio Rápido

### Requisitos
- Python 3.11+
- Node.js 18+
- npm o yarn

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/sebastianvaldenebro-VIP/pl-fabrication-inventory.git
cd pl-fabrication-inventory

# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (nueva terminal)
cd frontend
npm install
echo "VITE_API_BASE_URL=http://localhost:8000" > .env
npm run dev
```

### URLs de Desarrollo
- **Frontend**: http://localhost:5173
- **API**: http://localhost:8000
- **Docs API**: http://localhost:8000/docs

---

## 📖 Documentación

| Documento | Descripción |
|-----------|-------------|
| [Guía de Instalación](docs/GUIA_INSTALACION_LOCAL.md) | Instalación local paso a paso |
| [Referencia API](docs/API_REFERENCE.md) | Documentación completa de endpoints |
| [Manual de Usuario](docs/USER_MANUAL.md) | Guía de uso del sistema |
| [Arquitectura](docs/ARCHITECTURE.md) | Arquitectura técnica del sistema |

---

## 📋 Configuración del Dispositivo

### Especificaciones BioPanel PBM LTP15-Plus

| Parámetro | Valor |
|-----------|-------|
| Longitud de onda roja | 660nm ±10nm |
| Longitud de onda NIR | 850nm ±10nm |
| LEDs rojos | 8 unidades |
| LEDs NIR | 7 unidades |
| Meta producción | 30 unidades/mes |

### Categorías de Componentes

| Código | Nombre | Descripción |
|--------|--------|-------------|
| AS | Accesorios | Correas, tensores, etiquetas |
| KR | Carcasa | Caja ABS, señalización |
| NX | Conexiones | Cables, conectores, switches |
| EL | Electrónica | LEDs, PCBs, microcontroladores |
| PQ | Empaque | Cajas, bolsas, manuales |
| PT | Potencia | Baterías, módulos carga |
| EQ | Equipos | Instrumentación (no producción) |
| HE | Herramientas | Herramientas (no producción) |

---

## 🏥 BioCellux - MDV

**BioCellux** es una empresa dedicada al desarrollo de dispositivos médicos de fotobiomodulación para aplicaciones terapéuticas.

---

## 📄 Licencia

Software propietario - BioCellux MDV. Todos los derechos reservados.

---

## 📞 Contacto

Para soporte técnico o consultas sobre el sistema, contactar al equipo de desarrollo.
