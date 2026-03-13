import { useState } from 'react';
import { 
  Cpu, Download, Eye, QrCode, CheckCircle, AlertCircle, X, 
  Package, Calendar, Clipboard, ShoppingCart, User, DollarSign,
  Truck
} from 'lucide-react';
import { Card, Button, SearchInput, DataTable, Badge, SimpleTabs, Modal, ModalFooter, Input, Textarea } from '../components/ui';
import type { Column } from '../components/ui/DataTable';
import { useDevices, useDevice, useUpdateDeviceStatus } from '../hooks';
import { formatDate, formatCurrency } from '../utils/helpers';
import type { Device } from '../types';

const statusConfig: Record<string, { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'danger' | 'purple' }> = {
  'in-production': { label: 'En Producción', variant: 'purple' },
  'qc-pending': { label: 'QC Pendiente', variant: 'warning' },
  'qc-passed': { label: 'Disponible', variant: 'success' },
  'qc-failed': { label: 'QC Fallido', variant: 'danger' },
  'sold': { label: 'Vendido', variant: 'info' },
  'shipped': { label: 'Enviado', variant: 'default' },
  'rma': { label: 'RMA', variant: 'danger' },
};

const tabs = [
  { id: 'all', label: 'Todos' },
  { id: 'qc-passed', label: 'Disponibles' },
  { id: 'sold', label: 'Vendidos' },
  { id: 'shipped', label: 'Enviados' },
  { id: 'in-production', label: 'En Producción' },
];

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

