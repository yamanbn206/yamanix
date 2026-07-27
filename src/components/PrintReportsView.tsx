import React, { useState, useMemo, useEffect } from 'react';
import { CompanySettings, Vehicle, Driver, MaintenanceRecord, FuelRecord, CheckoutSession } from '../types';
import { formatCurrency, getCurrencySymbol } from '../lib/currency';
import { Printer, FileText, CheckCircle2, Building2, Wrench, Fuel, Car, Calendar, ShieldCheck, Download, FileSpreadsheet, Eye, Filter, X, User, RotateCcw, Maximize2, Minimize2, AlertTriangle, BarChart3, Activity, Sparkles, TrendingDown, Loader2, Copy, Check, DollarSign, Lightbulb, Zap, BrainCircuit, Sliders, Settings, Layout, Edit3, Save, Image, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { exportVehiclesToCSV, exportMaintenanceToCSV, exportFuelToCSV, exportDriversToCSV, exportCheckoutsToCSV } from '../lib/csvExport';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface PrintReportsViewProps {
  settings: CompanySettings;
  vehicles: Vehicle[];
  drivers: Driver[];
  maintenance: MaintenanceRecord[];
  fuel: FuelRecord[];
  checkouts: CheckoutSession[];
  activeReceiptSession?: CheckoutSession | null;
  onClearReceiptSession?: () => void;
  onSaveSettings?: (newSettings: CompanySettings) => void;
  lang?: 'ar' | 'en';
}

// جميع النصوص في التقارير ستكون باللغة الإنجليزية فقط
const REPORT_LANG = 'en';

export const PrintReportsView: React.FC<PrintReportsViewProps> = ({
  settings,
  vehicles,
  drivers,
  maintenance,
  fuel,
  checkouts,
  activeReceiptSession,
  onClearReceiptSession,
  onSaveSettings,
  lang = REPORT_LANG
}) => {
  const [reportType, setReportType] = useState<'checkout_receipt' | 'fleet_summary' | 'maintenance_audit' | 'expiries_audit' | 'fuel_summary' | 'ai_cost_summary'>(
    activeReceiptSession ? 'checkout_receipt' : 'fleet_summary'
  );

  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    activeReceiptSession ? activeReceiptSession.id : (checkouts[0]?.id || '')
  );

  // Filter States
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('all');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  // 3-Month Metrics
  const ninetyDaysAgoStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return d.toISOString().slice(0, 10);
  }, []);

  const recent3Maint = useMemo(() => {
    return maintenance.filter(m => m.date && m.date >= ninetyDaysAgoStr);
  }, [maintenance, ninetyDaysAgoStr]);

  const recent3Fuel = useMemo(() => {
    return fuel.filter(f => f.date && f.date >= ninetyDaysAgoStr);
  }, [fuel, ninetyDaysAgoStr]);

  const recent3MaintCost = useMemo(() => {
    return recent3Maint.reduce((sum, m) => sum + (Number(m.totalCost) || 0), 0);
  }, [recent3Maint]);

  const recent3FuelCost = useMemo(() => {
    return recent3Fuel.reduce((sum, f) => sum + (Number(f.totalCost) || 0), 0);
  }, [recent3Fuel]);

  const total3mExpense = recent3MaintCost + recent3FuelCost;

  const handleRunAiExpenseSummary = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const res = await fetch('/api/ai-expense-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicles,
          maintenance,
          fuel,
          drivers,
          lang: 'en'
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to generate AI analysis report.');
      }
      setAiSummary(data.summary);
    } catch (err: any) {
      console.error("AI Expense Analysis Error:", err);
      setAnalysisError(err.message || 'Error connecting to AI service.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopySummary = () => {
    if (!aiSummary) return;
    navigator.clipboard.writeText(aiSummary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedDriverId('all');
    setSelectedVehicleId('all');
  };

  const hasActiveFilters = startDate !== '' || endDate !== '' || selectedDriverId !== 'all' || selectedVehicleId !== 'all';

  // Filtered Data
  const filteredCheckouts = useMemo(() => {
    return checkouts.filter(c => {
      const dateVal = c.checkoutTime.slice(0, 10);
      const matchesStart = !startDate || dateVal >= startDate;
      const matchesEnd = !endDate || dateVal <= endDate;
      const matchesDriver = selectedDriverId === 'all' || c.driverId === selectedDriverId;
      const matchesVehicle = selectedVehicleId === 'all' || c.vehicleId === selectedVehicleId;
      return matchesStart && matchesEnd && matchesDriver && matchesVehicle;
    });
  }, [checkouts, startDate, endDate, selectedDriverId, selectedVehicleId]);

  const filteredMaintenance = useMemo(() => {
    return maintenance.filter(m => {
      const dateVal = m.date;
      const matchesStart = !startDate || dateVal >= startDate;
      const matchesEnd = !endDate || dateVal <= endDate;
      const matchesVehicle = selectedVehicleId === 'all' || m.vehicleId === selectedVehicleId;
      
      let matchesDriver = true;
      if (selectedDriverId !== 'all') {
        const veh = vehicles.find(v => v.id === m.vehicleId);
        matchesDriver = veh?.assignedDriverId === selectedDriverId;
      }
      return matchesStart && matchesEnd && matchesVehicle && matchesDriver;
    });
  }, [maintenance, startDate, endDate, selectedVehicleId, selectedDriverId, vehicles]);

  const filteredFuel = useMemo(() => {
    return fuel.filter(f => {
      const dateVal = f.date;
      const matchesStart = !startDate || dateVal >= startDate;
      const matchesEnd = !endDate || dateVal <= endDate;
      const matchesDriver = selectedDriverId === 'all' || f.driverId === selectedDriverId;
      const matchesVehicle = selectedVehicleId === 'all' || f.vehicleId === selectedVehicleId;
      return matchesStart && matchesEnd && matchesDriver && matchesVehicle;
    });
  }, [fuel, startDate, endDate, selectedDriverId, selectedVehicleId]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchesVehicle = selectedVehicleId === 'all' || v.id === selectedVehicleId;
      const matchesDriver = selectedDriverId === 'all' || v.assignedDriverId === selectedDriverId;
      return matchesVehicle && matchesDriver;
    });
  }, [vehicles, selectedVehicleId, selectedDriverId]);

  const selectedSession = filteredCheckouts.find(c => c.id === selectedSessionId) || checkouts.find(c => c.id === selectedSessionId) || activeReceiptSession || filteredCheckouts[0] || checkouts[0];

  const handleExportCSV = () => {
    if (reportType === 'fleet_summary') exportVehiclesToCSV(filteredVehicles, drivers);
    else if (reportType === 'maintenance_audit') exportMaintenanceToCSV(filteredMaintenance, vehicles);
    else if (reportType === 'fuel_summary') exportFuelToCSV(filteredFuel, vehicles, drivers);
    else if (reportType === 'checkout_receipt') exportCheckoutsToCSV(filteredCheckouts, vehicles, drivers);
    else exportVehiclesToCSV(filteredVehicles, drivers);
  };

  // Reusable Header Renderer (all in English)
  const renderHeader = () => {
    const company = settings.companyName || 'Company';
    const tagline = settings.tagline || '';
    const logo = settings.logoUrl || '';
    const phone = settings.phone || '';
    const email = settings.email || '';
    const address = settings.address || '';
    const cr = settings.commercialRegNumber || '';

    return (
      <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {logo ? (
            <img src={logo} alt="Logo" className="max-h-16 max-w-[120px] object-contain border p-1 rounded" />
          ) : (
            <div className="w-12 h-12 bg-slate-900 text-white font-bold rounded flex items-center justify-center text-xl">
              {company.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-xl font-black text-slate-900">{company}</h1>
            {tagline && <p className="text-xs text-slate-600 font-medium">{tagline}</p>}
            {cr && <p className="text-[10px] text-slate-500 font-mono mt-0.5">CR/Tax ID: {cr}</p>}
          </div>
        </div>

        <div className="text-right text-xs text-slate-600 space-y-0.5 font-mono">
          <p><strong>Print Date:</strong> {new Date().toLocaleDateString('en-US')}</p>
          {phone && <p><strong>Phone:</strong> {phone}</p>}
          {email && <p><strong>Email:</strong> {email}</p>}
          {address && <p className="text-[10px] text-slate-400">{address}</p>}
        </div>
      </div>
    );
  };

  const renderReportContent = () => {
    return (
      <div className="printable-document bg-white text-slate-900 border border-slate-300 rounded-2xl p-8 shadow-lg max-w-4xl mx-auto space-y-6 dir-ltr text-left">
        {renderHeader()}

        {settings.printHeaderNote && (
          <div className="bg-slate-50 p-2.5 text-center text-xs text-slate-700 border border-slate-200 rounded">
            <p className="italic">"{settings.printHeaderNote}"</p>
          </div>
        )}

        {reportType === 'checkout_receipt' && selectedSession && (
          <div className="space-y-6">
            <div className="text-center border-b pb-2 border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide">VEHICLE HANDOVER & CHECKOUT RECEIPT</h2>
              <p className="text-xs text-slate-500 font-mono">Receipt Reference No: {selectedSession.id}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 border p-4 rounded-xl bg-slate-50/50 text-xs">
              <div>
                <p className="font-bold text-sm text-slate-900 mb-2 border-b pb-1">Vehicle Specifications:</p>
                {(() => {
                  const v = vehicles.find(veh => veh.id === selectedSession.vehicleId);
                  return (
                    <div className="space-y-1">
                      <p><strong>Vehicle:</strong> {v?.make} {v?.model} ({v?.year})</p>
                      <p><strong>Plate Number:</strong> <span className="font-bold font-mono">{v?.plateNumber}</span></p>
                      <p><strong>Fuel Type:</strong> {v?.fuelType}</p>
                      <p><strong>Insurance Company:</strong> {v?.insuranceCompany}</p>
                    </div>
                  );
                })()}
              </div>

              <div>
                <p className="font-bold text-sm text-slate-900 mb-2 border-b pb-1">Driver / Custodian Details:</p>
                {(() => {
                  const d = drivers.find(drv => drv.id === selectedSession.driverId);
                  return (
                    <div className="space-y-1">
                      <p><strong>Name:</strong> {d?.name}</p>
                      <p><strong>Phone:</strong> <span className="font-mono">{d?.phone}</span></p>
                      <p><strong>Department:</strong> {d?.department}</p>
                      <p><strong>License No:</strong> {d?.licenseNumber} ({d?.licenseCategory})</p>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="border p-4 rounded-xl text-xs space-y-3">
              <p className="font-bold border-b pb-1">Handover Purpose & Parameters:</p>
              <div className="grid grid-cols-3 gap-2 font-mono">
                <div>
                  <span className="text-slate-500 block">Purpose:</span>
                  <span className="font-bold">{selectedSession.purposeCustom || selectedSession.purpose}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Checkout Time:</span>
                  <span>{new Date(selectedSession.checkoutTime).toLocaleString('en-US')}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Checkout Odometer:</span>
                  <span className="font-bold text-blue-600">{selectedSession.checkoutOdometer.toLocaleString()} km</span>
                </div>
              </div>

              {selectedSession.checkoutChecklist && (
                <div className="pt-2 border-t text-[11px] space-y-1 bg-slate-50 p-2.5 rounded-lg border-slate-200">
                  <p className="font-bold text-slate-800 flex items-center justify-between">
                    <span>Vehicle Condition Checklist at Handover:</span>
                    <span className="text-emerald-700 font-mono font-bold">
                      ({Object.values(selectedSession.checkoutChecklist).filter(Boolean).length} / 6 Verified)
                    </span>
                  </p>
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-700">
                    <p>• Body Condition: {selectedSession.checkoutChecklist.noScratches ? '✓ OK / Clean' : '✕ Scratches/Dents'}</p>
                    <p>• Spare Tire & Jack: {selectedSession.checkoutChecklist.spareTire ? '✓ Present' : '✕ Missing'}</p>
                    <p>• Fire Extinguisher: {selectedSession.checkoutChecklist.fireExtinguisher ? '✓ Present' : '✕ Missing'}</p>
                    <p>• Warning Triangle: {selectedSession.checkoutChecklist.warningTriangle ? '✓ Present' : '✕ Missing'}</p>
                    <p>• Registration Card: {selectedSession.checkoutChecklist.registrationDoc ? '✓ Present' : '✕ Missing'}</p>
                    <p>• Cleanliness: {selectedSession.checkoutChecklist.cleanliness ? '✓ Clean' : '✕ Needs Wash'}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-300 text-xs">
              <div className="text-center space-y-2 border p-3 rounded-xl">
                <p className="font-bold text-slate-900">Driver / Custodian Signature:</p>
                {selectedSession.checkoutSignature ? (
                  <img src={selectedSession.checkoutSignature} alt="Checkout Signature" className="max-h-16 mx-auto object-contain" />
                ) : (
                  <div className="h-12 flex items-center justify-center text-slate-400 italic">Not Signed</div>
                )}
                <p className="text-[10px] text-slate-500">I acknowledge receiving the vehicle in sound condition.</p>
              </div>

              <div className="text-center space-y-2 border p-3 rounded-xl">
                <p className="font-bold text-slate-900">Fleet Operations Manager Authorization:</p>
                {selectedSession.returnSignature ? (
                  <img src={selectedSession.returnSignature} alt="Return Signature" className="max-h-16 mx-auto object-contain" />
                ) : (
                  <div className="h-12 flex items-center justify-center text-slate-400 italic">Approved & Handed Over</div>
                )}
                <p className="text-[10px] text-slate-500">Official Fleet Records Validation</p>
              </div>
            </div>
          </div>
        )}

        {reportType === 'fleet_summary' && (
          <div className="space-y-4">
            <div className="text-center border-b pb-2 border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide">FLEET VEHICLES SUMMARY REPORT</h2>
              <p className="text-xs text-slate-500 font-mono">Total Vehicles Listed: {filteredVehicles.length}</p>
            </div>

            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 border-b">
                <tr>
                  <th className="p-2 border-r">#</th>
                  <th className="p-2 border-r">Make & Model</th>
                  <th className="p-2 border-r">Plate Number</th>
                  <th className="p-2 border-r">Assigned Driver</th>
                  <th className="p-2 border-r">Odometer</th>
                  <th className="p-2 border-r">Registration Expiry</th>
                  <th className="p-2 border-r">Insurance Expiry</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredVehicles.map((v, i) => {
                  const assignedDriver = drivers.find(d => d.id === v.assignedDriverId);
                  return (
                    <tr key={v.id}>
                      <td className="p-2 border-r font-bold">{i + 1}</td>
                      <td className="p-2 border-r font-bold">{v.make} {v.model}</td>
                      <td className="p-2 border-r font-mono font-bold">{v.plateNumber}</td>
                      <td className="p-2 border-r">{assignedDriver ? assignedDriver.name : 'Unassigned'}</td>
                      <td className="p-2 border-r font-mono">{v.mileage.toLocaleString()} km</td>
                      <td className="p-2 border-r font-mono">{v.licenseExpiryDate}</td>
                      <td className="p-2 border-r font-mono">{v.insuranceExpiryDate}</td>
                      <td className="p-2 font-bold capitalize">{v.status.replace('_', ' ')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'maintenance_audit' && (
          <div className="space-y-6">
            <div className="text-center border-b pb-3 border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide">MAINTENANCE EXPENSE & REPAIR AUDIT REPORT</h2>
              <p className="text-xs text-slate-500">Invoices Analyzed: {filteredMaintenance.length}</p>
            </div>

            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 border-b">
                <tr>
                  <th className="p-2 border-r">Date</th>
                  <th className="p-2 border-r">Vehicle & Plate</th>
                  <th className="p-2 border-r">Maintenance Type</th>
                  <th className="p-2 border-r">Description</th>
                  <th className="p-2 border-r">Parts Replaced</th>
                  <th className="p-2 font-bold">Cost ({getCurrencySymbol(settings.currency, 'en')})</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredMaintenance.map((m) => {
                  const v = vehicles.find(veh => veh.id === m.vehicleId);
                  const isPeriodic = m.type === 'periodic';
                  return (
                    <tr key={m.id}>
                      <td className="p-2 border-r font-mono">{m.date}</td>
                      <td className="p-2 border-r font-bold">{v?.make} {v?.model} ({v?.plateNumber})</td>
                      <td className="p-2 border-r">
                        {isPeriodic ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Periodic Service</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">Emergency Repair</span>
                        )}
                      </td>
                      <td className="p-2 border-r">{m.description}</td>
                      <td className="p-2 border-r">
                        {m.parts?.map(p => `${p.partName} (${p.quantity})`).join(', ') || 'None'}
                      </td>
                      <td className="p-2 font-bold font-mono text-slate-900">{formatCurrency(m.totalCost, settings.currency, 'en')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'fuel_summary' && (
          <div className="space-y-4">
            <div className="text-center border-b pb-2 border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide">FUEL EXPENSES & REFUELING AUDIT REPORT</h2>
              <p className="text-xs text-slate-500 font-mono">Total Refueling Transactions: {filteredFuel.length}</p>
            </div>

            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 border-b">
                <tr>
                  <th className="p-2 border-r">Date</th>
                  <th className="p-2 border-r">Vehicle & Plate</th>
                  <th className="p-2 border-r">Driver</th>
                  <th className="p-2 border-r">Fuel Station</th>
                  <th className="p-2 border-r">Liters</th>
                  <th className="p-2 border-r">Odometer</th>
                  <th className="p-2 font-bold">Total Cost ({getCurrencySymbol(settings.currency, 'en')})</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredFuel.map((f) => {
                  const v = vehicles.find(veh => veh.id === f.vehicleId);
                  const d = drivers.find(drv => drv.id === f.driverId);
                  return (
                    <tr key={f.id}>
                      <td className="p-2 border-r font-mono">{f.date}</td>
                      <td className="p-2 border-r font-bold">{v?.make} {v?.model} ({v?.plateNumber})</td>
                      <td className="p-2 border-r">{d?.name || 'General Driver'}</td>
                      <td className="p-2 border-r">{f.stationName || 'Fuel Station'}</td>
                      <td className="p-2 border-r font-mono">{f.liters} L</td>
                      <td className="p-2 border-r font-mono">{f.odometerReading.toLocaleString()} km</td>
                      <td className="p-2 font-bold font-mono text-amber-600">{formatCurrency(f.totalCost, settings.currency, 'en')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'expiries_audit' && (
          <div className="space-y-4">
            <div className="text-center border-b pb-2 border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide">FLEET EXPIRIES & COMPLIANCE REPORT</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="border p-3 rounded">
                <p className="font-bold border-b pb-1 mb-2">Vehicle Registration & Insurance Expiries:</p>
                {filteredVehicles.map(v => (
                  <div key={v.id} className="py-1 border-b border-dashed space-y-0.5">
                    <div className="flex justify-between font-bold">
                      <span>{v.make} {v.model} ({v.plateNumber})</span>
                      <span className="font-mono text-rose-600">Reg: {v.licenseExpiryDate}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 flex justify-between font-mono">
                      <span>Ins ({v.insuranceCompany})</span>
                      <span>Ins Exp: {v.insuranceExpiryDate}</span>
                    </p>
                  </div>
                ))}
              </div>

              <div className="border p-3 rounded">
                <p className="font-bold border-b pb-1 mb-2">Driver License Expiries:</p>
                {drivers.map(d => (
                  <div key={d.id} className="py-1.5 border-b border-dashed flex justify-between items-center font-mono">
                    <span>{d.name} ({d.licenseCategory})</span>
                    <span className="font-bold text-blue-600">Exp: {d.licenseExpiryDate}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {reportType === 'ai_cost_summary' && (
          <div className="space-y-5">
            <div className="text-center border-b pb-3 border-slate-200">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                AI-Powered Cost-Optimization Report
              </div>
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide">
                3-MONTH VEHICLE EXPENSE & COST-SAVING OPPORTUNITIES
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Analysis Window: Last 90 Days (Since {ninetyDaysAgoStr})
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono">
              <div className="border-r border-slate-200 pr-2">
                <span className="text-slate-500 block text-[10px]">3M Maintenance Spend</span>
                <span className="font-extrabold text-blue-700 text-sm">{formatCurrency(recent3MaintCost, settings.currency, 'en')}</span>
                <span className="text-[10px] text-slate-400 block">{recent3Maint.length} service logs</span>
              </div>
              <div className="border-r border-slate-200 pr-2">
                <span className="text-slate-500 block text-[10px]">3M Fuel Spend</span>
                <span className="font-extrabold text-amber-600 text-sm">{formatCurrency(recent3FuelCost, settings.currency, 'en')}</span>
                <span className="text-[10px] text-slate-400 block">{recent3Fuel.length} fuel logs</span>
              </div>
              <div className="border-r border-slate-200 pr-2">
                <span className="text-slate-500 block text-[10px]">Total 3M Expenses</span>
                <span className="font-black text-emerald-700 text-sm">{formatCurrency(total3mExpense, settings.currency, 'en')}</span>
                <span className="text-[10px] text-slate-400 block">Combined Total</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Fleet Analyzed</span>
                <span className="font-extrabold text-slate-800 text-sm">{vehicles.length} Vehicles</span>
                <span className="text-[10px] text-slate-400 block">{drivers.length} Drivers</span>
              </div>
            </div>

            {isAnalyzing ? (
              <div className="p-8 text-center space-y-3 bg-blue-50/50 rounded-xl border border-blue-200">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                <p className="text-xs font-bold text-blue-900">
                  Analyzing last 3 months of vehicle maintenance, fuel logs, and spare parts...
                </p>
              </div>
            ) : analysisError ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
                <p><strong>Analysis Error:</strong> {analysisError}</p>
                <button onClick={handleRunAiExpenseSummary} className="px-3 py-1.5 bg-rose-600 text-white rounded font-bold hover:bg-rose-700 transition">Retry</button>
              </div>
            ) : aiSummary ? (
              <div className="space-y-4">
                <div className="flex justify-end gap-2 no-print">
                  <button onClick={handleCopySummary} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-xs transition flex items-center gap-1.5">
                    {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedSummary ? 'Copied!' : 'Copy Summary'}
                  </button>
                  <button onClick={handleRunAiExpenseSummary} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5" /> Re-Analyze
                  </button>
                </div>
                <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3 text-xs leading-relaxed text-slate-800 dir-ltr text-left whitespace-pre-wrap">
                  {aiSummary}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center space-y-4 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl border border-blue-200">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Generate AI Cost-Saving Analysis Report</h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                    Analyze the last 90 days of vehicle repair bills, fuel refill logs, and driver breakdown frequencies.
                  </p>
                </div>
                <button onClick={handleRunAiExpenseSummary} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs shadow-md transition inline-flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Generate 3-Month AI Analysis
                </button>
              </div>
            )}
          </div>
        )}

        <div className="border-t border-slate-300 pt-4 text-center text-[10px] text-slate-500 font-mono">
          <p>{settings.printFooterNote || `${settings.companyName} • Official Fleet Management Report`}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Printer className="w-6 h-6 text-blue-400" />
            Print Reports & Receipts Generator
            <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-mono rounded-full font-bold">EN Standard Output</span>
          </h2>
          <p className="text-slate-300 text-xs mt-1">Generate and export official handover receipts, fleet summaries, and cost audits.</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow transition flex items-center gap-1.5">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={handlePrint} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-xs shadow-md transition flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print / PDF Export
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-sm flex flex-wrap gap-2">
        <button onClick={() => setReportType('ai_cost_summary')} className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${reportType === 'ai_cost_summary' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm ring-2 ring-emerald-400/30' : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50'}`}>
          <Sparkles className="w-4 h-4 text-emerald-500" /> AI 3M Cost Report
        </button>
        <button onClick={() => setReportType('checkout_receipt')} className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${reportType === 'checkout_receipt' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
          <FileText className="w-4 h-4" /> Checkout Receipt
        </button>
        <button onClick={() => setReportType('fleet_summary')} className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${reportType === 'fleet_summary' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
          <Car className="w-4 h-4" /> Fleet Summary
        </button>
        <button onClick={() => setReportType('maintenance_audit')} className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${reportType === 'maintenance_audit' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
          <Wrench className="w-4 h-4" /> Maintenance Audit
        </button>
        <button onClick={() => setReportType('fuel_summary')} className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${reportType === 'fuel_summary' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
          <Fuel className="w-4 h-4" /> Fuel Report
        </button>
        <button onClick={() => setReportType('expiries_audit')} className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${reportType === 'expiries_audit' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
          <ShieldCheck className="w-4 h-4" /> Expiries Audit
        </button>
      </div>

      {reportType === 'checkout_receipt' && (
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" /> Select Handover Receipt Session:
          </span>
          <select value={selectedSessionId} onChange={e => setSelectedSessionId(e.target.value)} className="px-3 py-2 border rounded-xl bg-white dark:bg-slate-800 border-blue-300 dark:border-blue-700 font-bold text-xs w-full sm:w-auto">
            {checkouts.map(c => {
              const v = vehicles.find(veh => veh.id === c.vehicleId);
              const d = drivers.find(drv => drv.id === c.driverId);
              return <option key={c.id} value={c.id}>Receipt #{c.id} - {v?.make} {v?.plateNumber} ({d?.name})</option>;
            })}
          </select>
        </div>
      )}

      <div className="bg-slate-100 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        {renderReportContent()}
      </div>
    </div>
  );
};