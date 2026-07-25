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
  LogOut
} from 'lucide-react';

// ============================================================
// مكون تسجيل الدخول (Login)
// ============================================================
const LoginScreen: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      onLogin();
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-[#0a0b0d] p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-8 border border-slate-200 dark:border-slate-800">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#cbb26a] text-black font-extrabold rounded-xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-md">
            Y
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">YAMANIX</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">نظام إدارة الأسطول</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-[#cbb26a] focus:outline-none"
              placeholder="example@company.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">كلمة المرور</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-[#cbb26a] focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs font-medium border border-rose-200 dark:border-rose-800/50">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#cbb26a] hover:bg-[#b89f57] text-black font-extrabold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>جاري تسجيل الدخول...</>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                تسجيل الدخول
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-4">
          تواصل مع المسؤول للحصول على حساب
        </div>
      </div>
    </div>
  );
};

// ============================================================
// مكون إدارة المستخدمين (للوحة التحكم)
// ============================================================
const UserManagement: React.FC<{ profile: Profile }> = ({ profile }) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
        email: newUserEmail,
        password: newUserPassword,
        email_confirm: true,
      });
      if (signUpError) throw signUpError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: newUserEmail,
            role: newUserRole,
            full_name: newUserEmail.split('@')[0],
          });
        if (profileError) throw profileError;
      }

      await loadUsers();
      setShowAddModal(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('user');
    } catch (err: any) {
      alert('فشل إضافة المستخدم: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    if (!confirm('تأكيد تغيير صلاحية المستخدم؟')) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      if (error) throw error;
      await loadUsers();
    } catch (err: any) {
      alert('فشل تحديث الصلاحية: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم نهائياً؟')) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
      await loadUsers();
    } catch (err: any) {
      alert('فشل حذف المستخدم: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">جاري تحميل المستخدمين...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCog className="w-6 h-6 text-blue-600" />
            إدارة المستخدمين والصلاحيات
          </h2>
          <p className="text-xs text-slate-500">إضافة وتعديل صلاحيات المستخدمين في النظام</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2"
        >
          <Users className="w-4 h-4" /> إضافة مستخدم جديد
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-xs font-bold">
            <tr>
              <th className="p-4">البريد الإلكتروني</th>
              <th className="p-4">الاسم</th>
              <th className="p-4">الصلاحية</th>
              <th className="p-4">تاريخ التسجيل</th>
              <th className="p-4">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                <td className="p-4 font-mono text-xs text-slate-700 dark:text-slate-300">{u.email}</td>
                <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{u.full_name || '-'}</td>
                <td className="p-4">
                  {u.id === profile.id ? (
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">أنت (أدمن)</span>
                  ) : (
                    <select
                      value={u.role}
                      onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                      disabled={actionLoading || u.id === profile.id}
                      className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold"
                    >
                      <option value="admin">أدمن</option>
                      <option value="manager">مدير</option>
                      <option value="user">مستخدم</option>
                      <option value="disabled">معطل</option>
                    </select>
                  )}
                </td>
                <td className="p-4 text-xs text-slate-500 font-mono">
                  {new Date(u.created_at).toLocaleDateString('ar-SA')}
                </td>
                <td className="p-4">
                  {u.id !== profile.id && (
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      disabled={actionLoading}
                      className="text-rose-500 hover:text-rose-700 text-xs font-bold"
                    >
                      حذف
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">إضافة مستخدم جديد</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">البريد الإلكتروني *</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm"
                  placeholder="user@company.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">كلمة المرور *</label>
                <input
                  type="password"
                  required
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الصلاحية</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm"
                >
                  <option value="user">مستخدم</option>
                  <option value="manager">مدير</option>
                  <option value="admin">أدمن</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs shadow transition disabled:opacity-50"
                >
                  {actionLoading ? 'جاري الإضافة...' : 'إضافة المستخدم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// المكون الرئيسي App
// ============================================================
export default function App() {
  // ===== اللغة =====
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('fleet_language') as Language;
    return saved || 'en'; // افتراضي إنجليزي
  });

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

  // ============================================================
  // حفظ اللغة في localStorage عند تغييرها
  // ============================================================
  useEffect(() => {
    localStorage.setItem('fleet_language', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // ============================================================
  // جلسة المستخدم
  // ============================================================
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
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
  // تحميل البيانات (عند تسجيل الدخول)
  // ============================================================
  useEffect(() => {
    if (!session) return;
    const loadData = async () => {
      try {
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
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    loadData();
  }, [session]);

  // ============================================================
  // دوال إدارة الشركات
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
    
    // إعادة تحميل الصفحة لتحديث جميع المكونات
    setTimeout(() => window.location.reload(), 500);
  };

  // ============================================================
  // دوال أخرى (ملخصة)
  // ============================================================
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

  // تصفية البيانات حسب الشركة النشطة
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

  // التنبيهات
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

  // دوال الحفظ (مختصرة)
  const getCurrentUserId = () => session?.user?.id;

  const handleSaveVehicle = async (v: Vehicle) => {
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
    const updated = vehicles.filter(v => v.id !== id);
    setVehicles(updated);
    await storage.saveVehicles(updated);
  };

  const handleSaveDriver = async (d: Driver) => {
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
    const updated = drivers.filter(d => d.id !== id);
    setDrivers(updated);
    await storage.saveDrivers(updated);
  };

  // تسجيل الخروج
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    localStorage.removeItem('fleet_active_company');
  };

  // ============================================================
  // شاشة التحميل والمصادقة
  // ============================================================
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-[#0a0b0d]">جاري التحميل...</div>;
  }

  if (!session) {
    return <LoginScreen onLogin={() => {}} />;
  }

  // ============================================================
  // قائمة التبويبات (مع حماية الصلاحيات)
  // ============================================================
  const navItems = [
    { id: 'dashboard', label: t('dashboard', lang), icon: LayoutDashboard, allowed: ['admin', 'manager', 'user'] },
    { id: 'vehicles', label: t('fleetVehicles', lang), icon: Car, allowed: ['admin', 'manager', 'user'] },
    { id: 'drivers', label: t('driversLicenses', lang), icon: Users, allowed: ['admin', 'manager', 'user'] },
    { id: 'checkout', label: t('handoverSignature', lang), icon: KeyRound, highlight: true, allowed: ['admin', 'manager', 'user'] },
    { id: 'maintenance', label: t('maintenanceGarages', lang), icon: Wrench, allowed: ['admin', 'manager', 'user'] },
    { id: 'fuel', label: t('fuelExpenses', lang), icon: Fuel, allowed: ['admin', 'manager', 'user'] },
    { id: 'expiries', label: t('expiriesAlerts', lang), icon: ShieldAlert, allowed: ['admin', 'manager', 'user'] },
    { id: 'reports', label: t('printReports', lang), icon: Printer, allowed: ['admin', 'manager', 'user'] },
    { id: 'advisor', label: t('aiAdvisor', lang), icon: Sparkles, allowed: ['admin', 'manager', 'user'] },
    { id: 'settings', label: t('companySettings', lang), icon: Building2, allowed: ['admin', 'manager', 'user'] },
    { id: 'users', label: 'إدارة المستخدمين', icon: UserCog, allowed: ['admin'] },
  ];

  const currentNavItem = navItems.find(item => item.id === activeTab);
  const isAllowed = currentNavItem ? currentNavItem.allowed.includes(profile?.role || 'user') : false;

  // ============================================================
  // التصيير الرئيسي
  // ============================================================
  return (
    <div className={`min-h-screen bg-slate-100 dark:bg-[#0a0b0d] text-slate-800 dark:text-gray-200 font-sans transition-colors duration-200 ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`}>
      <header className="no-print bg-white dark:bg-[#0f1115] text-slate-800 dark:text-white border-b border-slate-200 dark:border-gray-800 sticky top-0 z-40 shadow-xs dark:shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
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
              <p className="text-[11px] text-slate-500 dark:text-gray-400 flex items-center gap-2">
                {lang === 'ar' ? 'نظام إدارة الأسطول' : 'Fleet Management'}
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-[10px] font-bold">
                  {profile?.role === 'admin' ? 'أدمن' : profile?.role === 'manager' ? 'مدير' : 'مستخدم'}
                </span>
              </p>
            </div>
            <div className="hidden sm:block border-s border-slate-200 dark:border-gray-800/80 ps-3 ms-1">
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

          <div className="flex items-center gap-2">
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

            <button onClick={handleLogout} className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition" title="تسجيل الخروج">
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
          <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-1.5">
            {navItems.map(item => {
              if (!item.allowed.includes(profile?.role || 'user')) return null;
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
            })}
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden bg-white dark:bg-[#0f1115] border-b border-slate-200 dark:border-gray-800 px-4 py-3 space-y-1">
            {navItems.map(item => {
              if (!item.allowed.includes(profile?.role || 'user')) return null;
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!isAllowed && activeTab !== 'dashboard' ? (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/50 rounded-2xl p-8 text-center text-amber-800 dark:text-amber-300">
            <Shield className="w-12 h-12 mx-auto mb-4 text-amber-500" />
            <h3 className="text-lg font-bold">غير مصرح لك بالدخول إلى هذه الصفحة</h3>
            <p className="text-sm mt-2">صلاحياتك الحالية لا تسمح بعرض هذا المحتوى.</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && <DashboardView vehicles={filteredVehicles} drivers={filteredDrivers} maintenance={filteredMaintenance} fuel={filteredFuel} checkouts={filteredCheckouts} settings={currentCompanySettings} onNavigateTab={setActiveTab} lang={lang} />}
            {activeTab === 'vehicles' && <VehiclesView vehicles={filteredVehicles} drivers={filteredDrivers} onSaveVehicle={handleSaveVehicle} onDeleteVehicle={handleDeleteVehicle} lang={lang} />}
            {activeTab === 'drivers' && <DriversView drivers={filteredDrivers} vehicles={filteredVehicles} onSaveDriver={handleSaveDriver} onDeleteDriver={handleDeleteDriver} lang={lang} />}
            {activeTab === 'checkout' && <CheckoutHub vehicles={filteredVehicles} drivers={filteredDrivers} checkouts={filteredCheckouts} settings={currentCompanySettings} onSaveCheckout={async (session) => { const updated = [session, ...checkouts]; setCheckouts(updated); await storage.saveCheckoutSessions(updated); }} onReturnVehicle={async (sessionId, data) => { const updated = checkouts.map(c => c.id === sessionId ? { ...c, ...data } : c); setCheckouts(updated); await storage.saveCheckoutSessions(updated); }} onPrintReceipt={setReceiptSession} lang={lang} />}
            {activeTab === 'maintenance' && <MaintenanceView maintenance={filteredMaintenance} vehicles={filteredVehicles} garages={filteredGarages} onSaveMaintenance={async (record) => { const updated = [record, ...maintenance]; setMaintenance(updated); await storage.saveMaintenanceRecords(updated); }} onDeleteMaintenance={async (id) => { const updated = maintenance.filter(m => m.id !== id); setMaintenance(updated); await storage.saveMaintenanceRecords(updated); }} onSaveGarage={async (g) => { const updated = [g, ...garages]; setGarages(updated); await storage.saveGarages(updated); }} lang={lang} />}
            {activeTab === 'fuel' && <FuelExpensesView fuel={filteredFuel} expenses={filteredExpenses} vehicles={filteredVehicles} drivers={filteredDrivers} checkouts={filteredCheckouts} garages={filteredGarages} maintenance={filteredMaintenance} onSaveFuel={async (f) => { const updated = [f, ...fuel]; setFuel(updated); await storage.saveFuelRecords(updated); }} onDeleteFuel={async (id) => { const updated = fuel.filter(f => f.id !== id); setFuel(updated); await storage.saveFuelRecords(updated); }} onSaveExpense={async (e) => { const updated = [e, ...expenses]; setExpenses(updated); await storage.saveExpenseRecords(updated); }} onDeleteExpense={async (id) => { const updated = expenses.filter(e => e.id !== id); setExpenses(updated); await storage.saveExpenseRecords(updated); }} onSaveMaintenance={async (record) => { const updated = [record, ...maintenance]; setMaintenance(updated); await storage.saveMaintenanceRecords(updated); }} lang={lang} />}
            {activeTab === 'expiries' && <ExpiriesView vehicles={filteredVehicles} drivers={filteredDrivers} onSaveVehicle={handleSaveVehicle} lang={lang} />}
            {activeTab === 'reports' && <PrintReportsView settings={currentCompanySettings} vehicles={filteredVehicles} drivers={filteredDrivers} maintenance={filteredMaintenance} fuel={filteredFuel} checkouts={filteredCheckouts} activeReceiptSession={receiptSession} onClearReceiptSession={() => setReceiptSession(null)} onSaveSettings={(newSettings) => { setSettings(newSettings); storage.saveSettings(newSettings); }} lang="en" />}
            {activeTab === 'advisor' && <AIFleetAdvisor vehicles={filteredVehicles} drivers={filteredDrivers} maintenance={filteredMaintenance} fuel={filteredFuel} settings={currentCompanySettings} onSaveVehicle={handleSaveVehicle} onNavigateTab={setActiveTab} lang={lang} />}
            {activeTab === 'settings' && <CompanySettingsView settings={currentCompanySettings} documents={filteredDocuments} vehicles={filteredVehicles} drivers={filteredDrivers} maintenance={filteredMaintenance} fuel={filteredFuel} checkouts={filteredCheckouts} garages={filteredGarages} expenses={filteredExpenses} lang={lang} companies={companies} activeCompanyId={activeCompanyId} onSave={(newSettings) => { setSettings(newSettings); storage.saveSettings(newSettings); }} onSaveDocuments={async (docs) => { setDocuments(docs); await storage.saveDocuments(docs); }} onSelectCompany={handleSelectCompany} onAddCompany={handleAddCompany} onDeleteCompany={handleDeleteCompany} />}
            {activeTab === 'users' && profile?.role === 'admin' && <UserManagement profile={profile} />}
          </>
        )}
      </main>

      <ToastNotifications ref={toastRef} vehicles={vehicles} drivers={drivers} maintenance={maintenance} onNavigateTab={setActiveTab} isOpenDrawer={notificationDrawerOpen} onCloseDrawer={() => setNotificationDrawerOpen(false)} lang={lang} />
    </div>
  );
}