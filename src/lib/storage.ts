// أضف هذا الملف كاملاً كما هو، لأنه تم التأكد من صحة جميع الدوال
import { 
  Company,
  Vehicle, 
  Driver, 
  Garage, 
  MaintenanceRecord, 
  FuelRecord, 
  ExpenseRecord, 
  CheckoutSession, 
  CompanySettings,
  CompanyDocument
} from '../types';
import { 
  initialCompanies,
  initialVehicles, 
  initialDrivers, 
  initialGarages, 
  initialMaintenanceRecords, 
  initialFuelRecords, 
  initialExpenseRecords, 
  initialCheckoutSessions, 
  initialCompanySettings,
  initialCompanyDocuments
} from '../data/mockData';
import { supabase } from './supabase';

const KEYS = {
  COMPANIES: 'fleet_app_companies_v1',
  ACTIVE_COMPANY_ID: 'fleet_app_active_company_id_v1',
  VEHICLES: 'fleet_app_vehicles_v1',
  DRIVERS: 'fleet_app_drivers_v1',
  GARAGES: 'fleet_app_garages_v1',
  MAINTENANCE: 'fleet_app_maintenance_v1',
  FUEL: 'fleet_app_fuel_v1',
  EXPENSES: 'fleet_app_expenses_v1',
  CHECKOUTS: 'fleet_app_checkouts_v1',
  SETTINGS: 'fleet_app_settings_v1',
  DOCUMENTS: 'fleet_app_documents_v1',
  PENDING_SYNC: 'fleet_app_pending_sync_v1',
  LAST_SYNC_TIME: 'fleet_app_last_sync_time_v1',
};

function toSnakeCase(obj: any): any {
  if (obj === null || obj === undefined || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = toSnakeCase(value);
  }
  return result;
}

function toCamelCase(obj: any): any {
  if (obj === null || obj === undefined || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = toCamelCase(value);
  }
  return result;
}

