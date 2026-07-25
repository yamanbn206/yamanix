import { Vehicle, Driver, MaintenanceRecord, FuelRecord, CheckoutSession, Garage, ExpenseRecord, CompanySettings } from '../types';

/**
 * Helper to escape CSV cell strings properly and handle quotes/newlines.
 */
function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Downloads a string content as a CSV file with UTF-8 BOM byte order mark (\uFEFF)
 * ensuring Microsoft Excel opens Arabic text correctly.
 */
function downloadCSV(csvContent: string, fileName: string) {
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export Vehicles to CSV
 */
export function exportVehiclesToCSV(vehicles: Vehicle[], drivers: Driver[] = []) {
  const headers = [
    'معرف المركبة',
    'الماركة',
    'الموديل',
    'سنة الصنع',
    'رقم اللوحة',
    'اللون',
    'نوع الوقود',
    'عداد الكيلومترات (كم)',
    'رقم الهيكل (VIN)',
    'تاريخ انتهاء الاستمارة',
    'تاريخ انتهاء التأمين',
    'شركة التأمين',
    'رقم وثيقة التأمين',
    'السائق المخصص',
    'حالة المركبة',
    'ملاحظات'
  ];

  const rows = vehicles.map(v => {
    const assignedDriver = drivers.find(d => d.id === v.assignedDriverId)?.name || 'غير مخصص';
    const statusText = 
      v.status === 'available' ? 'متوفرة' : 
      v.status === 'checked_out' ? 'مستلمة بالخارج' : 
      v.status === 'maintenance' ? 'في الصيانة' : 'خارج الخدمة';

    return [
      v.id,
      v.make,
      v.model,
      v.year,
      v.plateNumber,
      v.color,
      v.fuelType === 'diesel' ? 'ديزل' : v.fuelType === '91' ? 'بنزين 91' : v.fuelType === '95' ? 'بنزين 95' : v.fuelType,
      v.mileage,
      v.vinNumber || '',
      v.licenseExpiryDate,
      v.insuranceExpiryDate,
      v.insuranceCompany || '',
      v.policyNumber || '',
      assignedDriver,
      statusText,
      v.notes || ''
    ].map(escapeCSV).join(',');
  });

  const csvString = [headers.map(escapeCSV).join(','), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCSV(csvString, `fleet_vehicles_backup_${dateStr}.csv`);
}

/**
 * Export Maintenance Records to CSV
 */
export function exportMaintenanceToCSV(
  maintenance: MaintenanceRecord[],
  vehicles: Vehicle[] = [],
  garages: Garage[] = []
) {
  const headers = [
    'رقم الفاتورة',
    'التاريخ',
    'المركبة',
    'رقم اللوحة',
    'الكراج / الورشة',
    'نوع الصيانة',
    'وصف الصيانة والعمل',
    'قراءة العداد عند الصيانة (كم)',
    'قطع الغيار المستبدلة',
    'تكلفة قطع الغيار (ر.س)',
    'أجرة اليد / المصنعية (ر.س)',
    'التكلفة الإجمالية (ر.س)',
    'الحالة'
  ];

  const rows = maintenance.map(m => {
    const vehicle = vehicles.find(v => v.id === m.vehicleId);
    const garage = garages.find(g => g.id === m.garageId);
    const vehicleName = vehicle ? `${vehicle.make} ${vehicle.model}` : 'مركبة غير معروفة';
    const plateNumber = vehicle?.plateNumber || '';
    const garageName = garage?.name || 'ورشة خارجية';
    const typeText = 
      m.type === 'periodic' ? 'صيانة دورية' : 
      m.type === 'breakdown' ? 'إصلاح عطل' : 
      m.type === 'emergency' ? 'صيانة طارئة' : 'حادث';

    const partsText = m.parts?.map(p => `${p.partName} (عدد: ${p.quantity})`).join(' | ') || 'بدون قطع غيار';
    const partsCost = m.parts?.reduce((sum, p) => sum + (p.unitCost * p.quantity), 0) || 0;

    return [
      m.invoiceNumber || m.id,
      m.date,
      vehicleName,
      plateNumber,
      garageName,
      typeText,
      m.description,
      m.odometerReading || 0,
      partsText,
      partsCost,
      m.laborCost || 0,
      m.totalCost,
      m.status === 'completed' ? 'مدفوعة' : 'معلقة'
    ].map(escapeCSV).join(',');
  });

  const csvString = [headers.map(escapeCSV).join(','), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCSV(csvString, `fleet_maintenance_records_${dateStr}.csv`);
}

/**
 * Export Fuel Records to CSV
 */
export function exportFuelToCSV(
  fuel: FuelRecord[],
  vehicles: Vehicle[] = [],
  drivers: Driver[] = []
) {
  const headers = [
    'معرف السجل',
    'التاريخ',
    'المركبة',
    'رقم اللوحة',
    'اسم السائق',
    'اسم المحطة',
    'كمية الوقود (لتر)',
    'سعر اللتر (ر.س)',
    'التكلفة الإجمالية (ر.س)',
    'قراءة العداد (كم)',
    'ملاحظات'
  ];

  const rows = fuel.map(f => {
    const vehicle = vehicles.find(v => v.id === f.vehicleId);
    const driver = drivers.find(d => d.id === f.driverId);
    const vehicleName = vehicle ? `${vehicle.make} ${vehicle.model}` : 'مركبة';
    const plateNumber = vehicle?.plateNumber || '';
    const driverName = driver?.name || 'مستلم/سائق عام';

    return [
      f.id,
      f.date,
      vehicleName,
      plateNumber,
      driverName,
      f.stationName || 'محطة وقود',
      f.liters,
      f.costPerLiter,
      f.totalCost,
      f.odometerReading,
      f.notes || ''
    ].map(escapeCSV).join(',');
  });

  const csvString = [headers.map(escapeCSV).join(','), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCSV(csvString, `fleet_fuel_expenses_${dateStr}.csv`);
}

/**
 * Export Drivers to CSV
 */
export function exportDriversToCSV(drivers: Driver[]) {
  const headers = [
    'معرف السائق',
    'اسم السائق',
    'رقم الهوية / الإقامة',
    'رقم الجوال',
    'رقم رخصة القيادة',
    'فئة الرخصة',
    'تاريخ انتهاء الرخصة',
    'القسم / الإدارة',
    'الحالة',
    'ملاحظات'
  ];

  const rows = drivers.map(d => [
    d.id,
    d.name,
    d.idNumber,
    d.phone,
    d.licenseNumber,
    d.licenseCategory,
    d.licenseExpiryDate,
    d.department,
    d.status === 'active' ? 'نشط' : 'غير نشط',
    d.notes || ''
  ].map(escapeCSV).join(','));

  const csvString = [headers.map(escapeCSV).join(','), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCSV(csvString, `fleet_drivers_backup_${dateStr}.csv`);
}

/**
 * Export Checkout Sessions to CSV
 */
export function exportCheckoutsToCSV(
  checkouts: CheckoutSession[],
  vehicles: Vehicle[] = [],
  drivers: Driver[] = []
) {
  const headers = [
    'رقم الإيصال',
    'المركبة',
    'رقم اللوحة',
    'المستلم / السائق',
    'غرض الاستخدام',
    'وقت الخروج / الاستلام',
    'عداد الخروج (كم)',
    'مستوى وقود الخروج',
    'وقت العودة / التسليم',
    'عداد العودة (كم)',
    'مستوى وقود العودة',
    'الحالة',
    'ملاحظات الاستلام',
    'ملاحظات العودة'
  ];

  const rows = checkouts.map(c => {
    const vehicle = vehicles.find(v => v.id === c.vehicleId);
    const driver = drivers.find(d => d.id === c.driverId);
    const vehicleName = vehicle ? `${vehicle.make} ${vehicle.model}` : 'مركبة';
    const plateNumber = vehicle?.plateNumber || '';
    const driverName = driver?.name || 'مستلم';
    const purposeText = c.purposeCustom || c.purpose;

    return [
      c.id,
      vehicleName,
      plateNumber,
      driverName,
      purposeText,
      c.checkoutTime,
      c.checkoutOdometer,
      c.checkoutFuelLevel,
      c.returnTime || '',
      c.returnOdometer || '',
      c.returnFuelLevel || '',
      c.status === 'active' ? 'قيد الاستخدام بالخارج' : 'مكتملة ومستلمة',
      c.checkoutNotes || '',
      c.returnNotes || ''
    ].map(escapeCSV).join(',');
  });

  const csvString = [headers.map(escapeCSV).join(','), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCSV(csvString, `fleet_checkout_sessions_${dateStr}.csv`);
}

/**
 * Export complete system database backup as a JSON file
 */
export function exportFullBackupJSON(data: {
  vehicles: Vehicle[];
  drivers: Driver[];
  maintenance: MaintenanceRecord[];
  fuel: FuelRecord[];
  checkouts: CheckoutSession[];
  garages?: Garage[];
  expenses?: ExpenseRecord[];
  settings?: CompanySettings;
}) {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `fleet_full_database_backup_${dateStr}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export all system data (Vehicles, Drivers, Maintenance, Fuel, Checkouts) into a single consolidated CSV file
 */
export function exportBulkDataCSV(data: {
  vehicles: Vehicle[];
  drivers: Driver[];
  maintenance: MaintenanceRecord[];
  fuel: FuelRecord[];
  checkouts?: CheckoutSession[];
  garages?: Garage[];
  expenses?: ExpenseRecord[];
  settings?: CompanySettings;
}) {
  const { vehicles, drivers, maintenance, fuel, checkouts = [], garages = [], expenses = [] } = data;
  const lines: string[] = [];

  // Header
  lines.push(escapeCSV(`=== ENTERPRISE FLEET SYSTEM BULK EXPORT / التصدير الشامل لنظام الأسطول ===`));
  lines.push(escapeCSV(`Export Date / تاريخ التصدير: ${new Date().toLocaleString()}`));
  lines.push('');

  // 1. VEHICLES
  lines.push(escapeCSV(`--- SECTION 1: VEHICLES / المركبات (${vehicles.length}) ---`));
  const vehicleHeaders = [
    'معرف المركبة', 'الماركة', 'الموديل', 'سنة الصنع', 'رقم اللوحة', 'اللون', 'نوع الوقود',
    'عداد الكيلومترات (كم)', 'رقم الهيكل (VIN)', 'تاريخ انتهاء الاستمارة', 'تاريخ انتهاء التأمين',
    'شركة التأمين', 'رقم وثيقة التأمين', 'السائق المخصص', 'حالة المركبة', 'ملاحظات'
  ];
  lines.push(vehicleHeaders.map(escapeCSV).join(','));
  vehicles.forEach(v => {
    const assignedDriver = drivers.find(d => d.id === v.assignedDriverId)?.name || 'غير مخصص';
    const statusText = v.status === 'available' ? 'متوفرة' : v.status === 'checked_out' ? 'مستلمة بالخارج' : v.status === 'maintenance' ? 'في الصيانة' : 'خارج الخدمة';
    lines.push([
      v.id, v.make, v.model, v.year, v.plateNumber, v.color,
      v.fuelType === 'diesel' ? 'ديزل' : v.fuelType === '91' ? 'بنزين 91' : v.fuelType === '95' ? 'بنزين 95' : v.fuelType,
      v.mileage, v.vinNumber || '', v.licenseExpiryDate, v.insuranceExpiryDate,
      v.insuranceCompany || '', v.policyNumber || '', assignedDriver, statusText, v.notes || ''
    ].map(escapeCSV).join(','));
  });
  lines.push('');

  // 2. DRIVERS
  lines.push(escapeCSV(`--- SECTION 2: DRIVERS / السائقين (${drivers.length}) ---`));
  const driverHeaders = [
    'معرف السائق', 'اسم السائق', 'رقم الهوية / الإقامة', 'رقم الجوال', 'رقم رخصة القيادة',
    'فئة الرخصة', 'تاريخ انتهاء الرخصة', 'القسم / الإدارة', 'الحالة', 'ملاحظات'
  ];
  lines.push(driverHeaders.map(escapeCSV).join(','));
  drivers.forEach(d => {
    lines.push([
      d.id, d.name, d.idNumber, d.phone, d.licenseNumber,
      d.licenseCategory, d.licenseExpiryDate, d.department,
      d.status === 'active' ? 'نشط' : 'غير نشط', d.notes || ''
    ].map(escapeCSV).join(','));
  });
  lines.push('');

  // 3. MAINTENANCE
  lines.push(escapeCSV(`--- SECTION 3: MAINTENANCE RECORDS / سجلات الصيانة (${maintenance.length}) ---`));
  const maintHeaders = [
    'رقم الفاتورة', 'التاريخ', 'المركبة', 'رقم اللوحة', 'الكراج / الورشة', 'نوع الصيانة',
    'وصف الصيانة والعمل', 'قراءة العداد عند الصيانة (كم)', 'قطع الغيار المستبدلة',
    'تكلفة قطع الغيار', 'أجرة اليد / المصنعية', 'التكلفة الإجمالية', 'الحالة'
  ];
  lines.push(maintHeaders.map(escapeCSV).join(','));
  maintenance.forEach(m => {
    const vehicle = vehicles.find(v => v.id === m.vehicleId);
    const garage = garages.find(g => g.id === m.garageId);
    const partsText = m.parts?.map(p => `${p.partName} (عدد: ${p.quantity})`).join(' | ') || 'بدون قطع';
    const partsCost = m.parts?.reduce((sum, p) => sum + (p.unitCost * p.quantity), 0) || 0;
    lines.push([
      m.invoiceNumber || m.id, m.date, vehicle ? `${vehicle.make} ${vehicle.model}` : 'مركبة',
      vehicle?.plateNumber || '', garage?.name || 'ورشة خارجية',
      m.type === 'periodic' ? 'صيانة دورية' : m.type === 'breakdown' ? 'إصلاح عطل' : m.type === 'emergency' ? 'صيانة طارئة' : 'حادث',
      m.description, m.odometerReading || 0, partsText, partsCost, m.laborCost || 0, m.totalCost,
      m.status === 'completed' ? 'مدفوعة' : 'معلقة'
    ].map(escapeCSV).join(','));
  });
  lines.push('');

  // 4. FUEL
  lines.push(escapeCSV(`--- SECTION 4: FUEL LOGS / سجلات الوقود (${fuel.length}) ---`));
  const fuelHeaders = [
    'معرف السجل', 'التاريخ', 'المركبة', 'رقم اللوحة', 'اسم السائق', 'اسم المحطة',
    'كمية الوقود (لتر)', 'سعر اللتر', 'التكلفة الإجمالية', 'قراءة العداد (كم)', 'ملاحظات'
  ];
  lines.push(fuelHeaders.map(escapeCSV).join(','));
  fuel.forEach(f => {
    const vehicle = vehicles.find(v => v.id === f.vehicleId);
    const driver = drivers.find(d => d.id === f.driverId);
    lines.push([
      f.id, f.date, vehicle ? `${vehicle.make} ${vehicle.model}` : 'مركبة', vehicle?.plateNumber || '',
      driver?.name || 'سائق عام', f.stationName || 'محطة وقود',
      f.liters, f.costPerLiter, f.totalCost, f.odometerReading, f.notes || ''
    ].map(escapeCSV).join(','));
  });
  lines.push('');

  // 5. CHECKOUT SESSIONS
  if (checkouts.length > 0) {
    lines.push(escapeCSV(`--- SECTION 5: CHECKOUT SESSIONS / سجلات حركة المركبات (${checkouts.length}) ---`));
    const checkoutHeaders = [
      'رقم الإيصال', 'المركبة', 'رقم اللوحة', 'المستلم / السائق', 'غرض الاستخدام',
      'وقت الخروج', 'عداد الخروج', 'وقود الخروج', 'وقت العودة', 'عداد العودة', 'وقود العودة', 'الحالة'
    ];
    lines.push(checkoutHeaders.map(escapeCSV).join(','));
    checkouts.forEach(c => {
      const vehicle = vehicles.find(v => v.id === c.vehicleId);
      const driver = drivers.find(d => d.id === c.driverId);
      lines.push([
        c.id, vehicle ? `${vehicle.make} ${vehicle.model}` : 'مركبة', vehicle?.plateNumber || '',
        driver?.name || 'مستلم', c.purposeCustom || c.purpose,
        c.checkoutTime, c.checkoutOdometer, c.checkoutFuelLevel, c.returnTime || '',
        c.returnOdometer || '', c.returnFuelLevel || '',
        c.status === 'active' ? 'قيد الاستخدام' : 'مكتملة'
      ].map(escapeCSV).join(','));
    });
  }

  const csvContent = lines.join('\r\n');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCSV(csvContent, `fleet_enterprise_bulk_export_${dateStr}.csv`);
}

