// Persistence layer using localStorage
// This wraps the mock data arrays and syncs them with localStorage

import type { Component, BillOfMaterials, WorkOrder, Device } from '../types';
import { 
  mockComponents as initialComponents,
  mockBOMs as initialBOMs,
  mockWorkOrders as initialWorkOrders,
  mockDevices as initialDevices,
} from './mockData';

const STORAGE_KEYS = {
  components: 'pl-inventory-components',
  boms: 'pl-inventory-boms',
  workOrders: 'pl-inventory-workorders',
  devices: 'pl-inventory-devices',
  initialized: 'pl-inventory-initialized',
};

// Load data from localStorage or use initial mock data
function loadFromStorage<T>(key: string, initialData: T[]): T[] {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error(`Error loading ${key} from localStorage:`, e);
  }
  return [...initialData];
}

// Save data to localStorage
function saveToStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage:`, e);
  }
}

// Initialize data - check if first time or load existing
function initializeData(): void {
  const initialized = localStorage.getItem(STORAGE_KEYS.initialized);
  if (!initialized) {
    // First time - save initial mock data
    saveToStorage(STORAGE_KEYS.components, initialComponents);
    saveToStorage(STORAGE_KEYS.boms, initialBOMs);
    saveToStorage(STORAGE_KEYS.workOrders, initialWorkOrders);
    saveToStorage(STORAGE_KEYS.devices, initialDevices);
    localStorage.setItem(STORAGE_KEYS.initialized, 'true');
  }
}

// Initialize on module load
initializeData();

// Clear devices on first load after update (one-time cleanup)
const CLEANUP_VERSION = 'v2';
if (localStorage.getItem('pl-cleanup-version') !== CLEANUP_VERSION) {
  localStorage.removeItem(STORAGE_KEYS.devices);
  localStorage.removeItem(STORAGE_KEYS.workOrders);
  localStorage.setItem('pl-cleanup-version', CLEANUP_VERSION);
}

// Persistent data arrays - these replace the mock arrays
export const persistentComponents: Component[] = loadFromStorage(STORAGE_KEYS.components, initialComponents);
export const persistentBOMs: BillOfMaterials[] = loadFromStorage(STORAGE_KEYS.boms, initialBOMs);
export const persistentWorkOrders: WorkOrder[] = loadFromStorage(STORAGE_KEYS.workOrders, []);
export const persistentDevices: Device[] = loadFromStorage(STORAGE_KEYS.devices, []);

// Save functions - call these after modifying data
export function saveComponents(): void {
  saveToStorage(STORAGE_KEYS.components, persistentComponents);
}

export function saveBOMs(): void {
  saveToStorage(STORAGE_KEYS.boms, persistentBOMs);
}

export function saveWorkOrders(): void {
  saveToStorage(STORAGE_KEYS.workOrders, persistentWorkOrders);
}

export function saveDevices(): void {
  saveToStorage(STORAGE_KEYS.devices, persistentDevices);
}

// Clear all data and reset to initial
export function resetAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.initialized);
  localStorage.removeItem(STORAGE_KEYS.components);
  localStorage.removeItem(STORAGE_KEYS.boms);
  localStorage.removeItem(STORAGE_KEYS.workOrders);
  localStorage.removeItem(STORAGE_KEYS.devices);
  // Reload the page to reinitialize
  window.location.reload();
}
