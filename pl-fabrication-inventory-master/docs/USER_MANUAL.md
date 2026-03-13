# Manual de Usuario - BioCellux BioPanel PBM

## Sistema de Control de Fabricación e Inventario

---

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Acceso al Sistema](#acceso-al-sistema)
3. [Dashboard](#dashboard)
4. [Gestión de Inventario](#gestión-de-inventario)
5. [Bill of Materials (BOM)](#bill-of-materials-bom)
6. [Producción](#producción)
7. [Dispositivos](#dispositivos)
8. [Control de Calidad](#control-de-calidad)
9. [Reportes](#reportes)
10. [Configuración](#configuración)
11. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## Introducción

### ¿Qué es este Sistema?

El Sistema de Control de Fabricación e Inventario BioCellux es una aplicación web diseñada para gestionar todo el proceso de fabricación del dispositivo médico **BioPanel PBM LTP15-Plus**.

### Funciones Principales

- **Inventario**: Control de componentes y materiales
- **BOM**: Definición de recetas de producto
- **Producción**: Seguimiento de órdenes de trabajo
- **Calidad**: Registro de verificaciones y pruebas
- **Trazabilidad**: Historial completo de cada dispositivo

### Especificaciones del Dispositivo

| Característica | Valor |
|----------------|-------|
| Modelo | BioPanel PBM LTP15-Plus |
| Longitud de onda roja | 660nm ±10nm |
| Longitud de onda NIR | 850nm ±10nm |
| LEDs rojos | 8 unidades |
| LEDs infrarrojos | 7 unidades |

---

## Acceso al Sistema

### URL de Acceso

- **Local**: http://localhost:5173
- **Red**: Consultar con el administrador

### Navegadores Compatibles

- Google Chrome (recomendado)
- Mozilla Firefox
- Microsoft Edge

### Requisitos

- Conexión a la red donde está el servidor
- Backend (API) corriendo en puerto 8000

---

## Dashboard

El Dashboard es la pantalla principal que muestra un resumen del estado del sistema.

### Métricas Principales

#### Producción
- **Dispositivos este mes**: Cantidad de dispositivos fabricados
- **En producción**: Órdenes de trabajo activas
- **Meta mensual**: Objetivo de 30 unidades/mes
- **Progreso**: Porcentaje de avance hacia la meta

#### Inventario
- **Total componentes**: Tipos de componentes registrados
- **Stock bajo**: Componentes que necesitan reabastecimiento
- **Sin stock**: Componentes agotados
- **Valor total**: Valor monetario del inventario

#### Calidad
- **Tasa de aprobación**: Porcentaje de QC aprobados
- **Verificaciones hoy**: Controles realizados en el día

### Alertas

El sistema muestra alertas para:
- ⚠️ Componentes con stock bajo
- ❌ Componentes sin stock
- 🔔 Órdenes de trabajo pendientes

---

## Gestión de Inventario

### Acceso

Click en **"Inventario"** en el menú lateral izquierdo.

### Categorías de Componentes

| Código | Nombre | Uso |
|--------|--------|-----|
| AS | Accesorios | Correas, tensores, etiquetas, pegantes |
| KR | Carcasa | Caja ABS, señalización DTF UV |
| NX | Conexiones | Cables, conectores, interruptores |
| EL | Electrónica | LEDs, PCBs, microcontroladores |
| PQ | Empaque | Cajas, bolsas, manuales |
| PT | Potencia | Baterías, módulos de carga |
| EQ | Equipos | Instrumentos (no producción) |
| HE | Herramientas | Herramientas (no producción) |

### Ver Inventario

1. La tabla muestra todos los componentes
2. Use los **filtros** para buscar:
   - Por categoría (dropdown)
   - Por nombre o SKU (campo de búsqueda)
3. Los componentes con stock bajo se marcan en **amarillo**
4. Los componentes sin stock se marcan en **rojo**

### Agregar Componente

1. Click en botón **"+ Nuevo Componente"**
2. Completar el formulario:
   - **SKU**: Código único (ej: EL-LED-660-01)
   - **Nombre**: Descripción del componente
   - **Categoría**: Seleccionar de la lista
   - **Unidad**: pcs, m, kg, etc.
   - **Cantidad**: Stock actual
   - **Punto de reorden**: Nivel mínimo de stock
   - **Costo unitario**: Precio por unidad
   - **Proveedor**: Seleccionar de la lista (opcional)
3. Click en **"Guardar"**

### Editar Componente

1. Click en el ícono de **editar** (lápiz) en la fila del componente
2. Modificar los campos necesarios
3. Click en **"Guardar"**

### Recibir Stock

Cuando llega material del proveedor:

1. Click en el ícono de **recepción** (flecha hacia abajo) en la fila
2. Ingresar:
   - **Cantidad recibida**
   - **Número de lote** (opcional pero recomendado)
   - **Notas** (ej: número de orden de compra)
3. Click en **"Confirmar"**

El stock se sumará al existente.

### Ajustar Stock

Para correcciones de inventario:

1. Click en **editar** el componente
2. Modificar el campo **"Cantidad"**
3. Agregar nota explicativa
4. Click en **"Guardar"**

### Proveedores

Para gestionar proveedores:

1. Click en pestaña **"Proveedores"**
2. **Agregar**: Click en "+ Nuevo Proveedor"
3. **Editar**: Click en el ícono de editar
4. **Eliminar**: Solo si no tiene componentes asociados

---

## Bill of Materials (BOM)

El BOM define qué componentes se necesitan para fabricar un dispositivo.

### Acceso

Click en **"BOM"** en el menú lateral.

### Ver BOMs

- Lista de todas las recetas de producto
- **Versión**: Identificador de revisión
- **Activo**: Indica si está disponible para producción
- **Costo total**: Suma de costos de componentes

### Crear BOM

1. Click en **"+ Nuevo BOM"**
2. Ingresar información básica:
   - **Nombre**: BioPanel PBM LTP15-Plus
   - **Versión**: 1.0, 1.1, 2.0, etc.
   - **Descripción**: Detalles del producto
   - **Activo**: Marcar si está listo para usar
3. Agregar componentes:
   - Seleccionar componente de la lista
   - Ingresar cantidad requerida
   - Agregar notas si es necesario
4. Click en **"Guardar"**

### Editar BOM

1. Click en el BOM para ver detalles
2. Click en **"Editar"**
3. Modificar componentes o cantidades
4. Click en **"Guardar"**

### Clonar BOM (Nueva Versión)

Cuando necesita hacer cambios manteniendo el histórico:

1. Abrir el BOM existente
2. Click en **"Clonar"**
3. Ingresar nueva versión (ej: 1.1)
4. Modificar según sea necesario
5. Click en **"Guardar"**

El BOM original permanece sin cambios.

---

## Producción

### Acceso

Click en **"Producción"** en el menú lateral.

### Proceso de Fabricación

El BioPanel PBM se fabrica en **22 pasos** organizados en **4 bloques**:

#### Bloque J - CAJA (Pasos 1-10)
1. Adecuación Ranuras y Perforaciones
2. Impresión Caja ABS *(QC)*
3. Colocar Correas/Tensores
4. Etiqueta Serial *(QC)*
5. 15 Orificios piso *(QC)*
6. Interruptor ON/OFF colocar
7. Conector DC 1.35mm colocar
8. Porta-uSwitch acrílico pegar
9. LED ext 3mm pegar
10. Señalización DTF UV *(QC)*

#### Bloque M - MAIN (Pasos 11-15)
11. Plak-Luz pegar sobre Piso *(QC)*
12. Colocar Espaciadores
13. Plak-Control pegar *(QC)*
14. Protocolo pruebas *(QC - incluye verificación de longitudes de onda)*
15. Documentar

#### Bloque B - BATTERY (Pasos 16-20)
16. Fijar Batería Litio
17. Alistar cables
18. Soldar módulos Carga y StepUp *(QC)*
19. Colocar Puertos USB/Bluetooth
20. QC Test Final *(QC)*

#### Bloque K - PACKAGE (Pasos 21-22)
21. Guía Usuario
22. Empaque Final *(QC)*

*(QC)* = Requiere control de calidad

### Crear Orden de Trabajo

1. Click en **"+ Nueva Orden"**
2. Ingresar:
   - **Serial**: Número único (ej: BP-2024-0001)
   - **BOM**: Seleccionar la receta de producto
   - **Notas**: Información adicional
3. Click en **"Crear"**

El sistema crea automáticamente los 22 pasos.

### Trabajar en una Orden

1. Click en la orden de trabajo en la lista
2. Ver el **tablero de pasos** con progreso
3. El paso actual está resaltado

#### Iniciar Paso

1. Click en **"Iniciar"** en el paso pendiente
2. Ingresar nombre del operador
3. El reloj comienza a correr

#### Completar Paso

1. Realizar el trabajo físico
2. Si requiere QC, registrar primero (ver Control de Calidad)
3. Click en **"Completar"**
4. Agregar notas si es necesario

### Estados de Orden

- **Pendiente**: Creada pero no iniciada
- **En Progreso**: Al menos un paso iniciado
- **Completada**: Todos los pasos terminados
- **Cancelada**: Orden anulada

### Visualización de Progreso

- Barra de progreso general
- Indicador de bloque actual (J, M, B, K)
- Tiempo transcurrido desde inicio
- Pasos completados / total

---

## Dispositivos

### Acceso

Click en **"Dispositivos"** en el menú lateral.

### Crear Dispositivo

Después de completar todos los pasos de producción:

1. Ir a la orden de trabajo completada
2. Click en **"Crear Dispositivo"**
3. Ingresar datos de calibración:
   - **Longitud de onda**: Valor medido (660nm)
   - **Intensidad**: Porcentaje
   - **Fecha calibración**: Fecha del test
4. Registrar componentes usados (números de lote)
5. Click en **"Crear"**

### Ver Historial de Dispositivo

1. Click en el dispositivo en la lista
2. Ver **"Historial Completo"** que incluye:
   - Datos del dispositivo
   - Orden de trabajo asociada
   - Todos los pasos realizados con tiempos
   - Todos los controles de calidad
   - Componentes usados con lotes

### Estados de Dispositivo

- **Fabricado**: Recién producido
- **QC Aprobado**: Pasó control de calidad final
- **Enviado**: Entregado al cliente
- **Devuelto**: Regresó por garantía/reparación
- **Descartado**: Dado de baja

### Trazabilidad

El sistema permite rastrear:
- Qué componentes (y lotes) se usaron
- Quién hizo cada paso
- Resultados de cada verificación
- Cuándo se hizo cada operación

---

## Control de Calidad

### Puntos de Control

Los checkpoints de QC están definidos para pasos críticos:

#### Verificaciones de Longitud de Onda
- **660nm**: Luz roja visible (±10nm tolerancia)
- **850nm**: Infrarrojo cercano (±10nm tolerancia)

#### Inspecciones Visuales
- Caja ABS sin defectos
- Etiqueta serial legible y adherida
- Señalización DTF UV correcta

#### Pruebas Eléctricas
- Plak-Control sin cortos
- Circuito de potencia funcional

#### Pruebas Funcionales
- LEDs encienden correctamente
- Modos de operación funcionan
- Batería carga y descarga normal

### Registrar Control de Calidad

1. En la orden de trabajo, paso que requiere QC
2. Click en **"Registrar QC"**
3. Completar formulario:
   - **Checkpoint**: Seleccionar verificación
   - **Resultado**: PASS / FAIL / CONDITIONAL
   - **Valor medido**: Si aplica (ej: 661nm)
   - **Inspector**: Nombre de quien verifica
   - **Notas**: Observaciones
4. Click en **"Guardar"**

### Resultados

- **PASS**: Cumple especificaciones
- **FAIL**: No cumple, requiere retrabajo
- **CONDITIONAL**: Cumple con observaciones

Si un QC resulta FAIL:
1. Documentar el problema
2. Realizar corrección
3. Registrar nuevo QC hasta obtener PASS

### Ver Historial QC

En **"Calidad"** del menú:
- Lista de todos los controles realizados
- Filtros por fecha, resultado, checkpoint
- Métricas de tasa de aprobación

---

## Reportes

### Acceso

Click en **"Reportes"** en el menú lateral.

### Reporte de Inventario

Muestra el estado actual del inventario:

- **Total de componentes**: Tipos registrados
- **Valor total**: Suma de (cantidad × costo unitario)
- **Stock bajo**: Componentes a reabastecer
- **Sin stock**: Componentes agotados
- **Por categoría**: Desglose por tipo

#### Acciones Recomendadas
- Generar órdenes de compra para stock bajo
- Verificar proveedores alternativos para agotados

### Reporte de Producción

Resumen de actividad de fabricación:

- **Período**: Últimos 30 días (configurable)
- **Órdenes totales**: Creadas en el período
- **Estado**: Pendientes / En progreso / Completadas
- **Dispositivos producidos**: Unidades terminadas
- **Tiempo promedio**: Horas para completar

#### Comparación con Meta
- Meta mensual: 30 unidades
- Progreso actual
- Proyección a fin de mes

### Reporte de Calidad

Métricas de control de calidad:

- **Verificaciones totales**: QC realizados
- **Tasa de aprobación**: % de PASS
- **Fallas por checkpoint**: Qué puntos fallan más
- **Tendencia**: Mejora o deterioro

#### Análisis
- Identificar puntos problemáticos
- Tomar acciones correctivas
- Mejorar procesos

### Exportar Reportes

1. Abrir el reporte deseado
2. Click en **"Exportar"**
3. Seleccionar formato (PDF, Excel)
4. El archivo se descarga

---

## Configuración

### Acceso

Click en **"Configuración"** en el menú lateral (ícono de engranaje).

### Pasos de Fabricación

Modificar la secuencia de producción:

1. Ver lista de pasos actuales
2. **Editar**: Cambiar nombre, tiempo estimado, requerimiento de QC
3. **Activar/Desactivar**: Pasos obsoletos pueden desactivarse

> ⚠️ **Precaución**: Cambiar pasos afecta nuevas órdenes. Las existentes mantienen su configuración original.

### Categorías de Componentes

Las categorías están predefinidas y no se modifican frecuentemente.

### Checkpoints de Calidad

Modificar puntos de control:

1. Ver lista de checkpoints
2. Editar valores objetivo y tolerancias
3. Asociar a pasos específicos

---

## Preguntas Frecuentes

### ¿Cómo corrijo un error en el inventario?

Edite el componente y ajuste la cantidad. Agregue una nota explicando la corrección.

### ¿Puedo eliminar una orden de trabajo?

No, pero puede cancelarla. Las órdenes se mantienen para trazabilidad.

### ¿Qué pasa si un QC falla?

El paso no se puede completar hasta registrar un QC aprobado. Corrija el problema y registre nuevo QC.

### ¿Cómo veo el historial de un dispositivo específico?

En **Dispositivos**, busque el serial y click en **"Ver Historial"**.

### ¿Puedo cambiar el BOM de una orden en progreso?

No, el BOM se fija al crear la orden. Cree una nueva orden con el BOM correcto.

### ¿Cómo agrego un nuevo proveedor?

En **Inventario** > pestaña **Proveedores** > **"+ Nuevo Proveedor"**.

### ¿Los reportes se actualizan en tiempo real?

Sí, cada vez que abre un reporte muestra datos actuales.

### ¿Cómo respaldo los datos?

Copie el archivo `backend/inventory.db` a una ubicación segura. Ver [Guía de Instalación](GUIA_INSTALACION_LOCAL.md#respaldo-de-datos).

### ¿Varios usuarios pueden usar el sistema?

Sí, el sistema es multi-usuario. Cada quien puede tener una sesión abierta.

### ¿Funciona sin internet?

Sí, si el servidor está en la red local. No requiere conexión a internet.

---

## Soporte

Para asistencia técnica:

1. Consulte esta documentación
2. Revise la [Guía de Instalación](GUIA_INSTALACION_LOCAL.md) para problemas técnicos
3. Contacte al equipo de desarrollo

### Reportar un Problema

Incluya:
- Descripción del problema
- Pasos para reproducirlo
- Capturas de pantalla
- Mensajes de error (si los hay)

---

## Glosario

| Término | Definición |
|---------|------------|
| **BOM** | Bill of Materials - Lista de componentes para fabricar un producto |
| **QC** | Quality Control - Control de calidad |
| **SKU** | Stock Keeping Unit - Código único de componente |
| **NIR** | Near Infrared - Infrarrojo cercano (850nm) |
| **Orden de Trabajo** | Work Order - Instrucción para fabricar un dispositivo |
| **Trazabilidad** | Capacidad de rastrear el origen y proceso de un producto |
| **PBM** | Photobiomodulation - Fotobiomodulación |

---

*Manual de Usuario v1.0 - BioCellux BioPanel PBM*
*Última actualización: Marzo 2024*
