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
    
    // Track pending offline changes if connection is offline
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

// Helper function to sync data with Supabase
async function syncToSupabase<T>(
  tableName: string,
  data: T[],
  onConflict: string = 'id'
): Promise<void> {
  try {
    const { error } = await supabase
      .from(tableName)
      .upsert(data, { onConflict });

    if (error) {
      console.error(`Sync to Supabase (${tableName}) failed:`, error);
    } else {
      console.log(`✅ ${tableName} synced to Supabase successfully`);
    }
  } catch (e) {
    console.error(`Sync error for ${tableName}:`, e);
  }
}

// Helper function to fetch data from Supabase
async function fetchFromSupabase<T>(
  tableName: string,
  orderBy: string = 'created_at',
  ascending: boolean = false
): Promise<T[]> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order(orderBy, { ascending });

    if (!error && data && data.length > 0) {
      return data as T[];
    }
    return [];
  } catch (e) {
    console.warn(`Supabase fetch failed for ${tableName}:`, e);
    return [];
  }
}

export const storage = {
  // Companies
  getCompanies: async (): Promise<Company[]> => {
    const localData = getItem<Company[]>(KEYS.COMPANIES, initialCompanies);
    try {
      const supabaseData = await fetchFromSupabase<Company>('companies');
      if (supabaseData.length > 0) {
        localStorage.setItem(KEYS.COMPANIES, JSON.stringify(supabaseData));
        return supabaseData;
      }
    } catch (e) {
      console.warn('Failed to fetch companies from Supabase, using local data');
    }
    return localData;
  },
  saveCompanies: async (companies: Company[]) => {
    setItem(KEYS.COMPANIES, companies);
    await syncToSupabase('companies', companies);
  },

  // Active Company ID
  getActiveCompanyId: (): string => getItem(KEYS.ACTIVE_COMPANY_ID, 'comp-1'),
  setActiveCompanyId: (id: string) => setItem(KEYS.ACTIVE_COMPANY_ID, id),

  // Vehicles
  getVehicles: async (): Promise<Vehicle[]> => {
    const localData = getItem<Vehicle[]>(KEYS.VEHICLES, initialVehicles);
    try {
      const supabaseData = await fetchFromSupabase<Vehicle>('vehicles');
      if (supabaseData.length > 0) {
        localStorage.setItem(KEYS.VEHICLES, JSON.stringify(supabaseData));
        return supabaseData;
      }
    } catch (e) {
      console.warn('Failed to fetch vehicles from Supabase, using local data');
    }
    return localData;
  },
  saveVehicles: async (vehicles: Vehicle[]) => {
    setItem(KEYS.VEHICLES, vehicles);
    await syncToSupabase('vehicles', vehicles);
  },

  // Drivers
  getDrivers: async (): Promise<Driver[]> => {
    const localData = getItem<Driver[]>(KEYS.DRIVERS, initialDrivers);
    try {
      const supabaseData = await fetchFromSupabase<Driver>('drivers');
      if (supabaseData.length > 0) {
        localStorage.setItem(KEYS.DRIVERS, JSON.stringify(supabaseData));
        return supabaseData;
      }
    } catch (e) {
      console.warn('Failed to fetch drivers from Supabase, using local data');
    }
    return localData;
  },
  saveDrivers: async (drivers: Driver[]) => {
    setItem(KEYS.DRIVERS, drivers);
    await syncToSupabase('drivers', drivers);
  },

  // Garages
  getGarages: async (): Promise<Garage[]> => {
    const localData = getItem<Garage[]>(KEYS.GARAGES, initialGarages);
    try {
      const supabaseData = await fetchFromSupabase<Garage>('garages');
      if (supabaseData.length > 0) {
        localStorage.setItem(KEYS.GARAGES, JSON.stringify(supabaseData));
        return supabaseData;
      }
    } catch (e) {
      console.warn('Failed to fetch garages from Supabase, using local data');
    }
    return localData;
  },
  saveGarages: async (garages: Garage[]) => {
    setItem(KEYS.GARAGES, garages);
    await syncToSupabase('garages', garages);
  },

  // Maintenance Records
  getMaintenanceRecords: async (): Promise<MaintenanceRecord[]> => {
    const localData = getItem<MaintenanceRecord[]>(KEYS.MAINTENANCE, initialMaintenanceRecords);
    try {
      const supabaseData = await fetchFromSupabase<MaintenanceRecord>('maintenance_records');
      if (supabaseData.length > 0) {
        localStorage.setItem(KEYS.MAINTENANCE, JSON.stringify(supabaseData));
        return supabaseData;
      }
    } catch (e) {
      console.warn('Failed to fetch maintenance records from Supabase, using local data');
    }
    return localData;
  },
  saveMaintenanceRecords: async (records: MaintenanceRecord[]) => {
    setItem(KEYS.MAINTENANCE, records);
    await syncToSupabase('maintenance_records', records);
  },

  // Fuel Records
  getFuelRecords: async (): Promise<FuelRecord[]> => {
    const localData = getItem<FuelRecord[]>(KEYS.FUEL, initialFuelRecords);
    try {
      const supabaseData = await fetchFromSupabase<FuelRecord>('fuel_records');
      if (supabaseData.length > 0) {
        localStorage.setItem(KEYS.FUEL, JSON.stringify(supabaseData));
        return supabaseData;
      }
    } catch (e) {
      console.warn('Failed to fetch fuel records from Supabase, using local data');
    }
    return localData;
  },
  saveFuelRecords: async (records: FuelRecord[]) => {
    setItem(KEYS.FUEL, records);
    await syncToSupabase('fuel_records', records);
  },

  // Expenses
  getExpenseRecords: async (): Promise<ExpenseRecord[]> => {
    const localData = getItem<ExpenseRecord[]>(KEYS.EXPENSES, initialExpenseRecords);
    try {
      const supabaseData = await fetchFromSupabase<ExpenseRecord>('expenses');
      if (supabaseData.length > 0) {
        localStorage.setItem(KEYS.EXPENSES, JSON.stringify(supabaseData));
        return supabaseData;
      }
    } catch (e) {
      console.warn('Failed to fetch expenses from Supabase, using local data');
    }
    return localData;
  },
  saveExpenseRecords: async (records: ExpenseRecord[]) => {
    setItem(KEYS.EXPENSES, records);
    await syncToSupabase('expenses', records);
  },

  // Checkout Sessions
  getCheckoutSessions: async (): Promise<CheckoutSession[]> => {
    const localData = getItem<CheckoutSession[]>(KEYS.CHECKOUTS, initialCheckoutSessions);
    try {
      const supabaseData = await fetchFromSupabase<CheckoutSession>('checkout_sessions');
      if (supabaseData.length > 0) {
        localStorage.setItem(KEYS.CHECKOUTS, JSON.stringify(supabaseData));
        return supabaseData;
      }
    } catch (e) {
      console.warn('Failed to fetch checkout sessions from Supabase, using local data');
    }
    return localData;
  },
  saveCheckoutSessions: async (sessions: CheckoutSession[]) => {
    setItem(KEYS.CHECKOUTS, sessions);
    await syncToSupabase('checkout_sessions', sessions);
  },

  // Settings (stays local, no Supabase sync for now)
  getSettings: (): CompanySettings => {
    const s = getItem(KEYS.SETTINGS, initialCompanySettings);
    if (!s.companyName || s.companyName.includes('شركة المسار اللوجستية')) {
      s.companyName = 'YAMANIX';
    }
    return s;
  },
  saveSettings: (settings: CompanySettings) => setItem(KEYS.SETTINGS, settings),

  // Documents
  getDocuments: async (): Promise<CompanyDocument[]> => {
    const localData = getItem<CompanyDocument[]>(KEYS.DOCUMENTS, initialCompanyDocuments);
    try {
      const supabaseData = await fetchFromSupabase<CompanyDocument>('documents');
      if (supabaseData.length > 0) {
        localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(supabaseData));
        return supabaseData;
      }
    } catch (e) {
      console.warn('Failed to fetch documents from Supabase, using local data');
    }
    return localData;
  },
  saveDocuments: async (docs: CompanyDocument[]) => {
    setItem(KEYS.DOCUMENTS, docs);
    await syncToSupabase('documents', docs);
  },

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