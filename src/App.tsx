import React, { useState, useEffect, useMemo } from 'react';
import { 
  Vehicle, 
  Driver, 
  Garage, 
  MaintenanceRecord, 
  FuelRecord, 
  ExpenseRecord, 
  CheckoutSession, 
  CompanySettings,
  CompanyDocument,
  Company,
  Profile
} from './types';
import { storage } from './lib/storage';
import { supabase } from './lib/supabase';
import { Language, t } from './lib/i18n';

// Components
import { DashboardView } from './components/DashboardView';
import { VehiclesView } from './components/VehiclesView';
import { DriversView } from './components/DriversView';
import { CheckoutHub } from './components/CheckoutHub';
import { MaintenanceView } from './components/MaintenanceView';
import { FuelExpensesView } from './components/FuelExpensesView';
import { ExpiriesView } from './components/ExpiriesView';
import { PrintReportsView } from './components/PrintReportsView';
import { AIFleetAdvisor } from './components/AIFleetAdvisor';
import { CompanySettingsView } from './components/CompanySettingsView';
import { CompanySwitcher } from './components/CompanySwitcher';
import { ToastNotifications, ToastRefHandler } from './components/ToastNotifications';
import { OfflineSyncBadge } from './components/OfflineSyncBadge';
import { LoginScreen } from './components/LoginScreen';
import { UserManagement } from './components/UserManagement';
import { AuditLogView } from './components/AuditLogView';

import { 
  Car, Users, KeyRound, Wrench, Fuel, ShieldAlert, Printer, Sparkles, 
  Building2, LayoutDashboard, Moon, Sun, Menu, X, Bell, Languages, 
  UserCog, Shield, LogOut, History
} from 'lucide-react';

const DEFAULT_LOGO_URL = '/yamanix-logo.png';

