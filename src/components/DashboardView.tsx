import React, { useState, useEffect } from 'react';
import { Vehicle, Driver, MaintenanceRecord, FuelRecord, CheckoutSession, CompanySettings } from '../types';
import { Language, t } from '../lib/i18n';
import { formatCurrency, getCurrencySymbol } from '../lib/currency';
import { 
  Car, 
  Users, 
  Wrench, 
  Fuel, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  ArrowUpRight,
  ShieldAlert,
  FileCheck2,
  KeyRound,
  BarChart3,
  Flame,
  Sparkles,
  Activity,
  Gauge,
  GripVertical,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  SlidersHorizontal,
  Move,
  Check
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  CartesianGrid,
  AreaChart,
  Area,
  Legend
} from 'recharts';

interface DashboardViewProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  maintenance: MaintenanceRecord[];
  fuel: FuelRecord[];
  checkouts: CheckoutSession[];
  settings: CompanySettings;
  onNavigateTab: (tab: string) => void;
  lang?: Language;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  vehicles,
  drivers,
  maintenance,
  fuel,
  checkouts,
  settings,
  onNavigateTab,
  lang = 'en'
}) => {
  const isAr = lang === 'ar';
  const activeCheckouts = checkouts.filter(c => c.status === 'active');
  const inMaintenanceVehicles = vehicles.filter(v => v.status === 'maintenance');
  const availableVehicles = vehicles.filter(v => v.status === 'available');
  const activeVehicles = vehicles.filter(v => v.status === 'available' || v.status === 'checked_out');

  // Current month fuel expenditure stats
  const currentYearMonth = new Date().toISOString().slice(0, 7);
  const currentMonthFuelRecords = fuel.filter(f => f.date && f.date.startsWith(currentYearMonth));
  const currentMonthFuelTotal = currentMonthFuelRecords.reduce((sum, f) => sum + (f.totalCost || 0), 0);
  const currentMonthFuelLiters = currentMonthFuelRecords.reduce((sum, f) => sum + (f.liters || 0), 0);

  // License & Insurance Expiries check (next 30 days)
  const today = new Date();
  const next30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const expiringLicenses = vehicles.filter(v => {
    const d = new Date(v.licenseExpiryDate);
    return d <= next30Days;
  });

  const expiringInsurances = vehicles.filter(v => {
    const d = new Date(v.insuranceExpiryDate);
    return d <= next30Days;
  });

  const expiringDriverLicenses = drivers.filter(d => {
    const exp = new Date(d.licenseExpiryDate);
    return exp <= next30Days;
  });

  const totalExpiries = expiringLicenses.length + expiringInsurances.length + expiringDriverLicenses.length;

  // Monthly Fuel Data
  const monthNames: Record<string, string> = {
    '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
    '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
    '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
  };

  const monthlyFuelMap: Record<string, { monthKey: string; monthLabel: string; totalCost: number; totalLiters: number }> = {};
  
  fuel.forEach(f => {
    if (!f.date) return;
    const yearMonth = f.date.slice(0, 7);
    const [year, month] = yearMonth.split('-');
    const monthLabel = `${monthNames[month] || month} ${year}`;

    if (!monthlyFuelMap[yearMonth]) {
      monthlyFuelMap[yearMonth] = {
        monthKey: yearMonth,
        monthLabel,
        totalCost: 0,
        totalLiters: 0
      };
    }
    monthlyFuelMap[yearMonth].totalCost += f.totalCost;
    monthlyFuelMap[yearMonth].totalLiters += f.liters;
  });

  const monthlyFuelData = Object.values(monthlyFuelMap)
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    .map(item => ({
      ...item,
      totalCost: Math.round(item.totalCost),
      totalLiters: Math.round(item.totalLiters)
    }));

  // Vehicle Fuel Data
  const vehicleFuelMap: Record<string, { vehicleName: string; plateNumber: string; totalCost: number; totalLiters: number; count: number; fuelType: string }> = {};
  
  fuel.forEach(f => {
    const v = vehicles.find(veh => veh.id === f.vehicleId);
    const key = f.vehicleId;
    const typeLabel = v?.fuelType === 'diesel' ? 'Diesel' : v?.fuelType === '95' ? 'Petrol 95' : 'Petrol 91';
    if (!vehicleFuelMap[key]) {
      vehicleFuelMap[key] = {
        vehicleName: v ? `${v.make} ${v.model}` : 'Vehicle',
        plateNumber: v ? v.plateNumber : '',
        totalCost: 0,
        totalLiters: 0,
        count: 0,
        fuelType: typeLabel
      };
    }
    vehicleFuelMap[key].totalCost += f.totalCost;
    vehicleFuelMap[key].totalLiters += f.liters;
    vehicleFuelMap[key].count += 1;
  });

  const vehicleFuelData = Object.values(vehicleFuelMap)
    .sort((a, b) => b.totalCost - a.totalCost)
    .map(item => ({
      ...item,
      totalCost: Math.round(item.totalCost),
      totalLiters: Math.round(item.totalLiters),
      avgLitersPerFill: Math.round(item.totalLiters / (item.count || 1))
    }));

  // Fuel Type Distribution
  const fuelTypeMap: Record<string, number> = {};
  fuel.forEach(f => {
    const v = vehicles.find(veh => veh.id === f.vehicleId);
    const typeLabel = v?.fuelType === 'diesel' ? 'Diesel' : v?.fuelType === '95' ? 'Petrol 95' : 'Petrol 91';
    fuelTypeMap[typeLabel] = (fuelTypeMap[typeLabel] || 0) + f.totalCost;
  });

  const fuelTypeColors: Record<string, string> = {
    'Diesel': '#f59e0b',
    'Petrol 91': '#10b981',
    'Petrol 95': '#3b82f6'
  };

  const fuelTypeData = Object.entries(fuelTypeMap).map(([name, value]) => ({
    name,
    value: Math.round(value),
    color: fuelTypeColors[name] || '#cbb26a'
  }));

  // Top faulty vehicles
  const vehicleCostsMap: Record<string, { name: string; plate: string; count: number; cost: number }> = {};
  maintenance.forEach(m => {
    const v = vehicles.find(veh => veh.id === m.vehicleId);
    const key = m.vehicleId;
    if (!vehicleCostsMap[key]) {
      vehicleCostsMap[key] = {
        name: v ? `${v.make} ${v.model}` : 'Unknown Vehicle',
        plate: v ? v.plateNumber : '',
        count: 0,
        cost: 0
      };
    }
    vehicleCostsMap[key].count += 1;
    vehicleCostsMap[key].cost += m.totalCost;
  });

  const topFaultyVehicles = Object.values(vehicleCostsMap)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5);

  // Top replaced parts
  const partsMap: Record<string, { partName: string; totalQty: number; totalSpend: number }> = {};
  maintenance.forEach(m => {
    m.parts.forEach(p => {
      const key = p.partName.trim();
      if (!partsMap[key]) {
        partsMap[key] = { partName: key, totalQty: 0, totalSpend: 0 };
      }
      partsMap[key].totalQty += p.quantity;
      partsMap[key].totalSpend += p.quantity * p.unitCost;
    });
  });

  const topReplacedParts = Object.values(partsMap)
    .sort((a, b) => b.totalSpend - a.totalSpend)
    .slice(0, 5);

  // Total expenses
  const totalMaintenanceCost = maintenance.reduce((sum, m) => sum + m.totalCost, 0);
  const totalFuelCost = fuel.reduce((sum, f) => sum + f.totalCost, 0);
  const totalFuelLiters = fuel.reduce((sum, f) => sum + f.liters, 0);

  // Predictive Maintenance
  const predictiveMaintenanceData = vehicles.map(v => {
    const points: { xDays: number; yKm: number }[] = [];

    maintenance
      .filter(m => m.vehicleId === v.id && m.odometer > 0 && m.date)
      .forEach(m => {
        const d = new Date(m.date);
        if (!isNaN(d.getTime())) {
          points.push({ xDays: d.getTime() / (1000 * 3600 * 24), yKm: m.odometer });
        }
      });

    fuel
      .filter(f => f.vehicleId === v.id && f.odometer > 0 && f.date)
      .forEach(f => {
        const d = new Date(f.date);
        if (!isNaN(d.getTime())) {
          points.push({ xDays: d.getTime() / (1000 * 3600 * 24), yKm: f.odometer });
        }
      });

    checkouts
      .filter(c => c.vehicleId === v.id && c.checkoutOdometer > 0 && c.checkoutTime)
      .forEach(c => {
        const d = new Date(c.checkoutTime);
        if (!isNaN(d.getTime())) {
          points.push({ xDays: d.getTime() / (1000 * 3600 * 24), yKm: c.checkoutOdometer });
        }
      });

    const today = new Date();
    points.push({ xDays: today.getTime() / (1000 * 3600 * 24), yKm: v.mileage });

    points.sort((a, b) => a.xDays - b.xDays);

    let kmPerDay = 45;
    let confidence = 'Estimate';

    if (points.length >= 2) {
      const minX = points[0].xDays;
      const normPoints = points.map(p => ({ x: p.xDays - minX, y: p.yKm }));
      const n = normPoints.length;

      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      normPoints.forEach(p => {
        sumX += p.x;
        sumY += p.y;
        sumXY += p.x * p.y;
        sumXX += p.x * p.x;
      });

      const denom = (n * sumXX - sumX * sumX);
      if (denom !== 0) {
        const slope = (n * sumXY - sumX * sumY) / denom;
        if (slope > 2 && slope < 800) {
          kmPerDay = Math.round(slope * 10) / 10;
          confidence = 'Linear Regression';
        }
      }
    }

    let targetKm = v.nextServiceMileage;
    if (!targetKm || targetKm <= v.mileage) {
      targetKm = Math.ceil((v.mileage + 1) / 10000) * 10000;
    }

    const remainingKm = targetKm - v.mileage;
    const daysRemaining = Math.max(0, Math.ceil(remainingKm / (kmPerDay || 45)));

    const projectedDate = new Date();
    projectedDate.setDate(projectedDate.getDate() + daysRemaining);
    const dateFormatted = projectedDate.toISOString().split('T')[0];

    let riskLevel: 'urgent' | 'warning' | 'normal' = 'normal';
    if (remainingKm <= 0 || daysRemaining <= 7) {
      riskLevel = 'urgent';
    } else if (remainingKm <= 1500 || daysRemaining <= 30) {
      riskLevel = 'warning';
    }

    return {
      vehicle: v,
      currentMileage: v.mileage,
      targetKm,
      remainingKm,
      kmPerDay,
      confidence,
      daysRemaining,
      projectedDate: dateFormatted,
      riskLevel
    };
  }).sort((a, b) => a.daysRemaining - b.daysRemaining);

  const urgentPredictiveCount = predictiveMaintenanceData.filter(d => d.riskLevel === 'urgent').length;
  const warningPredictiveCount = predictiveMaintenanceData.filter(d => d.riskLevel === 'warning').length;

  // DRAG & DROP DASHBOARD CARDS REORDERING STATE
  type DashboardCardId = 
    | 'kpi_metrics'
    | 'predictive_maintenance'
    | 'fuel_analytics'
    | 'maintenance_and_parts'
    | 'recent_checkouts';

  const DEFAULT_CARD_ORDER: DashboardCardId[] = [
    'kpi_metrics',
    'predictive_maintenance',
    'fuel_analytics',
    'maintenance_and_parts',
    'recent_checkouts'
  ];

  const CARD_NAMES: Record<DashboardCardId, string> = {
    kpi_metrics: t('quickStats', lang),
    predictive_maintenance: t('predictiveMaintenance', lang),
    fuel_analytics: 'Fuel Analytics Charts',
    maintenance_and_parts: 'Maintenance & Parts Analysis',
    recent_checkouts: 'Recent Checkout Activity'
  };

  const [cardOrder, setCardOrder] = useState<DashboardCardId[]>(() => {
    try {
      const saved = localStorage.getItem('fleet_dashboard_card_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === DEFAULT_CARD_ORDER.length) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to load dashboard card order:", e);
    }
    return DEFAULT_CARD_ORDER;
  });

  const [draggedCardId, setDraggedCardId] = useState<DashboardCardId | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<DashboardCardId | null>(null);
  const [isReorderMode, setIsReorderMode] = useState<boolean>(false);

  const handleSaveOrder = (newOrder: DashboardCardId[]) => {
    setCardOrder(newOrder);
    try {
      localStorage.setItem('fleet_dashboard_card_order', JSON.stringify(newOrder));
    } catch (e) {
      console.warn("Failed to save dashboard card order:", e);
    }
  };

  const handleResetOrder = () => {
    handleSaveOrder(DEFAULT_CARD_ORDER);
  };

  const moveCard = (id: DashboardCardId, direction: 'up' | 'down') => {
    const idx = cardOrder.indexOf(id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= cardOrder.length) return;

    const updated = [...cardOrder];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    handleSaveOrder(updated);
  };

  const handleDragStart = (e: React.DragEvent, id: DashboardCardId) => {
    setDraggedCardId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: DashboardCardId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCardId !== id) {
      setDragOverCardId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: DashboardCardId) => {
    e.preventDefault();
    if (!draggedCardId || draggedCardId === targetId) {
      setDraggedCardId(null);
      setDragOverCardId(null);
      return;
    }

    const fromIndex = cardOrder.indexOf(draggedCardId);
    const toIndex = cardOrder.indexOf(targetId);

    if (fromIndex !== -1 && toIndex !== -1) {
      const updated = [...cardOrder];
      const [movedItem] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, movedItem);
      handleSaveOrder(updated);
    }

    setDraggedCardId(null);
    setDragOverCardId(null);
  };

  const handleDragEnd = () => {
    setDraggedCardId(null);
    setDragOverCardId(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner with Company Branding */}
      <div className="bg-[#0f1115] border border-gray-800 text-white rounded-2xl p-6 shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="w-16 h-16 object-contain bg-[#0a0b0d] rounded-xl p-2 border border-gray-800" />
          ) : (
            <div className="w-16 h-16 bg-[#cbb26a] text-black font-extrabold rounded-xl flex items-center justify-center text-2xl shadow-sm">
              {settings.companyName.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">{settings.companyName}</h1>
            <p className="text-[#cbb26a] text-sm font-medium">{settings.tagline}</p>
            <p className="text-gray-400 text-xs mt-1">{isAr ? 'لوحة التحليلات المركزية ومتابعة الحركة اليومية لأسطول السيارات' : 'Central analytics dashboard and daily fleet activity monitoring'}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsReorderMode(!isReorderMode)}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 border ${
              isReorderMode 
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400 shadow-md animate-pulse'
                : 'bg-gray-800/80 hover:bg-gray-700 text-gray-200 border-gray-700 shadow-sm'
            }`}
            title={isAr ? 'تخصيص ترتيب بطاقات اللوحة عن طريق السحب والإفلات' : 'Drag and drop to reorder dashboard cards'}
          >
            <Move className="w-4 h-4 text-[#cbb26a]" />
            {isReorderMode ? (isAr ? 'إنهاء الترتيب' : 'Done Reordering') : (isAr ? 'سحب وإعادة ترتيب البطاقات' : 'Reorder Cards')}
          </button>
          <button
            onClick={() => onNavigateTab('checkout')}
            className="px-5 py-2.5 bg-[#cbb26a] hover:bg-[#b89f57] text-black rounded-xl font-bold text-sm shadow-md transition flex items-center gap-2"
          >
            <KeyRound className="w-4 h-4 text-black" />
            {isAr ? 'استلام / تسليم سيارة' : 'Checkout / Return'}
          </button>
          <button
            onClick={() => onNavigateTab('fuel')}
            className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl font-bold text-sm shadow-sm transition flex items-center gap-2"
          >
            <Fuel className="w-4 h-4 text-amber-400" />
            {isAr ? 'سجلات الوقود' : 'Fuel Logs'}
          </button>
          <button
            onClick={() => onNavigateTab('maintenance')}
            className="px-4 py-2.5 bg-gray-800/80 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-xl font-bold text-sm shadow-sm transition flex items-center gap-2"
          >
            <Wrench className="w-4 h-4 text-[#cbb26a]" />
            {isAr ? 'فواتير الصيانة' : 'Maintenance Invoices'}
          </button>
        </div>
      </div>

      {/* QUICK STATS SUMMARY ROW */}
      <div className="bg-[#0f1115] border border-gray-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-gray-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#cbb26a] animate-ping" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-gray-300 flex items-center gap-2">
              {t('quickStats', lang)}
              <span className="px-2 py-0.5 bg-[#cbb26a]/10 text-[#cbb26a] border border-[#cbb26a]/20 rounded-full text-[10px] font-mono font-bold">
                {t('live', lang)}
              </span>
            </h2>
          </div>
          <span className="text-[11px] text-gray-400 font-mono">
            {t('autoUpdated', lang)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. Total Active Vehicles */}
          <div
            onClick={() => onNavigateTab('vehicles')}
            className="bg-[#0a0b0d] border border-gray-800 hover:border-emerald-500/50 rounded-xl p-4 transition duration-150 cursor-pointer group space-y-2 shadow-xs hover:bg-emerald-950/10"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 group-hover:text-gray-200 transition">
                {t('totalVehicles', lang)}
              </span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition">
                <Car className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-white group-hover:text-emerald-400 transition font-mono">
                {activeVehicles.length}
                <span className="text-xs font-normal text-gray-500 font-sans ml-1">
                  {isAr ? 'مركبة' : 'vehicles'}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                {isAr
                  ? `${availableVehicles.length} متاحة • ${activeCheckouts.length} مستلمة`
                  : `${availableVehicles.length} available • ${activeCheckouts.length} checked out`}
              </p>
            </div>
          </div>

          {/* 2. Vehicles in Maintenance */}
          <div
            onClick={() => onNavigateTab('maintenance')}
            className="bg-[#0a0b0d] border border-gray-800 hover:border-amber-500/50 rounded-xl p-4 transition duration-150 cursor-pointer group space-y-2 shadow-xs hover:bg-amber-950/10"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 group-hover:text-gray-200 transition">
                {t('vehiclesInMaintenance', lang)}
              </span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-white group-hover:text-amber-400 transition font-mono">
                {inMaintenanceVehicles.length}
                <span className="text-xs font-normal text-gray-500 font-sans ml-1">
                  {isAr ? 'مركبة' : 'in shop'}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${inMaintenanceVehicles.length > 0 ? 'bg-amber-400 animate-pulse' : 'bg-gray-600'}`}></span>
                {isAr
                  ? `${inMaintenanceVehicles.length} مركبة في الورش حالياً`
                  : `${inMaintenanceVehicles.length} in service workshop`}
              </p>
            </div>
          </div>

          {/* 3. Drivers with Expiring Licenses */}
          <div
            onClick={() => onNavigateTab('expiries')}
            className="bg-[#0a0b0d] border border-gray-800 hover:border-rose-500/50 rounded-xl p-4 transition duration-150 cursor-pointer group space-y-2 shadow-xs hover:bg-rose-950/10"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 group-hover:text-gray-200 transition">
                {t('driversWithExpiringLicenses', lang)}
              </span>
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 group-hover:scale-110 transition">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-white group-hover:text-rose-400 transition font-mono">
                {expiringDriverLicenses.length}
                <span className="text-xs font-normal text-gray-500 font-sans ml-1">
                  {isAr ? 'سائق' : 'drivers'}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${expiringDriverLicenses.length > 0 ? 'bg-rose-400 animate-pulse' : 'bg-emerald-500'}`}></span>
                {isAr
                  ? `${expiringDriverLicenses.length} رخصة تنتهي خلال 30 يوماً`
                  : `${expiringDriverLicenses.length} expire within 30 days`}
              </p>
            </div>
          </div>

          {/* 4. Total Monthly Fuel Expenses */}
          <div
            onClick={() => onNavigateTab('fuel')}
            className="bg-[#0a0b0d] border border-gray-800 hover:border-blue-500/50 rounded-xl p-4 transition duration-150 cursor-pointer group space-y-2 shadow-xs hover:bg-blue-950/10"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 group-hover:text-gray-200 transition">
                {t('totalMonthlyFuelExpenses', lang)}
              </span>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-110 transition">
                <Fuel className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-white group-hover:text-blue-400 transition font-mono truncate">
                {formatCurrency(currentMonthFuelTotal, settings?.currency, isAr ? 'ar' : 'en')}
              </div>
              <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                {isAr
                  ? `${currentMonthFuelLiters.toLocaleString()} لتر وقود مسجل`
                  : `${currentMonthFuelLiters.toLocaleString()} Liters logged`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Notice for Expiries */}
      {totalExpiries > 0 && (
        <div 
          onClick={() => onNavigateTab('expiries')}
          className="bg-[#0f1115] border border-amber-500/40 rounded-2xl p-4 cursor-pointer hover:bg-amber-950/20 transition flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-amber-300 text-sm">
                {isAr
                  ? `تنبيه هام: هناك (${totalExpiries}) رخص قيادة، رخص سير، أو وثائق تأمين قريبة الانتهاء!`
                  : `Important Alert: There are (${totalExpiries}) driver licenses, vehicle registrations, or insurance policies expiring soon!`}
              </p>
              <p className="text-xs text-gray-400">
                {isAr
                  ? 'انقر هنا لعرض التقرير التفصيلي للتجديدات ومواعيد الانتهاء لتجنب المخالفات المرورية.'
                  : 'Click here to view detailed renewal and expiry report to avoid traffic violations.'}
              </p>
            </div>
          </div>
          <ArrowUpRight className="w-5 h-5 text-amber-400 shrink-0" />
        </div>
      )}

      {/* Reordering Active Banner Notification */}
      {isReorderMode && (
        <div className="bg-indigo-950/90 border border-indigo-500/40 text-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30">
              <Move className="w-5 h-5 animate-pulse text-indigo-200" />
            </div>
            <div>
              <p className="text-sm font-bold text-white flex items-center gap-2">
                {isAr ? 'وضع إعادة ترتيب بطاقات لوحة التحكم (Drag and Drop Active)' : 'Dashboard Card Reordering Mode (Drag and Drop Active)'}
                <span className="text-[10px] bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 px-2 py-0.5 rounded-full font-bold">
                  {isAr ? 'تفاعلي' : 'Interactive'}
                </span>
              </p>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                {isAr
                  ? 'يمكنك الآن سحب أي بطاقة تحليلات من أيقونة المقبض (⋮⋮) وإسقاطها في المكان المناسب، أو استخدام الأسهم (▲▼) للتحريك.'
                  : 'Drag any card by the handle icon (⋮⋮) or use the arrows (▲▼) to reorder.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResetOrder}
              className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#cbb26a]" />
              {isAr ? 'الترتيب الافتراضي' : 'Default Order'}
            </button>
            <button
              type="button"
              onClick={() => setIsReorderMode(false)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition shadow"
            >
              {isAr ? 'حفظ وإنهاء' : 'Save & Done'}
            </button>
          </div>
        </div>
      )}

      {/* DRAGGABLE DASHBOARD CARDS CONTAINER */}
      <div className="space-y-6">
        {cardOrder.map((cardId, index) => {
          const isDraggingThis = draggedCardId === cardId;
          const isDragOverThis = dragOverCardId === cardId;

          return (
            <div
              key={cardId}
              draggable
              onDragStart={(e) => handleDragStart(e, cardId)}
              onDragOver={(e) => handleDragOver(e, cardId)}
              onDrop={(e) => handleDrop(e, cardId)}
              onDragEnd={handleDragEnd}
              className={`transition-all duration-200 rounded-2xl relative ${
                isDraggingThis ? 'opacity-40 scale-[0.99] border-2 border-dashed border-indigo-500 shadow-2xl' : ''
              } ${
                isDragOverThis ? 'border-2 border-indigo-400 shadow-xl ring-4 ring-indigo-500/20 bg-indigo-500/5' : ''
              }`}
            >
              {/* DRAG HANDLE BAR */}
              <div className="no-print flex items-center justify-between bg-[#151921] border border-gray-800/90 rounded-t-2xl px-4 py-2 text-xs font-bold text-gray-300">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition flex items-center gap-1"
                    title={isAr ? 'انقر واسحب لإعادة ترتيب هذا القسم في لوحة التحكم' : 'Drag to reorder this section'}
                  >
                    <GripVertical className="w-4 h-4 text-[#cbb26a]" />
                    <span className="text-[11px] font-mono text-[#cbb26a] font-bold">#{index + 1}</span>
                  </div>
                  <span className="text-gray-200 font-bold">{CARD_NAMES[cardId]}</span>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-gray-500 hidden sm:inline-block ml-2">
                    {isAr ? '(اسحب وأسقط أو استخدم الأسهم)' : '(Drag & drop or use arrows)'}
                  </span>
                  <button
                    type="button"
                    onClick={() => moveCard(cardId, 'up')}
                    disabled={index === 0}
                    className="p-1 hover:bg-white/10 rounded text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                    title={isAr ? 'تحريك للأعلى' : 'Move Up'}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCard(cardId, 'down')}
                    disabled={index === cardOrder.length - 1}
                    className="p-1 hover:bg-white/10 rounded text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                    title={isAr ? 'تحريك للأسفل' : 'Move Down'}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* CARD CONTENT BODY */}
              <div className="bg-[#0f1115] border border-gray-800 rounded-b-2xl p-1">
                {/* 1. KPI METRICS */}
                {cardId === 'kpi_metrics' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
                    {/* Total Vehicles Card */}
                    <div 
                      onClick={() => onNavigateTab('vehicles')}
                      className="bg-[#0a0b0d] border border-gray-800 hover:border-[#cbb26a]/40 rounded-2xl p-5 shadow-sm transition cursor-pointer space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{isAr ? 'إجمالي الأسطول' : 'Total Fleet'}</span>
                        <div className="p-2.5 bg-[#cbb26a]/10 text-[#cbb26a] rounded-xl border border-[#cbb26a]/20">
                          <Car className="w-5 h-5" />
                        </div>
                      </div>
                      <div>
                        <div className="text-3xl font-light text-white">{vehicles.length} <span className="text-sm font-normal text-gray-400">{isAr ? 'مركبة' : 'vehicles'}</span></div>
                        <div className="w-full bg-gray-800 h-1 mt-2.5 rounded-full overflow-hidden">
                          <div className="bg-[#cbb26a] h-full rounded-full" style={{ width: `${Math.min(100, (availableVehicles.length / (vehicles.length || 1)) * 100)}%` }}></div>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                          <span className="text-emerald-400 font-semibold">{availableVehicles.length} {isAr ? 'جاهزة' : 'available'}</span> • 
                          <span className="text-[#cbb26a] font-semibold">{activeCheckouts.length} {isAr ? 'مستلمة' : 'checked out'}</span> • 
                          <span className="text-rose-400 font-semibold">{inMaintenanceVehicles.length} {isAr ? 'بالصيانة' : 'in maintenance'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Drivers Card */}
                    <div 
                      onClick={() => onNavigateTab('drivers')}
                      className="bg-[#0a0b0d] border border-gray-800 hover:border-[#cbb26a]/40 rounded-2xl p-5 shadow-sm transition cursor-pointer space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{isAr ? 'السائقون والموظفون' : 'Drivers'}</span>
                        <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                          <Users className="w-5 h-5" />
                        </div>
                      </div>
                      <div>
                        <div className="text-3xl font-light text-white">{drivers.length} <span className="text-sm font-normal text-gray-400">{isAr ? 'سائق' : 'drivers'}</span></div>
                        <p className="text-xs text-gray-400 mt-2">{isAr ? 'جميع السائقين مسجلين برخص قيادة مخصصة' : 'All drivers registered with valid licenses'}</p>
                      </div>
                    </div>

                    {/* Active Checkouts Card */}
                    <div 
                      onClick={() => onNavigateTab('checkout')}
                      className="bg-[#0a0b0d] border border-gray-800 hover:border-[#cbb26a]/40 rounded-2xl p-5 shadow-sm transition cursor-pointer space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{isAr ? 'حركة الاستلام النشطة' : 'Active Checkouts'}</span>
                        <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                          <Clock className="w-5 h-5" />
                        </div>
                      </div>
                      <div>
                        <div className="text-3xl font-light text-[#cbb26a]">{activeCheckouts.length} <span className="text-sm font-normal text-gray-400">{isAr ? 'سيارة بالخارج' : 'vehicles out'}</span></div>
                        <p className="text-xs text-gray-400 font-medium mt-2">{isAr ? 'مسجلة بالتاريخ والتوقيع الإلكتروني' : 'Recorded with timestamp and digital signature'}</p>
                      </div>
                    </div>

                    {/* Total Fuel & Maintenance Expenses Card */}
                    <div 
                      onClick={() => onNavigateTab('fuel')}
                      className="bg-[#0a0b0d] border border-gray-800 hover:border-[#cbb26a]/40 rounded-2xl p-5 shadow-sm transition cursor-pointer space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{isAr ? 'إجمالي استهلاك الوقود' : 'Total Fuel Spend'}</span>
                        <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                          <Fuel className="w-5 h-5" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-light text-white">
                          {formatCurrency(totalFuelCost, settings?.currency, isAr ? 'ar' : 'en')}
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-400">
                          <span>{isAr ? `كمية اللترات: ${totalFuelLiters.toLocaleString()} L` : `Total Liters: ${totalFuelLiters.toLocaleString()} L`}</span> | 
                          <span>{isAr ? `السجلات: ${fuel.length} تعبئة` : `Records: ${fuel.length} fills`}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. PREDICTIVE MAINTENANCE CARD */}
                {cardId === 'predictive_maintenance' && (
                  <div className="bg-[#0f1115] p-6 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl">
                          <Sparkles className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white flex items-center gap-2">
                            {t('predictiveMaintenance', lang)}
                            <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-mono dir-ltr">
                              y = mx + c (Linear Regression)
                            </span>
                          </h3>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {isAr
                              ? 'حساب وتوقع موعد الصيانة القادم المستهدفة لسيارات الأسطول بناءً على خوارزمية معدل تراكم الكيلومترات اليومية'
                              : 'Calculates next estimated service date based on daily mileage accumulation rate using linear regression.'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => onNavigateTab('maintenance')}
                        className="text-xs font-bold text-[#cbb26a] hover:underline flex items-center gap-1 shrink-0"
                      >
                        {isAr ? 'الانتقال لإدارة الصيانة' : 'Go to Maintenance'}
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quick Predictive Summary Chips */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-[#0a0b0d] border border-gray-800 p-3.5 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-red-500/10 text-red-400 rounded-lg">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-semibold text-gray-300">{isAr ? 'صيانة طارئة / متأخرة' : 'Urgent / Overdue'}</span>
                        </div>
                        <span className="text-base font-bold text-red-400">{urgentPredictiveCount} {isAr ? 'سيارات' : 'vehicles'}</span>
                      </div>

                      <div className="bg-[#0a0b0d] border border-gray-800 p-3.5 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                            <Clock className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-semibold text-gray-300">{isAr ? 'موعد موصى به خلال شهر' : 'Recommended within month'}</span>
                        </div>
                        <span className="text-base font-bold text-amber-400">{warningPredictiveCount} {isAr ? 'سيارات' : 'vehicles'}</span>
                      </div>

                      <div className="bg-[#0a0b0d] border border-gray-800 p-3.5 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                            <Activity className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-semibold text-gray-300">{isAr ? 'حالة ممتازة' : 'Excellent Condition'}</span>
                        </div>
                        <span className="text-base font-bold text-emerald-400">
                          {predictiveMaintenanceData.length - urgentPredictiveCount - warningPredictiveCount} {isAr ? 'سيارات' : 'vehicles'}
                        </span>
                      </div>
                    </div>

                    {/* Predictive Vehicles Table */}
                    <div className="overflow-x-auto border border-gray-800/80 rounded-xl">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="bg-[#0a0b0d] text-gray-400 border-b border-gray-800">
                            <th className="p-3">{isAr ? 'السيارة واللوحة' : 'Vehicle & Plate'}</th>
                            <th className="p-3">{isAr ? 'العداد الحالي' : 'Current Odometer'}</th>
                            <th className="p-3">{isAr ? 'مستهدف الصيانة' : 'Target Service'}</th>
                            <th className="p-3">{isAr ? 'معدل الاستهلاك اليومي' : 'Daily Avg. Consumption'}</th>
                            <th className="p-3">{isAr ? 'المتبقي المتوقع' : 'Remaining Estimate'}</th>
                            <th className="p-3">{isAr ? 'تاريخ الصيانة المتوقع' : 'Expected Service Date'}</th>
                            <th className="p-3">{isAr ? 'الحالة والتوقع' : 'Status & Prediction'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/60">
                          {predictiveMaintenanceData.map((item) => (
                            <tr key={item.vehicle.id} className="hover:bg-white/5 transition">
                              <td className="p-3 font-bold text-white">
                                {item.vehicle.make} {item.vehicle.model} ({item.vehicle.year})
                                <span className="block text-[11px] font-normal text-gray-400">{item.vehicle.plateNumber}</span>
                              </td>
                              <td className="p-3 font-mono text-gray-200">
                                {item.currentMileage.toLocaleString()} km
                              </td>
                              <td className="p-3 font-mono text-indigo-300">
                                {item.targetKm.toLocaleString()} km
                              </td>
                              <td className="p-3 text-gray-300">
                                <span className="font-bold text-amber-400 font-mono">{item.kmPerDay} km/day</span>
                                <span className="block text-[10px] text-gray-500">{item.confidence}</span>
                              </td>
                              <td className="p-3 font-mono">
                                {item.remainingKm <= 0 ? (
                                  <span className="text-red-400 font-bold">{isAr ? `تجاوز بـ ${Math.abs(item.remainingKm).toLocaleString()} كم` : `Overdue by ${Math.abs(item.remainingKm).toLocaleString()} km`}</span>
                                ) : (
                                  <span className="text-gray-300">{item.remainingKm.toLocaleString()} km ({item.daysRemaining} {isAr ? 'يوم' : 'days'})</span>
                                )}
                              </td>
                              <td className="p-3 dir-ltr text-right font-mono text-gray-200">
                                {item.projectedDate}
                              </td>
                              <td className="p-3">
                                {item.riskLevel === 'urgent' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                                    <AlertTriangle className="w-3 h-3" /> {isAr ? 'صيانة عاجلة' : 'Urgent'}
                                  </span>
                                ) : item.riskLevel === 'warning' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    <Clock className="w-3 h-3" /> {isAr ? 'اقتراب الموعد' : 'Upcoming'}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <CheckCircle2 className="w-3 h-3" /> {isAr ? 'حالة آمنة' : 'Safe'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 3. FUEL ANALYTICS CHARTS */}
                {cardId === 'fuel_analytics' && (
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                      <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                          <Flame className="w-5 h-5 text-amber-500" />
                          {isAr ? 'تحليلات واستهلاك الوقود (Recharts Charts)' : 'Fuel Analytics & Consumption (Recharts Charts)'}
                        </h2>
                        <p className="text-xs text-gray-400">{isAr ? 'رسوم بيانية تفاعلية لمتابعة المصاريف الشهرية ومعدلات الاستهلاك للسيارات' : 'Interactive charts for monthly expenses and vehicle consumption rates'}</p>
                      </div>
                      <button
                        onClick={() => onNavigateTab('fuel')}
                        className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
                      >
                        {isAr ? 'سجلات الوقود التفصيلية' : 'Fuel Logs'}
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Chart 1: Monthly Fuel Expenses Chart */}
                      <div className="bg-[#0a0b0d] border border-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b pb-3 border-gray-800">
                          <div>
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                              <TrendingUp className="w-5 h-5 text-amber-400" />
                              {isAr ? `مصاريف الوقود الشهرية (${getCurrencySymbol(settings?.currency, 'ar')} / لتر)` : `Monthly Fuel Expenses (${getCurrencySymbol(settings?.currency, 'en')} / Liters)`}
                            </h3>
                            <p className="text-xs text-gray-400">{isAr ? 'تطور التكلفة والكميات المستهلكة شهرياً للأسطول' : 'Monthly fleet fuel expenditure and liter volume trends'}</p>
                          </div>
                          <span className="text-xs font-semibold px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg">
                            {isAr ? 'تراكمي شهري' : 'Monthly Cumulative'}
                          </span>
                        </div>

                        <div className="h-72">
                          {monthlyFuelData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={monthlyFuelData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                                <defs>
                                  <linearGradient id="colorFuelCost" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                  </linearGradient>
                                  <linearGradient id="colorLiters" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#cbb26a" stopOpacity={0.6}/>
                                    <stop offset="95%" stopColor="#cbb26a" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f242d" />
                                <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#6b7280' }} />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#0f1115', borderColor: '#374151', color: '#f3f4f6', borderRadius: '12px' }}
                                  formatter={(value: any, name: string) => [
                                    name === 'totalCost' ? formatCurrency(Number(value), settings?.currency, isAr ? 'ar' : 'en') : `${Number(value).toLocaleString()} ${isAr ? 'لتر' : 'L'}`,
                                    name === 'totalCost' ? (isAr ? 'المبلغ الإجمالي' : 'Total Amount') : (isAr ? 'إجمالي اللترات' : 'Total Liters')
                                  ]}
                                  labelFormatter={(label) => `${isAr ? 'الشهر' : 'Month'}: ${label}`}
                                />
                                <Legend 
                                  formatter={(value) => value === 'totalCost' ? `${isAr ? 'المبلغ' : 'Amount'} (${getCurrencySymbol(settings?.currency, isAr ? 'ar' : 'en')})` : `${isAr ? 'الكمية (لتر)' : 'Quantity (L)'}`}
                                  wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                                />
                                <Area yAxisId="left" type="monotone" dataKey="totalCost" name="totalCost" stroke="#f59e0b" fillOpacity={1} fill="url(#colorFuelCost)" strokeWidth={2} />
                                <Area yAxisId="right" type="monotone" dataKey="totalLiters" name="totalLiters" stroke="#cbb26a" fillOpacity={1} fill="url(#colorLiters)" strokeWidth={2} />
                              </AreaChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                              {isAr ? 'لا توجد سجلات وقود مسجلة' : 'No fuel logs available'}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Chart 2: Vehicle Fuel Consumption Rates Chart */}
                      <div className="bg-[#0a0b0d] border border-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b pb-3 border-gray-800">
                          <div>
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                              <BarChart3 className="w-5 h-5 text-[#cbb26a]" />
                              {isAr ? 'معدلات استهلاك السيارات للوقود' : 'Vehicle Fuel Consumption Breakdown'}
                            </h3>
                            <p className="text-xs text-gray-400">{isAr ? 'مقارنة إجمالي التكلفة واللترات لكل سيارة في الأسطول' : 'Cost & liter volume breakdown per vehicle'}</p>
                          </div>
                          <span className="text-xs font-semibold px-2.5 py-1 bg-[#cbb26a]/10 text-[#cbb26a] border border-[#cbb26a]/20 rounded-lg">
                            {isAr ? 'حسب المركبة' : 'Per Vehicle'}
                          </span>
                        </div>

                        <div className="h-72">
                          {vehicleFuelData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={vehicleFuelData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f242d" />
                                <XAxis dataKey="vehicleName" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#6b7280' }} />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#0f1115', borderColor: '#374151', color: '#f3f4f6', borderRadius: '12px' }}
                                  formatter={(value: any, name: string) => [
                                    name === 'totalCost' ? formatCurrency(Number(value), settings?.currency, isAr ? 'ar' : 'en') : `${Number(value).toLocaleString()} ${isAr ? 'لتر' : 'L'}`,
                                    name === 'totalCost' ? (isAr ? 'تكلفة الوقود' : 'Fuel Spend') : (isAr ? 'اللترات المستهلكة' : 'Liters Consumed')
                                  ]}
                                  labelFormatter={(label) => `${isAr ? 'السيارة' : 'Vehicle'}: ${label}`}
                                />
                                <Legend 
                                  formatter={(value) => value === 'totalCost' ? `${isAr ? 'تكلفة الوقود' : 'Fuel Cost'} (${getCurrencySymbol(settings?.currency, isAr ? 'ar' : 'en')})` : `${isAr ? 'اللترات' : 'Liters'} (L)`}
                                  wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                                />
                                <Bar yAxisId="left" dataKey="totalCost" name="totalCost" fill="#cbb26a" radius={[6, 6, 0, 0]} />
                                <Bar yAxisId="right" dataKey="totalLiters" name="totalLiters" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                              {isAr ? 'لا توجد بيانات استهلاك وقود للسيارات' : 'No fuel consumption data recorded'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Breakdown by Fuel Type */}
                    {fuelTypeData.length > 0 && (
                      <div className="bg-[#0a0b0d] border border-gray-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="space-y-1 text-center sm:text-right">
                          <h4 className="text-sm font-bold text-white flex items-center gap-2 justify-center sm:justify-start">
                            <Fuel className="w-4 h-4 text-amber-400" />
                            {isAr ? 'توزيع استهلاك الوقود حسب نوع الوقود' : 'Fuel Spend Distribution by Fuel Grade'}
                          </h4>
                          <p className="text-xs text-gray-400">{isAr ? 'نسب الاستهلاك المالي لتزويد الأسطول بالمحروقات' : 'Proportions of total fuel spend across vehicle grades'}</p>
                        </div>

                        <div className="flex items-center gap-6 flex-wrap justify-center">
                          {fuelTypeData.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 bg-[#0f1115] px-3.5 py-2 rounded-xl border border-gray-800">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                              <span className="text-xs text-gray-300 font-semibold">{item.name}:</span>
                              <span className="text-xs font-bold text-white">{formatCurrency(item.value, settings?.currency, isAr ? 'ar' : 'en')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. MAINTENANCE & PARTS CHARTS */}
                {cardId === 'maintenance_and_parts' && (
                  <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Faulty Vehicles Chart */}
                    <div className="bg-[#0a0b0d] border border-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b pb-3 border-gray-800">
                        <div>
                          <h3 className="text-base font-bold text-white flex items-center gap-2">
                            <Wrench className="w-5 h-5 text-[#cbb26a]" />
                            {isAr ? 'أكثر السيارات تكلفة صيانة وأعطالاً' : 'Highest Maintenance Cost Vehicles'}
                          </h3>
                          <p className="text-xs text-gray-400">{isAr ? 'تحليل كلفة الأعطال تراكمياً لحجم الأسطول' : 'Cumulative repair expenditure analysis'}</p>
                        </div>
                        <button
                          onClick={() => onNavigateTab('maintenance')}
                          className="text-xs text-[#cbb26a] font-bold hover:underline"
                        >
                          {isAr ? 'عرض الكل' : 'View All'}
                        </button>
                      </div>

                      <div className="h-64">
                        {topFaultyVehicles.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topFaultyVehicles} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f242d" />
                              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#0f1115', borderColor: '#374151', color: '#f3f4f6', borderRadius: '12px' }}
                                formatter={(value: any) => [formatCurrency(Number(value), settings?.currency, isAr ? 'ar' : 'en'), isAr ? 'التكلفة الإجمالية' : 'Total Cost']}
                                labelFormatter={(label) => `${isAr ? 'المركبة' : 'Vehicle'}: ${label}`}
                              />
                              <Bar dataKey="cost" fill="#cbb26a" radius={[6, 6, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                            {isAr ? 'لا توجد سجلات صيانة مسجلة حتى الآن' : 'No maintenance records available'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Top Replaced Parts */}
                    <div className="bg-[#0a0b0d] border border-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b pb-3 border-gray-800">
                        <div>
                          <h3 className="text-base font-bold text-white flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-[#cbb26a]" />
                            {isAr ? 'أكثر قطع الغيار استبدالاً وتكلفة' : 'Most Replaced & Costly Parts'}
                          </h3>
                          <p className="text-xs text-gray-400">{isAr ? 'متابعة الهدر والقطع الأكثر استهلاكاً بالقطع والكميات' : 'Tracking high-turnover replacement parts'}</p>
                        </div>
                        <button
                          onClick={() => onNavigateTab('maintenance')}
                          className="text-xs text-[#cbb26a] font-bold hover:underline"
                        >
                          {isAr ? 'التفاصيل' : 'Details'}
                        </button>
                      </div>

                      <div className="space-y-3">
                        {topReplacedParts.length > 0 ? (
                          topReplacedParts.map((part, index) => (
                            <div 
                              key={index} 
                              className="p-3 bg-[#0f1115] rounded-xl border border-gray-800 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-7 h-7 rounded-lg bg-[#cbb26a]/10 text-[#cbb26a] font-bold text-xs flex items-center justify-center border border-[#cbb26a]/20">
                                  #{index + 1}
                                </span>
                                <div>
                                  <p className="font-bold text-gray-200 text-sm">{part.partName}</p>
                                  <p className="text-xs text-gray-400">{isAr ? `عدد القطع المستبدلة: ${part.totalQty} قطعة` : `Units Replaced: ${part.totalQty} items`}</p>
                                </div>
                              </div>
                              <div className="text-left">
                                <span className="font-bold text-[#cbb26a] text-sm">
                                  {formatCurrency(part.totalSpend, settings?.currency, isAr ? 'ar' : 'en')}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-12 text-center text-gray-500 text-sm">
                            {isAr ? 'لم يتم تسجيل استبدال قطع غيار حتى الآن' : 'No replacement parts recorded yet'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. RECENT CHECKOUTS */}
                {cardId === 'recent_checkouts' && (
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between border-b pb-3 border-gray-800">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <FileCheck2 className="w-5 h-5 text-[#cbb26a]" />
                        {isAr ? 'حالة حركة واستلام السيارات الحالية (منصة التوقيع أونلاين)' : 'Current Vehicle Checkout Status (Digital Signature Platform)'}
                      </h3>
                      <button
                        onClick={() => onNavigateTab('checkout')}
                        className="text-xs font-bold text-[#cbb26a] hover:underline"
                      >
                        {isAr ? 'الانتقال لغرفة الاستلام والتسليم' : 'Go to Checkout Hub'}
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-sm">
                        <thead>
                          <tr className="bg-[#0a0b0d] text-gray-400 text-xs border-b border-gray-800">
                            <th className="p-3 rounded-r-lg">{isAr ? 'السيارة واللوحة' : 'Vehicle & Plate'}</th>
                            <th className="p-3">{isAr ? 'المستلم / السائق' : 'Driver'}</th>
                            <th className="p-3">{isAr ? 'غرض الاستخدام' : 'Purpose'}</th>
                            <th className="p-3">{isAr ? 'وقت الخروج' : 'Checkout Time'}</th>
                            <th className="p-3">{isAr ? 'عداد الخروج' : 'Odometer'}</th>
                            <th className="p-3">{isAr ? 'التوقيع' : 'Signature'}</th>
                            <th className="p-3 rounded-l-lg">{isAr ? 'الحالة' : 'Status'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/60">
                          {checkouts.slice(0, 5).map(session => {
                            const vehicle = vehicles.find(v => v.id === session.vehicleId);
                            const driver = drivers.find(d => d.id === session.driverId);

                            return (
                              <tr key={session.id} className="hover:bg-white/5 transition">
                                <td className="p-3 font-bold text-white">
                                  {vehicle ? `${vehicle.make} ${vehicle.model}` : 'Vehicle'}
                                  <span className="block text-xs font-normal text-gray-400">{vehicle?.plateNumber}</span>
                                </td>
                                <td className="p-3 text-gray-300">
                                  {driver?.name || 'Driver'}
                                </td>
                                <td className="p-3 text-xs text-gray-400">
                                  {session.purposeCustom || session.purpose}
                                </td>
                                <td className="p-3 text-xs text-gray-400 dir-ltr text-right">
                                  {new Date(session.checkoutTime).toLocaleString('en-US')}
                                </td>
                                <td className="p-3 text-xs font-mono text-gray-300">{session.checkoutOdometer.toLocaleString()} km</td>
                                <td className="p-3">
                                  {session.checkoutSignature ? (
                                    <img src={session.checkoutSignature} alt="Sig" className="h-6 object-contain invert brightness-200" />
                                  ) : (
                                    <span className="text-xs text-gray-500">-</span>
                                  )}
                                </td>
                                <td className="p-3">
                                  {session.status === 'active' ? (
                                    <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full text-xs font-bold">
                                      <Clock className="w-3 h-3" /> {isAr ? 'قيد الاستخدام' : 'Active'}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-xs font-bold">
                                      <CheckCircle2 className="w-3 h-3" /> {isAr ? 'تم الإعادة' : 'Returned'}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};