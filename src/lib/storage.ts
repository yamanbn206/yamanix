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

// ============================================================
// مفاتيح التخزين المحلي (للنسخ الاحتياطي فقط)
// ============================================================
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

// ============================================================
// دوال مساعدة للتحويل بين camelCase و snake_case
// ============================================================
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

// ============================================================
// دوال التخزين (تعتمد على Supabase + localStorage كنسخة احتياطية)
// ============================================================
export const storage = {

  // ===== COMPANIES =====
  getCompanies: async (): Promise<Company[]> => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && Array.isArray(data)) {
        localStorage.setItem(KEYS.COMPANIES, JSON.stringify(data));
        return toCamelCase(data);
      }
    } catch (e) {
      console.warn('Supabase fetch failed, falling back to localStorage:', e);
    }
    return toCamelCase(JSON.parse(localStorage.getItem(KEYS.COMPANIES) || JSON.stringify(initialCompanies)));
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
  getActiveCompanyId: (): string => {
    return localStorage.getItem(KEYS.ACTIVE_COMPANY_ID) || 'all';
  },
  setActiveCompanyId: (id: string) => {
    localStorage.setItem(KEYS.ACTIVE_COMPANY_ID, id);
  },

  // ===== VEHICLES =====
  getVehicles: async (): Promise<Vehicle[]> => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && Array.isArray(data) && data.length > 0) {
        localStorage.setItem(KEYS.VEHICLES, JSON.stringify(data));
        return toCamelCase(data);
      }
    } catch (e) {
      console.warn('Supabase fetch failed, falling back to localStorage:', e);
    }
    const local = JSON.parse(localStorage.getItem(KEYS.VEHICLES) || JSON.stringify(initialVehicles));
    return Array.isArray(local) ? toCamelCase(local) : initialVehicles;
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

  // ===== DRIVERS =====
  getDrivers: async (): Promise<Driver[]> => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && Array.isArray(data) && data.length > 0) {
        localStorage.setItem(KEYS.DRIVERS, JSON.stringify(data));
        return toCamelCase(data);
      }
    } catch (e) {
      console.warn('Supabase fetch failed, falling back to localStorage:', e);
    }
    const local = JSON.parse(localStorage.getItem(KEYS.DRIVERS) || JSON.stringify(initialDrivers));
    return Array.isArray(local) ? toCamelCase(local) : initialDrivers;
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

  // ===== GARAGES =====
  getGarages: async (): Promise<Garage[]> => {
    try {
      const { data, error } = await supabase
        .from('garages')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && Array.isArray(data) && data.length > 0) {
        localStorage.setItem(KEYS.GARAGES, JSON.stringify(data));
        return toCamelCase(data);
      }
    } catch (e) {
      console.warn('Supabase fetch failed, falling back to localStorage:', e);
    }
    const local = JSON.parse(localStorage.getItem(KEYS.GARAGES) || JSON.stringify(initialGarages));
    return Array.isArray(local) ? toCamelCase(local) : initialGarages;
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

  // ===== MAINTENANCE RECORDS =====
  getMaintenanceRecords: async (): Promise<MaintenanceRecord[]> => {
    try {
      const { data, error } = await supabase
        .from('maintenance_records')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && Array.isArray(data) && data.length > 0) {
        localStorage.setItem(KEYS.MAINTENANCE, JSON.stringify(data));
        return toCamelCase(data);
      }
    } catch (e) {
      console.warn('Supabase fetch failed, falling back to localStorage:', e);
    }
    const local = JSON.parse(localStorage.getItem(KEYS.MAINTENANCE) || JSON.stringify(initialMaintenanceRecords));
    return Array.isArray(local) ? toCamelCase(local) : initialMaintenanceRecords;
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

  // ===== FUEL RECORDS =====
  getFuelRecords: async (): Promise<FuelRecord[]> => {
    try {
      const { data, error } = await supabase
        .from('fuel_records')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && Array.isArray(data) && data.length > 0) {
        localStorage.setItem(KEYS.FUEL, JSON.stringify(data));
        return toCamelCase(data);
      }
    } catch (e) {
      console.warn('Supabase fetch failed, falling back to localStorage:', e);
    }
    const local = JSON.parse(localStorage.getItem(KEYS.FUEL) || JSON.stringify(initialFuelRecords));
    return Array.isArray(local) ? toCamelCase(local) : initialFuelRecords;
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

  // ===== EXPENSE RECORDS =====
  getExpenseRecords: async (): Promise<ExpenseRecord[]> => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && Array.isArray(data) && data.length > 0) {
        localStorage.setItem(KEYS.EXPENSES, JSON.stringify(data));
        return toCamelCase(data);
      }
    } catch (e) {
      console.warn('Supabase fetch failed, falling back to localStorage:', e);
    }
    const local = JSON.parse(localStorage.getItem(KEYS.EXPENSES) || JSON.stringify(initialExpenseRecords));
    return Array.isArray(local) ? toCamelCase(local) : initialExpenseRecords;
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

  // ===== CHECKOUT SESSIONS =====
  getCheckoutSessions: async (): Promise<CheckoutSession[]> => {
    try {
      const { data, error } = await supabase
        .from('checkout_sessions')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && Array.isArray(data) && data.length > 0) {
        localStorage.setItem(KEYS.CHECKOUTS, JSON.stringify(data));
        return toCamelCase(data);
      }
    } catch (e) {
      console.warn('Supabase fetch failed, falling back to localStorage:', e);
    }
    const local = JSON.parse(localStorage.getItem(KEYS.CHECKOUTS) || JSON.stringify(initialCheckoutSessions));
    return Array.isArray(local) ? toCamelCase(local) : initialCheckoutSessions;
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
        localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(data));
        return toCamelCase(data);
      }
    } catch (e) {
      console.warn('Supabase fetch failed, falling back to localStorage:', e);
    }
    const local = JSON.parse(localStorage.getItem(KEYS.DOCUMENTS) || JSON.stringify(initialCompanyDocuments));
    return Array.isArray(local) ? toCamelCase(local) : initialCompanyDocuments;
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

  // ===== دوال المزامنة =====
  getPendingSyncCount: (): number => {
    return parseInt(localStorage.getItem(KEYS.PENDING_SYNC) || '0');
  },
  getLastSyncTime: (): string | null => {
    return localStorage.getItem(KEYS.LAST_SYNC_TIME);
  },
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