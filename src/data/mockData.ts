import { 
  Company,
  Vehicle, 
  Driver, 
  Garage, 
  MaintenanceRecord, 
  FuelRecord, 
  ExpenseRecord, 
  CheckoutSession, 
  CompanySettings,
  CompanyDocument
} from '../types';

export const initialCompanies: Company[] = [
  {
    id: 'comp-1',
    name: 'YAMANIX - الخدمات اللوجستية والنقل',
    code: 'YMN',
    tagline: 'نظام إدارة أسطول السيارات والسائقين المتقدم',
    logoUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=150&auto=format&fit=crop&q=80',
    phone: '+966 50 123 4567',
    email: 'info@yamanix.com',
    address: 'الرياض - المملكة العربية السعودية',
    commercialRegNumber: 'CR-1010892341 / VAT-30098712300003',
    currency: 'SAR',
    isDefault: true,
    createdAt: '2026-01-01'
  },
  {
    id: 'comp-2',
    name: 'شركة المسار للنقل والتوزيع',
    code: 'MSR',
    tagline: 'خدمات الشحن والنقل اللوجستي السريع للمنشآت',
    logoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=150&auto=format&fit=crop&q=80',
    phone: '+966 55 987 6543',
    email: 'contact@almasar-express.com',
    address: 'جدة - المنطقة الصناعية الثالثة',
    commercialRegNumber: 'CR-4030998811 / VAT-310112233400003',
    currency: 'SAR',
    isDefault: false,
    createdAt: '2026-02-15'
  }
];

export const initialCompanySettings: CompanySettings = {
  companyId: 'comp-1',
  companyName: 'YAMANIX',
  tagline: 'نظام إدارة أسطول السيارات والسائقين المتقدم',
  logoUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=150&auto=format&fit=crop&q=80',
  phone: '+966 50 123 4567',
  email: 'info@yamanix.com',
  address: 'الرياض - المملكة العربية السعودية',
  commercialRegNumber: 'CR-1010892341 / VAT-30098712300003',
  printHeaderNote: 'مستند رسمي صادر عن نظام YAMANIX لإدارة الأسطول - يرجى الاحتفاظ بالنسخة',
  printFooterNote: 'YAMANIX | هاتف: 0114567890 | البريد: fleet@yamanix.com',
  currency: 'SAR'
};

