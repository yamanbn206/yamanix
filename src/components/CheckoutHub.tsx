import React, { useState } from 'react';
import { Vehicle, Driver, CheckoutSession, CompanySettings, InspectionChecklist, Profile } from '../types';
import { SignatureCanvas } from './SignatureCanvas';
import { Language, t } from '../lib/i18n';
import { 
  KeyRound, 
  CheckCircle2, 
  Clock, 
  Car, 
  UserCheck, 
  Plus, 
  Calendar, 
  Gauge, 
  FileText, 
  Printer, 
  RotateCcw,
  ListChecks,
  Trash2,
  RefreshCw
} from 'lucide-react';

interface CheckoutHubProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  checkouts: CheckoutSession[];
  settings: CompanySettings;
  profile?: Profile | null;
  onSaveCheckout: (newSession: CheckoutSession) => void;
  onReturnVehicle: (sessionId: string, returnData: Partial<CheckoutSession>) => void;
  onPrintReceipt: (session: CheckoutSession) => void;
  onDeleteCheckout?: (id: string) => void;
  lang?: 'ar' | 'en';
  onRefresh?: () => void;
}

export const CheckoutHub: React.FC<CheckoutHubProps> = ({
  vehicles,
  drivers,
  checkouts,
  settings,
  profile,
  onSaveCheckout,
  onReturnVehicle,
  onPrintReceipt,
  onDeleteCheckout,
  lang = 'en',
  onRefresh
}) => {
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<'checkout_form' | 'active_list' | 'history'>('active_list');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedReturnSession, setSelectedReturnSession] = useState<CheckoutSession | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const [showChecklist, setShowChecklist] = useState<boolean>(true);
  const [formChecklist, setFormChecklist] = useState<InspectionChecklist>({
    noScratches: true,
    spareTire: true,
    fireExtinguisher: true,
    warningTriangle: true,
    registrationDoc: true,
    cleanliness: true
  });

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

  const handleCreateCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    if (!formVehicleId || !formDriverId) {
      alert(isAr ? 'يرجى اختيار السيارة والسائق/المستلم' : 'Please select vehicle and driver');
      return;
    }
    if (!formSignature) {
      alert(isAr ? 'يرجى وضع توقيع المستلم في الخانة المخصصة للتوقيع الإلكتروني' : 'Please provide driver signature');
      return;
    }

    setIsSubmitting(true);

    try {
      const id = `chk-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6)}`;
      const companyId = settings.companyId || null;

      const newSession: CheckoutSession = {
        id,
        vehicleId: formVehicleId,
        driverId: formDriverId,
        purpose: formPurpose,
        purposeCustom: formPurposeCustom || (
          formPurpose === 'quick_task' ? 'Quick task (1 hour or less)' : 
          formPurpose === 'official' ? 'Official business' : 'Client delivery'
        ),
        checkoutTime: formCheckoutTime,
        checkoutOdometer: formOdometer,
        checkoutFuelLevel: formFuelLevel,
        checkoutSignature: formSignature,
        checkoutNotes: formNotes,
        checkoutChecklist: formChecklist,
        status: 'active',
        companyId
      };

      await onSaveCheckout(newSession);
      setShowCheckoutModal(false);
      resetForm();
      setActiveTab('active_list');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert(isAr ? 'حدث خطأ أثناء إنشاء طلب الاستلام' : 'Error creating checkout session');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReturn = (session: CheckoutSession) => {
    setSelectedReturnSession(session);
    setReturnOdometer((session.checkoutOdometer || 0) + 10);
    setReturnNotes('');
    setReturnSignature('');
    setReturnTime(new Date().toISOString().slice(0, 16));
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturnSession) return;
    if (!returnSignature) {
      alert(isAr ? 'يرجى إضافة توقيع مستلم/مسلم السيارة عند العودة' : 'Please provide return signature');
      return;
    }

    try {
      const updatedSession = {
        ...selectedReturnSession,
        returnTime,
        returnOdometer,
        returnFuelLevel,
        returnNotes,
        returnSignature,
        status: 'completed' as const
      };

      await onReturnVehicle(selectedReturnSession.id, {
        returnTime,
        returnOdometer,
        returnFuelLevel,
        returnNotes,
        returnSignature,
        status: 'completed'
      });

      onPrintReceipt(updatedSession);
      setSelectedReturnSession(null);
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(isAr ? 'فشل حفظ عملية الإعادة' : 'Failed to save return');
    }
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

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    if (onRefresh) await onRefresh();
    setIsRefreshing(false);
  };

  const activeSessions = checkouts.filter(c => c.status === 'active');
  const completedSessions = checkouts.filter(c => c.status === 'completed');

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <KeyRound className="w-7 h-7 text-emerald-400" />
            {t('checkoutTitle', lang)}
          </h2>
          <p className="text-emerald-100 text-sm mt-1">
            {t('checkoutSubtitle', lang)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl text-xs shadow transition flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isAr ? 'تحديث' : 'Refresh'}
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowCheckoutModal(true);
            }}
            className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-xl text-sm shadow-md transition flex items-center gap-2 shrink-0"
          >
            <Plus className="w-5 h-5" />
            {t('checkoutNow', lang)}
          </button>
        </div>
      </div>

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
          {isAr ? `السيارات المخرجة حالياً (${activeSessions.length})` : `${t('currentlyCheckedOut', lang)} (${activeSessions.length})`}
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
          {isAr ? `سجل التسليم والإعادة المكتمل (${completedSessions.length})` : `${t('completedHistory', lang)} (${completedSessions.length})`}
        </button>
      </div>

      {activeTab === 'active_list' && (
        <div className="space-y-4">
          {activeSessions.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center text-slate-500 space-y-3">
              <Car className="w-12 h-12 mx-auto text-slate-400 opacity-60" />
              <h3 className="text-lg font-bold">{t('noActiveSessions', lang)}</h3>
              <p className="text-xs">{isAr ? 'لا يوجد أي سيارة مخرجة لمهمة أو موظف في الوقت الحالي.' : 'No vehicles are currently checked out.'}</p>
              <button
                onClick={() => setShowCheckoutModal(true)}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg text-xs"
              >
                {t('checkoutNow', lang)}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeSessions.map(session => {
                const vehicle = vehicles.find(v => v.id === session.vehicleId);
                const driver = drivers.find(d => d.id === session.driverId);
                return (
                  <div key={session.id} className="bg-white dark:bg-slate-800 border-2 border-amber-300 dark:border-amber-800/80 rounded-2xl p-5 shadow-sm space-y-4 relative">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="inline-block bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full mb-1">
                          {isAr ? 'قيد الاستخدام الميداني' : 'Active Checkout'}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          {vehicle ? `${vehicle.make} ${vehicle.model}` : 'Vehicle'} ({vehicle?.plateNumber})
                        </h3>
                        <p className="text-xs text-slate-500 font-mono">
                          {isAr ? 'عداد الخروج:' : 'Checkout Odometer:'} {(session.checkoutOdometer ?? 0).toLocaleString()} km
                        </p>
                      </div>
                      <button
                        onClick={() => onPrintReceipt(session)}
                        className="p-2 text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition text-xs flex items-center gap-1"
                      >
                        <Printer className="w-4 h-4" />
                        {t('printReceipt', lang)}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">{isAr ? 'المستلم:' : 'Driver:'}</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{driver?.name || 'Driver'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">{isAr ? 'سبب الاستخدام:' : 'Purpose:'}</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{session.purposeCustom || session.purpose}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">{isAr ? 'وقت الاستلام:' : 'Checkout Time:'}</span>
                        <p className="font-semibold text-slate-700 dark:text-slate-300">
                          {new Date(session.checkoutTime).toLocaleString('en-US')}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">{isAr ? 'مستوى البنزين عند الخروج:' : 'Fuel Level:'}</span>
                        <p className="font-semibold text-emerald-600">{session.checkoutFuelLevel}</p>
                      </div>
                      {session.checkoutChecklist && (
                        <div className="col-span-2 pt-1 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 flex items-center gap-1 font-medium">
                            <ListChecks className="w-3.5 h-3.5 text-emerald-500" /> {isAr ? 'فحص المعدات والخسائر:' : 'Checklist:'}
                          </span>
                          <span className="font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
                            {Object.values(session.checkoutChecklist).filter(Boolean).length} / 6 {isAr ? 'بنود مؤكدة' : 'confirmed'}
                          </span>
                        </div>
                      )}
                    </div>

                    {session.checkoutSignature && (
                      <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-2 bg-slate-50/50">
                        <span className="text-[10px] text-slate-400 block mb-1">{isAr ? 'توقيع المستلم عند الخروج:' : 'Checkout Signature:'}</span>
                        <img src={session.checkoutSignature} alt="Sig" className="max-h-12 mx-auto object-contain" />
                      </div>
                    )}

                    <button
                      onClick={() => handleOpenReturn(session)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      <RotateCcw className="w-4 h-4" />
                      {isAr ? 'تسجيل إعادة واستلام السيارة للشركة الآن' : 'Return Vehicle Now'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs">
                  <th className="p-3 rounded-r-lg">{isAr ? 'السيارة واللوحة' : 'Vehicle'}</th>
                  <th className="p-3">{isAr ? 'المستلم' : 'Driver'}</th>
                  <th className="p-3">{isAr ? 'الغرض' : 'Purpose'}</th>
                  <th className="p-3">{isAr ? 'خروج' : 'Checkout'}</th>
                  <th className="p-3">{isAr ? 'إعادة' : 'Return'}</th>
                  <th className="p-3">{isAr ? 'المسافة' : 'Distance'}</th>
                  <th className="p-3">{isAr ? 'التوقيعات' : 'Signatures'}</th>
                  <th className="p-3">{isAr ? 'طباعة' : 'Print'}</th>
                  {profile?.role === 'admin' && (
                    <th className="p-3 rounded-l-lg">{isAr ? 'حذف' : 'Delete'}</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {completedSessions.map(session => {
                  const vehicle = vehicles.find(v => v.id === session.vehicleId);
                  const driver = drivers.find(d => d.id === session.driverId);
                  const checkoutOdo = session.checkoutOdometer || 0;
                  const returnOdo = session.returnOdometer || 0;
                  const distanceDriven = Math.max(0, returnOdo - checkoutOdo);
                  return (
                    <tr key={session.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/40 transition">
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                        {vehicle ? `${vehicle.make} ${vehicle.model}` : 'Vehicle'}
                        <span className="block text-xs font-normal text-slate-500">{vehicle?.plateNumber}</span>
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">{driver?.name}</td>
                      <td className="p-3 text-xs text-slate-600">{session.purposeCustom || session.purpose}</td>
                      <td className="p-3 text-xs dir-ltr text-right">{new Date(session.checkoutTime).toLocaleDateString('en-US')}</td>
                      <td className="p-3 text-xs dir-ltr text-right">
                        {session.returnTime ? new Date(session.returnTime).toLocaleDateString('en-US') : '-'}
                      </td>
                      <td className="p-3 text-xs font-mono font-bold text-emerald-600">{distanceDriven.toLocaleString()} km</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          {session.checkoutSignature && (
                            <img src={session.checkoutSignature} alt="Out" className="h-5 border rounded" />
                          )}
                          {session.returnSignature && (
                            <img src={session.returnSignature} alt="In" className="h-5 border rounded border-emerald-300" />
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => onPrintReceipt(session)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                      {profile?.role === 'admin' && onDeleteCheckout && (
                        <td className="p-3">
                          <button
                            onClick={() => {
                              if (confirm(isAr ? 'هل أنت متأكد من حذف هذه الجلسة؟' : 'Are you sure you want to delete this session?')) {
                                onDeleteCheckout(session.id);
                              }
                            }}
                            className="text-rose-500 hover:text-rose-700 text-xs font-bold flex items-center gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700 my-8 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-600" />
                {isAr ? 'نموذج استلام وتسليم سيارة (مع التوقيع الإلكتروني)' : 'New Checkout Form (with Digital Signature)'}
              </h3>
              <button onClick={() => setShowCheckoutModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateCheckout} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'اختر السيارة المتوفرة *' : 'Select Vehicle *'}
                  </label>
                  <select
                    required
                    value={formVehicleId}
                    onChange={e => handleVehicleSelect(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  >
                    <option value="">-- {isAr ? 'اختر مركبة' : 'Select Vehicle'} --</option>
                    {availableVehicles.length === 0 ? (
                      <option value="" disabled>{isAr ? 'لا توجد سيارات متاحة' : 'No vehicles available'}</option>
                    ) : (
                      availableVehicles.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.make} {v.model} - {v.plateNumber} ({v.mileage} km)
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'المستلم / السائق *' : 'Driver / Recipient *'}
                  </label>
                  <select
                    required
                    value={formDriverId}
                    onChange={e => setFormDriverId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  >
                    <option value="">-- {isAr ? 'اختر المستلم' : 'Select Driver'} --</option>
                    {drivers.length === 0 ? (
                      <option value="" disabled>{isAr ? 'لا توجد سائقين' : 'No drivers'}</option>
                    ) : (
                      drivers.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.department})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* باقي حقول النموذج كما هي */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'حالة / نوع الاستخدام *' : 'Purpose *'}
                  </label>
                  <select
                    value={formPurpose}
                    onChange={e => setFormPurpose(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  >
                    <option value="official">{isAr ? 'مهمة عمل رسمية' : 'Official Business'}</option>
                    <option value="quick_task">⚡ {isAr ? 'استخدام سريع (ساعة أو أقل)' : 'Quick Task (1 hour or less)'}</option>
                    <option value="client_delivery">{isAr ? 'توصيل عملاء / بضائع' : 'Client / Goods Delivery'}</option>
                    <option value="maintenance">{isAr ? 'إيصال لورشة الصيانة' : 'To Garage / Maintenance'}</option>
                    <option value="personal_temporary">{isAr ? 'استخدام شخصي مؤقت' : 'Temporary Personal Use'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'تفاصيل المهمة / الوجهة' : 'Details / Destination'}
                  </label>
                  <input
                    type="text"
                    value={formPurposeCustom}
                    onChange={e => setFormPurposeCustom(e.target.value)}
                    placeholder={isAr ? 'مثال: توصيل مستندات للمطار / زيارة فرع...' : 'e.g. Airport drop-off / Branch visit...'}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'تاريخ ووقت الاستلام' : 'Checkout Time'}
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
                    {isAr ? 'عداد الكيلومترات عند الخروج' : 'Checkout Odometer (km)'}
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
                    {isAr ? 'مستوى الوقود الحالي' : 'Fuel Level'}
                  </label>
                  <select
                    value={formFuelLevel}
                    onChange={e => setFormFuelLevel(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  >
                    <option value="100%">100% - Full Tank</option>
                    <option value="75%">75% - Three Quarters</option>
                    <option value="50%">50% - Half Tank</option>
                    <option value="25%">25% - Quarter Tank</option>
                    <option value="10%">10% - Very Low</option>
                  </select>
                </div>
              </div>

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
                        {isAr ? 'قائمة فحص السلامة والمعدات قبل الاستلام (اختياري)' : 'Safety & Equipment Checklist (Optional)'}
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                          {Object.values(formChecklist).filter(Boolean).length} / 6 {isAr ? 'بنود مؤكدة' : 'confirmed'}
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isAr ? 'تأكيد خلو المركبة من الخدوش وتوفر معدات الطوارئ' : 'Confirm vehicle condition and presence of emergency equipment.'}
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
                      {isAr ? 'تحديد الكل كسليم ✓' : 'Check All ✓'}
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
                      <span className="text-slate-800 dark:text-slate-200">{isAr ? 'خلو الهيكل الخارجي من الخدوش والصدمات' : 'No external scratches or dents'}</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-emerald-500 transition text-xs font-semibold">
                      <input
                        type="checkbox"
                        checked={!!formChecklist.spareTire}
                        onChange={(e) => setFormChecklist(prev => ({ ...prev, spareTire: e.target.checked }))}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <span className="text-slate-800 dark:text-slate-200">{isAr ? 'وجود الإطار الاحتياطي ورافعة العجلات' : 'Spare tire and jack present'}</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-emerald-500 transition text-xs font-semibold">
                      <input
                        type="checkbox"
                        checked={!!formChecklist.fireExtinguisher}
                        onChange={(e) => setFormChecklist(prev => ({ ...prev, fireExtinguisher: e.target.checked }))}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <span className="text-slate-800 dark:text-slate-200">{isAr ? 'طفاية الحريق وجاهزيتها' : 'Fire extinguisher present'}</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-emerald-500 transition text-xs font-semibold">
                      <input
                        type="checkbox"
                        checked={!!formChecklist.warningTriangle}
                        onChange={(e) => setFormChecklist(prev => ({ ...prev, warningTriangle: e.target.checked }))}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <span className="text-slate-800 dark:text-slate-200">{isAr ? 'مثلث السلامة وحقيبة الإسعافات الأوّلية' : 'Warning triangle and first aid kit'}</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-emerald-500 transition text-xs font-semibold">
                      <input
                        type="checkbox"
                        checked={!!formChecklist.registrationDoc}
                        onChange={(e) => setFormChecklist(prev => ({ ...prev, registrationDoc: e.target.checked }))}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <span className="text-slate-800 dark:text-slate-200">{isAr ? 'وجود رخصة سير المركبة (الاستمارة)' : 'Registration card present'}</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-emerald-500 transition text-xs font-semibold">
                      <input
                        type="checkbox"
                        checked={!!formChecklist.cleanliness}
                        onChange={(e) => setFormChecklist(prev => ({ ...prev, cleanliness: e.target.checked }))}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <span className="text-slate-800 dark:text-slate-200">{isAr ? 'نظافة هيكل السيارة والمقصورة الداخلية' : 'Clean interior and exterior'}</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 border-slate-100 dark:border-slate-700">
                <SignatureCanvas
                  label={isAr ? 'توقيع الموظف المستلم (وقع الإصبع أو الماوس في الصندوق)' : 'Driver Signature (Sign with mouse or finger)'}
                  onSave={dataUrl => setFormSignature(dataUrl)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'ملاحظات أو خدوش مسبقة بالسيارة' : 'Notes / Pre-existing damage'}
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder={isAr ? 'ملاحظات حول النظافة أو حالة المركبة عند الاستلام' : 'Notes about vehicle condition...'}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-bold text-slate-600"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm shadow transition ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'اعتماد استلام السيارة والتوقيع' : 'Confirm Checkout & Signature')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RETURN MODAL */}
      {selectedReturnSession && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-emerald-600" />
                {isAr ? 'إعادة واستلام السيارة من الموظف' : 'Return Vehicle'}
              </h3>
              <button onClick={() => setSelectedReturnSession(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleSubmitReturn} className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-xs space-y-1">
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {isAr ? 'سيارة:' : 'Vehicle:'} {vehicles.find(v => v.id === selectedReturnSession.vehicleId)?.make}{' '}
                  ({vehicles.find(v => v.id === selectedReturnSession.vehicleId)?.plateNumber})
                </p>
                <p className="text-slate-500">
                  {isAr ? 'عداد الاستلام عند الخروج:' : 'Checkout Odometer:'} {(selectedReturnSession.checkoutOdometer ?? 0).toLocaleString()} km
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'وقت الإعادة والتسليم' : 'Return Time'}
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
                    {isAr ? 'عداد الكيلومترات الحالي' : 'Return Odometer (km)'}
                  </label>
                  <input
                    type="number"
                    required
                    min={selectedReturnSession.checkoutOdometer || 0}
                    value={returnOdometer}
                    onChange={e => setReturnOdometer(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'مستوى البنزين عند العودة' : 'Fuel Level at Return'}
                </label>
                <select
                  value={returnFuelLevel}
                  onChange={e => setReturnFuelLevel(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                >
                  <option value="100%">100% - Full Tank</option>
                  <option value="75%">75% - Three Quarters</option>
                  <option value="50%">50% - Half Tank</option>
                  <option value="25%">25% - Quarter Tank</option>
                  <option value="10%">10% - Very Low</option>
                </select>
              </div>

              <div className="border-t pt-3 border-slate-100 dark:border-slate-700">
                <SignatureCanvas
                  label={isAr ? 'توقيع مسلّم السيارة عند العودة والعودة للعهدة' : 'Return Signature'}
                  onSave={dataUrl => setReturnSignature(dataUrl)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'ملاحظات الإعادة وحالة السيارة' : 'Return Notes'}
                </label>
                <input
                  type="text"
                  value={returnNotes}
                  onChange={e => setReturnNotes(e.target.value)}
                  placeholder={isAr ? 'تم فحص النظافة والسلامة وسليمة...' : 'Vehicle condition notes...'}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReturnSession(null)}
                  className="px-4 py-2 border rounded-lg text-xs font-bold text-slate-600"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm shadow transition"
                >
                  {isAr ? 'إكمال العودة وتحديث حالة المركبة' : 'Confirm Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};