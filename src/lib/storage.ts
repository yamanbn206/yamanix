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

// ====================================================
// مفاتيح التخزين (لم تعد مستخدمة، لكن نبقيها للتوافق)
// ====================================================
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

// ====================================================
// دوال مساعدة لتحويل camelCase ↔ snake_case
// ====================================================

/** تحويل camelCase إلى snake_case */
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

/** تحويل snake_case إلى camelCase */
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

// ====================================================
// كائن storage المعتمد على Supabase فقط
// ====================================================
export const storage = {

  // ===== COMPANIES =====
  getCompanies: async (): Promise<Company[]> => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && Array.isArray(data)) {
        return toCamelCase(data);
      }
    } catch (e) {
      console.error('❌ Failed to fetch companies from Supabase:', e);
    }
    return initialCompanies;
  },

  saveCompanies: async (companies: Company[]) => {
    if (!Array.isArray(companies)) return;
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
  getActiveCompanyId: (): string => 'comp-1', // القيمة الافتراضية
  setActiveCompanyId: (_id: string) => { /* لا شيء */ },

  // ===== VEHICLES =====
  getVehicles: async (): Promise<Vehicle[]> => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && Array.isArray(data)) {
        return toCamelCase(data);
      }
    } catch (e) {
      console.error('❌ Failed to fetch vehicles from Supabase:', e);
    }
    return initialVehicles;
  },

  saveVehicles: async (vehicles: Vehicle[]) => {
    if (!Array.isArray(vehicles)) return;
    try {
      const { error } = await supabase
        .from('vehicles')
        .upsert(toSnakeCase(vehicles), { onConflict: 'id' });
      if (error) {
        console.error('❌ Sync vehicles to Supabase failed:', error);
      } else {
        console.log('✅ Vehicles synced to Supabase successfully');
      }
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
      if (!error && data && Array.isArray(data)) {
        return toCamelCase(data);
      }
    } catch (e) {
      console.error('❌ Failed to fetch drivers from Supabase:', e);
    }
    return initialDrivers;
  },

  saveDrivers: async (drivers: Driver[]) => {
    if (!Array.isArray(drivers)) return;
    try {
      const { error } = await supabase
        .from('drivers')
        .upsert(toSnakeCase(drivers), { onConflict: 'id' });
      if (error) {
        console.error('❌ Sync drivers to Supabase failed:', error);
      }
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
      if (!error && data && Array.isArray(data)) {
        return toCamelCase(data);
      }
    } catch (e) {
      console.error('❌ Failed to fetch garages from Supabase:', e);
    }
    return initialGarages;
  },

  saveGarages: async (garages: Garage[]) => {
    if (!Array.isArray(garages)) return;
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
      if (!error && data && Array.isArray(data)) {
        return toCamelCase(data);
      }
    } catch (e) {
      console.error('❌ Failed to fetch maintenance records from Supabase:', e);
    }
    return initialMaintenanceRecords;
  },

  saveMaintenanceRecords: async (records: MaintenanceRecord[]) => {
    if (!Array.isArray(records)) return;
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
      if (!error && data && Array.isArray(data)) {
        return toCamelCase(data);
      }
    } catch (e) {
      console.error('❌ Failed to fetch fuel records from Supabase:', e);
    }
    return initialFuelRecords;
  },

  saveFuelRecords: async (records: FuelRecord[]) => {
    if (!Array.isArray(records)) return;
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
      if (!error && data && Array.isArray(data)) {
        return toCamelCase(data);
      }
    } catch (e) {
      console.error('❌ Failed to fetch expenses from Supabase:', e);
    }
    return initialExpenseRecords;
  },

  saveExpenseRecords: async (records: ExpenseRecord[]) => {
    if (!Array.isArray(records)) return;
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
      if (!error && data && Array.isArray(data)) {
        return toCamelCase(data);
      }
    } catch (e) {
      console.error('❌ Failed to fetch checkout sessions from Supabase:', e);
    }
    return initialCheckoutSessions;
  },

  saveCheckoutSessions: async (sessions: CheckoutSession[]) => {
    if (!Array.isArray(sessions)) return;
    try {
      const { error } = await supabase
        .from('checkout_sessions')
        .upsert(toSnakeCase(sessions), { onConflict: 'id' });
      if (error) console.error('❌ Sync checkout sessions to Supabase failed:', error);
    } catch (e) {
      console.error('❌ Sync checkout sessions error:', e);
    }
  },

  // ===== SETTINGS (تبقى فقط البيانات المحلية للعرض، لأن الإعدادات ليست في Supabase) =====
  getSettings: (): CompanySettings => {
    return initialCompanySettings;
  },
  saveSettings: (settings: CompanySettings) => {
    console.warn('⚠️ Settings are not saved to Supabase yet (local only)');
    // يمكنك لاحقاً حفظها في جدول settings إن أردت
  },

  // ===== DOCUMENTS =====
  getDocuments: async (): Promise<CompanyDocument[]> => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && Array.isArray(data)) {
        return toCamelCase(data);
      }
    } catch (e) {
      console.error('❌ Failed to fetch documents from Supabase:', e);
    }
    return initialCompanyDocuments;
  },

  saveDocuments: async (docs: CompanyDocument[]) => {
    if (!Array.isArray(docs)) return;
    try {
      const { error } = await supabase
        .from('documents')
        .upsert(toSnakeCase(docs), { onConflict: 'id' });
      if (error) console.error('❌ Sync documents to Supabase failed:', error);
    } catch (e) {
      console.error('❌ Sync documents error:', e);
    }
  },

  // ===== دوال التوافق (لم تعد تستخدم التخزين المحلي) =====
  getPendingSyncCount: (): number => 0,
  getLastSyncTime: (): string | null => null,
  clearPendingSync: (): void => { /* لا شيء */ },
  resetToDefaults: () => {
    // يمكنك إضافة منطق لحذف البيانات من Supabase هنا إذا أردت
    console.warn('⚠️ Reset to defaults is not implemented for Supabase yet');
  }
};