export const initialVehicles: Vehicle[] = [
  {
    id: 'v-101',
    companyId: 'comp-1',
    plateNumber: 'أ ب ج 1234',
    make: 'تويوتا',
    model: 'هايلكس غمارتين',
    year: 2022,
    color: 'أبيض',
    vinNumber: 'JTE33429811234567',
    status: 'available',
    mileage: 84500,
    fuelType: 'diesel',
    licenseExpiryDate: '2026-08-15', // قريبة الانتهاء
    insuranceExpiryDate: '2026-08-01', // قريبة جداً
    insuranceCompany: 'التعاونية للتأمين',
    policyNumber: 'POL-992381',
    assignedDriverId: 'd-1',
    nextServiceMileage: 85000, // متبقي 500 كم
    serviceIntervalKm: 5000,
    notes: 'حالة ممتازة - مخصصة للنقل الشريع'
  },
  {
    id: 'v-102',
    companyId: 'comp-1',
    plateNumber: 'ر س ط 5678',
    make: 'هيونداي',
    model: 'إلانترا',
    year: 2023,
    color: 'فضي',
    vinNumber: 'KMH12345678901234',
    status: 'checked_out',
    mileage: 42100,
    fuelType: '91',
    licenseExpiryDate: '2027-02-10',
    insuranceExpiryDate: '2026-11-20',
    insuranceCompany: 'تأمين ملاذ',
    policyNumber: 'POL-881239',
    assignedDriverId: 'd-2',
    nextServiceMileage: 40000, // متأخرة بـ 2100 كم!
    serviceIntervalKm: 10000,
    notes: 'سيارة المبيعات الميدانية'
  },
  {
    id: 'v-103',
    companyId: 'comp-1',
    plateNumber: 'م ن هـ 9012',
    make: 'إيسوزو',
    model: 'ديماكس D-Max',
    year: 2021,
    color: 'رمادي',
    vinNumber: 'MP123098457231458',
    status: 'maintenance',
    mileage: 128900,
    fuelType: 'diesel',
    licenseExpiryDate: '2026-07-28', // منتهية أو خلال أيام!
    insuranceExpiryDate: '2026-08-10',
    insuranceCompany: 'تأمين تكافل الراجحي',
    policyNumber: 'POL-771230',
    assignedDriverId: 'd-3',
    nextServiceMileage: 130000, // متبقي 1100 كم
    serviceIntervalKm: 5000,
    notes: 'تتطلب صيانة فرامل وفحص دوري'
  },
  {
    id: 'v-104',
    companyId: 'comp-1',
    plateNumber: 'ح ط ي 3456',
    make: 'نيسان',
    model: 'صني',
    year: 2022,
    color: 'أسود',
    vinNumber: 'JN123987456123987',
    status: 'available',
    mileage: 63000,
    fuelType: '91',
    licenseExpiryDate: '2026-09-05',
    insuranceExpiryDate: '2026-09-12',
    insuranceCompany: 'التعاونية للتأمين',
    policyNumber: 'POL-661209',
    assignedDriverId: 'd-4',
    nextServiceMileage: 65000, // باقي 2000 كم
    serviceIntervalKm: 5000,
    notes: 'استخدام إداري للشركة'
  },
  {
    id: 'v-105',
    companyId: 'comp-1',
    plateNumber: 'ف ق ك 7890',
    make: 'مرسيدس',
    model: 'أكتروس (شاحنة)',
    year: 2020,
    color: 'أزرق',
    vinNumber: 'WDB96303211892341',
    status: 'available',
    mileage: 215000,
    fuelType: 'diesel',
    licenseExpiryDate: '2026-08-05', // قريبة الانتهاء
    insuranceExpiryDate: '2026-08-05', // قريبة الانتهاء
    insuranceCompany: 'أليانز للتأمين',
    policyNumber: 'POL-551092',
    assignedDriverId: 'd-5',
    notes: 'شاحنة النقل الثقيل بين المدن'
  },
  {
    id: 'v-106',
    companyId: 'comp-1',
    plateNumber: 'ل م ن 4321',
    make: 'فورد',
    model: 'ترانزيت فان',
    year: 2021,
    color: 'أبيض',
    vinNumber: 'WF012398457123984',
    status: 'available',
    mileage: 97800,
    fuelType: 'diesel',
    licenseExpiryDate: '2027-01-15',
    insuranceExpiryDate: '2026-12-01',
    insuranceCompany: 'تأمين ملاذ',
    policyNumber: 'POL-441098',
    assignedDriverId: 'd-6',
    notes: 'فان توصيل البضائع والمعدات'
  }
];

