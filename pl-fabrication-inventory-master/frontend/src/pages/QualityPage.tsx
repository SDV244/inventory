import { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  BarChart3,
  Clipboard,
  X,
  AlertCircle,
  Cpu
} from 'lucide-react';
import { Card, MetricCard, Badge, ProgressBar, DataTable, SimpleTabs, Button, Modal, ModalFooter, Input, Textarea } from '../components/ui';
import type { Column } from '../components/ui/DataTable';
import { useQualityMetrics, useDefectAnalysis, useFailedQCRecords, useYieldTrend, usePendingQCDevices, useSubmitQC } from '../hooks';
import { formatPercent, formatDate } from '../utils/helpers';
import type { QCRecord, DefectAnalysis, Device } from '../types';

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'pending', label: 'Pending QC' },
  { id: 'failed', label: 'Failed Units' },
  { id: 'defects', label: 'Defect Analysis' },
];

const defectOptions = [
  { value: 'DEF-001', label: 'DEF-001: LED Wavelength Out of Spec' },
  { value: 'DEF-002', label: 'DEF-002: Solder Joint Defect' },
  { value: 'DEF-003', label: 'DEF-003: Housing Crack' },
  { value: 'DEF-004', label: 'DEF-004: Battery Connection Issue' },
  { value: 'DEF-005', label: 'DEF-005: Display Malfunction' },
  { value: 'DEF-006', label: 'DEF-006: Button Non-Responsive' },
  { value: 'DEF-007', label: 'DEF-007: Firmware Error' },
  { value: 'DEF-008', label: 'DEF-008: Intensity Below Threshold' },
];

