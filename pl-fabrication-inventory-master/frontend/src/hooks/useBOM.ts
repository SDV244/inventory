import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { BillOfMaterials, BOMItem, Component } from '../types';
import type { ApiBOM } from '../api/client';
import { bomsApi, componentsApi } from '../api/client';

// Transform API BOM to frontend format
const transformBOM = (b: ApiBOM): BillOfMaterials => ({
  id: String(b.id),
  name: b.name,
  version: b.version,
  description: b.description || '',
  status: b.status === 'archived' ? 'deprecated' : b.status as BillOfMaterials['status'],
  totalCost: b.total_cost,
  createdBy: b.created_by || 'Current User',
  items: b.items.map(item => ({
    componentId: String(item.component_id),
    quantity: item.quantity,
    notes: item.notes,
    component: item.component ? {
      id: String(item.component.id),
      sku: item.component.sku,
      name: item.component.name,
      description: item.component.description || '',
      category: (item.component.category || 'OT') as Component['category'],
      unitOfMeasure: item.component.unit_of_measure,
      unitCost: item.component.unit_cost,
      currentStock: item.component.current_stock,
      minStock: item.component.min_stock,
      maxStock: item.component.max_stock,
      reorderPoint: item.component.reorder_point,
      location: item.component.location || '',
      supplier: '',
      leadTimeDays: item.component.lead_time_days,
      lotNumber: item.component.lot_number,
      isActive: item.component.is_active,
      createdAt: item.component.created_at,
      updatedAt: item.component.updated_at,
    } : undefined,
  })),
  createdAt: b.created_at,
  updatedAt: b.updated_at,
});

// API functions
const fetchBOMs = async (): Promise<BillOfMaterials[]> => {
  const boms = await bomsApi.list();
  return boms.map(transformBOM);
};

const fetchBOM = async (id: string): Promise<BillOfMaterials | undefined> => {
  try {
    const bom = await bomsApi.get(parseInt(id));
    return transformBOM(bom);
  } catch {
    return undefined;
  }
};

const createBOM = async (data: {
  name: string;
  version: string;
  description: string;
  items: BOMItem[];
}): Promise<BillOfMaterials> => {
  const apiData = {
    name: data.name,
    version: data.version,
    description: data.description,
    items: data.items.map(item => ({
      component_id: parseInt(item.componentId),
      quantity: item.quantity,
      notes: item.notes,
    })),
  };
  const bom = await bomsApi.create(apiData);
  return transformBOM(bom);
};

const updateBOM = async (
  id: string,
  data: Partial<BillOfMaterials>
): Promise<BillOfMaterials> => {
  const apiData: Record<string, unknown> = {};
  if (data.name !== undefined) apiData.name = data.name;
  if (data.version !== undefined) apiData.version = data.version;
  if (data.description !== undefined) apiData.description = data.description;
  if (data.status !== undefined) apiData.status = data.status;
  if (data.items !== undefined) {
    apiData.items = data.items.map(item => ({
      component_id: parseInt(item.componentId),
      quantity: item.quantity,
      notes: item.notes,
    }));
  }
  
  const bom = await bomsApi.update(parseInt(id), apiData);
  return transformBOM(bom);
};

const deleteBOM = async (id: string): Promise<void> => {
  await bomsApi.delete(parseInt(id));
};

const calculateBOMCost = async (items: BOMItem[]): Promise<number> => {
  const components = await componentsApi.list();
  return items.reduce((sum, item) => {
    const component = components.find(c => String(c.id) === item.componentId);
    return sum + (component?.unit_cost || 0) * item.quantity;
  }, 0);
};

// Hooks
export function useBOMs() {
  return useQuery({
    queryKey: ['boms'],
    queryFn: fetchBOMs,
    staleTime: 30000,
  });
}

export function useBOM(id: string) {
  return useQuery({
    queryKey: ['bom', id],
    queryFn: () => fetchBOM(id),
    enabled: !!id,
  });
}

export function useCreateBOM() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBOM,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boms'] });
    },
  });
}

export function useUpdateBOM() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BillOfMaterials> }) =>
      updateBOM(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['boms'] });
      queryClient.invalidateQueries({ queryKey: ['bom', variables.id] });
    },
  });
}

export function useDeleteBOM() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBOM,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boms'] });
    },
  });
}

export { calculateBOMCost };
