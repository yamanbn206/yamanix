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

export const storage = {
  getCompanies: (): Company[] => getItem(KEYS.COMPANIES, initialCompanies),
  saveCompanies: (companies: Company[]) => setItem(KEYS.COMPANIES, companies),

  getActiveCompanyId: (): string => getItem(KEYS.ACTIVE_COMPANY_ID, 'comp-1'),
  setActiveCompanyId: (id: string) => setItem(KEYS.ACTIVE_COMPANY_ID, id),

  getVehicles: (): Vehicle[] => getItem(KEYS.VEHICLES, initialVehicles),
  saveVehicles: (vehicles: Vehicle[]) => setItem(KEYS.VEHICLES, vehicles),

  getDrivers: (): Driver[] => getItem(KEYS.DRIVERS, initialDrivers),
  saveDrivers: (drivers: Driver[]) => setItem(KEYS.DRIVERS, drivers),

  getGarages: (): Garage[] => getItem(KEYS.GARAGES, initialGarages),
  saveGarages: (garages: Garage[]) => setItem(KEYS.GARAGES, garages),

  getMaintenanceRecords: (): MaintenanceRecord[] => getItem(KEYS.MAINTENANCE, initialMaintenanceRecords),
  saveMaintenanceRecords: (records: MaintenanceRecord[]) => setItem(KEYS.MAINTENANCE, records),

  getFuelRecords: (): FuelRecord[] => getItem(KEYS.FUEL, initialFuelRecords),
  saveFuelRecords: (records: FuelRecord[]) => setItem(KEYS.FUEL, records),

  getExpenseRecords: (): ExpenseRecord[] => getItem(KEYS.EXPENSES, initialExpenseRecords),
  saveExpenseRecords: (records: ExpenseRecord[]) => setItem(KEYS.EXPENSES, records),

  getCheckoutSessions: (): CheckoutSession[] => getItem(KEYS.CHECKOUTS, initialCheckoutSessions),
  saveCheckoutSessions: (sessions: CheckoutSession[]) => setItem(KEYS.CHECKOUTS, sessions),

  getSettings: (): CompanySettings => {
    const s = getItem(KEYS.SETTINGS, initialCompanySettings);
    if (!s.companyName || s.companyName.includes('شركة المسار اللوجستية')) {
      s.companyName = 'YAMANIX';
    }
    return s;
  },
  saveSettings: (settings: CompanySettings) => setItem(KEYS.SETTINGS, settings),

  getDocuments: (): CompanyDocument[] => getItem(KEYS.DOCUMENTS, initialCompanyDocuments),
  saveDocuments: (docs: CompanyDocument[]) => setItem(KEYS.DOCUMENTS, docs),

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
