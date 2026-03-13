# Guía de Instalación Local - PL Fabrication Inventory

Esta guía te ayudará a ejecutar el sistema completo (frontend + backend) en tu máquina local.

## Requisitos Previos

- **Node.js** v18+ (para el frontend)
- **Python** 3.10+ (para el backend)
- **Git**

## 1. Clonar el Repositorio

```bash
git clone https://github.com/sebastianvaldenebro-VIP/pl-fabrication-inventory.git
cd pl-fabrication-inventory
```

## 2. Configurar el Backend

```bash
# Entrar al directorio del backend
cd backend

# Crear entorno virtual
python3 -m venv venv

# Activar entorno virtual
# En Linux/Mac:
source venv/bin/activate
# En Windows:
# venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Crear la base de datos SQLite
python -c "from app.database import engine, Base; from app.models import *; Base.metadata.create_all(bind=engine)"

# Iniciar el servidor backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

El backend estará disponible en: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

## 3. Configurar el Frontend

En una **nueva terminal**:

```bash
# Entrar al directorio del frontend
cd frontend

# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npm run dev
```

El frontend estará disponible en: http://localhost:5173

## 4. Verificar la Conexión

1. Abre http://localhost:5173 en tu navegador
2. Deberías ver el dashboard vacío (sin datos aún)
3. Ve a "Inventory" y agrega un componente para probar

## 5. Cargar Datos Iniciales (Opcional)

Para cargar datos de ejemplo, puedes usar la API directamente:

```bash
# Crear un componente de ejemplo
curl -X POST http://localhost:8000/api/components \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "EL-LED-660",
    "name": "LED 660nm 3W SMD",
    "description": "LED rojo visible para fotobiomodulación",
    "category": "EL",
    "unit_of_measure": "ea",
    "unit_cost": 1.50,
    "current_stock": 100,
    "min_stock": 20,
    "max_stock": 500,
    "reorder_point": 50,
    "location": "A1-01"
  }'
```

## Estructura del Proyecto

```
pl-fabrication-inventory/
├── backend/                 # API FastAPI
│   ├── app/
│   │   ├── main.py         # Entrada principal
│   │   ├── config.py       # Configuración
│   │   ├── database.py     # Conexión SQLite
│   │   ├── models/         # Modelos SQLAlchemy
│   │   ├── routers/        # Endpoints API
│   │   └── schemas/        # Esquemas Pydantic
│   ├── requirements.txt
│   └── pl_inventory.db     # Base de datos SQLite (se crea automáticamente)
│
├── frontend/               # App React
│   ├── src/
│   │   ├── api/           # Cliente API
│   │   ├── components/    # Componentes UI
│   │   ├── hooks/         # React Query hooks
│   │   ├── pages/         # Páginas
│   │   └── types/         # TypeScript types
│   ├── .env.development   # Config desarrollo (localhost)
│   └── .env.production    # Config producción (VPS)
│
└── docs/                  # Documentación
```

## Variables de Entorno

### Frontend

El frontend usa diferentes URLs de API según el entorno:

- **Desarrollo** (`.env.development`):
  ```
  VITE_API_URL=http://localhost:8000/api
  ```

- **Producción** (`.env.production`):
  ```
  VITE_API_URL=https://jarvis.vipmedicalgroup.ai/pl-api/api
  ```

## Comandos Útiles

### Backend

```bash
# Activar entorno virtual
source venv/bin/activate

# Iniciar servidor con auto-reload
uvicorn app.main:app --reload --port 8000

# Ver logs
uvicorn app.main:app --log-level debug
```

### Frontend

```bash
# Desarrollo con hot-reload
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Lint
npm run lint
```

## Solución de Problemas

### Error: "Module not found: pydantic_settings"
```bash
pip install pydantic-settings
```

### Error: CORS
El backend está configurado para aceptar requests desde:
- http://localhost:5173
- http://localhost:3000
- https://jarvis.vipmedicalgroup.ai

### Error: Base de datos no existe
```bash
cd backend
python -c "from app.database import engine, Base; from app.models import *; Base.metadata.create_all(bind=engine)"
```

### Frontend no conecta al backend
1. Verifica que el backend esté corriendo en http://localhost:8000
2. Verifica que `.env.development` tenga `VITE_API_URL=http://localhost:8000/api`
3. Reinicia el servidor de desarrollo (`npm run dev`)

## Despliegue en Producción

El sistema está desplegado en:
- **Frontend**: https://jarvis.vipmedicalgroup.ai/pl-inventory
- **Backend API**: https://jarvis.vipmedicalgroup.ai/pl-api
- **API Docs**: https://jarvis.vipmedicalgroup.ai/pl-api/docs

Para desplegar cambios:
```bash
# Frontend
cd frontend
npm run build
# Copiar dist/ al servidor

# Backend
# Copiar archivos al servidor y reiniciar el servicio
ssh servidor "systemctl restart pl-api"
```
