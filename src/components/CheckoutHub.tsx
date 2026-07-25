import React, { useState } from 'react';
import { Vehicle, Driver, CheckoutSession, CompanySettings, InspectionChecklist } from '../types';
import { SignatureCanvas } from './SignatureCanvas';
import { 
  KeyRound, 
  CheckCircle2, 
  Clock, 
  Car, 
  UserCheck, 
  ArrowLeftRight, 
  Plus, 
  Calendar, 
  Gauge, 
  FileText, 
  Printer, 
  RotateCcw,
  Sparkles,
  ShieldCheck,
  ListChecks,
  CheckSquare,
  Square,
  ShieldAlert
} from 'lucide-react';

interface CheckoutHubProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  checkouts: CheckoutSession[];
  settings: CompanySettings;
  onSaveCheckout: (newSession: CheckoutSession) => void;
  onReturnVehicle: (sessionId: string, returnData: Partial<CheckoutSession>) => void;
  onPrintReceipt: (session: CheckoutSession) => void;
  lang?: 'ar' | 'en';
}

export const CheckoutHub: React.FC<CheckoutHubProps> = ({
  vehicles,
  drivers,
  checkouts,
  settings,
  onSaveCheckout,
  onReturnVehicle,
  onPrintReceipt,
  lang = 'ar'
}) => {
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<'checkout_form' | 'active_list' | 'history'>('active_list');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedReturnSession, setSelectedReturnSession] = useState<CheckoutSession | null>(null);

  // New Checkout Form state
  const availableVehicles = vehicles.filter(v => v.status === 'available');
  
  const [formVehicleId, setFormVehicleId] = useState('');
  const [formDriverId, setFormDriverId] = useState('');
  const [formPurpose, setFormPurpose] = useState<CheckoutSession['purpose']>('official');
  const [formPurposeCustom, setFormPurposeCustom] = useState('');
  const [formCheckoutTime, setFormCheckoutTime] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });
  const [formOdometer, setFormOdometer] = useState<number>(0);
  const [formFuelLevel, setFormFuelLevel] = useState<CheckoutSession['checkoutFuelLevel']>('100%');
  const [formNotes, setFormNotes] = useState('');
  const [formSignature, setFormSignature] = useState('');

  // Optional Inspection Checklist State
  const [showChecklist, setShowChecklist] = useState<boolean>(true);
  const [formChecklist, setFormChecklist] = useState<InspectionChecklist>({
    noScratches: true,
    spareTire: true,
    fireExtinguisher: true,
    warningTriangle: true,
    registrationDoc: true,
    cleanliness: true
  });

  // Return Modal Form state
  const [returnTime, setReturnTime] = useState(() => new Date().toISOString().slice(0, 16));
  const [returnOdometer, setReturnOdometer] = useState<number>(0);
  const [returnFuelLevel, setReturnFuelLevel] = useState<CheckoutSession['returnFuelLevel']>('100%');
  const [returnNotes, setReturnNotes] = useState('');
  const [returnSignature, setReturnSignature] = useState('');

  const handleVehicleSelect = (vId: string) => {
    setFormVehicleId(vId);
    const v = vehicles.find(veh => veh.id === vId);
    if (v) {
      setFormOdometer(v.mileage);
    }
  };

  const handleCreateCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formVehicleId || !formDriverId) {
      alert('يرجى اختيار السيارة والسائق/المستلم');
      return;
    }
    if (!formSignature) {
      alert('يرجى وضع توقيع المستلم في الخانة المخصصة للتوقيع الإلكتروني');
      return;
    }

    const newSession: CheckoutSession = {
      id: `chk-${Date.now().toString().slice(-5)}`,
      vehicleId: formVehicleId,
      driverId: formDriverId,
      purpose: formPurpose,
      purposeCustom: formPurposeCustom || (
        formPurpose === 'quick_task' ? 'استخدام سريع (ساعة أو أقل)' : 
        formPurpose === 'official' ? 'عمل رسمي للشركة' : 'زيارة عملاء وتوصيل'
      ),
      checkoutTime: formCheckoutTime,
      checkoutOdometer: formOdometer,
      checkoutFuelLevel: formFuelLevel,
      checkoutSignature: formSignature,
      checkoutNotes: formNotes,
      checkoutChecklist: formChecklist,
      status: 'active'
    };

    onSaveCheckout(newSession);
    setShowCheckoutModal(false);
    resetForm();
    setActiveTab('active_list');
  };

  const handleOpenReturn = (session: CheckoutSession) => {
    setSelectedReturnSession(session);
    setReturnOdometer(session.checkoutOdometer + 10); // default suggested
    setReturnNotes('');
    setReturnSignature('');
    setReturnTime(new Date().toISOString().slice(0, 16));
  };

  const handleSubmitReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturnSession) return;
    if (!returnSignature) {
      alert('يرجى إضافة توقيع مستلم/مسلم السيارة عند العودة');
      return;
    }

    onReturnVehicle(selectedReturnSession.id, {
      returnTime,
      returnOdometer,
      returnFuelLevel,
      returnNotes,
      returnSignature,
      status: 'completed'
    });

    setSelectedReturnSession(null);
  };

  const resetForm = () => {
    setFormVehicleId('');
    setFormDriverId('');
    setFormPurpose('official');
    setFormPurposeCustom('');
    setFormNotes('');
    setFormSignature('');
    setFormChecklist({
      noScratches: true,
      spareTire: true,
      fireExtinguisher: true,
      warningTriangle: true,
      registrationDoc: true,
      cleanliness: true
    });
  };

  const activeSessions = checkouts.filter(c => c.status === 'active');
  const completedSessions = checkouts.filter(c => c.status === 'completed');

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <KeyRound className="w-7 h-7 text-emerald-400" />
            {isAr ? 'منصة أون لاين لاستلام وتسليم السيارات والتوقيع' : 'Online Handover & Digital Signature Platform'}
          </h2>
          <p className="text-emerald-100 text-sm mt-1">
            {isAr ? 'تسجيل خروج ودخول المركبات بالوقت والدقيقة والتوقيع الإلكتروني للموظف (سواءً للاستخدام السريع أقل من ساعة أو المهمات الرسمية الطويلة).' : 'Record vehicle checkouts and returns with timestamps and digital employee signatures.'}
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowCheckoutModal(true);
          }}
          className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-xl text-sm shadow-md transition flex items-center gap-2 shrink-0"
        >
          <Plus className="w-5 h-5" />
          {isAr ? 'استلام سيارة جديدة الآن (توقيع وتسليم)' : 'Checkout Vehicle Now (Sign & Handover)'}
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 space-x-2 space-x-reverse">
        <button
          onClick={() => setActiveTab('active_list')}
          className={`pb-3 px-4 font-bold text-sm transition border-b-2 flex items-center gap-2 ${
            activeTab === 'active_list'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          {isAr ? `السيارات المخرجة حالياً (${activeSessions.length})` : `Currently Checked Out (${activeSessions.length})`}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-4 font-bold text-sm transition border-b-2 flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          {isAr ? `سجل التسليم والإعادة المكتمل (${completedSessions.length})` : `Completed Handover History (${completedSessions.length})`}
        </button>
      </div>

      {/* ACTIVE SESSIONS LIST */}
      {activeTab === 'active_list' && (
        <div className="space-y-4">
          {activeSessions.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center text-slate-500 space-y-3">
              <Car className="w-12 h-12 mx-auto text-slate-400 opacity-60" />
              <h3 className="text-lg font-bold">جميع سيارات الشركة متوفرة وفي العهدة حالياً</h3>
              <p className="text-xs">لا يوجد أي سيارة مخرجة لمهمة أو موظف في الوقت الحالي.</p>
              <button
                onClick={() => setShowCheckoutModal(true)}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg text-xs"
              >
                تسجيل إخراج واستلام سيارة
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeSessions.map(session => {
                const vehicle = vehicles.find(v => v.id === session.vehicleId);
                const driver = drivers.find(d => d.id === session.driverId);

                return (
                  <div 
                    key={session.id}
                    className="bg-white dark:bg-slate-800 border-2 border-amber-300 dark:border-amber-800/80 rounded-2xl p-5 shadow-sm space-y-4 relative"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="inline-block bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full mb-1">
                          قيد الاستخدام الميداني
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          {vehicle ? `${vehicle.make} ${vehicle.model}` : 'سيارة'} ({vehicle?.plateNumber})
                        </h3>
                        <p className="text-xs text-slate-500 font-mono">عداد الخروج: {session.checkoutOdometer.toLocaleString()} كم</p>
                      </div>
                      <button
                        onClick={() => onPrintReceipt(session)}
                        className="p-2 text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition text-xs flex items-center gap-1"
                        title="طباعة إيصال الاستلام"
                      >
                        <Printer className="w-4 h-4" />
                        إيصال
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">المستلم:</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{driver?.name || 'مستلم'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">سبب الاستخدام:</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{session.purposeCustom || session.purpose}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">وقت الاستلام:</span>
                        <p className="font-semibold text-slate-700 dark:text-slate-300">
                          {new Date(session.checkoutTime).toLocaleString('ar-SA')}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">مستوى البنزين عند الخروج:</span>
                        <p className="font-semibold text-emerald-600">{session.checkoutFuelLevel}</p>
                      </div>

                      {session.checkoutChecklist && (
                        <div className="col-span-2 pt-1 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 flex items-center gap-1 font-medium">
                            <ListChecks className="w-3.5 h-3.5 text-emerald-500" /> فحص المعدات والخسائر:
                          </span>
                          <span className="font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
                            {Object.values(session.checkoutChecklist).filter(Boolean).length} / 6 بنود مؤكدة
                          </span>
                        </div>
                      )}
                    </div>

                    {session.checkoutSignature && (
                      <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-2 bg-slate-50/50">
                        <span className="text-[10px] text-slate-400 block mb-1">توقيع المستلم عند الخروج:</span>
                        <img src={session.checkoutSignature} alt="Sig" className="max-h-12 mx-auto object-contain" />
                      </div>
                    )}

                    <button
                      onClick={() => handleOpenReturn(session)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      <RotateCcw className="w-4 h-4" />
                      تسجيل إعادة واستلام السيارة للشركة الآن
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* COMPLETED HISTORY LIST */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs">
                  <th className="p-3 rounded-r-lg">السيارة واللوحة</th>
                  <th className="p-3">المستلم</th>
                  <th className="p-3">الغرض</th>
                  <th className="p-3">خروج</th>
                  <th className="p-3">إعادة</th>
                  <th className="p-3">المسافة</th>
                  <th className="p-3">التوقيعات</th>
                  <th className="p-3 rounded-l-lg">طباعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {completedSessions.map(session => {
                  const vehicle = vehicles.find(v => v.id === session.vehicleId);
                  const driver = drivers.find(d => d.id === session.driverId);
                  const distanceDriven = (session.returnOdometer || session.checkoutOdometer) - session.checkoutOdometer;

                  return (
                    <tr key={session.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/40 transition">
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                        {vehicle ? `${vehicle.make} ${vehicle.model}` : 'مركبة'}
                        <span className="block text-xs font-normal text-slate-500">{vehicle?.plateNumber}</span>
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">{driver?.name}</td>
                      <td className="p-3 text-xs text-slate-600">{session.purposeCustom || session.purpose}</td>
                      <td className="p-3 text-xs dir-ltr text-right">{new Date(session.checkoutTime).toLocaleDateString('ar-SA')}</td>
                      <td className="p-3 text-xs dir-ltr text-right">
                        {session.returnTime ? new Date(session.returnTime).toLocaleDateString('ar-SA') : '-'}
                      </td>
                      <td className="p-3 text-xs font-mono font-bold text-emerald-600">{distanceDriven} كم</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          {session.checkoutSignature && (
                            <img src={session.checkoutSignature} alt="Out" className="h-5 border rounded" title="توقيع الخروج" />
                          )}
                          {session.returnSignature && (
                            <img src={session.returnSignature} alt="In" className="h-5 border rounded border-emerald-300" title="توقيع الإعادة" />
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => onPrintReceipt(session)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="طباعة إيصال الحركة"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NEW CHECKOUT MODAL */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700 my-8 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-600" />
                نموذج استلام وتسليم سيارة (مع التوقيع الإلكتروني)
              </h3>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCheckout} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vehicle Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    اختر السيارة المتوفرة *
                  </label>
                  <select
                    required
                    value={formVehicleId}
                    onChange={e => handleVehicleSelect(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  >
                    <option value="">-- اختر مركبة --</option>
                    {availableVehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.make} {v.model} - {v.plateNumber} ({v.mileage} كم)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Driver / Employee Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    المستلم / السائق *
                  </label>
                  <select
                    required
                    value={formDriverId}
                    onChange={e => setFormDriverId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  >
                    <option value="">-- اختر المستلم --</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.department})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Usage Purpose & Quick Task Mode */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    حالة / نوع الاستخدام *
                  </label>
                  <select
                    value={formPurpose}
                    onChange={e => setFormPurpose(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  >
                    <option value="official">مهمة عمل رسمية</option>
                    <option value="quick_task">⚡ استخدام سريع (ساعة أو أقل)</option>
                    <option value="client_delivery">توصيل عملاء / بضائع</option>
                    <option value="maintenance">إيصال لورشة الصيانة</option>
                    <option value="personal_temporary">استخدام شخصي مؤقت</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    تفاصيل المهمة / الوجهة
                  </label>
                  <input
                    type="text"
                    value={formPurposeCustom}
                    onChange={e => setFormPurposeCustom(e.target.value)}
                    placeholder="مثال: توصيل مستندات للمطار / زيارة فرع..."
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              {/* Odometer & Fuel Level */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    تاريخ ووقت الاستلام
                  </label>
                  <input
                    type="datetime-local"
                    value={formCheckoutTime}
                    onChange={e => setFormCheckoutTime(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    عداد الكيلومترات عند الخروج
                  </label>
                  <input
                    type="number"
                    value={formOdometer}
                    onChange={e => setFormOdometer(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    مستوى الوقود الحالي
                  </label>
                  <select
                    value={formFuelLevel}
                    onChange={e => setFormFuelLevel(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  >
                    <option value="100%">خزان ممتلئ (100%)</option>
                    <option value="75%">ثلاثة أرباع (75%)</option>
                    <option value="50%">نصف الخزان (50%)</option>
                    <option value="25%">الربع (25%)</option>
                    <option value="10%">منخفض جداً (10%)</option>
                  </select>
                </div>
              </div>

              {/* OPTIONAL INSPECTION CHECKLIST (قائمة فحص السلامة والمعدات) */}
              <div className="border border-emerald-500/30 rounded-xl bg-slate-50 dark:bg-slate-900/60 p-4 space-y-3">
                <div 
                  className="flex items-center justify-between cursor-pointer select-none"
                  onClick={() => setShowChecklist(!showChecklist)}
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
                      <ListChecks className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        قائمة فحص السلامة والمعدات قبل الاستلام (اختياري)
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                          {Object.values(formChecklist).filter(Boolean).length} / 6 بنود مؤكدة
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        تأكيد خلو المركبة من الخدوش وتوفر معدات الطوارئ (الإطار الاحتياطي، طفاية الحريق، الاستمارة)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormChecklist({
                          noScratches: true,
                          spareTire: true,
                          fireExtinguisher: true,
                          warningTriangle: true,
                          registrationDoc: true,
                          cleanliness: true
                        });
                      }}
                      className="px-2.5 py-1 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] rounded-lg transition border border-emerald-500/20"
                    >
                      تحديد الكل كسليم ✓
                    </button>
                  </div>
                </div>

                {showChecklist && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <label className="flex items-center gap-2.5 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-emerald-500 transition text-xs font-semibold">
                      <input
                        type="checkbox"
                        checked={!!formChecklist.noScratches}
                        onChange={(e) => setFormChecklist(prev => ({ ...prev, noScratches: e.target.checked }))}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <span className="text-slate-800 dark:text-slate-200">خلو الهيكل الخارجي من الخدوش والصدمات</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-emerald-500 transition text-xs font-semibold">
                      <input
                        type="checkbox"
                        checked={!!formChecklist.spareTire}
                        onChange={(e) => setFormChecklist(prev => ({ ...prev, spareTire: e.target.checked }))}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <span className="text-slate-800 dark:text-slate-200">وجود الإطار الاحتياطي ورافعة العجلات</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-emerald-500 transition text-xs font-semibold">
                      <input
                        type="checkbox"
                        checked={!!formChecklist.fireExtinguisher}
                        onChange={(e) => setFormChecklist(prev => ({ ...prev, fireExtinguisher: e.target.checked }))}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <span className="text-slate-800 dark:text-slate-200">طفاية الحريق وجاهزيتها</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-emerald-500 transition text-xs font-semibold">
                      <input
                        type="checkbox"
                        checked={!!formChecklist.warningTriangle}
                        onChange={(e) => setFormChecklist(prev => ({ ...prev, warningTriangle: e.target.checked }))}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <span className="text-slate-800 dark:text-slate-200">مثلث السلامة وحقيبة الإسعافات الأوّلية</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-emerald-500 transition text-xs font-semibold">
                      <input
                        type="checkbox"
                        checked={!!formChecklist.registrationDoc}
                        onChange={(e) => setFormChecklist(prev => ({ ...prev, registrationDoc: e.target.checked }))}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <span className="text-slate-800 dark:text-slate-200">وجود رخصة سير المركبة (الاستمارة)</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-emerald-500 transition text-xs font-semibold">
                      <input
                        type="checkbox"
                        checked={!!formChecklist.cleanliness}
                        onChange={(e) => setFormChecklist(prev => ({ ...prev, cleanliness: e.target.checked }))}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <span className="text-slate-800 dark:text-slate-200">نظافة هيكل السيارة والمقصورة الداخلية</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Signature Canvas Pad */}
              <div className="border-t pt-4 border-slate-100 dark:border-slate-700">
                <SignatureCanvas
                  label="توقيع الموظف المستلم (وقع الإصبع أو الماوس في الصندوق)"
                  onSave={dataUrl => setFormSignature(dataUrl)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ملاحظات أو خدوش مسبقة بالسيارة
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="ملاحظات حول النظافة أو حالة المركبة عند الاستلام"
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-bold text-slate-600"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm shadow transition"
                >
                  اعتماد استلام السيارة والتوقيع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RETURN VEHICLE MODAL */}
      {selectedReturnSession && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-emerald-600" />
                إعادة واستلام السيارة من الموظف
              </h3>
              <button
                onClick={() => setSelectedReturnSession(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReturn} className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-xs space-y-1">
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  سيارة: {vehicles.find(v => v.id === selectedReturnSession.vehicleId)?.make}{' '}
                  ({vehicles.find(v => v.id === selectedReturnSession.vehicleId)?.plateNumber})
                </p>
                <p className="text-slate-500">
                  عداد الاستلام عند الخروج: {selectedReturnSession.checkoutOdometer.toLocaleString()} كم
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    وقت الإعادة والتسليم
                  </label>
                  <input
                    type="datetime-local"
                    value={returnTime}
                    onChange={e => setReturnTime(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    عداد الكيلومترات الحالي
                  </label>
                  <input
                    type="number"
                    required
                    min={selectedReturnSession.checkoutOdometer}
                    value={returnOdometer}
                    onChange={e => setReturnOdometer(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  مستوى البنزين عند العودة
                </label>
                <select
                  value={returnFuelLevel}
                  onChange={e => setReturnFuelLevel(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                >
                  <option value="100%">خزان ممتلئ (100%)</option>
                  <option value="75%">ثلاثة أرباع (75%)</option>
                  <option value="50%">نصف الخزان (50%)</option>
                  <option value="25%">الربع (25%)</option>
                  <option value="10%">منخفض جداً (10%)</option>
                </select>
              </div>

              {/* Signature Canvas Pad for Return */}
              <div className="border-t pt-3 border-slate-100 dark:border-slate-700">
                <SignatureCanvas
                  label="توقيع مسلّم السيارة عند العودة والعودة للعهدة"
                  onSave={dataUrl => setReturnSignature(dataUrl)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ملاحظات الإعادة وحالة السيارة
                </label>
                <input
                  type="text"
                  value={returnNotes}
                  onChange={e => setReturnNotes(e.target.value)}
                  placeholder="تم فحص النظافة والسلامة وسليمة..."
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReturnSession(null)}
                  className="px-4 py-2 border rounded-lg text-xs font-bold text-slate-600"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm shadow transition"
                >
                  إكمال العودة وتحديث حالة المركبة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