export default function App() {
  // ===== اللغة =====
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('fleet_language') as Language;
    return saved || 'en';
  });
  const isAr = lang === 'ar';

  // ===== التنقل =====
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState<boolean>(false);
  const toastRef = React.useRef<ToastRefHandler>(null);

  // ===== المصادقة =====
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // ===== بيانات التطبيق =====
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompanyId, setActiveCompanyIdState] = useState<string | null>(() => {
    const saved = localStorage.getItem('fleet_active_company');
    return saved && saved !== 'all' ? saved : null;
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [garages, setGarages] = useState<Garage[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [fuel, setFuel] = useState<FuelRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [checkouts, setCheckouts] = useState<CheckoutSession[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(() => storage.getSettings());
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [receiptSession, setReceiptSession] = useState<CheckoutSession | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // ============================================================
  // 1. حفظ اللغة
  // ============================================================
  useEffect(() => {
    localStorage.setItem('fleet_language', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // ============================================================
  // 2. جلسة المستخدم
  // ============================================================
  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Session error:', error);
          if (error.status === 400) {
            localStorage.removeItem('fleet_active_company');
            localStorage.removeItem('fleet_user_id');
            localStorage.removeItem('fleet_user_email');
            setSession(null);
            setProfile(null);
            setLoading(false);
            return;
          }
        }
        setSession(session);
        if (session) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setProfile(profileData);
        }
        setLoading(false);
      } catch (err) {
        console.error('Session error:', err);
        setLoading(false);
      }
    };
    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => setProfile(data));
      } else {
        setProfile(null);
      }
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  // ============================================================
  // 3. حفظ بيانات المستخدم في localStorage
  // ============================================================
  useEffect(() => {
    if (session?.user) {
      localStorage.setItem('fleet_user_id', session.user.id);
      localStorage.setItem('fleet_user_email', session.user.email || '');
    }
  }, [session]);

  // ============================================================
  // 4. تحميل البيانات من Supabase (مع إصلاح isDataLoading)
  // ============================================================
  useEffect(() => {
    if (!session) {
      setIsDataLoading(false); // ✅ حل مشكلة التحميل العالق
      return;
    }

    const loadData = async () => {
      try {
        setIsDataLoading(true);
        const [companiesData, vehiclesData, driversData, garagesData, maintenanceData, fuelData, expensesData, checkoutsData, documentsData] = await Promise.all([
          storage.getCompanies(),
          storage.getVehicles(),
          storage.getDrivers(),
          storage.getGarages(),
          storage.getMaintenanceRecords(),
          storage.getFuelRecords(),
          storage.getExpenseRecords(),
          storage.getCheckoutSessions(),
          storage.getDocuments()
        ]);

        setCompanies(Array.isArray(companiesData) ? companiesData : []);
        setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
        setDrivers(Array.isArray(driversData) ? driversData : []);
        setGarages(Array.isArray(garagesData) ? garagesData : []);
        setMaintenance(Array.isArray(maintenanceData) ? maintenanceData : []);
        setFuel(Array.isArray(fuelData) ? fuelData : []);
        setExpenses(Array.isArray(expensesData) ? expensesData : []);
        setCheckouts(Array.isArray(checkoutsData) ? checkoutsData : []);
        setDocuments(Array.isArray(documentsData) ? documentsData : []);
        setIsDataLoading(false);
      } catch (error) {
        console.error('Failed to load data from Supabase:', error);
        // محاولة تحميل من localStorage كنسخة احتياطية
        try {
          const localVehicles = JSON.parse(localStorage.getItem('fleet_app_vehicles_v1') || '[]');
          const localDrivers = JSON.parse(localStorage.getItem('fleet_app_drivers_v1') || '[]');
          const localMaintenance = JSON.parse(localStorage.getItem('fleet_app_maintenance_v1') || '[]');
          const localCheckouts = JSON.parse(localStorage.getItem('fleet_app_checkouts_v1') || '[]');
          if (localVehicles.length > 0) setVehicles(localVehicles);
          if (localDrivers.length > 0) setDrivers(localDrivers);
          if (localMaintenance.length > 0) setMaintenance(localMaintenance);
          if (localCheckouts.length > 0) setCheckouts(localCheckouts);
        } catch (e) {
          console.error('Failed to load from localStorage fallback:', e);
        }
        setIsDataLoading(false);
      }
    };
    loadData();
  }, [session]);

  // ============================================================
  // 5. تعيين الشركة الافتراضية
  // ============================================================
  useEffect(() => {
    if (companies.length > 0 && !activeCompanyId) {
      const firstId = companies[0].id;
      setActiveCompanyIdState(firstId);
      localStorage.setItem('fleet_active_company', firstId);
    }
  }, [companies, activeCompanyId]);

  // ============================================================
  // 6. استماع Realtime لتحديث checkout_sessions
  // ============================================================
  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel('checkout_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'checkout_sessions' },
        async () => {
          console.log('🔄 Checkout session changed, reloading...');
          try {
            const data = await storage.getCheckoutSessions();
            setCheckouts(data);
          } catch (err) {
            console.error('Failed to reload checkouts:', err);
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  // ============================================================
  // دوال الشركات
  // ============================================================
  const handleSelectCompany = (id: string) => {
    setActiveCompanyIdState(id);
    storage.setActiveCompanyId(id);
    localStorage.setItem('fleet_active_company', id);
  };

  const handleAddCompany = async (newComp: Company) => {
    try {
      const updated = [...companies, newComp];
      setCompanies(updated);
      await storage.saveCompanies(updated);
      if (!activeCompanyId) {
        handleSelectCompany(newComp.id);
      }
    } catch (error) {
      alert(isAr ? 'فشل إضافة الشركة' : 'Failed to add company');
    }
  };

  const handleDeleteCompany = async (compDeleteId: string) => {
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذه الشركة وجميع بياناتها؟' : 'Are you sure you want to delete this company and all its data?')) return;
    try {
      const updated = companies.filter(c => c.id !== compDeleteId);
      setCompanies(updated);
      await storage.saveCompanies(updated);
      if (activeCompanyId === compDeleteId) {
        const nextId = updated.length > 0 ? updated[0].id : null;
        if (nextId) {
          handleSelectCompany(nextId);
        } else {
          setActiveCompanyIdState(null);
          localStorage.removeItem('fleet_active_company');
        }
      }
    } catch (error) {
      alert(isAr ? 'فشل حذف الشركة' : 'Failed to delete company');
    }
  };

  // ============================================================
  // إعدادات الشركة الحالية
  // ============================================================
  const currentCompanySettings = useMemo<CompanySettings>(() => {
    if (!activeCompanyId) {
      return {
        companyName: lang === 'ar' ? 'الرجاء اختيار شركة' : 'Please select a company',
        tagline: '',
        logoUrl: DEFAULT_LOGO_URL,
        phone: '',
        email: '',
        address: '',
        commercialRegNumber: '',
        printHeaderNote: '',
        printFooterNote: '',
        currency: 'SAR'
      };
    }
    const comp = companies.find(c => c.id === activeCompanyId);
    if (comp) {
      return {
        companyId: comp.id,
        companyName: comp.name,
        tagline: comp.tagline || settings.tagline,
        logoUrl: comp.logoUrl || DEFAULT_LOGO_URL,
        phone: comp.phone || settings.phone,
        email: comp.email || settings.email,
        address: comp.address || settings.address,
        commercialRegNumber: comp.commercialRegNumber || settings.commercialRegNumber,
        printHeaderNote: settings.printHeaderNote,
        printFooterNote: settings.printFooterNote,
        currency: comp.currency || settings.currency || 'SAR'
      };
    }
    return settings;
  }, [activeCompanyId, companies, settings, lang]);

  // ============================================================
  // تصفية البيانات
  // ============================================================
  const filteredVehicles = useMemo(() => {
    if (!Array.isArray(vehicles) || !activeCompanyId) return [];
    return vehicles.filter(v => (v.companyId || 'comp-1') === activeCompanyId);
  }, [vehicles, activeCompanyId]);

  const filteredDrivers = useMemo(() => {
    if (!Array.isArray(drivers) || !activeCompanyId) return [];
    return drivers.filter(d => (d.companyId || 'comp-1') === activeCompanyId);
  }, [drivers, activeCompanyId]);

  const filteredGarages = useMemo(() => {
    if (!Array.isArray(garages) || !activeCompanyId) return [];
    return garages.filter(g => (g.companyId || 'comp-1') === activeCompanyId);
  }, [garages, activeCompanyId]);

  const filteredMaintenance = useMemo(() => {
    if (!Array.isArray(maintenance) || !activeCompanyId) return [];
    return maintenance.filter(m => (m.companyId || 'comp-1') === activeCompanyId);
  }, [maintenance, activeCompanyId]);

  const filteredFuel = useMemo(() => {
    if (!Array.isArray(fuel) || !activeCompanyId) return [];
    return fuel.filter(f => (f.companyId || 'comp-1') === activeCompanyId);
  }, [fuel, activeCompanyId]);

  const filteredExpenses = useMemo(() => {
    if (!Array.isArray(expenses) || !activeCompanyId) return [];
    return expenses.filter(e => (e.companyId || 'comp-1') === activeCompanyId);
  }, [expenses, activeCompanyId]);

  const filteredCheckouts = useMemo(() => {
    if (!Array.isArray(checkouts) || !activeCompanyId) return [];
    return checkouts.filter(c => (c.companyId || 'comp-1') === activeCompanyId);
  }, [checkouts, activeCompanyId]);

  const filteredDocuments = useMemo(() => {
    if (!Array.isArray(documents) || !activeCompanyId) return [];
    return documents.filter(doc => (doc.companyId || 'comp-1') === activeCompanyId);
  }, [documents, activeCompanyId]);

  // ============================================================
  // التنبيهات
  // ============================================================
  const activeAlertsCount = React.useMemo(() => {
    let count = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Array.isArray(filteredVehicles)) {
      filteredVehicles.forEach(v => {
        if (v.licenseExpiryDate) {
          const d = new Date(v.licenseExpiryDate);
          d.setHours(0, 0, 0, 0);
          const days = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (days <= 30) count++;
        }
        if (v.insuranceExpiryDate) {
          const d = new Date(v.insuranceExpiryDate);
          d.setHours(0, 0, 0, 0);
          const days = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (days <= 30) count++;
        }
        if (v.nextServiceMileage && v.mileage !== undefined && v.nextServiceMileage - v.mileage <= 1000) count++;
      });
    }
    if (Array.isArray(filteredDrivers)) {
      filteredDrivers.forEach(d => {
        if (d.licenseExpiryDate) {
          const date = new Date(d.licenseExpiryDate);
          date.setHours(0, 0, 0, 0);
          const days = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (days <= 30) count++;
        }
      });
    }
    return count;
  }, [filteredVehicles, filteredDrivers]);

  // ============================================================
  // دوال الصلاحيات
  // ============================================================
  const getCurrentUserId = () => session?.user?.id;

  const hasPermission = (module: string, action: string = 'view') => {
    if (!profile) return true;
    if (profile?.role === 'admin') return true;
    return profile?.permissions?.[module]?.[action] === true;
  };

  const showError = (message: string) => {
    alert(isAr ? `❌ خطأ: ${message}` : `❌ Error: ${message}`);
  };

  const showSuccess = (message: string) => {
    alert(isAr ? `✅ ${message}` : `✅ ${message}`);
  };

  const refreshCheckouts = async () => {
    try {
      const data = await storage.getCheckoutSessions();
      setCheckouts(data);
    } catch (err) {
      console.error('Failed to refresh checkouts:', err);
    }
  };

  // ============================================================
  // VEHICLES
  // ============================================================
  const handleSaveVehicle = async (v: Vehicle) => {
    if (!hasPermission('vehicles', 'add')) {
      showError(isAr ? 'ليس لديك صلاحية لإضافة سيارات' : 'You do not have permission to add vehicles');
      return;
    }
    try {
      const compId = v.companyId || activeCompanyId || (companies[0]?.id || 'comp-1');
      const updatedVehicle = { 
        ...v, 
        companyId: compId,
        created_by: getCurrentUserId(),
        updated_by: getCurrentUserId()
      };
      const updated = vehicles.some(existing => existing.id === v.id)
        ? vehicles.map(existing => existing.id === v.id ? updatedVehicle : existing)
        : [updatedVehicle, ...vehicles];
      setVehicles(updated);
      await storage.saveVehicles(updated);
      showSuccess(isAr ? 'تم حفظ السيارة بنجاح' : 'Vehicle saved successfully');
    } catch (error) {
      showError(isAr ? 'فشل حفظ السيارة' : 'Failed to save vehicle');
      const reloadData = await storage.getVehicles();
      setVehicles(reloadData);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!hasPermission('vehicles', 'delete')) {
      showError(isAr ? 'ليس لديك صلاحية لحذف السيارات' : 'You do not have permission to delete vehicles');
      return;
    }
    try {
      setVehicles(prev => prev.filter(v => v.id !== id));
      await storage.deleteVehicle(id);
      showSuccess(isAr ? 'تم حذف السيارة بنجاح' : 'Vehicle deleted successfully');
    } catch (error) {
      showError(isAr ? 'فشل حذف السيارة' : 'Failed to delete vehicle');
      const reloadData = await storage.getVehicles();
      setVehicles(reloadData);
    }
  };

  // ============================================================
  // DRIVERS
  // ============================================================
  const handleSaveDriver = async (d: Driver) => {
    if (!hasPermission('drivers', 'add')) {
      showError(isAr ? 'ليس لديك صلاحية لإضافة سائقين' : 'You do not have permission to add drivers');
      return;
    }
    try {
      const compId = d.companyId || activeCompanyId || (companies[0]?.id || 'comp-1');
      const updatedDriver = { 
        ...d, 
        companyId: compId,
        created_by: getCurrentUserId(),
        updated_by: getCurrentUserId()
      };
      const updated = drivers.some(existing => existing.id === d.id)
        ? drivers.map(existing => existing.id === d.id ? updatedDriver : existing)
        : [updatedDriver, ...drivers];
      setDrivers(updated);
      await storage.saveDrivers(updated);
      showSuccess(isAr ? 'تم حفظ السائق بنجاح' : 'Driver saved successfully');
    } catch (error) {
      showError(isAr ? 'فشل حفظ السائق' : 'Failed to save driver');
      const reloadData = await storage.getDrivers();
      setDrivers(reloadData);
    }
  };

  const handleDeleteDriver = async (id: string) => {
    if (!hasPermission('drivers', 'delete')) {
      showError(isAr ? 'ليس لديك صلاحية لحذف سائقين' : 'You do not have permission to delete drivers');
      return;
    }
    try {
      setDrivers(prev => prev.filter(d => d.id !== id));
      await storage.deleteDriver(id);
      showSuccess(isAr ? 'تم حذف السائق بنجاح' : 'Driver deleted successfully');
    } catch (error) {
      showError(isAr ? 'فشل حذف السائق' : 'Failed to delete driver');
      const reloadData = await storage.getDrivers();
      setDrivers(reloadData);
    }
  };

  // ============================================================
  // MAINTENANCE
  // ============================================================
  const handleSaveMaintenance = async (record: MaintenanceRecord) => {
    if (!hasPermission('maintenance', 'add')) {
      showError(isAr ? 'ليس لديك صلاحية لإضافة سجلات صيانة' : 'You do not have permission to add maintenance records');
      return;
    }
    try {
      const compId = record.companyId || activeCompanyId || (companies[0]?.id || 'comp-1');
      const updatedRecord = { ...record, companyId: compId };
      const updated = [updatedRecord, ...maintenance];
      setMaintenance(updated);
      await storage.saveMaintenanceRecords(updated);
      showSuccess(isAr ? 'تم حفظ سجل الصيانة بنجاح' : 'Maintenance record saved successfully');
    } catch (error) {
      showError(isAr ? 'فشل حفظ سجل الصيانة' : 'Failed to save maintenance record');
      const reloadData = await storage.getMaintenanceRecords();
      setMaintenance(reloadData);
    }
  };

  const handleDeleteMaintenance = async (id: string) => {
    if (!hasPermission('maintenance', 'delete')) {
      showError(isAr ? 'ليس لديك صلاحية لحذف سجلات الصيانة' : 'You do not have permission to delete maintenance records');
      return;
    }
    try {
      setMaintenance(prev => prev.filter(m => m.id !== id));
      await storage.deleteMaintenanceRecord(id);
      showSuccess(isAr ? 'تم حذف سجل الصيانة بنجاح' : 'Maintenance record deleted successfully');
    } catch (error) {
      showError(isAr ? 'فشل حذف سجل الصيانة' : 'Failed to delete maintenance record');
      const reloadData = await storage.getMaintenanceRecords();
      setMaintenance(reloadData);
    }
  };

  // ============================================================
  // GARAGES
  // ============================================================
  const handleSaveGarage = async (g: Garage) => {
    if (!hasPermission('maintenance', 'add')) {
      showError(isAr ? 'ليس لديك صلاحية لإضافة كراجات' : 'You do not have permission to add garages');
      return;
    }
    try {
      const compId = g.companyId || activeCompanyId || (companies[0]?.id || 'comp-1');
      const updatedGarage = { ...g, companyId: compId };
      const updated = [updatedGarage, ...garages];
      setGarages(updated);
      await storage.saveGarages(updated);
      showSuccess(isAr ? 'تم حفظ الكراج بنجاح' : 'Garage saved successfully');
    } catch (error) {
      showError(isAr ? 'فشل حفظ الكراج' : 'Failed to save garage');
      const reloadData = await storage.getGarages();
      setGarages(reloadData);
    }
  };

  const handleDeleteGarage = async (id: string) => {
    if (!hasPermission('maintenance', 'delete')) {
      showError(isAr ? 'ليس لديك صلاحية لحذف الكراجات' : 'You do not have permission to delete garages');
      return;
    }
    try {
      setGarages(prev => prev.filter(g => g.id !== id));
      await storage.deleteGarage(id);
      showSuccess(isAr ? 'تم حذف الكراج بنجاح' : 'Garage deleted successfully');
    } catch (error) {
      showError(isAr ? 'فشل حذف الكراج' : 'Failed to delete garage');
      const reloadData = await storage.getGarages();
      setGarages(reloadData);
    }
  };

  // ============================================================
  // FUEL
  // ============================================================
  const handleSaveFuel = async (f: FuelRecord) => {
    if (!hasPermission('fuel', 'add')) {
      showError(isAr ? 'ليس لديك صلاحية لإضافة سجلات وقود' : 'You do not have permission to add fuel records');
      return;
    }
    try {
      const compId = f.companyId || activeCompanyId || (companies[0]?.id || 'comp-1');
      const updatedFuel = { ...f, companyId: compId };
      const updated = [updatedFuel, ...fuel];
      setFuel(updated);
      await storage.saveFuelRecords(updated);
      showSuccess(isAr ? 'تم حفظ سجل الوقود بنجاح' : 'Fuel record saved successfully');
    } catch (error) {
      showError(isAr ? 'فشل حفظ سجل الوقود' : 'Failed to save fuel record');
      const reloadData = await storage.getFuelRecords();
      setFuel(reloadData);
    }
  };

  const handleDeleteFuel = async (id: string) => {
    if (!hasPermission('fuel', 'delete')) {
      showError(isAr ? 'ليس لديك صلاحية لحذف سجلات الوقود' : 'You do not have permission to delete fuel records');
      return;
    }
    try {
      setFuel(prev => prev.filter(f => f.id !== id));
      await storage.deleteFuelRecord(id);
      showSuccess(isAr ? 'تم حذف سجل الوقود بنجاح' : 'Fuel record deleted successfully');
    } catch (error) {
      showError(isAr ? 'فشل حذف سجل الوقود' : 'Failed to delete fuel record');
      const reloadData = await storage.getFuelRecords();
      setFuel(reloadData);
    }
  };

  // ============================================================
  // EXPENSES
  // ============================================================
  const handleSaveExpense = async (e: ExpenseRecord) => {
    if (!hasPermission('fuel', 'add')) {
      showError(isAr ? 'ليس لديك صلاحية لإضافة مصاريف' : 'You do not have permission to add expenses');
      return;
    }
    try {
      const compId = e.companyId || activeCompanyId || (companies[0]?.id || 'comp-1');
      const updatedExpense = { ...e, companyId: compId };
      const updated = [updatedExpense, ...expenses];
      setExpenses(updated);
      await storage.saveExpenseRecords(updated);
      showSuccess(isAr ? 'تم حفظ المصروف بنجاح' : 'Expense record saved successfully');
    } catch (error) {
      showError(isAr ? 'فشل حفظ المصروف' : 'Failed to save expense record');
      const reloadData = await storage.getExpenseRecords();
      setExpenses(reloadData);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!hasPermission('fuel', 'delete')) {
      showError(isAr ? 'ليس لديك صلاحية لحذف المصاريف' : 'You do not have permission to delete expenses');
      return;
    }
    try {
      setExpenses(prev => prev.filter(e => e.id !== id));
      await storage.deleteExpenseRecord(id);
      showSuccess(isAr ? 'تم حذف المصروف بنجاح' : 'Expense record deleted successfully');
    } catch (error) {
      showError(isAr ? 'فشل حذف المصروف' : 'Failed to delete expense record');
      const reloadData = await storage.getExpenseRecords();
      setExpenses(reloadData);
    }
  };

  // ============================================================
  // CHECKOUT
  // ============================================================
  const handleSaveCheckout = async (session: CheckoutSession) => {
    if (!hasPermission('checkout', 'add')) {
      showError(isAr ? 'ليس لديك صلاحية لإضافة جلسات استلام' : 'You do not have permission to add checkout sessions');
      return;
    }
    try {
      const compId = session.companyId || activeCompanyId || (companies[0]?.id || 'comp-1');
      const updatedSession = { ...session, companyId: compId };
      const updated = [updatedSession, ...checkouts];
      setCheckouts(updated);
      await storage.saveCheckoutSessions(updated);
      showSuccess(isAr ? 'تم حفظ جلسة الاستلام بنجاح' : 'Checkout session saved successfully');
      await refreshCheckouts();
    } catch (error) {
      showError(isAr ? 'فشل حفظ جلسة الاستلام' : 'Failed to save checkout session');
      const reloadData = await storage.getCheckoutSessions();
      setCheckouts(reloadData);
    }
  };

  const handleDeleteCheckout = async (id: string) => {
    if (!hasPermission('checkout', 'delete')) {
      showError(isAr ? 'ليس لديك صلاحية لحذف جلسات الاستلام' : 'You do not have permission to delete checkout sessions');
      return;
    }
    try {
      setCheckouts(prev => prev.filter(c => c.id !== id));
      await storage.deleteCheckoutSession(id);
      showSuccess(isAr ? 'تم حذف جلسة الاستلام بنجاح' : 'Checkout session deleted successfully');
      await refreshCheckouts();
    } catch (error) {
      showError(isAr ? 'فشل حذف جلسة الاستلام' : 'Failed to delete checkout session');
      const reloadData = await storage.getCheckoutSessions();
      setCheckouts(reloadData);
    }
  };

  const handleReturnVehicle = async (sessionId: string, returnData: Partial<CheckoutSession>) => {
    if (!hasPermission('checkout', 'edit')) {
      showError(isAr ? 'ليس لديك صلاحية لتعديل جلسات الاستلام' : 'You do not have permission to edit checkout sessions');
      return;
    }
    try {
      const updated = checkouts.map(c => c.id === sessionId ? { ...c, ...returnData } : c);
      setCheckouts(updated);
      await storage.saveCheckoutSessions(updated);
      showSuccess(isAr ? 'تم تحديث جلسة الاستلام بنجاح' : 'Checkout session updated successfully');
      await refreshCheckouts();
    } catch (error) {
      showError(isAr ? 'فشل تحديث جلسة الاستلام' : 'Failed to update checkout session');
      const reloadData = await storage.getCheckoutSessions();
      setCheckouts(reloadData);
    }
  };

  // ============================================================
  // SETTINGS & DOCUMENTS
  // ============================================================
  const handleSaveSettings = (newSettings: CompanySettings) => {
    setSettings(newSettings);
    storage.saveSettings(newSettings);

    if (activeCompanyId) {
      const targetCompId = activeCompanyId;
      const updatedCompanies = companies.map(c => {
        if (c.id === targetCompId) {
          return {
            ...c,
            name: newSettings.companyName,
            tagline: newSettings.tagline,
            logoUrl: newSettings.logoUrl || DEFAULT_LOGO_URL,
            phone: newSettings.phone,
            email: newSettings.email,
            address: newSettings.address,
            commercialRegNumber: newSettings.commercialRegNumber,
            currency: newSettings.currency,
          };
        }
        return c;
      });
      setCompanies(updatedCompanies);
      storage.saveCompanies(updatedCompanies);
    }
    showSuccess(isAr ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully');
  };

  const handleSaveDocuments = async (docs: CompanyDocument[]) => {
    if (!hasPermission('settings', 'edit')) {
      showError(isAr ? 'ليس لديك صلاحية لتعديل المستندات' : 'You do not have permission to edit documents');
      return;
    }
    try {
      const compId = activeCompanyId || (companies[0]?.id || 'comp-1');
      const docsWithComp = docs.map(d => ({ ...d, companyId: d.companyId || compId }));
      setDocuments(docsWithComp);
      await storage.saveDocuments(docsWithComp);
      showSuccess(isAr ? 'تم حفظ المستندات بنجاح' : 'Documents saved successfully');
    } catch (error) {
      showError(isAr ? 'فشل حفظ المستندات' : 'Failed to save documents');
      const reloadData = await storage.getDocuments();
      setDocuments(reloadData);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!hasPermission('settings', 'delete')) {
      showError(isAr ? 'ليس لديك صلاحية لحذف المستندات' : 'You do not have permission to delete documents');
      return;
    }
    try {
      setDocuments(prev => prev.filter(d => d.id !== id));
      await storage.deleteDocument(id);
      showSuccess(isAr ? 'تم حذف المستند بنجاح' : 'Document deleted successfully');
    } catch (error) {
      showError(isAr ? 'فشل حذف المستند' : 'Failed to delete document');
      const reloadData = await storage.getDocuments();
      setDocuments(reloadData);
    }
  };

  const handlePrintReceipt = (session: CheckoutSession) => {
    setReceiptSession(session);
    setActiveTab('reports');
  };

  // ============================================================
  // تسجيل الخروج
  // ============================================================
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    localStorage.removeItem('fleet_active_company');
    localStorage.removeItem('fleet_user_id');
    localStorage.removeItem('fleet_user_email');
  };

  // ============================================================
  // قائمة التبويبات
  // ============================================================
  const navItems = [
    { id: 'dashboard', label: t('dashboard', lang), icon: LayoutDashboard, module: 'vehicles' },
    { id: 'vehicles', label: t('fleetVehicles', lang), icon: Car, module: 'vehicles' },
    { id: 'drivers', label: t('driversLicenses', lang), icon: Users, module: 'drivers' },
    { id: 'checkout', label: t('handoverSignature', lang), icon: KeyRound, highlight: true, module: 'checkout' },
    { id: 'maintenance', label: t('maintenanceGarages', lang), icon: Wrench, module: 'maintenance' },
    { id: 'fuel', label: t('fuelExpenses', lang), icon: Fuel, module: 'fuel' },
    { id: 'expiries', label: t('expiriesAlerts', lang), icon: ShieldAlert, module: 'vehicles' },
    { id: 'reports', label: t('printReports', lang), icon: Printer, module: 'reports' },
    { id: 'advisor', label: t('aiAdvisor', lang), icon: Sparkles, module: 'vehicles' },
    { id: 'settings', label: t('companySettings', lang), icon: Building2, module: 'settings' },
    { id: 'users', label: t('userManagement', lang), icon: UserCog, module: 'users' },
    { id: 'audit', label: isAr ? 'سجل العمليات' : 'Audit Log', icon: History, module: 'users' },
  ];

  // ============================================================
  // التحقق من حالة التحميل والمصادقة
  // ============================================================
  if (loading || isDataLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-[#0a0b0d]">{t('loading', lang)}</div>;
  }

  if (!session) {
    return (
      <LoginScreen
        lang={lang}
        onLogin={() => {}}
        logoUrl={DEFAULT_LOGO_URL}
        supportEmail="bahaa.it2020@gmail.com"
        supportPhone="+971 58 669 2733"
        copyrightText="جميع الحقوق محفوظة © 2026\nفريق YAMANIX TEAM & BAHAA NASIR"
      />
    );
  }

  if (companies.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-[#0a0b0d]">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-xl text-center max-w-md">
          <Building2 className="w-16 h-16 mx-auto text-blue-500 mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {isAr ? 'لا توجد شركات' : 'No Companies'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            {isAr ? 'يرجى إضافة شركة أولاً من إعدادات الشركة.' : 'Please add a company first from Company Settings.'}
          </p>
          <button
            onClick={() => setActiveTab('settings')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            {isAr ? 'الذهاب للإعدادات' : 'Go to Settings'}
          </button>
        </div>
      </div>
    );
  }

  if (!activeCompanyId && companies.length > 0) {
    const firstId = companies[0].id;
    setActiveCompanyIdState(firstId);
    localStorage.setItem('fleet_active_company', firstId);
    return null;
  }

  // ============================================================
  // التصيير الرئيسي
  // ============================================================
  const currentNavItem = navItems.find(item => item.id === activeTab);
  const isAllowed = currentNavItem ? hasPermission(currentNavItem.module, 'view') : false;

  return (
    <div className={`min-h-screen bg-slate-100 dark:bg-[#0a0b0d] text-slate-800 dark:text-gray-200 font-sans transition-colors duration-200 ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`}>
      <header className="no-print bg-white dark:bg-[#0f1115] text-slate-800 dark:text-white border-b border-slate-200 dark:border-gray-800 sticky top-0 z-40 shadow-xs dark:shadow-md">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between max-w-full">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {currentCompanySettings.logoUrl ? (
              <img src={currentCompanySettings.logoUrl} alt="Logo" className="h-10 w-10 object-contain rounded-lg bg-slate-50 dark:bg-[#0a0b0d] p-1 border border-slate-200 dark:border-gray-800 flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 bg-[#cbb26a] text-black font-extrabold rounded-lg flex items-center justify-center text-xl shadow-xs flex-shrink-0">
                {currentCompanySettings.companyName.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-bold leading-tight text-slate-900 dark:text-white tracking-wide truncate">{currentCompanySettings.companyName}</h1>
              <p className="text-[11px] text-slate-500 dark:text-gray-400 flex items-center gap-2">
                <span className="hidden sm:inline">{lang === 'ar' ? 'نظام إدارة الأسطول' : 'Fleet Management'}</span>
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-[10px] font-bold whitespace-nowrap">
                  {profile?.role === 'admin' ? t('roleAdmin', lang) : profile?.role === 'manager' ? t('roleManager', lang) : profile?.role === 'disabled' ? t('roleDisabled', lang) : t('roleUser', lang)}
                </span>
              </p>
            </div>
            <div className="hidden sm:block border-s border-slate-200 dark:border-gray-800/80 ps-3 ms-1 flex-shrink-0">
              <CompanySwitcher
                companies={companies}
                activeCompanyId={activeCompanyId || ''}
                vehicles={vehicles}
                drivers={drivers}
                lang={lang}
                onSelectCompany={handleSelectCompany}
                onAddCompany={handleAddCompany}
                onDeleteCompany={handleDeleteCompany}
                onManageCompanies={() => setActiveTab('settings')}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <OfflineSyncBadge lang={lang} />
            <button
              onClick={() => {
                const newLang = lang === 'en' ? 'ar' : 'en';
                setLang(newLang);
                localStorage.setItem('fleet_language', newLang);
              }}
              className="px-3 py-1.5 bg-blue-600/10 dark:bg-blue-600/15 hover:bg-blue-600/20 text-blue-700 dark:text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Languages className="w-4 h-4" />
              <span>{lang === 'en' ? 'AR' : 'EN'}</span>
            </button>
            <button
              onClick={() => {
                setNotificationDrawerOpen(true);
                toastRef.current?.triggerCheckOnLogin();
              }}
              className="p-2 relative text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800/60 rounded-xl transition group"
            >
              <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {activeAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center animate-pulse shadow-md border-2 border-white dark:border-[#0f1115]">
                  {activeAlertsCount}
                </span>
              )}
            </button>
            <button onClick={handleLogout} className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition" title={lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}>
              <LogOut className="w-5 h-5" />
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800/60 rounded-lg transition">
              {darkMode ? <Sun className="w-5 h-5 text-[#cbb26a]" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 lg:hidden text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <div className="hidden lg:block bg-slate-50 dark:bg-[#0a0b0d]/90 border-t border-slate-200 dark:border-gray-800/80 px-4 sm:px-6">
          <div className="max-w-full flex items-center gap-1 overflow-x-auto py-1.5">
            {navItems.map(item => {
              if (profile?.role === 'admin' || hasPermission(item.module, 'view')) {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                      isActive
                        ? 'bg-[#cbb26a]/20 text-amber-900 dark:text-[#cbb26a] border-b-2 border-[#cbb26a] shadow-xs'
                        : item.highlight
                        ? 'bg-[#cbb26a] text-black font-bold hover:bg-[#b89f57]'
                        : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-800 dark:text-[#cbb26a]' : item.highlight ? 'text-black' : 'text-slate-500 dark:text-gray-400'}`} />
                    {item.label}
                  </button>
                );
              }
              return null;
            })}
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden bg-white dark:bg-[#0f1115] border-b border-slate-200 dark:border-gray-800 px-4 py-3 space-y-1">
            {navItems.map(item => {
              if (profile?.role === 'admin' || hasPermission(item.module, 'view')) {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-start px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-3 ${
                      isActive ? 'bg-[#cbb26a]/20 text-amber-900 dark:text-[#cbb26a] border-s-2 border-[#cbb26a]' : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-amber-800 dark:text-[#cbb26a]' : 'text-slate-500 dark:text-gray-400'}`} />
                    {item.label}
                  </button>
                );
              }
              return null;
            })}
          </div>
        )}
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-full">
        {!isAllowed && activeTab !== 'dashboard' ? (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/50 rounded-2xl p-8 text-center text-amber-800 dark:text-amber-300">
            <Shield className="w-12 h-12 mx-auto mb-4 text-amber-500" />
            <h3 className="text-lg font-bold">{lang === 'ar' ? 'غير مصرح لك بالدخول إلى هذه الصفحة' : 'You do not have permission to access this page'}</h3>
            <p className="text-sm mt-2">{lang === 'ar' ? 'صلاحياتك الحالية لا تسمح بعرض هذا المحتوى.' : 'Your current permissions do not allow access to this content.'}</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && <DashboardView vehicles={filteredVehicles} drivers={filteredDrivers} maintenance={filteredMaintenance} fuel={filteredFuel} checkouts={filteredCheckouts} settings={currentCompanySettings} onNavigateTab={setActiveTab} lang={lang} />}
            {activeTab === 'vehicles' && <VehiclesView vehicles={filteredVehicles} drivers={filteredDrivers} onSaveVehicle={handleSaveVehicle} onDeleteVehicle={handleDeleteVehicle} lang={lang} />}
            {activeTab === 'drivers' && <DriversView drivers={filteredDrivers} vehicles={filteredVehicles} onSaveDriver={handleSaveDriver} onDeleteDriver={handleDeleteDriver} lang={lang} />}
            {activeTab === 'checkout' && 
              <CheckoutHub 
                vehicles={filteredVehicles} 
                drivers={filteredDrivers} 
                checkouts={filteredCheckouts} 
                settings={currentCompanySettings} 
                profile={profile} 
                onSaveCheckout={handleSaveCheckout} 
                onReturnVehicle={handleReturnVehicle} 
                onDeleteCheckout={handleDeleteCheckout} 
                onPrintReceipt={handlePrintReceipt} 
                lang={lang}
                onRefresh={refreshCheckouts}
              />
            }
            {activeTab === 'maintenance' && <MaintenanceView maintenance={filteredMaintenance} vehicles={filteredVehicles} garages={filteredGarages} settings={currentCompanySettings} onSaveMaintenance={handleSaveMaintenance} onDeleteMaintenance={handleDeleteMaintenance} onSaveGarage={handleSaveGarage} onDeleteGarage={handleDeleteGarage} lang={lang} />}
            {activeTab === 'fuel' && <FuelExpensesView fuel={filteredFuel} expenses={filteredExpenses} vehicles={filteredVehicles} drivers={filteredDrivers} checkouts={filteredCheckouts} garages={filteredGarages} maintenance={filteredMaintenance} onSaveFuel={handleSaveFuel} onDeleteFuel={handleDeleteFuel} onSaveExpense={handleSaveExpense} onDeleteExpense={handleDeleteExpense} onSaveMaintenance={handleSaveMaintenance} onDeleteMaintenance={handleDeleteMaintenance} lang={lang} />}
            {activeTab === 'expiries' && <ExpiriesView vehicles={filteredVehicles} drivers={filteredDrivers} onSaveVehicle={handleSaveVehicle} lang={lang} />}
            {activeTab === 'reports' && <PrintReportsView settings={currentCompanySettings} vehicles={filteredVehicles} drivers={filteredDrivers} maintenance={filteredMaintenance} fuel={filteredFuel} checkouts={filteredCheckouts} activeReceiptSession={receiptSession} onClearReceiptSession={() => setReceiptSession(null)} onSaveSettings={handleSaveSettings} lang={lang} />}
            {activeTab === 'advisor' && <AIFleetAdvisor vehicles={filteredVehicles} drivers={filteredDrivers} maintenance={filteredMaintenance} fuel={filteredFuel} settings={currentCompanySettings} onSaveVehicle={handleSaveVehicle} onNavigateTab={setActiveTab} lang={lang} />}
            {activeTab === 'settings' && <CompanySettingsView settings={currentCompanySettings} documents={filteredDocuments} vehicles={filteredVehicles} drivers={filteredDrivers} maintenance={filteredMaintenance} fuel={filteredFuel} checkouts={filteredCheckouts} garages={filteredGarages} expenses={filteredExpenses} lang={lang} companies={companies} activeCompanyId={activeCompanyId || ''} onSave={handleSaveSettings} onSaveDocuments={handleSaveDocuments} onDeleteDocument={handleDeleteDocument} onSelectCompany={handleSelectCompany} onAddCompany={handleAddCompany} onDeleteCompany={handleDeleteCompany} />}
            {activeTab === 'users' && profile?.role === 'admin' && (
              <UserManagement
                profile={profile}
                companies={companies}
                lang={lang}
                onUpdate={() => window.location.reload()}
              />
            )}
            {activeTab === 'audit' && profile?.role === 'admin' && (
              <AuditLogView lang={lang} />
            )}
          </>
        )}
      </main>

      <ToastNotifications ref={toastRef} vehicles={vehicles} drivers={drivers} maintenance={maintenance} onNavigateTab={setActiveTab} isOpenDrawer={notificationDrawerOpen} onCloseDrawer={() => setNotificationDrawerOpen(false)} lang={lang} />
    </div>
  );
}