export function DevicesPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrDeviceSerial, setQRDeviceSerial] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Sell modal state
  const [showSellModal, setShowSellModal] = useState(false);
  const [sellingDevice, setSellingDevice] = useState<Device | null>(null);
  const [saleForm, setSaleForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerCompany: '',
    salePrice: '',
    invoiceNumber: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Ship modal state
  const [showShipModal, setShowShipModal] = useState(false);
  const [shippingDevice, setShippingDevice] = useState<Device | null>(null);
  const [shipForm, setShipForm] = useState({
    dispatchDate: new Date().toISOString().split('T')[0],
    trackingNumber: '',
  });
  
  const { data: devices, isLoading } = useDevices();
  const { data: selectedDevice } = useDevice(selectedDeviceId || '');
  const updateDeviceStatus = useUpdateDeviceStatus();

  const showToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const filteredDevices = devices?.filter((d) => {
    const searchLower = search.toLowerCase();
    const matchesSearch = !search || 
      d.serialNumber.toLowerCase().includes(searchLower) ||
      d.status.toLowerCase().includes(searchLower) ||
      d.bom?.name.toLowerCase().includes(searchLower) ||
      d.customer?.name?.toLowerCase().includes(searchLower);
    const matchesTab = activeTab === 'all' || d.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleViewDetails = (device: Device) => {
    setSelectedDeviceId(device.id);
  };

  const handleShowQR = (device: Device) => {
    setQRDeviceSerial(device.serialNumber);
    setShowQRModal(true);
  };

  const openSellModal = (device: Device) => {
    setSellingDevice(device);
    setSaleForm({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerCompany: '',
      salePrice: '',
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      notes: '',
    });
    setShowSellModal(true);
  };

  const handleSellDevice = async () => {
    if (!sellingDevice || !saleForm.customerName) {
      showToast('error', 'Por favor ingrese el nombre del cliente');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await updateDeviceStatus.mutateAsync({ 
        id: sellingDevice.id, 
        status: 'sold',
        saleData: {
          customerName: saleForm.customerName,
          customerEmail: saleForm.customerEmail || undefined,
          customerPhone: saleForm.customerPhone || undefined,
          customerCompany: saleForm.customerCompany || undefined,
          salePrice: parseFloat(saleForm.salePrice) || undefined,
          invoiceNumber: saleForm.invoiceNumber || undefined,
          notes: saleForm.notes || undefined,
        },
      });
      
      showToast('success', `Dispositivo ${sellingDevice.serialNumber} vendido a ${saleForm.customerName}`);
      setShowSellModal(false);
    } catch (error) {
      showToast('error', 'Error al registrar la venta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openShipModal = (device: Device) => {
    setShippingDevice(device);
    setShipForm({
      dispatchDate: new Date().toISOString().split('T')[0],
      trackingNumber: '',
    });
    setShowShipModal(true);
  };

  const handleMarkShipped = async () => {
    if (!shippingDevice) return;
    
    setIsSubmitting(true);
    try {
      await updateDeviceStatus.mutateAsync({ 
        id: shippingDevice.id, 
        status: 'shipped',
        shipData: {
          dispatchDate: shipForm.dispatchDate,
          trackingNumber: shipForm.trackingNumber || undefined,
        },
      });
      showToast('success', `Dispositivo ${shippingDevice.serialNumber} marcado como enviado`);
      setShowShipModal(false);
    } catch (error) {
      showToast('error', 'Error al actualizar estado');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePaid = async (device: Device) => {
    try {
      await updateDeviceStatus.mutateAsync({ 
        id: device.id, 
        status: device.status, // Keep same status
        paymentData: {
          isPaid: !device.isPaid,
          paidDate: !device.isPaid ? new Date().toISOString() : undefined,
        },
      });
      showToast('success', device.isPaid ? 'Marcado como no pagado' : 'Marcado como pagado');
    } catch (error) {
      showToast('error', 'Error al actualizar pago');
    }
  };

  const handleExportDevice = (device: Device) => {
    const data = {
      serialNumber: device.serialNumber,
      status: device.status,
      manufactureDate: device.manufactureDate,
      plCharacteristics: device.plCharacteristics,
      qcRecords: device.qcRecords,
      buildHistory: device.buildHistory,
      customer: device.customer,
      soldDate: device.soldDate,
      salePrice: device.salePrice,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `device-${device.serialNumber}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    showToast('success', `Exportado ${device.serialNumber}`);
  };

  const handleExportRegistry = () => {
    if (!devices || devices.length === 0) {
      showToast('error', 'No hay dispositivos para exportar');
      return;
    }
    
    const csvHeaders = ['Serial Number', 'Status', 'Manufacture Date', 'Customer', 'Sale Date', 'Sale Price', 'Peak Wavelength', 'FWHM'];
    const csvRows = devices.map(d => [
      d.serialNumber,
      d.status,
      d.manufactureDate,
      d.customer?.name || '',
      d.soldDate || '',
      d.salePrice || '',
      d.plCharacteristics?.peakWavelength || '',
      d.plCharacteristics?.fwhm || '',
    ].join(','));
    
    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `device-registry-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    showToast('success', `Exportados ${devices.length} dispositivos`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('success', '¡Copiado!');
  };

  // Generate QR code as SVG (simple implementation)
  const generateQRSVG = (data: string) => {
    const size = 200;
    const cellSize = 10;
    const cells = Math.floor(size / cellSize);
    
    const pattern: boolean[][] = [];
    for (let i = 0; i < cells; i++) {
      pattern[i] = [];
      for (let j = 0; j < cells; j++) {
        const hash = (data.charCodeAt(i % data.length) + j * 31 + i * 17) % 100;
        pattern[i][j] = hash > 50;
      }
    }
    
    const addFinder = (startX: number, startY: number) => {
      for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
          const isOuter = i === 0 || i === 6 || j === 0 || j === 6;
          const isInner = i >= 2 && i <= 4 && j >= 2 && j <= 4;
          pattern[startY + i][startX + j] = isOuter || isInner;
        }
      }
    };
    
    addFinder(0, 0);
    addFinder(cells - 7, 0);
    addFinder(0, cells - 7);
    
    let rects = '';
    for (let i = 0; i < cells; i++) {
      for (let j = 0; j < cells; j++) {
        if (pattern[i][j]) {
          rects += `<rect x="${j * cellSize}" y="${i * cellSize}" width="${cellSize}" height="${cellSize}" fill="#1e293b"/>`;
        }
      }
    }
    
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <rect width="100%" height="100%" fill="white"/>
      ${rects}
    </svg>`;
  };

  // Stats
  const stats = {
    total: devices?.length || 0,
    available: devices?.filter(d => d.status === 'qc-passed').length || 0,
    sold: devices?.filter(d => d.status === 'sold').length || 0,
    shipped: devices?.filter(d => d.status === 'shipped').length || 0,
    inProduction: devices?.filter(d => d.status === 'in-production').length || 0,
  };

  const columns: Column<Device>[] = [
    {
      key: 'serialNumber',
      header: 'Serial Number',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            item.status === 'sold' ? 'bg-blue-500/10' : 
            item.status === 'qc-passed' ? 'bg-emerald-500/10' : 'bg-slate-800'
          }`}>
            <Cpu className={`w-5 h-5 ${
              item.status === 'sold' ? 'text-blue-400' : 
              item.status === 'qc-passed' ? 'text-emerald-400' : 'text-pl-400'
            }`} />
          </div>
          <span className="font-mono font-medium text-slate-100">{item.serialNumber}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (item) => {
        const status = statusConfig[item.status];
        return <Badge variant={status?.variant || 'default'}>{status?.label || item.status}</Badge>;
      },
    },
    {
      key: 'customer',
      header: 'Cliente',
      render: (item) => (
        item.customer ? (
          <div className="text-sm">
            <p className="text-slate-200 font-medium">{item.customer.name}</p>
            {item.customer.company && <p className="text-slate-500">{item.customer.company}</p>}
          </div>
        ) : (
          <span className="text-slate-500">—</span>
        )
      ),
    },
    {
      key: 'soldDate',
      header: 'Fecha Venta',
      render: (item) => (
        item.soldDate ? (
          <span className="text-sm text-slate-400">{formatDate(item.soldDate)}</span>
        ) : (
          <span className="text-slate-500">—</span>
        )
      ),
    },
    {
      key: 'salePrice',
      header: 'Precio',
      render: (item) => (
        item.salePrice ? (
          <span className="text-sm font-medium text-emerald-400">{formatCurrency(item.salePrice)}</span>
        ) : (
          <span className="text-slate-500">—</span>
        )
      ),
    },
    {
      key: 'isPaid',
      header: 'Pagado',
      render: (item) => (
        (item.status === 'sold' || item.status === 'shipped') ? (
          <div className="flex flex-col gap-1">
            <button 
              onClick={() => handleTogglePaid(item)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                item.isPaid 
                  ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              }`}
            >
              {item.isPaid ? <CheckCircle className="w-3 h-3" /> : <X className="w-3 h-3" />}
              {item.isPaid ? 'Sí' : 'No'}
            </button>
            {item.isPaid && item.paidDate && (
              <span className="text-xs text-slate-500">{formatDate(item.paidDate)}</span>
            )}
          </div>
        ) : (
          <span className="text-slate-500">—</span>
        )
      ),
    },
    {
      key: 'dispatchDate',
      header: 'Despacho',
      render: (item) => (
        item.dispatchDate ? (
          <span className="text-sm text-slate-400">{formatDate(item.dispatchDate)}</span>
        ) : (
          <span className="text-slate-500">—</span>
        )
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (item) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => handleViewDetails(item)} title="Ver Detalles">
            <Eye className="w-4 h-4" />
          </Button>
          {item.status === 'qc-passed' && (
            <Button variant="ghost" size="sm" onClick={() => openSellModal(item)} title="Vender" className="text-emerald-400">
              <ShoppingCart className="w-4 h-4" />
            </Button>
          )}
          {item.status === 'sold' && (
            <Button variant="ghost" size="sm" onClick={() => openShipModal(item)} title="Despachar" className="text-blue-400">
              <Truck className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => handleShowQR(item)} title="Código QR">
            <QrCode className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleExportDevice(item)} title="Exportar">
            <Download className="w-4 h-4" />
          </Button>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Registro de Dispositivos</h1>
          <p className="text-slate-400 mt-1">Seguimiento de dispositivos y ventas</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleExportRegistry}>
          <Download className="w-4 h-4 mr-2" />
          Exportar Registro
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-100">{stats.total}</p>
            <p className="text-sm text-slate-400">Total</p>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{stats.available}</p>
            <p className="text-sm text-slate-400">Disponibles</p>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{stats.sold}</p>
            <p className="text-sm text-slate-400">Vendidos</p>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-400">{stats.shipped}</p>
            <p className="text-sm text-slate-400">Enviados</p>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-400">{stats.inProduction}</p>
            <p className="text-sm text-slate-400">En Producción</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4 space-y-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por serial, cliente..."
            className="max-w-md"
          />
          <SimpleTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>
      </Card>

      {/* Table */}
      <Card>
        <DataTable
          data={filteredDevices || []}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="No hay dispositivos"
          keyExtractor={(item) => item.id}
        />
      </Card>

      {/* Sell Modal */}
      <Modal
        isOpen={showSellModal}
        onClose={() => setShowSellModal(false)}
        title="Registrar Venta"
        size="md"
      >
        {sellingDevice && (
          <div className="space-y-4">
            {/* Device Info */}
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Cpu className="w-8 h-8 text-emerald-400" />
                <div>
                  <p className="font-mono font-bold text-slate-100">{sellingDevice.serialNumber}</p>
                  <p className="text-sm text-slate-400">{sellingDevice.bom?.name || 'Dispositivo'}</p>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <User className="w-4 h-4" />
                Información del Cliente
              </h3>
              
              <Input
                label="Nombre del Cliente *"
                placeholder="Nombre completo"
                value={saleForm.customerName}
                onChange={(e) => setSaleForm(prev => ({ ...prev, customerName: e.target.value }))}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="cliente@email.com"
                  value={saleForm.customerEmail}
                  onChange={(e) => setSaleForm(prev => ({ ...prev, customerEmail: e.target.value }))}
                />
                <Input
                  label="Teléfono"
                  placeholder="+57 300 123 4567"
                  value={saleForm.customerPhone}
                  onChange={(e) => setSaleForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                />
              </div>
              
              <Input
                label="Empresa"
                placeholder="Nombre de la empresa (opcional)"
                value={saleForm.customerCompany}
                onChange={(e) => setSaleForm(prev => ({ ...prev, customerCompany: e.target.value }))}
              />
            </div>

            {/* Sale Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Información de Venta
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Precio de Venta"
                  type="number"
                  placeholder="0.00"
                  value={saleForm.salePrice}
                  onChange={(e) => setSaleForm(prev => ({ ...prev, salePrice: e.target.value }))}
                />
                <Input
                  label="Número de Factura"
                  placeholder="INV-2024-001"
                  value={saleForm.invoiceNumber}
                  onChange={(e) => setSaleForm(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                />
              </div>
              
              <Textarea
                label="Notas"
                placeholder="Notas adicionales sobre la venta..."
                value={saleForm.notes}
                onChange={(e) => setSaleForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
        )}

        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowSellModal(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSellDevice} 
            disabled={isSubmitting || !saleForm.customerName}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Registrando...' : 'Registrar Venta'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Device Details Modal */}
      <Modal
        isOpen={!!selectedDeviceId}
        onClose={() => setSelectedDeviceId(null)}
        title="Detalles del Dispositivo"
        size="lg"
      >
        {selectedDevice && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center">
                  <Cpu className="w-6 h-6 text-pl-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-mono font-bold text-slate-100">
                      {selectedDevice.serialNumber}
                    </h3>
                    <button 
                      onClick={() => copyToClipboard(selectedDevice.serialNumber)}
                      className="p-1 hover:bg-slate-700 rounded"
                      title="Copiar serial"
                    >
                      <Clipboard className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                  <Badge variant={statusConfig[selectedDevice.status]?.variant || 'default'}>
                    {statusConfig[selectedDevice.status]?.label || selectedDevice.status}
                  </Badge>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleShowQR(selectedDevice)}>
                <QrCode className="w-5 h-5" />
              </Button>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Fecha de Fabricación</span>
                </div>
                <p className="text-slate-100">{selectedDevice.manufactureDate ? formatDate(selectedDevice.manufactureDate) : '-'}</p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Package className="w-4 h-4" />
                  <span className="text-sm">Producto</span>
                </div>
                <p className="text-slate-100">{selectedDevice.bom?.name || 'Desconocido'}</p>
              </div>
            </div>

            {/* Customer Info (if sold) */}
            {selectedDevice.customer && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h4 className="text-sm font-medium text-blue-300 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Información del Cliente
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Nombre</p>
                    <p className="text-slate-100 font-medium">{selectedDevice.customer.name}</p>
                  </div>
                  {selectedDevice.customer.company && (
                    <div>
                      <p className="text-slate-400">Empresa</p>
                      <p className="text-slate-100">{selectedDevice.customer.company}</p>
                    </div>
                  )}
                  {selectedDevice.customer.email && (
                    <div>
                      <p className="text-slate-400">Email</p>
                      <p className="text-slate-100">{selectedDevice.customer.email}</p>
                    </div>
                  )}
                  {selectedDevice.customer.phone && (
                    <div>
                      <p className="text-slate-400">Teléfono</p>
                      <p className="text-slate-100">{selectedDevice.customer.phone}</p>
                    </div>
                  )}
                  {selectedDevice.soldDate && (
                    <div>
                      <p className="text-slate-400">Fecha de Venta</p>
                      <p className="text-slate-100">{formatDate(selectedDevice.soldDate)}</p>
                    </div>
                  )}
                  {selectedDevice.salePrice && (
                    <div>
                      <p className="text-slate-400">Precio</p>
                      <p className="text-emerald-400 font-bold">{formatCurrency(selectedDevice.salePrice)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-slate-400">Estado de Pago</p>
                    <p className={selectedDevice.isPaid ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                      {selectedDevice.isPaid ? '✓ Pagado' : '✗ Pendiente'}
                    </p>
                  </div>
                  {selectedDevice.isPaid && selectedDevice.paidDate && (
                    <div>
                      <p className="text-slate-400">Fecha de Pago</p>
                      <p className="text-slate-100">{formatDate(selectedDevice.paidDate)}</p>
                    </div>
                  )}
                  {selectedDevice.dispatchDate && (
                    <div>
                      <p className="text-slate-400">Fecha de Despacho</p>
                      <p className="text-slate-100">{formatDate(selectedDevice.dispatchDate)}</p>
                    </div>
                  )}
                  {selectedDevice.trackingNumber && (
                    <div>
                      <p className="text-slate-400">Tracking</p>
                      <p className="text-slate-100 font-mono">{selectedDevice.trackingNumber}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PL Characteristics */}
            {selectedDevice.plCharacteristics && (
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-3">Características PL</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-800/50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-pl-400">
                      {selectedDevice.plCharacteristics.peakWavelength}
                    </p>
                    <p className="text-xs text-slate-400">Peak λ (nm)</p>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-slate-100">
                      {selectedDevice.plCharacteristics.fwhm}
                    </p>
                    <p className="text-xs text-slate-400">FWHM (nm)</p>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-slate-100">
                      {selectedDevice.plCharacteristics.intensity}
                    </p>
                    <p className="text-xs text-slate-400">Intensidad (rel)</p>
                  </div>
                </div>
              </div>
            )}

            {/* QC Records */}
            {selectedDevice.qcRecords.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-3">Registros QC</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedDevice.qcRecords.map((qc) => (
                    <div 
                      key={qc.id}
                      className={`p-3 rounded-lg border ${
                        qc.passed 
                          ? 'bg-emerald-500/10 border-emerald-500/30' 
                          : 'bg-red-500/10 border-red-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {qc.passed ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-400" />
                          )}
                          <span className="font-medium text-slate-100">
                            {qc.passed ? 'Aprobado' : 'Fallido'}
                          </span>
                        </div>
                        <span className="text-sm text-slate-400">
                          {formatDate(qc.performedAt)}
                        </span>
                      </div>
                      {qc.notes && (
                        <p className="text-sm text-slate-400 mt-1">{qc.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Build History */}
            {selectedDevice.buildHistory.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-3">Historial</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedDevice.buildHistory.map((event) => (
                    <div key={event.id} className="flex items-start gap-3 p-2">
                      <div className="w-2 h-2 rounded-full bg-slate-500 mt-2" />
                      <div className="flex-1">
                        <p className="text-sm text-slate-100">{event.description}</p>
                        <p className="text-xs text-slate-500">{formatDate(event.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <ModalFooter>
          <Button variant="ghost" onClick={() => setSelectedDeviceId(null)}>
            Cerrar
          </Button>
          {selectedDevice && selectedDevice.status === 'qc-passed' && (
            <Button onClick={() => { setSelectedDeviceId(null); openSellModal(selectedDevice); }}>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Vender
            </Button>
          )}
          {selectedDevice && (
            <Button variant="ghost" onClick={() => handleExportDevice(selectedDevice)}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          )}
        </ModalFooter>
      </Modal>

      {/* Ship Modal */}
      <Modal
        isOpen={showShipModal}
        onClose={() => setShowShipModal(false)}
        title="Registrar Despacho"
        size="sm"
      >
        {shippingDevice && (
          <div className="space-y-4">
            {/* Device Info */}
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Truck className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="font-mono font-bold text-slate-100">{shippingDevice.serialNumber}</p>
                  <p className="text-sm text-slate-400">
                    Cliente: {shippingDevice.customer?.name || 'Sin cliente'}
                  </p>
                </div>
              </div>
            </div>

            {/* Dispatch Info */}
            <Input
              label="Fecha de Despacho *"
              type="date"
              value={shipForm.dispatchDate}
              onChange={(e) => setShipForm(prev => ({ ...prev, dispatchDate: e.target.value }))}
            />
            
            <Input
              label="Número de Seguimiento"
              placeholder="Ej: 1Z999AA10123456784"
              value={shipForm.trackingNumber}
              onChange={(e) => setShipForm(prev => ({ ...prev, trackingNumber: e.target.value }))}
            />
          </div>
        )}

        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowShipModal(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleMarkShipped} 
            disabled={isSubmitting || !shipForm.dispatchDate}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Truck className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Registrando...' : 'Confirmar Despacho'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title="Código QR del Dispositivo"
        size="sm"
      >
        <div className="flex flex-col items-center py-4">
          <div 
            className="bg-white p-4 rounded-lg mb-4"
            dangerouslySetInnerHTML={{ __html: generateQRSVG(qrDeviceSerial) }}
          />
          <p className="font-mono text-lg text-slate-100 mb-2">{qrDeviceSerial}</p>
          <p className="text-sm text-slate-400 text-center">
            Escanea este código para ver los detalles del dispositivo
          </p>
        </div>

        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowQRModal(false)}>
            Cerrar
          </Button>
          <Button onClick={() => copyToClipboard(qrDeviceSerial)}>
            <Clipboard className="w-4 h-4 mr-2" />
            Copiar Serial
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
