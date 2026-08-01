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
  ShieldAlert,
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
      
      // 🔧 تعيين companyId من settings (سيتم تمريره من App)
      const companyId = settings.companyId || null;

      const newSession: CheckoutSession = {
        id: id,
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
        companyId: companyId // 🔧 تعيين companyId
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
    if (onRefresh) {
      await onRefresh();
    } else {
      window.location.reload();
    }
    setIsRefreshing(false);
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
            title={isAr ? 'تحديث القائمة' : 'Refresh list'}
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

      {/* Tabs */}
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

      {/* ACTIVE SESSIONS LIST */}
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
                  <div 
                    key={session.id}
                    className="bg-white dark:bg-slate-800 border-2 border-amber-300 dark:border-amber-800/80 rounded-2xl p-5 shadow-sm space-y-4 relative"
                  >
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
                        title={isAr ? 'طباعة إيصال الاستلام' : 'Print Receipt'}
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

      {/* COMPLETED HISTORY LIST */}
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
                            <img src={session.checkoutSignature} alt="Out" className="h-5 border rounded" title={isAr ? 'توقيع الخروج' : 'Checkout Signature'} />
                          )}
                          {session.returnSignature && (
                            <img src={session.returnSignature} alt="In" className="h-5 border rounded border-emerald-300" title={isAr ? 'توقيع الإعادة' : 'Return Signature'} />
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => onPrintReceipt(session)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title={isAr ? 'طباعة إيصال الحركة' : 'Print Receipt'}
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                      {profile?.role === 'admin' && (
                        <td className="p-3">
                          {onDeleteCheckout && (
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
                          )}
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

      {/* باقي الكود (CHECKOUT MODAL و RETURN MODAL) كما هو، مع إضافة companyId في newSession */}
      {/* ... */}
      
      {/* CHECKOUT MODAL (مختصر) */}
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
              {/* ... نموذج الإدخال كما هو ... */}
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

      {/* RETURN MODAL (مختصر) */}
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
              {/* ... نموذج الإعادة كما هو ... */}
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