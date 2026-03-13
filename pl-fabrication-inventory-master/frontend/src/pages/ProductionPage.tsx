import { useState } from 'react';
import { Plus, Play, Pause, CheckCircle, AlertCircle, X, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { Card, Button, Badge, StepTracker, SimpleTabs, Modal, ModalFooter, Input, Select, Textarea } from '../components/ui';
import { useWorkOrders, useBOMs, useCreateWorkOrder, useUpdateWorkOrderStatus, useCompleteStep, useUpdateWorkOrder, useDeleteWorkOrder } from '../hooks';
import { formatDate, formatRelativeTime } from '../utils/helpers';
import type { WorkOrder, WorkOrderStatus } from '../types';

const statusConfig: Record<WorkOrderStatus, { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'danger'; icon: typeof Play }> = {
  queued: { label: 'Queued', variant: 'default', icon: Pause },
  'in-progress': { label: 'In Progress', variant: 'info', icon: Play },
  qc: { label: 'QC Pending', variant: 'warning', icon: AlertCircle },
  complete: { label: 'Complete', variant: 'success', icon: CheckCircle },
  failed: { label: 'Failed', variant: 'danger', icon: AlertCircle },
};

const priorityVariants: Record<string, 'default' | 'info' | 'warning' | 'danger'> = {
  low: 'default',
  normal: 'info',
  high: 'warning',
  urgent: 'danger',
};

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const tabs = [
  { id: 'all', label: 'All Orders' },
  { id: 'queued', label: 'Queued' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'qc', label: 'QC Pending' },
  { id: 'complete', label: 'Completed' },
];

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

export function ProductionPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const { data: workOrders, isLoading } = useWorkOrders();
  const { data: boms } = useBOMs();
  const createWorkOrder = useCreateWorkOrder();
  const updateStatus = useUpdateWorkOrderStatus();
  const completeStep = useCompleteStep();
  const updateWorkOrder = useUpdateWorkOrder();
  const deleteWorkOrder = useDeleteWorkOrder();

  // Form state
  const [formData, setFormData] = useState({
    bomId: '',
    priority: 'normal',
    quantity: '1',
    assignedTo: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const filteredOrders = workOrders?.filter((wo) =>
    activeTab === 'all' || wo.status === activeTab
  );

  const bomOptions = (boms || [])
    .filter(b => b.status === 'active')
    .map(b => ({
      value: b.id,
      label: `${b.name} (v${b.version})`,
    }));

  const getProgress = (wo: WorkOrder) => {
    const completedSteps = wo.steps.filter((s) => s.status === 'complete').length;
    return Math.round((completedSteps / wo.steps.length) * 100);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.bomId) errors.bomId = 'Please select a product';
    if (!formData.quantity || parseInt(formData.quantity) < 1) errors.quantity = 'Quantity must be at least 1';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      if (editingWorkOrder) {
        await updateWorkOrder.mutateAsync({
          id: editingWorkOrder.id,
          data: {
            priority: formData.priority as WorkOrder['priority'],
            quantity: parseInt(formData.quantity),
            assignedTo: formData.assignedTo || undefined,
            notes: formData.notes || undefined,
          },
        });
        showToast('success', 'Work order updated successfully!');
      } else {
        await createWorkOrder.mutateAsync({
          bomId: formData.bomId,
          priority: formData.priority as WorkOrder['priority'],
          quantity: parseInt(formData.quantity),
          assignedTo: formData.assignedTo || undefined,
          notes: formData.notes || undefined,
        });
        showToast('success', 'Work order created successfully!');
      }
      
      setIsCreateModalOpen(false);
      setEditingWorkOrder(null);
      resetForm();
    } catch (error) {
      showToast('error', `Failed to ${editingWorkOrder ? 'update' : 'create'} work order. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      bomId: '',
      priority: 'normal',
      quantity: '1',
      assignedTo: '',
      notes: '',
    });
    setFormErrors({});
    setEditingWorkOrder(null);
  };

  const handleEditWorkOrder = (wo: WorkOrder) => {
    setEditingWorkOrder(wo);
    setFormData({
      bomId: wo.bomId,
      priority: wo.priority,
      quantity: String(wo.quantity),
      assignedTo: wo.assignedTo || '',
      notes: wo.notes || '',
    });
    setIsCreateModalOpen(true);
  };

  const handleDeleteWorkOrder = async (wo: WorkOrder) => {
    if (!confirm(`¿Eliminar orden "${wo.orderNumber}"? Esta acción no se puede deshacer.`)) return;
    
    try {
      await deleteWorkOrder.mutateAsync(wo.id);
      showToast('success', `Work order "${wo.orderNumber}" deleted successfully!`);
    } catch (error) {
      showToast('error', 'Failed to delete work order. Please try again.');
    }
  };

  const handleStartWorkOrder = async (wo: WorkOrder) => {
    try {
      await updateStatus.mutateAsync({ id: wo.id, status: 'in-progress' });
      showToast('success', `Started work order ${wo.orderNumber}`);
    } catch (error) {
      showToast('error', 'Failed to start work order');
    }
  };

  const handleCompleteStep = async (wo: WorkOrder, stepIndex: number) => {
    try {
      await completeStep.mutateAsync({ workOrderId: wo.id, stepIndex });
      showToast('success', `Step "${wo.steps[stepIndex].name}" completed`);
    } catch (error) {
      showToast('error', 'Failed to complete step');
    }
  };

  const handleMarkComplete = async (wo: WorkOrder) => {
    try {
      await updateStatus.mutateAsync({ id: wo.id, status: 'complete' });
      showToast('success', `Work order ${wo.orderNumber} completed!`);
    } catch (error) {
      showToast('error', 'Failed to complete work order');
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 space-y-4">
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Production</h1>
          <p className="text-slate-400 mt-1">Manage work orders and fabrication</p>
        </div>
        <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Work Order
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-shrink-0">
        <Card>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-100">
              {workOrders?.filter((wo) => wo.status === 'queued').length || 0}
            </p>
            <p className="text-sm text-slate-400">Queued</p>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">
              {workOrders?.filter((wo) => wo.status === 'in-progress').length || 0}
            </p>
            <p className="text-sm text-slate-400">In Progress</p>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">
              {workOrders?.filter((wo) => wo.status === 'qc').length || 0}
            </p>
            <p className="text-sm text-slate-400">QC Pending</p>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">
              {workOrders?.filter((wo) => wo.status === 'complete').length || 0}
            </p>
            <p className="text-sm text-slate-400">Completed</p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Card className="flex-shrink-0">
        <div className="p-4">
          <SimpleTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>
      </Card>

      {/* Work Orders List */}
      <div className="flex-1 overflow-auto min-h-0">
        {isLoading ? (
          <div className="text-center py-12 text-slate-400">Loading...</div>
        ) : (
          <div className="space-y-4 pb-4">
            {filteredOrders?.map((wo) => {
              const status = statusConfig[wo.status];
              const StatusIcon = status.icon;
              const currentStep = wo.steps[wo.currentStepIndex];
              
              return (
                <Card key={wo.id}>
                  <div className="p-4 lg:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-6">
                      {/* Order Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-slate-100">{wo.orderNumber}</h3>
                          <Badge variant={status.variant}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {status.label}
                          </Badge>
                          <Badge variant={priorityVariants[wo.priority]}>
                            {wo.priority.toUpperCase()}
                          </Badge>
                        </div>
                        
                        {wo.bom && (
                          <p className="text-sm text-slate-300 mb-2">
                            Product: <span className="font-medium">{wo.bom.name}</span>
                          </p>
                        )}
                        
                        {wo.deviceSerials && wo.deviceSerials.length > 0 && (
                          <div className="text-sm text-slate-400 mb-2">
                            <span>Serials ({wo.deviceSerials.length}):</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {wo.deviceSerials.map((serial, idx) => (
                                <span key={idx} className="font-mono text-xs bg-slate-800 text-pl-400 px-2 py-0.5 rounded">
                                  {serial}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                          <span>Created: {formatDate(wo.createdAt)}</span>
                          {wo.startedAt && <span>Started: {formatRelativeTime(wo.startedAt)}</span>}
                          {wo.assignedTo && <span>Assigned: {wo.assignedTo}</span>}
                        </div>

                        {wo.notes && (
                          <p className="mt-2 text-sm text-amber-400/80 bg-amber-400/10 px-3 py-1.5 rounded-lg inline-block">
                            {wo.notes}
                          </p>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2 mt-4">
                          {wo.status === 'queued' && (
                            <Button size="sm" onClick={() => handleStartWorkOrder(wo)}>
                              <Play className="w-4 h-4 mr-1" />
                              Start Work Order
                            </Button>
                          )}
                          
                          {wo.status === 'in-progress' && currentStep && (
                            <Button 
                              size="sm" 
                              onClick={() => handleCompleteStep(wo, wo.currentStepIndex)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Complete: {currentStep.name}
                            </Button>
                          )}
                          
                          {wo.status === 'qc' && (
                            <Button size="sm" variant="primary" onClick={() => handleMarkComplete(wo)}>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Mark Complete
                            </Button>
                          )}

                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => setSelectedWorkOrder(wo)}
                          >
                            View Details
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                          
                          {/* Edit - available for queued and in-progress */}
                          {(wo.status === 'queued' || wo.status === 'in-progress') && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleEditWorkOrder(wo)}
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          )}
                          
                          {/* Delete - available for all statuses */}
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleDeleteWorkOrder(wo)}
                            title="Delete"
                            className="hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="lg:w-72 xl:w-80">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-slate-400">Progress</span>
                          <span className="text-sm font-medium text-slate-200">{getProgress(wo)}%</span>
                        </div>
                        <StepTracker
                          steps={wo.steps}
                          currentStepIndex={wo.currentStepIndex}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}

            {filteredOrders?.length === 0 && (
              <Card>
                <div className="p-12 text-center text-slate-400">
                  No work orders found
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Work Order Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); resetForm(); }}
        title={editingWorkOrder ? "Edit Work Order" : "Create Work Order"}
        description={editingWorkOrder ? "Update work order details" : "Start a new fabrication work order"}
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Product (BOM) *"
            options={bomOptions}
            value={formData.bomId}
            onChange={(e) => setFormData(prev => ({ ...prev, bomId: e.target.value }))}
            placeholder="Select a product..."
            error={formErrors.bomId}
            disabled={!!editingWorkOrder}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Priority"
              options={priorityOptions}
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
            />
            <Input
              label="Quantity *"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
              error={formErrors.quantity}
            />
          </div>

          <Input
            label="Assigned To"
            placeholder="Operator name (optional)"
            value={formData.assignedTo}
            onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
          />

          <Textarea
            label="Notes"
            placeholder="Special instructions or notes..."
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          />
        </div>

        <ModalFooter>
          <Button variant="ghost" onClick={() => { setIsCreateModalOpen(false); resetForm(); }}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting 
              ? (editingWorkOrder ? 'Updating...' : 'Creating...') 
              : (editingWorkOrder ? 'Update Work Order' : 'Create Work Order')
            }
          </Button>
        </ModalFooter>
      </Modal>

      {/* Work Order Details Modal */}
      <Modal
        isOpen={!!selectedWorkOrder}
        onClose={() => setSelectedWorkOrder(null)}
        title={selectedWorkOrder?.orderNumber || 'Work Order Details'}
        size="lg"
      >
        {selectedWorkOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400">Status</label>
                <div className="mt-1">
                  <Badge variant={statusConfig[selectedWorkOrder.status].variant}>
                    {statusConfig[selectedWorkOrder.status].label}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400">Priority</label>
                <div className="mt-1">
                  <Badge variant={priorityVariants[selectedWorkOrder.priority]}>
                    {selectedWorkOrder.priority.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400">Product</label>
                <p className="text-slate-100">{selectedWorkOrder.bom?.name || 'Unknown'}</p>
              </div>
              <div>
                <label className="text-sm text-slate-400">Quantity</label>
                <p className="text-slate-100">{selectedWorkOrder.quantity}</p>
              </div>
              {selectedWorkOrder.deviceSerials && selectedWorkOrder.deviceSerials.length > 0 && (
                <div className="col-span-2">
                  <label className="text-sm text-slate-400">Device Serials ({selectedWorkOrder.deviceSerials.length})</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedWorkOrder.deviceSerials.map((serial, idx) => (
                      <span key={idx} className="font-mono text-sm bg-slate-800 text-pl-400 px-2 py-1 rounded">
                        {serial}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {selectedWorkOrder.assignedTo && (
                <div>
                  <label className="text-sm text-slate-400">Assigned To</label>
                  <p className="text-slate-100">{selectedWorkOrder.assignedTo}</p>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-2 block">Production Steps</label>
              <div className="space-y-2">
                {selectedWorkOrder.steps.map((step, idx) => (
                  <div 
                    key={step.id}
                    className={`p-3 rounded-lg border ${
                      step.status === 'complete' 
                        ? 'bg-emerald-500/10 border-emerald-500/30' 
                        : step.status === 'in-progress'
                        ? 'bg-blue-500/10 border-blue-500/30'
                        : 'bg-slate-800/50 border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          step.status === 'complete' ? 'bg-emerald-500 text-white' :
                          step.status === 'in-progress' ? 'bg-blue-500 text-white' :
                          'bg-slate-700 text-slate-400'
                        }`}>
                          {step.status === 'complete' ? '✓' : idx + 1}
                        </span>
                        <span className="font-medium text-slate-100">{step.name}</span>
                      </div>
                      <span className="text-sm text-slate-400">
                        {step.actualMinutes || step.estimatedMinutes} min
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1 ml-8">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {selectedWorkOrder.notes && (
              <div>
                <label className="text-sm text-slate-400">Notes</label>
                <p className="mt-1 text-slate-300 bg-slate-800/50 p-3 rounded-lg">
                  {selectedWorkOrder.notes}
                </p>
              </div>
            )}
          </div>
        )}

        <ModalFooter>
          <Button variant="ghost" onClick={() => setSelectedWorkOrder(null)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
