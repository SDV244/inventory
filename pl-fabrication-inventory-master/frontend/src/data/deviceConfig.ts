// BioPanel PBM LTP15-Plus Device Configuration
// BioCellux - MDV
// Photobiomodulation device for pain therapy

export const DEVICE_CONFIG = {
  name: "BioPanel PBM LTP15-Plus",
  company: "BioCellux - MDV",
  description: "Dispositivo de fotobiomodulación para tratamiento del dolor",
  wavelengths: {
    red: 660,      // nm - visible red
    nir: 850,      // nm - near-infrared
    tolerance: 10  // ±nm acceptable range
  },
  productionTarget: 30 // units per month
};

export const COMPONENT_CATEGORIES = [
  // MATERIAS PRIMAS PRODUCCION
  { id: "AS", name: "Accesorios", icon: "🔧", description: "Correas, Tensores, Guías, Pines, Etiquetas, Cintas, Espaciadores, Disipadores, Pegantes, Soldadura" },
  { id: "KR", name: "Carcasa", icon: "📦", description: "Caja ABS, Señalización, DTF UV" },
  { id: "NX", name: "Conexiones", icon: "🔌", description: "Cables, Conectores, Interruptores, Puertos USB/Bluetooth" },
  { id: "EL", name: "Electrónica", icon: "⚡", description: "Componentes, LEDs, Módulos, Controles, Micros, Sensores" },
  { id: "PQ", name: "Empaque", icon: "📦", description: "Caja cartón, Bolsa Burbujas, Termo Encogible, Bolsas PET" },
  { id: "PT", name: "Potencia", icon: "🔋", description: "Baterías, Módulos Carga, Fuentes, Reguladores, Cargadores" },
  // NO MATERIAS PRIMAS
  { id: "EQ", name: "Equipos", icon: "🖥️", description: "Osciloscopios, Multímetros, Microscopio, Espectroscopio, Computadores" },
  { id: "HE", name: "Herramientas", icon: "🛠️", description: "Taladro, Brocas, Pinzas, Alicates, MotoTool, Destornilladores" },
];

export const FABRICATION_STEPS = [
  // BLOQUE J - CAJA
  { id: 1, name: "Adecuación Ranuras y Perforaciones", phase: "J-CAJA", estimatedMinutes: 20, requiresQC: false },
  { id: 2, name: "Impresión Caja ABS", phase: "J-CAJA", estimatedMinutes: 15, requiresQC: false },
  { id: 3, name: "Colocar Correas/Tensores", phase: "J-CAJA", estimatedMinutes: 10, requiresQC: false },
  { id: 4, name: "Etiqueta Serial", phase: "J-CAJA", estimatedMinutes: 5, requiresQC: false },
  { id: 5, name: "15 Orificios piso", phase: "J-CAJA", estimatedMinutes: 15, requiresQC: false },
  { id: 6, name: "Interruptor ON/OFF colocar", phase: "J-CAJA", estimatedMinutes: 10, requiresQC: false },
  { id: 7, name: "Conector DC 1.35mm colocar", phase: "J-CAJA", estimatedMinutes: 10, requiresQC: false },
  { id: 8, name: "Porta-uSwitch acrílico pegar", phase: "J-CAJA", estimatedMinutes: 10, requiresQC: false },
  { id: 9, name: "LED ext 3mm pegar con silicona", phase: "J-CAJA", estimatedMinutes: 10, requiresQC: false },
  { id: 10, name: "Señalización DTF UV", phase: "J-CAJA", estimatedMinutes: 15, requiresQC: true },
  
  // BLOQUE M - MAIN
  { id: 11, name: "Plak-Luz pegar sobre Piso", phase: "M-MAIN", estimatedMinutes: 15, requiresQC: false },
  { id: 12, name: "Colocar Espaciadores", phase: "M-MAIN", estimatedMinutes: 10, requiresQC: false },
  { id: 13, name: "Etiqueta Serial Main", phase: "M-MAIN", estimatedMinutes: 5, requiresQC: false },
  { id: 14, name: "Plak-Control pegar", phase: "M-MAIN", estimatedMinutes: 15, requiresQC: false },
  { id: 15, name: "Protocolo pruebas", phase: "M-MAIN", estimatedMinutes: 20, requiresQC: true },
  { id: 16, name: "Documentar", phase: "M-MAIN", estimatedMinutes: 10, requiresQC: false },
  
  // BLOQUE B - BATTERY
  { id: 17, name: "Fijar Batería Litio", phase: "B-BATTERY", estimatedMinutes: 10, requiresQC: false },
  { id: 18, name: "Alistar cables", phase: "B-BATTERY", estimatedMinutes: 10, requiresQC: false },
  { id: 19, name: "Soldar módulos Carga y StepUp", phase: "B-BATTERY", estimatedMinutes: 20, requiresQC: true },
  { id: 20, name: "Pegantes y UV, Disipadores", phase: "B-BATTERY", estimatedMinutes: 15, requiresQC: false },
  { id: 21, name: "Puertos USB/Bluetooth", phase: "B-BATTERY", estimatedMinutes: 15, requiresQC: true },
  
  // BLOQUE K - PACKAGE
  { id: 22, name: "Guía Usuario", phase: "K-PACKAGE", estimatedMinutes: 5, requiresQC: false },
  { id: 23, name: "Empaque Final", phase: "K-PACKAGE", estimatedMinutes: 10, requiresQC: true },
];

