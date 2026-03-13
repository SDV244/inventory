import { useState, useRef } from 'react';
import { Plus, Download, Upload, X, AlertCircle, CheckCircle, Edit2, Trash2 } from 'lucide-react';
import { Card, Button, SearchInput, DataTable, Badge, StockIndicator, SimpleTabs, Modal, ModalFooter, Input, Select, Textarea } from '../components/ui';
import type { Column } from '../components/ui/DataTable';
import { useComponents, useCreateComponent, useUpdateComponent, useDeleteComponent } from '../hooks';
import { formatCurrency } from '../utils/helpers';
import type { Component, ComponentCategory } from '../types';

const categoryLabels: Record<ComponentCategory, string> = {
  AS: 'Accesorios',
  KR: 'Carcasa',
  NX: 'Conexiones',
  EL: 'Electrónica',
  PQ: 'Empaque',
  PT: 'Potencia',
  EQ: 'Equipos',
  HE: 'Herramientas',
  OT: 'Otros',
};

const categoryOptions = Object.entries(categoryLabels).map(([value, label]) => ({
  value,
  label,
}));

const unitOptions = [
  { value: 'ea', label: 'Each (ea)' },
  { value: 'g', label: 'Grams (g)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'ml', label: 'Milliliters (ml)' },
  { value: 'L', label: 'Liters (L)' },
  { value: 'm', label: 'Meters (m)' },
  { value: 'pcs', label: 'Pieces (pcs)' },
];

const tabs = [
  { id: 'all', label: 'Todos' },
  { id: 'EL', label: 'Electrónica' },
  { id: 'PT', label: 'Potencia' },
  { id: 'NX', label: 'Conexiones' },
  { id: 'KR', label: 'Carcasa' },
  { id: 'AS', label: 'Accesorios' },
  { id: 'PQ', label: 'Empaque' },
];

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

export function InventoryPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<Component | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: components, isLoading } = useComponents();
  const createComponent = useCreateComponent();
  const updateComponent = useUpdateComponent();
  const deleteComponent = useDeleteComponent();

  // Form state
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category: 'EL' as ComponentCategory,
    unitOfMeasure: 'ea',
    unitCost: '',
    currentStock: '',
    minStock: '',
    maxStock: '',
    reorderPoint: '',
    location: '',
    supplier: '',
    leadTimeDays: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const filteredComponents = components?.filter((c: Component) => {
    const searchLower = search.toLowerCase();
    const matchesSearch = !search ||
      c.name.toLowerCase().includes(searchLower) ||
      c.sku.toLowerCase().includes(searchLower) ||
      c.description.toLowerCase().includes(searchLower) ||
      (c.supplier || '').toLowerCase().includes(searchLower) ||
      c.location.toLowerCase().includes(searchLower);
    const matchesCategory = activeTab === 'all' || c.category === activeTab;
    return matchesSearch && matchesCategory;
  });

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.sku.trim()) errors.sku = 'SKU is required';
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.category) errors.category = 'Category is required';
    if (!formData.unitCost || parseFloat(formData.unitCost) < 0) errors.unitCost = 'Valid unit cost is required';
    if (!formData.currentStock || parseInt(formData.currentStock) < 0) errors.currentStock = 'Valid stock is required';
    if (!formData.location.trim()) errors.location = 'Location is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const componentData = {
        sku: formData.sku,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        unitOfMeasure: formData.unitOfMeasure,
        unitCost: parseFloat(formData.unitCost),
        currentStock: parseInt(formData.currentStock),
        minStock: parseInt(formData.minStock) || 0,
        maxStock: parseInt(formData.maxStock) || 1000,
        reorderPoint: parseInt(formData.reorderPoint) || 10,
        location: formData.location,
        supplier: formData.supplier,
        leadTimeDays: parseInt(formData.leadTimeDays) || 7,
      };

      if (editingComponent) {
        await updateComponent.mutateAsync({
          id: editingComponent.id,
          data: componentData,
        });
        showToast('success', `Component "${formData.name}" updated successfully!`);
      } else {
        await createComponent.mutateAsync(componentData);
        showToast('success', `Component "${formData.name}" created successfully!`);
      }
      
      setIsAddModalOpen(false);
      setEditingComponent(null);
      resetForm();
    } catch (error) {
      showToast('error', `Failed to ${editingComponent ? 'update' : 'create'} component. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (component: Component) => {
    setEditingComponent(component);
    setFormData({
      sku: component.sku,
      name: component.name,
      description: component.description,
      category: component.category,
      unitOfMeasure: component.unitOfMeasure,
      unitCost: String(component.unitCost),
      currentStock: String(component.currentStock),
      minStock: String(component.minStock),
      maxStock: String(component.maxStock),
      reorderPoint: String(component.reorderPoint),
      location: component.location,
      supplier: component.supplier || '',
      leadTimeDays: String(component.leadTimeDays),
    });
    setIsAddModalOpen(true);
  };

  const handleDelete = async (component: Component) => {
    if (!confirm(`¿Eliminar "${component.name}"? Esta acción no se puede deshacer.`)) return;
    
    try {
      await deleteComponent.mutateAsync(component.id);
      showToast('success', `Component "${component.name}" deleted successfully!`);
    } catch (error) {
      showToast('error', 'Failed to delete component. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      sku: '',
      name: '',
      description: '',
      category: 'EL',
      unitOfMeasure: 'ea',
      unitCost: '',
      currentStock: '',
      minStock: '',
      maxStock: '',
      reorderPoint: '',
      location: '',
      supplier: '',
      leadTimeDays: '',
    });
    setFormErrors({});
    setEditingComponent(null);
  };

  const handleExport = () => {
    if (!components || components.length === 0) {
      showToast('error', 'No components to export');
      return;
    }
    
    const csvHeaders = ['SKU', 'Name', 'Description', 'Category', 'Unit', 'Cost', 'Stock', 'Min', 'Max', 'Reorder', 'Location', 'Supplier'];
    const csvRows = components.map(c => [
      c.sku,
      c.name,
      c.description.replace(/,/g, ';'),
      c.category,
      c.unitOfMeasure,
      c.unitCost,
      c.currentStock,
      c.minStock,
      c.maxStock,
      c.reorderPoint,
      c.location,
      c.supplier,
    ].join(','));
    
    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    showToast('success', `Exported ${components.length} components to CSV`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.csv')) {
      showToast('error', 'Please select a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          showToast('error', 'CSV file is empty or invalid');
          return;
        }

        // Skip header row, parse data rows
        let imported = 0;
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',');
          if (cols.length >= 6) {
            await createComponent.mutateAsync({
              sku: cols[0]?.trim() || `SKU-${Date.now()}-${i}`,
              name: cols[1]?.trim() || 'Imported Component',
              description: cols[2]?.trim() || '',
              category: (cols[3]?.trim() || 'consumable') as ComponentCategory,
              unitOfMeasure: cols[4]?.trim() || 'ea',
              unitCost: parseFloat(cols[5]) || 0,
              currentStock: parseInt(cols[6]) || 0,
              minStock: parseInt(cols[7]) || 0,
              maxStock: parseInt(cols[8]) || 1000,
              reorderPoint: parseInt(cols[9]) || 10,
              location: cols[10]?.trim() || 'TBD',
              supplier: cols[11]?.trim() || 'Unknown',
              leadTimeDays: 7,
            });
            imported++;
          }
        }
        
        showToast('success', `Successfully imported ${imported} components`);
      } catch (error) {
        showToast('error', 'Failed to import CSV. Check file format.');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    e.target.value = '';
  };

  const columns: Column<Component>[] = [
    {
      key: 'sku',
      header: 'SKU',
      render: (item) => (
        <span className="font-mono text-sm text-slate-300">{item.sku}</span>
      ),
    },
    {
      key: 'name',
      header: 'Component',
      render: (item) => (
        <div>
          <p className="font-medium text-slate-100">{item.name}</p>
          <p className="text-xs text-slate-500 truncate max-w-xs">{item.description}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (item) => (
        <Badge variant="default">{categoryLabels[item.category]}</Badge>
      ),
    },
    {
      key: 'stock',
      header: 'Stock Level',
      render: (item) => (
        <StockIndicator component={item} size="sm" />
      ),
    },
    {
      key: 'location',
      header: 'Location',
      render: (item) => (
        <span className="text-sm text-slate-400">{item.location}</span>
      ),
    },
    {
      key: 'unitCost',
      header: 'Unit Cost',
      render: (item) => (
        <span className="text-sm text-slate-300">{formatCurrency(item.unitCost)}</span>
      ),
    },
    {
      key: 'value',
      header: 'Total Value',
      render: (item) => (
        <span className="text-sm font-medium text-slate-200">
          {formatCurrency(item.currentStock * item.unitCost)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (item) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(item)} title="Edit">
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(item)} title="Delete">
            <Trash2 className="w-4 h-4 text-red-400" />
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

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Inventory</h1>
          <p className="text-slate-400 mt-1">Manage components and stock levels</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleImportClick}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="ghost" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Component
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by SKU or name..."
              className="flex-1"
            />
          </div>
          <SimpleTabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>
      </Card>

      {/* Table */}
      <Card>
        <DataTable
          data={filteredComponents || []}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="No components found"
          keyExtractor={(item) => item.id}
        />
      </Card>

      {/* Add/Edit Component Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); resetForm(); }}
        title={editingComponent ? "Edit Component" : "Add New Component"}
        description={editingComponent ? "Update the component details" : "Enter the details for the new inventory component"}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="SKU *"
              placeholder="e.g., SUB-SAP-001"
              value={formData.sku}
              onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
              error={formErrors.sku}
            />
            <Input
              label="Name *"
              placeholder="Component name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              error={formErrors.name}
            />
          </div>

          <Textarea
            label="Description"
            placeholder="Describe the component..."
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Category *"
              options={categoryOptions}
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as ComponentCategory }))}
              error={formErrors.category}
            />
            <Select
              label="Unit of Measure"
              options={unitOptions}
              value={formData.unitOfMeasure}
              onChange={(e) => setFormData(prev => ({ ...prev, unitOfMeasure: e.target.value }))}
            />
            <Input
              label="Unit Cost ($) *"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.unitCost}
              onChange={(e) => setFormData(prev => ({ ...prev, unitCost: e.target.value }))}
              error={formErrors.unitCost}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input
              label="Current Stock *"
              type="number"
              min="0"
              placeholder="0"
              value={formData.currentStock}
              onChange={(e) => setFormData(prev => ({ ...prev, currentStock: e.target.value }))}
              error={formErrors.currentStock}
            />
            <Input
              label="Min Stock"
              type="number"
              min="0"
              placeholder="0"
              value={formData.minStock}
              onChange={(e) => setFormData(prev => ({ ...prev, minStock: e.target.value }))}
            />
            <Input
              label="Max Stock"
              type="number"
              min="0"
              placeholder="1000"
              value={formData.maxStock}
              onChange={(e) => setFormData(prev => ({ ...prev, maxStock: e.target.value }))}
            />
            <Input
              label="Reorder Point"
              type="number"
              min="0"
              placeholder="10"
              value={formData.reorderPoint}
              onChange={(e) => setFormData(prev => ({ ...prev, reorderPoint: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Location *"
              placeholder="e.g., A1-01"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              error={formErrors.location}
            />
            <Input
              label="Supplier"
              placeholder="Supplier name"
              value={formData.supplier}
              onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
            />
            <Input
              label="Lead Time (days)"
              type="number"
              min="1"
              placeholder="7"
              value={formData.leadTimeDays}
              onChange={(e) => setFormData(prev => ({ ...prev, leadTimeDays: e.target.value }))}
            />
          </div>
        </div>

        <ModalFooter>
          <Button variant="ghost" onClick={() => { setIsAddModalOpen(false); resetForm(); }}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting 
              ? (editingComponent ? 'Updating...' : 'Creating...') 
              : (editingComponent ? 'Update Component' : 'Create Component')
            }
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
