import { 
  CompanyProfile, 
  User, 
  AttendanceRecord, 
  OvertimeRecord, 
  ProductionRecord,
  ProductionSize,
  LeaveRecord,
  ExpenseRecord,
  PurchaseRecord,
  SaleRecord,
  ProductRequest,
  PayrollPayment,
  DutySettings
} from './types';

export const MASTER_ADMIN_PASS = crypto.randomUUID();
export const DEFAULT_FIREBASE_URL = 'https://database-ffe41-default-rtdb.firebaseio.com/';

export const INITIAL_DUTY_SETTINGS: DutySettings = {
  startHour: '09:00',
  endHour: '18:00',
  graceMinutes: 15,
  defaultOvertimeStart: '18:00'
};
export const DEFAULT_DUTY_SETTINGS = INITIAL_DUTY_SETTINGS;

export const INITIAL_COMPANY_PROFILE: CompanyProfile = {
  name: 'Creative Accessories Factory',
  logoUrl: '',
  bannerUrl: '',
  contactNumber: '01756628160',
  email: 'contact@creativeaccessories.com',
  address: 'Bamnartek, Dhaka 1230, Bangladesh',
  factoryRegNo: 'CAF-IND-94821',
  establishedYear: '2014',
  noticeTitle: 'ফ্যাক্টরি জরুরি নোটিশ ও কাজের সময়সূচী',
  noticeText: 'সকল সেকশনের কর্মীদের সকাল ৯:০০ টার মধ্যে উপস্থিত থাকার জন্য অনুরোধ করা হচ্ছে। ফ্যাক্টরি রেগুলার ডিউটি: সকাল ৯:০০ - সন্ধ্যা ৬:০০, এরপরের কাজ ওভারটাইম হিসেবে গণ্য হবে।',
  noticeDate: '2026-10-18',
  mentionedUserIds: [],
  mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d471.8386017066733!2d90.38116327282027!3d23.884990661020723!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c473c76676e9%3A0x68fd27d664e0676a!2sBamnartek%2C%20Dhaka%201230!5e1!3m2!1sen!2sbd!4v1792344078026!5m2!1sen!2sbd',
  dutySettings: INITIAL_DUTY_SETTINGS
};

export const INITIAL_SECTIONS = [
  'Sewing',
  'Cutting',
  'Finishing',
  'Packaging',
  'Quality Control',
  'Maintenance',
  'HR & Admin'
];

export const INITIAL_SIZES: ProductionSize[] = [
  { id: 'sz-1', name: 'XS', isActive: true, order: 1 },
  { id: 'sz-2', name: 'S', isActive: true, order: 2 },
  { id: 'sz-3', name: 'M', isActive: true, order: 3 },
  { id: 'sz-4', name: 'L', isActive: true, order: 4 },
  { id: 'sz-5', name: 'XL', isActive: true, order: 5 },
  { id: 'sz-6', name: 'XXL', isActive: true, order: 6 },
  { id: 'sz-7', name: '3XL', isActive: true, order: 7 },
  { id: 'sz-8', name: '4XL', isActive: true, order: 8 },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'u-hosting-1',
    fullName: 'Mojnu Hossain (Admin)',
    photoUrl: '',
    accountType: 'hosting',
    adminAccess: 'full',
    designation: 'Hosting Super Admin',
    section: 'Management',
    department: 'Operations & IT',
    username: 'admin',
    password: crypto.randomUUID(),
    employeeId: 'CAF-001',
    joiningDate: '2014-03-01',
    whatsapp: '01756628160',
    accountStatus: 'Active',
    basicSalary: 95000,
    hourlyRate: 395.83,
    salaryType: 'monthly'
  },
  {
    id: 'u-owner-1',
    fullName: 'Kamrul Hassan',
    photoUrl: '',
    accountType: 'owner',
    adminAccess: 'full',
    designation: 'Factory Owner & Investor',
    section: 'Management',
    department: 'Executive Board',
    username: 'owner',
    password: crypto.randomUUID(),
    employeeId: 'CAF-003',
    joiningDate: '2014-01-01',
    whatsapp: '+8801711122334',
    accountStatus: 'Active',
    basicSalary: 150000,
    hourlyRate: 625.00,
    salaryType: 'monthly'
  },
  {
    id: 'u-md-1',
    fullName: 'Tariqul Islam',
    photoUrl: '',
    accountType: 'md',
    adminAccess: 'full',
    designation: 'MD',
    isMd: true,
    section: 'Management',
    department: 'Executive Board',
    username: 'tariqul_md',
    password: crypto.randomUUID(),
    employeeId: 'CAF-002',
    joiningDate: '2014-05-15',
    whatsapp: '+8801712345679',
    accountStatus: 'Active',
    basicSalary: 120000,
    hourlyRate: 500.00,
    salaryType: 'monthly'
  }
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];
export const INITIAL_OVERTIME: OvertimeRecord[] = [];
export const INITIAL_PRODUCTIONS: ProductionRecord[] = [];
export const INITIAL_LEAVES: LeaveRecord[] = [];
export const INITIAL_EXPENSES: ExpenseRecord[] = [];
export const INITIAL_PURCHASES: PurchaseRecord[] = [];
export const INITIAL_PRODUCT_REQUESTS: ProductRequest[] = [];
export const INITIAL_PAYMENTS: PayrollPayment[] = [];
export const INITIAL_SALES: SaleRecord[] = [];