export const PRE_ASSEMBLY_TASKS = [
  { id: 1, name: "Cuadrados acrílico Porta-uSwitch", description: "Pegar con Cloruro de Metileno, soldar cable, meter a presión" },
  { id: 2, name: "Interruptores ON/OFF", description: "Soldar 2 hilos, colocar housing-2" },
  { id: 3, name: "Adecuación Plak-Luz", description: "Repasar orificios, estañar y soldar 4-hilos, housings-4" },
  { id: 4, name: "Trapecios acrílico", description: "Para conducir luz ROJO-AZUL indicador carga" },
  { id: 5, name: "Tubos Nylon", description: "Para conducir luz ROJO-AZUL indicador carga" },
  { id: 6, name: "Conectores DC socket 1.35mm", description: "Soldar 2 hilos conector RN" },
  { id: 7, name: "Batería Litio 18650", description: "Estañar +/-, soldar conector RN, cintas" },
  { id: 8, name: "Impresión Cajas BioCelux", description: "Llevar a imprimir" },
  { id: 9, name: "Cueritos puntas correas", description: "Colocar en puntas" },
  { id: 10, name: "Tensores en correas", description: "Cortar/pegar cintas, prensa" },
  { id: 11, name: "Espaciadores cuadrados", description: "Cortar, pegar cintas" },
  { id: 12, name: "LED Ext 3mm verde", description: "Soldar 2 hilos, colocar housing-2" },
];

export const ASSEMBLY_BLOCKS = [
  { id: "J", name: "CAJA", description: "Case Assembly", color: "#3b82f6" },
  { id: "M", name: "MAIN", description: "Main Assembly", color: "#22c55e" },
  { id: "B", name: "BATTERY", description: "Power Assembly", color: "#f59e0b" },
  { id: "K", name: "PACKAGE", description: "Packaging", color: "#8b5cf6" },
];

