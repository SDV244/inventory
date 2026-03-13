import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Component, StockTransaction } from '../types';
import type { ApiComponent } from '../api/client';
import { componentsApi } from '../api/client';

// Transform API component to frontend format
const transformComponent = (c: ApiComponent): Component => ({
  id: String(c.id),
  sku: c.sku,
  name: c.name,
  description: c.description || '',
  category: (c.category || 'OT') as Component['category'],
  unitOfMeasure: c.unit_of_measure,
  unitCost: c.unit_cost,
  currentStock: c.current_stock,
  minStock: c.min_stock,
  maxStock: c.max_stock,
  reorderPoint: c.reorder_point,
  location: c.location || '',
  supplier: '',
  leadTimeDays: c.lead_time_days,
  lotNumber: c.lot_number,
  isActive: c.is_active,
  createdAt: c.created_at,
  updatedAt: c.updated_at,
});

// API functions
const fetchComponents = async (): Promise<Component[]> => {
  const components = await componentsApi.list();
  return components.map(transformComponent);
};

const fetchComponent = async (id: string): Promise<Component | undefined> => {
  try {
    const component = await componentsApi.get(parseInt(id));
    return transformComponent(component);
  } catch {
    return undefined;
  }
};

const createComponent = async (data: Partial<Component>): Promise<Component> => {
  const apiData = {
    sku: data.sku || '',
    name: data.name || '',
    description: data.description,
    category: data.category,
    unit_of_measure: data.unitOfMeasure || 'ea',
    unit_cost: data.unitCost || 0,
    current_stock: data.currentStock || 0,
    min_stock: data.minStock || 0,
    max_stock: data.maxStock || 1000,
    reorder_point: data.reorderPoint || 0,
    location: data.location,
    lot_number: data.lotNumber,
    lead_time_days: data.leadTimeDays || 7,
  };
  const component = await componentsApi.create(apiData);
  return transformComponent(component);
};

const updateComponent = async (id: string, data: Partial<Component>): Promise<Component> => {
  const apiData: Record<string, unknown> = {};
  if (data.sku !== undefined) apiData.sku = data.sku;
  if (data.name !== undefined) apiData.name = data.name;
  if (data.description !== undefined) apiData.description = data.description;
  if (data.category !== undefined) apiData.category = data.category;
  if (data.unitOfMeasure !== undefined) apiData.unit_of_measure = data.unitOfMeasure;
  if (data.unitCost !== undefined) apiData.unit_cost = data.unitCost;
  if (data.currentStock !== undefined) apiData.current_stock = data.currentStock;
  if (data.minStock !== undefined) apiData.min_stock = data.minStock;
  if (data.maxStock !== undefined) apiData.max_stock = data.maxStock;
  if (data.reorderPoint !== undefined) apiData.reorder_point = data.reorderPoint;
  if (data.location !== undefined) apiData.location = data.location;
  if (data.lotNumber !== undefined) apiData.lot_number = data.lotNumber;
  if (data.leadTimeDays !== undefined) apiData.lead_time_days = data.leadTimeDays;
  
  const component = await componentsApi.update(parseInt(id), apiData);
  return transformComponent(component);
};

const deleteComponent = async (id: string): Promise<void> => {
  await componentsApi.delete(parseInt(id));
};

const receiveStock = async (
  componentId: string,
  quantity: number,
  lotNumber: string,
  _notes?: string
): Promise<StockTransaction> => {
  const component = await componentsApi.receive(parseInt(componentId), {
    quantity,
    lot_number: lotNumber,
  });
  
  return {
    id: `tx-${Date.now()}`,
    componentId,
    type: 'receive',
    quantity,
    previousStock: component.current_stock - quantity,
    newStock: component.current_stock,
    lotNumber,
    performedBy: 'Current User',
    performedAt: new Date().toISOString(),
  };
};

// Hooks
export function useComponents() {
  return useQuery({
    queryKey: ['components'],
    queryFn: fetchComponents,
    staleTime: 30000,
  });
}

export function useComponent(id: string) {
  return useQuery({
    queryKey: ['component', id],
    queryFn: () => fetchComponent(id),
    enabled: !!id,
  });
}

export function useCreateComponent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createComponent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['components'] });
    },
  });
}

export function useUpdateComponent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Component> }) =>
      updateComponent(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['components'] });
      queryClient.invalidateQueries({ queryKey: ['component', variables.id] });
    },
  });
}

export function useDeleteComponent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteComponent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['components'] });
    },
  });
}

export function useReceiveStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      componentId,
      quantity,
      lotNumber,
      notes,
    }: {
      componentId: string;
      quantity: number;
      lotNumber: string;
      notes?: string;
    }) => receiveStock(componentId, quantity, lotNumber, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['components'] });
    },
  });
}

export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => [] as StockTransaction[],
    staleTime: 30000,
  });
}
