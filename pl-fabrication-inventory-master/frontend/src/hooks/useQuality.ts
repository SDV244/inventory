import { useQuery } from '@tanstack/react-query';
import type { QCRecord, CalibrationRecord, DefectAnalysis, Device } from '../types';
import { devicesApi } from '../api/client';

// API functions
const fetchQualityMetrics = async () => {
  const devices = await devicesApi.list();
  
  const totalDevices = devices.length;
  const passedDevices = devices.filter((d) => 
    ['qc-passed', 'shipped', 'sold'].includes(d.status)
  ).length;
  const failedDevices = devices.filter((d) => d.status === 'qc-failed').length;
  const pendingDevices = devices.filter((d) => 
    ['qc-pending', 'in-production'].includes(d.status)
  ).length;
  
  const firstPassYield = totalDevices > 0 
    ? ((passedDevices / (passedDevices + failedDevices)) * 100) || 100
    : 100;
  
  return {
    totalInspections: totalDevices,
    passRate: totalDevices > 0 ? (passedDevices / totalDevices) * 100 : 100,
    failRate: totalDevices > 0 ? (failedDevices / totalDevices) * 100 : 0,
    pendingInspections: pendingDevices,
    avgInspectionTime: 25,
    firstPassYield,
  };
};

const fetchCalibrationRecords = async (): Promise<CalibrationRecord[]> => {
  return [];
};

const fetchDefectAnalysis = async (): Promise<DefectAnalysis[]> => {
  return [];
};

const fetchFailedQCRecords = async (): Promise<QCRecord[]> => {
  const devices = await devicesApi.list();
  const records: QCRecord[] = [];
  
  devices
    .filter(d => d.status === 'qc-failed')
    .forEach(d => {
      ((d.qc_records || []) as unknown[]).forEach((r: any) => {
        if (!r.passed) {
          records.push({
            id: r.id,
            deviceId: String(d.id),
            workOrderId: String(d.work_order_id),
            passed: r.passed,
            performedAt: r.performedAt,
            performedBy: r.performedBy,
            measurements: r.measurements || [],
            defectCodes: r.defectCodes,
            notes: r.notes,
          });
        }
      });
    });
  
  return records;
};

const fetchYieldTrend = async () => {
  return Array(7).fill(0).map((_, i) => ({
    date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    yieldRate: 90 + Math.random() * 8,
  }));
};

const fetchPendingQCDevices = async (): Promise<Device[]> => {
  const devices = await devicesApi.list();
  return devices
    .filter((d) => d.status === 'qc-pending' || d.status === 'in-production')
    .map(d => ({
      id: String(d.id),
      serialNumber: d.serial_number,
      workOrderId: String(d.work_order_id),
      bomName: d.bom_name || '',
      status: d.status as Device['status'],
      manufactureDate: d.manufactured_at,
      qcRecords: [],
      buildHistory: [],
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
};

// Hooks
export function useQualityMetrics() {
  return useQuery({
    queryKey: ['quality', 'metrics'],
    queryFn: fetchQualityMetrics,
    staleTime: 30000,
  });
}

export function useCalibrationRecords() {
  return useQuery({
    queryKey: ['quality', 'calibration'],
    queryFn: fetchCalibrationRecords,
    staleTime: 60000,
  });
}

export function useDefectAnalysis() {
  return useQuery({
    queryKey: ['quality', 'defects'],
    queryFn: fetchDefectAnalysis,
    staleTime: 60000,
  });
}

export function useFailedQCRecords() {
  return useQuery({
    queryKey: ['quality', 'failed'],
    queryFn: fetchFailedQCRecords,
    staleTime: 30000,
  });
}

export function useYieldTrend() {
  return useQuery({
    queryKey: ['quality', 'yield-trend'],
    queryFn: fetchYieldTrend,
    staleTime: 60000,
  });
}

export function usePendingQCDevices() {
  return useQuery({
    queryKey: ['quality', 'pending'],
    queryFn: fetchPendingQCDevices,
    staleTime: 10000,
  });
}