export const QC_CHECKPOINTS = [
  // Wavelength Tests
  { id: "wl-660", name: "660nm Wavelength Verification", step: 14, type: "wavelength", target: 660, tolerance: 10, unit: "nm" },
  { id: "wl-850", name: "850nm Wavelength Verification", step: 14, type: "wavelength", target: 850, tolerance: 10, unit: "nm" },
  
  // Visual Inspections
  { id: "caja-visual", name: "Inspección Visual Caja ABS", step: 2, type: "visual", criteria: ["Sin grietas", "Color uniforme", "Dimensiones correctas"] },
  { id: "serial-visual", name: "Etiqueta Serial", step: 4, type: "visual", criteria: ["Legible", "Bien adherida", "Serial correcto"] },
  { id: "dtf-visual", name: "Señalización DTF UV", step: 10, type: "visual", criteria: ["Sin burbujas", "Alineación correcta", "Colores vivos"] },
  
  // Electrical Tests
  { id: "plak-control", name: "Plak-Control Test", step: 13, type: "electrical", criteria: ["Continuidad OK", "Sin cortos", "Micro responde"] },
  { id: "power-test", name: "Power Circuit Test", step: 18, type: "electrical", criteria: ["Voltaje estable", "Carga funciona", "StepUp OK"] },
  
  // Functional Tests
  { id: "plak-luz", name: "Plak-Luz Function", step: 11, type: "functional", criteria: ["15 LEDs encienden", "Alternancia OK", "Intensidad correcta"] },
  { id: "protocol-test", name: "Protocolo Pruebas", step: 14, type: "functional", criteria: ["Todos los modos", "Timer funciona", "Indicadores OK"] },
  { id: "final-qc", name: "QC Test Final", step: 20, type: "functional", criteria: ["Batería carga", "USB funciona", "Todo el sistema OK"] },
];

export const DEFAULT_BOM = {
  name: "BioPanel PBM LTP15-Plus v1.0",
  components: [
    // Electrónica (EL)
    { category: "EL", name: "LED 660nm 3W SMD", quantity: 8, unitCost: 1.50 },
    { category: "EL", name: "LED 850nm 3W SMD", quantity: 7, unitCost: 2.00 },
    { category: "EL", name: "LED Ext 3mm verde", quantity: 1, unitCost: 0.10 },
    { category: "EL", name: "Microcontrolador ESP32", quantity: 1, unitCost: 5.00 },
    { category: "EL", name: "Plak-Luz PCB", quantity: 1, unitCost: 8.00 },
    { category: "EL", name: "Plak-Control PCB", quantity: 1, unitCost: 6.00 },
    
    // Potencia (PT)
    { category: "PT", name: "Batería Litio 18650 3.7V", quantity: 1, unitCost: 4.00 },
    { category: "PT", name: "Módulo Carga TP4056", quantity: 1, unitCost: 0.80 },
    { category: "PT", name: "Módulo StepUp MT3608", quantity: 1, unitCost: 0.70 },
    
    // Conexiones (NX)
    { category: "NX", name: "Interruptor ON/OFF", quantity: 1, unitCost: 0.30 },
    { category: "NX", name: "Conector DC 1.35mm", quantity: 1, unitCost: 0.25 },
    { category: "NX", name: "Puerto USB-C", quantity: 1, unitCost: 0.50 },
    { category: "NX", name: "Cables 22AWG (metro)", quantity: 0.5, unitCost: 0.20 },
    
    // Carcasa (KR)
    { category: "KR", name: "Caja ABS impresa", quantity: 1, unitCost: 15.00 },
    { category: "KR", name: "Señalización DTF UV", quantity: 1, unitCost: 3.00 },
    
    // Accesorios (AS)
    { category: "AS", name: "Correa elástica", quantity: 1, unitCost: 2.00 },
    { category: "AS", name: "Tensores metálicos", quantity: 2, unitCost: 0.30 },
    { category: "AS", name: "Espaciadores cuadrados", quantity: 4, unitCost: 0.10 },
    { category: "AS", name: "Porta-uSwitch acrílico", quantity: 1, unitCost: 0.50 },
    { category: "AS", name: "Etiqueta Serial", quantity: 1, unitCost: 0.20 },
    { category: "AS", name: "Cueritos puntas correas", quantity: 2, unitCost: 0.15 },
    
    // Empaque (PQ)
    { category: "PQ", name: "Caja cartón presentación", quantity: 1, unitCost: 2.50 },
    { category: "PQ", name: "Bolsa burbujas", quantity: 1, unitCost: 0.30 },
    { category: "PQ", name: "Guía Usuario impresa", quantity: 1, unitCost: 0.50 },
  ]
};
