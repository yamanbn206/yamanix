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
  Car, 
  Users, 
  KeyRound, 
  Wrench, 
  Fuel, 
  ShieldAlert, 
  Printer, 
  Sparkles, 
  Building2, 
  LayoutDashboard, 
  Moon, 
  Sun, 
  RotateCcw,
  Menu,
  X,
  Bell,
  LogIn,
  Languages,
  UserCog,
  Shield,
  LogOut,
  History
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
  const [authError, setAuthError] = useState<string | null>(null);

  // ===== بيانات التطبيق =====
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompanyId, setActiveCompanyIdState] = useState<string>(() => {
    const saved = localStorage.getItem('fleet_active_company');
    return saved || 'all';
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
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // ============================================================
  // جميع الـ Hooks في الأعلى (قبل أي return شرطي)
  // ============================================================

  // حفظ اللغة
  useEffect(() => {
    localStorage.setItem('fleet_language', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // جلسة المستخدم
  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Session error:', error);
          if (error.status === 400) {
            // توكن غير صالح - تنظيف
            localStorage.removeItem('fleet_active_company');
            localStorage.removeItem('fleet_user_id');
            localStorage.removeItem('fleet_user_email');
            setSession(null);
            setProfile(null);
            setLoading(false);
            setAuthError('جلسة غير صالحة، يرجى تسجيل الدخول مرة أخرى');
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

  // حفظ بيانات المستخدم في localStorage
  useEffect(() => {
    if (session?.user) {
      localStorage.setItem('fleet_user_id', session.user.id);
      localStorage.setItem('fleet_user_email', session.user.email || '');
    }
  }, [session]);

  // ============================================================
  // تحميل البيانات - محسّن لتجنب استبدال التغييرات المحلية
  // ============================================================
  useEffect(() => {
    if (!session) return;

    const loadData = async () => {
      try {
        // أولاً: تحميل البيانات من localStorage فوراً (للسرعة)
        const localCompanies = JSON.parse(localStorage.getItem('fleet_app_companies_v1') || '[]');
        const localVehicles = JSON.parse(localStorage.getItem('fleet_app_vehicles_v1') || '[]');
        const localDrivers = JSON.parse(localStorage.getItem('fleet_app_drivers_v1') || '[]');
        const localGarages = JSON.parse(localStorage.getItem('fleet_app_garages_v1') || '[]');
        const localMaintenance = JSON.parse(localStorage.getItem('fleet_app_maintenance_v1') || '[]');
        const localFuel = JSON.parse(localStorage.getItem('fleet_app_fuel_v1') || '[]');
        const localExpenses = JSON.parse(localStorage.getItem('fleet_app_expenses_v1') || '[]');
        const localCheckouts = JSON.parse(localStorage.getItem('fleet_app_checkouts_v1') || '[]');
        const localDocuments = JSON.parse(localStorage.getItem('fleet_app_documents_v1') || '[]');

        // إذا كانت هناك بيانات محلية، استخدمها أولاً
        if (localVehicles.length > 0 && isInitialLoad) {
          setCompanies(localCompanies.length > 0 ? localCompanies : []);
          setVehicles(localVehicles);
          setDrivers(localDrivers);
          setGarages(localGarages);
          setMaintenance(localMaintenance);
          setFuel(localFuel);
          setExpenses(localExpenses);
          setCheckouts(localCheckouts);
          setDocuments(localDocuments);
        }

        // ثم حمّل من Supabase (في الخلفية) وقارن التواريخ
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

        // قم بتحديث الحالة فقط إذا كانت البيانات من Supabase تحتوي على سجلات جديدة
        // أو إذا كانت البيانات المحلية فارغة (أول تحميل)
        if (vehiclesData && vehiclesData.length > 0) {
          setVehicles(vehiclesData);
        }
        if (driversData && driversData.length > 0) {
          setDrivers(driversData);
        }
        if (garagesData && garagesData.length > 0) {
          setGarages(garagesData);
        }
        if (maintenanceData && maintenanceData.length > 0) {
          setMaintenance(maintenanceData);
        }
        if (fuelData && fuelData.length > 0) {
          setFuel(fuelData);
        }
        if (expensesData && expensesData.length > 0) {
          setExpenses(expensesData);
        }
        if (checkoutsData && checkoutsData.length > 0) {
          setCheckouts(checkoutsData);
        }
        if (documentsData && documentsData.length > 0) {
          setDocuments(documentsData);
        }
        if (companiesData && companiesData.length > 0) {
          setCompanies(companiesData);
        }

        setIsInitialLoad(false);
      } catch (error) {
        console.error('Failed to load data:', error);
        setTimeout(loadData, 5000);
      }
    };
    loadData();
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
    const updated = [...companies, newComp];
    setCompanies(updated);
    await storage.saveCompanies(updated);
  };

  const handleDeleteCompany = async (compDeleteId: string) => {
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذه الشركة وجميع بياناتها؟' : 'Are you sure you want to delete this company and all its data?')) return;
    const updated = companies.filter(c => c.id !== compDeleteId);
    setCompanies(updated);
    await storage.saveCompanies(updated);
    if (activeCompanyId === compDeleteId) {
      const nextId = updated.length > 0 ? updated[0].id : 'all';
      handleSelectCompany(nextId);
    }
  };

  // ============================================================
  // إعدادات الشركة الحالية
  // ============================================================
  const currentCompanySettings = useMemo<CompanySettings>(() => {
    if (activeCompanyId === 'all') {
      return {
        companyName: lang === 'ar' ? 'مجموعة الشركات المجمّعة' : 'Combined Corporate Group',
        tagline: lang === 'ar' ? 'عرض شامِل ومجمّع لكافة الشركات والبيانات' : 'Combined overview across all registered companies',
        logoUrl: DEFAULT_LOGO_URL,
        phone: '+966 50 123 4567',
        email: 'fleet@yamanix.com',
        address: lang === 'ar' ? 'المملكة العربية السعودية' : 'Saudi Arabia',
        commercialRegNumber: 'CR-MULTITENANT',
        printHeaderNote: 'مستند مجمّع صادر عن نظام إدارة الأسطول الموحد',
        printFooterNote: 'نظام إدارة الأسطول والشركات المتعددة',
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
    if (!Array.isArray(vehicles)) return [];
    if (activeCompanyId === 'all') return vehicles;
    return vehicles.filter(v => (v.companyId || 'comp-1') === activeCompanyId);
  }, [vehicles, activeCompanyId]);

  const filteredDrivers = useMemo(() => {
    if (!Array.isArray(drivers)) return [];
    if (activeCompanyId === 'all') return drivers;
    return drivers.filter(d => (d.companyId || 'comp-1') === activeCompanyId);
  }, [drivers, activeCompanyId]);

  const filteredGarages = useMemo(() => {
    if (!Array.isArray(garages)) return [];
    if (activeCompanyId === 'all') return garages;
    return garages.filter(g => !g.companyId || g.companyId === activeCompanyId);
  }, [garages, activeCompanyId]);

  const filteredMaintenance = useMemo(() => {
    if (!Array.isArray(maintenance)) return [];
    if (activeCompanyId === 'all') return maintenance;
    return maintenance.filter(m => (m.companyId || 'comp-1') === activeCompanyId);
  }, [maintenance, activeCompanyId]);

  const filteredFuel = useMemo(() => {
    if (!Array.isArray(fuel)) return [];
    if (activeCompanyId === 'all') return fuel;
    return fuel.filter(f => (f.companyId || 'comp-1') === activeCompanyId);
  }, [fuel, activeCompanyId]);

  const filteredExpenses = useMemo(() => {
    if (!Array.isArray(expenses)) return [];
    if (activeCompanyId === 'all') return expenses;
    return expenses.filter(e => (e.companyId || 'comp-1') === activeCompanyId);
  }, [expenses, activeCompanyId]);

  const filteredCheckouts = useMemo(() => {
    if (!Array.isArray(checkouts)) return [];
    if (activeCompanyId === 'all') return checkouts;
    return checkouts.filter(c => (c.companyId || 'comp-1') === activeCompanyId);
  }, [checkouts, activeCompanyId]);

  const filteredDocuments = useMemo(() => {
    if (!Array.isArray(documents)) return [];
    if (activeCompanyId === 'all') return documents;
    return documents.filter(doc => (doc.companyId || 'comp-1') === activeCompanyId);
  }, [documents, activeCompanyId]);

  // ============================================================
  // التنبيهات
  // ============================================================
  const activeAlertsCount = React.useMemo(() => {
    let count = 0;
    const today = new Date();
    today.setHours(0,0,0,0);
    filteredVehicles.forEach(v => {
      if (v.licenseExpiryDate) {
        const d = new Date(v.licenseExpiryDate);
        d.setHours(0,0,0,0);
        const days = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (days <= 30) count++;
      }
      if (v.insuranceExpiryDate) {
        const d = new Date(v.insuranceExpiryDate);
        d.setHours(0,0,0,0);
        const days = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (days <= 30) count++;
      }
      if (v.nextServiceMileage && v.nextServiceMileage - v.mileage <= 1000) count++;
    });
    filteredDrivers.forEach(d => {
      if (d.licenseExpiryDate) {
        const date = new Date(d.licenseExpiryDate);
        date.setHours(0,0,0,0);
        const days = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (days <= 30) count++;
      }
    });
    return count;
  }, [filteredVehicles, filteredDrivers]);

  // ============================================================
  // دوال الحفظ والحذف
  // ============================================================
  const getCurrentUserId = () => session?.user?.id;

  const hasPermission = (module: string, action: string = 'view') => {
    if (!profile) return true;
    if (profile?.role === 'admin') return true;
    return profile?.permissions?.[module]?.[action] === true;
  };

  // ===== VEHICLES =====
  const handleSaveVehicle = async (v: Vehicle) => {
    if (!hasPermission('vehicles', 'add')) {
      alert(lang === 'ar' ? 'ليس لديك صلاحية لإضافة سيارات' : 'You do not have permission to add vehicles');
      return;
    }
    const compId = v.companyId || (activeCompanyId === 'all' ? (companies[0]?.id || 'comp-1') : activeCompanyId);
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
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!hasPermission('vehicles', 'delete')) {
      alert(lang === 'ar' ? 'ليس لديك صلاحية لحذف السيارات' : 'You do not have permission to delete vehicles');
      return;
    }
    try {
      await storage.deleteVehicle(id);
      setVehicles(prev => prev.filter(v => v.id !== id));
    } catch (error) {
      alert('Failed to delete vehicle');
    }
  };

  // ===== DRIVERS =====
  const handleSaveDriver = async (d: Driver) => {
    if (!hasPermission('drivers', 'add')) {
      alert(lang === 'ar' ? 'ليس لديك صلاحية لإضافة سائقين' : 'You do not have permission to add drivers');
      return;
    }
    const compId = d.companyId || (activeCompanyId === 'all' ? (companies[0]?.id || 'comp-1') : activeCompanyId);
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
  };

  const handleDeleteDriver = async (id: string) => {
    if (!hasPermission('drivers', 'delete')) {
      alert(lang === 'ar' ? 'ليس لديك صلاحية لحذف سائقين' : 'You do not have permission to delete drivers');
      return;
    }
    try {
      await storage.deleteDriver(id);
      setDrivers(prev => prev.filter(d => d.id !== id));
    } catch (error) {
      alert('Failed to delete driver');
    }
  };

  // ===== MAINTENANCE =====
  const handleSaveMaintenance = async (record: MaintenanceRecord) => {
    if (!hasPermission('maintenance', 'add')) {
      alert(lang === 'ar' ? 'ليس لديك صلاحية لإضافة سجلات صيانة' : 'You do not have permission to add maintenance records');
      return;
    }
    const updated = [record, ...maintenance];
    setMaintenance(updated);
    await storage.saveMaintenanceRecords(updated);
  };

  const handleDeleteMaintenance = async (id: string) => {
    if (!hasPermission('maintenance', 'delete')) {
      alert(lang === 'ar' ? 'ليس لديك صلاحية لحذف سجلات الصيانة' : 'You do not have permission to delete maintenance records');
      return;
    }
    try {
      await storage.deleteMaintenanceRecord(id);
      setMaintenance(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      alert('Failed to delete maintenance record');
    }
  };

  // ===== GARAGES =====
  const handleSaveGarage = async (g: Garage) => {
    if (!hasPermission('maintenance', 'add')) {
      alert(lang === 'ar' ? 'ليس لديك صلاحية لإضافة كراجات' : 'You do not have permission to add garages');
      return;
    }
    const updated = [g, ...garages];
    setGarages(updated);
    await storage.saveGarages(updated);
  };

  const handleDeleteGarage = async (id: string) => {
    if (!hasPermission('maintenance', 'delete')) {
      alert(lang === 'ar' ? 'ليس لديك صلاحية لحذف الكراجات' : 'You do not have permission to delete garages');
      return;
    }
    try {
      await storage.deleteGarage(id);
      setGarages(prev => prev.filter(g => g.id !== id));
    } catch (error) {
      alert('Failed to delete garage');
    }
  };

  // ===== FUEL =====
  const handleSaveFuel = async (f: FuelRecord) => {
    if (!hasPermission('fuel', 'add')) {
      alert(lang === 'ar' ? 'ليس لديك صلاحية لإضافة سجلات وقود' : 'You do not have permission to add fuel records');
      return;
    }
    const updated = [f, ...fuel];
    setFuel(updated);
    await storage.saveFuelRecords(updated);
  };

  const handleDeleteFuel = async (id: string) => {
    if (!hasPermission('fuel', 'delete')) {
      alert(lang === 'ar' ? 'ليس لديك صلاحية لحذف سجلات الوقود' : 'You do not have permission to delete fuel records');
      return;
    }
    try {
      await storage.deleteFuelRecord(id);
      setFuel(prev => prev.filter(f => f.id !== id));
    } catch (error) {
      alert('Failed to delete fuel record');
    }
  };

  // ===== EXPENSES =====
  const handleSaveExpense = async (e: ExpenseRecord) => {
    if (!hasPermission('fuel', 'add')) {
      alert(lang === 'ar' ? 'ليس لديك صلاحية لإضافة مصاريف' : 'You do not have permission to add expenses');
      return;
    }
    const updated = [e, ...expenses];
    setExpenses(updated);
    await storage.saveExpenseRecords(updated);
  };

  const handleDeleteExpense = async (id: string) => {
    if (!hasPermission('fuel', 'delete')) {
      alert(lang === 'ar' ? 'ليس لديك صلاحية لحذف المصاريف' : 'You do not have permission to delete expenses');
      return;
    }
    try {
      await storage.deleteExpenseRecord(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      alert('Failed to delete expense');
    }
  };

  // ===== CHECKOUT =====
  const handleSaveCheckout = async (session: CheckoutSession) => {
    if (!hasPermission('checkout', 'add')) {
      alert(lang === 'ar' ? 'ليس لديك صلاحية لإضافة جلسات استلام' : 'You do not have permission to add checkout sessions');
      return;
    }
    const updated = [session, ...checkouts];
    setCheckouts(updated);
    await storage.saveCheckoutSessions(updated);
  };

  const handleDeleteCheckout = async (id: string) => {
    if (!hasPermission('checkout', 'delete')) {
      alert(lang === 'ar' ? 'ليس لديك صلاحية لحذف جلسات الاستلام' : 'You do not have permission to delete checkout sessions');
      return;
    }
    try {
      await storage.deleteCheckoutSession(id);
      setCheckouts(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      alert('Failed to delete checkout session');
    }
  };

  const handleReturnVehicle = async (sessionId: string, returnData: Partial<CheckoutSession>) => {
    if (!hasPermission('checkout', 'edit')) {
      alert(lang === 'ar' ? 'ليس لديك صلاحية لتعديل جلسات الاستلام' : 'You do not have permission to edit checkout sessions');
      return;
    }
    const updated = checkouts.map(c => c.id === sessionId ? { ...c, ...returnData } : c);
    setCheckouts(updated);
    await storage.saveCheckoutSessions(updated);
  };

  // ===== SETTINGS & DOCUMENTS =====
  const handleSaveSettings = (newSettings: CompanySettings) => {
    const targetCompId = activeCompanyId === 'all' ? (companies[0]?.id || 'comp-1') : activeCompanyId;
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
          currency: newSettings.currency
        };
      }
      return c;
    });
    setCompanies(updatedCompanies);
    storage.saveCompanies(updatedCompanies);
    setSettings(newSettings);
    storage.saveSettings(newSettings);
  };

  const handleSaveDocuments = async (docs: CompanyDocument[]) => {
    if (!hasPermission('settings', 'edit')) {
      alert(lang === 'ar' ? 'ليس لديك صلاحية لتعديل المستندات' : 'You do not have permission to edit documents');
      return;
    }
    const compId = activeCompanyId === 'all' ? (companies[0]?.id || 'comp-1') : activeCompanyId;
    const docsWithComp = docs.map(d => ({ ...d, companyId: d.companyId || compId }));
    setDocuments(docsWithComp);
    await storage.saveDocuments(docsWithComp);
  };

  const handleDeleteDocument = async (id: string) => {
    if (!hasPermission('settings', 'delete')) {
      alert(lang === 'ar' ? 'ليس لديك صلاحية لحذف المستندات' : 'You do not have permission to delete documents');
      return;
    }
    try {
      await storage.deleteDocument(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (error) {
      alert('Failed to delete document');
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
  // التحقق من حالة التحميل والمصادقة (بعد كل الـ Hooks)
  // ============================================================
  if (loading) {
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

  // ============================================================
  // التصيير الرئيسي (بعد التأكد من وجود session)
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
                activeCompanyId={activeCompanyId}
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

        {/* شريط التبويبات */}
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
            {activeTab === 'checkout' && <CheckoutHub vehicles={filteredVehicles} drivers={filteredDrivers} checkouts={filteredCheckouts} settings={currentCompanySettings} profile={profile} onSaveCheckout={handleSaveCheckout} onReturnVehicle={handleReturnVehicle} onDeleteCheckout={handleDeleteCheckout} onPrintReceipt={handlePrintReceipt} lang={lang} />}
            {activeTab === 'maintenance' && <MaintenanceView maintenance={filteredMaintenance} vehicles={filteredVehicles} garages={filteredGarages} settings={currentCompanySettings} onSaveMaintenance={handleSaveMaintenance} onDeleteMaintenance={handleDeleteMaintenance} onSaveGarage={handleSaveGarage} onDeleteGarage={handleDeleteGarage} lang={lang} />}
            {activeTab === 'fuel' && <FuelExpensesView fuel={filteredFuel} expenses={filteredExpenses} vehicles={filteredVehicles} drivers={filteredDrivers} checkouts={filteredCheckouts} garages={filteredGarages} maintenance={filteredMaintenance} onSaveFuel={handleSaveFuel} onDeleteFuel={handleDeleteFuel} onSaveExpense={handleSaveExpense} onDeleteExpense={handleDeleteExpense} onSaveMaintenance={handleSaveMaintenance} onDeleteMaintenance={handleDeleteMaintenance} lang={lang} />}
            {activeTab === 'expiries' && <ExpiriesView vehicles={filteredVehicles} drivers={filteredDrivers} onSaveVehicle={handleSaveVehicle} lang={lang} />}
            {activeTab === 'reports' && <PrintReportsView settings={currentCompanySettings} vehicles={filteredVehicles} drivers={filteredDrivers} maintenance={filteredMaintenance} fuel={filteredFuel} checkouts={filteredCheckouts} activeReceiptSession={receiptSession} onClearReceiptSession={() => setReceiptSession(null)} onSaveSettings={handleSaveSettings} lang={lang} />}
            {activeTab === 'advisor' && <AIFleetAdvisor vehicles={filteredVehicles} drivers={filteredDrivers} maintenance={filteredMaintenance} fuel={filteredFuel} settings={currentCompanySettings} onSaveVehicle={handleSaveVehicle} onNavigateTab={setActiveTab} lang={lang} />}
            {activeTab === 'settings' && <CompanySettingsView settings={currentCompanySettings} documents={filteredDocuments} vehicles={filteredVehicles} drivers={filteredDrivers} maintenance={filteredMaintenance} fuel={filteredFuel} checkouts={filteredCheckouts} garages={filteredGarages} expenses={filteredExpenses} lang={lang} companies={companies} activeCompanyId={activeCompanyId} onSave={handleSaveSettings} onSaveDocuments={handleSaveDocuments} onDeleteDocument={handleDeleteDocument} onSelectCompany={handleSelectCompany} onAddCompany={handleAddCompany} onDeleteCompany={handleDeleteCompany} />}
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