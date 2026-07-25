import React, { useState } from 'react';
import { Vehicle, Driver } from '../types';
import { 
  Car, 
  Plus, 
  Edit, 
  Trash2, 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  Calendar, 
  Gauge, 
  Fuel, 
  UserCheck, 
  FileText,
  AlertCircle,
  Camera,
  Sparkles
} from 'lucide-react';
import { OcrCameraScanner } from './OcrCameraScanner';

interface VehiclesViewProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  onSaveVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (vehicleId: string) => void;
  lang?: 'ar' | 'en';
}

export const VehiclesView: React.FC<VehiclesViewProps> = ({
  vehicles,
  drivers,
  onSaveVehicle,
  onDeleteVehicle,
  lang = 'ar'
}) => {
  const isAr = lang === 'ar';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fuelTypeFilter, setFuelTypeFilter] = useState<string>('all');
  const [expiryFilter, setExpiryFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [showOcrScanner, setShowOcrScanner] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const handleOcrVehicleComplete = (data: Record<string, any>) => {
    setForm(prev => ({
      ...prev,
      make: data.make || prev.make,
      model: data.model || prev.model,
      year: data.year ? Number(data.year) : prev.year,
      plateNumber: data.plateNumber || prev.plateNumber,
      vinNumber: data.vinNumber || prev.vinNumber,
      color: data.color || prev.color,
      fuelType: data.fuelType || prev.fuelType,
      licenseExpiryDate: data.licenseExpiryDate || prev.licenseExpiryDate,
      insuranceCompany: data.insuranceCompany || prev.insuranceCompany,
      policyNumber: data.policyNumber || prev.policyNumber
    }));
  };

  // Form State
  const [form, setForm] = useState<Partial<Vehicle>>({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    plateNumber: '',
    color: 'أبيض',
    mileage: 0,
    fuelType: '91',
    status: 'available',
    licenseExpiryDate: '',
    insuranceExpiryDate: '',
    insuranceCompany: '',
    policyNumber: '',
    assignedDriverId: '',
    notes: ''
  });

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setForm({
      make: '',
      model: '',
      year: new Date().getFullYear(),
      plateNumber: '',
      color: 'أبيض',
      mileage: 0,
      nextServiceMileage: 5000,
      serviceIntervalKm: 5000,
      fuelType: '91',
      status: 'available',
      licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      insuranceExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      insuranceCompany: 'التعاونية للتأمين',
      policyNumber: '',
      assignedDriverId: '',
      notes: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setForm({
      ...v,
      nextServiceMileage: v.nextServiceMileage || ((v.mileage || 0) + (v.serviceIntervalKm || 5000)),
      serviceIntervalKm: v.serviceIntervalKm || 5000
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.make || !form.model || !form.plateNumber) {
      alert('يرجى ملء كافة الحقول الأساسية لسيارة الشركة');
      return;
    }

    const currentMileage = Number(form.mileage) || 0;
    const intervalKm = Number(form.serviceIntervalKm) || 5000;
    const nextService = Number(form.nextServiceMileage) || (currentMileage + intervalKm);

    const vehicleToSave: Vehicle = {
      id: editingVehicle ? editingVehicle.id : `v-${Date.now().toString().slice(-4)}`,
      plateNumber: form.plateNumber || '',
      make: form.make || '',
      model: form.model || '',
      year: Number(form.year) || 2023,
      color: form.color || 'أبيض',
      vinNumber: form.vinNumber,
      status: form.status as any || 'available',
      mileage: currentMileage,
      nextServiceMileage: nextService,
      serviceIntervalKm: intervalKm,
      fuelType: form.fuelType as any || '91',
      licenseExpiryDate: form.licenseExpiryDate || new Date().toISOString().slice(0, 10),
      insuranceExpiryDate: form.insuranceExpiryDate || new Date().toISOString().slice(0, 10),
      insuranceCompany: form.insuranceCompany || 'شركة تأمين',
      policyNumber: form.policyNumber || '',
      assignedDriverId: form.assignedDriverId,
      notes: form.notes
    };

    onSaveVehicle(vehicleToSave);
    setShowModal(false);
  };

  const filteredVehicles = vehicles.filter(v => {
    const driver = drivers.find(d => d.id === v.assignedDriverId);
    const searchLower = searchTerm.toLowerCase().trim();

    const matchesSearch = !searchLower || 
      v.make.toLowerCase().includes(searchLower) ||
      v.model.toLowerCase().includes(searchLower) ||
      v.plateNumber.toLowerCase().includes(searchLower) ||
      (v.vinNumber && v.vinNumber.toLowerCase().includes(searchLower)) ||
      (v.color && v.color.toLowerCase().includes(searchLower)) ||
      (driver && driver.name.toLowerCase().includes(searchLower));

    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;

    const matchesFuel = fuelTypeFilter === 'all' || v.fuelType === fuelTypeFilter;

    let matchesExpiry = true;
    if (expiryFilter === 'license_expiring') {
      const daysLeft = (new Date(v.licenseExpiryDate).getTime() - Date.now()) / (1000 * 3600 * 24);
      matchesExpiry = daysLeft <= 30;
    } else if (expiryFilter === 'insurance_expiring') {
      const daysLeft = (new Date(v.insuranceExpiryDate).getTime() - Date.now()) / (1000 * 3600 * 24);
      matchesExpiry = daysLeft <= 30;
    }

    return matchesSearch && matchesStatus && matchesFuel && matchesExpiry;
  });

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all' || fuelTypeFilter !== 'all' || expiryFilter !== 'all';

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setFuelTypeFilter('all');
    setExpiryFilter('all');
  };

  const getStatusBadge = (status: Vehicle['status']) => {
    switch (status) {
      case 'available':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">{isAr ? 'جاهزة ومتوفرة' : 'Available'}</span>;
      case 'checked_out':
        return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">{isAr ? 'قيد الاستخدام الميداني' : 'Checked Out'}</span>;
      case 'maintenance':
        return <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-1 rounded-full">{isAr ? 'في الورشة/الصيانة' : 'In Maintenance'}</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-full">{isAr ? 'خارج الخدمة' : 'Out of Service'}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Car className="w-7 h-7 text-blue-600" />
            {isAr ? `إدارة أسطول سيارات الشركة (${vehicles.length})` : `Company Fleet Management (${vehicles.length})`}
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            {isAr ? 'متابعة كافة تفاصيل المركبات، عداد الكيلومترات، السائقين المخصصين، وتواريخ انتهاء الاستمارة والتأمين.' : 'Track vehicle details, odometers, assigned drivers, registration, and insurance expiries.'}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow transition flex items-center gap-2 shrink-0"
        >
          <Plus className="w-5 h-5" />
          {isAr ? 'إضافة سيارة جديدة لأسطول الشركة' : 'Add New Vehicle to Fleet'}
        </button>
      </div>

      {/* Advanced Filter and Search Toolbar */}
      <div className="bg-[#0f1115] border border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Main Text Search */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 absolute right-3.5 top-3 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={isAr ? 'بحث بالماركة، الموديل، رقم اللوحة، رقم الهيكل أو اسم السائق...' : 'Search make, model, plate, VIN, or driver...'}
              className="w-full pr-10 pl-3 py-2 bg-[#0a0b0d] border border-gray-800 rounded-xl text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#cbb26a] transition"
            />
          </div>

          {/* Quick Status Buttons */}
          <div className="flex items-center gap-1.5 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === 'all' ? 'bg-[#cbb26a] text-black shadow-sm' : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {isAr ? `الكل (${vehicles.length})` : `All (${vehicles.length})`}
            </button>
            <button
              onClick={() => setStatusFilter('available')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
                statusFilter === 'available' ? 'bg-emerald-500 text-black shadow-sm' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
              }`}
            >
              {isAr ? `جاهزة ومتوفرة (${vehicles.filter(v => v.status === 'available').length})` : `Available (${vehicles.filter(v => v.status === 'available').length})`}
            </button>
            <button
              onClick={() => setStatusFilter('checked_out')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
                statusFilter === 'checked_out' ? 'bg-amber-500 text-black shadow-sm' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
              }`}
            >
              {isAr ? `مستلمة بالخارج (${vehicles.filter(v => v.status === 'checked_out').length})` : `Checked Out (${vehicles.filter(v => v.status === 'checked_out').length})`}
            </button>
            <button
              onClick={() => setStatusFilter('maintenance')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
                statusFilter === 'maintenance' ? 'bg-rose-500 text-black shadow-sm' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
              }`}
            >
              {isAr ? `بالورشة/الصيانة (${vehicles.filter(v => v.status === 'maintenance').length})` : `In Maintenance (${vehicles.filter(v => v.status === 'maintenance').length})`}
            </button>
          </div>
        </div>

        {/* Secondary Dropdown Filters Row */}
        <div className="pt-3 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Fuel Type Dropdown Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                <Fuel className="w-3.5 h-3.5 text-[#cbb26a]" /> {isAr ? 'نوع الوقود:' : 'Fuel Type:'}
              </span>
              <select
                value={fuelTypeFilter}
                onChange={e => setFuelTypeFilter(e.target.value)}
                className="bg-[#0a0b0d] border border-gray-800 text-gray-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#cbb26a]"
              >
                <option value="all">{isAr ? 'جميع الأنواع' : 'All Types'}</option>
                <option value="91">{isAr ? 'بنزين 91' : 'Petrol 91'}</option>
                <option value="95">{isAr ? 'بنزين 95' : 'Petrol 95'}</option>
                <option value="diesel">{isAr ? 'ديزل' : 'Diesel'}</option>
                <option value="electric">{isAr ? 'كهرباء' : 'Electric'}</option>
              </select>
            </div>

            {/* Expiry Dates Dropdown Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-[#cbb26a]" /> {isAr ? 'تصفية التواريخ:' : 'Expiry Filter:'}
              </span>
              <select
                value={expiryFilter}
                onChange={e => setExpiryFilter(e.target.value)}
                className="bg-[#0a0b0d] border border-gray-800 text-gray-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#cbb26a]"
              >
                <option value="all">{isAr ? 'جميع التواريخ' : 'All Dates'}</option>
                <option value="license_expiring">{isAr ? 'استمارة قريبة الانتهاء (أقل من 30 يوماً)' : 'Registration Expiring Soon (< 30 days)'}</option>
                <option value="insurance_expiring">{isAr ? 'تأمين قريب الانتهاء (أقل من 30 يوماً)' : 'Insurance Expiring Soon (< 30 days)'}</option>
              </select>
            </div>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-rose-400 hover:text-rose-300 font-bold underline transition"
            >
              {isAr ? 'إلغاء جميع الفلاتر' : 'Reset All Filters'}
            </button>
          )}
        </div>
      </div>

      {/* Vehicle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map(v => {
          const driver = drivers.find(d => d.id === v.assignedDriverId);
          const isLicenseExpiring = new Date(v.licenseExpiryDate).getTime() - Date.now() < 30 * 24 * 3600 * 1000;
          const isInsuranceExpiring = new Date(v.insuranceExpiryDate).getTime() - Date.now() < 30 * 24 * 3600 * 1000;

          return (
            <div 
              key={v.id}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition space-y-4 relative flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {v.make} {v.model} ({v.year})
                    </h3>
                    <div className="inline-block bg-slate-900 text-amber-400 font-mono font-bold text-xs px-2.5 py-0.5 rounded border border-slate-700 mt-1">
                      {v.plateNumber}
                    </div>
                  </div>
                  {getStatusBadge(v.status)}
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-blue-600" /> عداد الكيلومترات:
                    </span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 font-mono">{v.mileage.toLocaleString()} كم</p>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] flex items-center gap-1">
                      <Fuel className="w-3 h-3 text-amber-600" /> نوع الوقود:
                    </span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{v.fuelType}</p>
                  </div>

                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px] flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-emerald-600" /> السائق المخصص:
                    </span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {driver ? `${driver.name} (${driver.phone})` : 'غير مخصص لسائق محدد'}
                    </p>
                  </div>
                </div>

                {/* Licenses and Insurance Expiries */}
                <div className="space-y-1.5 text-xs pt-1">
                  <div className={`p-2 rounded-lg flex items-center justify-between ${
                    isLicenseExpiring ? 'bg-amber-50 text-amber-900 font-semibold' : 'bg-slate-50 text-slate-600'
                  }`}>
                    <span className="flex items-center gap-1 text-[11px]">
                      <Calendar className="w-3.5 h-3.5" /> انتهاء الاستمارة:
                    </span>
                    <span className="font-mono">{v.licenseExpiryDate}</span>
                  </div>

                  <div className={`p-2 rounded-lg flex items-center justify-between ${
                    isInsuranceExpiring ? 'bg-amber-50 text-amber-900 font-semibold' : 'bg-slate-50 text-slate-600'
                  }`}>
                    <span className="flex items-center gap-1 text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5" /> انتهاء التأمين ({v.insuranceCompany}):
                    </span>
                    <span className="font-mono">{v.insuranceExpiryDate}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between border-t pt-3 border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => handleOpenEdit(v)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                >
                  <Edit className="w-3.5 h-3.5" /> تعديل المكونات
                </button>

                <button
                  onClick={() => {
                    if (confirm(`هل أنت تأكد من حذف المركبة (${v.make} - ${v.plateNumber})؟`)) {
                      onDeleteVehicle(v.id);
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

      {/* ADD / EDIT VEHICLE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700 my-8 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-600" />
                {editingVehicle ? 'تعديل بيانات مركبة' : 'إضافة مركبة جديدة للأسطول'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Smart OCR Camera Scan Banner for Vehicles */}
              <div className="bg-slate-900 border border-blue-500/30 rounded-xl p-3 flex items-center justify-between gap-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg shrink-0">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-1">
                      مسح رخصة سير المركبة / الاستمارة بالكاميرا (OCR)
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    </p>
                    <p className="text-[10px] text-gray-400">استخراج الماركة، رقم اللوحة، الموديل وسنة الصنع تلقائياً</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowOcrScanner(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow transition shrink-0 flex items-center gap-1"
                >
                  <Camera className="w-3.5 h-3.5" />
                  التقاط بالأشعة
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ماركة / نوع السيارة *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.make}
                    onChange={e => setForm({ ...form, make: e.target.value })}
                    placeholder="تويوتا، هيونداي..."
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    الموديل *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.model}
                    onChange={e => setForm({ ...form, model: e.target.value })}
                    placeholder="هايلكس، إلانترا..."
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    سنة الصنع
                  </label>
                  <input
                    type="number"
                    value={form.year}
                    onChange={e => setForm({ ...form, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    رقم اللوحة *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.plateNumber}
                    onChange={e => setForm({ ...form, plateNumber: e.target.value })}
                    placeholder="أ ب ج 1234"
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    عداد الكيلومترات الحالي
                  </label>
                  <input
                    type="number"
                    value={form.mileage}
                    onChange={e => setForm({ ...form, mileage: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    نوع الوقود
                  </label>
                  <select
                    value={form.fuelType}
                    onChange={e => setForm({ ...form, fuelType: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  >
                    <option value="91">بنزين 91</option>
                    <option value="95">بنزين 95</option>
                    <option value="diesel">ديزل</option>
                    <option value="hybrid">هايبرد</option>
                    <option value="electric">كهربائية</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    حد العداد المستهدف للصيانة القادمة (كم)
                  </label>
                  <input
                    type="number"
                    value={form.nextServiceMileage || ''}
                    onChange={e => setForm({ ...form, nextServiceMileage: Number(e.target.value) })}
                    placeholder="مثال: 85000"
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    فاصل التكرار الدوري للصيانة (كم)
                  </label>
                  <select
                    value={form.serviceIntervalKm || 5000}
                    onChange={e => setForm({ ...form, serviceIntervalKm: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  >
                    <option value={3000}>3,000 كم (استخدام شاق)</option>
                    <option value={5000}>5,000 كم (افتراضي زيت وفلتر)</option>
                    <option value={10000}>10,000 كم (زيت تخليقي)</option>
                    <option value={15000}>15,000 كم (نقل ثقيل)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    تاريخ انتهاء رخصة السير / الاستمارة
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
                    تاريخ انتهاء وثيقة التأمين
                  </label>
                  <input
                    type="date"
                    value={form.insuranceExpiryDate}
                    onChange={e => setForm({ ...form, insuranceExpiryDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    شركة التأمين ورقم الوثيقة
                  </label>
                  <input
                    type="text"
                    value={form.insuranceCompany}
                    onChange={e => setForm({ ...form, insuranceCompany: e.target.value })}
                    placeholder="التعاونية / ملاذ..."
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    تخصيص لسائق محدد (اختياري)
                  </label>
                  <select
                    value={form.assignedDriverId || ''}
                    onChange={e => setForm({ ...form, assignedDriverId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  >
                    <option value="">بدون تخصيص ثابث</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.department})
                      </option>
                    ))}
                  </select>
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
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm shadow transition"
                >
                  حفظ بيانات المركبة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OCR CAMERA SCANNER MODAL */}
      {showOcrScanner && (
        <OcrCameraScanner
          docType="vehicle_registration"
          onScanComplete={handleOcrVehicleComplete}
          onClose={() => setShowOcrScanner(false)}
        />
      )}
    </div>
  );
};
