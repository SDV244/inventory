import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { WorkOrder, WorkOrderStatus } from '../types';
import type { ApiWorkOrder } from '../api/client';
import { workOrdersApi } from '../api/client';

// Transform API work order to frontend format
const transformWorkOrder = (wo: ApiWorkOrder): WorkOrder => ({
  id: String(wo.id),
  orderNumber: wo.order_number,
  bomId: String(wo.bom_id),
  bom: wo.bom ? {
    id: String(wo.bom.id),
    name: wo.bom.name,
    version: wo.bom.version,
    description: wo.bom.description || '',
    status: wo.bom.status as 'draft' | 'active' | 'deprecated',
    totalCost: wo.bom.total_cost,
    createdBy: wo.bom.created_by || 'Current User',
    items: wo.bom.items.map(item => ({
      componentId: String(item.component_id),
      quantity: item.quantity,
      notes: item.notes,
    })),
    createdAt: wo.bom.created_at,
    updatedAt: wo.bom.updated_at,
  } : undefined,
  deviceSerials: [],
  status: wo.status as WorkOrderStatus,
  priority: wo.priority as WorkOrder['priority'],
  quantity: wo.quantity,
  steps: wo.steps.map(step => ({
    id: String(step.id),
    name: step.name,
    description: step.description || step.phase || '',
    estimatedMinutes: step.estimated_minutes,
    actualMinutes: step.actual_minutes,
    status: step.status === 'completed' ? 'complete' : step.status as 'pending' | 'in-progress' | 'complete' | 'skipped',
    completedAt: step.completed_at,
  })),
  currentStepIndex: wo.current_step_index,
  assignedTo: wo.assigned_to,
  notes: wo.notes,
  startedAt: wo.started_at,
  completedAt: wo.completed_at,
  createdAt: wo.created_at,
  updatedAt: wo.updated_at,
});

// API functions
const fetchWorkOrders = async (): Promise<WorkOrder[]> => {
  const workOrders = await workOrdersApi.list();
  return workOrders.map(transformWorkOrder);
};

const fetchWorkOrder = async (id: string): Promise<WorkOrder | undefined> => {
  try {
    const workOrder = await workOrdersApi.get(parseInt(id));
    return transformWorkOrder(workOrder);
  } catch {
    return undefined;
  }
};

const createWorkOrder = async (data: {
  bomId: string;
  quantity: number;
  priority: WorkOrder['priority'];
  assignedTo?: string;
  notes?: string;
}): Promise<WorkOrder> => {
  const apiData = {
    bom_id: parseInt(data.bomId),
    quantity: data.quantity,
    priority: data.priority,
    assigned_to: data.assignedTo,
    notes: data.notes,
  };
  const workOrder = await workOrdersApi.create(apiData);
  return transformWorkOrder(workOrder);
};

const updateWorkOrderStatus = async (
  id: string,
  status: WorkOrderStatus
): Promise<WorkOrder> => {
  const workOrder = await workOrdersApi.update(parseInt(id), { status });
  return transformWorkOrder(workOrder);
};

const completeStep = async (
  workOrderId: string,
  stepIndex: number
): Promise<WorkOrder> => {
  const workOrder = await workOrdersApi.completeStep(parseInt(workOrderId), stepIndex);
  return transformWorkOrder(workOrder);
};

const updateWorkOrder = async (
  id: string,
  data: Partial<WorkOrder>
): Promise<WorkOrder> => {
  const apiData: Record<string, unknown> = {};
  if (data.status !== undefined) apiData.status = data.status;
  if (data.priority !== undefined) apiData.priority = data.priority;
  if (data.currentStepIndex !== undefined) apiData.current_step_index = data.currentStepIndex;
  if (data.assignedTo !== undefined) apiData.assigned_to = data.assignedTo;
  if (data.notes !== undefined) apiData.notes = data.notes;
  
  const workOrder = await workOrdersApi.update(parseInt(id), apiData);
  return transformWorkOrder(workOrder);
};

const deleteWorkOrder = async (id: string): Promise<void> => {
  await workOrdersApi.delete(parseInt(id));
};

const startWorkOrder = async (id: string): Promise<WorkOrder> => {
  const workOrder = await workOrdersApi.start(parseInt(id));
  return transformWorkOrder(workOrder);
};

// Hooks
export function useWorkOrders() {
  return useQuery({
    queryKey: ['workOrders'],
    queryFn: fetchWorkOrders,
    staleTime: 10000,
  });
}

export function useWorkOrder(id: string) {
  return useQuery({
    queryKey: ['workOrder', id],
    queryFn: () => fetchWorkOrder(id),
    enabled: !!id,
  });
}

export function useCreateWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWorkOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}

export function useUpdateWorkOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: WorkOrderStatus }) =>
      updateWorkOrderStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      queryClient.invalidateQueries({ queryKey: ['workOrder', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}

export function useCompleteStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workOrderId, stepIndex }: { workOrderId: string; stepIndex: number }) =>
      completeStep(workOrderId, stepIndex),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      queryClient.invalidateQueries({ queryKey: ['workOrder', variables.workOrderId] });
    },
  });
}

export function useUpdateWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WorkOrder> }) =>
      updateWorkOrder(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      queryClient.invalidateQueries({ queryKey: ['workOrder', variables.id] });
    },
  });
}

export function useDeleteWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteWorkOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}

export function useStartWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: startWorkOrder,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      queryClient.invalidateQueries({ queryKey: ['workOrder', id] });
    },
  });
}

// Group work orders by status for Kanban
export function groupWorkOrdersByStatus(workOrders: WorkOrder[]): Record<WorkOrderStatus, WorkOrder[]> {
  const groups: Record<WorkOrderStatus, WorkOrder[]> = {
    'queued': [],
    'in-progress': [],
    'qc': [],
    'complete': [],
    'failed': [],
  };
  
  workOrders.forEach((wo) => {
    if (groups[wo.status]) {
      groups[wo.status].push(wo);
    }
  });
  
  return groups;
}