export const initialDrivers: Driver[] = [
  {
    id: 'd-1',
    name: 'محمد أحمد العتيبي',
    phone: '0501112233',
    idNumber: '1089238412',
    licenseNumber: 'DL-992381',
    licenseCategory: 'نقل خفيف / عمومي',
    licenseExpiryDate: '2026-08-10', // قريبة الانتهاء
    department: 'قسم الحركة والتوزيع',
    status: 'active',
    notes: 'سائق ملتزم وسجل خالٍ من الحوادث'
  },
  {
    id: 'd-2',
    name: 'خالد عبدالله الشمري',
    phone: '0552223344',
    idNumber: '1078129384',
    licenseNumber: 'DL-881239',
    licenseCategory: 'خصوصي',
    licenseExpiryDate: '2027-05-20',
    department: 'المبيعات والتسويق',
    status: 'active',
    notes: 'سائق مندوب ميداني'
  },
  {
    id: 'd-3',
    name: 'عبدالرحمن سليمان الدوسري',
    phone: '0543334455',
    idNumber: '1091238475',
    licenseNumber: 'DL-771230',
    licenseCategory: 'نقل ثقيل / معدات',
    licenseExpiryDate: '2026-07-30', // قريبة جداً!
    department: 'النقل الثقيل واللوجستيات',
    status: 'active',
    notes: 'سائق الشاحنات الكبيرة'
  },
  {
    id: 'd-4',
    name: 'فهد إبراهيم الزهراني',
    phone: '0564445566',
    idNumber: '1067239182',
    licenseNumber: 'DL-661209',
    licenseCategory: 'خصوصي',
    licenseExpiryDate: '2026-10-15',
    department: 'العلاقات العامة والإدارة',
    status: 'active',
    notes: 'سائق المنهج الإداري'
  },
  {
    id: 'd-5',
    name: 'طارق محمود السيد',
    phone: '0585556677',
    idNumber: '2489123091',
    licenseNumber: 'DL-551092',
    licenseCategory: 'نقل ثقيل',
    licenseExpiryDate: '2026-08-25', // قريبة
    department: 'شحن النقل الخارجي',
    status: 'active',
    notes: 'سائق الخطوط الطويلة'
  },
  {
    id: 'd-6',
    name: 'يوسف عمر القحطاني',
    phone: '0596667788',
    idNumber: '1054923812',
    licenseNumber: 'DL-441098',
    licenseCategory: 'نقل خفيف',
    licenseExpiryDate: '2027-03-10',
    department: 'قسم المستودعات والتوصيل',
    status: 'active',
    notes: 'سائق الفان والمستودع'
  }
];

export const initialGarages: Garage[] = [
  {
    id: 'g-1',
    name: 'مركز العالمية لصيانة السيارات الشاملة',
    phone: '0112345678',
    contactPerson: 'المهندس حسام',
    address: 'الرياض - حي الصناعية القديمة - شارع 18',
    rating: 4.8,
    specialty: 'ميكانيكا، كهرباء، فحص كمبيوتر'
  },
  {
    id: 'g-2',
    name: 'ورشة السلامة لخدمات الفرامل والإطارات',
    phone: '0119876543',
    contactPerson: 'أبو فهد',
    address: 'الرياض - مخرج 17 - حي الملز',
    rating: 4.5,
    specialty: 'فرامل، ميزان، إطارات ونظام التعليق'
  },
  {
    id: 'g-3',
    name: 'مركز الأمان لصيانة الشاحنات والمحركات الديزل',
    phone: '0114443322',
    contactPerson: 'المهندس مصطفى',
    address: 'الرياض - طريق الخرج الجديد - كيلو 12',
    rating: 4.6,
    specialty: 'محركات الديزل للشاحنات الكبيرة'
  },
  {
    id: 'g-4',
    name: 'ورشة النجوم للتكييف والكهرباء',
    phone: '0115556677',
    contactPerson: 'أبو علي',
    address: 'الرياض - شارع المعارض',
    rating: 4.2,
    specialty: 'تكييف وسيستم الكهرباء'
  }
];