/**
 * Standard factory overtime hourly rate formula:
 * Hourly Rate = Monthly Salary ÷ 30 ÷ 8
 */
export function calculateAutoHourlyRate(salaryValue: number | string): number {
  const num = typeof salaryValue === 'string' ? parseFloat(salaryValue) : salaryValue;
  if (isNaN(num) || num <= 0) return 0;
  return Number(((num / 30) / 8).toFixed(2));
}

/**
 * Comparison logic for previous purchase price:
 * Compares with most recent purchase for the exact same product and unit.
 */
export interface PurchasePriceComparisonResult {
  hasPrevious: boolean;
  productName: string;
  unit: string;
  supplier?: string;
  previousDate?: string;
  previousPrice: number;
  currentPrice: number;
  diff: number;
  percentDiff: number;
  trend: 'increased' | 'decreased' | 'unchanged' | 'no_history';
  message: string;
}

export function comparePurchasePrice(
  currentProductName: string,
  currentUnit: string,
  currentUnitPrice: number,
  allPurchases: PurchaseRecord[],
  excludePurchaseId?: string
): PurchasePriceComparisonResult {
  const cleanName = currentProductName.trim().toLowerCase();
  const cleanUnit = currentUnit.trim().toLowerCase();

  if (!cleanName || currentUnitPrice <= 0) {
    return {
      hasPrevious: false,
      productName: currentProductName,
      unit: currentUnit,
      previousPrice: 0,
      currentPrice: currentUnitPrice,
      diff: 0,
      percentDiff: 0,
      trend: 'no_history',
      message: 'No previous price available'
    };
  }

  // Find previous purchases of matching product and unit, sorted newest first
  const matching = allPurchases
    .filter(p => 
      p.id !== excludePurchaseId &&
      p.productName.trim().toLowerCase() === cleanName &&
      p.unit.trim().toLowerCase() === cleanUnit &&
      p.unitPrice > 0
    )
    .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());

  if (matching.length === 0) {
    return {
      hasPrevious: false,
      productName: currentProductName,
      unit: currentUnit,
      previousPrice: 0,
      currentPrice: currentUnitPrice,
      diff: 0,
      percentDiff: 0,
      trend: 'no_history',
      message: 'No previous price available'
    };
  }

  const prev = matching[0];
  const diff = Number((currentUnitPrice - prev.unitPrice).toFixed(2));
  const percentDiff = prev.unitPrice > 0 
    ? Number((((currentUnitPrice - prev.unitPrice) / prev.unitPrice) * 100).toFixed(1))
    : 0;

  let trend: 'increased' | 'decreased' | 'unchanged' = 'unchanged';
  let message = 'No change in unit price';

  if (diff > 0.001) {
    trend = 'increased';
    message = `Price increased by ৳${diff.toFixed(2)} (+${percentDiff}%) compared to previous purchase (${prev.transactionDate.split(' ')[0]})`;
  } else if (diff < -0.001) {
    trend = 'decreased';
    message = `Price decreased by ৳${Math.abs(diff).toFixed(2)} (${percentDiff}%) compared to previous purchase (${prev.transactionDate.split(' ')[0]})`;
  }

  return {
    hasPrevious: true,
    productName: prev.productName,
    unit: prev.unit,
    supplier: prev.supplier,
    previousDate: prev.transactionDate,
    previousPrice: prev.unitPrice,
    currentPrice: currentUnitPrice,
    diff,
    percentDiff,
    trend,
    message
  };
}

export function normalizeFirebaseUrl(url: string): string {
  if (!url) return '';
  let clean = url.trim().replace(/\/+$/, '');
  if (clean.endsWith('.json')) clean = clean.replace(/\/[^/]+\.json$/, '');
  return clean;
}

export function formatJoiningDate(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function getInitials(name?: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
