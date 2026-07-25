import React, { useState } from 'react';
import { FuelRecord, ExpenseRecord, Vehicle, Driver, Garage, MaintenanceRecord, CompanySettings, CheckoutSession } from '../types';
import { formatCurrency, getCurrencySymbol } from '../lib/currency';
import { 
  Fuel, 
  Plus, 
  Calendar, 
  Gauge, 
  Trash2, 
  Shield, 
  DollarSign, 
  Calculator, 
  FileText, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Building2, 
  Wrench, 
  CreditCard, 
  Filter,
  Check,
  Zap,
  User,
  RotateCcw
} from 'lucide-react';

interface FuelExpensesViewProps {
  fuel: FuelRecord[];
  expenses: ExpenseRecord[];
  vehicles: Vehicle[];
  drivers: Driver[];
  checkouts?: CheckoutSession[];
  garages?: Garage[];
  maintenance?: MaintenanceRecord[];
  settings?: CompanySettings;
  onSaveFuel: (record: FuelRecord) => void;
  onDeleteFuel: (id: string) => void;
  onSaveExpense: (record: ExpenseRecord) => void;
  onDeleteExpense: (id: string) => void;
  onSaveMaintenance?: (record: MaintenanceRecord) => void;
  lang?: 'ar' | 'en';
}

