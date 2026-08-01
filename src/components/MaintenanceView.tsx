import React, { useState } from 'react';
import { MaintenanceRecord, Vehicle, Garage, SparePartItem, CompanySettings } from '../types';
import { Language, t } from '../lib/i18n';
import { formatCurrency, getCurrencySymbol } from '../lib/currency';
import { 
  Wrench, 
  Plus, 
  Building2, 
  Trash2, 
  Calendar as CalendarIcon, 
  FileText, 
  PlusCircle, 
  AlertCircle, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Layers,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Car
} from 'lucide-react';

interface MaintenanceViewProps {
  maintenance: MaintenanceRecord[];
  vehicles: Vehicle[];
  garages: Garage[];
  settings?: CompanySettings;
  onSaveMaintenance: (record: MaintenanceRecord) => void;
  onDeleteMaintenance: (id: string) => void;
  onSaveGarage: (garage: Garage) => void;
  onDeleteGarage?: (id: string) => void;
  lang?: Language;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  maintenance,
  vehicles,
  garages,
  settings,
  onSaveMaintenance,
  onDeleteMaintenance,
  onSaveGarage,
  onDeleteGarage,
  lang = 'en'
}) => {
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<'records' | 'calendar' | 'garages'>('records');
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showGarageModal, setShowGarageModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(new Date().toISOString().slice(0, 10));

  const [formVehicleId, setFormVehicleId] = useState('');
  const [formGarageId, setFormGarageId] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formType, setFormType] = useState<MaintenanceRecord['type']>('breakdown');
  const [formDescription, setFormDescription] = useState('');
  const [formLaborCost, setFormLaborCost] = useState<number>(0);
  const [formInvoiceNumber, setFormInvoiceNumber] = useState('');
  const [formOdometer, setFormOdometer] = useState<number>(0);

  const [parts, setParts] = useState<SparePartItem[]>([
    { id: '1', partName: '', category: 'brakes', quantity: 1, unitCost: 0 }
  ]);

  const [garageForm, setGarageForm] = useState<Partial<Garage>>({
    name: '',
    phone: '',
    contactPerson: '',
    address: '',
    specialty: 'General'
  });

  const addPartRow = () => {
    setParts(prev => [
      ...prev,
      { id: Date.now().toString(), partName: '', category: 'engine', quantity: 1, unitCost: 0 }
    ]);
  };

  const removePartRow = (id: string) => {
    setParts(prev => prev.filter(p => p.id !== id));
  };

  const updatePart = (id: string, field: keyof SparePartItem, val: any) => {
    setParts(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
  };

  const calculateTotalCost = () => {
    const partsTotal = parts.reduce((sum, p) => sum + (p.quantity * p.unitCost), 0);
    return partsTotal + Number(formLaborCost || 0);
  };

  const handleCreateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    if (!formVehicleId || !formGarageId || !formDescription) {
      alert(isAr ? 'يرجى تحديد المركبة والورشة ووصف العطل' : 'Please select vehicle, garage, and provide a description');
      return;
    }

    setIsSubmitting(true);

    try {
      const total = calculateTotalCost();
      const id = `m-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5)}`;

      const record: MaintenanceRecord = {
        id: id,
        vehicleId: formVehicleId,
        garageId: formGarageId,
        date: formDate,
        type: formType,
        description: formDescription,
        parts: parts.filter(p => p.partName.trim() !== ''),
        laborCost: Number(formLaborCost || 0),
        totalCost: total,
        invoiceNumber: formInvoiceNumber || `INV-${Date.now().toString().slice(-4)}`,
        odometerReading: Number(formOdometer || 0),
        status: 'completed'
      };

      // استدعاء دالة الحفظ من App
      await onSaveMaintenance(record);
      setShowRecordModal(false);
      
      // إعادة تعيين النموذج
      setFormVehicleId('');
      setFormGarageId('');
      setFormDescription('');
      setFormLaborCost(0);
      setFormInvoiceNumber('');
      setFormOdometer(0);
      setParts([{ id: '1', partName: '', category: 'brakes', quantity: 1, unitCost: 0 }]);
    } catch (error) {
      alert(isAr ? 'فشل حفظ سجل الصيانة' : 'Failed to save maintenance record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateGarage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!garageForm.name || !garageForm.phone) {
      alert(isAr ? 'يرجى إدخال اسم الكراج ورقم الهاتف' : 'Please enter garage name and phone number');
      return;
    }

    try {
      const newGarage: Garage = {
        id: `g-${Date.now().toString().slice(-4)}`,
        name: garageForm.name || '',
        phone: garageForm.phone || '',
        contactPerson: garageForm.contactPerson || '',
        address: garageForm.address || '',
        rating: 4.5,
        specialty: garageForm.specialty || 'General'
      };

      await onSaveGarage(newGarage);
      setShowGarageModal(false);
      setGarageForm({
        name: '',
        phone: '',
        contactPerson: '',
        address: '',
        specialty: 'General'
      });
    } catch (error) {
      alert(isAr ? 'فشل حفظ الكراج' : 'Failed to save garage');
    }
  };

  const handleDeleteMaintenanceRecord = async (id: string) => {
    if (confirm(isAr ? 'هل أنت متأكد من حذف هذا السجل؟' : 'Are you sure you want to delete this record?')) {
      try {
        await onDeleteMaintenance(id);
      } catch (error) {
        alert(isAr ? 'فشل حذف السجل' : 'Failed to delete record');
      }
    }
  };

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = calendarDate.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'long', year: 'numeric' });

  const recordsByDate: Record<string, MaintenanceRecord[]> = {};
  maintenance.forEach(rec => {
    if (!rec.date) return;
    if (!recordsByDate[rec.date]) recordsByDate[rec.date] = [];
    recordsByDate[rec.date].push(rec);
  });

  const overlapEntries = Object.entries(recordsByDate).filter(([_, recs]) => recs.length > 1);

  const dayNames = isAr 
    ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const selectedDayRecords = selectedDateStr ? (recordsByDate[selectedDateStr] || []) : [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white rounded-2xl p-6 shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Wrench className="w-7 h-7 text-blue-400" />
            {isAr ? 'إدارة الصيانة والتصليح والقطع والكراجات' : 'Fleet Maintenance, Repairs & Garages Management'}
          </h2>
          <p className="text-slate-300 text-sm mt-1">
            {isAr 
              ? 'سجل كافة الإصلاحات، فواتير الكراجات والورش، والقطع المستبدلة لكل سيارة مع تكاليف أجرة اليد وتتبع التداخلات.'
              : 'Log repairs, garage invoices, spare parts, labor costs, and track maintenance service overlaps on the calendar.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowGarageModal(true)}
            className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-xs transition flex items-center gap-2"
          >
            <Building2 className="w-4 h-4" />
            {isAr ? 'إضافة كراج / ورشة' : 'Add Garage / Workshop'}
          </button>

          <button
            onClick={() => setShowRecordModal(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow transition flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {isAr ? 'تسجيل فاتورة صيانة جديدة' : 'Record New Invoice'}
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 space-x-2 rtl:space-x-reverse overflow-x-auto">
        <button
          onClick={() => setActiveTab('records')}
          className={`pb-3 px-4 font-bold text-sm transition border-b-2 whitespace-nowrap flex items-center gap-2 ${activeTab === 'records' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <FileText className="w-4 h-4" />
          {isAr ? `سجل فواتير الصيانة (${maintenance.length})` : `Maintenance Invoices (${maintenance.length})`}
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`pb-3 px-4 font-bold text-sm transition border-b-2 whitespace-nowrap flex items-center gap-2 ${activeTab === 'calendar' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <CalendarIcon className="w-4 h-4" />
          {isAr ? 'نمط التقويم وتداخلات الصيانة' : 'Calendar View & Service Overlaps'}
          {overlapEntries.length > 0 && (
            <span className="px-2 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-extrabold animate-pulse">
              {overlapEntries.length} {isAr ? 'تداخلات' : 'overlaps'}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('garages')}
          className={`pb-3 px-4 font-bold text-sm transition border-b-2 whitespace-nowrap flex items-center gap-2 ${activeTab === 'garages' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Building2 className="w-4 h-4" />
          {isAr ? `دليل الكراجات والورش (${garages.length})` : `Garages Directory (${garages.length})`}
        </button>
      </div>

      {/* RECORDS TAB */}
      {activeTab === 'records' && (
        <div className="space-y-4">
          {maintenance.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center text-slate-500">
              <Wrench className="w-12 h-12 mx-auto text-slate-400 opacity-60" />
              <h3 className="text-lg font-bold mt-4">{isAr ? 'لا توجد سجلات صيانة' : 'No maintenance records'}</h3>
              <p className="text-sm">{isAr ? 'قم بتسجيل أول فاتورة صيانة الآن' : 'Record your first maintenance invoice now'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {maintenance.map(record => {
                const vehicle = vehicles.find(v => v.id === record.vehicleId);
                const garage = garages.find(g => g.id === record.garageId);

                return (
                  <div 
                    key={record.id}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b pb-3 border-slate-100 dark:border-slate-700">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg text-slate-900 dark:text-white">
                            {vehicle ? `${vehicle.make} ${vehicle.model}` : 'Vehicle'} ({vehicle?.plateNumber})
                          </span>
                          <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                            {record.type === 'breakdown' ? (isAr ? 'إصلاح عطل' : 'Breakdown') : record.type === 'periodic' ? (isAr ? 'صيانة دورية' : 'Periodic') : (isAr ? 'حادث/طوارئ' : 'Emergency')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {isAr ? 'الكراج:' : 'Garage:'} <strong className="text-slate-800 dark:text-slate-200">{garage?.name || 'External Workshop'}</strong> • 
                          {isAr ? 'رقم الفاتورة:' : 'Invoice:'} <span className="font-mono">{record.invoiceNumber}</span> • 
                          {isAr ? 'تاريخ:' : 'Date:'} <span className="font-mono">{record.date}</span>
                        </p>
                      </div>

                      <div className="text-left">
                        <span className="text-xs text-slate-400 block">{isAr ? 'التكلفة الإجمالية:' : 'Total Cost:'}</span>
                        <span className="text-xl font-bold text-rose-600 font-mono">
                          {formatCurrency(record.totalCost, settings?.currency, isAr ? 'ar' : 'en')}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {isAr ? 'وصف المشكلة / العمل المنجز:' : 'Work Description:'}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        {record.description}
                      </p>
                    </div>

                    {record.parts && record.parts.length > 0 && (
                      <div className="bg-slate-50/70 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700 space-y-2">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{isAr ? 'القطع المستبدلة بهذه الصيانة:' : 'Replaced Parts:'}</p>
                        <div className="flex flex-wrap gap-2">
                          {record.parts.map((part, idx) => (
                            <span 
                              key={idx} 
                              className="bg-white dark:bg-slate-800 border text-slate-800 dark:text-slate-200 px-3 py-1 rounded-lg text-xs font-medium shadow-xs"
                            >
                              {part.partName} ({part.quantity} {isAr ? 'قطعة' : 'pcs'}) - <strong className="text-blue-600 font-mono">{formatCurrency(part.unitCost * part.quantity, settings?.currency, isAr ? 'ar' : 'en')}</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span>{isAr ? 'تكلفة أجرة اليد (المصنعية):' : 'Labor Cost:'} <strong className="text-slate-800 dark:text-slate-200 font-mono">{formatCurrency(record.laborCost, settings?.currency, isAr ? 'ar' : 'en')}</strong></span>
                      <button
                        onClick={() => handleDeleteMaintenanceRecord(record.id)}
                        className="text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> {isAr ? 'حذف الفاتورة' : 'Delete Record'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CALENDAR TAB */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${overlapEntries.length > 0 ? 'bg-gradient-to-r from-rose-950/80 via-slate-900 to-amber-950/80 border-rose-500/40 text-rose-200 shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl shrink-0 ${overlapEntries.length > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {overlapEntries.length > 0 ? <AlertTriangle className="w-6 h-6 animate-pulse" /> : <CheckCircle2 className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  {isAr ? 'كاشف تداخلات الصيانة الأسطولية' : 'Fleet Maintenance Service Overlap Detector'}
                  {overlapEntries.length > 0 && (
                    <span className="px-2.5 py-0.5 bg-rose-500 text-white rounded-full text-xs font-bold">
                      {overlapEntries.length} {isAr ? 'أيام بها تداخل' : 'overlap days'}
                    </span>
                  )}
                </h3>
                <p className="text-xs mt-0.5 opacity-80">
                  {overlapEntries.length > 0 ? (isAr ? 'تنبيه: تم رصد أيام بها أكثر من مركبة واحدة تحت الصيانة بنفس الوقت!' : 'Alert: Detected dates with multiple vehicles undergoing maintenance simultaneously.') : (isAr ? 'ممتاز! لا يوجد أي تداخل في جدول الصيانة الحالي.' : 'All clear! No overlapping maintenance dates detected.')}
                </p>
              </div>
            </div>

            {overlapEntries.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-400">{isAr ? 'الانتقال للتداخلات:' : 'Jump to Overlap:'}</span>
                {overlapEntries.slice(0, 4).map(([dateStr, recs]) => (
                  <button
                    key={dateStr}
                    onClick={() => {
                      const [y, m, d] = dateStr.split('-').map(Number);
                      setCalendarDate(new Date(y, m - 1, d));
                      setSelectedDateStr(dateStr);
                    }}
                    className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    {dateStr} ({recs.length} {isAr ? 'سيارات' : 'vehicles'})
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold capitalize text-white">{monthName}</h3>
                  <p className="text-xs text-slate-400">{isAr ? 'استعراض مواعيد الفحوصات والإصلاحات والتداخلات' : 'Overview of repairs, periodic services, & overlaps'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setCalendarDate(new Date(year, month - 1, 1))} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition border border-slate-700"><ChevronLeft className="w-5 h-5 rtl:rotate-180" /></button>
                <button onClick={() => { const now = new Date(); setCalendarDate(now); setSelectedDateStr(now.toISOString().slice(0, 10)); }} className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-bold transition">{isAr ? 'اليوم' : 'Today'}</button>
                <button onClick={() => setCalendarDate(new Date(year, month + 1, 1))} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition border border-slate-700"><ChevronRight className="w-5 h-5 rtl:rotate-180" /></button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-bold text-slate-400 pb-2">
              {dayNames.map((d, i) => <div key={i} className="py-1 bg-slate-800/50 rounded-lg">{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {Array.from({ length: firstDayOfWeek }).map((_, idx) => <div key={`empty-${idx}`} className="h-24 sm:h-28 bg-slate-950/30 rounded-xl border border-slate-800/30 opacity-20" />)}

              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayRecords = recordsByDate[dayStr] || [];
                const isSelected = selectedDateStr === dayStr;
                const isToday = new Date().toISOString().slice(0, 10) === dayStr;
                const isOverlap = dayRecords.length > 1;

                return (
                  <div
                    key={dayStr}
                    onClick={() => setSelectedDateStr(dayStr)}
                    className={`h-24 sm:h-28 p-1.5 sm:p-2 rounded-xl border transition cursor-pointer flex flex-col justify-between relative ${
                      isSelected 
                        ? 'bg-blue-900/40 border-blue-400 ring-2 ring-blue-500/30' 
                        : isOverlap
                        ? 'bg-rose-950/30 border-rose-500/50 hover:border-rose-400'
                        : dayRecords.length > 0
                        ? 'bg-slate-800/70 border-slate-700 hover:border-slate-500'
                        : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${isToday ? 'bg-blue-600 text-white font-mono font-extrabold' : 'text-slate-300 font-mono'}`}>
                        {dayNum}
                      </span>
                      {isOverlap && (
                        <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[9px] font-extrabold flex items-center gap-0.5 animate-pulse" title={isAr ? 'تداخل صيانة أكثر من سيارة بنفس اليوم' : 'Multiple vehicles in service overlap'}>
                          <Layers className="w-2.5 h-2.5" />
                          {dayRecords.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 overflow-y-auto max-h-16 no-scrollbar my-0.5">
                      {dayRecords.map(rec => {
                        const v = vehicles.find(veh => veh.id === rec.vehicleId);
                        return (
                          <div
                            key={rec.id}
                            className={`text-[10px] px-1.5 py-0.5 rounded border truncate flex items-center justify-between ${
                              rec.type === 'breakdown'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                : rec.type === 'periodic'
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}
                            title={`${v ? `${v.make} ${v.model}` : 'Vehicle'} - ${rec.description}`}
                          >
                            <span className="truncate">{v ? v.make : 'Car'}</span>
                            <span className="font-mono text-[9px] font-bold opacity-80">{rec.totalCost}</span>
                          </div>
                        );
                      })}
                    </div>

                    {dayRecords.length === 0 && <div className="text-[10px] text-slate-600 text-center py-1 opacity-40">-</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {selectedDateStr && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <h3 className="font-bold text-base text-white">
                    {isAr ? `سجلات وتفاصيل يوم: ${selectedDateStr}` : `Maintenance Details for: ${selectedDateStr}`}
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 bg-slate-800 text-slate-300 rounded-full border border-slate-700">
                    {selectedDayRecords.length} {isAr ? 'عقود / صيانة' : 'records'}
                  </span>
                </div>

                {selectedDayRecords.length > 1 && (
                  <span className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    {isAr ? 'تأكيد تداخل طاقة الورش والأسطول!' : 'Overlap Capacity Warning!'}
                  </span>
                )}
              </div>

              {selectedDayRecords.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  {isAr ? 'لا توجد أعمال صيانة مسجلة في هذا اليوم التحديدي.' : 'No maintenance tasks recorded on this selected date.'}
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedDayRecords.map(record => {
                    const vehicle = vehicles.find(v => v.id === record.vehicleId);
                    const garage = garages.find(g => g.id === record.garageId);

                    return (
                      <div key={record.id} className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                        <div className="flex items-start justify-between border-b border-slate-800 pb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <Car className="w-4 h-4 text-blue-400" />
                              <span className="font-bold text-sm text-white">
                                {vehicle ? `${vehicle.make} ${vehicle.model}` : 'Vehicle'}
                              </span>
                              <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                                {vehicle?.plateNumber}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                              {isAr ? 'الورشة:' : 'Garage:'} <strong className="text-slate-200">{garage?.name || 'External'}</strong>
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-mono font-bold text-rose-400 block">
                              {formatCurrency(record.totalCost, settings?.currency, isAr ? 'ar' : 'en')}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">#{record.invoiceNumber}</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                          {record.description}
                        </p>

                        {record.parts && record.parts.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {record.parts.map((p, idx) => (
                              <span key={idx} className="text-[10px] bg-slate-800 text-slate-200 px-2 py-0.5 rounded border border-slate-700">
                                {p.partName} x{p.quantity} ({formatCurrency(p.unitCost * p.quantity, settings?.currency, isAr ? 'ar' : 'en')})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* GARAGES TAB */}
      {activeTab === 'garages' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {garages.map(garage => (
            <div key={garage.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-3 relative">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{garage.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{garage.specialty}</p>
                </div>
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded">★ {garage.rating || 4.5}</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-xs space-y-1">
                <p><strong>{isAr ? 'مسؤول الورشة:' : 'Contact Person:'}</strong> {garage.contactPerson || 'Manager'}</p>
                <p><strong>{isAr ? 'رقم الجوال:' : 'Phone:'}</strong> {garage.phone}</p>
                <p><strong>{isAr ? 'العنوان:' : 'Address:'}</strong> {garage.address}</p>
              </div>

              <div className="flex items-center justify-between border-t pt-3 border-slate-100 dark:border-slate-700">
                <span className="text-xs text-slate-500">ID: {garage.id.slice(0, 8)}</span>
                {onDeleteGarage && (
                  <button
                    onClick={() => {
                      if (confirm(isAr ? `هل أنت متأكد من حذف الكراج (${garage.name})؟` : `Are you sure you want to delete ${garage.name}?`)) {
                        onDeleteGarage(garage.id);
                      }
                    }}
                    className="text-xs text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> {isAr ? 'حذف' : 'Delete'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RECORD MODAL */}
      {showRecordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700 my-8 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-600" />
                {isAr ? 'تسجيل فاتورة صيانة وتصليح جديدة' : 'Record New Maintenance Invoice'}
              </h3>
              <button onClick={() => setShowRecordModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleCreateMaintenance} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'اختر السيارة *' : 'Select Vehicle *'}</label>
                  <select required value={formVehicleId} onChange={e => setFormVehicleId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700">
                    <option value="">-- {isAr ? 'اختر سيارة' : 'Select Vehicle'} --</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.make} {v.model} - {v.plateNumber}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'الكراج / الورشة *' : 'Garage / Workshop *'}</label>
                  <select required value={formGarageId} onChange={e => setFormGarageId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700">
                    <option value="">-- {isAr ? 'اختر الكراج' : 'Select Garage'} --</option>
                    {garages.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'تاريخ الصيانة' : 'Date'}</label>
                  <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'نوع الإصلاح' : 'Maintenance Type'}</label>
                  <select value={formType} onChange={e => setFormType(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700">
                    <option value="breakdown">{isAr ? 'إصلاح عطل مفاجئ' : 'Breakdown Repair'}</option>
                    <option value="periodic">{isAr ? 'صيانة دورية وزيوت' : 'Periodic Service'}</option>
                    <option value="emergency">{isAr ? 'حادث / طوارئ' : 'Emergency / Accident'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'رقم الفاتورة' : 'Invoice Number'}</label>
                  <input type="text" value={formInvoiceNumber} onChange={e => setFormInvoiceNumber(e.target.value)} placeholder="INV-102" className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'وصف العطل والإصلاح المنجز *' : 'Work Description *'}</label>
                <textarea required rows={2} value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder={isAr ? 'وصف مشكلة السيارة، الملاحظات الإضافية...' : 'Describe the issue and work performed...'} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700" />
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{isAr ? 'قطع الغيار المستبدلة ورسومها' : 'Replaced Parts & Costs'}</h4>
                  <button type="button" onClick={addPartRow} className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1">
                    <PlusCircle className="w-3.5 h-3.5" /> {isAr ? 'إضافة قطعة أخرى' : 'Add Part'}
                  </button>
                </div>

                {parts.map((p, idx) => (
                  <div key={p.id} className="grid grid-cols-12 gap-2 items-center">
                    <input type="text" placeholder={isAr ? 'اسم القطعة' : 'Part Name'} value={p.partName} onChange={e => updatePart(p.id, 'partName', e.target.value)} className="col-span-5 px-2 py-1.5 text-xs border rounded bg-white dark:bg-slate-800" />
                    <input type="number" min={1} placeholder={isAr ? 'الكمية' : 'Qty'} value={p.quantity} onChange={e => updatePart(p.id, 'quantity', Number(e.target.value))} className="col-span-2 px-2 py-1.5 text-xs border rounded bg-white dark:bg-slate-800" />
                    <input type="number" placeholder={isAr ? 'سعر القطعة' : 'Unit Cost'} value={p.unitCost} onChange={e => updatePart(p.id, 'unitCost', Number(e.target.value))} className="col-span-4 px-2 py-1.5 text-xs border rounded bg-white dark:bg-slate-800" />
                    <button type="button" onClick={() => removePartRow(p.id)} className="col-span-1 text-rose-500 hover:text-rose-700 font-bold text-center">✕</button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{isAr ? `أجرة اليد / المصنعية (${getCurrencySymbol(settings?.currency, isAr ? 'ar' : 'en')})` : `Labor Cost (${getCurrencySymbol(settings?.currency, isAr ? 'ar' : 'en')})`}</label>
                  <input type="number" value={formLaborCost} onChange={e => setFormLaborCost(Number(e.target.value))} className="w-full px-3 py-1.5 border rounded text-sm bg-white dark:bg-slate-800" />
                </div>

                <div className="text-left flex flex-col justify-center">
                  <span className="text-xs text-slate-500">{isAr ? 'المبلغ الإجمالي المحسوب:' : 'Calculated Total Amount:'}</span>
                  <span className="text-lg font-bold text-rose-600 font-mono">
                    {formatCurrency(calculateTotalCost(), settings?.currency, isAr ? 'ar' : 'en')}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowRecordModal(false)} className="px-4 py-2 border rounded-lg text-xs font-bold text-slate-600">{isAr ? 'إلغاء' : 'Cancel'}</button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm shadow transition ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ وتسجيل الفاتورة' : 'Save Invoice')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GARAGE MODAL */}
      {showGarageModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                {isAr ? 'إضافة كراج / ورشة صيانة' : 'Add Garage / Workshop'}
              </h3>
              <button onClick={() => setShowGarageModal(false)} className="text-slate-400 font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleCreateGarage} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'اسم الورشة *' : 'Garage Name *'}</label>
                <input type="text" required value={garageForm.name} onChange={e => setGarageForm({ ...garageForm, name: e.target.value })} placeholder={isAr ? 'مركز العالمية للصيانة...' : 'Al-Alamiya Workshop...'} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'رقم الهاتف *' : 'Phone Number *'}</label>
                <input type="text" required value={garageForm.phone} onChange={e => setGarageForm({ ...garageForm, phone: e.target.value })} placeholder="0110000000" className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'المسؤول والعنوان' : 'Address & Contact'}</label>
                <input type="text" value={garageForm.address} onChange={e => setGarageForm({ ...garageForm, address: e.target.value })} placeholder={isAr ? 'حي الصناعية - الرياض' : 'Industrial Area - Riyadh'} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900" />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowGarageModal(false)} className="px-3 py-1.5 border rounded text-xs font-bold">{isAr ? 'إلغاء' : 'Cancel'}</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded text-xs shadow">{isAr ? 'حفظ الورشة' : 'Save Garage'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};