export function QualityPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [inspectingDevice, setInspectingDevice] = useState<Device | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // QC Form state
  const [qcResult, setQcResult] = useState<'pass' | 'fail'>('pass');
  const [measurements, setMeasurements] = useState({
    wavelength660: '660',
    wavelength850: '850',
    batteryVoltage: '3.7',
    ledIntensity: '100',
  });
  const [selectedDefects, setSelectedDefects] = useState<string[]>([]);
  const [qcNotes, setQcNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: metrics, isLoading: metricsLoading } = useQualityMetrics();
  const { data: defectAnalysis, isLoading: defectsLoading } = useDefectAnalysis();
  const { data: failedRecords, isLoading: failedLoading } = useFailedQCRecords();
  const { data: yieldTrend } = useYieldTrend();
  const { data: pendingDevices, isLoading: pendingLoading } = usePendingQCDevices();
  const submitQC = useSubmitQC();

  const showToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const openInspection = (device: Device) => {
    setInspectingDevice(device);
    setQcResult('pass');
    setMeasurements({
      wavelength660: '660',
      wavelength850: '850',
      batteryVoltage: '3.7',
      ledIntensity: '100',
    });
    setSelectedDefects([]);
    setQcNotes('');
  };

  const handleSubmitQC = async () => {
    if (!inspectingDevice) return;
    
    setIsSubmitting(true);
    try {
      const measurementRecords = [
        { 
          parameter: 'Wavelength 660nm', 
          value: parseFloat(measurements.wavelength660), 
          unit: 'nm', 
          min: 650, 
          max: 670, 
          passed: parseFloat(measurements.wavelength660) >= 650 && parseFloat(measurements.wavelength660) <= 670 
        },
        { 
          parameter: 'Wavelength 850nm', 
          value: parseFloat(measurements.wavelength850), 
          unit: 'nm', 
          min: 840, 
          max: 860, 
          passed: parseFloat(measurements.wavelength850) >= 840 && parseFloat(measurements.wavelength850) <= 860 
        },
        { 
          parameter: 'Battery Voltage', 
          value: parseFloat(measurements.batteryVoltage), 
          unit: 'V', 
          min: 3.5, 
          max: 4.2, 
          passed: parseFloat(measurements.batteryVoltage) >= 3.5 && parseFloat(measurements.batteryVoltage) <= 4.2 
        },
        { 
          parameter: 'LED Intensity', 
          value: parseFloat(measurements.ledIntensity), 
          unit: '%', 
          min: 90, 
          max: 110, 
          passed: parseFloat(measurements.ledIntensity) >= 90 && parseFloat(measurements.ledIntensity) <= 110 
        },
      ];

      await submitQC.mutateAsync({
        deviceId: inspectingDevice.id,
        passed: qcResult === 'pass',
        measurements: measurementRecords,
        notes: qcNotes || undefined,
        defectCodes: qcResult === 'fail' ? selectedDefects : undefined,
      });

      showToast('success', `QC ${qcResult === 'pass' ? 'passed' : 'failed'} for ${inspectingDevice.serialNumber}`);
      setInspectingDevice(null);
    } catch (error) {
      showToast('error', 'Failed to submit QC record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDefect = (defectCode: string) => {
    setSelectedDefects(prev => 
      prev.includes(defectCode) 
        ? prev.filter(d => d !== defectCode)
        : [...prev, defectCode]
    );
  };

  const pendingColumns: Column<Device>[] = [
    {
      key: 'serialNumber',
      header: 'Serial Number',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-amber-400" />
          </div>
          <span className="font-mono font-medium text-slate-100">{item.serialNumber}</span>
        </div>
      ),
    },
    {
      key: 'product',
      header: 'Product',
      render: (item) => (
        <span className="text-slate-300">{item.bom?.name || 'Unknown'}</span>
      ),
    },
    {
      key: 'manufactureDate',
      header: 'Manufactured',
      render: (item) => (
        <span className="text-sm text-slate-400">{item.manufactureDate ? formatDate(item.manufactureDate) : '-'}</span>
      ),
    },
    {
      key: 'qcRecords',
      header: 'Prior QC',
      render: (item) => (
        <span className="text-sm text-slate-400">{item.qcRecords.length} records</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (item) => (
        <Button size="sm" onClick={() => openInspection(item)}>
          <Clipboard className="w-4 h-4 mr-2" />
          Inspect
        </Button>
      ),
    },
  ];

  const failedColumns: Column<QCRecord>[] = [
    {
      key: 'deviceId',
      header: 'Device',
      render: (item) => (
        <span className="font-mono text-slate-200">{item.deviceId}</span>
      ),
    },
    {
      key: 'performedAt',
      header: 'Date',
      render: (item) => (
        <span className="text-sm text-slate-400">{formatDate(item.performedAt)}</span>
      ),
    },
    {
      key: 'performedBy',
      header: 'Inspector',
      render: (item) => (
        <span className="text-sm text-slate-300">{item.performedBy}</span>
      ),
    },
    {
      key: 'defects',
      header: 'Defects',
      render: (item) => (
        <div className="flex flex-wrap gap-1">
          {item.defectCodes?.map((code) => (
            <Badge key={code} variant="danger">{code}</Badge>
          )) || <span className="text-slate-500">—</span>}
        </div>
      ),
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (item) => (
        <p className="text-sm text-slate-400 max-w-xs truncate">{item.notes || '—'}</p>
      ),
    },
  ];

  const defectColumns: Column<DefectAnalysis>[] = [
    {
      key: 'defectCode',
      header: 'Code',
      render: (item) => (
        <span className="font-mono text-slate-200">{item.defectCode}</span>
      ),
    },
    {
      key: 'defectName',
      header: 'Description',
      render: (item) => (
        <span className="text-slate-300">{item.defectName}</span>
      ),
    },
    {
      key: 'count',
      header: 'Count',
      render: (item) => (
        <span className="text-slate-200 font-medium">{item.count}</span>
      ),
    },
    {
      key: 'percentage',
      header: 'Distribution',
      render: (item) => (
        <div className="flex items-center gap-3 w-48">
          <ProgressBar value={item.percentage} max={100} size="sm" />
          <span className="text-sm text-slate-400 w-12">{formatPercent(item.percentage)}</span>
        </div>
      ),
    },
  ];

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
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Quality Control</h1>
        <p className="text-slate-400 mt-1">Monitor quality metrics and perform inspections</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Yield Rate"
          value={metricsLoading ? '...' : formatPercent(metrics?.firstPassYield || 0)}
          icon={<TrendingUp className="w-6 h-6" />}
          trend={{ value: 2.1 }}
          subtitle="Overall pass rate"
        />
        <MetricCard
          title="Pending QC"
          value={metricsLoading ? '...' : String(metrics?.pendingInspections || 0)}
          icon={<Clock className="w-6 h-6" />}
          subtitle="Awaiting inspection"
        />
        <MetricCard
          title="Failed Units"
          value={metricsLoading ? '...' : String(metrics ? Math.round((metrics.failRate / 100) * metrics.totalInspections) : 0)}
          icon={<XCircle className="w-6 h-6" />}
          subtitle="Total failed"
        />
        <MetricCard
          title="Total Inspected"
          value={metricsLoading ? '...' : String(metrics?.totalInspections || 0)}
          icon={<CheckCircle className="w-6 h-6" />}
          subtitle="All time"
        />
      </div>

      {/* Tabs */}
      <Card>
        <div className="p-4">
          <SimpleTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>
      </Card>

      {/* Content based on tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Yield Trend */}
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-pl-400" />
                <h2 className="text-lg font-semibold text-slate-100">Yield Trend</h2>
              </div>
              <div className="space-y-3">
                {yieldTrend?.map((day) => (
                  <div key={day.date} className="flex items-center gap-4">
                    <span className="text-sm text-slate-400 w-10">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <div className="flex-1">
                      <ProgressBar value={day.yieldRate} max={100} size="sm" />
                    </div>
                    <span className="text-sm text-slate-300 w-12">{formatPercent(day.yieldRate)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Top Defects */}
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-semibold text-slate-100">Top Defects</h2>
              </div>
              <div className="space-y-3">
                {defectAnalysis?.slice(0, 5).map((defect) => (
                  <div key={defect.defectCode} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{defect.defectName}</p>
                      <p className="text-xs text-slate-500">{defect.defectCode}</p>
                    </div>
                    <Badge variant={defect.percentage > 20 ? 'danger' : defect.percentage > 10 ? 'warning' : 'default'}>
                      {defect.count} ({formatPercent(defect.percentage)})
                    </Badge>
                  </div>
                ))}
                {(!defectAnalysis || defectAnalysis.length === 0) && (
                  <p className="text-slate-500 text-center py-4">No defects recorded</p>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'pending' && (
        <Card>
          {pendingDevices && pendingDevices.length > 0 ? (
            <DataTable
              data={pendingDevices}
              columns={pendingColumns}
              isLoading={pendingLoading}
              emptyMessage="No devices pending QC"
              keyExtractor={(item) => item.id}
            />
          ) : (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-emerald-500/50" />
              <p className="text-lg font-medium text-slate-300">All caught up!</p>
              <p className="mt-1">No devices pending quality inspection</p>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'failed' && (
        <Card>
          <DataTable
            data={failedRecords || []}
            columns={failedColumns}
            isLoading={failedLoading}
            emptyMessage="No failed QC records"
            keyExtractor={(item) => item.id}
          />
        </Card>
      )}

      {activeTab === 'defects' && (
        <Card>
          <DataTable
            data={defectAnalysis || []}
            columns={defectColumns}
            isLoading={defectsLoading}
            emptyMessage="No defect data available"
            keyExtractor={(item) => item.defectCode}
          />
        </Card>
      )}

      {/* QC Inspection Modal */}
      <Modal
        isOpen={!!inspectingDevice}
        onClose={() => setInspectingDevice(null)}
        title={`QC Inspection: ${inspectingDevice?.serialNumber || ''}`}
        size="lg"
      >
        {inspectingDevice && (
          <div className="space-y-6">
            {/* Device Info */}
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Product</p>
                  <p className="text-slate-100">{inspectingDevice.bom?.name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Manufacture Date</p>
                  <p className="text-slate-100">{inspectingDevice.manufactureDate ? formatDate(inspectingDevice.manufactureDate) : '-'}</p>
                </div>
              </div>
            </div>

            {/* Result Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Inspection Result</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setQcResult('pass')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    qcResult === 'pass'
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <CheckCircle className={`w-8 h-8 mx-auto mb-2 ${qcResult === 'pass' ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <p className={`font-medium ${qcResult === 'pass' ? 'text-emerald-400' : 'text-slate-400'}`}>PASS</p>
                </button>
                <button
                  onClick={() => setQcResult('fail')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    qcResult === 'fail'
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <XCircle className={`w-8 h-8 mx-auto mb-2 ${qcResult === 'fail' ? 'text-red-400' : 'text-slate-500'}`} />
                  <p className={`font-medium ${qcResult === 'fail' ? 'text-red-400' : 'text-slate-400'}`}>FAIL</p>
                </button>
              </div>
            </div>

            {/* Measurements */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Measurements</label>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Wavelength 660nm (650-670)"
                  type="number"
                  value={measurements.wavelength660}
                  onChange={(e) => setMeasurements(prev => ({ ...prev, wavelength660: e.target.value }))}
                  className={parseFloat(measurements.wavelength660) >= 650 && parseFloat(measurements.wavelength660) <= 670 ? '' : 'border-red-500'}
                />
                <Input
                  label="Wavelength 850nm (840-860)"
                  type="number"
                  value={measurements.wavelength850}
                  onChange={(e) => setMeasurements(prev => ({ ...prev, wavelength850: e.target.value }))}
                />
                <Input
                  label="Battery Voltage (3.5-4.2V)"
                  type="number"
                  step="0.1"
                  value={measurements.batteryVoltage}
                  onChange={(e) => setMeasurements(prev => ({ ...prev, batteryVoltage: e.target.value }))}
                />
                <Input
                  label="LED Intensity (90-110%)"
                  type="number"
                  value={measurements.ledIntensity}
                  onChange={(e) => setMeasurements(prev => ({ ...prev, ledIntensity: e.target.value }))}
                />
              </div>
            </div>

            {/* Defects (shown when fail is selected) */}
            {qcResult === 'fail' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Defect Codes</label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {defectOptions.map(defect => (
                    <button
                      key={defect.value}
                      onClick={() => toggleDefect(defect.value)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        selectedDefects.includes(defect.value)
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <span className={selectedDefects.includes(defect.value) ? 'text-red-300' : 'text-slate-300'}>
                        {defect.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <Textarea
              label="Notes (Optional)"
              placeholder="Additional observations or comments..."
              value={qcNotes}
              onChange={(e) => setQcNotes(e.target.value)}
            />
          </div>
        )}

        <ModalFooter>
          <Button variant="ghost" onClick={() => setInspectingDevice(null)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitQC} 
            disabled={isSubmitting || (qcResult === 'fail' && selectedDefects.length === 0)}
            className={qcResult === 'pass' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
          >
            {isSubmitting ? 'Submitting...' : qcResult === 'pass' ? 'Submit Pass' : 'Submit Fail'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
