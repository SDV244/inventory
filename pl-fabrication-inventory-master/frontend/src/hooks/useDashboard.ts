import { useQuery } from '@tanstack/react-query';
import type { DashboardMetrics, ProductionStats, ActivityFeedItem, Component } from '../types';
import { componentsApi, workOrdersApi, devicesApi } from '../api/client';
import { getStockLevel } from '../utils/helpers';

// API functions
const fetchDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const [components, workOrders, devices] = await Promise.all([
    componentsApi.list(),
    workOrdersApi.list(),
    devicesApi.list(),
  ]);
  
  const totalInventoryValue = components.reduce(
    (sum, c) => sum + c.current_stock * c.unit_cost,
    0
  );
  
  const transformedComponents = components.map(c => ({
    id: String(c.id),
    sku: c.sku,
    name: c.name,
    description: c.description || '',
    category: c.category || 'OT',
    unitOfMeasure: c.unit_of_measure,
    unitCost: c.unit_cost,
    currentStock: c.current_stock,
    minStock: c.min_stock,
    maxStock: c.max_stock,
    reorderPoint: c.reorder_point,
    location: c.location || '',
    leadTimeDays: c.lead_time_days,
  })) as Component[];
  
  const lowStockAlerts = transformedComponents.filter(
    (c) => getStockLevel(c) === 'critical' || getStockLevel(c) === 'low'
  ).length;
  
  const wipCount = workOrders.filter(
    wo => wo.status !== 'complete' && wo.status !== 'cancelled'
  ).length;
  
  const today = new Date().toISOString().split('T')[0];
  const devicesProducedToday = devices.filter(d => {
    const deviceDate = (d.manufactured_at || d.created_at || '').split('T')[0];
    return deviceDate === today && ['qc-passed', 'shipped', 'sold'].includes(d.status);
  }).length;
  
  const devicesWithQC = devices.filter(d => 
    ['qc-passed', 'qc-failed', 'shipped', 'sold'].includes(d.status)
  );
  const passedDevices = devices.filter(d => 
    ['qc-passed', 'shipped', 'sold'].includes(d.status)
  );
  const yieldRate = devicesWithQC.length > 0 
    ? (passedDevices.length / devicesWithQC.length) * 100 
    : 100;
  
  return {
    totalInventoryValue,
    lowStockAlerts,
    wipCount,
    devicesProducedToday,
    yieldRate,
    pendingQC: devices.filter(d => d.status === 'qc-pending' || d.status === 'in-production').length,
  };
};

const fetchProductionStats = async (): Promise<ProductionStats[]> => {
  const devices = await devicesApi.list();
  const stats: ProductionStats[] = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const devicesOnDate = devices.filter(d => {
      const deviceDate = (d.manufactured_at || d.created_at || '').split('T')[0];
      return deviceDate === dateStr;
    });
    
    const produced = devicesOnDate.length;
    const passed = devicesOnDate.filter(d => 
      ['qc-passed', 'shipped', 'sold'].includes(d.status)
    ).length;
    const failed = devicesOnDate.filter(d => d.status === 'qc-failed').length;
    
    stats.push({ date: dateStr, produced, passed, failed });
  }
  
  return stats;
};

const fetchActivityFeed = async (): Promise<ActivityFeedItem[]> => {
  const [workOrders, devices] = await Promise.all([
    workOrdersApi.list(),
    devicesApi.list(),
  ]);
  
  const activities: ActivityFeedItem[] = [];
  
  workOrders
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5)
    .forEach(wo => {
      let title = '';
      let description = '';
      
      if (wo.status === 'complete') {
        title = 'Orden Completada';
        description = `${wo.order_number} - ${wo.quantity} unidad(es)`;
      } else if (wo.status === 'in-progress') {
        title = 'Producción en Progreso';
        description = `${wo.order_number} - Paso ${wo.current_step_index + 1}/${wo.steps.length}`;
      } else if (wo.status === 'queued') {
        title = 'Nueva Orden';
        description = `${wo.order_number} en cola`;
      }
      
      if (title) {
        activities.push({
          id: `wo-${wo.id}`,
          timestamp: wo.updated_at,
          type: 'production',
          title,
          description,
        });
      }
    });
  
  devices
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5)
    .forEach(d => {
      let title = '';
      let description = '';
      let type: ActivityFeedItem['type'] = 'production';
      
      if (d.status === 'shipped') {
        title = 'Dispositivo Despachado';
        description = `${d.serial_number}${d.customer_name ? ` → ${d.customer_name}` : ''}`;
        type = 'system';
      } else if (d.status === 'sold') {
        title = 'Venta Registrada';
        description = `${d.serial_number}${d.customer_name ? ` - ${d.customer_name}` : ''}`;
        type = 'system';
      } else if (d.status === 'qc-passed') {
        title = 'QC Aprobado';
        description = d.serial_number;
        type = 'quality';
      } else if (d.status === 'qc-failed') {
        title = 'QC Rechazado';
        description = d.serial_number;
        type = 'quality';
      }
      
      if (title) {
        activities.push({
          id: `device-${d.id}`,
          timestamp: d.updated_at,
          type,
          title,
          description,
        });
      }
    });
  
  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);
};

const fetchLowStockComponents = async (): Promise<Component[]> => {
  const components = await componentsApi.list();
  const transformed = components.map(c => ({
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
  }));
  
  return transformed.filter(c => 
    getStockLevel(c) === 'critical' || getStockLevel(c) === 'low'
  );
};

// Hooks
export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: fetchDashboardMetrics,
    staleTime: 10000,
    refetchInterval: 30000,
  });
}

export function useProductionStats() {
  return useQuery({
    queryKey: ['dashboard', 'production'],
    queryFn: fetchProductionStats,
    staleTime: 30000,
  });
}

export function useActivityFeed() {
  return useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: fetchActivityFeed,
    staleTime: 10000,
    refetchInterval: 15000,
  });
}

export function useLowStockAlerts() {
  return useQuery({
    queryKey: ['dashboard', 'lowStock'],
    queryFn: fetchLowStockComponents,
    staleTime: 30000,
  });
}