export const FuelExpensesView: React.FC<FuelExpensesViewProps> = ({
  fuel,
  expenses,
  vehicles,
  drivers,
  checkouts = [],
  garages = [],
  maintenance = [],
  settings,
  onSaveFuel,
  onDeleteFuel,
  onSaveExpense,
  onDeleteExpense,
  onSaveMaintenance,
  lang = 'ar'
}) => {
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<'fuel' | 'renewals' | 'pending_invoices'>('fuel');
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Quick Add Auto-Fill State
  const [autoFilledCheckout, setAutoFilledCheckout] = useState<{
    sessionId?: string;
    driverName?: string;
    vehicleName?: string;
    plateNumber?: string;
    odometer?: number;
    checkoutTime?: string;
    source: 'checkout' | 'assigned';
  } | null>(null);

  // Filter inside Pending Invoices Tab
  const [pendingCategoryFilter, setPendingCategoryFilter] = useState<'all' | 'fuel' | 'maintenance' | 'expenses'>('all');

  // New Fuel Form State
  const [fuelVehicleId, setFuelVehicleId] = useState('');
  const [fuelDriverId, setFuelDriverId] = useState('');
  const [fuelDate, setFuelDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [fuelLiters, setFuelLiters] = useState<number>(50);
  const [fuelCostPerLiter, setFuelCostPerLiter] = useState<number>(2.33);
  const [fuelTotalCost, setFuelTotalCost] = useState<number>(116.5);
  const [fuelOdometer, setFuelOdometer] = useState<number>(0);
  const [fuelStation, setFuelStation] = useState('محطة الدريس');
  const [fuelPaymentStatus, setFuelPaymentStatus] = useState<'paid' | 'pending'>('paid');

  // Helper: Get most recent checkout session for a driver
  const getLatestCheckoutForDriver = (driverId: string) => {
    if (!checkouts || checkouts.length === 0 || !driverId) return null;
    const driverCheckouts = checkouts.filter(c => c.driverId === driverId);
    if (driverCheckouts.length === 0) return null;
    return [...driverCheckouts].sort((a, b) => 
      new Date(b.checkoutTime).getTime() - new Date(a.checkoutTime).getTime()
    )[0];
  };

  // Helper: Auto-fill vehicle and odometer based on driver's most recent checkout
  const handleDriverChangeInModal = (driverId: string) => {
    setFuelDriverId(driverId);
    if (!driverId) {
      setAutoFilledCheckout(null);
      return;
    }

    const latestCheckout = getLatestCheckoutForDriver(driverId);
    const driver = drivers.find(d => d.id === driverId);

    if (latestCheckout) {
      const veh = vehicles.find(v => v.id === latestCheckout.vehicleId);
      const odo = latestCheckout.returnOdometer ?? latestCheckout.checkoutOdometer ?? veh?.mileage ?? 0;
      
      setFuelVehicleId(latestCheckout.vehicleId);
      setFuelOdometer(odo);
      setAutoFilledCheckout({
        sessionId: latestCheckout.id,
        driverName: driver?.name || '',
        vehicleName: veh ? `${veh.make} ${veh.model}` : '',
        plateNumber: veh?.plateNumber || '',
        odometer: odo,
        checkoutTime: latestCheckout.checkoutTime,
        source: 'checkout'
      });
    } else {
      // Fallback to assigned vehicle if driver has no checkout sessions
      const assignedVeh = vehicles.find(v => v.assignedDriverId === driverId);
      if (assignedVeh) {
        setFuelVehicleId(assignedVeh.id);
        setFuelOdometer(assignedVeh.mileage);
        setAutoFilledCheckout({
          driverName: driver?.name || '',
          vehicleName: `${assignedVeh.make} ${assignedVeh.model}`,
          plateNumber: assignedVeh.plateNumber,
          odometer: assignedVeh.mileage,
          source: 'assigned'
        });
      } else {
        setAutoFilledCheckout(null);
      }
    }
  };

  // Helper: Open fuel modal with optional driver pre-selected
  const handleOpenQuickAddModal = (driverId?: string) => {
    setShowFuelModal(true);
    if (driverId) {
      handleDriverChangeInModal(driverId);
    } else if (drivers.length > 0) {
      const driverWithCheckout = drivers.find(d => getLatestCheckoutForDriver(d.id));
      if (driverWithCheckout) {
        handleDriverChangeInModal(driverWithCheckout.id);
      } else if (drivers[0]) {
        handleDriverChangeInModal(drivers[0].id);
      }
    }
  };

  // New Expense Form State
  const [expVehicleId, setExpVehicleId] = useState('');
  const [expType, setExpType] = useState<ExpenseRecord['type']>('registration_renewal');
  const [expTitle, setExpTitle] = useState('تجديد رخصة سير الاستمارة');
  const [expAmount, setExpAmount] = useState<number>(300);
  const [expDate, setExpDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [expReceipt, setExpReceipt] = useState('');
  const [expPaymentStatus, setExpPaymentStatus] = useState<'paid' | 'pending'>('paid');

  const handleLitersOrRateChange = (liters: number, rate: number) => {
    setFuelLiters(liters);
    setFuelCostPerLiter(rate);
    setFuelTotalCost(Number((liters * rate).toFixed(2)));
  };

  const handleCreateFuel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fuelVehicleId || !fuelDriverId) {
      alert('يرجى تحديد المركبة والسائق');
      return;
    }

    const record: FuelRecord = {
      id: `f-${Date.now().toString().slice(-5)}`,
      vehicleId: fuelVehicleId,
      driverId: fuelDriverId,
      date: fuelDate,
      liters: Number(fuelLiters),
      costPerLiter: Number(fuelCostPerLiter),
      totalCost: Number(fuelTotalCost),
      odometerReading: Number(fuelOdometer),
      stationName: fuelStation,
      paymentStatus: fuelPaymentStatus
    };

    onSaveFuel(record);
    setShowFuelModal(false);
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expVehicleId || !expAmount) {
      alert('يرجى تحديد المركبة والمبلغ');
      return;
    }

    const record: ExpenseRecord = {
      id: `e-${Date.now().toString().slice(-5)}`,
      vehicleId: expVehicleId,
      type: expType,
      title: expTitle,
      amount: Number(expAmount),
      date: expDate,
      receiptNumber: expReceipt,
      paymentStatus: expPaymentStatus
    };

    onSaveExpense(record);
    setShowExpenseModal(false);
  };

  // Quick Status Toggles
  const toggleFuelStatus = (record: FuelRecord) => {
    const updated: FuelRecord = {
      ...record,
      paymentStatus: record.paymentStatus === 'pending' ? 'paid' : 'pending'
    };
    onSaveFuel(updated);
  };

  const toggleExpenseStatus = (record: ExpenseRecord) => {
    const updated: ExpenseRecord = {
      ...record,
      paymentStatus: record.paymentStatus === 'pending' ? 'paid' : 'pending'
    };
    onSaveExpense(updated);
  };

  const toggleMaintenanceStatus = (record: MaintenanceRecord) => {
    if (!onSaveMaintenance) return;
    const updated: MaintenanceRecord = {
      ...record,
      status: record.status === 'pending_payment' ? 'completed' : 'pending_payment'
    };
    onSaveMaintenance(updated);
  };

  // Pending Calculations
  const pendingFuel = fuel.filter(f => f.paymentStatus === 'pending');
  const pendingMaintenance = maintenance.filter(m => m.status === 'pending_payment');
  const pendingExpenses = expenses.filter(e => e.paymentStatus === 'pending');

  const totalPendingFuelAmount = pendingFuel.reduce((sum, f) => sum + f.totalCost, 0);
  const totalPendingMaintenanceAmount = pendingMaintenance.reduce((sum, m) => sum + m.totalCost, 0);
  const totalPendingExpenseAmount = pendingExpenses.reduce((sum, e) => sum + e.amount, 0);

  const totalPendingAll = totalPendingFuelAmount + totalPendingMaintenanceAmount + totalPendingExpenseAmount;
  const totalPendingCount = pendingFuel.length + pendingMaintenance.length + pendingExpenses.length;

  // Group Pending Fuel by Station
  const stationsDue = React.useMemo(() => {
    const map: Record<string, { stationName: string; count: number; totalAmount: number }> = {};
    pendingFuel.forEach(f => {
      const key = f.stationName || 'محطة غير محددة';
      if (!map[key]) {
        map[key] = { stationName: key, count: 0, totalAmount: 0 };
      }
      map[key].count += 1;
      map[key].totalAmount += f.totalCost;
    });
    return Object.values(map);
  }, [pendingFuel]);

  // Group Pending Maintenance by Garage
  const garagesDue = React.useMemo(() => {
    const map: Record<string, { garageName: string; contactPerson?: string; phone?: string; count: number; totalAmount: number }> = {};
    pendingMaintenance.forEach(m => {
      const g = garages.find(gar => gar.id === m.garageId);
      const name = g ? g.name : 'ورشة صيانة';
      const key = m.garageId || name;

      if (!map[key]) {
        map[key] = {
          garageName: name,
          contactPerson: g?.contactPerson,
          phone: g?.phone,
          count: 0,
          totalAmount: 0
        };
      }
      map[key].count += 1;
      map[key].totalAmount += m.totalCost;
    });
    return Object.values(map);
  }, [pendingMaintenance, garages]);

  // Combined List of All Pending Invoices for detailed management
  const allPendingList = React.useMemo(() => {
    const list: Array<{
      id: string;
      category: 'fuel' | 'maintenance' | 'expenses';
      invoiceNo: string;
      date: string;
      vendorName: string;
      vehicleId: string;
      description: string;
      amount: number;
      originalRecord: any;
    }> = [];

    if (pendingCategoryFilter === 'all' || pendingCategoryFilter === 'fuel') {
      pendingFuel.forEach(f => {
        list.push({
          id: f.id,
          category: 'fuel',
          invoiceNo: f.id,
          date: f.date,
          vendorName: f.stationName,
          vehicleId: f.vehicleId,
          description: `تعبئة وقود (${f.liters} لتر - ${f.notes || 'بدون ملاحظات'})`,
          amount: f.totalCost,
          originalRecord: f
        });
      });
    }

    if (pendingCategoryFilter === 'all' || pendingCategoryFilter === 'maintenance') {
      pendingMaintenance.forEach(m => {
        const g = garages.find(gar => gar.id === m.garageId);
        list.push({
          id: m.id,
          category: 'maintenance',
          invoiceNo: m.invoiceNumber || m.id,
          date: m.date,
          vendorName: g?.name || 'ورشة صيانة',
          vehicleId: m.vehicleId,
          description: m.description,
          amount: m.totalCost,
          originalRecord: m
        });
      });
    }

    if (pendingCategoryFilter === 'all' || pendingCategoryFilter === 'expenses') {
      pendingExpenses.forEach(e => {
        list.push({
          id: e.id,
          category: 'expenses',
          invoiceNo: e.receiptNumber || e.id,
          date: e.date,
          vendorName: 'الجهة الرسمية / الرسوم',
          vehicleId: e.vehicleId,
          description: e.title,
          amount: e.amount,
          originalRecord: e
        });
      });
    }

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [pendingCategoryFilter, pendingFuel, pendingMaintenance, pendingExpenses, garages]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Fuel className="w-7 h-7 text-amber-400" />
            {isAr ? 'سجل مصاريف البترول وتجديدات الرخص والتأمين' : 'Fuel Expenses, Registration & Insurance Renewals Log'}
          </h2>
          <p className="text-amber-100 text-sm mt-1">
            {isAr ? 'تتبع استهلاك الوقود، ومصاريف التجديد، وإدارة الفواتير المعلقة والمبالغ المستحقة للكراجات والمحطات.' : 'Track fuel consumption, renewal fees, and pending invoices for garages and gas stations.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowExpenseModal(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-2"
          >
            <Shield className="w-4 h-4 text-emerald-400" />
            {isAr ? 'تسجيل مصروف تجديد / تأمين' : 'Record Renewal / Insurance Fee'}
          </button>

          <button
            onClick={() => setShowFuelModal(true)}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-sm shadow transition flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {isAr ? 'تعبئة وقود جديدة' : 'Add New Fuel Log'}
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 space-x-2 space-x-reverse">
        <button
          onClick={() => setActiveTab('fuel')}
          className={`pb-3 px-4 font-bold text-sm transition border-b-2 flex items-center gap-2 ${
            activeTab === 'fuel'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Fuel className="w-4 h-4" />
          {isAr ? `سجل البنزين (${fuel.length})` : `Fuel Records (${fuel.length})`}
        </button>

        <button
          onClick={() => setActiveTab('renewals')}
          className={`pb-3 px-4 font-bold text-sm transition border-b-2 flex items-center gap-2 ${
            activeTab === 'renewals'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          {isAr ? `مصاريف التجديدات والتأمين (${expenses.length})` : `Renewals & Insurance (${expenses.length})`}
        </button>

        <button
          onClick={() => setActiveTab('pending_invoices')}
          className={`pb-3 px-4 font-bold text-sm transition border-b-2 flex items-center gap-2 relative ${
            activeTab === 'pending_invoices'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Clock className="w-4 h-4 text-rose-500" />
          {isAr ? `الفواتير المستحقة والمعلقة (${totalPendingCount})` : `Pending Invoices (${totalPendingCount})`}
          {totalPendingCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          )}
        </button>
      </div>

      {/* 1. FUEL RECORDS TAB */}
      {activeTab === 'fuel' && (
        <div className="space-y-4">
          {/* QUICK ADD BY DRIVER BANNER */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Zap className="w-4 h-4 fill-amber-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    {isAr ? 'التعبئة السريعة بنقرة واحدة (من أحدث إيصال تسليم/خروج)' : '1-Click Quick Add (Pre-filled from Recent Checkout)'}
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] rounded-full font-mono font-bold">
                      Auto-Fill
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {isAr ? 'انقر على اسم السائق لتعبئة الوقود وسحب بيانات المركبة وعداد المسافات تلقائياً من آخر رحلة.' : 'Click a driver to auto-fill vehicle and odometer reading from their most recent checkout record.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenQuickAddModal()}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow"
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950" />
                {isAr ? 'تعبئة سريعة بالذكاء' : 'Quick Fill Wizard'}
              </button>
            </div>

            {/* DRIVERS QUICK-FILL CHIPS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
              {drivers.map(d => {
                const latestCheckout = getLatestCheckoutForDriver(d.id);
                const assignedVeh = vehicles.find(v => v.assignedDriverId === d.id);
                const veh = latestCheckout ? vehicles.find(v => v.id === latestCheckout.vehicleId) : assignedVeh;
                const odo = latestCheckout ? (latestCheckout.returnOdometer ?? latestCheckout.checkoutOdometer) : veh?.mileage;

                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleOpenQuickAddModal(d.id)}
                    className="p-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/80 rounded-xl text-right transition group flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold group-hover:bg-amber-500 group-hover:text-slate-950 transition shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-xs text-white group-hover:text-amber-300 transition truncate">{d.name}</p>
                        {veh ? (
                          <p className="text-[10px] text-slate-400 font-mono truncate">
                            {veh.make} {veh.model} ({veh.plateNumber})
                          </p>
                        ) : (
                          <p className="text-[10px] text-slate-500 italic">بدون رحلات سابقة</p>
                        )}
                      </div>
                    </div>

                    {odo !== undefined && (
                      <div className="text-left font-mono shrink-0 pl-1">
                        <span className="text-[9px] text-slate-400 block uppercase">Odometer</span>
                        <span className="text-[11px] font-extrabold text-amber-400">{odo.toLocaleString()} km</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs">
                    <th className="p-3 rounded-r-lg">السيارة واللوحة</th>
                    <th className="p-3">السائق / الموظف</th>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">قراءة العداد</th>
                    <th className="p-3">عدد اللترات</th>
                    <th className="p-3">سعر اللتر</th>
                    <th className="p-3">المبلغ الإجمالي</th>
                    <th className="p-3">اسم المحطة</th>
                    <th className="p-3">حالة الدفع</th>
                    <th className="p-3 rounded-l-lg">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {fuel.map(record => {
                    const vehicle = vehicles.find(v => v.id === record.vehicleId);
                    const driver = drivers.find(d => d.id === record.driverId);
                    const isPending = record.paymentStatus === 'pending';

                    return (
                      <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/40 transition">
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                          {vehicle ? `${vehicle.make} ${vehicle.model}` : 'مركبة'}
                          <span className="block text-xs font-normal text-slate-500">{vehicle?.plateNumber}</span>
                        </td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">{driver?.name || 'سائق'}</td>
                        <td className="p-3 text-xs font-mono">{record.date}</td>
                        <td className="p-3 text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                          {record.odometerReading ? `${record.odometerReading.toLocaleString()} كم` : '-'}
                        </td>
                        <td className="p-3 text-xs font-mono font-bold text-amber-600">{record.liters} لتر</td>
                        <td className="p-3 text-xs font-mono">{formatCurrency(record.costPerLiter, settings?.currency, isAr ? 'ar' : 'en')}</td>
                        <td className="p-3 text-xs font-mono font-bold text-emerald-600">{formatCurrency(record.totalCost, settings?.currency, isAr ? 'ar' : 'en')}</td>
                        <td className="p-3 text-xs text-slate-600 dark:text-slate-400">{record.stationName}</td>
                        <td className="p-3">
                          <button
                            onClick={() => toggleFuelStatus(record)}
                            title="انقر لتغيير حالة الدفع"
                            className={`px-2.5 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 ${
                              isPending
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 hover:bg-rose-200'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 hover:bg-emerald-200'
                            }`}
                          >
                            {isPending ? (
                              <>
                                <Clock className="w-3 h-3 text-rose-600" />
                                معلقة (آجل)
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                مدفوعة
                              </>
                            )}
                          </button>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => onDeleteFuel(record.id)}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. RENEWALS & OTHER EXPENSES TAB */}
      {activeTab === 'renewals' && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs">
                  <th className="p-3 rounded-r-lg">السيارة واللوحة</th>
                  <th className="p-3">نوع المصروف</th>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">المبلغ المدفوع</th>
                  <th className="p-3">رقم المرجع / الإيصال</th>
                  <th className="p-3">حالة الدفع</th>
                  <th className="p-3 rounded-l-lg">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {expenses.map(record => {
                  const vehicle = vehicles.find(v => v.id === record.vehicleId);
                  const isPending = record.paymentStatus === 'pending';

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/40 transition">
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                        {vehicle ? `${vehicle.make} ${vehicle.model}` : 'مركبة'}
                        <span className="block text-xs font-normal text-slate-500">{vehicle?.plateNumber}</span>
                      </td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{record.title}</td>
                      <td className="p-3 text-xs font-mono">{record.date}</td>
                      <td className="p-3 text-xs font-mono font-bold text-purple-600">{formatCurrency(record.amount, settings?.currency, isAr ? 'ar' : 'en')}</td>
                      <td className="p-3 text-xs font-mono text-slate-500">{record.receiptNumber || '-'}</td>
                      <td className="p-3">
                        <button
                          onClick={() => toggleExpenseStatus(record)}
                          title="انقر لتغيير حالة الدفع"
                          className={`px-2.5 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 ${
                            isPending
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 hover:bg-rose-200'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 hover:bg-emerald-200'
                          }`}
                        >
                          {isPending ? (
                            <>
                              <Clock className="w-3 h-3 text-rose-600" />
                              معلقة (آجل)
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              مدفوعة
                            </>
                          )}
                        </button>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => onDeleteExpense(record.id)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* 3. PENDING INVOICES & PAYABLES MANAGEMENT TAB */}
      {activeTab === 'pending_invoices' && (
        <div className="space-y-6">
          {/* Summary Cards Header */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                <span>إجمالي المستحقات المعلقة</span>
                <DollarSign className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400 font-mono">
                {formatCurrency(totalPendingAll, settings?.currency, isAr ? 'ar' : 'en')}
              </div>
              <p className="text-[11px] text-slate-400">{isAr ? `إجمالي ${totalPendingCount} فاتورة مستحقة الدفع` : `Total ${totalPendingCount} pending invoices`}</p>
            </div>

            <div className="bg-amber-50 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 p-5 rounded-2xl space-y-1">
              <div className="flex items-center justify-between text-amber-800 dark:text-amber-400 text-xs font-bold">
                <span>{isAr ? 'مستحقات محطات الوقود' : 'Gas Station Payables'}</span>
                <Fuel className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-amber-700 dark:text-amber-300 font-mono">
                {formatCurrency(totalPendingFuelAmount, settings?.currency, isAr ? 'ar' : 'en')}
              </div>
              <p className="text-[11px] text-amber-600 dark:text-amber-400">{isAr ? `${pendingFuel.length} تعبئة وقود بالآجل` : `${pendingFuel.length} pending fuel fills`}</p>
            </div>

            <div className="bg-rose-50 dark:bg-slate-800 border border-rose-200 dark:border-slate-700 p-5 rounded-2xl space-y-1">
              <div className="flex items-center justify-between text-rose-800 dark:text-rose-400 text-xs font-bold">
                <span>{isAr ? 'مستحقات الكراجات والورش' : 'Garage Payables'}</span>
                <Wrench className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-black text-rose-700 dark:text-rose-300 font-mono">
                {formatCurrency(totalPendingMaintenanceAmount, settings?.currency, isAr ? 'ar' : 'en')}
              </div>
              <p className="text-[11px] text-rose-600 dark:text-rose-400">{isAr ? `${pendingMaintenance.length} فاتورة صيانة معلقة` : `${pendingMaintenance.length} pending repair invoices`}</p>
            </div>

            <div className="bg-purple-50 dark:bg-slate-800 border border-purple-200 dark:border-slate-700 p-5 rounded-2xl space-y-1">
              <div className="flex items-center justify-between text-purple-800 dark:text-purple-400 text-xs font-bold">
                <span>{isAr ? 'رسوم وتجديدات معلقة' : 'Pending Fee Renewals'}</span>
                <Shield className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-purple-700 dark:text-purple-300 font-mono">
                {formatCurrency(totalPendingExpenseAmount, settings?.currency, isAr ? 'ar' : 'en')}
              </div>
              <p className="text-[11px] text-purple-600 dark:text-purple-400">{isAr ? `${pendingExpenses.length} إيصال رسوم غير مسدد` : `${pendingExpenses.length} unpaid renewal receipts`}</p>
            </div>
          </div>

          {/* Vendors Due Breakdown (Gas Stations & Garages) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gas Stations Outstanding Summary */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-amber-500" />
                  {isAr ? 'المبالغ المستحقة لكل محطة وقود' : 'Outstanding Balance per Gas Station'}
                </h3>
                <span className="text-xs font-semibold text-slate-500">{isAr ? `${stationsDue.length} محطة` : `${stationsDue.length} stations`}</span>
              </div>

              {stationsDue.length > 0 ? (
                <div className="space-y-2">
                  {stationsDue.map((st, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                      <div>
                        <span className="font-bold text-xs text-slate-900 dark:text-white block">{st.stationName}</span>
                        <span className="text-[11px] text-slate-500">{isAr ? `${st.count} تعبئة معلقة` : `${st.count} pending fills`}</span>
                      </div>
                      <div className="text-left font-mono font-black text-amber-600 dark:text-amber-400 text-sm">
                        {formatCurrency(st.totalAmount, settings?.currency, isAr ? 'ar' : 'en')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  {isAr ? 'لا توجد مستحقات معلقة لمحطات الوقود' : 'No pending balances for gas stations'}
                </div>
              )}
            </div>

            {/* Garages Outstanding Summary */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-rose-500" />
                  {isAr ? 'المبالغ المستحقة للكراجات والورش' : 'Outstanding Balance per Garage'}
                </h3>
                <span className="text-xs font-semibold text-slate-500">{isAr ? `${garagesDue.length} كراج/ورشة` : `${garagesDue.length} garages`}</span>
              </div>

              {garagesDue.length > 0 ? (
                <div className="space-y-2">
                  {garagesDue.map((g, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                      <div>
                        <span className="font-bold text-xs text-slate-900 dark:text-white block">{g.garageName}</span>
                        <span className="text-[11px] text-slate-500">
                          {isAr ? `${g.count} فاتورة صيانة ${g.phone ? `| هاتف: ${g.phone}` : ''}` : `${g.count} repair invoices ${g.phone ? `| Tel: ${g.phone}` : ''}`}
                        </span>
                      </div>
                      <div className="text-left font-mono font-black text-rose-600 dark:text-rose-400 text-sm">
                        {formatCurrency(g.totalAmount, settings?.currency, isAr ? 'ar' : 'en')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  {isAr ? 'لا توجد مستحقات معلقة للكراجات والورش' : 'No pending balances for garages'}
                </div>
              )}
            </div>
          </div>

          {/* Detailed Filterable Pending Invoices List */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-500" />
                  جدول سداد وتتبع الفواتير المعلقة
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">يمكنك تسديد الفاتورة مباشرة لتسجيلها كمدفوعة فوراً</p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setPendingCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    pendingCategoryFilter === 'all'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  الكل ({totalPendingCount})
                </button>
                <button
                  onClick={() => setPendingCategoryFilter('fuel')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    pendingCategoryFilter === 'fuel'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  الوقود ({pendingFuel.length})
                </button>
                <button
                  onClick={() => setPendingCategoryFilter('maintenance')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    pendingCategoryFilter === 'maintenance'
                      ? 'bg-rose-500 text-white font-bold shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  الصيانة ({pendingMaintenance.length})
                </button>
                <button
                  onClick={() => setPendingCategoryFilter('expenses')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    pendingCategoryFilter === 'expenses'
                      ? 'bg-purple-600 text-white font-bold shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  التجديدات ({pendingExpenses.length})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {allPendingList.length > 0 ? (
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs">
                      <th className="p-3 rounded-r-lg">النوع</th>
                      <th className="p-3">الجهة / المورد</th>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">السيارة واللوحة</th>
                      <th className="p-3">البيان / الوصف</th>
                      <th className="p-3">المبلغ المستحق</th>
                      <th className="p-3 rounded-l-lg text-center">الإجراء (السداد)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {allPendingList.map((item) => {
                      const veh = vehicles.find(v => v.id === item.vehicleId);

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/40 transition">
                          <td className="p-3">
                            {item.category === 'fuel' && (
                              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                                وقود
                              </span>
                            )}
                            {item.category === 'maintenance' && (
                              <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold">
                                صيانة
                              </span>
                            )}
                            {item.category === 'expenses' && (
                              <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold">
                                تجديدات
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white">
                            {item.vendorName}
                          </td>
                          <td className="p-3 text-xs font-mono">{item.date}</td>
                          <td className="p-3">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                              {veh ? `${veh.make} ${veh.model}` : 'مركبة'}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">{veh?.plateNumber}</span>
                          </td>
                          <td className="p-3 text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate">
                            {item.description}
                          </td>
                          <td className="p-3 text-sm font-mono font-black text-rose-600 dark:text-rose-400">
                            {formatCurrency(item.amount, settings?.currency, isAr ? 'ar' : 'en')}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => {
                                if (item.category === 'fuel') toggleFuelStatus(item.originalRecord);
                                if (item.category === 'maintenance') toggleMaintenanceStatus(item.originalRecord);
                                if (item.category === 'expenses') toggleExpenseStatus(item.originalRecord);
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow transition flex items-center gap-1.5 mx-auto"
                            >
                              <Check className="w-3.5 h-3.5" />
                              تسجيل كمدفوعة
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-10 text-slate-400 text-sm">
                  جميع الفواتير تسلّمت وسُدّدت بنجاح! لا توجد فواتير معلقة لهذه الفئة.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE FUEL MODAL */}
      {showFuelModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Fuel className="w-5 h-5 text-amber-500" />
                {isAr ? 'تسجيل تعبئة وقود جديدة' : 'Add New Fuel Log'}
              </h3>
              <button onClick={() => setShowFuelModal(false)} className="text-slate-400 font-bold text-lg">✕</button>
            </div>

            {/* Quick Auto-Fill Banner */}
            {autoFilledCheckout && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800/80 rounded-xl text-amber-950 dark:text-amber-200 text-xs space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold flex items-center gap-1.5 text-amber-900 dark:text-amber-300">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
                    {autoFilledCheckout.source === 'checkout'
                      ? (isAr ? `تم التعبئة التلقائية من إيصال الخروج/الاستلام #${autoFilledCheckout.sessionId}` : `Auto-filled from Checkout Record #${autoFilledCheckout.sessionId}`)
                      : (isAr ? 'تم التعبئة التلقائية من ملف المركبة المسندة' : 'Pre-filled from assigned vehicle profile')
                    }
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (fuelDriverId) handleDriverChangeInModal(fuelDriverId);
                    }}
                    className="text-[10px] font-mono underline hover:text-amber-600 flex items-center gap-1 shrink-0"
                  >
                    <RotateCcw className="w-3 h-3" />
                    {isAr ? 'إعادة التطبيق' : 'Re-apply'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-amber-200/90 leading-relaxed">
                  {isAr
                    ? `تم اختيار المركبة (${autoFilledCheckout.vehicleName} - ${autoFilledCheckout.plateNumber}) وقراءة العداد (${autoFilledCheckout.odometer?.toLocaleString()} كم) تلقائياً للسائق ${autoFilledCheckout.driverName}.`
                    : `Pre-populated vehicle (${autoFilledCheckout.vehicleName} - ${autoFilledCheckout.plateNumber}) and odometer reading (${autoFilledCheckout.odometer?.toLocaleString()} km) for driver ${autoFilledCheckout.driverName}.`
                  }
                </p>
              </div>
            )}

            <form onSubmit={handleCreateFuel} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>{isAr ? 'السائق / الموظف *' : 'Driver / Employee *'}</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {isAr ? 'يحدد السيارة والعداد تلقائياً' : 'Auto-selects vehicle'}
                  </span>
                </label>
                <select
                  required
                  value={fuelDriverId}
                  onChange={e => handleDriverChangeInModal(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 font-medium"
                >
                  <option value="">-- {isAr ? 'اختر السائق' : 'Select Driver'} --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'اختر السيارة *' : 'Select Vehicle *'}</label>
                <select
                  required
                  value={fuelVehicleId}
                  onChange={e => {
                    setFuelVehicleId(e.target.value);
                    const v = vehicles.find(veh => veh.id === e.target.value);
                    if (v) setFuelOdometer(v.mileage);
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900"
                >
                  <option value="">-- {isAr ? 'اختر السيارة' : 'Select Vehicle'} --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.make} {v.model} - {v.plateNumber}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>{isAr ? 'قراءة العداد الحالية (كم) *' : 'Odometer Reading (km) *'}</span>
                  {autoFilledCheckout && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                      ✓ {isAr ? 'تم السحب من الإيصال' : 'Loaded from checkout'}
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  required
                  value={fuelOdometer}
                  onChange={e => setFuelOdometer(Number(e.target.value))}
                  placeholder="e.g. 84250"
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'عدد اللترات' : 'Liters'}</label>
                  <input
                    type="number"
                    value={fuelLiters}
                    onChange={e => handleLitersOrRateChange(Number(e.target.value), fuelCostPerLiter)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? `سعر اللتر (${getCurrencySymbol(settings?.currency, 'ar')})` : `Cost/Liter (${getCurrencySymbol(settings?.currency, 'en')})`}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={fuelCostPerLiter}
                    onChange={e => handleLitersOrRateChange(fuelLiters, Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl flex items-center justify-between font-bold text-amber-900 dark:text-amber-200 text-sm border border-amber-200 dark:border-amber-800/40">
                <span>{isAr ? 'المبلغ الإجمالي:' : 'Total Amount:'}</span>
                <span className="font-mono text-lg">{formatCurrency(fuelTotalCost, settings?.currency, isAr ? 'ar' : 'en')}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'اسم المحطة' : 'Station Name'}</label>
                <input
                  type="text"
                  value={fuelStation}
                  onChange={e => setFuelStation(e.target.value)}
                  placeholder="محطة الدريس / ساسكو..."
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'حالة الدفع *' : 'Payment Status *'}</label>
                <select
                  value={fuelPaymentStatus}
                  onChange={e => setFuelPaymentStatus(e.target.value as 'paid' | 'pending')}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 font-bold"
                >
                  <option value="paid">{isAr ? 'مدفوعة نقداً / بطاقة' : 'Paid (Cash / Card)'}</option>
                  <option value="pending">{isAr ? 'معلقة (حساب آجل مع المحطة)' : 'Pending (Station Account)'}</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowFuelModal(false)} className="px-3 py-1.5 border rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300">
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow transition flex items-center gap-1.5">
                  <Fuel className="w-3.5 h-3.5" />
                  {isAr ? 'حفظ التعبئة' : 'Save Fuel Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE EXPENSE MODAL */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                تسجيل مصروف تجديد / رسوم
              </h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">اختر السيارة *</label>
                <select
                  required
                  value={expVehicleId}
                  onChange={e => setExpVehicleId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900"
                >
                  <option value="">-- اختر السيارة --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.make} {v.model} - {v.plateNumber}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">نوع الرسوم</label>
                <select
                  value={expType}
                  onChange={e => {
                    const val = e.target.value as any;
                    setExpType(val);
                    if (val === 'registration_renewal') setExpTitle('تجديد استمارة السيارة');
                    if (val === 'insurance_renewal') setExpTitle('تأمين الشامل / ضد الغير');
                    if (val === 'fines') setExpTitle('مخالفة مرورية');
                    if (val === 'inspection') setExpTitle('فحص دوري للمركبة');
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900"
                >
                  <option value="registration_renewal">تجديد استمارة / رخصة سير</option>
                  <option value="insurance_renewal">وثيقة تأمين</option>
                  <option value="fines">مخالفات مرورية</option>
                  <option value="inspection">رسوم الفحص الدوري</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? `المبلغ (${getCurrencySymbol(settings?.currency, 'ar')}) *` : `Amount (${getCurrencySymbol(settings?.currency, 'en')}) *`}
                </label>
                <input
                  type="number"
                  required
                  value={expAmount}
                  onChange={e => setExpAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">حالة الدفع *</label>
                <select
                  value={expPaymentStatus}
                  onChange={e => setExpPaymentStatus(e.target.value as 'paid' | 'pending')}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 font-bold"
                >
                  <option value="paid">مدفوعة نقداً / سداد</option>
                  <option value="pending">معلقة / تحت التسديد</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="px-3 py-1.5 border rounded text-xs font-bold">
                  إلغاء
                </button>
                <button type="submit" className="px-4 py-1.5 bg-purple-600 text-white font-bold rounded text-xs shadow">
                  حفظ المصروف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