export const initialMaintenanceRecords: MaintenanceRecord[] = [
  {
    id: 'm-1001',
    vehicleId: 'v-103',
    garageId: 'g-1',
    date: '2026-07-20',
    type: 'breakdown',
    description: 'تغيير قماشات فرامل مع خرط الهوبات وتغيير زيت المحرك ومرشح الزيت',
    parts: [
      { id: 'p-1', partName: 'قماشات فرامل أمامية', category: 'brakes', quantity: 1, unitCost: 350 },
      { id: 'p-2', partName: 'قماشات فرامل خلفية', category: 'brakes', quantity: 1, unitCost: 280 },
      { id: 'p-3', partName: 'فلتر زيت أصلي', category: 'oils_filters', quantity: 1, unitCost: 45 },
      { id: 'p-4', partName: 'زيت محرك ديزل 10W40 (8 لتر)', category: 'oils_filters', quantity: 1, unitCost: 220 }
    ],
    laborCost: 300,
    totalCost: 1195,
    invoiceNumber: 'INV-2026-881',
    odometerReading: 128500,
    status: 'completed',
    notes: 'تم فحص أداء السير والفرامل بعد الصيانة'
  },
  {
    id: 'm-1002',
    vehicleId: 'v-101',
    garageId: 'g-2',
    date: '2026-07-10',
    type: 'periodic',
    description: 'تغيير طقم إطارات 4 قطع مع ترصيص وميزان أذرعة',
    parts: [
      { id: 'p-5', partName: 'إطارات ميتشلان R16', category: 'tires', quantity: 4, unitCost: 450 },
      { id: 'p-6', partName: 'بلوف هواء رياضية', category: 'tires', quantity: 4, unitCost: 15 }
    ],
    laborCost: 200,
    totalCost: 2060,
    invoiceNumber: 'INV-2026-442',
    odometerReading: 82000,
    status: 'completed',
    notes: 'ضمان الإطارات لمدة سنة كاملة'
  },
  {
    id: 'm-1003',
    vehicleId: 'v-105',
    garageId: 'g-3',
    date: '2026-06-25',
    type: 'breakdown',
    description: 'تأهيل طلمبة الديزل وتغيير فلاتر الوقود للشاحنة',
    parts: [
      { id: 'p-7', partName: 'فلتر ديزل رئيسي', category: 'oils_filters', quantity: 2, unitCost: 180 },
      { id: 'p-8', partName: 'طقم بخاخات ديزل', category: 'engine', quantity: 1, unitCost: 2400 }
    ],
    laborCost: 850,
    totalCost: 3610,
    invoiceNumber: 'INV-2026-903',
    odometerReading: 211000,
    status: 'pending_payment',
    notes: 'تحسن ملحوظ في أداء المحرك وعزم الديزل - فاتورة معلقة بالآجل'
  },
  {
    id: 'm-1004',
    vehicleId: 'v-102',
    garageId: 'g-4',
    date: '2026-06-15',
    type: 'emergency',
    description: 'تغيير كمبروسر المكيف وشحن فريون أصلي',
    parts: [
      { id: 'p-9', partName: 'كمبروسر مكيف هيونداي', category: 'electrical', quantity: 1, unitCost: 1250 },
      { id: 'p-10', partName: 'غاز فريون R134a', category: 'electrical', quantity: 1, unitCost: 180 },
      { id: 'p-11', partName: 'فلتر مكيف هواء', category: 'oils_filters', quantity: 1, unitCost: 60 }
    ],
    laborCost: 350,
    totalCost: 1840,
    invoiceNumber: 'INV-2026-112',
    odometerReading: 39500,
    status: 'completed',
    notes: 'التكييف يعمل بكفاءة برودة عالية'
  },
  {
    id: 'm-1005',
    vehicleId: 'v-103',
    garageId: 'g-1',
    date: '2026-05-18',
    type: 'breakdown',
    description: 'تغيير سير الماكينة وبطارية السيارات',
    parts: [
      { id: 'p-12', partName: 'بطارية 80 أمبير هانكوك', category: 'electrical', quantity: 1, unitCost: 380 },
      { id: 'p-13', partName: 'سير محرك أصلي', category: 'engine', quantity: 1, unitCost: 160 }
    ],
    laborCost: 120,
    totalCost: 660,
    invoiceNumber: 'INV-2026-554',
    odometerReading: 121000,
    status: 'completed'
  },
  {
    id: 'm-1006',
    vehicleId: 'v-106',
    garageId: 'g-2',
    date: '2026-05-02',
    type: 'periodic',
    description: 'تغيير قماشات فرامل وأقراص ديسكات',
    parts: [
      { id: 'p-14', partName: 'قماشات فرامل أمامية', category: 'brakes', quantity: 1, unitCost: 320 },
      { id: 'p-15', partName: 'ديسكات فرامل فورد', category: 'brakes', quantity: 2, unitCost: 480 }
    ],
    laborCost: 250,
    totalCost: 1530,
    invoiceNumber: 'INV-2026-229',
    odometerReading: 93000,
    status: 'completed'
  }
];

