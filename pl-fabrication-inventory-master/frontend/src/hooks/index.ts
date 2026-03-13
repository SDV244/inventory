export * from './useInventory';
export * from './useBOM';
export * from './useProduction';
export * from './useDevices';
export * from './useQuality';
export * from './useDashboard';

// Re-export with aliases for convenience
export { useComponents, useCreateComponent, useUpdateComponent, useDeleteComponent, useReceiveStock } from './useInventory';
export { useBOMs, useCreateBOM, useUpdateBOM, useDeleteBOM } from './useBOM';
export { useWorkOrders, useCreateWorkOrder, useUpdateWorkOrderStatus, useCompleteStep, useUpdateWorkOrder, useDeleteWorkOrder } from './useProduction';
export { useDevices, useUpdateDeviceStatus, useSubmitQC } from './useDevices';
export { useDashboardMetrics, useProductionStats, useActivityFeed, useLowStockAlerts } from './useDashboard';
export { useQualityMetrics, useDefectAnalysis, useFailedQCRecords, usePendingQCDevices, useYieldTrend, useCalibrationRecords } from './useQuality';
