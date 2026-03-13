import { format, formatDistanceToNow, parseISO } from 'date-fns';
import type { StockLevel, Component, WorkOrderStatus } from '../types';

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

// Format number with commas
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

// Format percentage
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// Format date
export function formatDate(date: string | Date, formatStr = 'MMM d, yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr);
}

// Format datetime
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy h:mm a');
}

// Format time ago
export function formatTimeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

// Format relative time (alias for formatTimeAgo)
export function formatRelativeTime(date: string | Date): string {
  return formatTimeAgo(date);
}

// Get stock level status
export function getStockLevel(component: Component): StockLevel {
  const { currentStock, minStock, reorderPoint, maxStock } = component;
  
  if (currentStock <= 0 || currentStock < minStock * 0.5) {
    return 'critical';
  }
  if (currentStock < minStock || currentStock <= reorderPoint) {
    return 'low';
  }
  if (currentStock > maxStock * 0.8) {
    return 'high';
  }
  return 'adequate';
}

// Get stock level color classes
export function getStockLevelColor(level: StockLevel): string {
  switch (level) {
    case 'critical':
      return 'text-red-400 bg-red-400/10';
    case 'low':
      return 'text-yellow-400 bg-yellow-400/10';
    case 'adequate':
      return 'text-green-400 bg-green-400/10';
    case 'high':
      return 'text-blue-400 bg-blue-400/10';
  }
}

// Get stock level badge
export function getStockLevelBadge(level: StockLevel): string {
  switch (level) {
    case 'critical':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'low':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'adequate':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'high':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  }
}

// Get work order status color
export function getWorkOrderStatusColor(status: WorkOrderStatus): string {
  switch (status) {
    case 'queued':
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    case 'in-progress':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'qc':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'complete':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'failed':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
  }
}

// Get priority color
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'high':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'normal':
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    case 'low':
      return 'bg-slate-600/20 text-slate-500 border-slate-600/30';
    default:
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
}

// Generate serial number
export function generateSerialNumber(prefix: string): string {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 99999)).padStart(5, '0');
  return `${prefix}-${year}-${seq}`;
}

// Calculate BOM cost
export function calculateBOMCost(items: { unitCost: number; quantity: number }[]): number {
  return items.reduce((total, item) => total + item.unitCost * item.quantity, 0);
}

// Export to CSV
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  headers?: { key: keyof T; label: string }[]
): void {
  if (data.length === 0) return;

  const keys = headers?.map((h) => h.key) || (Object.keys(data[0]) as (keyof T)[]);
  const headerLabels = headers?.map((h) => h.label) || keys.map(String);

  const csvContent = [
    headerLabels.join(','),
    ...data.map((row) =>
      keys.map((key) => {
        const value = row[key];
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return String(value ?? '');
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// Debounce function
export function debounce<Args extends unknown[]>(
  func: (...args: Args) => void,
  wait: number
): (...args: Args) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Category display names
export const categoryDisplayNames: Record<string, string> = {
  substrate: 'Substrates',
  phosphor: 'Phosphors',
  encapsulant: 'Encapsulants',
  optical: 'Optical Components',
  electrical: 'Electrical',
  mechanical: 'Mechanical',
  packaging: 'Packaging',
  consumable: 'Consumables',
};

// Get category display name
export function getCategoryDisplayName(category: string): string {
  return categoryDisplayNames[category] || category;
}

// Keyboard shortcut helper
export function isKeyboardShortcut(
  e: KeyboardEvent,
  key: string,
  modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean } = {}
): boolean {
  const ctrlMatch = modifiers.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
  const shiftMatch = modifiers.shift ? e.shiftKey : !e.shiftKey;
  const altMatch = modifiers.alt ? e.altKey : !e.altKey;
  return e.key.toLowerCase() === key.toLowerCase() && ctrlMatch && shiftMatch && altMatch;
}