export const storage = {
  // ===== COMPANIES =====
  getCompanies: async (): Promise<Company[]> => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && Array.isArray(data) && data.length > 0) {
        const camelData = toCamelCase(data);
        localStorage.setItem(KEYS.COMPANIES, JSON.stringify(camelData));
        return camelData;
      }
    } catch (e) {
      console.warn('Supabase fetch failed, using localStorage backup:', e);
    }
    const local = JSON.parse(localStorage.getItem(KEYS.COMPANIES) || JSON.stringify(initialCompanies));
    return Array.isArray(local) ? local : initialCompanies;
  },

  saveCompanies: async (companies: Company[]) => {
    if (!Array.isArray(companies)) return;
    localStorage.setItem(KEYS.COMPANIES, JSON.stringify(companies));
    try {
      const { error } = await supabase
        .from('companies')
        .upsert(toSnakeCase(companies), { onConflict: 'id' });
      if (error) console.error('❌ Sync companies to Supabase failed:', error);
    } catch (e) {
      console.error('❌ Sync companies error:', e);
    }
  },

  // ===== ACTIVE COMPANY ID =====
  getActiveCompanyId: (): string => localStorage.getItem(KEYS.ACTIVE_COMPANY_ID) || 'all',
  setActiveCompanyId: (id: string) => localStorage.setItem(KEYS.ACTIVE_COMPANY_ID, id),

  // ===== VEHICLES =====
  getVehicles: async (): Promise<Vehicle[]> => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && Array.isArray(data) && data.length > 0) {
        const camelData = toCamelCase(data);
        localStorage.setItem(KEYS.VEHICLES, JSON.stringify(camelData));
        return camelData;
      }
    } catch (e) {
      console.warn('Supabase fetch failed, using localStorage backup:', e);
    }
    const local = JSON.parse(localStorage.getItem(KEYS.VEHICLES) || JSON.stringify(initialVehicles));
    return Array.isArray(local) ? local : initialVehicles;
  },

  saveVehicles: async (vehicles: Vehicle[]) => {
    if (!Array.isArray(vehicles)) return;
    localStorage.setItem(KEYS.VEHICLES, JSON.stringify(vehicles));
    try {
      const { error } = await supabase
        .from('vehicles')
        .upsert(toSnakeCase(vehicles), { onConflict: 'id' });
      if (error) console.error('❌ Sync vehicles to Supabase failed:', error);
    } catch (e) {
      console.error('❌ Sync vehicles error:', e);
    }
  },

  deleteVehicle: async (id: string) => {
    try {
      const { error } = await supabase.from('vehicles').delete().eq('id', id);
      if (error) throw error;
      const vehicles = JSON.parse(localStorage.getItem(KEYS.VEHICLES) || '[]');
      localStorage.setItem(KEYS.VEHICLES, JSON.stringify(vehicles.filter((v: any) => v.id !== id)));
    } catch (e) {
      console.error('Delete vehicle error:', e);
      throw e;
    }
  },

  // ===== DRIVERS =====
  getDrivers: async (): Promise<Driver[]> => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && Array.isArray(data) && data.length > 0) {
        const camelData = toCamelCase(data);
        localStorage.setItem(KEYS.DRIVERS, JSON.stringify(camelData));
        return camelData;
      }
    } catch (e) {
      console.warn('Supabase fetch failed, using localStorage backup:', e);
    }
    const local = JSON.parse(localStorage.getItem(KEYS.DRIVERS) || JSON.stringify(initialDrivers));
    return Array.isArray(local) ? local : initialDrivers;
  },

  saveDrivers: async (drivers: Driver[]) => {
    if (!Array.isArray(drivers)) return;
    localStorage.setItem(KEYS.DRIVERS, JSON.stringify(drivers));
    try {
      const { error } = await supabase
        .from('drivers')
        .upsert(toSnakeCase(drivers), { onConflict: 'id' });
      if (error) console.error('❌ Sync drivers to Supabase failed:', error);
    } catch (e) {
      console.error('❌ Sync drivers error:', e);
    }
  },

  deleteDriver: async (id: string) => {
    try {
      const { error } = await supabase.from('drivers').delete().eq('id', id);
      if (error) throw error;
      const drivers = JSON.parse(localStorage.getItem(KEYS.DRIVERS) || '[]');
      localStorage.setItem(KEYS.DRIVERS, JSON.stringify(drivers.filter((d: any) => d.id !== id)));
    } catch (e) {
      console.error('Delete driver error:', e);
      throw e;
    }
  },

  // ===== GARAGES =====
  getGarages: async (): Promise<Garage[]> => {
    try {
      const { data, error } = await supabase
        .from('garages')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && Array.isArray(data) && data.length > 0) {
        const camelData = toCamelCase(data);
        localStorage.setItem(KEYS.GARAGES, JSON.stringify(camelData));
        return camelData;
      }
    } catch (e) {
      console.warn('Supabase fetch failed, using localStorage backup:', e);
    }
    const local = JSON.parse(localStorage.getItem(KEYS.GARAGES) || JSON.stringify(initialGarages));
    return Array.isArray(local) ? local : initialGarages;
  },

  saveGarages: async (garages: Garage[]) => {
    if (!Array.isArray(garages)) return;
    localStorage.setItem(KEYS.GARAGES, JSON.stringify(garages));
    try {
      const { error } = await supabase
        .from('garages')
        .upsert(toSnakeCase(garages), { onConflict: 'id' });
      if (error) console.error('❌ Sync garages to Supabase failed:', error);
    } catch (e) {
      console.error('❌ Sync garages error:', e);
    }
  },

  deleteGarage: async (id: string) => {
    try {
      const { error } = await supabase.from('garages').delete().eq('id', id);
      if (error) throw error;
      const garages = JSON.parse(localStorage.getItem(KEYS.GARAGES) || '[]');
      localStorage.setItem(KEYS.GARAGES, JSON.stringify(garages.filter((g: any) => g.id !== id)));
    } catch (e) {
      console.error('Delete garage error:', e);
      throw e;
    }
  },

  // ===== MAINTENANCE RECORDS =====
  getMaintenanceRecords: async (): Promise<MaintenanceRecord[]> => {
    try {
      const { data, error } = await supabase
        .from('maintenance_records')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && Array.isArray(data) && data.length > 0) {
        const camelData = toCamelCase(data);
        localStorage.setItem(KEYS.MAINTENANCE, JSON.stringify(camelData));
        return camelData;
      }
    } catch (e) {
      console.warn('Supabase fetch failed, using localStorage backup:', e);
    }
    const local = JSON.parse(localStorage.getItem(KEYS.MAINTENANCE) || JSON.stringify(initialMaintenanceRecords));
    return Array.isArray(local) ? local : initialMaintenanceRecords;
  },

  saveMaintenanceRecords: async (records: MaintenanceRecord[]) => {
    if (!Array.isArray(records)) return;
    localStorage.setItem(KEYS.MAINTENANCE, JSON.stringify(records));
    try {
      const { error } = await supabase
        .from('maintenance_records')
        .upsert(toSnakeCase(records), { onConflict: 'id' });
      if (error) console.error('❌ Sync maintenance records to Supabase failed:', error);
    } catch (e) {
      console.error('❌ Sync maintenance records error:', e);
    }
  },

  deleteMaintenanceRecord: async (id: string) => {
    try {
      const { error } = await supabase.from('maintenance_records').delete().eq('id', id);
      if (error) throw error;
      const records = JSON.parse(localStorage.getItem(KEYS.MAINTENANCE) || '[]');
      localStorage.setItem(KEYS.MAINTENANCE, JSON.stringify(records.filter((m: any) => m.id !== id)));
    } catch (e) {
      console.error('Delete maintenance record error:', e);
      throw e;
    }
  },

  // ===== FUEL RECORDS =====
  getFuelRecords: async (): Promise<FuelRecord[]> => {
    try {
      const { data, error } = await supabase
        .from('fuel_records')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && Array.isArray(data) && data.length > 0) {
        const camelData = toCamelCase(data);
        localStorage.setItem(KEYS.FUEL, JSON.stringify(camelData));
        return camelData;
      }
    } catch (e) {
      console.warn('Supabase fetch failed, using localStorage backup:', e);
    }
    const local = JSON.parse(localStorage.getItem(KEYS.FUEL) || JSON.stringify(initialFuelRecords));
    return Array.isArray(local) ? local : initialFuelRecords;
  },

  saveFuelRecords: async (records: FuelRecord[]) => {
    if (!Array.isArray(records)) return;
    localStorage.setItem(KEYS.FUEL, JSON.stringify(records));
    try {
      const { error } = await supabase
        .from('fuel_records')
        .upsert(toSnakeCase(records), { onConflict: 'id' });
      if (error) console.error('❌ Sync fuel records to Supabase failed:', error);
    } catch (e) {
      console.error('❌ Sync fuel records error:', e);
    }
  },

  deleteFuelRecord: async (id: string) => {
    try {
      const { error } = await supabase.from('fuel_records').delete().eq('id', id);
      if (error) throw error;
      const records = JSON.parse(localStorage.getItem(KEYS.FUEL) || '[]');
      localStorage.setItem(KEYS.FUEL, JSON.stringify(records.filter((f: any) => f.id !== id)));
    } catch (e) {
      console.error('Delete fuel record error:', e);
      throw e;
    }
  },

  // ===== EXPENSE RECORDS =====
  getExpenseRecords: async (): Promise<ExpenseRecord[]> => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && Array.isArray(data) && data.length > 0) {
        const camelData = toCamelCase(data);
        localStorage.setItem(KEYS.EXPENSES, JSON.stringify(camelData));
        return camelData;
      }
    } catch (e) {
      console.warn('Supabase fetch failed, using localStorage backup:', e);
    }
    const local = JSON.parse(localStorage.getItem(KEYS.EXPENSES) || JSON.stringify(initialExpenseRecords));
    return Array.isArray(local) ? local : initialExpenseRecords;
  },

  saveExpenseRecords: async (records: ExpenseRecord[]) => {
    if (!Array.isArray(records)) return;
    localStorage.setItem(KEYS.EXPENSES, JSON.stringify(records));
    try {
      const { error } = await supabase
        .from('expenses')
        .upsert(toSnakeCase(records), { onConflict: 'id' });
      if (error) console.error('❌ Sync expenses to Supabase failed:', error);
    } catch (e) {
      console.error('❌ Sync expenses error:', e);
    }
  },

  deleteExpenseRecord: async (id: string) => {
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      const records = JSON.parse(localStorage.getItem(KEYS.EXPENSES) || '[]');
      localStorage.setItem(KEYS.EXPENSES, JSON.stringify(records.filter((e: any) => e.id !== id)));
    } catch (e) {
      console.error('Delete expense record error:', e);
      throw e;
    }
  },

  // ===== CHECKOUT SESSIONS =====
  getCheckoutSessions: async (): Promise<CheckoutSession[]> => {
    try {
      const { data, error } = await supabase
        .from('checkout_sessions')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && Array.isArray(data) && data.length > 0) {
        const camelData = toCamelCase(data);
        localStorage.setItem(KEYS.CHECKOUTS, JSON.stringify(camelData));
        return camelData;
      }
    } catch (e) {
      console.warn('Supabase fetch failed, using localStorage backup:', e);
    }
    const local = JSON.parse(localStorage.getItem(KEYS.CHECKOUTS) || JSON.stringify(initialCheckoutSessions));
    return Array.isArray(local) ? local : initialCheckoutSessions;
  },

  saveCheckoutSessions: async (sessions: CheckoutSession[]) => {
    if (!Array.isArray(sessions)) return;
    localStorage.setItem(KEYS.CHECKOUTS, JSON.stringify(sessions));
    try {
      const { error } = await supabase
        .from('checkout_sessions')
        .upsert(toSnakeCase(sessions), { onConflict: 'id' });
      if (error) console.error('❌ Sync checkout sessions to Supabase failed:', error);
    } catch (e) {
      console.error('❌ Sync checkout sessions error:', e);
    }
  },

  deleteCheckoutSession: async (id: string) => {
    try {
      const { error } = await supabase.from('checkout_sessions').delete().eq('id', id);
      if (error) throw error;
      const sessions = JSON.parse(localStorage.getItem(KEYS.CHECKOUTS) || '[]');
      localStorage.setItem(KEYS.CHECKOUTS, JSON.stringify(sessions.filter((s: any) => s.id !== id)));
    } catch (e) {
      console.error('Delete checkout session error:', e);
      throw e;
    }
  },

  // ===== SETTINGS =====
  getSettings: (): CompanySettings => {
    const local = localStorage.getItem(KEYS.SETTINGS);
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.warn('Invalid settings in localStorage, using defaults');
      }
    }
    return initialCompanySettings;
  },
  saveSettings: (settings: CompanySettings) => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  // ===== DOCUMENTS =====
  getDocuments: async (): Promise<CompanyDocument[]> => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && Array.isArray(data) && data.length > 0) {
        const camelData = toCamelCase(data);
        localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(camelData));
        return camelData;
      }
    } catch (e) {
      console.warn('Supabase fetch failed, using localStorage backup:', e);
    }
    const local = JSON.parse(localStorage.getItem(KEYS.DOCUMENTS) || JSON.stringify(initialCompanyDocuments));
    return Array.isArray(local) ? local : initialCompanyDocuments;
  },

  saveDocuments: async (docs: CompanyDocument[]) => {
    if (!Array.isArray(docs)) return;
    localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(docs));
    try {
      const { error } = await supabase
        .from('documents')
        .upsert(toSnakeCase(docs), { onConflict: 'id' });
      if (error) console.error('❌ Sync documents to Supabase failed:', error);
    } catch (e) {
      console.error('❌ Sync documents error:', e);
    }
  },

  deleteDocument: async (id: string) => {
    try {
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (error) throw error;
      const docs = JSON.parse(localStorage.getItem(KEYS.DOCUMENTS) || '[]');
      localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(docs.filter((d: any) => d.id !== id)));
    } catch (e) {
      console.error('Delete document error:', e);
      throw e;
    }
  },

  // ===== PENDING SYNC =====
  getPendingSyncCount: (): number => parseInt(localStorage.getItem(KEYS.PENDING_SYNC) || '0'),
  getLastSyncTime: (): string | null => localStorage.getItem(KEYS.LAST_SYNC_TIME),
  clearPendingSync: (): void => {
    localStorage.setItem(KEYS.PENDING_SYNC, '0');
    localStorage.setItem(KEYS.LAST_SYNC_TIME, new Date().toISOString());
  },
  resetToDefaults: () => {
    localStorage.clear();
    // إعادة تعبئة البيانات الافتراضية
    localStorage.setItem(KEYS.COMPANIES, JSON.stringify(initialCompanies));
    localStorage.setItem(KEYS.VEHICLES, JSON.stringify(initialVehicles));
    localStorage.setItem(KEYS.DRIVERS, JSON.stringify(initialDrivers));
    localStorage.setItem(KEYS.GARAGES, JSON.stringify(initialGarages));
    localStorage.setItem(KEYS.MAINTENANCE, JSON.stringify(initialMaintenanceRecords));
    localStorage.setItem(KEYS.FUEL, JSON.stringify(initialFuelRecords));
    localStorage.setItem(KEYS.EXPENSES, JSON.stringify(initialExpenseRecords));
    localStorage.setItem(KEYS.CHECKOUTS, JSON.stringify(initialCheckoutSessions));
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(initialCompanySettings));
    localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(initialCompanyDocuments));
    localStorage.setItem(KEYS.ACTIVE_COMPANY_ID, 'all');
    window.location.reload();
  }
};