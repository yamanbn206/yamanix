import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { 
  Vehicle, 
  Driver, 
  MaintenanceRecord 
} from '../types';
import { Language } from '../lib/i18n';
import { 
  Bell, 
  ShieldAlert, 
  Wrench, 
  FileText, 
  UserCheck, 
  X, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  Clock,
  Sparkles,
  ChevronLeft
} from 'lucide-react';

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: 'urgent' | 'warning' | 'info' | 'success';
  category: 'license' | 'insurance' | 'driver_license' | 'maintenance' | 'general';
  targetTab?: string;
  timestamp: string;
  daysRemaining?: number;
  autoClose?: boolean;
}

interface ToastNotificationsProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  maintenance: MaintenanceRecord[];
  onNavigateTab: (tab: string) => void;
  isOpenDrawer?: boolean;
  onCloseDrawer?: () => void;
  lang?: Language;
}

export interface ToastRefHandler {
  triggerCheckOnLogin: () => void;
  addToast: (toast: Omit<ToastItem, 'id' | 'timestamp'>) => void;
}

export const ToastNotifications = forwardRef<ToastRefHandler, ToastNotificationsProps>(({
  vehicles,
  drivers,
  maintenance,
  onNavigateTab,
  isOpenDrawer,
  onCloseDrawer,
  lang = 'en'
}, ref) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [hasLoggedInChecked, setHasLoggedInChecked] = useState<boolean>(false);
  const [lastCheckDate, setLastCheckDate] = useState<string>('');

  const isAr = lang === 'ar';

  // Helper function to check days difference
  const getDaysDiff = (targetDateStr: string) => {
    if (!targetDateStr) return 999;
    const target = new Date(targetDateStr);
    const today = new Date();
    // Reset hours
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Scheduled Task Runner for Daily Expiry and Maintenance Scanning
  const runScheduledDailyCheck = (isManualTrigger = false) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const nowStr = new Date().toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' });

    const generatedToasts: ToastItem[] = [];

    // 1. Check Vehicle Registration (الاستمارة) & Insurance (التأمين) & Next Service Mileage (الصيانة)
    vehicles.forEach(v => {
      // License Expiry
      if (v.licenseExpiryDate) {
        const days = getDaysDiff(v.licenseExpiryDate);
        if (days <= 0) {
          generatedToasts.push({
            id: `v-lic-exp-${v.id}-${Date.now()}`,
            title: isAr ? `منتهية: استمارة ${v.make} ${v.model}` : `Expired: Registration ${v.make} ${v.model}`,
            message: isAr 
              ? `استمارة السيارة (اللوحة: ${v.plateNumber}) منتهية الصلاحية منذ ${Math.abs(days)} يوم!`
              : `Vehicle registration (Plate: ${v.plateNumber}) expired ${Math.abs(days)} days ago!`,
            type: 'urgent',
            category: 'license',
            targetTab: 'expiries',
            timestamp: nowStr,
            daysRemaining: days
          });
        } else if (days <= 30) {
          generatedToasts.push({
            id: `v-lic-warn-${v.id}-${Date.now()}`,
            title: isAr ? `تنبيه: اقتراب انتهاء استمارة ${v.make} ${v.model}` : `Alert: Registration Expiring Soon ${v.make} ${v.model}`,
            message: isAr
              ? `استمارة السيارة (اللوحة: ${v.plateNumber}) تنتهي خلال ${days} يوم (${v.licenseExpiryDate}).`
              : `Vehicle registration (Plate: ${v.plateNumber}) expires in ${days} days (${v.licenseExpiryDate}).`,
            type: days <= 10 ? 'urgent' : 'warning',
            category: 'license',
            targetTab: 'expiries',
            timestamp: nowStr,
            daysRemaining: days
          });
        }
      }

      // Insurance Expiry
      if (v.insuranceExpiryDate) {
        const days = getDaysDiff(v.insuranceExpiryDate);
        if (days <= 0) {
          generatedToasts.push({
            id: `v-ins-exp-${v.id}-${Date.now()}`,
            title: isAr ? `منتهية: وثيقة تأمين ${v.make} ${v.model}` : `Expired: Insurance Policy ${v.make} ${v.model}`,
            message: isAr
              ? `تأمين السيارة (${v.insuranceCompany || 'الشركة'}) منتهي الصلاحية للوحة ${v.plateNumber}!`
              : `Insurance policy (${v.insuranceCompany || 'Provider'}) expired for plate ${v.plateNumber}!`,
            type: 'urgent',
            category: 'insurance',
            targetTab: 'expiries',
            timestamp: nowStr,
            daysRemaining: days
          });
        } else if (days <= 30) {
          generatedToasts.push({
            id: `v-ins-warn-${v.id}-${Date.now()}`,
            title: isAr ? `تنبيه: اقتراب انتهاء تأمين ${v.make} ${v.model}` : `Alert: Insurance Expiring Soon ${v.make} ${v.model}`,
            message: isAr
              ? `وثيقة التأمين ينتهي سريانها خلال ${days} يوم للسيارة (${v.plateNumber}).`
              : `Insurance policy expires in ${days} days for vehicle (${v.plateNumber}).`,
            type: days <= 10 ? 'urgent' : 'warning',
            category: 'insurance',
            targetTab: 'expiries',
            timestamp: nowStr,
            daysRemaining: days
          });
        }
      }

      // Next Service Mileage Check
      if (v.nextServiceMileage && v.nextServiceMileage > 0) {
        const remainingKm = v.nextServiceMileage - v.mileage;
        if (remainingKm <= 0) {
          generatedToasts.push({
            id: `v-srv-over-${v.id}-${Date.now()}`,
            title: isAr ? `صيانة متأخرة: ${v.make} ${v.model}` : `Overdue Maintenance: ${v.make} ${v.model}`,
            message: isAr
              ? `تجاوزت السيارة عداد الصيانة القادمة المستهدفة بـ ${Math.abs(remainingKm).toLocaleString()} كم! (العداد الحالي: ${v.mileage.toLocaleString()} كم).`
              : `Vehicle is overdue for target service by ${Math.abs(remainingKm).toLocaleString()} km! (Current Odometer: ${v.mileage.toLocaleString()} km).`,
            type: 'urgent',
            category: 'maintenance',
            targetTab: 'maintenance',
            timestamp: nowStr
          });
        } else if (remainingKm <= 1000) {
          generatedToasts.push({
            id: `v-srv-warn-${v.id}-${Date.now()}`,
            title: isAr ? `موعد صيانة قريب: ${v.make} ${v.model}` : `Upcoming Service Due: ${v.make} ${v.model}`,
            message: isAr
              ? `متبقي ${remainingKm.toLocaleString()} كم فقط على موعد الصيانة الدوري للسيارة (اللوحة: ${v.plateNumber}).`
              : `Only ${remainingKm.toLocaleString()} km remaining until routine service for vehicle (Plate: ${v.plateNumber}).`,
            type: 'warning',
            category: 'maintenance',
            targetTab: 'maintenance',
            timestamp: nowStr
          });
        }
      }
    });

    // 2. Check Drivers License Expiration
    drivers.forEach(d => {
      if (d.licenseExpiryDate) {
        const days = getDaysDiff(d.licenseExpiryDate);
        if (days <= 0) {
          generatedToasts.push({
            id: `d-lic-exp-${d.id}-${Date.now()}`,
            title: isAr ? `منتهية: رخصة السائق ${d.name}` : `Expired: Driver License ${d.name}`,
            message: isAr
              ? `رخصة قيادة السائق ${d.name} (رقم الهوية: ${d.idNumber}) منتهية الصلاحية!`
              : `Driver's license for ${d.name} (ID: ${d.idNumber}) has expired!`,
            type: 'urgent',
            category: 'driver_license',
            targetTab: 'expiries',
            timestamp: nowStr,
            daysRemaining: days
          });
        } else if (days <= 30) {
          generatedToasts.push({
            id: `d-lic-warn-${d.id}-${Date.now()}`,
            title: isAr ? `تنبيه: تجديد رخصة السائق ${d.name}` : `Alert: Driver License Renewal ${d.name}`,
            message: isAr
              ? `تنتهي رخصة قيادة السائق ${d.name} خلال ${days} يوم (${d.licenseExpiryDate}).`
              : `Driver's license for ${d.name} expires in ${days} days (${d.licenseExpiryDate}).`,
            type: days <= 10 ? 'urgent' : 'warning',
            category: 'driver_license',
            targetTab: 'expiries',
            timestamp: nowStr,
            daysRemaining: days
          });
        }
      }
    });

    // Add Scheduled Task Header Banner Notification
    const alertCount = generatedToasts.length;
    generatedToasts.unshift({
      id: `scheduled-summary-${Date.now()}`,
      title: isAr ? 'جدولة الفحص اليومي التلقائي' : 'Automated Daily Audit Scheduled',
      message: isAr
        ? (alertCount > 0 
          ? `تم الفحص اليومي التلقائي بنجاح. تم رصد ${alertCount} تنبيهات تخص اقتراب انتهاء الرخص والتأمين ومواعيد الصيانة.`
          : 'تم الفحص اليومي التلقائي بنجاح. جميع الرخص والتأمينات ومواعيد الصيانة في حالة سليمة ومستقرة.')
        : (alertCount > 0
          ? `Automated daily check complete. Detected ${alertCount} alerts regarding upcoming expiries, insurance, and service dates.`
          : `Automated daily check complete. All registrations, insurance policies, and service schedules are valid and stable.`),
      type: alertCount > 0 ? 'info' : 'success',
      category: 'general',
      timestamp: nowStr
    });

    // Update LocalStorage last check date
    try {
      localStorage.setItem('fleet_last_daily_check', todayStr);
      localStorage.setItem('fleet_last_daily_check_time', nowStr);
    } catch (e) {
      console.warn("LocalStorage save error:", e);
    }

    setLastCheckDate(`${todayStr} ${nowStr}`);
    setToasts(generatedToasts);
    setUnreadCount(generatedToasts.length);
    setHasLoggedInChecked(true);
  };

  // Run scheduled check automatically when app opens
  useEffect(() => {
    if (!hasLoggedInChecked) {
      runScheduledDailyCheck(false);
    }
  }, [vehicles, drivers, maintenance]);

  useImperativeHandle(ref, () => ({
    triggerCheckOnLogin: () => runScheduledDailyCheck(true),
    addToast: (newToast) => {
      const item: ToastItem = {
        ...newToast,
        id: `custom-${Date.now()}-${Math.random()}`,
        timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
      };
      setToasts(prev => [item, ...prev]);
      setUnreadCount(prev => prev + 1);
    }
  }));

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const dismissAllToasts = () => {
    setToasts([]);
    setUnreadCount(0);
  };

  const getCategoryIcon = (category: ToastItem['category']) => {
    switch (category) {
      case 'maintenance':
        return <Wrench className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'insurance':
        return <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />;
      case 'license':
        return <FileText className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'driver_license':
        return <UserCheck className="w-5 h-5 text-amber-400 shrink-0" />;
      default:
        return <Bell className="w-5 h-5 text-emerald-400 shrink-0" />;
    }
  };

  const getTypeStyle = (type: ToastItem['type']) => {
    switch (type) {
      case 'urgent':
        return 'bg-[#180d0d] border-red-500/50 text-red-200 shadow-red-950/40';
      case 'warning':
        return 'bg-[#1a1409] border-amber-500/50 text-amber-200 shadow-amber-950/40';
      case 'success':
        return 'bg-[#0b1a14] border-emerald-500/50 text-emerald-200 shadow-emerald-950/40';
      default:
        return 'bg-[#0f1115] border-gray-700 text-gray-200 shadow-black/50';
    }
  };

  return (
    <>
      {/* FLOATING TOAST POPUPS (Bottom-Right or Top-Left Overlay) */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full px-4 pointer-events-none no-print">
        {toasts.slice(0, 4).map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto border rounded-2xl p-4 shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 flex items-start gap-3.5 relative overflow-hidden group ${getTypeStyle(
              toast.type
            )}`}
          >
            {/* Top accent glow line */}
            <div
              className={`absolute top-0 right-0 left-0 h-1 ${
                toast.type === 'urgent'
                  ? 'bg-red-500'
                  : toast.type === 'warning'
                  ? 'bg-amber-500'
                  : toast.type === 'success'
                  ? 'bg-emerald-500'
                  : 'bg-blue-500'
              }`}
            />

            <div className="mt-0.5">{getCategoryIcon(toast.category)}</div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold truncate leading-snug">{toast.title}</h4>
                <span className="text-[10px] opacity-70 flex items-center gap-1 font-mono shrink-0">
                  <Clock className="w-3 h-3" />
                  {toast.timestamp}
                </span>
              </div>

              <p className="text-xs mt-1 opacity-90 leading-relaxed font-normal">{toast.message}</p>

              {/* Action Button */}
              {toast.targetTab && (
                <button
                  onClick={() => {
                    onNavigateTab(toast.targetTab!);
                    dismissToast(toast.id);
                  }}
                  className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition border border-white/10"
                >
                  <span>{isAr ? 'عرض التفاصيل والإجراء' : 'View Details & Action'}</span>
                  <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180" />
                </button>
              )}
            </div>

            {/* Close Toast */}
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition shrink-0"
              title={isAr ? "إغلاق التنبيه" : "Dismiss alert"}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {toasts.length > 4 && (
          <div className="pointer-events-auto bg-[#0f1115]/90 border border-gray-800 rounded-xl px-4 py-2 text-center text-xs text-gray-300 shadow-lg backdrop-blur-md flex items-center justify-between">
            <span>{isAr ? <>توجد <strong>+{toasts.length - 4}</strong> تنبيهات إضافية</> : <>There are <strong>+{toasts.length - 4}</strong> additional alerts</>}</span>
            <button
              onClick={() => {
                if (isOpenDrawer !== undefined && !isOpenDrawer) {
                  // user can click bell to view drawer
                }
              }}
              className="text-[#cbb26a] font-bold hover:underline"
            >
              {isAr ? 'عرض قائمة التنبيهات' : 'View All Notifications'}
            </button>
          </div>
        )}
      </div>

      {/* NOTIFICATION DRAWER / SLIDE-OVER PANEL */}
      {isOpenDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden no-print">
          {/* Backdrop */}
          <div
            onClick={onCloseDrawer}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
          />

          <div className={`fixed inset-y-0 ${isAr ? 'right-0 pl-10 dir-rtl' : 'left-0 pr-10 dir-ltr'} max-w-full flex`}>
            <div className="w-screen max-w-md bg-[#0a0b0d] border-r border-gray-800 shadow-2xl flex flex-col">
              {/* Header */}
              <div className="p-5 border-b border-gray-800 bg-[#0f1115] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {isAr ? 'مركز إشعارات الأسطول' : 'Fleet Notification Center'}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {isAr ? 'تنبيهات تلقائية عند تسجيل الدخول للنظام' : 'Automated real-time system alerts'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onCloseDrawer}
                  className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Login Rescan Bar */}
              <div className="p-4 bg-[#12141a] border-b border-gray-800/80 flex items-center justify-between gap-2">
                <div className="text-xs text-gray-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#cbb26a]" />
                  <div>
                    <p className="font-bold">
                      {isAr ? 'خدمة الجدولة اليومية:' : 'Daily Scheduler:'} <span className="text-emerald-400">{isAr ? 'نشطة ✓' : 'Active ✓'}</span>
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {isAr ? 'آخر فحص تلقائي:' : 'Last Auto Check:'} {lastCheckDate || (isAr ? 'اليوم عند فتح التطبيق' : 'Today on startup')}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => runScheduledDailyCheck(true)}
                  className="px-3 py-1.5 bg-[#cbb26a] hover:bg-[#b89f57] text-black font-bold text-xs rounded-lg transition flex items-center gap-1.5 shadow-sm shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {isAr ? 'تشغيل الفحص الآن' : 'Run Audit Now'}
                </button>
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {toasts.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-gray-500 space-y-3">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500/50" />
                    <p className="text-sm font-bold text-gray-300">
                      {isAr ? 'لا توجد تنبيهات نشطة حالياً' : 'No Active Alerts Currently'}
                    </p>
                    <p className="text-xs text-gray-500 max-w-xs">
                      {isAr
                        ? 'جميع تراخيص المركبات والسائقين ومواعيد الصيانة الدورية في حالة سريعة وسليمة.'
                        : 'All vehicle registrations, driver licenses, and routine maintenance dates are valid and up to date.'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-xs text-gray-400 pb-1">
                      <span>{isAr ? `عدد التنبيهات التراكمية (${toasts.length})` : `Active Alerts Count (${toasts.length})`}</span>
                      <button
                        onClick={dismissAllToasts}
                        className="text-red-400 hover:underline font-semibold"
                      >
                        {isAr ? 'مسح كافة الإشعارات' : 'Clear All Notifications'}
                      </button>
                    </div>

                    {toasts.map((toast) => (
                      <div
                        key={toast.id}
                        className={`border rounded-xl p-4 space-y-2 transition relative ${getTypeStyle(
                          toast.type
                        )}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 font-bold text-sm">
                            {getCategoryIcon(toast.category)}
                            <span>{toast.title}</span>
                          </div>
                          <button
                            onClick={() => dismissToast(toast.id)}
                            className="text-gray-400 hover:text-white p-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <p className="text-xs opacity-90 leading-relaxed">{toast.message}</p>

                        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px]">
                          <span className="opacity-70 font-mono">{toast.timestamp}</span>

                          {toast.targetTab && (
                            <button
                              onClick={() => {
                                onNavigateTab(toast.targetTab!);
                                if (onCloseDrawer) onCloseDrawer();
                              }}
                              className="text-amber-300 hover:underline font-bold flex items-center gap-1"
                            >
                              {isAr ? 'الانتقال للقسم' : 'Navigate To Section'} <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-800 bg-[#0f1115] text-center text-xs text-gray-400">
                {isAr ? 'يتم تشغيل نظام التنبيهات تلقائياً فور فتح التطبيق وتسجيل الدخول' : 'Automated alert engine triggers on application startup and user login'}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});
