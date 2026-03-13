import { useState, useMemo, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  Package, 
  Factory, 
  FileText,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  X,
  RefreshCw,
  Trash2,
  Edit2,
  Clock
} from 'lucide-react';
import { Card, Button, SimpleTabs, Badge } from '../components/ui';
import { useComponents, useWorkOrders, useDevices } from '../hooks';
import { formatCurrency, formatPercent, formatDate } from '../utils/helpers';

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

interface ReportData {
  title: string;
  generatedAt: string;
  period: string;
  data: Record<string, unknown>[];
  summary: Record<string, string | number>;
}

interface ScheduledReport {
  id: string;
  reportType: string;
  reportTitle: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  enabled: boolean;
  lastRun?: string;
  nextRun: string;
  createdAt: string;
}

const tabs = [
  { id: 'generate', label: 'Generate Reports' },
  { id: 'scheduled', label: 'Scheduled Reports' },
  { id: 'history', label: 'Report History' },
];

// Helper to calculate next run time
function calculateNextRun(frequency: string, time: string, dayOfWeek?: number, dayOfMonth?: number): string {
  const now = new Date();
  const [hours, minutes] = time.split(':').map(Number);
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);
  
  if (frequency === 'daily') {
    if (next <= now) next.setDate(next.getDate() + 1);
  } else if (frequency === 'weekly' && dayOfWeek !== undefined) {
    const currentDay = now.getDay();
    let daysUntil = dayOfWeek - currentDay;
    if (daysUntil < 0 || (daysUntil === 0 && next <= now)) {
      daysUntil += 7;
    }
    next.setDate(next.getDate() + daysUntil);
  } else if (frequency === 'monthly' && dayOfMonth !== undefined) {
    next.setDate(dayOfMonth);
    if (next <= now) next.setMonth(next.getMonth() + 1);
  }
  
  return next.toISOString();
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState('generate');
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedReportType, setSelectedReportType] = useState<string | null>(null);
  const [generatedReport, setGeneratedReport] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [reportHistory, setReportHistory] = useState<{ name: string; date: string; type: string }[]>([
    { name: 'Inventory Summary', date: '2024-03-13 09:00', type: 'inventory' },
    { name: 'Production Report', date: '2024-03-13 08:30', type: 'production' },
    { name: 'Quality Analytics', date: '2024-03-12 17:00', type: 'quality' },
    { name: 'Inventory Summary', date: '2024-03-12 09:00', type: 'inventory' },
    { name: 'Device Traceability', date: '2024-03-11 14:30', type: 'traceability' },
  ]);
  
  // Scheduled reports state
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>(() => {
    const saved = localStorage.getItem('pl-scheduled-reports');
    return saved ? JSON.parse(saved) : [];
  });
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduledReport | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    reportType: '',
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    time: '09:00',
    dayOfWeek: 1,
    dayOfMonth: 1,
  });
  
  // Persist scheduled reports to localStorage
  useEffect(() => {
    localStorage.setItem('pl-scheduled-reports', JSON.stringify(scheduledReports));
  }, [scheduledReports]);

  const { data: components } = useComponents();
  const { data: workOrders } = useWorkOrders();
  const { data: devices } = useDevices();

  const showToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  // Open schedule modal for a specific report type
  const openScheduleModal = (reportType: string) => {
    setScheduleForm({
      reportType,
      frequency: 'daily',
      time: '09:00',
      dayOfWeek: 1,
      dayOfMonth: 1,
    });
    setEditingSchedule(null);
    setShowScheduleModal(true);
  };

  // Open schedule modal to edit existing schedule
  const editSchedule = (schedule: ScheduledReport) => {
    setScheduleForm({
      reportType: schedule.reportType,
      frequency: schedule.frequency,
      time: schedule.time,
      dayOfWeek: schedule.dayOfWeek || 1,
      dayOfMonth: schedule.dayOfMonth || 1,
    });
    setEditingSchedule(schedule);
    setShowScheduleModal(true);
  };

  // Save scheduled report
  const saveSchedule = () => {
    const reportType = reportTypes.find(r => r.id === scheduleForm.reportType);
    if (!reportType) return;

    const nextRun = calculateNextRun(
      scheduleForm.frequency,
      scheduleForm.time,
      scheduleForm.frequency === 'weekly' ? scheduleForm.dayOfWeek : undefined,
      scheduleForm.frequency === 'monthly' ? scheduleForm.dayOfMonth : undefined
    );

    if (editingSchedule) {
      // Update existing
      setScheduledReports(prev => prev.map(s => 
        s.id === editingSchedule.id 
          ? {
              ...s,
              frequency: scheduleForm.frequency,
              time: scheduleForm.time,
              dayOfWeek: scheduleForm.dayOfWeek,
              dayOfMonth: scheduleForm.dayOfMonth,
              nextRun,
            }
          : s
      ));
      showToast('success', 'Schedule updated successfully!');
    } else {
      // Create new
      const newSchedule: ScheduledReport = {
        id: Date.now().toString(),
        reportType: scheduleForm.reportType,
        reportTitle: reportType.title,
        frequency: scheduleForm.frequency,
        time: scheduleForm.time,
        dayOfWeek: scheduleForm.dayOfWeek,
        dayOfMonth: scheduleForm.dayOfMonth,
        enabled: true,
        nextRun,
        createdAt: new Date().toISOString(),
      };
      setScheduledReports(prev => [...prev, newSchedule]);
      showToast('success', `${reportType.title} scheduled successfully!`);
    }

    setShowScheduleModal(false);
    setActiveTab('scheduled');
  };

  // Toggle schedule enabled/disabled
  const toggleSchedule = (id: string) => {
    setScheduledReports(prev => prev.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  };

  // Delete scheduled report
  const deleteSchedule = (id: string) => {
    setScheduledReports(prev => prev.filter(s => s.id !== id));
    showToast('success', 'Schedule deleted');
  };

  // Run scheduled report now
  const runScheduleNow = (schedule: ScheduledReport) => {
    generateReport(schedule.reportType);
    setScheduledReports(prev => prev.map(s =>
      s.id === schedule.id
        ? {
            ...s,
            lastRun: new Date().toISOString(),
            nextRun: calculateNextRun(
              s.frequency,
              s.time,
              s.dayOfWeek,
              s.dayOfMonth
            ),
          }
        : s
    ));
  };

  // Get frequency label
  const getFrequencyLabel = (schedule: ScheduledReport): string => {
    switch (schedule.frequency) {
      case 'daily':
        return `Daily at ${schedule.time}`;
      case 'weekly':
        return `${DAYS_OF_WEEK[schedule.dayOfWeek || 0]}s at ${schedule.time}`;
      case 'monthly':
        return `Day ${schedule.dayOfMonth} at ${schedule.time}`;
      default:
        return schedule.frequency;
    }
  };

  // Calculate stats based on selected period
  const stats = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    
    switch (selectedPeriod) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    const totalInventoryValue = components?.reduce((sum, c) => sum + c.currentStock * c.unitCost, 0) || 0;
    
    const periodWorkOrders = workOrders?.filter(wo => 
      new Date(wo.createdAt) >= startDate
    ) || [];
    
    const passedDevices = devices?.filter(d => d.status === 'qc-passed').length || 0;
    const totalDevices = devices?.filter(d => d.status !== 'in-production').length || 1;
    const yieldRate = (passedDevices / totalDevices) * 100;

    return {
      inventoryValue: totalInventoryValue,
      unitsProduced: periodWorkOrders.length,
      yieldRate: Math.min(yieldRate, 100),
      reportsGenerated: reportHistory.length,
    };
  }, [selectedPeriod, components, workOrders, devices, reportHistory.length]);

  const reportTypes = [
    {
      id: 'sales',
      title: 'Reporte de Ventas',
      description: 'Dispositivos vendidos, clientes, montos y fechas',
      icon: TrendingUp,
      lastGenerated: reportHistory.find(r => r.type === 'sales')?.date || 'Nunca',
    },
    {
      id: 'dispatch',
      title: 'Reporte de Despachos',
      description: 'Envíos realizados, fechas de despacho y tracking',
      icon: Package,
      lastGenerated: reportHistory.find(r => r.type === 'dispatch')?.date || 'Nunca',
    },
    {
      id: 'inventory',
      title: 'Inventario',
      description: 'Niveles de stock, valores y estado de reorden',
      icon: Package,
      lastGenerated: reportHistory.find(r => r.type === 'inventory')?.date || 'Nunca',
    },
    {
      id: 'production',
      title: 'Producción',
      description: 'Órdenes de trabajo, completadas y en progreso',
      icon: Factory,
      lastGenerated: reportHistory.find(r => r.type === 'production')?.date || 'Nunca',
    },
    {
      id: 'traceability',
      title: 'Trazabilidad',
      description: 'Seguimiento de lotes y genealogía de dispositivos',
      icon: FileText,
      lastGenerated: reportHistory.find(r => r.type === 'traceability')?.date || 'Nunca',
    },
  ];

  const generateReport = async (type: string) => {
    setIsGenerating(true);
    setSelectedReportType(type);
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const now = new Date();
    const periodLabel = selectedPeriod === 'today' ? 'Today' : 
                        selectedPeriod === 'week' ? 'This Week' :
                        selectedPeriod === 'month' ? 'This Month' : 'This Quarter';
    
    let reportData: ReportData;
    
    switch (type) {
      case 'inventory':
        reportData = {
          title: 'Inventory Summary Report',
          generatedAt: now.toISOString(),
          period: periodLabel,
          data: (components || []).map(c => ({
            sku: c.sku,
            name: c.name,
            category: c.category,
            currentStock: c.currentStock,
            minStock: c.minStock,
            value: c.currentStock * c.unitCost,
            status: c.currentStock <= c.reorderPoint ? 'Low' : c.currentStock >= c.maxStock ? 'Overstocked' : 'OK',
          })),
          summary: {
            totalItems: components?.length || 0,
            totalValue: formatCurrency(components?.reduce((sum, c) => sum + c.currentStock * c.unitCost, 0) || 0),
            lowStockItems: components?.filter(c => c.currentStock <= c.reorderPoint).length || 0,
            categories: [...new Set(components?.map(c => c.category))].length || 0,
          },
        };
        break;
        
      case 'production':
        reportData = {
          title: 'Production Report',
          generatedAt: now.toISOString(),
          period: periodLabel,
          data: (workOrders || []).map(wo => ({
            orderNumber: wo.orderNumber,
            product: wo.bom?.name || 'Unknown',
            status: wo.status,
            priority: wo.priority,
            createdAt: formatDate(wo.createdAt),
            completedAt: wo.completedAt ? formatDate(wo.completedAt) : '-',
          })),
          summary: {
            totalOrders: workOrders?.length || 0,
            completed: workOrders?.filter(wo => wo.status === 'complete').length || 0,
            inProgress: workOrders?.filter(wo => wo.status === 'in-progress').length || 0,
            queued: workOrders?.filter(wo => wo.status === 'queued').length || 0,
          },
        };
        break;
        
      case 'sales':
        const soldDevices = devices?.filter(d => d.status === 'sold' || d.status === 'shipped') || [];
        const totalSales = soldDevices.reduce((sum, d) => sum + (d.salePrice || 0), 0);
        const paidDevices = soldDevices.filter(d => d.isPaid);
        const unpaidDevices = soldDevices.filter(d => !d.isPaid);
        reportData = {
          title: 'Reporte de Ventas',
          generatedAt: now.toISOString(),
          period: periodLabel,
          data: soldDevices.map(d => ({
            serial: d.serialNumber,
            cliente: d.customer?.name || '-',
            empresa: d.customer?.company || '-',
            email: d.customer?.email || '-',
            telefono: d.customer?.phone || '-',
            fechaVenta: d.soldDate ? formatDate(d.soldDate) : '-',
            precio: d.salePrice ? formatCurrency(d.salePrice) : '-',
            pagado: d.isPaid ? 'Sí' : 'No',
            fechaPago: d.paidDate ? formatDate(d.paidDate) : '-',
            estado: d.status === 'shipped' ? 'Enviado' : 'Vendido',
          })),
          summary: {
            totalVentas: soldDevices.length,
            montoTotal: formatCurrency(totalSales),
            pagados: paidDevices.length,
            pendientesPago: unpaidDevices.length,
            montoPendiente: formatCurrency(unpaidDevices.reduce((sum, d) => sum + (d.salePrice || 0), 0)),
          },
        };
        break;
        
      case 'dispatch':
        const shippedDevices = devices?.filter(d => d.status === 'shipped') || [];
        reportData = {
          title: 'Reporte de Despachos',
          generatedAt: now.toISOString(),
          period: periodLabel,
          data: shippedDevices.map(d => ({
            serial: d.serialNumber,
            cliente: d.customer?.name || '-',
            empresa: d.customer?.company || '-',
            fechaVenta: d.soldDate ? formatDate(d.soldDate) : '-',
            fechaDespacho: d.dispatchDate ? formatDate(d.dispatchDate) : '-',
            tracking: d.trackingNumber || '-',
            pagado: d.isPaid ? 'Sí' : 'No',
            precio: d.salePrice ? formatCurrency(d.salePrice) : '-',
          })),
          summary: {
            totalDespachos: shippedDevices.length,
            conTracking: shippedDevices.filter(d => d.trackingNumber).length,
            sinTracking: shippedDevices.filter(d => !d.trackingNumber).length,
            montoTotal: formatCurrency(shippedDevices.reduce((sum, d) => sum + (d.salePrice || 0), 0)),
          },
        };
        break;
        
      case 'traceability':
        reportData = {
          title: 'Device Traceability Report',
          generatedAt: now.toISOString(),
          period: periodLabel,
          data: (devices || []).map(d => ({
            serialNumber: d.serialNumber,
            product: d.bom?.name || 'Unknown',
            manufactureDate: d.manufactureDate ? formatDate(d.manufactureDate) : '-',
            status: d.status,
            componentLots: (d.componentLots || []).length,
            buildEvents: d.buildHistory.length,
          })),
          summary: {
            totalDevices: devices?.length || 0,
            shipped: devices?.filter(d => d.status === 'shipped').length || 0,
            products: [...new Set(devices?.map(d => d.bomId))].length || 0,
            avgBuildEvents: Math.round((devices?.reduce((sum, d) => sum + d.buildHistory.length, 0) || 0) / (devices?.length || 1)),
          },
        };
        break;
        
      default:
        reportData = {
          title: 'Unknown Report',
          generatedAt: now.toISOString(),
          period: periodLabel,
          data: [],
          summary: {},
        };
    }
    
    setGeneratedReport(reportData);
    setReportHistory(prev => [
      { name: reportData.title, date: formatDate(now.toISOString()), type },
      ...prev.slice(0, 9), // Keep last 10
    ]);
    showToast('success', `${reportData.title} generated successfully!`);
    setIsGenerating(false);
  };

  const downloadReport = (format: 'csv' | 'json') => {
    if (!generatedReport) return;
    
    let content: string;
    let mimeType: string;
    let extension: string;
    
    if (format === 'json') {
      content = JSON.stringify(generatedReport, null, 2);
      mimeType = 'application/json';
      extension = 'json';
    } else {
      const headers = Object.keys(generatedReport.data[0] || {}).join(',');
      const rows = generatedReport.data.map(row => 
        Object.values(row).map(v => `"${v}"`).join(',')
      ).join('\n');
      content = `${headers}\n${rows}`;
      mimeType = 'text/csv';
      extension = 'csv';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${generatedReport.title.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
    
    showToast('success', `Report downloaded as ${extension.toUpperCase()}`);
  };

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-right ${
              toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="text-white text-sm">{toast.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}>
              <X className="w-4 h-4 text-white/70 hover:text-white" />
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Reports</h1>
          <p className="text-slate-400 mt-1">Generate and schedule reports for analysis</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:border-pl-500 focus:ring-1 focus:ring-pl-500"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-100">{formatCurrency(stats.inventoryValue)}</p>
                <p className="text-sm text-slate-400">Inventory Value</p>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Factory className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-100">{stats.unitsProduced}</p>
                <p className="text-sm text-slate-400">Units {selectedPeriod === 'today' ? 'Today' : selectedPeriod === 'week' ? 'This Week' : selectedPeriod === 'month' ? 'This Month' : 'This Quarter'}</p>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-100">{formatPercent(stats.yieldRate)}</p>
                <p className="text-sm text-slate-400">Yield Rate</p>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-100">{stats.reportsGenerated}</p>
                <p className="text-sm text-slate-400">Reports Generated</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <div className="p-4">
          <SimpleTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>
      </Card>

      {/* Content */}
      {activeTab === 'generate' && (
        <>
          {/* Generated Report View */}
          {generatedReport && (
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">{generatedReport.title}</h3>
                    <p className="text-sm text-slate-400">
                      Period: {generatedReport.period} • Generated: {formatDate(generatedReport.generatedAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => downloadReport('csv')}>
                      <Download className="w-4 h-4 mr-1" />
                      CSV
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => downloadReport('json')}>
                      <Download className="w-4 h-4 mr-1" />
                      JSON
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setGeneratedReport(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {Object.entries(generatedReport.summary).map(([key, value]) => (
                    <div key={key} className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-xs text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                      <p className="text-lg font-bold text-slate-100">{value}</p>
                    </div>
                  ))}
                </div>
                
                {/* Data Table */}
                {generatedReport.data.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          {Object.keys(generatedReport.data[0]).map(key => (
                            <th key={key} className="text-left py-2 px-3 text-slate-400 font-medium capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {generatedReport.data.slice(0, 10).map((row, idx) => (
                          <tr key={idx} className="border-b border-slate-800">
                            {Object.values(row).map((value, cellIdx) => (
                              <td key={cellIdx} className="py-2 px-3 text-slate-300">
                                {String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {generatedReport.data.length > 10 && (
                      <p className="text-sm text-slate-500 mt-2 text-center">
                        Showing 10 of {generatedReport.data.length} rows. Download full report for all data.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Report Types */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportTypes.map((report) => {
              const Icon = report.icon;
              const isGeneratingThis = isGenerating && selectedReportType === report.id;
              
              return (
                <Card key={report.id}>
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-pl-500/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-pl-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-slate-100">{report.title}</h3>
                        <p className="text-sm text-slate-400 mt-1">{report.description}</p>
                        <p className="text-xs text-slate-500 mt-2">
                          Last generated: {report.lastGenerated}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => generateReport(report.id)}
                        disabled={isGenerating}
                      >
                        {isGeneratingThis ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <BarChart3 className="w-4 h-4 mr-2" />
                        )}
                        {isGeneratingThis ? 'Generating...' : 'Generate'}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          generateReport(report.id);
                        }}
                        disabled={isGenerating}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title="Schedule"
                        onClick={() => openScheduleModal(report.id)}
                      >
                        <Calendar className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {activeTab === 'scheduled' && (
        <Card>
          {scheduledReports.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-600" />
              <p className="mb-4">No scheduled reports configured</p>
              <Button size="sm" onClick={() => {
                setScheduleForm({ ...scheduleForm, reportType: 'inventory' });
                setShowScheduleModal(true);
              }}>
                Schedule a Report
              </Button>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-100">Scheduled Reports</h3>
                <Button size="sm" onClick={() => {
                  setScheduleForm({ ...scheduleForm, reportType: 'inventory' });
                  setEditingSchedule(null);
                  setShowScheduleModal(true);
                }}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Add Schedule
                </Button>
              </div>
              {scheduledReports.map(schedule => {
                const reportType = reportTypes.find(r => r.id === schedule.reportType);
                const Icon = reportType?.icon || FileText;
                return (
                  <div 
                    key={schedule.id} 
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      schedule.enabled 
                        ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800' 
                        : 'bg-slate-900/50 border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        schedule.enabled ? 'bg-pl-500/10' : 'bg-slate-700/50'
                      }`}>
                        <Icon className={`w-5 h-5 ${schedule.enabled ? 'text-pl-400' : 'text-slate-500'}`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-200">{schedule.reportTitle}</h4>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>{getFrequencyLabel(schedule)}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Next run: {formatDate(schedule.nextRun)}
                          {schedule.lastRun && ` • Last run: ${formatDate(schedule.lastRun)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={schedule.enabled ? 'success' : 'default'}>
                        {schedule.enabled ? 'Active' : 'Paused'}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => runScheduleNow(schedule)}
                        title="Run now"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => editSchedule(schedule)}
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleSchedule(schedule.id)}
                        title={schedule.enabled ? 'Pause' : 'Resume'}
                      >
                        {schedule.enabled ? '⏸' : '▶️'}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => deleteSchedule(schedule.id)}
                        title="Delete"
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'history' && (
        <Card>
          <div className="p-6">
            <div className="space-y-3">
              {reportHistory.map((report, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-200">{report.name}</p>
                      <p className="text-xs text-slate-500">{report.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{report.type}</Badge>
                    <Button variant="ghost" size="sm" onClick={() => generateReport(report.type)}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowScheduleModal(false)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md mx-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-100">
                  {editingSchedule ? 'Edit Schedule' : 'Schedule Report'}
                </h2>
                <button 
                  onClick={() => setShowScheduleModal(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Report Type */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Report Type</label>
                <select
                  value={scheduleForm.reportType}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, reportType: e.target.value }))}
                  disabled={!!editingSchedule}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:border-pl-500 focus:ring-1 focus:ring-pl-500 disabled:opacity-50"
                >
                  {reportTypes.map(r => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Frequency</label>
                <select
                  value={scheduleForm.frequency}
                  onChange={(e) => setScheduleForm(prev => ({ 
                    ...prev, 
                    frequency: e.target.value as 'daily' | 'weekly' | 'monthly' 
                  }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:border-pl-500 focus:ring-1 focus:ring-pl-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {/* Day of Week (for weekly) */}
              {scheduleForm.frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Day of Week</label>
                  <select
                    value={scheduleForm.dayOfWeek}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, dayOfWeek: parseInt(e.target.value) }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:border-pl-500 focus:ring-1 focus:ring-pl-500"
                  >
                    {DAYS_OF_WEEK.map((day, i) => (
                      <option key={i} value={i}>{day}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Day of Month (for monthly) */}
              {scheduleForm.frequency === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Day of Month</label>
                  <select
                    value={scheduleForm.dayOfMonth}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, dayOfMonth: parseInt(e.target.value) }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:border-pl-500 focus:ring-1 focus:ring-pl-500"
                  >
                    {Array.from({ length: 28 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">Max day 28 to ensure compatibility with all months</p>
                </div>
              )}

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Time</label>
                <input
                  type="time"
                  value={scheduleForm.time}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:border-pl-500 focus:ring-1 focus:ring-pl-500"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowScheduleModal(false)}>
                Cancel
              </Button>
              <Button onClick={saveSchedule}>
                <Calendar className="w-4 h-4 mr-2" />
                {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
