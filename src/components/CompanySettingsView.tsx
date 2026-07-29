import React, { useState } from 'react';
import { CompanySettings, Vehicle, Driver, MaintenanceRecord, FuelRecord, CheckoutSession, Garage, ExpenseRecord, CompanyDocument, Company } from '../types';
import { Building2, Upload, Save, CheckCircle, Image, Phone, Mail, MapPin, FileText, Download, FileSpreadsheet, Database, Car, Wrench, Fuel, Users, KeyRound, Camera, ShieldCheck, Coins, Plus, Trash2, Check, Layers, Sparkles } from 'lucide-react';
import { 
  exportVehiclesToCSV, 
  exportMaintenanceToCSV, 
  exportFuelToCSV, 
  exportDriversToCSV, 
  exportCheckoutsToCSV, 
  exportFullBackupJSON,
  exportBulkDataCSV
} from '../lib/csvExport';
import { CompanyDocumentVault } from './CompanyDocumentVault';
import { Language, t } from '../lib/i18n';

interface CompanySettingsViewProps {
  settings: CompanySettings;
  documents?: CompanyDocument[];
  vehicles?: Vehicle[];
  drivers?: Driver[];
  maintenance?: MaintenanceRecord[];
  fuel?: FuelRecord[];
  checkouts?: CheckoutSession[];
  garages?: Garage[];
  expenses?: ExpenseRecord[];
  lang?: Language;
  companies?: Company[];
  activeCompanyId?: string;
  onSave: (newSettings: CompanySettings) => void;
  onSaveDocuments?: (documents: CompanyDocument[]) => void;
  onSelectCompany?: (id: string) => void;
  onAddCompany?: (company: Company) => void;
  onDeleteCompany?: (id: string) => void;
}

