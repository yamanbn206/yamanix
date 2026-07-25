import React, { useState } from 'react';
import { Vehicle, Driver } from '../types';
import { Language, t } from '../lib/i18n';
import { 
  ShieldAlert, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Car, 
  Users, 
  Clock, 
  Gauge, 
  Wrench, 
  Settings2, 
  RotateCcw, 
  Check, 
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Filter
} from 'lucide-react';

interface ExpiriesViewProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  onSaveVehicle?: (vehicle: Vehicle) => void;
  lang?: Language;
}

export const ExpiriesView: React.FC<ExpiriesViewProps> = ({ vehicles, drivers, onSaveVehicle, lang = 'en' }) => {
  const isAr = lang === 'ar';
  const today = new Date();
  const [activeTab, setActiveTab] = useState<'all' | 'odometer' | 'license' | 'insurance' | 'drivers'>('all');
  
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [targetMileageInput, setTargetMileageInput] = useState<number>(0);
  const [intervalInput, setIntervalInput] = useState<number>(5000);
  const [currentMileageInput, setCurrentMileageInput] = useState<number>(0);
  const [successMsg, setSuccessMsg] = useState<string>('');

  const getDaysRemaining = (dateStr: string) => {
    const target = new Date(dateStr);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getMileageStatus = (v: Vehicle) => {
    const current = v.mileage || 0;
    const interval = v.serviceIntervalKm || 5000;
    const target = v.nextServiceMileage || (current + interval);
    const remaining = target - current;

    return {
      current,
      target,
      interval,
      remaining,
      isOverdue: remaining <= 0,
      isUrgent: remaining > 0 && remaining <= 500,
      isWarning: remaining > 500 && remaining <= 1000,
      isGood: remaining > 1000,
      overdueKm: Math.abs(remaining)
    };
  };

  const odometerAlerts = vehicles.map(v => {
    const status = getMileageStatus(v);
    return { ...v, statusInfo: status };
  }).sort((a, b) => a.statusInfo.remaining - b.statusInfo.remaining);

  const overdueCount = odometerAlerts.filter(a => a.statusInfo.isOverdue).length;
  const urgentCount = odometerAlerts.filter(a => a.statusInfo.isUrgent).length;

  const vehicleLicenses = vehicles.map(v => {
    const days = getDaysRemaining(v.licenseExpiryDate);
    return { ...v, days, type: 'vehicle_license' };
  }).sort((a, b) => a.days - b.days);

  const vehicleInsurances = vehicles.map(v => {
    const days = getDaysRemaining(v.insuranceExpiryDate);
    return { ...v, days, type: 'vehicle_insurance' };
  }).sort((a, b) => a.days - b.days);

  const driverLicenses = drivers.map(d => {
    const days = getDaysRemaining(d.licenseExpiryDate);
    return { ...d, days, type: 'driver_license' };
  }).sort((a, b) => a.days - b.days);

  const handleOpenEditModal = (v: Vehicle) => {
    const status = getMileageStatus(v);
    setEditingVehicle(v);
    setCurrentMileageInput(status.current);
    setTargetMileageInput(status.target);
    setIntervalInput(status.interval);
  };

  const handleSaveMileageThreshold = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle || !onSaveVehicle) return;

    const updatedVehicle: Vehicle = {
      ...editingVehicle,
      mileage: currentMileageInput,
      nextServiceMileage: targetMileageInput,
      serviceIntervalKm: intervalInput
    };

    onSaveVehicle(updatedVehicle);
    setSuccessMsg(isAr 
      ? `تم تحديث حد المسافة والعداد للمركبة (${updatedVehicle.make} ${updatedVehicle.model}) بنجاح!`
      : `Successfully updated mileage threshold for ${updatedVehicle.make} ${updatedVehicle.model}!`
    );
    setTimeout(() => setSuccessMsg(''), 3500);
    setEditingVehicle(null);
  };

  const handleQuickResetMaintenance = (v: Vehicle) => {
    if (!onSaveVehicle) return;
    const interval = v.serviceIntervalKm || 5000;
    const current = v.mileage || 0;
    const newTarget = current + interval;

    const updatedVehicle: Vehicle = {
      ...v,
      nextServiceMileage: newTarget,
      serviceIntervalKm: interval
    };

    onSaveVehicle(updatedVehicle);
    setSuccessMsg(isAr
      ? `تم تسجيل إنجاز الصيانة وإعادة تصفير التنبيه للحد الجديد (${newTarget.toLocaleString()} كم)!`
      : `Maintenance completed and reset to new target (${newTarget.toLocaleString()} km)!`
    );
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const getUrgencyBadge = (days: number) => {
    if (days < 0) {
      return (
        <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 font-extrabold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
          <AlertTriangle className="w-3.5 h-3.5" /> 
          {isAr ? `منتهية منذ ${Math.abs(days)} يوم!` : `Expired ${Math.abs(days)} days ago!`}
        </span>
      );
    }
    if (days <= 15) {
      return (
        <span className="bg-rose-500/10 text-rose-300 border border-rose-500/20 font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
          <Clock className="w-3.5 h-3.5" /> 
          {isAr ? `تنتهي خلال ${days} أيام حرج!` : `Critical: Expires in ${days} days!`}
        </span>
      );
    }
    if (days <= 30) {
      return (
        <span className="bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
          <Clock className="w-3.5 h-3.5" /> 
          {isAr ? `تنتهي خلال ${days} يوم` : `Expires in ${days} days`}
        </span>
      );
    }
    return (
      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
        <CheckCircle2 className="w-3.5 h-3.5" /> 
        {isAr ? `سارية (باقي ${days} يوم)` : `Valid (${days} days left)`}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl flex items-center gap-3 text-sm font-bold animate-fadeIn shadow-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="bg-gradient-to-r from-[#0f1115] via-[#161a22] to-[#0f1115] border border-gray-800 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-[#cbb26a]" />
            {isAr ? 'مركز التنبيهات وإدارة حدود العداد والوثائق' : t('expiriesAlerts', lang)}
          </h2>
          <p className="text-gray-300 text-sm mt-1">
            {isAr ? 'رصد آلي مزدوج: تنبيهات الصيانة بناءً على مسافة العداد المقطوعة (Odometer) وتنبيهات تاريخ انتهاء الاستمارات والتأمين ورخص القيادة.' : 'Automated monitoring: Mileage-based service alerts, vehicle registration, insurance, and driver license expiries.'}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#0a0b0d] p-2.5 rounded-xl border border-gray-800 shrink-0">
          <div className="text-center px-3 border-l border-gray-800">
            <p className="text-[10px] text-gray-400">{isAr ? 'تجاوزت العداد 🔴' : 'Overdue Mileage 🔴'}</p>
            <p className="text-base font-extrabold text-rose-400">{overdueCount}</p>
          </div>
          <div className="text-center px-3 border-l border-gray-800">
            <p className="text-[10px] text-gray-400">{isAr ? 'قريبة من الصيانة 🟠' : 'Service Due Soon 🟠'}</p>
            <p className="text-base font-extrabold text-amber-400">{urgentCount}</p>
          </div>
          <div className="text-center px-3">
            <p className="text-[10px] text-gray-400">{isAr ? 'إجمالي السيارات' : 'Total Vehicles'}</p>
            <p className="text-base font-extrabold text-white">{vehicles.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#0f1115] border border-gray-800 rounded-2xl p-2 flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'all' ? 'bg-[#cbb26a] text-black shadow-sm' : 'text-gray-300 hover:bg-gray-800/60'}`}
        >
          <Filter className="w-4 h-4" />
          {isAr ? 'عرض جميع التنبيهات' : t('allAlerts', lang)}
        </button>

        <button
          onClick={() => setActiveTab('odometer')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'odometer' ? 'bg-[#cbb26a] text-black shadow-sm' : 'text-gray-300 hover:bg-gray-800/60'}`}
        >
          <Gauge className="w-4 h-4 text-amber-400" />
          {isAr ? `تنبيهات العداد والصيانة (${odometerAlerts.length})` : `${t('odometerAlerts', lang)} (${odometerAlerts.length})`}
        </button>

        <button
          onClick={() => setActiveTab('license')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'license' ? 'bg-[#cbb26a] text-black shadow-sm' : 'text-gray-300 hover:bg-gray-800/60'}`}
        >
          <Car className="w-4 h-4 text-blue-400" />
          {isAr ? `استمارات السيارات (${vehicleLicenses.length})` : `${t('licenseAlerts', lang)} (${vehicleLicenses.length})`}
        </button>

        <button
          onClick={() => setActiveTab('insurance')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'insurance' ? 'bg-[#cbb26a] text-black shadow-sm' : 'text-gray-300 hover:bg-gray-800/60'}`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          {isAr ? `تأمين المركبات (${vehicleInsurances.length})` : `${t('insuranceAlerts', lang)} (${vehicleInsurances.length})`}
        </button>

        <button
          onClick={() => setActiveTab('drivers')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'drivers' ? 'bg-[#cbb26a] text-black shadow-sm' : 'text-gray-300 hover:bg-gray-800/60'}`}
        >
          <Users className="w-4 h-4 text-purple-400" />
          {isAr ? `رخص القيادة (${driverLicenses.length})` : `${t('driverLicenseAlerts', lang)} (${driverLicenses.length})`}
        </button>
      </div>

      {/* Odometer Alerts Section */}
      {(activeTab === 'all' || activeTab === 'odometer') && (
        <div className="bg-[#0f1115] border border-gray-800 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4 border-gray-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Gauge className="w-6 h-6 text-[#cbb26a]" />
                {isAr ? 'تنبيهات الصيانة الدوريّة بناءً على المسافة المقطوعة (Odometer Alerts)' : t('odometerAlerts', lang)}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {isAr ? 'تحديد حد الكيلومترات المستهدف للصيانة الدوريّة (زيت، فلاتر، صيانة شاملة) وتنبيه تلقائي فور اقتراب العداد أو تجاوزه.' : 'Set target odometer for periodic maintenance with automatic alerts when approaching or exceeding the limit.'}
              </p>
            </div>
            <span className="text-xs px-3 py-1.5 bg-[#0a0b0d] border border-gray-800 text-gray-300 rounded-lg">
              {isAr ? 'فاصل الصيانة الافتراضي: 5,000 كم' : 'Default interval: 5,000 km'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {odometerAlerts.map(v => {
              const driver = drivers.find(d => d.id === v.assignedDriverId);
              const { current, target, interval, remaining, isOverdue, isUrgent, isWarning, overdueKm } = v.statusInfo;
              
              const startMileage = Math.max(0, target - interval);
              const drivenInCycle = Math.max(0, current - startMileage);
              const progressPct = Math.min(100, Math.max(0, Math.round((drivenInCycle / interval) * 100)));

              return (
                <div 
                  key={v.id} 
                  className={`p-5 rounded-2xl border transition space-y-4 ${
                    isOverdue 
                      ? 'bg-rose-500/10 border-rose-500/40' 
                      : isUrgent 
                      ? 'bg-amber-500/10 border-amber-500/40'
                      : 'bg-[#0a0b0d] border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 border-b pb-3 border-gray-800/60">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base text-white">
                          {v.make} {v.model}
                        </span>
                        <span className="text-xs font-mono px-2 py-0.5 bg-gray-800 text-gray-300 rounded-md">
                          {v.plateNumber}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {isAr ? 'السائق:' : 'Driver:'} <span className="text-gray-200">{driver ? driver.name : (isAr ? 'غير مخصص' : 'Unassigned')}</span>
                      </p>
                    </div>

                    {isOverdue ? (
                      <span className="bg-rose-500 text-black font-extrabold text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-sm shrink-0">
                        <AlertTriangle className="w-3.5 h-3.5" /> {isAr ? `مستحقة! (+${overdueKm.toLocaleString()} كم)` : `Overdue! (+${overdueKm.toLocaleString()} km)`}
                      </span>
                    ) : isUrgent ? (
                      <span className="bg-amber-500 text-black font-extrabold text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-sm shrink-0">
                        <Clock className="w-3.5 h-3.5" /> {isAr ? `حرج (باقي ${remaining.toLocaleString()} كم)` : `Urgent (${remaining.toLocaleString()} km left)`}
                      </span>
                    ) : isWarning ? (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1 shrink-0">
                        <Clock className="w-3.5 h-3.5" /> {isAr ? `قريب (باقي ${remaining.toLocaleString()} كم)` : `Soon (${remaining.toLocaleString()} km left)`}
                      </span>
                    ) : (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {isAr ? `ساري (باقي ${remaining.toLocaleString()} كم)` : `Good (${remaining.toLocaleString()} km left)`}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center bg-[#0f1115] p-3 rounded-xl border border-gray-800/80">
                    <div>
                      <span className="text-[10px] text-gray-400 block">{isAr ? 'العداد الحالي' : 'Current Odometer'}</span>
                      <span className="text-xs font-mono font-bold text-white">{current.toLocaleString()} km</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">{isAr ? 'حد الصيانة' : 'Service Target'}</span>
                      <span className="text-xs font-mono font-bold text-[#cbb26a]">{target.toLocaleString()} km</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">{isAr ? 'فاصل التكرار' : 'Interval'}</span>
                      <span className="text-xs font-mono font-bold text-gray-300">{interval.toLocaleString()} km</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                      <span>{isAr ? `معدل استهلاك الدورة (${progressPct}%)` : `Cycle Progress (${progressPct}%)`}</span>
                      <span>{isOverdue ? `${isAr ? 'تجاوز الحد بـ' : 'Overdue by'} ${overdueKm.toLocaleString()} km` : `${isAr ? 'باقي' : 'Remaining'} ${remaining.toLocaleString()} km`}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div className={`h-full transition-all duration-500 ${isOverdue ? 'bg-rose-500' : isUrgent ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${progressPct}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-800/80">
                    <button
                      onClick={() => handleOpenEditModal(v)}
                      className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-lg transition flex items-center gap-1.5"
                    >
                      <Settings2 className="w-3.5 h-3.5 text-[#cbb26a]" />
                      {isAr ? 'ضبط حد المسافة' : t('adjustThreshold', lang)}
                    </button>

                    <button
                      onClick={() => handleQuickResetMaintenance(v)}
                      className="px-3 py-1.5 bg-[#cbb26a] hover:bg-[#b89f57] text-black text-xs font-extrabold rounded-lg transition flex items-center gap-1.5 shadow-sm"
                      title={isAr ? 'اعتماد الصيانة وتصفير تنبيه العداد للحد القادم تلقائياً' : 'Complete service and reset alert'}
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-black" />
                      {isAr ? 'إنجاز الصيانة وتجديد العداد' : t('completeService', lang)}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Other Expiries Grid */}
      {activeTab !== 'odometer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {(activeTab === 'all' || activeTab === 'license') && (
            <div className="bg-[#0f1115] border border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="border-b pb-3 border-gray-800 flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-400" />
                  {isAr ? 'استمارات السيارات (رخص السير)' : 'Vehicle Registration'}
                </h3>
              </div>

              <div className="space-y-3">
                {vehicleLicenses.map(v => (
                  <div key={v.id} className={`p-3 rounded-xl border transition ${v.days <= 30 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-[#0a0b0d] border-gray-800'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-white">{v.make} {v.model} ({v.plateNumber})</span>
                      {getUrgencyBadge(v.days)}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
                      <span>{isAr ? 'تاريخ انتهاء الاستمارة:' : 'Registration Expiry:'}</span>
                      <span className="text-gray-200">{v.licenseExpiryDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'insurance') && (
            <div className="bg-[#0f1115] border border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="border-b pb-3 border-gray-800 flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  {isAr ? 'وثائق تأمين المركبات' : 'Insurance Policies'}
                </h3>
              </div>

              <div className="space-y-3">
                {vehicleInsurances.map(v => (
                  <div key={v.id} className={`p-3 rounded-xl border transition ${v.days <= 30 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-[#0a0b0d] border-gray-800'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-white">{v.make} {v.model} ({v.plateNumber})</span>
                      {getUrgencyBadge(v.days)}
                    </div>
                    <p className="text-[11px] text-gray-400 mb-2">{isAr ? 'الشركة:' : 'Company:'} {v.insuranceCompany} • {isAr ? 'الوثيقة:' : 'Policy:'} {v.policyNumber}</p>
                    <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
                      <span>{isAr ? 'تاريخ الانتهاء:' : 'Expiry Date:'}</span>
                      <span className="text-gray-200">{v.insuranceExpiryDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'drivers') && (
            <div className="bg-[#0f1115] border border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="border-b pb-3 border-gray-800 flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  {isAr ? 'رخص قيادة السائقين' : 'Driver Licenses'}
                </h3>
              </div>

              <div className="space-y-3">
                {driverLicenses.map(d => (
                  <div key={d.id} className={`p-3 rounded-xl border transition ${d.days <= 30 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-[#0a0b0d] border-gray-800'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-white">{d.name}</span>
                      {getUrgencyBadge(d.days)}
                    </div>
                    <p className="text-[11px] text-gray-400 mb-2">{isAr ? 'رقم الرخصة:' : 'License No:'} {d.licenseNumber} ({d.licenseCategory})</p>
                    <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
                      <span>{isAr ? 'تاريخ الانتهاء:' : 'Expiry Date:'}</span>
                      <span className="text-gray-200">{d.licenseExpiryDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingVehicle && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1115] border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-3 border-gray-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-[#cbb26a]" />
                {isAr ? `ضبط حد مسافة الصيانة: ${editingVehicle.make} ${editingVehicle.model}` : `Set Maintenance Target: ${editingVehicle.make} ${editingVehicle.model}`}
              </h3>
              <button onClick={() => setEditingVehicle(null)} className="text-gray-400 hover:text-white font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleSaveMileageThreshold} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">{isAr ? 'عداد الكيلومترات الحالي (كم)' : 'Current Odometer (km)'}</label>
                <input type="number" required value={currentMileageInput} onChange={e => setCurrentMileageInput(Number(e.target.value))} className="w-full px-3 py-2.5 bg-[#0a0b0d] border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-[#cbb26a]" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">{isAr ? 'حد العداد المستهدف للصيانة القادمة (كم)' : 'Target Service Mileage (km)'}</label>
                <input type="number" required value={targetMileageInput} onChange={e => setTargetMileageInput(Number(e.target.value))} className="w-full px-3 py-2.5 bg-[#0a0b0d] border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-[#cbb26a]" />
                <span className="text-[11px] text-gray-400 mt-1 block">{isAr ? `سيتم التنبيه فور وصول أو تجاوز العداد لـ ${targetMileageInput.toLocaleString()} كم.` : `Alert will trigger when odometer reaches ${targetMileageInput.toLocaleString()} km.`}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">{isAr ? 'فاصل التكرار الدوري للصيانة (كم)' : 'Service Interval (km)'}</label>
                <select value={intervalInput} onChange={e => setIntervalInput(Number(e.target.value))} className="w-full px-3 py-2.5 bg-[#0a0b0d] border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-[#cbb26a]">
                  <option value={3000}>3,000 km ({isAr ? 'استخدام شاق' : 'Heavy Use'})</option>
                  <option value={5000}>5,000 km ({isAr ? 'قياسي - زيت وفلتر' : 'Standard - Oil & Filter'})</option>
                  <option value={10000}>10,000 km ({isAr ? 'زيت خليط تخليقي' : 'Synthetic Oil'})</option>
                  <option value={15000}>15,000 km ({isAr ? 'شاحنات ونقل ثقيل' : 'Heavy Transport'})</option>
                  <option value={20000}>20,000 km ({isAr ? 'صيانة دورية شاملة' : 'Full Service'})</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button type="button" onClick={() => setEditingVehicle(null)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-xl transition">{isAr ? 'إلغاء' : t('cancel', lang)}</button>
                <button type="submit" className="px-5 py-2 bg-[#cbb26a] hover:bg-[#b89f57] text-black text-xs font-extrabold rounded-xl transition shadow-md">{isAr ? 'حفظ الضبط والتحديث' : 'Save & Update'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};