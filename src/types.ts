export type VehicleStatus = 'available' | 'checked_out' | 'maintenance' | 'out_of_service';

export interface Company {
  id: string;
  name: string;
  code?: string;
  tagline?: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  address?: string;
  commercialRegNumber?: string;
  currency?: string;
  isDefault?: boolean;
  createdAt?: string;
}

export interface Vehicle {
  id: string;
  companyId?: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  color: string;
  vinNumber?: string;
  status: VehicleStatus;
  mileage: number;
  fuelType: '91' | '95' | 'diesel' | 'electric' | 'hybrid';
  licenseExpiryDate: string;
  insuranceExpiryDate: string;
  insuranceCompany: string;
  policyNumber: string;
  assignedDriverId?: string;
  nextServiceMileage?: number;
  serviceIntervalKm?: number;
  notes?: string;
  photoUrl?: string;
  created_by?: string;
  updated_by?: string;
}

export interface Driver {
  id: string;
  companyId?: string;
  name: string;
  phone: string;
  idNumber: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: string;
  department: string;
  status: 'active' | 'inactive';
  notes?: string;
  avatarUrl?: string;
  created_by?: string;
  updated_by?: string;
}

export interface Garage {
  id: string;
  companyId?: string;
  name: string;
  phone: string;
  contactPerson: string;
  address: string;
  rating?: number;
  specialty: string;
  created_by?: string;
  updated_by?: string;
}

export interface SparePartItem {
  id: string;
  partName: string;
  category: 'engine' | 'brakes' | 'tires' | 'suspension' | 'electrical' | 'oils_filters' | 'body' | 'other';
  quantity: number;
  unitCost: number;
}

export interface MaintenanceRecord {
  id: string;
  companyId?: string;
  vehicleId: string;
  garageId: string;
  date: string;
  type: 'periodic' | 'breakdown' | 'emergency' | 'accident';
  description: string;
  parts: SparePartItem[];
  laborCost: number;
  totalCost: number;
  invoiceNumber: string;
  odometerReading: number;
  status: 'completed' | 'pending_payment';
  notes?: string;
  created_by?: string;
  updated_by?: string;
}

export interface FuelRecord {
  id: string;
  companyId?: string;
  vehicleId: string;
  driverId: string;
  date: string;
  liters: number;
  costPerLiter: number;
  totalCost: number;
  odometerReading: number;
  stationName: string;
  notes?: string;
  paymentStatus?: 'paid' | 'pending';
  created_by?: string;
  updated_by?: string;
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
  paymentStatus?: 'paid' | 'pending';
  created_by?: string;
  updated_by?: string;
}

export interface InspectionChecklist {
  noScratches?: boolean;
  spareTire?: boolean;
  fireExtinguisher?: boolean;
  warningTriangle?: boolean;
  registrationDoc?: boolean;
  cleanliness?: boolean;
}

export interface CheckoutSession {
  id: string;
  companyId?: string;
  vehicleId: string;
  driverId: string;
  purpose: 'official' | 'client_delivery' | 'maintenance' | 'quick_task' | 'personal_temporary' | 'other';
  purposeCustom?: string;
  checkoutTime: string;
  checkoutOdometer: number;
  checkoutFuelLevel: '100%' | '75%' | '50%' | '25%' | '10%';
  checkoutSignature: string;
  checkoutNotes?: string;
  checkoutChecklist?: InspectionChecklist;
  returnTime?: string;
  returnOdometer?: number;
  returnFuelLevel?: '100%' | '75%' | '50%' | '25%' | '10%';
  returnSignature?: string;
  returnNotes?: string;
  returnChecklist?: InspectionChecklist;
  status: 'active' | 'completed';
  created_by?: string;
  updated_by?: string;
}

export interface CompanySettings {
  companyId?: string;
  companyName: string;
  tagline: string;
  logoUrl: string;
  phone: string;
  email: string;
  address: string;
  commercialRegNumber: string;
  printHeaderNote: string;
  printFooterNote: string;
  currency?: string;
}

export interface CompanyDocument {
  id: string;
  companyId?: string;
  title: string;
  type: 'contract' | 'insurance' | 'license' | 'commercial_reg' | 'other';
  linkedEntityType: 'vehicle' | 'driver' | 'company';
  linkedEntityId?: string;
  uploadDate: string;
  documentImageBase64: string;
  notes?: string;
  expiryDate?: string;
  created_by?: string;
  updated_by?: string;
}

// ============================================================
// واجهة الملف الشخصي للمستخدم (Profile)
// ============================================================
export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'manager' | 'user' | 'disabled';
  created_at: string;
  updated_at: string;
}