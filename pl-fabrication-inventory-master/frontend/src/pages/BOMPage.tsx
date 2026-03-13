import { useState } from 'react';
import { Plus, FileText, Copy, Archive, Trash2, CheckCircle, AlertCircle, X, Edit2 } from 'lucide-react';
import { Card, Button, SearchInput, DataTable, Badge, Modal, ModalFooter, Input, Select, Textarea } from '../components/ui';
import type { Column } from '../components/ui/DataTable';
import { useBOMs, useCreateBOM, useUpdateBOM, useDeleteBOM, useComponents } from '../hooks';
import { formatCurrency, formatDate } from '../utils/helpers';
import type { BillOfMaterials, BOMItem, Component } from '../types';

const statusVariants: Record<string, 'success' | 'warning' | 'default'> = {
  active: 'success',
  draft: 'warning',
  deprecated: 'default',
};

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

interface BOMItemInput {
  componentId: string;
  quantity: string;
  notes: string;
}

export function BOMPage() {
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBOM, setEditingBOM] = useState<BillOfMaterials | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const { data: boms, isLoading } = useBOMs();
  const { data: components } = useComponents();
  const createBOM = useCreateBOM();
  const updateBOM = useUpdateBOM();
  const deleteBOM = useDeleteBOM();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    version: '1.0',
    description: '',
  });
  const [bomItems, setBomItems] = useState<BOMItemInput[]>([
    { componentId: '', quantity: '1', notes: '' }
  ]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const filteredBOMs = boms?.filter((b) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return b.name.toLowerCase().includes(searchLower) ||
           b.description.toLowerCase().includes(searchLower) ||
           b.version.toLowerCase().includes(searchLower);
  });

  const componentOptions = (components || []).map((c: Component) => ({
    value: c.id,
    label: `${c.sku} - ${c.name}`,
  }));

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Product name is required';
    if (!formData.version.trim()) errors.version = 'Version is required';
    
    const validItems = bomItems.filter(item => item.componentId && parseInt(item.quantity) > 0);
    if (validItems.length === 0) {
      errors.items = 'At least one component is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddItem = () => {
    setBomItems(prev => [...prev, { componentId: '', quantity: '1', notes: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    if (bomItems.length > 1) {
      setBomItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof BOMItemInput, value: string) => {
    setBomItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const calculateTotalCost = () => {
    return bomItems.reduce((sum, item) => {
      const component = components?.find((c: Component) => c.id === item.componentId);
      const qty = parseInt(item.quantity) || 0;
      return sum + (component?.unitCost || 0) * qty;
    }, 0);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const items: BOMItem[] = bomItems
        .filter(item => item.componentId && parseInt(item.quantity) > 0)
        .map(item => ({
          componentId: item.componentId,
          quantity: parseInt(item.quantity),
          notes: item.notes || undefined,
        }));

      if (editingBOM) {
        await updateBOM.mutateAsync({
          id: editingBOM.id,
          data: {
            name: formData.name,
            version: formData.version,
            description: formData.description,
            items,
          },
        });
        showToast('success', `BOM "${formData.name}" updated successfully!`);
      } else {
        await createBOM.mutateAsync({
          name: formData.name,
          version: formData.version,
          description: formData.description,
          items,
        });
        showToast('success', `BOM "${formData.name}" created successfully!`);
      }
      
      setIsCreateModalOpen(false);
      setEditingBOM(null);
      resetForm();
    } catch (error) {
      showToast('error', `Failed to ${editingBOM ? 'update' : 'create'} BOM. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      version: '1.0',
      description: '',
    });
    setBomItems([{ componentId: '', quantity: '1', notes: '' }]);
    setFormErrors({});
    setEditingBOM(null);
  };

  const handleEdit = (bom: BillOfMaterials) => {
    setEditingBOM(bom);
    setFormData({
      name: bom.name,
      version: bom.version,
      description: bom.description,
    });
    setBomItems(
      bom.items.map(item => ({
        componentId: item.componentId,
        quantity: String(item.quantity),
        notes: item.notes || '',
      }))
    );
    setIsCreateModalOpen(true);
  };

  const handleArchive = async (bom: BillOfMaterials) => {
    try {
      await updateBOM.mutateAsync({
        id: bom.id,
        data: { status: 'deprecated' },
      });
      showToast('success', `BOM "${bom.name}" archived successfully!`);
    } catch (error) {
      showToast('error', 'Failed to archive BOM. Please try again.');
    }
  };

  const handleDelete = async (bom: BillOfMaterials) => {
    if (!confirm(`¿Eliminar "${bom.name}"? Esta acción no se puede deshacer.`)) return;
    
    try {
      await deleteBOM.mutateAsync(bom.id);
      showToast('success', `BOM "${bom.name}" deleted successfully!`);
    } catch (error) {
      showToast('error', 'Failed to delete BOM. Please try again.');
    }
  };

  const handleDuplicateBOM = (bom: BillOfMaterials) => {
    setFormData({
      name: `${bom.name} (Copy)`,
      version: '1.0',
      description: bom.description,
    });
    setBomItems(
      bom.items.map(item => ({
        componentId: item.componentId,
        quantity: String(item.quantity),
        notes: item.notes || '',
      }))
    );
    setIsCreateModalOpen(true);
  };

  const columns: Column<BillOfMaterials>[] = [
    {
      key: 'name',
      header: 'Product',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
            <FileText className="w-5 h-5 text-pl-400" />
          </div>
          <div>
            <p className="font-medium text-slate-100">{item.name}</p>
            <p className="text-xs text-slate-500">v{item.version}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (item) => (
        <p className="text-sm text-slate-400 max-w-md truncate">{item.description}</p>
      ),
    },
    {
      key: 'items',
      header: 'Components',
      render: (item) => (
        <span className="text-sm text-slate-300">{item.items.length} items</span>
      ),
    },
    {
      key: 'totalCost',
      header: 'Unit Cost',
      render: (item) => (
        <span className="text-sm font-medium text-slate-200">{formatCurrency(item.totalCost)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge variant={statusVariants[item.status]}>{item.status}</Badge>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Last Updated',
      render: (item) => (
        <span className="text-sm text-slate-400">{formatDate(item.updatedAt)}</span>
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
          <Button variant="ghost" size="sm" onClick={() => handleDuplicateBOM(item)} title="Duplicate">
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleArchive(item)} title="Archive">
            <Archive className="w-4 h-4 text-amber-400" />
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Bill of Materials</h1>
          <p className="text-slate-400 mt-1">Product recipes and component specifications</p>
        </div>
        <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create BOM
        </Button>
      </div>

      {/* Search */}
      <Card>
        <div className="p-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search products..."
            className="max-w-md"
          />
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-100">
              {boms?.filter((b) => b.status === 'active').length || 0}
            </p>
            <p className="text-sm text-slate-400">Active Products</p>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-100">
              {boms?.filter((b) => b.status === 'draft').length || 0}
            </p>
            <p className="text-sm text-slate-400">In Development</p>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-100">
              {formatCurrency((boms?.reduce((sum, b) => sum + b.totalCost, 0) || 0) / (boms?.length || 1))}
            </p>
            <p className="text-sm text-slate-400">Avg. Unit Cost</p>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <DataTable
          data={filteredBOMs || []}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="No bills of materials found"
          keyExtractor={(item) => item.id}
        />
      </Card>

      {/* Create/Edit BOM Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); resetForm(); }}
        title={editingBOM ? "Edit Bill of Materials" : "Create Bill of Materials"}
        description={editingBOM ? "Update the product recipe and components" : "Define a new product recipe with its required components"}
        size="xl"
      >
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Product Name *"
                placeholder="e.g., PL Converter Module A"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                error={formErrors.name}
              />
            </div>
            <Input
              label="Version *"
              placeholder="1.0"
              value={formData.version}
              onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
              error={formErrors.version}
            />
          </div>

          <Textarea
            label="Description"
            placeholder="Describe the product..."
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          />

          {/* Components */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-slate-300">
                Components *
              </label>
              <Button variant="ghost" size="sm" onClick={handleAddItem}>
                <Plus className="w-4 h-4 mr-1" />
                Add Component
              </Button>
            </div>
            
            {formErrors.items && (
              <p className="text-sm text-red-400 mb-2">{formErrors.items}</p>
            )}

            <div className="space-y-3">
              {bomItems.map((item, index) => (
                <div key={index} className="flex gap-3 items-start p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex-1">
                    <Select
                      options={componentOptions}
                      value={item.componentId}
                      onChange={(e) => handleItemChange(index, 'componentId', e.target.value)}
                      placeholder="Select component..."
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder="Notes (optional)"
                      value={item.notes}
                      onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(index)}
                    disabled={bomItems.length === 1}
                    className="mt-1"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Preview */}
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Estimated Unit Cost:</span>
              <span className="text-xl font-bold text-slate-100">
                {formatCurrency(calculateTotalCost())}
              </span>
            </div>
          </div>
        </div>

        <ModalFooter>
          <Button variant="ghost" onClick={() => { setIsCreateModalOpen(false); resetForm(); }}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting 
              ? (editingBOM ? 'Updating...' : 'Creating...') 
              : (editingBOM ? 'Update BOM' : 'Create BOM')
            }
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
