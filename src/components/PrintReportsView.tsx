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
  lang = 'en'
}) => {
  const [reportType, setReportType] = useState<'checkout_receipt' | 'fleet_summary' | 'maintenance_audit' | 'expiries_audit' | 'fuel_summary' | 'ai_cost_summary'>(
    activeReceiptSession ? 'checkout_receipt' : 'fleet_summary'
  );

  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    activeReceiptSession ? activeReceiptSession.id : (checkouts[0]?.id || '')
  );

  // Header Customization State
  const [headerStyle, setHeaderStyle] = useState<'classic' | 'centered' | 'enterprise'>('classic');
  const [customReportTitle, setCustomReportTitle] = useState<string>('');
  const [customHeaderNote, setCustomHeaderNote] = useState<string>('');
  const [showLogo, setShowLogo] = useState<boolean>(true);
  const [showTagline, setShowTagline] = useState<boolean>(true);
  const [showContacts, setShowContacts] = useState<boolean>(true);
  const [showTaxReg, setShowTaxReg] = useState<boolean>(true);
  const [showPrintDate, setShowPrintDate] = useState<boolean>(true);
  const [showHeaderNote, setShowHeaderNote] = useState<boolean>(true);

  // Header Customization UI Toggles
  const [showCustomizePanel, setShowCustomizePanel] = useState<boolean>(false);
  const [isEditingCompanyInfo, setIsEditingCompanyInfo] = useState<boolean>(false);

  // Editable copy of Company Settings for live header tuning
  const [localSettings, setLocalSettings] = useState<CompanySettings>({ ...settings });
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    setLocalSettings({ ...settings });
  }, [settings]);

  const handleSaveCompanyInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveSettings) {
      onSaveSettings(localSettings);
    }
    setSettingsSavedSuccess(true);
    setTimeout(() => setSettingsSavedSuccess(false), 3000);
  };

  // Filter States
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('all');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');

  // Preview Modal & Focus Mode States
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [focusMode, setFocusMode] = useState<boolean>(false);

  // AI 3-Month Expense Analysis States
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiStats, setAiStats] = useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  // Compute 3-Month Metrics for UI
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
      setAiStats(data.stats);
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

  // Filter Data Dynamically
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

  // Comparative Maintenance Data Preparation
  const maintenanceComparisonData = useMemo(() => {
    return filteredVehicles.map(v => {
      const vMaint = filteredMaintenance.filter(m => m.vehicleId === v.id);
      const periodicCost = vMaint.filter(m => m.type === 'periodic').reduce((sum, m) => sum + m.totalCost, 0);
      const breakdownCost = vMaint.filter(m => m.type !== 'periodic').reduce((sum, m) => sum + m.totalCost, 0);
      const totalCost = periodicCost + breakdownCost;
      
      const periodicPercentage = totalCost > 0 ? Math.round((periodicCost / totalCost) * 100) : 0;
      const breakdownPercentage = totalCost > 0 ? Math.round((breakdownCost / totalCost) * 100) : 0;

      return {
        id: v.id,
        vehicleName: `${v.make} ${v.model}`,
        plateNumber: v.plateNumber,
        label: `${v.make} (${v.plateNumber})`,
        periodicCost,
        breakdownCost,
        totalCost,
        periodicPercentage,
        breakdownPercentage
      };
    });
  }, [filteredVehicles, filteredMaintenance]);

  const totalPeriodicAll = useMemo(() => {
    return maintenanceComparisonData.reduce((sum, d) => sum + d.periodicCost, 0);
  }, [maintenanceComparisonData]);

  const totalBreakdownAll = useMemo(() => {
    return maintenanceComparisonData.reduce((sum, d) => sum + d.breakdownCost, 0);
  }, [maintenanceComparisonData]);

  const totalMaintenanceAll = totalPeriodicAll + totalBreakdownAll;

  const selectedSession = filteredCheckouts.find(c => c.id === selectedSessionId) || checkouts.find(c => c.id === selectedSessionId) || activeReceiptSession || filteredCheckouts[0] || checkouts[0];

  const handleExportCSV = () => {
    if (reportType === 'fleet_summary') exportVehiclesToCSV(filteredVehicles, drivers);
    else if (reportType === 'maintenance_audit') exportMaintenanceToCSV(filteredMaintenance, vehicles);
    else if (reportType === 'fuel_summary') exportFuelToCSV(filteredFuel, vehicles, drivers);
    else if (reportType === 'checkout_receipt') exportCheckoutsToCSV(filteredCheckouts, vehicles, drivers);
    else exportVehiclesToCSV(filteredVehicles, drivers);
  };

  // Reusable Customizable Header Renderer
  const renderCustomHeader = () => {
    const company = localSettings.companyName || settings.companyName;
    const tagline = localSettings.tagline || settings.tagline;
    const logo = localSettings.logoUrl !== undefined ? localSettings.logoUrl : settings.logoUrl;
    const phone = localSettings.phone || settings.phone;
    const email = localSettings.email || settings.email;
    const address = localSettings.address || settings.address;
    const cr = localSettings.commercialRegNumber || settings.commercialRegNumber;

    if (headerStyle === 'centered') {
      return (
        <div className="border-b-2 border-slate-900 pb-4 text-center space-y-3">
          {showLogo && (
            <div className="flex justify-center">
              {logo ? (
                <img src={logo} alt="Logo" className="max-h-16 max-w-[160px] object-contain border p-1 rounded-lg shadow-xs" />
              ) : (
                <div className="w-14 h-14 bg-slate-900 text-white font-black rounded-xl flex items-center justify-center text-2xl shadow-sm">
                  {company.charAt(0)}
                </div>
              )}
            </div>
          )}
          
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{company}</h1>
            {showTagline && tagline && (
              <p className="text-xs font-semibold text-slate-600 mt-0.5">{tagline}</p>
            )}
            {showTaxReg && cr && (
              <p className="text-[11px] font-mono font-medium text-slate-500 mt-1 inline-block px-2.5 py-0.5 bg-slate-100 rounded border border-slate-200">
                CR / Tax Reg No: {cr}
              </p>
            )}
          </div>

          {showContacts && (
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-slate-600 pt-1 border-t border-slate-200">
              {phone && <span>📞 {phone}</span>}
              {email && <span>✉️ {email}</span>}
              {address && <span>📍 {address}</span>}
              {showPrintDate && <span>📅 Date: {new Date().toLocaleDateString('en-US')}</span>}
            </div>
          )}
        </div>
      );
    }

    if (headerStyle === 'enterprise') {
      return (
        <div className="border border-slate-900 rounded-xl p-4 bg-slate-900 text-white shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              {showLogo && (
                logo ? (
                  <img src={logo} alt="Logo" className="max-h-14 max-w-[120px] object-contain bg-white p-1 rounded-lg" />
                ) : (
                  <div className="w-12 h-12 bg-amber-500 text-slate-950 font-black rounded-lg flex items-center justify-center text-xl shadow">
                    {company.charAt(0)}
                  </div>
                )
              )}
              <div>
                <h1 className="text-lg font-black text-white tracking-wide">{company}</h1>
                {showTagline && tagline && (
                  <p className="text-xs text-amber-400 font-medium">{tagline}</p>
                )}
              </div>
            </div>

            <div className="text-right font-mono text-xs text-slate-300">
              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full font-bold text-[10px] inline-block mb-1">
                OFFICIAL FLEET AUDIT
              </span>
              {showPrintDate && <p className="text-[11px]">Print Date: {new Date().toLocaleDateString('en-US')}</p>}
            </div>
          </div>

          {(showContacts || showTaxReg) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono text-slate-300 pt-1">
              {showTaxReg && cr && <div><span className="text-slate-400 block text-[9px] uppercase">CR/Tax ID</span><strong>{cr}</strong></div>}
              {showContacts && phone && <div><span className="text-slate-400 block text-[9px] uppercase">Phone</span><strong>{phone}</strong></div>}
              {showContacts && email && <div><span className="text-slate-400 block text-[9px] uppercase">Email</span><strong>{email}</strong></div>}
              {showContacts && address && <div><span className="text-slate-400 block text-[9px] uppercase">HQ Address</span><strong>{address}</strong></div>}
            </div>
          )}
        </div>
      );
    }

    // Classic Split Layout (Default)
    return (
      <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showLogo && (
            logo ? (
              <img src={logo} alt="Logo" className="max-h-16 max-w-[120px] object-contain border p-1 rounded" />
            ) : (
              <div className="w-12 h-12 bg-slate-900 text-white font-bold rounded flex items-center justify-center text-xl">
                {company.charAt(0)}
              </div>
            )
          )}
          <div>
            <h1 className="text-xl font-black text-slate-900">{company}</h1>
            {showTagline && tagline && <p className="text-xs text-slate-600 font-medium">{tagline}</p>}
            {showTaxReg && cr && <p className="text-[10px] text-slate-500 font-mono mt-0.5">CR/Tax ID: {cr}</p>}
          </div>
        </div>

        {showContacts && (
          <div className="text-right text-xs text-slate-600 space-y-0.5 font-mono">
            {showPrintDate && <p><strong>Print Date:</strong> {new Date().toLocaleDateString('en-US')}</p>}
            {phone && <p><strong>Phone:</strong> {phone}</p>}
            {email && <p><strong>Email:</strong> {email}</p>}
            {address && <p className="text-[10px] text-slate-400">{address}</p>}
          </div>
        )}
      </div>
    );
  };

  // Reusable Printable Report Renderer (Strictly in English)
  const renderReportContent = () => {
    const activeHeaderNote = customHeaderNote || localSettings.printHeaderNote || settings.printHeaderNote;

    return (
      <div className="printable-document bg-white text-slate-900 border border-slate-300 rounded-2xl p-8 shadow-lg max-w-4xl mx-auto space-y-6 dir-ltr text-left">
        {/* Dynamic Company Header with Customizable Branding */}
        {renderCustomHeader()}

        {/* Header Note */}
        {((showHeaderNote && activeHeaderNote) || hasActiveFilters) && (
          <div className="bg-slate-50 p-2.5 text-center text-xs text-slate-700 border border-slate-200 rounded space-y-1">
            {showHeaderNote && activeHeaderNote && <p className="italic">"{activeHeaderNote}"</p>}
            {hasActiveFilters && (
              <p className="font-bold text-blue-700 font-mono text-[11px]">
                Filters Applied ({startDate ? `From ${startDate} ` : ''}{endDate ? `To ${endDate} ` : ''}{selectedDriverId !== 'all' ? `• Driver: ${drivers.find(d=>d.id===selectedDriverId)?.name} ` : ''}{selectedVehicleId !== 'all' ? `• Vehicle: ${vehicles.find(v=>v.id===selectedVehicleId)?.make} ${vehicles.find(v=>v.id===selectedVehicleId)?.plateNumber}` : ''})
              </p>
            )}
          </div>
        )}

      {/* 1. CHECKOUT RECEIPT REPORT */}
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

          {/* Session Details */}
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

          {/* Signatures Block */}
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

      {/* 2. FLEET SUMMARY REPORT */}
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

      {/* 3. MAINTENANCE AUDIT REPORT */}
      {reportType === 'maintenance_audit' && (
        <div className="space-y-6">
          <div className="text-center border-b pb-3 border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide">MAINTENANCE EXPENSE & REPAIR AUDIT REPORT</h2>
            <p className="text-xs text-slate-500">Invoices Analyzed: {filteredMaintenance.length} | Total Cost: {formatCurrency(totalMaintenanceAll, settings.currency, 'en')}</p>
          </div>

          {/* Summary Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-600 block">Total Maintenance Spend</span>
                <span className="text-base font-black text-slate-900 font-mono">{formatCurrency(totalMaintenanceAll, settings.currency, 'en')}</span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 block">Periodic Maintenance</span>
                <span className="text-base font-black text-emerald-700 font-mono">
                  {formatCurrency(totalPeriodicAll, settings.currency, 'en')}
                  <span className="text-[10px] font-normal ml-1 text-emerald-600">
                    ({totalMaintenanceAll > 0 ? Math.round((totalPeriodicAll / totalMaintenanceAll) * 100) : 0}%)
                  </span>
                </span>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-rose-800 block">Emergency Breakdowns</span>
                <span className="text-base font-black text-rose-700 font-mono">
                  {formatCurrency(totalBreakdownAll, settings.currency, 'en')}
                  <span className="text-[10px] font-normal ml-1 text-rose-600">
                    ({totalMaintenanceAll > 0 ? Math.round((totalBreakdownAll / totalMaintenanceAll) * 100) : 0}%)
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown Table */}
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

      {/* 4. FUEL SUMMARY REPORT */}
      {reportType === 'fuel_summary' && (
        <div className="space-y-4">
          <div className="text-center border-b pb-2 border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide">FUEL EXPENSES & REFUELING AUDIT REPORT</h2>
            <p className="text-xs text-slate-500 font-mono">Total Refueling Transactions: {filteredFuel.length} | Total Spend: {formatCurrency(filteredFuel.reduce((sum, f) => sum + f.totalCost, 0), settings.currency, 'en')}</p>
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

      {/* 5. EXPIRIES AUDIT REPORT */}
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

      {/* 6. AI 3-MONTH EXPENSE & COST-SAVING REPORT */}
      {reportType === 'ai_cost_summary' && (
        <div className="space-y-5">
          <div className="text-center border-b pb-3 border-slate-200">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-bold mb-1">
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

          {/* 3-Month KPI Financial Summary Box */}
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

          {/* AI Report Body or Loading / Prompt */}
          {isAnalyzing ? (
            <div className="p-8 text-center space-y-3 bg-blue-50/50 rounded-xl border border-blue-200">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-blue-900">
                Analyzing last 3 months of vehicle maintenance, fuel logs, and spare parts...
              </p>
              <p className="text-[11px] text-slate-500">
                Gemini 3.6 Flash is calculating cost driver patterns and identifying savings opportunities.
              </p>
            </div>
          ) : analysisError ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
              <p><strong>Analysis Error:</strong> {analysisError}</p>
              <button
                onClick={handleRunAiExpenseSummary}
                className="px-3 py-1.5 bg-rose-600 text-white rounded font-bold hover:bg-rose-700 transition"
              >
                Retry Analysis
              </button>
            </div>
          ) : aiSummary ? (
            <div className="space-y-4">
              <div className="flex justify-end gap-2 no-print">
                <button
                  onClick={handleCopySummary}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-xs transition flex items-center gap-1.5"
                >
                  {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSummary ? 'Copied!' : 'Copy Summary'}
                </button>
                <button
                  onClick={handleRunAiExpenseSummary}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Re-Analyze
                </button>
              </div>

              <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3 text-xs leading-relaxed text-slate-800 dir-ltr text-left">
                {aiSummary.split('\n').map((line, idx) => {
                  const trimmed = line.trim();
                  if (!trimmed) return <div key={idx} className="h-1" />;
                  if (trimmed.startsWith('#') || trimmed.startsWith('1.') || trimmed.startsWith('2.') || trimmed.startsWith('3.')) {
                    return (
                      <h3 key={idx} className="font-extrabold text-sm text-slate-900 border-b pb-1 mt-3 text-blue-900 flex items-center gap-1.5">
                        {trimmed.replace(/^[#\d\.\s]+/, '')}
                      </h3>
                    );
                  }
                  if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•')) {
                    return (
                      <div key={idx} className="flex items-start gap-2 pl-2 py-0.5">
                        <span className="text-emerald-600 font-bold text-base leading-none">•</span>
                        <p className="flex-1">
                          {trimmed.replace(/^[-*•]\s*/, '').split(/(\*\*.*?\*\*)/).map((part, pIdx) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return <strong key={pIdx} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
                            }
                            return part;
                          })}
                        </p>
                      </div>
                    );
                  }
                  return (
                    <p key={idx} className="text-slate-700">
                      {trimmed.split(/(\*\*.*?\*\*)/).map((part, pIdx) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return <strong key={pIdx} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
                        }
                        return part;
                      })}
                    </p>
                  );
                })}
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
                  Analyze the last 90 days of vehicle repair bills, fuel refill logs, and driver breakdown frequencies to uncover immediate savings opportunities.
                </p>
              </div>
              <button
                onClick={handleRunAiExpenseSummary}
                disabled={isAnalyzing}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs shadow-md transition inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Generate 3-Month AI Analysis
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer Note */}
      <div className="border-t border-slate-300 pt-4 text-center text-[10px] text-slate-500 font-mono">
        <p>{settings.printFooterNote || `${settings.companyName} • Official Fleet Management Report`}</p>
      </div>
    </div>
  );
};

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Controls Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Printer className="w-6 h-6 text-blue-400" />
            Print Reports & Receipts Generator
            <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-mono rounded-full font-bold">
              EN Standard Output
            </span>
          </h2>
          <p className="text-slate-300 text-xs mt-1">
            Generate and export official handover receipts, fleet summaries, maintenance cost audits, and compliance reports with customizable company branding.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCustomizePanel(!showCustomizePanel)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-bold rounded-xl text-xs shadow transition flex items-center gap-1.5"
          >
            <Sliders className="w-4 h-4 text-amber-400" />
            {showCustomizePanel ? 'Hide Header Options' : 'Customize Header'}
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow transition flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-xs shadow-md transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print / PDF Export
          </button>
        </div>
      </div>

      {/* Customizable Header & Branding Controls Panel */}
      <div className="bg-[#0f1115] border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 no-print text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Customizable Report Header & Branding
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] rounded-full font-mono font-bold">
                  {localSettings.companyName || settings.companyName}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Pulls company name, logo, tax ID, and contact details directly from CompanySettings for professionally branded exports.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCustomizePanel(!showCustomizePanel)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            {showCustomizePanel ? 'Collapse Controls' : 'Header Controls & Settings'}
            {showCustomizePanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Collapsible Customization Options */}
        {showCustomizePanel && (
          <div className="space-y-5 pt-1 text-xs">
            {/* Header Layout Picker */}
            <div className="space-y-2">
              <label className="font-bold text-slate-300 block flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5 text-blue-400" />
                Select Header Layout Style:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setHeaderStyle('classic')}
                  className={`p-3 rounded-xl border text-left transition space-y-1 ${
                    headerStyle === 'classic'
                      ? 'bg-blue-950/60 border-blue-500 text-white ring-2 ring-blue-500/30'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold text-xs block text-white flex items-center justify-between">
                    1. Classic Split
                    {headerStyle === 'classic' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Logo & Company on Left | Phone, Email & Address on Right</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHeaderStyle('centered')}
                  className={`p-3 rounded-xl border text-left transition space-y-1 ${
                    headerStyle === 'centered'
                      ? 'bg-blue-950/60 border-blue-500 text-white ring-2 ring-blue-500/30'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold text-xs block text-white flex items-center justify-between">
                    2. Modern Centered
                    {headerStyle === 'centered' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Top Centered Logo, Prominent Title & Horizontal Contact Bar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHeaderStyle('enterprise')}
                  className={`p-3 rounded-xl border text-left transition space-y-1 ${
                    headerStyle === 'enterprise'
                      ? 'bg-blue-950/60 border-blue-500 text-white ring-2 ring-blue-500/30'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold text-xs block text-white flex items-center justify-between">
                    3. Enterprise Banner
                    {headerStyle === 'enterprise' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </span>
                  <span className="text-[10px] text-slate-400 block">High-Contrast Dark Banner with Gold Badge & 4-Column Grid</span>
                </button>
              </div>
            </div>

            {/* Custom Titles and Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Custom Report Title Override (Optional):
                </label>
                <input
                  type="text"
                  value={customReportTitle}
                  onChange={e => setCustomReportTitle(e.target.value)}
                  placeholder="e.g. Q3 2026 Executive Fleet Operations Audit"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Custom Header Note / Disclaimer Override:
                </label>
                <input
                  type="text"
                  value={customHeaderNote}
                  onChange={e => setCustomHeaderNote(e.target.value)}
                  placeholder={localSettings.printHeaderNote || "e.g. Official Fleet Document • Retention Required"}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:border-amber-400 outline-none"
                />
              </div>
            </div>

            {/* Visibility Element Toggles */}
            <div className="space-y-2">
              <label className="font-bold text-slate-300 block">
                Header Element Visibility Toggles:
              </label>
              <div className="flex flex-wrap items-center gap-4 bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={showLogo}
                    onChange={e => setShowLogo(e.target.checked)}
                    className="accent-amber-400 rounded"
                  />
                  <span>Company Logo</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={showTagline}
                    onChange={e => setShowTagline(e.target.checked)}
                    className="accent-amber-400 rounded"
                  />
                  <span>Tagline</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={showContacts}
                    onChange={e => setShowContacts(e.target.checked)}
                    className="accent-amber-400 rounded"
                  />
                  <span>Contact Info (Phone/Email/Address)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={showTaxReg}
                    onChange={e => setShowTaxReg(e.target.checked)}
                    className="accent-amber-400 rounded"
                  />
                  <span>CR / Tax ID</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={showPrintDate}
                    onChange={e => setShowPrintDate(e.target.checked)}
                    className="accent-amber-400 rounded"
                  />
                  <span>Print Date</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={showHeaderNote}
                    onChange={e => setShowHeaderNote(e.target.checked)}
                    className="accent-amber-400 rounded"
                  />
                  <span>Header Note</span>
                </label>
              </div>
            </div>

            {/* Quick Edit Company Profile Accordion */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              <button
                type="button"
                onClick={() => setIsEditingCompanyInfo(!isEditingCompanyInfo)}
                className="w-full px-4 py-2.5 bg-slate-900 hover:bg-slate-850 text-left flex items-center justify-between text-xs font-bold text-white transition"
              >
                <span className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  Quick Edit Company Profile & Logo Settings
                </span>
                <span className="text-[10px] text-amber-400 font-mono">
                  {isEditingCompanyInfo ? 'Collapse Company Form ▲' : 'Edit Company Info ▼'}
                </span>
              </button>

              {isEditingCompanyInfo && (
                <form onSubmit={handleSaveCompanyInfo} className="p-4 space-y-4 border-t border-slate-800">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">Company Name</label>
                      <input
                        type="text"
                        value={localSettings.companyName}
                        onChange={e => setLocalSettings({ ...localSettings, companyName: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">Company Tagline</label>
                      <input
                        type="text"
                        value={localSettings.tagline}
                        onChange={e => setLocalSettings({ ...localSettings, tagline: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">CR / Tax Registration ID</label>
                      <input
                        type="text"
                        value={localSettings.commercialRegNumber}
                        onChange={e => setLocalSettings({ ...localSettings, commercialRegNumber: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={localSettings.phone}
                        onChange={e => setLocalSettings({ ...localSettings, phone: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">Email Address</label>
                      <input
                        type="text"
                        value={localSettings.email}
                        onChange={e => setLocalSettings({ ...localSettings, email: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">Address / Location</label>
                      <input
                        type="text"
                        value={localSettings.address}
                        onChange={e => setLocalSettings({ ...localSettings, address: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-white text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2 md:col-span-3">
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">Company Logo Image URL</label>
                      <input
                        type="text"
                        value={localSettings.logoUrl}
                        onChange={e => setLocalSettings({ ...localSettings, logoUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-white text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <p className="text-[10px] text-slate-400">
                      Changes automatically reflect in the live document header below. Save to persist to Company Settings.
                    </p>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-lg text-xs transition flex items-center gap-1.5 shadow"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {settingsSavedSuccess ? 'Saved to System Settings!' : 'Save to Company Settings'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      {/* AI Expense Summary Quick Tool Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-blue-800/60 rounded-2xl p-5 text-white shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                AI 3-Month Vehicle Expense & Cost-Saving Analyzer
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] rounded-full font-mono font-bold">
                  Last 90 Days
                </span>
              </h3>
              <p className="text-slate-300 text-xs">
                Analyzes vehicle maintenance bills and fuel logs to provide actionable cost-reduction strategies.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setReportType('ai_cost_summary');
              if (!aiSummary && !isAnalyzing) {
                handleRunAiExpenseSummary();
              }
            }}
            disabled={isAnalyzing}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center gap-2 shrink-0 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing Expenses...
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-emerald-200" />
                {aiSummary ? 'View AI Cost Report' : 'Analyze 3M Expenses'}
              </>
            )}
          </button>
        </div>

        {/* 3M Expense Stats Quick Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs font-mono">
          <div>
            <span className="text-slate-400 block text-[10px]">3M Maintenance:</span>
            <span className="font-extrabold text-blue-400">{formatCurrency(recent3MaintCost, settings.currency, 'en')}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">3M Fuel Total:</span>
            <span className="font-extrabold text-amber-400">{formatCurrency(recent3FuelCost, settings.currency, 'en')}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Combined 3M Spend:</span>
            <span className="font-extrabold text-emerald-400">{formatCurrency(total3mExpense, settings.currency, 'en')}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Records Filtered:</span>
            <span className="font-extrabold text-slate-200">{recent3Maint.length + recent3Fuel.length} items</span>
          </div>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-sm flex flex-wrap gap-2">
        <button
          onClick={() => setReportType('ai_cost_summary')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            reportType === 'ai_cost_summary'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm ring-2 ring-emerald-400/30'
              : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-500" />
          AI 3M Cost Report
        </button>
        <button
          onClick={() => setReportType('checkout_receipt')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            reportType === 'checkout_receipt'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Checkout Receipt
        </button>

        <button
          onClick={() => setReportType('fleet_summary')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            reportType === 'fleet_summary'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Car className="w-4 h-4" />
          Fleet Summary
        </button>

        <button
          onClick={() => setReportType('maintenance_audit')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            reportType === 'maintenance_audit'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4" />
          Maintenance Audit
        </button>

        <button
          onClick={() => setReportType('fuel_summary')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            reportType === 'fuel_summary'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Fuel className="w-4 h-4" />
          Fuel Report
        </button>

        <button
          onClick={() => setReportType('expiries_audit')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            reportType === 'expiries_audit'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Expiries Audit
        </button>
      </div>

      {/* Select Receipt Dropdown when checkout_receipt is selected */}
      {reportType === 'checkout_receipt' && (
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Select Handover Receipt Session to Print:
          </span>
          <select
            value={selectedSessionId}
            onChange={e => setSelectedSessionId(e.target.value)}
            className="px-3 py-2 border rounded-xl bg-white dark:bg-slate-800 border-blue-300 dark:border-blue-700 font-bold text-xs w-full sm:w-auto"
          >
            {checkouts.map(c => {
              const v = vehicles.find(veh => veh.id === c.vehicleId);
              const d = drivers.find(drv => drv.id === c.driverId);
              return (
                <option key={c.id} value={c.id}>
                  Receipt #{c.id} - {v?.make} {v?.plateNumber} ({d?.name})
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* Printable Paper Container */}
      <div className="bg-slate-100 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        {renderReportContent()}
      </div>
    </div>
  );
};