export const initialFuelRecords: FuelRecord[] = [
  {
    id: 'f-1',
    vehicleId: 'v-101',
    driverId: 'd-1',
    date: '2026-07-22',
    liters: 65,
    costPerLiter: 2.18,
    totalCost: 141.7,
    odometerReading: 84480,
    stationName: 'محطة الدريس - مخرج 15',
    notes: 'تعبئة ديزل كاملة - حساب آجل مع المحطة',
    paymentStatus: 'pending'
  },
  {
    id: 'f-2',
    vehicleId: 'v-102',
    driverId: 'd-2',
    date: '2026-07-21',
    liters: 45,
    costPerLiter: 2.33,
    totalCost: 104.85,
    odometerReading: 42050,
    stationName: 'محطة ساسكو - طريق الملك فهد',
    notes: 'بنزين 91',
    paymentStatus: 'paid'
  },
  {
    id: 'f-3',
    vehicleId: 'v-105',
    driverId: 'd-5',
    date: '2026-07-20',
    liters: 280,
    costPerLiter: 2.18,
    totalCost: 610.4,
    odometerReading: 214800,
    stationName: 'محطة أرامكو لتر - طريق الدمام',
    notes: 'تعبئة شاحنة مرسيدس قبل الرحلة - حساب آجل مع المحطة',
    paymentStatus: 'pending'
  },
  {
    id: 'f-4',
    vehicleId: 'v-104',
    driverId: 'd-4',
    date: '2026-07-18',
    liters: 38,
    costPerLiter: 2.33,
    totalCost: 88.54,
    odometerReading: 62900,
    stationName: 'محطة تسهيلات',
    notes: 'بنزين 91'
  },
  {
    id: 'f-5',
    vehicleId: 'v-106',
    driverId: 'd-6',
    date: '2026-07-15',
    liters: 70,
    costPerLiter: 2.18,
    totalCost: 152.6,
    odometerReading: 97600,
    stationName: 'محطة الدريس',
    notes: 'تعبئة ديزل للفان'
  },
  {
    id: 'f-6',
    vehicleId: 'v-103',
    driverId: 'd-3',
    date: '2026-07-10',
    liters: 75,
    costPerLiter: 2.18,
    totalCost: 163.5,
    odometerReading: 128100,
    stationName: 'محطة أرامكو',
    notes: 'تعبئة ديزل'
  },
  {
    id: 'f-7',
    vehicleId: 'v-105',
    driverId: 'd-5',
    date: '2026-06-28',
    liters: 260,
    costPerLiter: 2.18,
    totalCost: 566.8,
    odometerReading: 213200,
    stationName: 'محطة ساسكو الشرقية',
    notes: 'رحلة الرياض - الخبر'
  },
  {
    id: 'f-8',
    vehicleId: 'v-101',
    driverId: 'd-1',
    date: '2026-06-18',
    liters: 60,
    costPerLiter: 2.18,
    totalCost: 130.8,
    odometerReading: 83100,
    stationName: 'محطة الدريس',
    notes: 'تعبئة ديزل'
  },
  {
    id: 'f-9',
    vehicleId: 'v-102',
    driverId: 'd-2',
    date: '2026-06-12',
    liters: 50,
    costPerLiter: 2.33,
    totalCost: 116.5,
    odometerReading: 41200,
    stationName: 'محطة نفط',
    notes: 'بنزين 91'
  },
  {
    id: 'f-10',
    vehicleId: 'v-106',
    driverId: 'd-6',
    date: '2026-05-25',
    liters: 68,
    costPerLiter: 2.18,
    totalCost: 148.24,
    odometerReading: 95400,
    stationName: 'محطة تسهيلات',
    notes: 'تعبئة ديزل للفان'
  },
  {
    id: 'f-11',
    vehicleId: 'v-105',
    driverId: 'd-5',
    date: '2026-05-14',
    liters: 290,
    costPerLiter: 2.18,
    totalCost: 632.2,
    odometerReading: 210500,
    stationName: 'محطة ساسكو',
    notes: 'تعبئة الشاحنة'
  },
  {
    id: 'f-12',
    vehicleId: 'v-104',
    driverId: 'd-4',
    date: '2026-05-02',
    liters: 40,
    costPerLiter: 2.33,
    totalCost: 93.2,
    odometerReading: 61200,
    stationName: 'محطة نفط',
    notes: 'بنزين 91'
  },
  {
    id: 'f-13',
    vehicleId: 'v-101',
    driverId: 'd-1',
    date: '2026-04-20',
    liters: 62,
    costPerLiter: 2.18,
    totalCost: 135.16,
    odometerReading: 81500,
    stationName: 'محطة الدريس',
    notes: 'تعبئة ديزل'
  },
  {
    id: 'f-14',
    vehicleId: 'v-103',
    driverId: 'd-3',
    date: '2026-04-10',
    liters: 72,
    costPerLiter: 2.18,
    totalCost: 156.96,
    odometerReading: 125800,
    stationName: 'محطة أرامكو',
    notes: 'تعبئة ديزل'
  },
  {
    id: 'f-15',
    vehicleId: 'v-105',
    driverId: 'd-5',
    date: '2026-03-22',
    liters: 275,
    costPerLiter: 2.18,
    totalCost: 599.5,
    odometerReading: 207000,
    stationName: 'محطة ساسكو',
    notes: 'تعبئة الشاحنة'
  },
  {
    id: 'f-16',
    vehicleId: 'v-102',
    driverId: 'd-2',
    date: '2026-03-08',
    liters: 48,
    costPerLiter: 2.33,
    totalCost: 111.84,
    odometerReading: 39800,
    stationName: 'محطة نفط',
    notes: 'بنزين 91'
  },
  {
    id: 'f-17',
    vehicleId: 'v-101',
    driverId: 'd-1',
    date: '2026-02-15',
    liters: 64,
    costPerLiter: 2.18,
    totalCost: 139.52,
    odometerReading: 79800,
    stationName: 'محطة الدريس',
    notes: 'تعبئة ديزل'
  },
  {
    id: 'f-18',
    vehicleId: 'v-106',
    driverId: 'd-6',
    date: '2026-02-04',
    liters: 65,
    costPerLiter: 2.18,
    totalCost: 141.7,
    odometerReading: 92100,
    stationName: 'محطة تسهيلات',
    notes: 'تعبئة ديزل'
  }
];

