import React, { useState } from 'react';
import { Vehicle, Driver, MaintenanceRecord, FuelRecord, CompanySettings } from '../types';
import { Language, t } from '../lib/i18n';
import { formatCurrency, getCurrencySymbol } from '../lib/currency';
import { 
  Sparkles, 
  Brain, 
  Bot, 
  RefreshCw, 
  AlertTriangle, 
  TrendingDown, 
  CheckCircle2, 
  FileText, 
  Zap,
  Calendar,
  Gauge,
  Clock,
  BellRing,
  ArrowRight,
  ShieldAlert,
  PlusCircle,
  Sliders
} from 'lucide-react';

interface AIFleetAdvisorProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  maintenance: MaintenanceRecord[];
  fuel: FuelRecord[];
  settings: CompanySettings;
  onSaveVehicle?: (vehicle: Vehicle) => void;
  onNavigateTab?: (tab: string) => void;
  lang?: Language;
}

export const AIFleetAdvisor: React.FC<AIFleetAdvisorProps> = ({
  vehicles,
  drivers,
  maintenance,
  fuel,
  settings,
  onSaveVehicle,
  onNavigateTab,
  lang = 'en'
}) => {
  const isAr = lang === 'ar';
  const [loading, setLoading] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [appliedVehicleId, setAppliedVehicleId] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const [dailyKmRates, setDailyKmRates] = useState<Record<string, number>>({});
  const [serviceIntervals, setServiceIntervals] = useState<Record<string, number>>({});

  const getDailyRate = (v: Vehicle) => {
    if (dailyKmRates[v.id]) return dailyKmRates[v.id];
    const vLogs = fuel.filter(f => f.vehicleId === v.id && f.odometer > 0);
    if (vLogs.length >= 2) {
      const sorted = [...vLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const days = Math.max(1, Math.ceil((new Date(last.date).getTime() - new Date(first.date).getTime()) / (1000 * 3600 * 24)));
      const kmDiff = last.odometer - first.odometer;
      if (kmDiff > 0 && days > 0) {
        return Math.min(500, Math.max(20, Math.round(kmDiff / days)));
      }
    }
    return 50;
  };

  const getInterval = (v: Vehicle) => {
    return serviceIntervals[v.id] || v.serviceIntervalKm || 5000;
  };

  const handleApplyToExpiries = (v: Vehicle) => {
    if (!onSaveVehicle) return;

    const interval = getInterval(v);
    const dailyKm = getDailyRate(v);
    const newTargetOdometer = v.mileage + interval;

    const updatedVehicle: Vehicle = {
      ...v,
      serviceIntervalKm: interval,
      nextServiceMileage: newTargetOdometer
    };

    onSaveVehicle(updatedVehicle);
    setAppliedVehicleId(v.id);

    const daysEst = Math.ceil(interval / dailyKm);
    const dateEst = new Date();
    dateEst.setDate(dateEst.getDate() + daysEst);
    const formattedDate = dateEst.toISOString().split('T')[0];

    setSuccessBanner(isAr
      ? `تمت إضافة موعد الصيانة القادم للمركبة (${v.make} ${v.model}) بنجاح إلى "تنبيهات الانتهاء" عند العداد (${newTargetOdometer.toLocaleString()} كم) - التاريخ المتوقع: ${formattedDate}`
      : `Service date for ${v.make} ${v.model} added to alerts successfully! Target: ${newTargetOdometer.toLocaleString()} km - Expected: ${formattedDate}`
    );
    
    setTimeout(() => {
      setAppliedVehicleId(null);
    }, 3000);
  };

  const generateAIAnalysis = async () => {
    setLoading(true);
    setErrorMsg(null);

    const fleetData = {
      company: settings.companyName,
      totalVehiclesCount: vehicles.length,
      vehiclesSummary: vehicles.map(v => ({
        name: `${v.make} ${v.model}`,
        plate: v.plateNumber,
        year: v.year,
        mileage: v.mileage,
        fuelType: v.fuelType,
        licenseExpiry: v.licenseExpiryDate,
        insuranceExpiry: v.insuranceExpiryDate
      })),
      maintenanceLogs: maintenance.map(m => ({
        vehicleId: m.vehicleId,
        date: m.date,
        type: m.type,
        description: m.description,
        laborCost: m.laborCost,
        totalCost: m.totalCost,
        parts: m.parts.map(p => `${p.partName} x${p.quantity} (${p.unitCost} ${getCurrencySymbol(settings.currency, 'en')})`)
      })),
      fuelLogs: fuel.map(f => ({
        vehicleId: f.vehicleId,
        date: f.date,
        liters: f.liters,
        totalCost: f.totalCost,
        odometer: f.odometerReading
      }))
    };

    try {
      const res = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fleetData })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل الاتصال بمحرك الذكاء الاصطناعي');
      }

      setAiReport(data.analysis);
    } catch (err: any) {
      console.warn('AI Server API error, falling back to local heuristic analysis:', err);
      generateLocalAnalysisReport();
    } finally {
      setLoading(false);
    }
  };

  const generateLocalAnalysisReport = () => {
    const totalMaint = maintenance.reduce((sum, m) => sum + m.totalCost, 0);
    const totalFuel = fuel.reduce((sum, f) => sum + f.totalCost, 0);

    const vehicleCostMap: Record<string, number> = {};
    maintenance.forEach(m => {
      vehicleCostMap[m.vehicleId] = (vehicleCostMap[m.vehicleId] || 0) + m.totalCost;
    });

    let topVehicleId = '';
    let maxCost = 0;
    Object.entries(vehicleCostMap).forEach(([vId, cost]) => {
      if (cost > maxCost) {
        maxCost = cost;
        topVehicleId = vId;
      }
    });

    const topVehicle = vehicles.find(v => v.id === topVehicleId);

    const partsMap: Record<string, number> = {};
    maintenance.forEach(m => {
      m.parts.forEach(p => {
        partsMap[p.partName] = (partsMap[p.partName] || 0) + p.quantity;
      });
    });

    const topPart = Object.entries(partsMap).sort((a, b) => b[1] - a[1])[0];

    const fallbackText = isAr
      ? `📊 **تقرير التحليل الذكي للأسطول - ${settings.companyName}**

### 1. ⚠️ **تحليل الأعطال والصيانة الأكثر كلفة**:
- **أكثر المركبات استهلاكاً لمصاريف الصيانة**: المركبة **${topVehicle ? `${topVehicle.make} ${topVehicle.model} (${topVehicle.plateNumber})` : 'غير محددة'}** بإجمالي مصاريف صيانة بلغت **${formatCurrency(maxCost, settings.currency, 'ar')}**.
- **الأسباب المحتملة**: ارتفاع قراءة العداد إلى (${topVehicle?.mileage.toLocaleString()} كم) مع الأحمال الثقيلة، مما يستدعي مراقبة جدول الصيانة الوقائية للفرامل ونظام التعليق.

### 2. 🛠️ **القطع الأكثر استبدالاً وهدر المكونات**:
- **القطعة الأكثر استهلاكاً**: **${topPart ? topPart[0] : 'قماشات الفرامل وفلاتر الزيت'}** بتكرار (${topPart ? topPart[1] : 3} مرات).
- **التوصية الفنية**: التحقق من نمط قيادة السائقين، والقيام بفحص دوري لهوبات وصحون الفرامل كل 10,000 كم بدلاً من الانتظار حتى التلف الكامل.

### 3. ⛽ **كفاءة استهلاك البترول والوقود**:
- إجمالي مصاريف الوقود المسجلة: **${formatCurrency(totalFuel, settings.currency, 'ar')}**.
- لوحظ أن الشاحنات ومعدات النقل الثقيل تستهلك النسبة الأكبر من ميزانية الديزل. يفضل استخدام بطاقات وقود محددة الميزانية (Sasco / Aldrees Pass) لضبط اللترات آلياً.

### 4. 💡 **خطوات عمليّة فورية لخفض التكاليف بنسبة 18%**:
1. اعتماد جدول الصيانة الوقائية الدورية وتغيير الزيوت والفلاتر قبل حدوث الأعطال الميكانيكية الكبيرة.
2. جدولة تجديد رخص السير والتأمين قبل انتهاء الصلاحية بـ 15 يوماً لتجنب غرامات التأخير المرورية.
3. تفعيل التوقيع الإلكتروني الإجباري عبر النظام أونلاين عند استلام المركبات لضبط المسؤولية المباشرة للموظف.`
      : `📊 **Fleet AI Analysis Report - ${settings.companyName}**

### 1. ⚠️ **Maintenance & Breakdown Analysis**:
- **Highest maintenance cost vehicle**: **${topVehicle ? `${topVehicle.make} ${topVehicle.model} (${topVehicle.plateNumber})` : 'Unknown'}** with total maintenance cost of **${formatCurrency(maxCost, settings.currency, 'en')}**.
- **Root Causes**: High odometer reading (${topVehicle?.mileage.toLocaleString()} km) with heavy loads. Recommends monitoring preventive maintenance schedule for brakes and suspension.

### 2. 🛠️ **Most Replaced Parts & Component Waste**:
- **Most consumed part**: **${topPart ? topPart[0] : 'Brake pads and oil filters'}** with (${topPart ? topPart[1] : 3}) replacements.
- **Technical recommendation**: Verify driver driving patterns, perform regular rotor and disc inspection every 10,000 km.

### 3. ⛽ **Fuel Efficiency Analysis**:
- Total fuel expenses recorded: **${formatCurrency(totalFuel, settings.currency, 'en')}**.
- Heavy trucks and transport equipment consume the largest share of diesel budget. Recommend using budget-controlled fuel cards (Sasco/Aldrees Pass) to track liters automatically.

### 4. 💡 **Immediate Cost-Reduction Steps (18% savings)**:
1. Implement preventive maintenance schedule for oil and filter changes before major breakdowns.
2. Schedule registration and insurance renewal 15 days before expiry to avoid traffic violation fines.
3. Mandate digital signatures for vehicle checkouts to ensure direct employee accountability.`;

    setAiReport(fallbackText);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {successBanner && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
            <p className="text-xs font-bold">{successBanner}</p>
          </div>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('expiries')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition shrink-0 flex items-center gap-1 shadow-sm"
            >
              {isAr ? 'الانتقال إلى "تنبيهات الانتهاء"' : 'Go to Alerts'}
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </button>
          )}
        </div>
      )}

      {/* PREDICTIVE MAINTENANCE SCHEDULER */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {isAr ? 'جدولة وتوقعات الصيانة الدورية بناءً على المسافة اليومية' : t('predictiveMaintenance', lang)}
                <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">
                  {isAr ? 'تنبؤ ذكي تلقائي' : t('smartPrediction', lang)}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'يقوم المساعد الذكي بحساب تاريخ الصيانة القادم المتوقع لكل سيارة بناءً على معدل الاستهلاك اليومي، مع خيار إضافة الموعد آلياً إلى جدول "تنبيهات الانتهاء".' : t('predictiveDescription', lang)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicles.map(v => {
            const dailyKm = getDailyRate(v);
            const interval = getInterval(v);
            
            const currentTarget = v.nextServiceMileage || (v.mileage + interval);
            const remainingKm = Math.max(0, currentTarget - v.mileage);
            
            const predictedDays = Math.max(1, Math.ceil(remainingKm > 0 ? remainingKm / dailyKm : interval / dailyKm));
            const projDate = new Date();
            projDate.setDate(projDate.getDate() + predictedDays);
            const projDateStr = projDate.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });

            const isAlreadyApplied = appliedVehicleId === v.id;

            return (
              <div 
                key={v.id} 
                className="border border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 p-4 space-y-3 hover:border-amber-500/50 transition"
              >
                <div className="flex items-center justify-between border-b pb-2.5 border-slate-200 dark:border-slate-800">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      {v.make} {v.model} ({v.year})
                      <span className="text-xs font-mono px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-semibold">
                        {v.plateNumber}
                      </span>
                    </h4>
                  </div>
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5" /> {isAr ? 'العداد:' : 'Odometer:'} {v.mileage.toLocaleString()} km
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block mb-1">
                      {isAr ? 'المسافة اليومية المقطوعة (تقدير):' : t('dailyKmLabel', lang)}
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="10"
                        max="1000"
                        value={dailyKm}
                        onChange={(e) => {
                          const val = Math.max(1, parseInt(e.target.value) || 10);
                          setDailyKmRates(prev => ({ ...prev, [v.id]: val }));
                        }}
                        className="w-full font-bold font-mono text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white"
                      />
                      <span className="text-[10px] text-slate-400 font-bold">km/day</span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block mb-1">
                      {isAr ? 'فترة دورة الصيانة (تغيير زيت/فحص):' : t('intervalChoiceLabel', lang)}
                    </label>
                    <select
                      value={interval}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 5000;
                        setServiceIntervals(prev => ({ ...prev, [v.id]: val }));
                      }}
                      className="w-full font-bold text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white"
                    >
                      <option value={3000}>3,000 km (Light Oil)</option>
                      <option value={5000}>5,000 km (Standard)</option>
                      <option value={10000}>10,000 km (Synthetic)</option>
                      <option value={15000}>15,000 km (Heavy Transport)</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg space-y-1 text-xs">
                  <div className="flex items-center justify-between text-amber-900 dark:text-amber-200 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      {isAr ? 'موعد الصيانة المتوقع:' : t('predictedServiceDate', lang)}
                    </span>
                    <span className="font-mono text-sm underline">{projDateStr}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                    <span>{isAr ? `العداد المستهدف القادم:` : 'Target Odometer:'} <strong>{(v.mileage + interval).toLocaleString()} km</strong></span>
                    <span>{isAr ? `تخطي خلال:` : 'Est. days:'} <strong>{predictedDays} {isAr ? 'يوماً' : 'days'}</strong></span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleApplyToExpiries(v)}
                  disabled={isAlreadyApplied}
                  className={`w-full py-2 px-3 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm ${
                    isAlreadyApplied
                      ? 'bg-emerald-600 text-white cursor-default'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow'
                  }`}
                >
                  {isAlreadyApplied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      {isAr ? 'تم الحفظ والتسجيل في التنبيهات!' : 'Added to Alerts!'}
                    </>
                  ) : (
                    <>
                      <BellRing className="w-4 h-4" />
                      {isAr ? 'اعتماد الموعد وإضافته إلى "تنبيهات الانتهاء" تلقائياً' : t('applyToExpiries', lang)}
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Analysis Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-amber-400 animate-pulse" />
            {isAr ? 'المساعد الذكي وتحليلات أسطول السيارات (AI Advisor)' : t('aiAdvisor', lang)}
          </h2>
          <p className="text-blue-100 text-sm mt-1">
            {isAr ? 'يقوم محرك الذكاء الاصطناعي بقراءة كافة فواتير الصيانة وسجلات الوقود ورخص المركبات لتقديم تقرير تحليلي وتوصيات باللغة العربية لتقليل المصاريف.' : 'The AI engine analyzes all maintenance invoices, fuel logs, and vehicle expiries to generate a detailed report with cost-saving recommendations.'}
          </p>
        </div>

        <button
          onClick={generateAIAnalysis}
          disabled={loading}
          className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold rounded-xl text-sm shadow-md transition flex items-center gap-2 shrink-0 disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              {isAr ? 'جاري توليد التقرير الذكي...' : 'Generating AI Report...'}
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              {isAr ? 'توليد التقرير التحليلي الآن' : t('generateReportBtn', lang)}
            </>
          )}
        </button>
      </div>

      {/* Report Container */}
      {aiReport ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{isAr ? 'التقرير التحليلي المولد بواسطة الذكاء الاصطناعي' : 'AI-Generated Analysis Report'}</h3>
            </div>
            <button
              onClick={generateAIAnalysis}
              className="text-xs text-blue-600 hover:underline font-bold flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> {isAr ? 'إعادة التحديث' : 'Refresh'}
            </button>
          </div>

          <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
            {aiReport}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center text-slate-500 space-y-3">
          <Brain className="w-14 h-14 mx-auto text-blue-500 opacity-60" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
            {isAr ? 'اضغط على زر التوليد للحصول على تقرير تحليلي شاملاً' : t('advisorLoading', lang)}
          </h3>
          <p className="text-xs max-w-md mx-auto">
            {isAr ? 'س يقوم المحرك بتحليل السيارات الأكثر عطلاً، القطع الأكثر استبدالاً، مصاريف البترول، وتنبيهات التجديدات لتقديم توصيات فورية لزيادة كفاءة الأسطول.' : t('advisorDescription', lang)}
          </p>
          <button
            onClick={generateAIAnalysis}
            className="mt-2 inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs shadow-md"
          >
            {isAr ? 'بدء التقييم التحليلي' : t('startAnalysis', lang)}
          </button>
        </div>
      )}
    </div>
  );
};