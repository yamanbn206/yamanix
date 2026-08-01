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
  PENDING_SYNC: 'fleet_pending_sync_count', // مفتاح التزامن
  LAST_SYNC_TIME: 'fleet_last_sync_time',
};

// ============================================================
// دوال مساعدة
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
// كائن التخزين الرئيسي
// ============================================================
export const storage = {

  // ===== ACTIVE COMPANY ID =====
  getActiveCompanyId: (): string => localStorage.getItem(KEYS.ACTIVE_COMPANY_ID) || 'comp-1',
  setActiveCompanyId: (id: string) => localStorage.setItem(KEYS.ACTIVE_COMPANY_ID, id),

  // ============================================================
  // COMPANIES
  // ============================================================
  getCompanies: async (): Promise<Company[]> => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) {
        const camelData = toCamelCase(data);
        localStorage.setItem(KEYS.COMPANIES, JSON.stringify(camelData));
        return camelData;
      }
      // إذا كانت فارغة، استخدم البيانات الأولية
      await storage.saveCompanies(initialCompanies);
      return initialCompanies;
    } catch (e) {
      console.error('❌ Failed to fetch companies:', e);
      const local = localStorage.getItem(KEYS.COMPANIES);
      if (local) {
        try { return JSON.parse(local); } catch { return initialCompanies; }
      }
      return initialCompanies;
    }
  },

  saveCompanies: async (companies: Company[]) => {
    if (!Array.isArray(companies)) return;
    try {
      const { error } = await supabase
        .from('companies')
        .upsert(toSnakeCase(companies), { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });
      if (error) throw error;
      localStorage.setItem(KEYS.COMPANIES, JSON.stringify(companies));
    } catch (e) {
      console.error('❌ Failed to save companies:', e);
      throw new Error('فشل حفظ الشركات في قاعدة البيانات');
    }
  },

  // ============================================================
  // VEHICLES
  // ============================================================
  getVehicles: async (): Promise<Vehicle[]> => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) {
        const camelData = toCamelCase(data);
        localStorage.setItem(KEYS.VEHICLES, JSON.stringify(camelData));
        return camelData;
      }
      await storage.saveVehicles(initialVehicles);
      return initialVehicles;
    } catch (e) {
      console.error('❌ Failed to fetch vehicles:', e);
      const local = localStorage.getItem(KEYS.VEHICLES);
      if (local) {
        try { return JSON.parse(local); } catch { return initialVehicles; }
      }
      return initialVehicles;
    }
  },

  saveVehicles: async (vehicles: Vehicle[]) => {
    if (!Array.isArray(vehicles)) return;
    const activeCompanyId = storage.getActiveCompanyId();
    const vehiclesWithCompany = vehicles.map(v => ({
      ...v,
      companyId: v.companyId || activeCompanyId
    }));
    try {
      const { error } = await supabase
        .from('vehicles')
        .upsert(toSnakeCase(vehiclesWithCompany), { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });
      if (error) throw error;
      localStorage.setItem(KEYS.VEHICLES, JSON.stringify(vehiclesWithCompany));
      await storage.saveAuditLog('vehicles', 'save', { count: vehiclesWithCompany.length });
    } catch (e) {
      console.error('❌ Failed to save vehicles:', e);
      throw new Error('فشل حفظ السيارات في قاعدة البيانات');
    }
  },

  deleteVehicle: async (id: string) => {
    try {
      const { error } = await supabase.from('vehicles').delete().eq('id', id);
      if (error) throw error;
      await storage.saveAuditLog('vehicles', 'delete', { id });
    } catch (e) {
      console.error('❌ Failed to delete vehicle:', e);
      throw new Error('فشل حذف السيارة من قاعدة البيانات');
    }
  },

  // ============================================================
  // DRIVERS
  // ============================================================
  getDrivers: async (): Promise<Driver[]> => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) {
        const camelData = toCamelCase(data);
        localStorage.setItem(KEYS.DRIVERS, JSON.stringify(camelData));
        return camelData;
      }
      await storage.saveDrivers(initialDrivers);
      return initialDrivers;
    } catch (e) {
      console.error('❌ Failed to fetch drivers:', e);
      const local = localStorage.getItem(KEYS.DRIVERS);
      if (local) {
        try { return JSON.parse(local); } catch { return initialDrivers; }
      }
      return initialDrivers;
    }
  },

  saveDrivers: async (drivers: Driver[]) => {
    if (!Array.isArray(drivers)) return;
    const activeCompanyId = storage.getActiveCompanyId();
    const driversWithCompany = drivers.map(d => ({
      ...d,
      companyId: d.companyId || activeCompanyId
    }));
    try {
      const { error } = await supabase
        .from('drivers')
        .upsert(toSnakeCase(driversWithCompany), { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });
      if (error) throw error;
      localStorage.setItem(KEYS.DRIVERS, JSON.stringify(driversWithCompany));
      await storage.saveAuditLog('drivers', 'save', { count: driversWithCompany.length });
    } catch (e) {
      console.error('❌ Failed to save drivers:', e);
      throw new Error('فشل حفظ السائقين في قاعدة البيانات');
    }
  },

  deleteDriver: async (id: string) => {
    try {
      const { error } = await supabase.from('drivers').delete().eq('id', id);
      if (error) throw error;
      await storage.saveAuditLog('drivers', 'delete', { id });
    } catch (e) {
      console.error('❌ Failed to delete driver:', e);
      throw new Error('فشل حذف السائق من قاعدة البيانات');
    }
  },

  // ============================================================
  // GARAGES
  // ============================================================
  getGarages: async (): Promise<Garage[]> => {
    try {
      const { data, error } = await supabase
        .from('garages')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) {
        const camelData = toCamelCase(data);
        localStorage.setItem(KEYS.GARAGES, JSON.stringify(camelData));
        return camelData;
      }
      await storage.saveGarages(initialGarages);
      return initialGarages;
    } catch (e) {
      console.error('❌ Failed to fetch garages:', e);
      const local = localStorage.getItem(KEYS.GARAGES);
      if (local) {
        try { return JSON.parse(local); } catch { return initialGarages; }
      }
      return initialGarages;
    }
  },

  saveGarages: async (garages: Garage[]) => {
    if (!Array.isArray(garages)) return;
    const activeCompanyId = storage.getActiveCompanyId();
    const garagesWithCompany = garages.map(g => ({
      ...g,
      companyId: g.companyId || activeCompanyId
    }));
    try {
      const { error } = await supabase
        .from('garages')
        .upsert(toSnakeCase(garagesWithCompany), { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });
      if (error) throw error;
      localStorage.setItem(KEYS.GARAGES, JSON.stringify(garagesWithCompany));
      await storage.saveAuditLog('garages', 'save', { count: garagesWithCompany.length });
    } catch (e) {
      console.error('❌ Failed to save garages:', e);
      throw new Error('فشل حفظ الكراجات في قاعدة البيانات');
    }
  },

  deleteGarage: async (id: string) => {
    try {
      const { error } = await supabase.from('garages').delete().eq('id', id);
      if (error) throw error;
      await storage.saveAuditLog('garages', 'delete', { id });
    } catch (e) {
      console.error('❌ Failed to delete garage:', e);
      throw new Error('فشل حذف الكراج من قاعدة البيانات');
    }
  },

  // ============================================================
  // MAINTENANCE RECORDS
  // ============================================================
  getMaintenanceRecords: async (): Promise<MaintenanceRecord[]> => {
    try {
      const { data, error } = await supabase
        .from('maintenance_records')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) {
        const camelData = toCamelCase(data);
        localStorage.setItem(KEYS.MAINTENANCE, JSON.stringify(camelData));
        return camelData;
      }
      await storage.saveMaintenanceRecords(initialMaintenanceRecords);
      return initialMaintenanceRecords;
    } catch (e) {
      console.error('❌ Failed to fetch maintenance records:', e);
      const local = localStorage.getItem(KEYS.MAINTENANCE);
      if (local) {
        try { return JSON.parse(local); } catch { return initialMaintenanceRecords; }
      }
      return initialMaintenanceRecords;
    }
  },

  saveMaintenanceRecords: async (records: MaintenanceRecord[]) => {
    if (!Array.isArray(records)) return;
    const activeCompanyId = storage.getActiveCompanyId();
    const recordsWithCompany = records.map(r => ({
      ...r,
      companyId: r.companyId || activeCompanyId
    }));
    try {
      const { error } = await supabase
        .from('maintenance_records')
        .upsert(toSnakeCase(recordsWithCompany), { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });
      if (error) throw error;
      localStorage.setItem(KEYS.MAINTENANCE, JSON.stringify(recordsWithCompany));
      await storage.saveAuditLog('maintenance_records', 'save', { count: recordsWithCompany.length });
    } catch (e) {
      console.error('❌ Failed to save maintenance records:', e);
      throw new Error('فشل حفظ سجلات الصيانة في قاعدة البيانات');
    }
  },

  deleteMaintenanceRecord: async (id: string) => {
    try {
      const { error } = await supabase.from('maintenance_records').delete().eq('id', id);
      if (error) throw error;
      await storage.saveAuditLog('maintenance_records', 'delete', { id });
    } catch (e) {
      console.error('❌ Failed to delete maintenance record:', e);
      throw new Error('فشل حذف سجل الصيانة من قاعدة البيانات');
    }
  },

  // ============================================================
  // FUEL RECORDS
  // ============================================================
  getFuelRecords: async (): Promise<FuelRecord[]> => {
    try {
      const { data, error } = await supabase
        .from('fuel_records')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) {
        const camelData = toCamelCase(data);
        localStorage.setItem(KEYS.FUEL, JSON.stringify(camelData));
        return camelData;
      }
      await storage.saveFuelRecords(initialFuelRecords);
      return initialFuelRecords;
    } catch (e) {
      console.error('❌ Failed to fetch fuel records:', e);
      const local = localStorage.getItem(KEYS.FUEL);
      if (local) {
        try { return JSON.parse(local); } catch { return initialFuelRecords; }
      }
      return initialFuelRecords;
    }
  },

  saveFuelRecords: async (records: FuelRecord[]) => {
    if (!Array.isArray(records)) return;
    const activeCompanyId = storage.getActiveCompanyId();
    const recordsWithCompany = records.map(r => ({
      ...r,
      companyId: r.companyId || activeCompanyId
    }));
    try {
      const { error } = await supabase
        .from('fuel_records')
        .upsert(toSnakeCase(recordsWithCompany), { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });
      if (error) throw error;
      localStorage.setItem(KEYS.FUEL, JSON.stringify(recordsWithCompany));
      await storage.saveAuditLog('fuel_records', 'save', { count: recordsWithCompany.length });
    } catch (e) {
      console.error('❌ Failed to save fuel records:', e);
      throw new Error('فشل حفظ سجلات الوقود في قاعدة البيانات');
    }
  },

  deleteFuelRecord: async (id: string) => {
    try {
      const { error } = await supabase.from('fuel_records').delete().eq('id', id);
      if (error) throw error;
      await storage.saveAuditLog('fuel_records', 'delete', { id });
    } catch (e) {
      console.error('❌ Failed to delete fuel record:', e);
      throw new Error('فشل حذف سجل الوقود من قاعدة البيانات');
    }
  },

  // ============================================================
  // EXPENSE RECORDS
  // ============================================================
  getExpenseRecords: async (): Promise<ExpenseRecord[]> => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) {
        const camelData = toCamelCase(data);
        localStorage.setItem(KEYS.EXPENSES, JSON.stringify(camelData));
        return camelData;
      }
      await storage.saveExpenseRecords(initialExpenseRecords);
      return initialExpenseRecords;
    } catch (e) {
      console.error('❌ Failed to fetch expense records:', e);
      const local = localStorage.getItem(KEYS.EXPENSES);
      if (local) {
        try { return JSON.parse(local); } catch { return initialExpenseRecords; }
      }
      return initialExpenseRecords;
    }
  },

  saveExpenseRecords: async (records: ExpenseRecord[]) => {
    if (!Array.isArray(records)) return;
    const activeCompanyId = storage.getActiveCompanyId();
    const recordsWithCompany = records.map(r => ({
      ...r,
      companyId: r.companyId || activeCompanyId
    }));
    try {
      const { error } = await supabase
        .from('expenses')
        .upsert(toSnakeCase(recordsWithCompany), { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });
      if (error) throw error;
      localStorage.setItem(KEYS.EXPENSES, JSON.stringify(recordsWithCompany));
      await storage.saveAuditLog('expenses', 'save', { count: recordsWithCompany.length });
    } catch (e) {
      console.error('❌ Failed to save expense records:', e);
      throw new Error('فشل حفظ سجلات المصاريف في قاعدة البيانات');
    }
  },

  deleteExpenseRecord: async (id: string) => {
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      await storage.saveAuditLog('expenses', 'delete', { id });
    } catch (e) {
      console.error('❌ Failed to delete expense record:', e);
      throw new Error('فشل حذف سجل المصروف من قاعدة البيانات');
    }
  },

  // ============================================================
  // CHECKOUT SESSIONS
  // ============================================================
  getCheckoutSessions: async (): Promise<CheckoutSession[]> => {
    try {
      const { data, error } = await supabase
        .from('checkout_sessions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) {
        const camelData = toCamelCase(data);
        localStorage.setItem(KEYS.CHECKOUTS, JSON.stringify(camelData));
        return camelData;
      }
      await storage.saveCheckoutSessions(initialCheckoutSessions);
      return initialCheckoutSessions;
    } catch (e) {
      console.error('❌ Failed to fetch checkout sessions:', e);
      const local = localStorage.getItem(KEYS.CHECKOUTS);
      if (local) {
        try { return JSON.parse(local); } catch { return initialCheckoutSessions; }
      }
      return initialCheckoutSessions;
    }
  },

  saveCheckoutSessions: async (sessions: CheckoutSession[]) => {
    if (!Array.isArray(sessions)) return;
    const activeCompanyId = storage.getActiveCompanyId();
    const sessionsWithCompany = sessions.map(s => ({
      ...s,
      companyId: s.companyId || activeCompanyId
    }));
    try {
      const { error } = await supabase
        .from('checkout_sessions')
        .upsert(toSnakeCase(sessionsWithCompany), { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });
      if (error) throw error;
      localStorage.setItem(KEYS.CHECKOUTS, JSON.stringify(sessionsWithCompany));
      await storage.saveAuditLog('checkout_sessions', 'save', { count: sessionsWithCompany.length });
    } catch (e) {
      console.error('❌ Failed to save checkout sessions:', e);
      throw new Error('فشل حفظ جلسات الاستلام في قاعدة البيانات');
    }
  },

  deleteCheckoutSession: async (id: string) => {
    try {
      const { error } = await supabase.from('checkout_sessions').delete().eq('id', id);
      if (error) throw error;
      await storage.saveAuditLog('checkout_sessions', 'delete', { id });
    } catch (e) {
      console.error('❌ Failed to delete checkout session:', e);
      throw new Error('فشل حذف جلسة الاستلام من قاعدة البيانات');
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
  getDocuments: async (): Promise<CompanyDocument[]> => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) {
        const camelData = toCamelCase(data);
        localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(camelData));
        return camelData;
      }
      await storage.saveDocuments(initialCompanyDocuments);
      return initialCompanyDocuments;
    } catch (e) {
      console.error('❌ Failed to fetch documents:', e);
      const local = localStorage.getItem(KEYS.DOCUMENTS);
      if (local) {
        try { return JSON.parse(local); } catch { return initialCompanyDocuments; }
      }
      return initialCompanyDocuments;
    }
  },

  saveDocuments: async (docs: CompanyDocument[]) => {
    if (!Array.isArray(docs)) return;
    const activeCompanyId = storage.getActiveCompanyId();
    const docsWithCompany = docs.map(d => ({
      ...d,
      companyId: d.companyId || activeCompanyId
    }));
    try {
      const { error } = await supabase
        .from('documents')
        .upsert(toSnakeCase(docsWithCompany), { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });
      if (error) throw error;
      localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(docsWithCompany));
      await storage.saveAuditLog('documents', 'save', { count: docsWithCompany.length });
    } catch (e) {
      console.error('❌ Failed to save documents:', e);
      throw new Error('فشل حفظ المستندات في قاعدة البيانات');
    }
  },

  deleteDocument: async (id: string) => {
    try {
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (error) throw error;
      await storage.saveAuditLog('documents', 'delete', { id });
    } catch (e) {
      console.error('❌ Failed to delete document:', e);
      throw new Error('فشل حذف المستند من قاعدة البيانات');
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
  // 🟢 دوال المزامنة المفقودة (تم إضافتها هنا)
  // ============================================================
  getPendingSyncCount: (): number => {
    try {
      const val = localStorage.getItem(KEYS.PENDING_SYNC);
      return val ? parseInt(val, 10) : 0;
    } catch {
      return 0;
    }
  },

  getLastSyncTime: (): string | null => {
    return localStorage.getItem(KEYS.LAST_SYNC_TIME);
  },

  clearPendingSync: (): void => {
    localStorage.setItem(KEYS.PENDING_SYNC, '0');
    localStorage.setItem(KEYS.LAST_SYNC_TIME, new Date().toISOString());
  },

  // ============================================================
  // إعادة تعيين البيانات إلى الوضع الافتراضي
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