export const initialExpenseRecords: ExpenseRecord[] = [
  {
    id: 'e-1',
    vehicleId: 'v-101',
    type: 'registration_renewal',
    title: 'تجديد رخصة سير الاستمارة',
    amount: 300,
    date: '2025-08-14',
    description: 'رسوم تجديد الاستمارة لمدة 3 سنوات عبر أبشر',
    receiptNumber: 'ABS-9923812'
  },
  {
    id: 'e-2',
    vehicleId: 'v-101',
    type: 'insurance_renewal',
    title: 'وثيقة التأمين الشامل',
    amount: 1850,
    date: '2025-08-01',
    description: 'تأمين شامل شركة التعاونية',
    receiptNumber: 'INS-2025-091'
  },
  {
    id: 'e-3',
    vehicleId: 'v-103',
    type: 'fines',
    title: 'مخالفة مرورية - تجاوز السرعة',
    amount: 150,
    date: '2026-06-04',
    description: 'مخالفة ساهر على طريق الملك عبد الله',
    receiptNumber: 'FN-8812391'
  },
  {
    id: 'e-4',
    vehicleId: 'v-105',
    type: 'inspection',
    title: 'رسوم الفحص الدوري للشاحنة',
    amount: 230,
    date: '2026-05-10',
    description: 'محطة الفحص الدوري جنوب الرياض',
    receiptNumber: 'INSP-44912'
  }
];

