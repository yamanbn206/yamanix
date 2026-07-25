export type VehicleStatus = 'available' | 'checked_out' | 'maintenance' | 'out_of_service';

export interface Company {
  id: string;
  name: string; // اسم الشركة
  code?: string; // كود الشركة (رمز اختصاري مثل YMN / MSR)
  tagline?: string; // النشاط / الشعار النصي
  logoUrl?: string; // رابط اللوجو
  phone?: string;
  email?: string;
  address?: string;
  commercialRegNumber?: string; // السجل التجاري / الرقم الضريبي
  currency?: string; // العملة
  isDefault?: boolean;
  createdAt?: string;
}

export interface Vehicle {
  id: string;
  companyId?: string; // معرف الشركة الممتلكة
  plateNumber: string; // رقم اللوحة
  make: string; // الماركة (مثال: تويوتا)
  model: string; // الموديل (مثال: هايلكس)
  year: number; // سنة الصنع
  color: string; // اللون
  vinNumber?: string; // رقم الهيكل
  status: VehicleStatus;
  mileage: number; // عداد الكيلومترات الحالي
  fuelType: '91' | '95' | 'diesel' | 'electric' | 'hybrid';
  licenseExpiryDate: string; // تاريخ انتهاء رخصة السير/الاستمارة
  insuranceExpiryDate: string; // تاريخ انتهاء وثيقة التأمين
  insuranceCompany: string; // شركة التأمين
  policyNumber: string; // رقم وثيقة التأمين
  assignedDriverId?: string; // السائق المخصص
  nextServiceMileage?: number; // القراءة المستهدفة للصيانة القادمة (بالكم)
  serviceIntervalKm?: number; // فاصل الصيانة الدوري بالكم (افتراضي 5000 أو 10000)
  notes?: string;
  photoUrl?: string;
}

export interface Driver {
  id: string;
  companyId?: string; // معرف الشركة
  name: string; // اسم السائق
  phone: string; // رقم الجوال
  idNumber: string; // رقم الهوية/الإقامة
  licenseNumber: string; // رقم رخصة القيادة
  licenseCategory: string; // فئة الرخصة (نقل خفيف، نقل ثقيل، خصوصي)
  licenseExpiryDate: string; // تاريخ انتهاء رخصة القيادة
  department: string; // القسم / الإدارة
  status: 'active' | 'inactive';
  notes?: string;
  avatarUrl?: string;
}

export interface Garage {
  id: string;
  companyId?: string;
  name: string; // اسم الكراج / الورشة
  phone: string;
  contactPerson: string; // مسؤول التواصل
  address: string;
  rating?: number; // تقييم الكراج 1-5
  specialty: string; // التخصص (ميكانيك، كهرباء، سمكرة وصباغة، شامل)
}

export interface SparePartItem {
  id: string;
  partName: string; // اسم القطعة (فلاتر، قماشات فرامل، إطارات، سير محرك...)
  category: 'engine' | 'brakes' | 'tires' | 'suspension' | 'electrical' | 'oils_filters' | 'body' | 'other';
  quantity: number; // الكمية
  unitCost: number; // سعر القطعة
}

export interface MaintenanceRecord {
  id: string;
  companyId?: string;
  vehicleId: string;
  garageId: string;
  date: string; // تاريخ الصيانة
  type: 'periodic' | 'breakdown' | 'emergency' | 'accident';
  description: string; // وصف المشكلة/الصيانة
  parts: SparePartItem[]; // القطع المستبدلة
  laborCost: number; // أجرة اليد / المصنعية
  totalCost: number; // التكلفة الإجمالية (المصنعية + القطع)
  invoiceNumber: string; // رقم الفاتورة
  odometerReading: number; // عداد الكيلومترات وقت الصيانة
  status: 'completed' | 'pending_payment';
  notes?: string;
}

export interface FuelRecord {
  id: string;
  companyId?: string;
  vehicleId: string;
  driverId: string;
  date: string;
  liters: number; // عدد اللترات
  costPerLiter: number; // سعر اللتر
  totalCost: number; // المبلغ الإجمالي
  odometerReading: number; // قراءة العداد
  stationName: string; // اسم المحطة
  notes?: string;
  paymentStatus?: 'paid' | 'pending'; // حالة الدفع: مدفوعة أو معلقة
}

export interface ExpenseRecord {
  id: string;
  companyId?: string;
  vehicleId: string;
  type: 'registration_renewal' | 'insurance_renewal' | 'fines' | 'inspection' | 'wash_cleaning' | 'other';
  title: string;
  amount: number;
  date: string;
  description?: string;
  receiptNumber?: string;
  paymentStatus?: 'paid' | 'pending'; // حالة الدفع: مدفوعة أو معلقة
}

export interface InspectionChecklist {
  noScratches?: boolean; // خلو السيارة من الخدوش والصدمات
  spareTire?: boolean; // الإطار الاحتياطي ورافعة العجلات
  fireExtinguisher?: boolean; // طفاية الحريق
  warningTriangle?: boolean; // مثلث السلامة والإسعافات
  registrationDoc?: boolean; // وجود رخصة سير المركبة/الاستمارة
  cleanliness?: boolean; // نظافة الهيكل والمقصورة
}

export interface CheckoutSession {
  id: string;
  companyId?: string;
  vehicleId: string;
  driverId: string;
  purpose: 'official' | 'client_delivery' | 'maintenance' | 'quick_task' | 'personal_temporary' | 'other';
  purposeCustom?: string;
  
  // Checkout Info
  checkoutTime: string;
  checkoutOdometer: number;
  checkoutFuelLevel: '100%' | '75%' | '50%' | '25%' | '10%';
  checkoutSignature: string; // Base64 Canvas Image
  checkoutNotes?: string;
  checkoutChecklist?: InspectionChecklist;
  
  // Return Info
  returnTime?: string;
  returnOdometer?: number;
  returnFuelLevel?: '100%' | '75%' | '50%' | '25%' | '10%';
  returnSignature?: string; // Base64 Canvas Image
  returnNotes?: string;
  returnChecklist?: InspectionChecklist;
  
  status: 'active' | 'completed';
}

export interface CompanySettings {
  companyId?: string;
  companyName: string; // اسم الشركة
  tagline: string; // النشاط / الشعار النصي
  logoUrl: string; // رابط اللوجو أو base64
  phone: string; // رقم الهاتف/الواتساب
  email: string; // البريد الإلكتروني
  address: string; // العنوان
  commercialRegNumber: string; // السجل التجاري / الرقم الضريبي
  printHeaderNote: string; // ملاحظة هيدر التقارير
  printFooterNote: string; // ملاحظة فوتر التقارير والتوقيعات
  currency?: string; // العملة المعتمدة للنظام (SAR, USD, AED, EUR, etc.)
}

export interface CompanyDocument {
  id: string;
  companyId?: string;
  title: string;
  type: 'contract' | 'insurance' | 'license' | 'commercial_reg' | 'other';
  linkedEntityType: 'vehicle' | 'driver' | 'company';
  linkedEntityId?: string; // vehicleId or driverId
  uploadDate: string;
  documentImageBase64: string; // scanned photo
  notes?: string;
  expiryDate?: string;
}
