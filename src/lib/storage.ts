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

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error('Storage read error for key:', key, e);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const currentPending = getItem<number>(KEYS.PENDING_SYNC, 0);
      localStorage.setItem(KEYS.PENDING_SYNC, JSON.stringify(currentPending + 1));
    } else {
      localStorage.setItem(KEYS.LAST_SYNC_TIME, JSON.stringify(new Date().toISOString()));
    }
    window.dispatchEvent(new Event('fleet_storage_update'));
    window.dispatchEvent(new Event('fleet_pending_sync_update'));
  } catch (e) {
    console.error('Storage write error for key:', key, e);
  }
}

export const storage = {
  // ===== COMPANIES (تبقى محلية فقط) =====
  getCompanies: (): Company[] => getItem(KEYS.COMPANIES, initialCompanies),
  saveCompanies: (companies: Company[]) => setItem(KEYS.COMPANIES, companies),

  getActiveCompanyId: (): string => getItem(KEYS.ACTIVE_COMPANY_ID, 'comp-1'),
  setActiveCompanyId: (id: string) => setItem(KEYS.ACTIVE_COMPANY_ID, id),

  // ===== VEHICLES =====
  getVehicles: async (): Promise<Vehicle[]> => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && Array.isArray(data) && data.length > 0) {
        localStorage.setItem(KEYS.VEHICLES, JSON.stringify(data));
        return data;
      }
    } catch (e) {
      console.warn('Supabase fetch failed, falling back to localStorage:', e);
    }
    const local = getItem<Vehicle[]>(KEYS.VEHICLES, initialVehicles);
    return Array.isArray(local) ? local : initialVehicles;
  },

  saveVehicles: async (vehicles: Vehicle[]) => {
    if (!Array.isArray(vehicles)) return;
    setItem(KEYS.VEHICLES, vehicles);
    try {
      const { error } = await supabase
        .from('vehicles')
        .upsert(vehicles, { onConflict: 'id' });
      if (error) console.error('Sync to Supabase failed:', error);
    } catch (e) {
      console.error('Sync error:', e);
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
        return data;
      }
    } catch (e) {
      console.warn('Supabase fetch failed, falling back to localStorage:', e);
    }
    const local = getItem<Driver[]>(KEYS.DRIVERS, initialDrivers);
    return Array.isArray(local) ? local : initialDrivers;
  },

  saveDrivers: async (drivers: Driver[]) => {
    if (!Array.isArray(drivers)) return;
    setItem(KEYS.DRIVERS, drivers);
    try {
      const { error } = await supabase
        .from('drivers')
        .upsert(drivers, { onConflict: 'id' });
      if (error) console.error('Sync to Supabase failed:', error);
    } catch (e) {
      console.error('Sync error:', e);
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
        return data;
      }
    } catch (e) {
      console.warn('Supabase fetch failed, falling back to localStorage:', e);
    }
    const local = getItem<Garage[]>(KEYS.GARAGES, initialGarages);
    return Array.isArray(local) ? local : initialGarages;
  },

  saveGarages: async (garages: Garage[]) => {
    if (!Array.isArray(garages)) return;
    setItem(KEYS.GARAGES, garages);
    try {
      const { error } = await supabase
        .from('garages')
        .upsert(garages, { onConflict: 'id' });
      if (error) console.error('Sync to Supabase failed:', error);
    } catch (e) {
      console.error('Sync error:', e);
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
        return data;
      }
    } catch (e) {
      console.warn('Supabase fetch failed, falling back to localStorage:', e);
    }
    const local = getItem<MaintenanceRecord[]>(KEYS.MAINTENANCE, initialMaintenanceRecords);
    return Array.isArray(local) ? local : initialMaintenanceRecords;
  },

  saveMaintenanceRecords: async (records: MaintenanceRecord[]) => {
    if (!Array.isArray(records)) return;
    setItem(KEYS.MAINTENANCE, records);
    try {
      const { error } = await supabase
        .from('maintenance_records')
        .upsert(records, { onConflict: 'id' });
      if (error) console.error('Sync to Supabase failed:', error);
    } catch (e) {
      console.error('Sync error:', e);
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
        return data;
      }
    } catch (e) {
      console.warn('Supabase fetch failed, falling back to localStorage:', e);
    }
    const local = getItem<FuelRecord[]>(KEYS.FUEL, initialFuelRecords);
    return Array.isArray(local) ? local : initialFuelRecords;
  },

  saveFuelRecords: async (records: FuelRecord[]) => {
    if (!Array.isArray(records)) return;
    setItem(KEYS.FUEL, records);
    try {
      const { error } = await supabase
        .from('fuel_records')
        .upsert(records, { onConflict: 'id' });
      if (error) console.error('Sync to Supabase failed:', error);
    } catch (e) {
      console.error('Sync error:', e);
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
        return data;
      }
    } catch (e) {
      console.warn('Supabase fetch failed, falling back to localStorage:', e);
    }
    const local = getItem<ExpenseRecord[]>(KEYS.EXPENSES, initialExpenseRecords);
    return Array.isArray(local) ? local : initialExpenseRecords;
  },

  saveExpenseRecords: async (records: ExpenseRecord[]) => {
    if (!Array.isArray(records)) return;
    setItem(KEYS.EXPENSES, records);
    try {
      const { error } = await supabase
        .from('expenses')
        .upsert(records, { onConflict: 'id' });
      if (error) console.error('Sync to Supabase failed:', error);
    } catch (e) {
      console.error('Sync error:', e);
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
        return data;
      }
    } catch (e) {
      console.warn('Supabase fetch failed, falling back to localStorage:', e);
    }
    const local = getItem<CheckoutSession[]>(KEYS.CHECKOUTS, initialCheckoutSessions);
    return Array.isArray(local) ? local : initialCheckoutSessions;
  },

  saveCheckoutSessions: async (sessions: CheckoutSession[]) => {
    if (!Array.isArray(sessions)) return;
    setItem(KEYS.CHECKOUTS, sessions);
    try {
      const { error } = await supabase
        .from('checkout_sessions')
        .upsert(sessions, { onConflict: 'id' });
      if (error) console.error('Sync to Supabase failed:', error);
    } catch (e) {
      console.error('Sync error:', e);
    }
  },

  // ===== SETTINGS (تبقى محلية فقط) =====
  getSettings: (): CompanySettings => {
    const s = getItem(KEYS.SETTINGS, initialCompanySettings);
    if (!s.companyName || s.companyName.includes('شركة المسار اللوجستية')) {
      s.companyName = 'YAMANIX';
    }
    return s;
  },
  saveSettings: (settings: CompanySettings) => setItem(KEYS.SETTINGS, settings),

  // ===== DOCUMENTS =====
  getDocuments: async (): Promise<CompanyDocument[]> => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && Array.isArray(data) && data.length > 0) {
        localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(data));
        return data;
      }
    } catch (e) {
      console.warn('Supabase fetch failed, falling back to localStorage:', e);
    }
    const local = getItem<CompanyDocument[]>(KEYS.DOCUMENTS, initialCompanyDocuments);
    return Array.isArray(local) ? local : initialCompanyDocuments;
  },

  saveDocuments: async (docs: CompanyDocument[]) => {
    if (!Array.isArray(docs)) return;
    setItem(KEYS.DOCUMENTS, docs);
    try {
      const { error } = await supabase
        .from('documents')
        .upsert(docs, { onConflict: 'id' });
      if (error) console.error('Sync to Supabase failed:', error);
    } catch (e) {
      console.error('Sync error:', e);
    }
  },

  // ===== PENDING SYNC =====
  getPendingSyncCount: (): number => getItem<number>(KEYS.PENDING_SYNC, 0),
  getLastSyncTime: (): string | null => getItem<string | null>(KEYS.LAST_SYNC_TIME, null),

  clearPendingSync: (): void => {
    localStorage.setItem(KEYS.PENDING_SYNC, '0');
    localStorage.setItem(KEYS.LAST_SYNC_TIME, JSON.stringify(new Date().toISOString()));
    window.dispatchEvent(new Event('fleet_pending_sync_update'));
  },

  resetToDefaults: () => {
    localStorage.removeItem(KEYS.COMPANIES);
    localStorage.removeItem(KEYS.ACTIVE_COMPANY_ID);
    localStorage.removeItem(KEYS.VEHICLES);
    localStorage.removeItem(KEYS.DRIVERS);
    localStorage.removeItem(KEYS.GARAGES);
    localStorage.removeItem(KEYS.MAINTENANCE);
    localStorage.removeItem(KEYS.FUEL);
    localStorage.removeItem(KEYS.EXPENSES);
    localStorage.removeItem(KEYS.CHECKOUTS);
    localStorage.removeItem(KEYS.SETTINGS);
    localStorage.removeItem(KEYS.DOCUMENTS);
    localStorage.removeItem(KEYS.PENDING_SYNC);
    localStorage.removeItem(KEYS.LAST_SYNC_TIME);
    window.dispatchEvent(new Event('fleet_storage_update'));
    window.dispatchEvent(new Event('fleet_pending_sync_update'));
  }
};