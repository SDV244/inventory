import { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Building2, 
  Server, 
  Package, 
  Palette,
  CheckCircle,
  AlertCircle,
  X,
  Moon,
  Sun
} from 'lucide-react';
import { Card, Button, Input, Textarea } from '../components/ui';

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

interface AppSettings {
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  api: {
    baseUrl: string;
    timeout: number;
  };
  inventory: {
    defaultReorderPoint: number;
    lowStockThreshold: number;
    criticalStockThreshold: number;
  };
  production: {
    defaultPriority: string;
    autoAssign: boolean;
  };
  theme: 'dark' | 'light' | 'system';
}

const defaultSettings: AppSettings = {
  company: {
    name: 'BioCellux - MDV',
    address: 'Bogotá, Colombia',
    phone: '+57 XXX XXX XXXX',
    email: 'info@biocellux.com',
  },
  api: {
    baseUrl: '/pl-inventory/api',
    timeout: 30000,
  },
  inventory: {
    defaultReorderPoint: 10,
    lowStockThreshold: 25,
    criticalStockThreshold: 10,
  },
  production: {
    defaultPriority: 'normal',
    autoAssign: false,
  },
  theme: 'dark',
};

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activeSection, setActiveSection] = useState('company');

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('pl-inventory-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }, []);

  // Apply theme whenever settings change
  useEffect(() => {
    const root = document.documentElement;
    
    if (settings.theme === 'light') {
      root.classList.add('light-theme');
    } else if (settings.theme === 'dark') {
      root.classList.remove('light-theme');
    } else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('light-theme', !prefersDark);
    }
  }, [settings.theme]);

  const showToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      localStorage.setItem('pl-inventory-settings', JSON.stringify(settings));
      
      // Apply theme immediately
      const root = document.documentElement;
      if (settings.theme === 'light') {
        root.classList.add('light-theme');
      } else if (settings.theme === 'dark') {
        root.classList.remove('light-theme');
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('light-theme', !prefersDark);
      }
      
      showToast('success', 'Configuración guardada correctamente!');
    } catch (error) {
      showToast('error', 'Error al guardar configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    localStorage.setItem('pl-inventory-settings', JSON.stringify(defaultSettings));
    document.documentElement.classList.remove('light-theme');
    showToast('success', 'Configuración restablecida');
  };

  const updateCompany = (field: keyof AppSettings['company'], value: string) => {
    setSettings(prev => ({
      ...prev,
      company: { ...prev.company, [field]: value }
    }));
  };

  const updateApi = (field: keyof AppSettings['api'], value: string | number) => {
    setSettings(prev => ({
      ...prev,
      api: { ...prev.api, [field]: value }
    }));
  };

  const updateInventory = (field: keyof AppSettings['inventory'], value: number) => {
    setSettings(prev => ({
      ...prev,
      inventory: { ...prev.inventory, [field]: value }
    }));
  };

  const updateProduction = (field: keyof AppSettings['production'], value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      production: { ...prev.production, [field]: value }
    }));
  };

  const sections = [
    { id: 'company', label: 'Company Info', icon: Building2 },
    { id: 'api', label: 'API Configuration', icon: Server },
    { id: 'inventory', label: 'Inventory Defaults', icon: Package },
    { id: 'appearance', label: 'Appearance', icon: Palette },
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
          <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
          <p className="text-slate-400 mt-1">Configure application preferences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="lg:col-span-1">
          <nav className="p-2">
            {sections.map(section => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                    isActive
                      ? 'bg-pl-600/20 text-pl-400 border border-pl-600/30'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{section.label}</span>
                </button>
              );
            })}
          </nav>
        </Card>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Company Info */}
          {activeSection === 'company' && (
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-100">Company Information</h2>
                    <p className="text-sm text-slate-400">Your organization details</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Input
                    label="Company Name"
                    value={settings.company.name}
                    onChange={(e) => updateCompany('name', e.target.value)}
                    placeholder="Enter company name"
                  />
                  <Textarea
                    label="Address"
                    value={settings.company.address}
                    onChange={(e) => updateCompany('address', e.target.value)}
                    placeholder="Enter company address"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Phone"
                      value={settings.company.phone}
                      onChange={(e) => updateCompany('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={settings.company.email}
                      onChange={(e) => updateCompany('email', e.target.value)}
                      placeholder="info@company.com"
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* API Configuration */}
          {activeSection === 'api' && (
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Server className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-100">API Configuration</h2>
                    <p className="text-sm text-slate-400">Backend connection settings</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Input
                    label="API Base URL"
                    value={settings.api.baseUrl}
                    onChange={(e) => updateApi('baseUrl', e.target.value)}
                    placeholder="/pl-inventory/api"
                  />
                  <Input
                    label="Request Timeout (ms)"
                    type="number"
                    min="1000"
                    step="1000"
                    value={settings.api.timeout}
                    onChange={(e) => updateApi('timeout', parseInt(e.target.value) || 30000)}
                    placeholder="30000"
                  />
                  
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <p className="text-sm text-slate-400">
                      <strong className="text-slate-300">Note:</strong> Changes to API settings may require a page refresh to take effect.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Inventory Defaults */}
          {activeSection === 'inventory' && (
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Package className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-100">Inventory Defaults</h2>
                    <p className="text-sm text-slate-400">Default values for new components</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Input
                    label="Default Reorder Point"
                    type="number"
                    min="0"
                    value={settings.inventory.defaultReorderPoint}
                    onChange={(e) => updateInventory('defaultReorderPoint', parseInt(e.target.value) || 0)}
                    placeholder="10"
                  />
                  <Input
                    label="Low Stock Threshold (%)"
                    type="number"
                    min="0"
                    max="100"
                    value={settings.inventory.lowStockThreshold}
                    onChange={(e) => updateInventory('lowStockThreshold', parseInt(e.target.value) || 0)}
                    placeholder="25"
                  />
                  <Input
                    label="Critical Stock Threshold (%)"
                    type="number"
                    min="0"
                    max="100"
                    value={settings.inventory.criticalStockThreshold}
                    onChange={(e) => updateInventory('criticalStockThreshold', parseInt(e.target.value) || 0)}
                    placeholder="10"
                  />
                  
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <p className="text-sm text-amber-400">
                      <strong>Stock Level Indicators:</strong>
                    </p>
                    <ul className="text-sm text-slate-400 mt-2 space-y-1">
                      <li>• <span className="text-red-400">Critical</span>: Below {settings.inventory.criticalStockThreshold}% of max stock</li>
                      <li>• <span className="text-amber-400">Low</span>: Below {settings.inventory.lowStockThreshold}% of max stock</li>
                      <li>• <span className="text-emerald-400">Adequate</span>: Above low threshold</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Appearance */}
          {activeSection === 'appearance' && (
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Palette className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-100">Appearance</h2>
                    <p className="text-sm text-slate-400">Customize the look and feel</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">Theme</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'dark', label: 'Dark', icon: Moon },
                        { id: 'light', label: 'Light', icon: Sun },
                        { id: 'system', label: 'System', icon: Settings },
                      ].map(theme => {
                        const Icon = theme.icon;
                        const isSelected = settings.theme === theme.id;
                        return (
                          <button
                            key={theme.id}
                            onClick={() => setSettings(prev => ({ ...prev, theme: theme.id as AppSettings['theme'] }))}
                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
                              isSelected
                                ? 'bg-pl-600/20 border-pl-500 text-pl-400'
                                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                            }`}
                          >
                            <Icon className="w-6 h-6" />
                            <span className="text-sm font-medium">{theme.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <p className="text-sm text-slate-400">
                      <strong className="text-slate-300">Tip:</strong> El tema se aplica inmediatamente al guardar. Usa "System" para seguir las preferencias de tu dispositivo.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Production Settings (optional extra section) */}
          {activeSection === 'production' && (
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-100">Production Settings</h2>
                    <p className="text-sm text-slate-400">Work order defaults</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Default Priority</label>
                    <select
                      value={settings.production.defaultPriority}
                      onChange={(e) => updateProduction('defaultPriority', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-pl-500 focus:ring-1 focus:ring-pl-500"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-100">Auto-assign Work Orders</p>
                      <p className="text-sm text-slate-400">Automatically assign new orders to available operators</p>
                    </div>
                    <button
                      onClick={() => updateProduction('autoAssign', !settings.production.autoAssign)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        settings.production.autoAssign ? 'bg-pl-500' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          settings.production.autoAssign ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
