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

// مفاتيح التخزين المحلي للنسخ الاحتياطي
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
  PENDING_SYNC: 'fleet_pending_sync_count',
  LAST_SYNC_TIME: 'fleet_last_sync_time',
};

// دوال تحويل بين snake_case و camelCase
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

  // ===== ACTIVE COMPANY ID =====
  getActiveCompanyId: (): string => localStorage.getItem(KEYS.ACTIVE_COMPANY_ID) || 'comp-1',
  setActiveCompanyId: (id: string) => localStorage.setItem(KEYS.ACTIVE_COMPANY_ID, id),

  // ============================================================
  // دوال مساعدة للحصول على البيانات من Supabase مع fallback آمن
  // ============================================================
  async _fetchTable<T>(table: string, key: string, initialData: T[]): Promise<T[]> {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) {
        const camelData = toCamelCase(data);
        localStorage.setItem(key, JSON.stringify(camelData));
        return camelData;
      }
      // إذا كانت فارغة، نحاول حفظ البيانات الأولية (للمرة الأولى)
      await this._saveTable(table, initialData);
      return initialData;
    } catch (e) {
      console.error(`❌ Failed to fetch ${table}:`, e);
      // في حالة الفشل، نرجع من localStorage كنسخة احتياطية
      const local = localStorage.getItem(key);
      if (local) {
        try { return JSON.parse(local); } catch { return initialData; }
      }
      return initialData;
    }
  },

  async _saveTable(table: string, records: any[]): Promise<void> {
    if (!Array.isArray(records) || records.length === 0) return;
    try {
      const { error } = await supabase
        .from(table)
        .upsert(toSnakeCase(records), { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });
      if (error) throw error;
      // تحديث localStorage للنسخ الاحتياطي
      const key = Object.keys(KEYS).find(k => k.toLowerCase().includes(table)) as keyof typeof KEYS;
      if (key) localStorage.setItem(KEYS[key], JSON.stringify(records));
    } catch (e) {
      console.error(`❌ Failed to save ${table}:`, e);
      throw new Error(`فشل حفظ البيانات في جدول ${table}`);
    }
  },

  // ============================================================
  // COMPANIES
  // ============================================================
  getCompanies: () => storage._fetchTable<Company>('companies', KEYS.COMPANIES, initialCompanies),
  saveCompanies: (companies: Company[]) => storage._saveTable('companies', companies),

  // ============================================================
  // VEHICLES
  // ============================================================
  getVehicles: () => storage._fetchTable<Vehicle>('vehicles', KEYS.VEHICLES, initialVehicles),
  saveVehicles: async (vehicles: Vehicle[]) => {
    const activeCompanyId = storage.getActiveCompanyId();
    const withCompany = vehicles.map(v => ({ ...v, companyId: v.companyId || activeCompanyId }));
    await storage._saveTable('vehicles', withCompany);
  },
  deleteVehicle: async (id: string) => {
    try {
      const { error } = await supabase.from('vehicles').delete().eq('id', id);
      if (error) throw error;
      await storage.saveAuditLog('vehicles', 'delete', { id });
    } catch (e) {
      console.error('❌ Failed to delete vehicle:', e);
      throw new Error('فشل حذف السيارة');
    }
  },

  // ============================================================
  // DRIVERS
  // ============================================================
  getDrivers: () => storage._fetchTable<Driver>('drivers', KEYS.DRIVERS, initialDrivers),
  saveDrivers: async (drivers: Driver[]) => {
    const activeCompanyId = storage.getActiveCompanyId();
    const withCompany = drivers.map(d => ({ ...d, companyId: d.companyId || activeCompanyId }));
    await storage._saveTable('drivers', withCompany);
  },
  deleteDriver: async (id: string) => {
    try {
      const { error } = await supabase.from('drivers').delete().eq('id', id);
      if (error) throw error;
      await storage.saveAuditLog('drivers', 'delete', { id });
    } catch (e) {
      console.error('❌ Failed to delete driver:', e);
      throw new Error('فشل حذف السائق');
    }
  },

  // ============================================================
  // GARAGES
  // ============================================================
  getGarages: () => storage._fetchTable<Garage>('garages', KEYS.GARAGES, initialGarages),
  saveGarages: async (garages: Garage[]) => {
    const activeCompanyId = storage.getActiveCompanyId();
    const withCompany = garages.map(g => ({ ...g, companyId: g.companyId || activeCompanyId }));
    await storage._saveTable('garages', withCompany);
  },
  deleteGarage: async (id: string) => {
    try {
      const { error } = await supabase.from('garages').delete().eq('id', id);
      if (error) throw error;
      await storage.saveAuditLog('garages', 'delete', { id });
    } catch (e) {
      console.error('❌ Failed to delete garage:', e);
      throw new Error('فشل حذف الكراج');
    }
  },

  // ============================================================
  // MAINTENANCE RECORDS
  // ============================================================
  getMaintenanceRecords: () => storage._fetchTable<MaintenanceRecord>('maintenance_records', KEYS.MAINTENANCE, initialMaintenanceRecords),
  saveMaintenanceRecords: async (records: MaintenanceRecord[]) => {
    const activeCompanyId = storage.getActiveCompanyId();
    const withCompany = records.map(r => ({ ...r, companyId: r.companyId || activeCompanyId }));
    await storage._saveTable('maintenance_records', withCompany);
  },
  deleteMaintenanceRecord: async (id: string) => {
    try {
      const { error } = await supabase.from('maintenance_records').delete().eq('id', id);
      if (error) throw error;
      await storage.saveAuditLog('maintenance_records', 'delete', { id });
    } catch (e) {
      console.error('❌ Failed to delete maintenance record:', e);
      throw new Error('فشل حذف سجل الصيانة');
    }
  },

  // ============================================================
  // FUEL RECORDS
  // ============================================================
  getFuelRecords: () => storage._fetchTable<FuelRecord>('fuel_records', KEYS.FUEL, initialFuelRecords),
  saveFuelRecords: async (records: FuelRecord[]) => {
    const activeCompanyId = storage.getActiveCompanyId();
    const withCompany = records.map(r => ({ ...r, companyId: r.companyId || activeCompanyId }));
    await storage._saveTable('fuel_records', withCompany);
  },
  deleteFuelRecord: async (id: string) => {
    try {
      const { error } = await supabase.from('fuel_records').delete().eq('id', id);
      if (error) throw error;
      await storage.saveAuditLog('fuel_records', 'delete', { id });
    } catch (e) {
      console.error('❌ Failed to delete fuel record:', e);
      throw new Error('فشل حذف سجل الوقود');
    }
  },

  // ============================================================
  // EXPENSE RECORDS
  // ============================================================
  getExpenseRecords: () => storage._fetchTable<ExpenseRecord>('expenses', KEYS.EXPENSES, initialExpenseRecords),
  saveExpenseRecords: async (records: ExpenseRecord[]) => {
    const activeCompanyId = storage.getActiveCompanyId();
    const withCompany = records.map(r => ({ ...r, companyId: r.companyId || activeCompanyId }));
    await storage._saveTable('expenses', withCompany);
  },
  deleteExpenseRecord: async (id: string) => {
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      await storage.saveAuditLog('expenses', 'delete', { id });
    } catch (e) {
      console.error('❌ Failed to delete expense record:', e);
      throw new Error('فشل حذف سجل المصروف');
    }
  },

  // ============================================================
  // CHECKOUT SESSIONS
  // ============================================================
  getCheckoutSessions: () => storage._fetchTable<CheckoutSession>('checkout_sessions', KEYS.CHECKOUTS, initialCheckoutSessions),
  saveCheckoutSessions: async (sessions: CheckoutSession[]) => {
    const activeCompanyId = storage.getActiveCompanyId();
    const withCompany = sessions.map(s => ({ ...s, companyId: s.companyId || activeCompanyId }));
    await storage._saveTable('checkout_sessions', withCompany);
  },
  deleteCheckoutSession: async (id: string) => {
    try {
      const { error } = await supabase.from('checkout_sessions').delete().eq('id', id);
      if (error) throw error;
      await storage.saveAuditLog('checkout_sessions', 'delete', { id });
    } catch (e) {
      console.error('❌ Failed to delete checkout session:', e);
      throw new Error('فشل حذف جلسة الاستلام');
    }
  },

  // ============================================================
  // SETTINGS
  // ============================================================
  getSettings: (): CompanySettings => {
    const local = localStorage.getItem(KEYS.SETTINGS);
    if (local) {
      try { return JSON.parse(local); } catch { /* ignore */ }
    }
    return initialCompanySettings;
  },
  saveSettings: (settings: CompanySettings) => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  // ============================================================
  // DOCUMENTS
  // ============================================================
  getDocuments: () => storage._fetchTable<CompanyDocument>('documents', KEYS.DOCUMENTS, initialCompanyDocuments),
  saveDocuments: async (docs: CompanyDocument[]) => {
    const activeCompanyId = storage.getActiveCompanyId();
    const withCompany = docs.map(d => ({ ...d, companyId: d.companyId || activeCompanyId }));
    await storage._saveTable('documents', withCompany);
  },
  deleteDocument: async (id: string) => {
    try {
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (error) throw error;
      await storage.saveAuditLog('documents', 'delete', { id });
    } catch (e) {
      console.error('❌ Failed to delete document:', e);
      throw new Error('فشل حذف المستند');
    }
  },

  // ============================================================
  // AUDIT LOG
  // ============================================================
  saveAuditLog: async (table: string, action: string, data: any) => {
    try {
      const userId = localStorage.getItem('fleet_user_id') || 'system';
      const userEmail = localStorage.getItem('fleet_user_email') || 'system@yamanix.com';
      const logEntry = {
        user_id: userId,
        user_email: userEmail,
        table_name: table,
        action: action,
        data: data,
        created_at: new Date().toISOString()
      };
      const { error } = await supabase
        .from('audit_log')
        .insert([logEntry]);
      if (error) {
        console.error('❌ Failed to save audit log:', error);
        // حفظ محلياً كنسخة احتياطية
        const localLogs = JSON.parse(localStorage.getItem('fleet_audit_logs') || '[]');
        localLogs.push(logEntry);
        localStorage.setItem('fleet_audit_logs', JSON.stringify(localLogs.slice(-1000)));
      }
    } catch (e) {
      console.error('❌ Audit log error:', e);
    }
  },

  getAuditLogs: async (): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (!error && data) return data;
    } catch (e) {
      console.warn('Failed to fetch audit logs from Supabase:', e);
    }
    return JSON.parse(localStorage.getItem('fleet_audit_logs') || '[]');
  },

  // ============================================================
  // دوال المزامنة (لـ OfflineSyncBadge)
  // ============================================================
  getPendingSyncCount: (): number => {
    try {
      return parseInt(localStorage.getItem(KEYS.PENDING_SYNC) || '0', 10);
    } catch {
      return 0;
    }
  },
  getLastSyncTime: (): string | null => localStorage.getItem(KEYS.LAST_SYNC_TIME),
  clearPendingSync: (): void => {
    localStorage.setItem(KEYS.PENDING_SYNC, '0');
    localStorage.setItem(KEYS.LAST_SYNC_TIME, new Date().toISOString());
  },

  // ============================================================
  // إعادة تعيين البيانات
  // ============================================================
  resetToDefaults: () => {
    localStorage.clear();
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
    localStorage.setItem(KEYS.ACTIVE_COMPANY_ID, 'comp-1');
    window.location.reload();
  }
};