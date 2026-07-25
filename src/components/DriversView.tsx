import React, { useState } from 'react';
import { Driver, Vehicle } from '../types';
import { Users, Plus, Edit, Trash2, Calendar, Phone, CreditCard, Building, ShieldAlert, Search, Filter, Camera, Sparkles } from 'lucide-react';
import { OcrCameraScanner } from './OcrCameraScanner';

interface DriversViewProps {
  drivers: Driver[];
  vehicles: Vehicle[];
  onSaveDriver: (driver: Driver) => void;
  onDeleteDriver: (driverId: string) => void;
  lang?: 'ar' | 'en';
}

export const DriversView: React.FC<DriversViewProps> = ({
  drivers,
  vehicles,
  onSaveDriver,
  onDeleteDriver,
  lang = 'ar'
}) => {
  const isAr = lang === 'ar';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expiryFilter, setExpiryFilter] = useState<string>('all');

  const [showModal, setShowModal] = useState(false);
  const [showOcrScanner, setShowOcrScanner] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  const handleOcrComplete = (data: Record<string, any>) => {
    setForm(prev => ({
      ...prev,
      name: data.name || prev.name,
      idNumber: data.idNumber || prev.idNumber,
      licenseNumber: data.licenseNumber || prev.licenseNumber,
      licenseCategory: data.licenseCategory || prev.licenseCategory,
      licenseExpiryDate: data.licenseExpiryDate || prev.licenseExpiryDate,
      phone: data.phone || prev.phone,
      department: data.department || prev.department
    }));
  };

  const [form, setForm] = useState<Partial<Driver>>({
    name: '',
    phone: '',
    idNumber: '',
    licenseNumber: '',
    licenseCategory: 'خصوصي',
    licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    department: 'قسم الحركة',
    status: 'active',
    notes: ''
  });

  const handleOpenAdd = () => {
    setEditingDriver(null);
    setForm({
      name: '',
      phone: '',
      idNumber: '',
      licenseNumber: '',
      licenseCategory: 'خصوصي',
      licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      department: 'قسم الحركة والتوزيع',
      status: 'active',
      notes: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (d: Driver) => {
    setEditingDriver(d);
    setForm(d);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.licenseNumber) {
      alert('يرجى إدخال اسم السائق، الهاتف ورقم رخصة القيادة');
      return;
    }

    const driverToSave: Driver = {
      id: editingDriver ? editingDriver.id : `d-${Date.now().toString().slice(-4)}`,
      name: form.name || '',
      phone: form.phone || '',
      idNumber: form.idNumber || '',
      licenseNumber: form.licenseNumber || '',
      licenseCategory: form.licenseCategory || 'خصوصي',
      licenseExpiryDate: form.licenseExpiryDate || new Date().toISOString().slice(0, 10),
      department: form.department || 'عام',
      status: form.status as any || 'active',
      notes: form.notes
    };

    onSaveDriver(driverToSave);
    setShowModal(false);
  };

  const filteredDrivers = drivers.filter(d => {
    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch = !searchLower ||
      d.name.toLowerCase().includes(searchLower) ||
      d.phone.toLowerCase().includes(searchLower) ||
      d.idNumber.toLowerCase().includes(searchLower) ||
      d.licenseNumber.toLowerCase().includes(searchLower) ||
      d.department.toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;

    const matchesCategory = categoryFilter === 'all' || d.licenseCategory === categoryFilter;

    let matchesExpiry = true;
    if (expiryFilter === 'expiring_30') {
      const daysLeft = (new Date(d.licenseExpiryDate).getTime() - Date.now()) / (1000 * 3600 * 24);
      matchesExpiry = daysLeft <= 30;
    }

    return matchesSearch && matchesStatus && matchesCategory && matchesExpiry;
  });

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all' || categoryFilter !== 'all' || expiryFilter !== 'all';

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setExpiryFilter('all');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-emerald-600" />
            {isAr ? `إدارة السائقين ورخص القيادة (${drivers.length})` : `Drivers & License Management (${drivers.length})`}
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            {isAr ? 'سجل موظفي وسائقي الشركة، فئات رخص القيادة وتواريخ الانتهاء والأقسام التابعة لهم.' : 'Manage company drivers, driver licenses, categories, expiry dates, and departments.'}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow transition flex items-center gap-2 shrink-0"
        >
          <Plus className="w-5 h-5" />
          {isAr ? 'إضافة سائق / موظف جديد' : 'Add New Driver / Staff'}
        </button>
      </div>

      {/* Advanced Filter and Search Bar for Drivers */}
      <div className="bg-[#0f1115] border border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Main Search Input */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 absolute right-3.5 top-3 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={isAr ? 'بحث باسم السائق، الجوال، رقم الهوية، الرخصة أو القسم...' : 'Search driver name, phone, ID, license, or department...'}
              className="w-full pr-10 pl-3 py-2 bg-[#0a0b0d] border border-gray-800 rounded-xl text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#cbb26a] transition"
            />
          </div>

          {/* Quick Status Tabs */}
          <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === 'all' ? 'bg-[#cbb26a] text-black shadow-sm' : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {isAr ? `جميع السائقين (${drivers.length})` : `All Drivers (${drivers.length})`}
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
                statusFilter === 'active' ? 'bg-emerald-500 text-black shadow-sm' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
              }`}
            >
              {isAr ? `نشط وفعال (${drivers.filter(d => d.status === 'active').length})` : `Active (${drivers.filter(d => d.status === 'active').length})`}
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
                statusFilter === 'inactive' ? 'bg-gray-600 text-white shadow-sm' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {isAr ? `غير نشط (${drivers.filter(d => d.status === 'inactive').length})` : `Inactive (${drivers.filter(d => d.status === 'inactive').length})`}
            </button>
          </div>
        </div>

        {/* Secondary Dropdown Filters */}
        <div className="pt-3 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                <CreditCard className="w-3.5 h-3.5 text-[#cbb26a]" /> {isAr ? 'فئة الرخصة:' : 'License Class:'}
              </span>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="bg-[#0a0b0d] border border-gray-800 text-gray-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#cbb26a]"
              >
                <option value="all">{isAr ? 'جميع الفئات' : 'All Classes'}</option>
                <option value="خصوصي">{isAr ? 'خصوصي' : 'Private'}</option>
                <option value="عمومي">{isAr ? 'عمومي' : 'Public / Commercial'}</option>
                <option value="نقل ثقيل">{isAr ? 'نقل ثقيل' : 'Heavy Transport'}</option>
                <option value="دراجة نارية">{isAr ? 'دراجة نارية' : 'Motorcycle'}</option>
              </select>
            </div>

            {/* Expiry Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-[#cbb26a]" /> صلاحية الرخصة:
              </span>
              <select
                value={expiryFilter}
                onChange={e => setExpiryFilter(e.target.value)}
                className="bg-[#0a0b0d] border border-gray-800 text-gray-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#cbb26a]"
              >
                <option value="all">جميع الرخص</option>
                <option value="expiring_30">تنتهي خلال 30 يوماً</option>
              </select>
            </div>
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-rose-400 hover:text-rose-300 font-bold underline transition"
            >
              إلغاء جميع الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* Drivers List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDrivers.map(driver => {
          const assignedVehicle = vehicles.find(v => v.assignedDriverId === driver.id);
          const isLicenseExpiring = new Date(driver.licenseExpiryDate).getTime() - Date.now() < 30 * 24 * 3600 * 1000;

          return (
            <div 
              key={driver.id}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{driver.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Building className="w-3.5 h-3.5 text-blue-600" /> {driver.department}
                    </p>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    driver.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {driver.status === 'active' ? 'نشط' : 'غير نشط'}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" /> رقم التواصل:
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 dir-ltr">{driver.phone}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-blue-600" /> رخصة القيادة:
                    </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{driver.licenseNumber} ({driver.licenseCategory})</span>
                  </div>

                  <div className={`flex items-center justify-between p-2 rounded-lg ${
                    isLicenseExpiring ? 'bg-amber-100 text-amber-900 font-bold' : 'bg-slate-100/80 text-slate-700'
                  }`}>
                    <span className="flex items-center gap-1 text-[11px]">
                      <Calendar className="w-3.5 h-3.5" /> انتهاء رخصة القيادة:
                    </span>
                    <span className="font-mono">{driver.licenseExpiryDate}</span>
                  </div>
                </div>

                {assignedVehicle && (
                  <div className="bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-2.5 rounded-xl text-xs flex items-center justify-between">
                    <span className="text-blue-700 dark:text-blue-300 font-semibold">السيارة المخصصة له:</span>
                    <span className="font-bold text-blue-900 dark:text-blue-100">
                      {assignedVehicle.make} {assignedVehicle.model} ({assignedVehicle.plateNumber})
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t pt-3 border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => handleOpenEdit(driver)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                >
                  <Edit className="w-3.5 h-3.5" /> تعديل البيانات
                </button>

                <button
                  onClick={() => {
                    if (confirm(`هل أنت تأكد من حذف السائق (${driver.name})؟`)) {
                      onDeleteDriver(driver.id);
                    }
                  }}
                  className="text-xs text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> حذف
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD/EDIT DRIVER MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                {editingDriver ? 'تعديل بيانات سائق' : 'إضافة سائق جديد'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Smart OCR Camera Scan Banner */}
              <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between gap-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-1">
                      مسح رخصة القيادة بالكاميرا (OCR)
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    </p>
                    <p className="text-[10px] text-gray-400">استخراج الاسم، الهوية ورقم الرخصة تلقائياً</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowOcrScanner(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow transition shrink-0 flex items-center gap-1"
                >
                  <Camera className="w-3.5 h-3.5" />
                  التقاط بالأشعة
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  اسم السائق / الموظف بالكامل *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="محمد العتيبي..."
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    رقم الجوال *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="0501234567"
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    رقم الهوية / الإقامة
                  </label>
                  <input
                    type="text"
                    value={form.idNumber}
                    onChange={e => setForm({ ...form, idNumber: e.target.value })}
                    placeholder="1000000000"
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    رقم رخصة القيادة *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.licenseNumber}
                    onChange={e => setForm({ ...form, licenseNumber: e.target.value })}
                    placeholder="DL-12345"
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    فئة الرخصة
                  </label>
                  <select
                    value={form.licenseCategory}
                    onChange={e => setForm({ ...form, licenseCategory: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  >
                    <option value="خصوصي">خصوصي</option>
                    <option value="نقل خفيف / عمومي">نقل خفيف / عمومي</option>
                    <option value="نقل ثقيل / معدات">نقل ثقيل / معدات</option>
                    <option value="دراجة نارية">دراجة نارية</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    تاريخ انتهاء الرخصة
                  </label>
                  <input
                    type="date"
                    value={form.licenseExpiryDate}
                    onChange={e => setForm({ ...form, licenseExpiryDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    الإدارة / القسم
                  </label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={e => setForm({ ...form, department: e.target.value })}
                    placeholder="قسم الحركة والتوزيع"
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-bold text-slate-600"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm shadow transition"
                >
                  حفظ بيانات السائق
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OCR CAMERA SCANNER MODAL */}
      {showOcrScanner && (
        <OcrCameraScanner
          docType="driver_license"
          onScanComplete={handleOcrComplete}
          onClose={() => setShowOcrScanner(false)}
        />
      )}
    </div>
  );
};
