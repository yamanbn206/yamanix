import React, { useState, useRef, useEffect } from 'react';
import { Company, Vehicle, Driver } from '../types';
import { Building2, ChevronDown, Plus, Check, Layers, ShieldCheck, Phone, FileText, Globe, X, Sparkles } from 'lucide-react';
import { Language, t } from '../lib/i18n';

interface CompanySwitcherProps {
  companies: Company[];
  activeCompanyId: string;
  vehicles?: Vehicle[];
  drivers?: Driver[];
  lang?: Language;
  onSelectCompany: (id: string) => void;
  onAddCompany: (newCompany: Company) => void;
  onManageCompanies: () => void;
}

export const CompanySwitcher: React.FC<CompanySwitcherProps> = ({
  companies,
  activeCompanyId,
  vehicles = [],
  drivers = [],
  lang = 'ar',
  onSelectCompany,
  onAddCompany,
  onManageCompanies
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAr = lang === 'ar';

  // Active Company object or "All"
  const activeCompany = companies.find(c => c.id === activeCompanyId) || (
    activeCompanyId === 'all'
      ? { id: 'all', name: isAr ? 'جميع الشركات (مجمّع)' : 'All Companies Combined', code: 'ALL' } as Company
      : companies[0]
  );

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Form State for Add Company Modal
  const [form, setForm] = useState<Partial<Company>>({
    name: '',
    code: '',
    phone: '',
    email: '',
    commercialRegNumber: '',
    tagline: '',
    address: '',
    currency: 'SAR'
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) return;

    const newCompanyObj: Company = {
      id: `comp-${Date.now()}`,
      name: form.name.trim(),
      code: (form.code || form.name.substring(0, 3)).toUpperCase().trim(),
      tagline: form.tagline?.trim() || (isAr ? 'شركة إدارة أسطول محلي' : 'Fleet Operations Company'),
      phone: form.phone?.trim() || '',
      email: form.email?.trim() || '',
      commercialRegNumber: form.commercialRegNumber?.trim() || '',
      address: form.address?.trim() || '',
      currency: form.currency || 'SAR',
      logoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString()
    };

    onAddCompany(newCompanyObj);
    onSelectCompany(newCompanyObj.id);
    setShowAddModal(false);
    setIsOpen(false);
    setForm({
      name: '',
      code: '',
      phone: '',
      email: '',
      commercialRegNumber: '',
      tagline: '',
      address: '',
      currency: 'SAR'
    });
  };

  return (
    <div className="relative inline-block text-right" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-slate-100 dark:bg-gradient-to-r dark:from-blue-900/40 dark:via-slate-900/80 dark:to-slate-900/90 border border-slate-300 dark:border-blue-500/30 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl transition duration-150 text-slate-800 dark:text-white shadow-xs group"
        title={isAr ? 'تبديل الشركة / التغيير بين الشركات' : 'Switch Active Company'}
      >
        <div className="p-1.5 bg-blue-100 text-blue-700 dark:bg-blue-600/30 dark:text-blue-400 border border-blue-200 dark:border-blue-400/30 rounded-lg group-hover:scale-105 transition">
          <Building2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        </div>

        <div className="text-right flex flex-col justify-center">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-800 dark:text-white max-w-[130px] sm:max-w-[180px] truncate leading-tight">
              {activeCompany?.name || (isAr ? 'اختيار الشركة' : 'Select Company')}
            </span>
            {activeCompany?.code && (
              <span className="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-400/30 rounded text-[10px] font-mono font-bold">
                {activeCompany.code}
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-gray-400 font-medium leading-none mt-0.5">
            {companies.length} {isAr ? 'شركات مسجلة' : 'companies registered'}
          </span>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 dark:text-gray-400 group-hover:text-slate-800 dark:group-hover:text-white transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute ${isAr ? 'right-0' : 'left-0'} mt-2 w-80 sm:w-88 bg-white dark:bg-[#0f1117] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl dark:shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150`}>
          {/* Header */}
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-black uppercase text-slate-800 dark:text-gray-200 tracking-wider">
                {isAr ? 'إدارة وتبديل الشركات' : 'Select Company'}
              </span>
            </div>
            <button
              onClick={() => {
                setShowAddModal(true);
                setIsOpen(false);
              }}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              {isAr ? 'إضافة شركة' : 'Add Company'}
            </button>
          </div>

          {/* Company Items List */}
          <div className="max-h-72 overflow-y-auto p-2 space-y-1">
            {/* All Companies option */}
            <button
              onClick={() => {
                onSelectCompany('all');
                setIsOpen(false);
              }}
              className={`w-full text-right p-2.5 rounded-xl border transition flex items-center justify-between group ${
                activeCompanyId === 'all'
                  ? 'bg-blue-50 border-blue-400 text-blue-950 dark:bg-blue-950/40 dark:border-blue-500/50 dark:text-white'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:border-slate-800/60 dark:hover:bg-slate-800/50 dark:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-gray-200">
                    {isAr ? 'جميع الشركات (عرض مجمّع)' : 'All Companies (Aggregated)'}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-gray-400 mt-0.5">
                    {isAr ? 'إحصائيات وتقارير كافة الأساطيل والشركات' : 'Combined dashboard across all fleets'}
                  </div>
                </div>
              </div>
              {activeCompanyId === 'all' && (
                <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              )}
            </button>

            <div className="my-1.5 border-t border-slate-200 dark:border-slate-800/60" />

            {/* Registered Companies */}
            {companies.map(comp => {
              const compVehicles = vehicles.filter(v => (v.companyId || 'comp-1') === comp.id);
              const compDrivers = drivers.filter(d => (d.companyId || 'comp-1') === comp.id);
              const isCurrent = activeCompanyId === comp.id;

              return (
                <button
                  key={comp.id}
                  onClick={() => {
                    onSelectCompany(comp.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-right p-2.5 rounded-xl border transition flex items-center justify-between group ${
                    isCurrent
                      ? 'bg-blue-50 border-blue-400 text-blue-950 dark:bg-blue-600/20 dark:border-blue-500/60 dark:text-white'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:border-slate-800/60 dark:hover:bg-slate-800/60 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400 font-bold overflow-hidden">
                      {comp.logoUrl ? (
                        <img src={comp.logoUrl} alt={comp.name} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-gray-200 truncate group-hover:text-blue-600 dark:group-hover:text-white transition">
                          {comp.name}
                        </span>
                        {comp.code && (
                          <span className="px-1.5 py-0.2 bg-slate-200 dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-slate-300 dark:border-slate-700 rounded text-[9px] font-mono font-bold">
                            {comp.code}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-gray-400 mt-0.5 flex items-center gap-2 font-mono">
                        <span>{compVehicles.length} {isAr ? 'مركبة' : 'vehicles'}</span>
                        <span>•</span>
                        <span>{compDrivers.length} {isAr ? 'سائق' : 'drivers'}</span>
                      </div>
                    </div>
                  </div>

                  {isCurrent && (
                    <div className="p-1 rounded-full bg-blue-600 dark:bg-blue-500 text-white shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer link to manage in settings */}
          <div className="p-2.5 bg-slate-100 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 dark:text-gray-400">
              {companies.length} {isAr ? 'شركات مستقلة' : 'independent companies'}
            </span>
            <button
              onClick={() => {
                onManageCompanies();
                setIsOpen(false);
              }}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition"
            >
              {isAr ? 'إدارة الإعدادات والشركات ←' : 'Manage Settings ←'}
            </button>
          </div>
        </div>
      )}

      {/* Add New Company Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1117] border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {isAr ? 'إضافة شركة جديدة للأسطول' : 'Add New Company Profile'}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isAr ? 'سيتم إنشاء بيئة بيانات منفصلة تماماً للسيارات والسائقين والتقارير' : 'Create an isolated data environment for vehicles, drivers & reports'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl bg-slate-800 text-gray-400 hover:text-white hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  {isAr ? 'اسم الشركة / المؤسسة *' : 'Company Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isAr ? 'مثال: شركة المسار للنقل اللوجستي' : 'e.g. Al-Masar Logistics'}
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    {isAr ? 'كود/رمز اختصاري' : 'Short Code'}
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="MSR"
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    {isAr ? 'العملة المعتمدة' : 'Currency'}
                  </label>
                  <select
                    value={form.currency}
                    onChange={e => setForm({ ...form, currency: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-hidden"
                  >
                    <option value="SAR">SAR (ريال سعودي)</option>
                    <option value="AED">AED (درهم إماراتي)</option>
                    <option value="KWD">KWD (دينار كويتي)</option>
                    <option value="QAR">QAR (ريال قطري)</option>
                    <option value="OMR">OMR (ريال عماني)</option>
                    <option value="BHD">BHD (دينار بحريني)</option>
                    <option value="USD">USD (دولار أمريكي)</option>
                    <option value="EUR">EUR (يورو)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    {isAr ? 'رقم السجل التجاري / الضريبي' : 'Commercial Reg / VAT'}
                  </label>
                  <input
                    type="text"
                    placeholder="CR-1010002233"
                    value={form.commercialRegNumber}
                    onChange={e => setForm({ ...form, commercialRegNumber: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    {isAr ? 'رقم الهاتف / الجوال' : 'Phone'}
                  </label>
                  <input
                    type="text"
                    placeholder="+966 50 000 0000"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  {isAr ? 'نشاط الشركة / الشعار النصي' : 'Tagline / Activity'}
                </label>
                <input
                  type="text"
                  placeholder={isAr ? 'خدمات الشحن والنقل اللوجستي' : 'Logistics and freight services'}
                  value={form.tagline}
                  onChange={e => setForm({ ...form, tagline: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="p-3 bg-blue-950/20 border border-blue-500/20 rounded-xl text-xs text-blue-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  {isAr
                    ? 'بعد إضافة الشركة، يمكنك البدء فوراً في إضافة سيارات وسائقين وفواتير خاصة بها بشكل معزول تماماً عن باقي الشركات.'
                    : 'After adding the company, you can immediately manage its isolated vehicles, drivers, and reports.'}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-gray-400 hover:text-white hover:bg-slate-800 text-xs font-bold transition"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm"
                >
                  {isAr ? 'حفظ وإنشاء الشركة' : 'Create Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
