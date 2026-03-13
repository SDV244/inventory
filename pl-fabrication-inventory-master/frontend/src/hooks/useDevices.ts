import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Device, QCRecord } from '../types';
import type { ApiDevice } from '../api/client';
import { devicesApi } from '../api/client';

// Transform API device to frontend format
const transformDevice = (d: ApiDevice): Device => ({
  id: String(d.id),
  serialNumber: d.serial_number,
  workOrderId: String(d.work_order_id),
  bomName: d.bom_name || '',
  status: d.status as Device['status'],
  manufactureDate: d.manufactured_at,
  plCharacteristics: d.pl_characteristics ? {
    peakWavelength: d.pl_characteristics.peakWavelength || 660,
    intensity: d.pl_characteristics.intensity || 100,
    fwhm: d.pl_characteristics.fwhm || 20,
    efficacy: d.pl_characteristics.efficacy,
  } : undefined,
  qcRecords: ((d.qc_records || []) as unknown[]).map((r: any) => ({
    id: r.id,
    deviceId: String(d.id),
    workOrderId: String(d.work_order_id),
    passed: r.passed,
    performedAt: r.performedAt,
    performedBy: r.performedBy,
    measurements: r.measurements || [],
    defectCodes: r.defectCodes,
    notes: r.notes,
  })),
  buildHistory: ((d.build_history || []) as unknown[]).map((h: any) => ({
    id: h.id,
    timestamp: h.timestamp,
    eventType: h.eventType,
    description: h.description,
    performedBy: h.performedBy,
  })),
  customer: d.customer_name ? {
    name: d.customer_name,
    email: d.customer_email,
    phone: d.customer_phone,
    company: d.customer_company,
  } : undefined,
  soldDate: d.sold_date,
  salePrice: d.sale_price,
  invoiceNumber: d.invoice_number,
  isPaid: d.is_paid,
  paidDate: d.paid_date,
  dispatchDate: d.dispatch_date,
  shippedDate: d.shipped_date,
  trackingNumber: d.tracking_number,
  createdAt: d.created_at,
  updatedAt: d.updated_at,
});

interface SaleData {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCompany?: string;
  salePrice?: number;
  invoiceNumber?: string;
  notes?: string;
}

interface ShipData {
  dispatchDate: string;
  trackingNumber?: string;
}

interface PaymentData {
  isPaid: boolean;
  paidDate?: string;
}

// API functions
const fetchDevices = async (): Promise<Device[]> => {
  const devices = await devicesApi.list();
  return devices.map(transformDevice);
};

const fetchDevice = async (id: string): Promise<Device | undefined> => {
  try {
    const device = await devicesApi.get(parseInt(id));
    return transformDevice(device);
  } catch {
    return undefined;
  }
};

const searchDevices = async (query: string): Promise<Device[]> => {
  const devices = await devicesApi.list();
  const lowerQuery = query.toLowerCase();
  return devices
    .filter(d => 
      d.serial_number.toLowerCase().includes(lowerQuery) ||
      d.status.toLowerCase().includes(lowerQuery)
    )
    .map(transformDevice);
};

const updateDeviceStatus = async (
  id: string,
  status: Device['status'],
  saleData?: SaleData,
  shipData?: ShipData,
  paymentData?: PaymentData
): Promise<Device> => {
  const numId = parseInt(id);
  
  if (status === 'sold' && saleData) {
    const apiData = {
      customer_name: saleData.customerName,
      customer_email: saleData.customerEmail,
      customer_phone: saleData.customerPhone,
      customer_company: saleData.customerCompany,
      sale_price: saleData.salePrice,
      invoice_number: saleData.invoiceNumber,
      notes: saleData.notes,
    };
    const device = await devicesApi.sell(numId, apiData);
    return transformDevice(device);
  }
  
  if (status === 'shipped' && shipData) {
    const apiData = {
      dispatch_date: shipData.dispatchDate,
      tracking_number: shipData.trackingNumber,
    };
    const device = await devicesApi.ship(numId, apiData);
    return transformDevice(device);
  }
  
  if (paymentData !== undefined) {
    const apiData = {
      is_paid: paymentData.isPaid,
      paid_date: paymentData.paidDate,
    };
    const device = await devicesApi.payment(numId, apiData);
    return transformDevice(device);
  }
  
  // General status update
  const device = await devicesApi.update(numId, { status });
  return transformDevice(device);
};

const submitQCRecord = async (data: {
  deviceId: string;
  passed: boolean;
  measurements: QCRecord['measurements'];
  notes?: string;
  defectCodes?: string[];
}): Promise<QCRecord> => {
  const device = await devicesApi.get(parseInt(data.deviceId));
  
  const qcRecord = {
    id: `qc-${Date.now()}`,
    passed: data.passed,
    performedAt: new Date().toISOString(),
    performedBy: 'QC-Tech-001',
    measurements: data.measurements,
    defectCodes: data.defectCodes,
    notes: data.notes,
  };
  
  const newQcRecords = [...(device.qc_records || []), qcRecord];
  const newBuildHistory = [...(device.build_history || []), {
    id: `bh-${Date.now()}`,
    timestamp: new Date().toISOString(),
    eventType: data.passed ? 'qc-pass' : 'qc-fail',
    description: data.passed ? 'QC inspection passed' : `QC inspection failed: ${data.defectCodes?.join(', ')}`,
  }];
  
  await devicesApi.update(parseInt(data.deviceId), {
    status: data.passed ? 'qc-passed' : 'qc-failed',
    qc_records: newQcRecords,
    build_history: newBuildHistory,
    pl_characteristics: data.passed ? {
      peakWavelength: 660,
      intensity: 100,
      fwhm: 20,
      efficacy: 45,
    } : undefined,
  });
  
  return {
    ...qcRecord,
    deviceId: data.deviceId,
    workOrderId: String(device.work_order_id),
    measurements: data.measurements,
  };
};

// Hooks
export function useDevices() {
  return useQuery({
    queryKey: ['devices'],
    queryFn: fetchDevices,
    staleTime: 10000,
  });
}

export function useDevice(id: string) {
  return useQuery({
    queryKey: ['device', id],
    queryFn: () => fetchDevice(id),
    enabled: !!id,
  });
}

export function useSearchDevices(query: string) {
  return useQuery({
    queryKey: ['devices', 'search', query],
    queryFn: () => searchDevices(query),
    enabled: query.length >= 2,
    staleTime: 10000,
  });
}

export function useSubmitQC() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitQCRecord,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['device', variables.deviceId] });
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
    },
  });
}

export function useUpdateDeviceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, saleData, shipData, paymentData }: { 
      id: string; 
      status: Device['status'];
      saleData?: SaleData;
      shipData?: ShipData;
      paymentData?: PaymentData;
    }) => updateDeviceStatus(id, status, saleData, shipData, paymentData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['device', variables.id] });
    },
  });
}
