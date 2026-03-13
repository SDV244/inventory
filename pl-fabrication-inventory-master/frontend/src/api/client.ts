/**
 * API Client for PL Fabrication Inventory Backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body } = options;
  
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    config.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(errorData.detail || `HTTP ${response.status}`);
  }
  
  if (response.status === 204) {
    return undefined as T;
  }
  
  return response.json();
}

// ============ Components API ============
export const componentsApi = {
  list: () => request<ApiComponent[]>('/components'),
  get: (id: number) => request<ApiComponent>(`/components/${id}`),
  create: (data: Partial<ApiComponent>) => request<ApiComponent>('/components', { method: 'POST', body: data }),
  update: (id: number, data: Partial<ApiComponent>) => request<ApiComponent>(`/components/${id}`, { method: 'PUT', body: data }),
  delete: (id: number) => request<void>(`/components/${id}`, { method: 'DELETE' }),
  receive: (id: number, data: { quantity: number; lot_number?: string }) => 
    request<ApiComponent>(`/components/${id}/receive`, { method: 'POST', body: data }),
};

// ============ BOMs API ============
export const bomsApi = {
  list: () => request<ApiBOM[]>('/boms'),
  get: (id: number) => request<ApiBOM>(`/boms/${id}`),
  create: (data: BOMCreate) => request<ApiBOM>('/boms', { method: 'POST', body: data }),
  update: (id: number, data: Partial<ApiBOM>) => request<ApiBOM>(`/boms/${id}`, { method: 'PUT', body: data }),
  delete: (id: number) => request<void>(`/boms/${id}`, { method: 'DELETE' }),
};

// ============ Work Orders API ============
export const workOrdersApi = {
  list: () => request<ApiWorkOrder[]>('/fabrication/work-orders'),
  get: (id: number) => request<ApiWorkOrder>(`/fabrication/work-orders/${id}`),
  create: (data: WorkOrderCreate) => request<ApiWorkOrder>('/fabrication/work-orders', { method: 'POST', body: data }),
  update: (id: number, data: Partial<ApiWorkOrder>) => request<ApiWorkOrder>(`/fabrication/work-orders/${id}`, { method: 'PUT', body: data }),
  delete: (id: number) => request<void>(`/fabrication/work-orders/${id}`, { method: 'DELETE' }),
  start: (id: number) => request<ApiWorkOrder>(`/fabrication/work-orders/${id}/start`, { method: 'POST' }),
  completeStep: (id: number, stepIndex: number) => 
    request<ApiWorkOrder>(`/fabrication/work-orders/${id}/steps/${stepIndex}/complete`, { method: 'POST' }),
};

// ============ Devices API ============
export const devicesApi = {
  list: () => request<ApiDevice[]>('/devices'),
  get: (id: number) => request<ApiDevice>(`/devices/${id}`),
  update: (id: number, data: Partial<ApiDevice>) => request<ApiDevice>(`/devices/${id}`, { method: 'PUT', body: data }),
  delete: (id: number) => request<void>(`/devices/${id}`, { method: 'DELETE' }),
  sell: (id: number, data: SaleData) => request<ApiDevice>(`/devices/${id}/sell`, { method: 'POST', body: data }),
  ship: (id: number, data: ShipData) => request<ApiDevice>(`/devices/${id}/ship`, { method: 'POST', body: data }),
  payment: (id: number, data: PaymentData) => request<ApiDevice>(`/devices/${id}/payment`, { method: 'POST', body: data }),
};

// ============ Types ============
export interface ApiComponent {
  id: number;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  unit_of_measure: string;
  unit_cost: number;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  reorder_point: number;
  location?: string;
  lot_number?: string;
  lead_time_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiBOMItem {
  id: number;
  component_id: number;
  quantity: number;
  notes?: string;
  component?: ApiComponent;
}

export interface ApiBOM {
  id: number;
  name: string;
  version: string;
  description?: string;
  status: string;
  total_cost: number;
  created_by?: string;
  items: ApiBOMItem[];
  created_at: string;
  updated_at: string;
}

export interface BOMCreate {
  name: string;
  version?: string;
  description?: string;
  items: { component_id: number; quantity: number; notes?: string }[];
}

export interface ApiWorkOrderStep {
  id: number;
  name: string;
  description?: string;
  phase?: string;
  estimated_minutes: number;
  actual_minutes?: number;
  requires_qc: boolean;
  status: string;
  completed_at?: string;
}

export interface ApiWorkOrder {
  id: number;
  order_number: string;
  bom_id: number;
  quantity: number;
  status: string;
  priority: string;
  current_step_index: number;
  assigned_to?: string;
  started_at?: string;
  completed_at?: string;
  notes?: string;
  bom?: ApiBOM;
  steps: ApiWorkOrderStep[];
  created_at: string;
  updated_at: string;
}

export interface WorkOrderCreate {
  bom_id: number;
  quantity?: number;
  priority?: string;
  assigned_to?: string;
  notes?: string;
}

export interface ApiDevice {
  id: number;
  serial_number: string;
  work_order_id: number;
  bom_name?: string;
  status: string;
  manufactured_at?: string;
  pl_characteristics?: Record<string, number>;
  qc_records?: Record<string, unknown>[];
  build_history?: Record<string, unknown>[];
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_company?: string;
  sold_date?: string;
  sale_price?: number;
  invoice_number?: string;
  is_paid: boolean;
  paid_date?: string;
  dispatch_date?: string;
  shipped_date?: string;
  tracking_number?: string;
  created_at: string;
  updated_at: string;
}

export interface SaleData {
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_company?: string;
  sale_price?: number;
  invoice_number?: string;
  notes?: string;
}

export interface ShipData {
  dispatch_date: string;
  tracking_number?: string;
}

export interface PaymentData {
  is_paid: boolean;
  paid_date?: string;
}
