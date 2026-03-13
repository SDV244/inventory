// Core domain types for PL Device Fabrication Inventory

export type StockLevel = 'critical' | 'low' | 'adequate' | 'high';

export type ComponentCategory = 
  | 'AS'  // Accesorios
  | 'KR'  // Carcasa
  | 'NX'  // Conexiones
  | 'EL'  // Electrónica
  | 'PQ'  // Empaque
  | 'PT'  // Potencia
  | 'EQ'  // Equipos
  | 'HE'  // Herramientas
  | 'OT'; // Otros

export interface Component {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: ComponentCategory;
  unitOfMeasure: string;
  unitCost: number;
  currentStock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  location: string;
  supplier?: string;
  leadTimeDays: number;
  lotNumber?: string;
  expirationDate?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BOMItem {
  componentId: string;
  component?: Component;
  quantity: number;
  notes?: string;
}

export interface BillOfMaterials {
  id: string;
  name: string;
  version: string;
  description: string;
  items: BOMItem[];
  totalCost: number;
  status: 'draft' | 'active' | 'deprecated';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type WorkOrderStatus = 'queued' | 'in-progress' | 'qc' | 'complete' | 'failed';

export interface WorkOrderStep {
  id: string;
  name: string;
  description: string;
  estimatedMinutes: number;
  actualMinutes?: number;
  status: 'pending' | 'in-progress' | 'complete' | 'skipped';
  completedAt?: string;
  completedBy?: string;
  notes?: string;
}

export interface WorkOrder {
  id: string;
  orderNumber: string;
  bomId: string;
  bom?: BillOfMaterials;
  deviceSerial?: string;
  deviceSerials?: string[];
  status: WorkOrderStatus;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  quantity: number;
  steps: WorkOrderStep[];
  currentStepIndex: number;
  startedAt?: string;
  completedAt?: string;
  assignedTo?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PLCharacteristics {
  peakWavelength: number; // nm
  intensity: number; // relative units
  fwhm: number; // Full Width at Half Maximum in nm
  colorTemperature?: number; // Kelvin
  cri?: number; // Color Rendering Index
  efficacy?: number; // lm/W
}

export interface QCMeasurement {
  parameter: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  passed: boolean;
}

export interface QCRecord {
  id: string;
  deviceId: string;
  workOrderId: string;
  performedAt: string;
  performedBy: string;
  passed: boolean;
  measurements: QCMeasurement[];
  notes?: string;
  defectCodes?: string[];
}

export interface CustomerInfo {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
}

export interface Device {
  id: string;
  serialNumber: string;
  bomId?: string;
  bomName?: string;
  bom?: BillOfMaterials;
  workOrderId: string;
  workOrder?: WorkOrder;
  status: 'in-production' | 'qc-pending' | 'qc-passed' | 'qc-failed' | 'shipped' | 'sold' | 'rma';
  plCharacteristics?: PLCharacteristics;
  manufactureDate?: string;
  shippedDate?: string;
  // Sales information
  customer?: CustomerInfo;
  soldDate?: string;
  salePrice?: number;
  invoiceNumber?: string;
  isPaid?: boolean;
  paidDate?: string;
  dispatchDate?: string;
  trackingNumber?: string;
  // Standard fields
  componentLots?: ComponentLot[];
  qcRecords: QCRecord[];
  buildHistory: BuildEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface ComponentLot {
  componentId: string;
  component?: Component;
  lotNumber: string;
  quantity: number;
}

export interface BuildEvent {
  id: string;
  timestamp: string;
  eventType: 'created' | 'step-complete' | 'qc-pass' | 'qc-fail' | 'shipped' | 'sold' | 'note';
  description: string;
  userId?: string;
  performedBy?: string;
  data?: Record<string, unknown>;
}

export interface StockTransaction {
  id: string;
  componentId: string;
  component?: Component;
  type: 'receive' | 'consume' | 'adjust' | 'return';
  quantity: number;
  previousStock: number;
  newStock: number;
  lotNumber?: string;
  reference?: string;
  notes?: string;
  performedBy: string;
  performedAt: string;
}

export interface CalibrationRecord {
  id: string;
  equipmentId: string;
  equipmentName: string;
  calibratedAt: string;
  calibratedBy: string;
  nextCalibrationDue: string;
  passed: boolean;
  certificate?: string;
  notes?: string;
}

export interface ActivityFeedItem {
  id: string;
  timestamp: string;
  type: 'production' | 'inventory' | 'quality' | 'system';
  title: string;
  description: string;
  icon?: string;
  link?: string;
}

export interface DashboardMetrics {
  totalInventoryValue: number;
  wipCount: number;
  devicesProducedToday: number;
  yieldRate: number;
  lowStockAlerts: number;
  pendingQC: number;
}

export interface ProductionStats {
  date: string;
  produced: number;
  passed: number;
  failed: number;
}

export interface DefectAnalysis {
  defectCode: string;
  defectName: string;
  count: number;
  percentage: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'operator' | 'technician' | 'engineer' | 'manager' | 'admin';
  avatar?: string;
}