export const CompanySettingsView: React.FC<CompanySettingsViewProps> = ({ 
  settings, 
  documents = [],
  vehicles = [], 
  drivers = [], 
  maintenance = [], 
  fuel = [], 
  checkouts = [], 
  garages = [], 
  expenses = [], 
  lang = 'en',
  companies = [],
  activeCompanyId = 'comp-1',
  onSave,
  onSaveDocuments = (_documents: CompanyDocument[]) => {},
  onSelectCompany = (_id: string) => {},
  onAddCompany = (_company: Company) => {},
  onDeleteCompany = (_id: string) => {}
}) => {
  const isAr = lang === 'ar';
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'companies' | 'vault'>('general');
  const [form, setForm] = useState<CompanySettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [newCompanyForm, setNewCompanyForm] = useState<Partial<Company>>({
    name: '',
    code: '',
    phone: '',
    email: '',
    commercialRegNumber: '',
    tagline: '',
    currency: 'SAR'
  });

  // تحديث النموذج عندما تتغير الإعدادات من الخارج
  React.useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleCreateCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyForm.name?.trim()) return;

    const newComp: Company = {
      id: `comp-${Date.now()}`,
      name: newCompanyForm.name.trim(),
      code: (newCompanyForm.code || newCompanyForm.name.substring(0, 3)).toUpperCase().trim(),
      tagline: newCompanyForm.tagline?.trim() || (isAr ? 'شركة جديدة لإدارة الأسطول' : 'New Fleet Company'),
      phone: newCompanyForm.phone?.trim() || '',
      email: newCompanyForm.email?.trim() || '',
      commercialRegNumber: newCompanyForm.commercialRegNumber?.trim() || '',
      currency: newCompanyForm.currency || 'SAR',
      logoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString()
    };

    onAddCompany(newComp);
    onSelectCompany(newComp.id);
    setShowAddCompanyModal(false);
    setNewCompanyForm({
      name: '',
      code: '',
      phone: '',
      email: '',
      commercialRegNumber: '',
      tagline: '',
      currency: 'SAR'
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Sub-Tab Navigation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-sm flex items-center gap-2">
        <button
          onClick={() => setActiveSubTab('general')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeSubTab === 'general'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          {t('generalSettings', lang)}
        </button>

        <button
          onClick={() => setActiveSubTab('companies')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeSubTab === 'companies'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          {t('multiCompany', lang)}
          {companies.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-white text-[10px] font-extrabold border border-blue-400/30">
              {companies.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('vault')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeSubTab === 'vault'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Camera className="w-4 h-4" />
          {t('docVaultTab', lang)}
          {documents.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-white text-[10px] font-extrabold border border-blue-400/30">
              {documents.length}
            </span>
          )}
        </button>
      </div>

      {activeSubTab === 'vault' ? (
        <CompanyDocumentVault
          documents={documents}
          vehicles={vehicles}
          drivers={drivers}
          lang={lang}
          onSaveDocuments={onSaveDocuments}
        />
      ) : activeSubTab === 'companies' ? (
        /* Multi-Company Management */
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-400/30 rounded-full text-[10px] font-mono font-bold uppercase">
                  Multi-Tenant Fleet
                </span>
              </div>
              <h2 className="text-xl font-black mt-1 flex items-center gap-2">
                <Layers className="w-6 h-6 text-blue-400" />
                {t('multiCompany', lang)}
              </h2>
              <p className="text-slate-300 text-xs mt-1">
                {isAr
                  ? 'يمكنك إضافة شركتين أو أكثر وتخصيص سيارات وسائقين وفواتير وتقارير منفصلة تماماً لكل شركة.'
                  : 'Manage multiple isolated companies, each with its own fleet, drivers, invoices, and reports.'}
              </p>
            </div>

            <button
              onClick={() => setShowAddCompanyModal(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {isAr ? 'إضافة شركة جديدة' : 'Add New Company'}
            </button>
          </div>

          {/* Companies Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {companies.map(comp => {
              const compVehicles = vehicles.filter(v => (v.companyId || 'comp-1') === comp.id);
              const compDrivers = drivers.filter(d => (d.companyId || 'comp-1') === comp.id);
              const isCurrentActive = activeCompanyId === comp.id;

              return (
                <div
                  key={comp.id}
                  className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm space-y-4 transition ${
                    isCurrentActive
                      ? 'border-blue-500 ring-2 ring-blue-500/20 dark:border-blue-500'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-blue-500 overflow-hidden shrink-0">
                        {comp.logoUrl ? (
                          <img src={comp.logoUrl} alt={comp.name} className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                            {comp.name}
                          </h3>
                          {comp.code && (
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono font-bold">
                              {comp.code}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {comp.tagline || (isAr ? 'لا يوجد وصف' : 'No description')}
                        </p>
                      </div>
                    </div>

                    {isCurrentActive ? (
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-full text-[11px] font-bold flex items-center gap-1.5 shrink-0">
                        <Check className="w-3.5 h-3.5" />
                        {isAr ? 'الشركة النشطة الآن' : 'Active Company'}
                      </span>
                    ) : (
                      <button
                        onClick={() => onSelectCompany(comp.id)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 rounded-xl text-xs font-bold transition shrink-0"
                      >
                        {isAr ? 'تفعيل الشركة' : 'Switch To'}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-100 dark:border-slate-800/80 text-xs">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-blue-500" />
                      <div>
                        <span className="text-slate-400 block text-[10px]">{isAr ? 'السيارات' : 'Vehicles'}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{compVehicles.length} {isAr ? 'مركبة' : 'vehicles'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-500" />
                      <div>
                        <span className="text-slate-400 block text-[10px]">{isAr ? 'السائقون' : 'Drivers'}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{compDrivers.length} {isAr ? 'سائق' : 'drivers'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                    {comp.commercialRegNumber && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span>{isAr ? 'السجل التجاري/الضريبي:' : 'CR / VAT:'}</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{comp.commercialRegNumber}</span>
                      </div>
                    )}
                    {comp.phone && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span>{isAr ? 'رقم الهاتف:' : 'Phone:'}</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">{comp.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px]">
                      <span>{isAr ? 'العملة المعتمدة:' : 'Currency:'}</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{comp.currency || 'SAR'}</span>
                    </div>
                  </div>

                  {!isCurrentActive && companies.length > 1 && (
                    <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => {
                          if (window.confirm(isAr ? `هل أنت تأكد من حذف بيانات شركة (${comp.name})؟` : `Are you sure you want to delete company ${comp.name}?`)) {
                            onDeleteCompany(comp.id);
                          }
                        }}
                        className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {isAr ? 'حذف الشركة' : 'Delete Company'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Company Modal */}
          {showAddCompanyModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#0f1117] border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
                <div className="p-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white">
                        {isAr ? 'إضافة شركة جديدة' : 'Add New Company'}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {isAr ? 'إنشاء ملف شركة مستقل جديد' : 'Create an independent company profile'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddCompanyModal(false)}
                    className="p-2 rounded-xl bg-slate-800 text-gray-400 hover:text-white transition"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateCompanySubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">
                      {isAr ? 'اسم الشركة *' : 'Company Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={isAr ? 'شركة مسار الشحن اللوجستي' : 'e.g. Freight Corp'}
                      value={newCompanyForm.name}
                      onChange={e => setNewCompanyForm({ ...newCompanyForm, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">
                        {isAr ? 'كود اختصاري' : 'Short Code'}
                      </label>
                      <input
                        type="text"
                        maxLength={5}
                        placeholder="MSR"
                        value={newCompanyForm.code}
                        onChange={e => setNewCompanyForm({ ...newCompanyForm, code: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">
                        {isAr ? 'العملة المعتمدة' : 'Currency'}
                      </label>
                      <select
                        value={newCompanyForm.currency}
                        onChange={e => setNewCompanyForm({ ...newCompanyForm, currency: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-hidden"
                      >
                        <option value="SAR">SAR (ريال سعودي)</option>
                        <option value="AED">AED (درهم إماراتي)</option>
                        <option value="USD">USD (دولار أمريكي)</option>
                        <option value="EUR">EUR (يورو)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">
                        {isAr ? 'السجل التجاري/الضريبي' : 'Commercial Reg / VAT'}
                      </label>
                      <input
                        type="text"
                        placeholder="CR-1010002233"
                        value={newCompanyForm.commercialRegNumber}
                        onChange={e => setNewCompanyForm({ ...newCompanyForm, commercialRegNumber: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">
                        {isAr ? 'رقم الهاتف' : 'Phone'}
                      </label>
                      <input
                        type="text"
                        placeholder="+966 50 000 0000"
                        value={newCompanyForm.phone}
                        onChange={e => setNewCompanyForm({ ...newCompanyForm, phone: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddCompanyModal(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-800 text-gray-400 hover:text-white hover:bg-slate-800 text-xs font-bold transition"
                    >
                      {isAr ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm"
                    >
                      {isAr ? 'حفظ وإضافة' : 'Save Company'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* General Settings */
        <div className="space-y-6">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Building2 className="w-6 h-6 text-blue-400" />
                {t('companySettingsTitle', lang)}
              </h2>
              <p className="text-slate-300 text-xs mt-1">
                {t('companySettingsSub', lang)}
              </p>
            </div>
          </div>

          {savedSuccess && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-xs">
                  {isAr ? 'تم حفظ إعدادات هوية الشركة بنجاح!' : t('settingsSaved', lang)}
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  {isAr ? 'ستظهر التغييرات فوراً في القوائم والتقارير المطبوعة والإيصالات.' : 'Changes will apply across all screens and print receipts immediately.'}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Settings Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 border-b pb-3 border-slate-100 dark:border-slate-800">
                  {isAr ? 'معلومات الشركة الأساسية' : 'Basic Company Profile'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t('companyNameLabel', lang)} *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.companyName}
                      onChange={e => setForm({ ...form, companyName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t('taglineLabel', lang)}
                    </label>
                    <input
                      type="text"
                      value={form.tagline}
                      onChange={e => setForm({ ...form, tagline: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-blue-600" /> {t('phoneLabel', lang)}
                    </label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-blue-600" /> {t('emailLabel', lang)}
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" /> {t('addressLabel', lang)}
                    </label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={e => setForm({ ...form, address: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-blue-600" /> {t('taxRegLabel', lang)}
                    </label>
                    <input
                      type="text"
                      value={form.commercialRegNumber}
                      onChange={e => setForm({ ...form, commercialRegNumber: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                    />
                  </div>
                </div>

                {/* Currency Setting */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-500" />
                    {t('currencyLabel', lang)}
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                    {t('currencyDescription', lang)}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <select
                        value={['SAR', 'AED', 'USD', 'EUR', 'EGP', 'QAR', 'KWD', 'BHD', 'OMR', 'JOD'].includes((form.currency || 'SAR').toUpperCase()) ? (form.currency || 'SAR').toUpperCase() : 'CUSTOM'}
                        onChange={e => {
                          if (e.target.value !== 'CUSTOM') {
                            setForm({ ...form, currency: e.target.value });
                          }
                        }}
                        className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 font-bold"
                      >
                        <option value="SAR">SAR - Saudi Riyal (ر.س)</option>
                        <option value="AED">AED - UAE Dirham (د.إ)</option>
                        <option value="USD">USD - US Dollar ($)</option>
                        <option value="EUR">EUR - Euro (€)</option>
                        <option value="EGP">EGP - Egyptian Pound (ج.م)</option>
                        <option value="QAR">QAR - Qatari Riyal (ر.ق)</option>
                        <option value="KWD">KWD - Kuwaiti Dinar (د.ك)</option>
                        <option value="BHD">BHD - Bahraini Dinar (د.ب)</option>
                        <option value="OMR">OMR - Omani Rial (ر.ع)</option>
                        <option value="JOD">JOD - Jordanian Dinar (د.أ)</option>
                        <option value="CUSTOM">{isAr ? 'رمز أو كتابة مخصصة...' : 'Custom Currency...'}</option>
                      </select>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={form.currency || ''}
                        onChange={e => setForm({ ...form, currency: e.target.value })}
                        placeholder={isAr ? 'رمز العملة (مثال: SAR, USD, $, ر.س)' : 'Currency code (e.g. SAR, USD, $, EUR)'}
                        className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 border-b pb-3 border-slate-100 dark:border-slate-800">
                  {isAr ? 'نصوص التقارير المطبوعة والإيصالات' : 'Print Headers & Receipt Footers'}
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t('printHeaderNoteLabel', lang)}
                  </label>
                  <input
                    type="text"
                    value={form.printHeaderNote || ''}
                    onChange={e => setForm({ ...form, printHeaderNote: e.target.value })}
                    placeholder={isAr ? 'نص رأس التقرير المطبوع' : 'Print header note text'}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t('printFooterNoteLabel', lang)}
                  </label>
                  <textarea
                    rows={2}
                    value={form.printFooterNote || ''}
                    onChange={e => setForm({ ...form, printFooterNote: e.target.value })}
                    placeholder={isAr ? 'نص تذييل التقرير المطبوع' : 'Print footer note text'}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {t('saveSettings', lang)}
              </button>
            </div>

            {/* Logo Upload & Live Preview */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Image className="w-4 h-4 text-blue-600" />
                  {t('logoUpload', lang)}
                </h3>

                <div className="text-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  {form.logoUrl ? (
                    <div className="space-y-3">
                      <img
                        src={form.logoUrl}
                        alt="Logo"
                        className="max-h-24 mx-auto object-contain rounded border p-2 bg-white shadow-sm"
                      />
                    </div>
                  ) : (
                    <div className="py-4 text-slate-400">
                      <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    </div>
                  )}

                  <div className="mt-4 flex flex-col gap-2">
                    <label className="cursor-pointer bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 font-semibold text-xs px-3 py-2 rounded-xl transition flex items-center justify-center gap-1.5 border border-blue-200 dark:border-blue-800">
                      <Upload className="w-3.5 h-3.5" />
                      {t('uploadLogo', lang)}
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>

                    <input
                      type="text"
                      value={form.logoUrl}
                      onChange={e => setForm({ ...form, logoUrl: e.target.value })}
                      placeholder="https://example.com/logo.png"
                      className="w-full px-2 py-1.5 text-xs border rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 space-y-4">
                <h4 className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                  {t('livePreview', lang)}
                </h4>

                <div className="bg-white text-slate-900 p-4 rounded-xl shadow border text-right space-y-3">
                  <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                    <div className="flex items-center gap-3">
                      {form.logoUrl ? (
                        <img src={form.logoUrl} alt="Logo" className="h-10 w-10 object-contain rounded" />
                      ) : (
                        <div className="w-10 h-10 bg-blue-600 text-white font-bold rounded flex items-center justify-center text-lg">
                          {form.companyName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h2 className="text-xs font-bold">{form.companyName || 'Company Name'}</h2>
                        <p className="text-[10px] text-slate-500">{form.tagline || 'Tagline'}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-600 italic border-b pb-2 border-slate-100">
                    "{form.printHeaderNote || t('printHeaderNoteLabel', lang)}"
                  </p>

                  <div className="text-[10px] text-slate-500 text-center pt-1">
                    {form.printFooterNote || t('printFooterNoteLabel', lang)}
                  </div>
                </div>
              </div>
            </div>
          </form>

          {/* Bulk Export */}
          <div className="bg-[#0f1115] border border-gray-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-gray-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-[#cbb26a]" />
                  {t('exportBackup', lang)}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {t('exportBackupDescription', lang)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => exportBulkDataCSV({ vehicles, drivers, maintenance, fuel, checkouts, garages, expenses, settings })}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  {t('bulkCSV', lang)}
                </button>

                <button
                  type="button"
                  onClick={() => exportFullBackupJSON({ vehicles, drivers, maintenance, fuel, checkouts, garages, expenses, settings })}
                  className="px-4 py-2.5 bg-[#cbb26a] hover:bg-[#b89f57] text-black font-extrabold rounded-xl text-xs shadow-sm transition flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-black" />
                  {t('bulkJSON', lang)}
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 mb-3">
                {t('entityDownloads', lang)}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#0a0b0d] border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Car className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-xs font-bold text-white">{t('vehiclesData', lang)}</p>
                      <p className="text-[10px] text-gray-400">{vehicles.length} {isAr ? 'سجل' : 'records'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => exportVehiclesToCSV(vehicles, drivers)}
                    className="p-2 bg-gray-800 hover:bg-gray-700 text-[#cbb26a] rounded-lg transition"
                    title={isAr ? 'تصدير CSV' : 'Export CSV'}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-[#0a0b0d] border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-white">{t('driversData', lang)}</p>
                      <p className="text-[10px] text-gray-400">{drivers.length} {isAr ? 'سجل' : 'records'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => exportDriversToCSV(drivers)}
                    className="p-2 bg-gray-800 hover:bg-gray-700 text-[#cbb26a] rounded-lg transition"
                    title={isAr ? 'تصدير CSV' : 'Export CSV'}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-[#0a0b0d] border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Wrench className="w-5 h-5 text-rose-400" />
                    <div>
                      <p className="text-xs font-bold text-white">{t('maintenanceData', lang)}</p>
                      <p className="text-[10px] text-gray-400">{maintenance.length} {isAr ? 'سجل' : 'records'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => exportMaintenanceToCSV(maintenance, vehicles, garages)}
                    className="p-2 bg-gray-800 hover:bg-gray-700 text-[#cbb26a] rounded-lg transition"
                    title={isAr ? 'تصدير CSV' : 'Export CSV'}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-[#0a0b0d] border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Fuel className="w-5 h-5 text-amber-400" />
                    <div>
                      <p className="text-xs font-bold text-white">{t('fuelData', lang)}</p>
                      <p className="text-[10px] text-gray-400">{fuel.length} {isAr ? 'سجل' : 'records'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => exportFuelToCSV(fuel, vehicles, drivers)}
                    className="p-2 bg-gray-800 hover:bg-gray-700 text-[#cbb26a] rounded-lg transition"
                    title={isAr ? 'تصدير CSV' : 'Export CSV'}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};