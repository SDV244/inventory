import { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, RefreshCw, AlertTriangle, Package, X, Check, CheckCheck, Settings, ChevronDown } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useComponents, useDevices } from '../../hooks';
import { getStockLevel } from '../../utils/helpers';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/inventory': 'Inventory Management',
  '/bom': 'Bill of Materials',
  '/production': 'Production',
  '/devices': 'Device Registry',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

interface Notification {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link?: string;
}

interface HeaderProps {
  sidebarCollapsed: boolean;
}

// Get operator name from localStorage or default
const getOperatorName = () => localStorage.getItem('pl-operator-name') || 'Operator';
const getOperatorShift = () => localStorage.getItem('pl-operator-shift') || 'Shift A';

export function Header({ sidebarCollapsed }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [operatorName, setOperatorName] = useState(getOperatorName());
  const [operatorShift, setOperatorShift] = useState(getOperatorShift());
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(operatorName);
  const [editShift, setEditShift] = useState(operatorShift);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  
  const { data: components } = useComponents();
  const { data: devices } = useDevices();
  
  const pageTitle = pageTitles[location.pathname] || 'PL Fabrication';

  // Generate notifications from data
  useEffect(() => {
    const newNotifications: Notification[] = [];
    
    // Low stock alerts
    components?.forEach(c => {
      const level = getStockLevel(c);
      if (level === 'critical') {
        newNotifications.push({
          id: `stock-critical-${c.id}`,
          type: 'error',
          title: 'Critical Stock Alert',
          message: `${c.name} (${c.sku}) is critically low: ${c.currentStock} ${c.unitOfMeasure}`,
          timestamp: new Date(),
          read: false,
          link: '/inventory',
        });
      } else if (level === 'low') {
        newNotifications.push({
          id: `stock-low-${c.id}`,
          type: 'warning',
          title: 'Low Stock Warning',
          message: `${c.name} is below reorder point: ${c.currentStock}/${c.reorderPoint}`,
          timestamp: new Date(),
          read: false,
          link: '/inventory',
        });
      }
    });
    
    // QC failures
    devices?.forEach(d => {
      if (d.status === 'qc-failed') {
        newNotifications.push({
          id: `qc-failed-${d.id}`,
          type: 'error',
          title: 'QC Failure',
          message: `Device ${d.serialNumber} failed quality check`,
          timestamp: new Date(d.updatedAt),
          read: false,
          link: '/devices',
        });
      }
    });
    
    // Pending QC - redirect to devices
    const pendingQC = devices?.filter(d => d.status === 'qc-pending').length || 0;
    if (pendingQC > 0) {
      newNotifications.push({
        id: 'qc-pending',
        type: 'info',
        title: 'QC Pendiente',
        message: `${pendingQC} dispositivo${pendingQC > 1 ? 's' : ''} en espera de inspección`,
        timestamp: new Date(),
        read: false,
        link: '/devices',
      });
    }
    
    // Merge with existing read states
    setNotifications(prev => {
      const readIds = new Set(prev.filter(n => n.read).map(n => n.id));
      return newNotifications.map(n => ({
        ...n,
        read: readIds.has(n.id),
      }));
    });
  }, [components, devices]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
        setIsEditingProfile(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
    setShowNotifications(false);
  };

  const saveProfile = () => {
    localStorage.setItem('pl-operator-name', editName);
    localStorage.setItem('pl-operator-shift', editShift);
    setOperatorName(editName);
    setOperatorShift(editShift);
    setIsEditingProfile(false);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'info':
        return <Package className="w-4 h-4 text-blue-400" />;
      case 'success':
        return <Check className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 
                 z-30 transition-all duration-300 flex items-center justify-between px-6
                 ${sidebarCollapsed ? 'left-20' : 'left-64'}`}
    >
      {/* Page Title */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-slate-100">{pageTitle}</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className="text-slate-400"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search (⌘K)"
            className="w-64 bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm
                      text-slate-100 placeholder-slate-500 focus:border-pl-500 focus:ring-1 
                      focus:ring-pl-500 transition-colors"
          />
        </div>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-96 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                <h3 className="font-semibold text-slate-100">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs text-pl-400 hover:text-pl-300 flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-slate-500">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`px-4 py-3 border-b border-slate-700/50 cursor-pointer hover:bg-slate-700/50 transition-colors ${
                        !notification.read ? 'bg-slate-700/30' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-sm font-medium ${!notification.read ? 'text-slate-100' : 'text-slate-300'}`}>
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-pl-500 rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-slate-400 mt-0.5 truncate">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {notifications.length > 0 && (
                <div className="px-4 py-2 border-t border-slate-700 bg-slate-800/50">
                  <button 
                    onClick={() => {
                      navigate('/reports');
                      setShowNotifications(false);
                    }}
                    className="text-sm text-pl-400 hover:text-pl-300 w-full text-center"
                  >
                    View all alerts in Reports
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-3 p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-pl-500 to-pl-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {operatorName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-slate-200">{operatorName}</p>
              <p className="text-xs text-slate-500">{operatorShift}</p>
            </div>
            <ChevronDown className="w-4 h-4 hidden md:block" />
          </button>
          
          {/* Profile Dropdown */}
          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {!isEditingProfile ? (
                <>
                  {/* Profile Header */}
                  <div className="px-4 py-4 border-b border-slate-700 bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-pl-500 to-pl-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {operatorName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-100">{operatorName}</p>
                        <p className="text-sm text-slate-400">{operatorShift}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setEditName(operatorName);
                        setEditShift(operatorShift);
                        setIsEditingProfile(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>Edit Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate('/settings');
                        setShowProfile(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                  </div>
                  
                  {/* Footer */}
                  <div className="px-4 py-3 border-t border-slate-700 bg-slate-800/50">
                    <p className="text-xs text-slate-500 text-center">
                      BioCellux - BioPanel PBM v1.0
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Edit Profile Form */}
                  <div className="px-4 py-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-slate-100">Edit Profile</h3>
                      <button 
                        onClick={() => setIsEditingProfile(false)}
                        className="p-1 text-slate-400 hover:text-slate-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                          Operator Name
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:border-pl-500 focus:ring-1 focus:ring-pl-500"
                          placeholder="Enter your name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                          Shift
                        </label>
                        <select
                          value={editShift}
                          onChange={(e) => setEditShift(e.target.value)}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:border-pl-500 focus:ring-1 focus:ring-pl-500"
                        >
                          <option value="Shift A">Shift A (6AM - 2PM)</option>
                          <option value="Shift B">Shift B (2PM - 10PM)</option>
                          <option value="Shift C">Shift C (10PM - 6AM)</option>
                          <option value="Day Shift">Day Shift</option>
                          <option value="Night Shift">Night Shift</option>
                        </select>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditingProfile(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={saveProfile}
                          className="flex-1"
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