export const initialCheckoutSessions: CheckoutSession[] = [
  {
    id: 'chk-2001',
    vehicleId: 'v-102',
    driverId: 'd-2',
    purpose: 'official',
    purposeCustom: 'مهمة زيارة عملاء المبيعات في الملز',
    checkoutTime: '2026-07-23T08:30',
    checkoutOdometer: 42000,
    checkoutFuelLevel: '100%',
    checkoutSignature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M 10 50 Q 50 10 90 50 T 170 50" fill="none" stroke="%231e3a8a" stroke-width="3"/></svg>',
    checkoutNotes: 'السيارة نظيفة وبحالة ممتازة عند الخروج',
    status: 'active'
  },
  {
    id: 'chk-2000',
    vehicleId: 'v-104',
    driverId: 'd-4',
    purpose: 'quick_task',
    purposeCustom: 'استخدام سريع ساعة - إحضار وثائق من البريد الممتاز',
    checkoutTime: '2026-07-22T10:00',
    checkoutOdometer: 62850,
    checkoutFuelLevel: '75%',
    checkoutSignature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M 10 40 Q 60 80 110 30 T 180 60" fill="none" stroke="%23047857" stroke-width="3"/></svg>',
    checkoutNotes: 'مهمة بريدية سريعة أقل من ساعة',
    returnTime: '2026-07-22T10:45',
    returnOdometer: 62875,
    returnFuelLevel: '75%',
    returnSignature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M 10 40 Q 60 80 110 30 T 180 60" fill="none" stroke="%23047857" stroke-width="3"/></svg>',
    returnNotes: 'تمت العودة خلال 45 دقيقة وسليمة بدون أي ملاحظات',
    status: 'completed'
  }
];

