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
  Company
} from './types';
import { storage } from './lib/storage';
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
  Languages
} from 'lucide-react';

export default function App() {
  // Global Language State (Defaults to Arabic)
  const [lang, setLang] = useState<Language>('ar');

  // Navigation & UI State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState<boolean>(false);

  const toastRef = React.useRef<ToastRefHandler>(null);

  // Multi-Company State
  const [companies, setCompanies] = useState<Company[]>(() => storage.getCompanies());
  const [activeCompanyId, setActiveCompanyIdState] = useState<string>(() => storage.getActiveCompanyId());

  // App Main State
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => storage.getVehicles());
  const [drivers, setDrivers] = useState<Driver[]>(() => storage.getDrivers());
  const [garages, setGarages] = useState<Garage[]>(() => storage.getGarages());
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>(() => storage.getMaintenanceRecords());
  const [fuel, setFuel] = useState<FuelRecord[]>(() => storage.getFuelRecords());
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => storage.getExpenseRecords());
  const [checkouts, setCheckouts] = useState<CheckoutSession[]>(() => storage.getCheckoutSessions());
  const [settings, setSettings] = useState<CompanySettings>(() => storage.getSettings());
  const [documents, setDocuments] = useState<CompanyDocument[]>(() => storage.getDocuments());

  // Multi-Company Selection Handler
  const handleSelectCompany = (id: string) => {
    setActiveCompanyIdState(id);
    storage.setActiveCompanyId(id);
  };

  const handleAddCompany = (newComp: Company) => {
    const updated = [...companies, newComp];
    setCompanies(updated);
    storage.saveCompanies(updated);
  };

  const handleDeleteCompany = (compDeleteId: string) => {
    const updated = companies.filter(c => c.id !== compDeleteId);
    setCompanies(updated);
    storage.saveCompanies(updated);
    if (activeCompanyId === compDeleteId) {
      const nextId = updated[0]?.id || 'comp-1';
      handleSelectCompany(nextId);
    }
  };

  // Dynamic Company Settings based on Active Company
  const currentCompanySettings = useMemo<CompanySettings>(() => {
    if (activeCompanyId === 'all') {
      return {
        companyName: lang === 'ar' ? 'مجموعة الشركات المجمّعة' : 'Combined Corporate Group',
        tagline: lang === 'ar' ? 'عرض شامِل ومجمّع لكافة الشركات والبيانات' : 'Combined overview across all registered companies',
        logoUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=150&auto=format&fit=crop&q=80',
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
        logoUrl: comp.logoUrl || settings.logoUrl,
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

  // Data Filtering per Active Company
  const filteredVehicles = useMemo(() => {
    if (activeCompanyId === 'all') return vehicles;
    return vehicles.filter(v => (v.companyId || 'comp-1') === activeCompanyId);
  }, [vehicles, activeCompanyId]);

  const filteredDrivers = useMemo(() => {
    if (activeCompanyId === 'all') return drivers;
    return drivers.filter(d => (d.companyId || 'comp-1') === activeCompanyId);
  }, [drivers, activeCompanyId]);

  const filteredGarages = useMemo(() => {
    if (activeCompanyId === 'all') return garages;
    return garages.filter(g => !g.companyId || g.companyId === activeCompanyId);
  }, [garages, activeCompanyId]);

  const filteredMaintenance = useMemo(() => {
    if (activeCompanyId === 'all') return maintenance;
    return maintenance.filter(m => (m.companyId || 'comp-1') === activeCompanyId);
  }, [maintenance, activeCompanyId]);

  const filteredFuel = useMemo(() => {
    if (activeCompanyId === 'all') return fuel;
    return fuel.filter(f => (f.companyId || 'comp-1') === activeCompanyId);
  }, [fuel, activeCompanyId]);

  const filteredExpenses = useMemo(() => {
    if (activeCompanyId === 'all') return expenses;
    return expenses.filter(e => (e.companyId || 'comp-1') === activeCompanyId);
  }, [expenses, activeCompanyId]);

  const filteredCheckouts = useMemo(() => {
    if (activeCompanyId === 'all') return checkouts;
    return checkouts.filter(c => (c.companyId || 'comp-1') === activeCompanyId);
  }, [checkouts, activeCompanyId]);

  const filteredDocuments = useMemo(() => {
    if (activeCompanyId === 'all') return documents;
    return documents.filter(doc => (doc.companyId || 'comp-1') === activeCompanyId);
  }, [documents, activeCompanyId]);

  // Active print receipt target
  const [receiptSession, setReceiptSession] = useState<CheckoutSession | null>(null);

  // Sync document attribute directions for RTL/LTR
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Calculate active alerts count for Header Notification Bell badge
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
      if (v.nextServiceMileage && v.nextServiceMileage - v.mileage <= 1000) {
        count++;
      }
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

  // Sync state when storage changes
  useEffect(() => {
    const handleStorageUpdate = () => {
      setCompanies(storage.getCompanies());
      setVehicles(storage.getVehicles());
      setDrivers(storage.getDrivers());
      setGarages(storage.getGarages());
      setMaintenance(storage.getMaintenanceRecords());
      setFuel(storage.getFuelRecords());
      setExpenses(storage.getExpenseRecords());
      setCheckouts(storage.getCheckoutSessions());
      setSettings(storage.getSettings());
      setDocuments(storage.getDocuments());
    };

    window.addEventListener('fleet_storage_update', handleStorageUpdate);
    return () => window.removeEventListener('fleet_storage_update', handleStorageUpdate);
  }, []);

  // Dark mode handler
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Actions with Company ID auto-assignment
  const handleSaveVehicle = (v: Vehicle) => {
    const compId = v.companyId || (activeCompanyId === 'all' ? (companies[0]?.id || 'comp-1') : activeCompanyId);
    const updatedVehicle = { ...v, companyId: compId };
    const updated = vehicles.some(existing => existing.id === v.id)
      ? vehicles.map(existing => existing.id === v.id ? updatedVehicle : existing)
      : [updatedVehicle, ...vehicles];
    
    setVehicles(updated);
    storage.saveVehicles(updated);
  };

  const handleDeleteVehicle = (vId: string) => {
    const updated = vehicles.filter(v => v.id !== vId);
    setVehicles(updated);
    storage.saveVehicles(updated);
  };

  const handleSaveDriver = (d: Driver) => {
    const compId = d.companyId || (activeCompanyId === 'all' ? (companies[0]?.id || 'comp-1') : activeCompanyId);
    const updatedDriver = { ...d, companyId: compId };
    const updated = drivers.some(existing => existing.id === d.id)
      ? drivers.map(existing => existing.id === d.id ? updatedDriver : existing)
      : [updatedDriver, ...drivers];
    
    setDrivers(updated);
    storage.saveDrivers(updated);
  };

  const handleDeleteDriver = (dId: string) => {
    const updated = drivers.filter(d => d.id !== dId);
    setDrivers(updated);
    storage.saveDrivers(updated);
  };

  const handleSaveCheckout = (session: CheckoutSession) => {
    const compId = session.companyId || (activeCompanyId === 'all' ? (companies[0]?.id || 'comp-1') : activeCompanyId);
    const updatedSession = { ...session, companyId: compId };
    const updated = [updatedSession, ...checkouts];
    setCheckouts(updated);
    storage.saveCheckoutSessions(updated);

    const updatedVehicles = vehicles.map(v => 
      v.id === session.vehicleId ? { ...v, status: 'checked_out' as const, mileage: session.checkoutOdometer } : v
    );
    setVehicles(updatedVehicles);
    storage.saveVehicles(updatedVehicles);
  };

  const handleReturnVehicle = (sessionId: string, returnData: Partial<CheckoutSession>) => {
    const updated = checkouts.map(c => {
      if (c.id === sessionId) {
        return { ...c, ...returnData };
      }
      return c;
    });

    setCheckouts(updated);
    storage.saveCheckoutSessions(updated);

    const session = checkouts.find(c => c.id === sessionId);
    if (session) {
      const newOdometer = returnData.returnOdometer || session.checkoutOdometer;
      const updatedVehicles = vehicles.map(v => 
        v.id === session.vehicleId ? { ...v, status: 'available' as const, mileage: newOdometer } : v
      );
      setVehicles(updatedVehicles);
      storage.saveVehicles(updatedVehicles);
    }
  };

  const handleSaveMaintenance = (record: MaintenanceRecord) => {
    const compId = record.companyId || (activeCompanyId === 'all' ? (companies[0]?.id || 'comp-1') : activeCompanyId);
    const updatedRecord = { ...record, companyId: compId };
    const exists = maintenance.some(m => m.id === record.id);
    const updated = exists ? maintenance.map(m => m.id === record.id ? updatedRecord : m) : [updatedRecord, ...maintenance];
    setMaintenance(updated);
    storage.saveMaintenanceRecords(updated);
  };

  const handleDeleteMaintenance = (mId: string) => {
    const updated = maintenance.filter(m => m.id !== mId);
    setMaintenance(updated);
    storage.saveMaintenanceRecords(updated);
  };

  const handleSaveGarage = (g: Garage) => {
    const compId = g.companyId || (activeCompanyId === 'all' ? (companies[0]?.id || 'comp-1') : activeCompanyId);
    const updatedGarage = { ...g, companyId: compId };
    const exists = garages.some(existing => existing.id === g.id);
    const updated = exists ? garages.map(existing => existing.id === g.id ? updatedGarage : existing) : [updatedGarage, ...garages];
    setGarages(updated);
    storage.saveGarages(updated);
  };

  const handleSaveFuel = (record: FuelRecord) => {
    const compId = record.companyId || (activeCompanyId === 'all' ? (companies[0]?.id || 'comp-1') : activeCompanyId);
    const updatedRecord = { ...record, companyId: compId };
    const exists = fuel.some(f => f.id === record.id);
    const updated = exists ? fuel.map(f => f.id === record.id ? record : f) : [updatedRecord, ...fuel];
    setFuel(updated);
    storage.saveFuelRecords(updated);
  };

  const handleDeleteFuel = (fId: string) => {
    const updated = fuel.filter(f => f.id !== fId);
    setFuel(updated);
    storage.saveFuelRecords(updated);
  };

  const handleSaveExpense = (record: ExpenseRecord) => {
    const compId = record.companyId || (activeCompanyId === 'all' ? (companies[0]?.id || 'comp-1') : activeCompanyId);
    const updatedRecord = { ...record, companyId: compId };
    const exists = expenses.some(e => e.id === record.id);
    const updated = exists ? expenses.map(e => e.id === record.id ? updatedRecord : e) : [updatedRecord, ...expenses];
    setExpenses(updated);
    storage.saveExpenseRecords(updated);
  };

  const handleDeleteExpense = (eId: string) => {
    const updated = expenses.filter(e => e.id !== eId);
    setExpenses(updated);
    storage.saveExpenseRecords(updated);
  };

  const handleSaveSettings = (newSettings: CompanySettings) => {
    const targetCompId = activeCompanyId === 'all' ? (companies[0]?.id || 'comp-1') : activeCompanyId;
    const updatedCompanies = companies.map(c => {
      if (c.id === targetCompId) {
        return {
          ...c,
          name: newSettings.companyName,
          tagline: newSettings.tagline,
          logoUrl: newSettings.logoUrl,
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

  const handleSaveDocuments = (docs: CompanyDocument[]) => {
    const compId = activeCompanyId === 'all' ? (companies[0]?.id || 'comp-1') : activeCompanyId;
    const docsWithComp = docs.map(d => ({ ...d, companyId: d.companyId || compId }));
    setDocuments(docsWithComp);
    storage.saveDocuments(docsWithComp);
  };

  const handlePrintReceipt = (session: CheckoutSession) => {
    setReceiptSession(session);
    setActiveTab('reports');
  };

  // Nav Items
  const navItems = [
    { id: 'dashboard', label: t('dashboard', lang), icon: LayoutDashboard },
    { id: 'vehicles', label: t('fleetVehicles', lang), icon: Car, count: vehicles.length },
    { id: 'drivers', label: t('driversLicenses', lang), icon: Users, count: drivers.length },
    { id: 'checkout', label: t('handoverSignature', lang), icon: KeyRound, highlight: true },
    { id: 'maintenance', label: t('maintenanceGarages', lang), icon: Wrench },
    { id: 'fuel', label: t('fuelExpenses', lang), icon: Fuel },
    { id: 'expiries', label: t('expiriesAlerts', lang), icon: ShieldAlert },
    { id: 'reports', label: t('printReports', lang), icon: Printer },
    { id: 'advisor', label: t('aiAdvisor', lang), icon: Sparkles },
    { id: 'settings', label: t('companySettings', lang), icon: Building2 },
  ];

  return (
    <div className={`min-h-screen bg-slate-100 dark:bg-[#0a0b0d] text-slate-800 dark:text-gray-200 font-sans transition-colors duration-200 ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`}>
      {/* Top Header Navbar - Hidden in Print */}
      <header className="no-print bg-white dark:bg-[#0f1115] text-slate-800 dark:text-white border-b border-slate-200 dark:border-gray-800 sticky top-0 z-40 shadow-xs dark:shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Company Name */}
          <div className="flex items-center gap-3">
            {currentCompanySettings.logoUrl ? (
              <img src={currentCompanySettings.logoUrl} alt="Logo" className="h-10 w-10 object-contain rounded-lg bg-slate-50 dark:bg-[#0a0b0d] p-1 border border-slate-200 dark:border-gray-800" />
            ) : (
              <div className="w-10 h-10 bg-[#cbb26a] text-black font-extrabold rounded-lg flex items-center justify-center text-xl shadow-xs">
                {currentCompanySettings.companyName.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-base font-bold leading-tight text-slate-900 dark:text-white tracking-wide">{currentCompanySettings.companyName}</h1>
              <p className="text-[11px] text-slate-500 dark:text-gray-400">
                {lang === 'ar' ? 'نظام إدارة الأسطول والاستلام والتوقيع الإلكتروني' : 'Enterprise Fleet & Handover Management System'}
              </p>
            </div>

            {/* Company Switcher Widget */}
            <div className="hidden sm:block border-s border-slate-200 dark:border-gray-800/80 ps-3 ms-1">
              <CompanySwitcher
                companies={companies}
                activeCompanyId={activeCompanyId}
                vehicles={vehicles}
                drivers={drivers}
                lang={lang}
                onSelectCompany={handleSelectCompany}
                onAddCompany={handleAddCompany}
                onManageCompanies={() => setActiveTab('settings')}
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Offline Mode & Auto Sync Badge */}
            <OfflineSyncBadge lang={lang} />

            {/* Language Toggle Button */}
            <button
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="px-3 py-1.5 bg-blue-600/10 dark:bg-blue-600/15 hover:bg-blue-600/20 text-blue-700 dark:text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
              title="Switch Language / التبديل بين اللغات"
            >
              <Languages className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{lang === 'en' ? 'العربية (AR)' : 'English (EN)'}</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => {
                setNotificationDrawerOpen(true);
                toastRef.current?.triggerCheckOnLogin();
              }}
              className="p-2 relative text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800/60 rounded-xl transition group"
              title={lang === 'ar' ? 'مركز الإشعارات' : 'Notifications'}
            >
              <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {activeAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center animate-pulse shadow-md border-2 border-white dark:border-[#0f1115]">
                  {activeAlertsCount}
                </span>
              )}
            </button>

            {/* Quick Check on Login Simulation */}
            <button
              onClick={() => {
                toastRef.current?.triggerCheckOnLogin();
              }}
              className="hidden md:flex px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold items-center gap-1.5 transition"
              title={lang === 'ar' ? 'فحص التنبيهات' : 'Check Alerts'}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'فحص التنبيهات' : 'Check Alerts'}</span>
            </button>

            {/* Quick Checkout Button */}
            <button
              onClick={() => setActiveTab('checkout')}
              className="hidden sm:flex px-4 py-2 bg-[#cbb26a] hover:bg-[#b89f57] text-black text-xs font-bold rounded-full uppercase tracking-wider items-center gap-1.5 transition shadow-xs"
            >
              <KeyRound className="w-4 h-4" />
              {lang === 'ar' ? 'استلام سيارة جديد +' : 'New Checkout +'}
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800/60 rounded-lg transition"
              title={darkMode ? (lang === 'ar' ? 'التبديل إلى الوضع الفاتح' : 'Switch to Light Mode') : (lang === 'ar' ? 'التبديل إلى الوضع الداكن' : 'Switch to Dark Mode')}
            >
              {darkMode ? <Sun className="w-5 h-5 text-[#cbb26a]" /> : <Moon className="w-5 h-5 text-slate-700" />}
            </button>

            <button
              onClick={() => {
                if (confirm(lang === 'ar' ? 'هل تريد إعادة تعيين كافة البيانات إلى النموذج الافتراضي؟' : 'Reset all data to sample defaults?')) {
                  storage.resetToDefaults();
                }
              }}
              className="p-2 text-slate-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-[#cbb26a] hover:bg-slate-100 dark:hover:bg-gray-800/60 rounded-lg transition text-xs flex items-center gap-1"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden md:inline">{lang === 'ar' ? 'إعادة ضبط' : 'Reset'}</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 lg:hidden text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Navigation Tabs Horizontal Bar - Desktop */}
        <div className="hidden lg:block bg-slate-50 dark:bg-[#0a0b0d]/90 border-t border-slate-200 dark:border-gray-800/80 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-1.5">
            {navItems.map(item => {
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
                  {item.count !== undefined && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-[#cbb26a]/20 text-amber-900 dark:text-[#cbb26a]' : item.highlight ? 'bg-black/20 text-black' : 'bg-slate-200 dark:bg-gray-800 text-slate-700 dark:text-gray-300'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white dark:bg-[#0f1115] border-b border-slate-200 dark:border-gray-800 px-4 py-3 space-y-1">
            {navItems.map(item => {
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
            })}
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            vehicles={filteredVehicles}
            drivers={filteredDrivers}
            maintenance={filteredMaintenance}
            fuel={filteredFuel}
            checkouts={filteredCheckouts}
            settings={currentCompanySettings}
            onNavigateTab={setActiveTab}
            lang={lang}
          />
        )}

        {activeTab === 'vehicles' && (
          <VehiclesView
            vehicles={filteredVehicles}
            drivers={filteredDrivers}
            onSaveVehicle={handleSaveVehicle}
            onDeleteVehicle={handleDeleteVehicle}
            lang={lang}
          />
        )}

        {activeTab === 'drivers' && (
          <DriversView
            drivers={filteredDrivers}
            vehicles={filteredVehicles}
            onSaveDriver={handleSaveDriver}
            onDeleteDriver={handleDeleteDriver}
            lang={lang}
          />
        )}

        {activeTab === 'checkout' && (
          <CheckoutHub
            vehicles={filteredVehicles}
            drivers={filteredDrivers}
            checkouts={filteredCheckouts}
            settings={currentCompanySettings}
            onSaveCheckout={handleSaveCheckout}
            onReturnVehicle={handleReturnVehicle}
            onPrintReceipt={handlePrintReceipt}
            lang={lang}
          />
        )}

        {activeTab === 'maintenance' && (
          <MaintenanceView
            maintenance={filteredMaintenance}
            vehicles={filteredVehicles}
            garages={filteredGarages}
            onSaveMaintenance={handleSaveMaintenance}
            onDeleteMaintenance={handleDeleteMaintenance}
            onSaveGarage={handleSaveGarage}
            lang={lang}
          />
        )}

        {activeTab === 'fuel' && (
          <FuelExpensesView
            fuel={filteredFuel}
            expenses={filteredExpenses}
            vehicles={filteredVehicles}
            drivers={filteredDrivers}
            checkouts={filteredCheckouts}
            garages={filteredGarages}
            maintenance={filteredMaintenance}
            onSaveFuel={handleSaveFuel}
            onDeleteFuel={handleDeleteFuel}
            onSaveExpense={handleSaveExpense}
            onDeleteExpense={handleDeleteExpense}
            onSaveMaintenance={handleSaveMaintenance}
            lang={lang}
          />
        )}

        {activeTab === 'expiries' && (
          <ExpiriesView
            vehicles={filteredVehicles}
            drivers={filteredDrivers}
            onSaveVehicle={handleSaveVehicle}
            lang={lang}
          />
        )}

        {activeTab === 'reports' && (
          <PrintReportsView
            settings={currentCompanySettings}
            vehicles={filteredVehicles}
            drivers={filteredDrivers}
            maintenance={filteredMaintenance}
            fuel={filteredFuel}
            checkouts={filteredCheckouts}
            activeReceiptSession={receiptSession}
            onClearReceiptSession={() => setReceiptSession(null)}
            onSaveSettings={handleSaveSettings}
            lang={lang}
          />
        )}

        {activeTab === 'advisor' && (
          <AIFleetAdvisor
            vehicles={filteredVehicles}
            drivers={filteredDrivers}
            maintenance={filteredMaintenance}
            fuel={filteredFuel}
            settings={currentCompanySettings}
            onSaveVehicle={handleSaveVehicle}
            onNavigateTab={setActiveTab}
            lang={lang}
          />
        )}

        {activeTab === 'settings' && (
          <CompanySettingsView
            settings={currentCompanySettings}
            documents={filteredDocuments}
            vehicles={filteredVehicles}
            drivers={filteredDrivers}
            maintenance={filteredMaintenance}
            fuel={filteredFuel}
            checkouts={filteredCheckouts}
            garages={filteredGarages}
            expenses={filteredExpenses}
            lang={lang}
            companies={companies}
            activeCompanyId={activeCompanyId}
            onSave={handleSaveSettings}
            onSaveDocuments={handleSaveDocuments}
            onSelectCompany={handleSelectCompany}
            onAddCompany={handleAddCompany}
            onDeleteCompany={handleDeleteCompany}
          />
        )}
      </main>

      {/* IN-APP TOAST NOTIFICATIONS & ALERT DRAWER */}
      <ToastNotifications
        ref={toastRef}
        vehicles={vehicles}
        drivers={drivers}
        maintenance={maintenance}
        onNavigateTab={(tab) => setActiveTab(tab)}
        isOpenDrawer={notificationDrawerOpen}
        onCloseDrawer={() => setNotificationDrawerOpen(false)}
        lang={lang}
      />
    </div>
  );
}
