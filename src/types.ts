export type AccountType = 'hosting' | 'owner' | 'md' | 'admin' | 'staff' | 'employee';

export type AdminAccessLevel = 'none' | 'basic' | 'full';

export type SalaryType = 'monthly' | 'daily' | 'hourly';

export interface User {
  id: string;
  fullName: string;
  photoUrl?: string;
  pendingPhotoUrl?: string;
  accountType: AccountType;
  adminAccess?: AdminAccessLevel;
  designation: string;
  section: string;
  department: string;
  username: string;
  password?: string;
  employeeId: string;
  joiningDate: string;
  registrationDate?: string;
  whatsapp?: string;
  accountStatus: 'Active' | 'Inactive' | 'Pending';
  basicSalary: number;
  hourlyRate: number;
  salaryType?: SalaryType;
  isMd?: boolean;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  status: 'Present' | 'Late' | 'Absent' | 'Leave';
  inTime: string;
  outTime: string;
  shift: string;
  leaveRecordId?: string;
  regularHours?: number;
  dailyOvertime?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  modifiedBy?: string;
}

export interface OvertimeRecord {
  id: string;
  userId: string;
  date: string;
  hours: number;
  section: string;
  reason: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  approvedBy?: string;
}

export interface ProductionRecord {
  id: string;
  userId: string;
  date: string;
  orderDate?: string;
  deliveryDate?: string;
  section: string;
  itemName: string;
  buyer: string;
  company: string;
  length?: string;
  size?: string;
  productType?: string;
  orderQty: number;
  prodQty: number;
  unit: string;
  unitPrice?: number;
  totalAmount?: number;
  startTime?: string;
  endTime?: string;
  hours?: number;
  status: 'Completed' | 'Running' | 'Delayed';
  notes?: string;
  editCount?: number;
  lastEditedBy?: string;
  lastEditedAt?: string;
}

export interface ProductionSize {
  id: string;
  name: string;
  isActive: boolean;
  order: number;
}

export type PaymentStatus = 'Paid' | 'Due' | 'Pending' | 'Partially Paid' | 'Unpaid';
export type PayrollStatusMap = Record<string, PaymentStatus>;

export interface PayrollPayment {
  id: string;
  userId: string;
  employeeId: string;
  month: string;
  amountDue: number;
  amountPaid: number;
  remainingBalance: number;
  paymentStatus: 'Unpaid' | 'Partially Paid' | 'Paid';
  paymentDate: string;
  paymentMethod: 'Cash' | 'bKash' | 'Nagad' | 'Bank Transfer' | 'Other';
  referenceNumber?: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
  updatedAt?: string;
}

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export interface LeaveRecord {
  id: string;
  userId: string;
  employeeId: string;
  employeeName: string;
  section: string;
  leaveType: 'Casual Leave' | 'Sick Leave' | 'Annual Leave' | 'Emergency Leave' | string;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  requestDate: string;
  status: LeaveStatus;
  approvedBy?: string;
  approvalDate?: string;
  approvalComments?: string;
  createdAt: string;
  updatedAt?: string;
}

export type ExpenseStatus = 'Pending' | 'Approved' | 'Rejected' | 'Returned';

export interface ExpenseRecord {
  id: string;
  type: 'employee_expense';
  userId: string;
  employeeId: string;
  employeeName: string;
  section: string;
  origin?: string;
  destination?: string;
  purpose: string;
  category: 'Travel' | 'Transport' | 'Food' | 'Accommodation' | 'Office Supplies' | string;
  amount: number;
  transactionDate: string;
  description?: string;
  attachmentUrl?: string;
  status: ExpenseStatus;
  approver?: string;
  approvalComments?: string;
  paymentStatus: 'Pending' | 'Reimbursed' | 'Paid';
  createdAt: string;
  updatedAt?: string;
  editedBy?: string;
}

export interface PurchaseRecord {
  id: string;
  type: 'company_purchase';
  productName: string;
  category: string;
  supplier: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  transactionDate: string;
  invoiceNumber: string;
  description?: string;
  attachmentUrl?: string;
  createdBy: string;
  createdById: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  createdAt: string;
  updatedAt?: string;
  editedBy?: string;
}

export interface SaleRecord {
  id: string;
  invoiceNumber: string;
  productName: string;
  category: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  paidAmount?: number;
  dueAmount?: number;
  saleDate: string;
  deliveryDate?: string;
  deliveryStatus: 'Delivered' | 'Pending' | 'In Transit' | 'Cancelled';
  paymentStatus: 'Paid' | 'Partial' | 'Due';
  paymentMethod?: 'Cash' | 'bKash' | 'Nagad' | 'Bank' | 'Cheque';
  notes?: string;
  createdBy: string;
  createdById: string;
  createdAt: string;
  updatedAt?: string;
}

export type ProductRequestStatus = 
  | 'Pending' 
  | 'Approved' 
  | 'Ordered' 
  | 'Delivered' 
  | 'Received by Employee' 
  | 'Rejected' 
  | 'Cancelled';

export interface ProductRequest {
  id: string;
  requestNumber: string;
  productName: string;
  category: string;
  quantity: number;
  unit: string;
  remainingQty?: number;
  priority: 'Normal' | 'Urgent' | 'Critical';
  requestType: 'low_stock' | 'out_of_stock';
  requestDate: string;
  userId: string;
  employeeId: string;
  employeeName: string;
  section: string;
  reason: string;
  attachmentUrl?: string;
  status: ProductRequestStatus;
  approvedBy?: string;
  approvalDate?: string;
  rejectionReason?: string;
  adminNotes?: string;
  notes?: string;
  orderedBy?: string;
  orderedDate?: string;
  deliveredBy?: string;
  deliveryDate?: string;
  deliveredQty?: number;
  supplier?: string;
  purchaseReference?: string;
  receivedConfirmationBy?: string;
  receivedConfirmationDate?: string;
  archivedByUserIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DutySettings {
  startHour: string;
  endHour: string;
  graceMinutes: number;
  defaultOvertimeStart: string;
  startTime?: string;
  endTime?: string;
  lunchBreakHours?: number;
  standardDailyHours?: number;
}

export interface CompanyProfile {
  name: string;
  logoUrl?: string;
  bannerUrl?: string;
  contactNumber: string;
  email: string;
  address: string;
  factoryRegNo: string;
  establishedYear: string;
  noticeText: string;
  noticeTitle?: string;
  noticeDate?: string;
  mentionedUserIds?: string[];
  mapEmbedUrl?: string;
  dutySettings?: DutySettings;
  savedAddresses?: string[];
}

export type SyncStatus = 'online' | 'syncing' | 'offline' | 'error';
export type Language = 'en' | 'bn';

export type TabType = 
  | 'dashboard' 
  | 'production' 
  | 'monthly_production' 
  | 'attendance' 
  | 'leave' 
  | 'overtime' 
  | 'payroll' 
  | 'expenses' 
  | 'calendar' 
  | 'admin_panel' 
  | 'product_requests'
  | 'products_trade';