export const initialCompanyDocuments: CompanyDocument[] = [
  {
    id: 'doc-101',
    title: 'عقد إيجار وتمويل سيارة تويوتا هايلكس 2024',
    type: 'contract',
    linkedEntityType: 'vehicle',
    linkedEntityId: 'v-101',
    uploadDate: '2026-01-15',
    expiryDate: '2028-01-14',
    notes: 'نسخة ممسوخة ضوئياً من عقد التمويل التجاري المبرم مع الشركة',
    documentImageBase64: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" fill="none"><rect width="600" height="800" fill="%23f8fafc"/><rect x="40" y="40" width="520" height="720" rx="12" fill="white" stroke="%23cbd5e1" stroke-width="2"/><text x="300" y="100" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="%231e293b" text-anchor="middle">عقد تمويل ونقل ملكية مركبة</text><text x="300" y="130" font-family="Arial, sans-serif" font-size="14" fill="%2364748b" text-anchor="middle">Toyota Hilux 2024 - Plate: 1234-RSD</text><line x1="80" y1="160" x2="520" y2="160" stroke="%230284c7" stroke-width="2"/><rect x="80" y="190" width="440" height="120" rx="8" fill="%23f1f5f9"/><text x="100" y="220" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="%23334155">الطرف الأول: شركة التمويل المتحد</text><text x="100" y="250" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="%23334155">الطرف الثاني: YAMANIX</text><text x="100" y="280" font-family="Arial, sans-serif" font-size="13" fill="%23475569">رقم الشاسي VIN: MHFJW22G405109283</text><rect x="80" y="340" width="440" height="280" rx="8" fill="%23fafafa" stroke="%23e2e8f0"/><text x="100" y="375" font-family="Arial, sans-serif" font-size="12" fill="%2364748b">• مدة العقد: 24 شهراً تبدأ من 15 يناير 2026</text><text x="100" y="410" font-family="Arial, sans-serif" font-size="12" fill="%2364748b">• قيمة القسط الشهري: 2,850 ريال سعودي</text><text x="100" y="445" font-family="Arial, sans-serif" font-size="12" fill="%2364748b">• تغطية التأمين الشامل متضمنة في القسط</text><rect x="100" y="660" width="160" height="60" rx="4" fill="%23f8fafc" stroke="%23cbd5e1"/><text x="180" y="695" font-family="Arial, sans-serif" font-size="11" fill="%230284c7" text-anchor="middle">ختم ومصادقة الشركة</text></svg>'
  },
  {
    id: 'doc-102',
    title: 'وثيقة التأمين الشامل - شاحنة مرسيدس أكتيروس',
    type: 'insurance',
    linkedEntityType: 'vehicle',
    linkedEntityId: 'v-103',
    uploadDate: '2026-03-01',
    expiryDate: '2027-03-01',
    notes: 'وثيقة التأمين الشامل الصادرة عن شركة التعاونية للتأمين رقم POL-99283-SA',
    documentImageBase64: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" fill="none"><rect width="600" height="800" fill="%23f8fafc"/><rect x="40" y="40" width="520" height="720" rx="12" fill="white" stroke="%23cbd5e1" stroke-width="2"/><text x="300" y="100" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="%23047857" text-anchor="middle">وثيقة تأمين شامل للمركبات</text><text x="300" y="130" font-family="Arial, sans-serif" font-size="14" fill="%2364748b" text-anchor="middle">Tawuniya Insurance Policy - Mercedes Actros</text><line x1="80" y1="160" x2="520" y2="160" stroke="%23059669" stroke-width="2"/><rect x="80" y="190" width="440" height="150" rx="8" fill="%23ecfdf5"/><text x="100" y="225" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="%23065f46">رقم الوثيقة: POL-99283-SA</text><text x="100" y="255" font-family="Arial, sans-serif" font-size="13" fill="%23047857">اسم المؤمن له: YAMANIX</text><text x="100" y="285" font-family="Arial, sans-serif" font-size="13" fill="%23047857">رقم لوحة الشاحنة: 9912-KSA</text><text x="100" y="315" font-family="Arial, sans-serif" font-size="13" fill="%23047857">تاريخ الانتهاء: 01 مارس 2027</text></svg>'
  },
  {
    id: 'doc-103',
    title: 'عقد عمل ورخصة قيادة السائق أحمد علي',
    type: 'contract',
    linkedEntityType: 'driver',
    linkedEntityId: 'd-1',
    uploadDate: '2026-02-10',
    expiryDate: '2027-11-20',
    notes: 'صورة رخصة القيادة العمومية + عقد العمل الموثق مع السائق',
    documentImageBase64: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" fill="none"><rect width="600" height="800" fill="%23f8fafc"/><rect x="40" y="40" width="520" height="720" rx="12" fill="white" stroke="%23cbd5e1" stroke-width="2"/><text x="300" y="100" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="%231e1b4b" text-anchor="middle">عقد عمل وسجل سائق أسطول</text><text x="300" y="130" font-family="Arial, sans-serif" font-size="14" fill="%2364748b" text-anchor="middle">Driver Contract & ID - Ahmed Ali</text><line x1="80" y1="160" x2="520" y2="160" stroke="%234338ca" stroke-width="2"/><rect x="80" y="190" width="440" height="160" rx="8" fill="%23eef2ff"/><text x="100" y="225" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="%23312e81">اسم السائق: أحمد علي العتيبي</text><text x="100" y="255" font-family="Arial, sans-serif" font-size="13" fill="%233730a3">رقم الإقامة / الهوية: 1092837461</text><text x="100" y="285" font-family="Arial, sans-serif" font-size="13" fill="%233730a3">فئة رخصة القيادة: نقل ثقيل وتريلات</text><text x="100" y="315" font-family="Arial, sans-serif" font-size="13" fill="%233730a3">حالة الفحص الطبي والتوثيق: مكتمل ومطابق</text></svg>'
  }
];
