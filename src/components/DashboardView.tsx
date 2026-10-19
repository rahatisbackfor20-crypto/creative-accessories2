import React, { useState, useMemo } from 'react';
import { 
  User, 
  CompanyProfile, 
  AttendanceRecord, 
  OvertimeRecord, 
  ProductionRecord, 
  Language,
  LeaveRecord,
  ExpenseRecord,
  PurchaseRecord,
  SaleRecord,
  ProductRequest,
  ProductRequestStatus,
  ExpenseStatus,
  LeaveStatus,
  TabType
} from '../types';
import { translations } from '../i18n';
import { formatJoiningDate } from '../storage';
import { UserProfileBadge } from './UserProfileBadge';
import { CompanyLogo } from './CompanyLogo';
import { PriorityBar } from './PriorityBar';
import { ProductionTrendChart } from './ProductionTrendChart';
import { QuickPunchWidget } from './QuickPunchWidget';
import { DashboardLiveActionModal, DashboardRecordItem } from './DashboardLiveActionModal';
import { getStoredCategories, saveCustomCategory } from '../categoryService';
import { 
  DollarSign, 
  Clock, 
  CalendarCheck, 
  Award, 
  Bell, 
  Plus, 
  IdCard, 
  MessageCircle, 
  Edit3, 
  Check, 
  X,
  MapPin,
  Mail,
  ExternalLink,
  Phone,
  Search,
  Receipt,
  Package,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  FileCheck,
  Keyboard,
  Filter,
  SlidersHorizontal,
  Layers,
  Table as TableIcon,
  Scissors,
  Users,
  CheckCircle2,
  CalendarDays
} from 'lucide-react';

interface DashboardViewProps {
  currentUser: User;
  users: User[];
  companyProfile: CompanyProfile;
  attendance: AttendanceRecord[];
  overtime: OvertimeRecord[];
  productions: ProductionRecord[];
  leaves?: LeaveRecord[];
  expenses?: ExpenseRecord[];
  purchases?: PurchaseRecord[];
  sales?: SaleRecord[];
  productRequests?: ProductRequest[];
  language: Language;
  darkMode: boolean;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  onOpenAttendanceModal: () => void;
  onOpenOvertimeModal: () => void;
  onOpenIdCardModal: (user: User) => void;
  onUpdateCompanyNotice?: (notice: string, title?: string, mentionedUserIds?: string[]) => void;
  onNavigateToProduction?: () => void;
  onNavigateToAdmin?: () => void;
  onNavigateToTab?: (tab: TabType) => void;
  onOpenSearch?: () => void;
  onOpenShortcuts?: () => void;
  onOpenGmailModal?: (recipientId?: string, template?: 'absent' | 'production' | 'payroll' | 'custom') => void;
  onAddAttendance?: (record: Omit<AttendanceRecord, 'id'>) => Promise<void> | void;
  onUpdateAttendanceStatus?: (id: string, status: 'Present' | 'Late' | 'Absent') => Promise<void> | void;
  onUpdateAttendanceRecord?: (record: AttendanceRecord) => Promise<void> | void;
  onBatchAddAttendance?: (records: Omit<AttendanceRecord, 'id'>[]) => Promise<void> | void;
  onUpdateProduction?: (record: ProductionRecord) => Promise<void> | void;
  onDeleteProduction?: (id: string) => Promise<void> | void;
  onUpdatePurchase?: (record: PurchaseRecord) => Promise<void> | void;
  onDeletePurchase?: (id: string) => Promise<void> | void;
  onUpdateProductRequest?: (request: ProductRequest) => Promise<void> | void;
  onUpdateProductRequestStatus?: (id: string, status: ProductRequestStatus, notes?: string) => Promise<void> | void;
  onDeleteProductRequest?: (id: string) => Promise<void> | void;
  onUpdateExpense?: (record: ExpenseRecord) => Promise<void> | void;
  onUpdateExpenseStatus?: (id: string, status: ExpenseStatus) => Promise<void> | void;
  onDeleteExpense?: (id: string) => Promise<void> | void;
  onUpdateLeave?: (record: LeaveRecord) => Promise<void> | void;
  onUpdateLeaveStatus?: (id: string, status: LeaveStatus, reason?: string) => Promise<void> | void;
  onDeleteLeave?: (id: string) => Promise<void> | void;
  onUpdateSale?: (sale: SaleRecord) => Promise<void> | void;
  onDeleteSale?: (id: string) => Promise<void> | void;
  onUpdateUser?: (user: User) => Promise<void> | void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  users,
  companyProfile,
  attendance,
  overtime,
  productions,
  leaves = [],
  expenses = [],
  purchases = [],
  sales = [],
  productRequests = [],
  language,
  darkMode,
  selectedMonth,
  onSelectMonth,
  onOpenAttendanceModal,
  onOpenOvertimeModal,
  onOpenIdCardModal,
  onUpdateCompanyNotice,
  onNavigateToProduction,
  onNavigateToAdmin,
  onNavigateToTab,
  onOpenSearch,
  onOpenShortcuts,
  onOpenGmailModal,
  onAddAttendance,
  onUpdateAttendanceStatus,
  onUpdateAttendanceRecord,
  onBatchAddAttendance,
  onUpdateProduction,
  onDeleteProduction,
  onUpdatePurchase,
  onDeletePurchase,
  onUpdateProductRequest,
  onUpdateProductRequestStatus,
  onDeleteProductRequest,
  onUpdateExpense,
  onUpdateExpenseStatus,
  onDeleteExpense,
  onUpdateLeave,
  onUpdateLeaveStatus,
  onDeleteLeave,
  onUpdateSale,
  onDeleteSale,
  onUpdateUser
}) => {
  const [activeActionRecord, setActiveActionRecord] = useState<DashboardRecordItem | null>(null);
  const [categories, setCategories] = useState<string[]>(() => getStoredCategories());
  const [dashboardToast, setDashboardToast] = useState('');

  const handleSaveCategory = (newCat: string) => {
    const updated = saveCustomCategory(newCat);
    setCategories(updated);
  };
  const t = translations[language];
  const isBn = language === 'bn';
  const isHiddenAdmin = currentUser.accountType === 'hosting' || currentUser.accountType === 'admin';
  const isOwner = currentUser.accountType === 'owner';
  const isMD = currentUser.accountType === 'md' || currentUser.designation?.trim().toUpperCase() === 'MD';
  const isManager = isHiddenAdmin || isOwner || isMD || currentUser.accountType === 'staff';

  // Inline notice editing state
  const [isEditingNotice, setIsEditingNotice] = useState(false);
  const [noticeInput, setNoticeInput] = useState(companyProfile.noticeText || '');
  const [noticeTitleInput, setNoticeTitleInput] = useState(companyProfile.noticeTitle || (isBn ? 'ফ্যাক্টরি জরুরি নোটিশ ও কাজের সময়সূচী' : 'Factory Notice Board'));
  const [selectedMentionIds, setSelectedMentionIds] = useState<string[]>(companyProfile.mentionedUserIds || []);

  const isCurrentUserMentioned = Boolean(
    currentUser && companyProfile.mentionedUserIds && companyProfile.mentionedUserIds.includes(currentUser.id)
  );

  // Home Page In-Screen Interactive Search & Filter State
  const [homeSearchQuery, setHomeSearchQuery] = useState('');
  const [homeFilterCategory, setHomeFilterCategory] = useState<'all' | 'products' | 'production' | 'sales' | 'requests' | 'expenses' | 'employees' | 'leaves'>('all');
  const [showLiveTable, setShowLiveTable] = useState(true);

  // Unified Search Results Across All Authorized Modules
  const homeTableRecords = useMemo((): DashboardRecordItem[] => {
    const q = homeSearchQuery.trim().toLowerCase();
    const records: DashboardRecordItem[] = [];

    // 1. Raw Materials & Trims Purchases
    if (homeFilterCategory === 'all' || homeFilterCategory === 'products') {
      purchases.forEach(p => {
        if (!q || p.productName.toLowerCase().includes(q) || p.supplier.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.invoiceNumber.toLowerCase().includes(q)) {
          records.push({
            id: 'pur-' + p.id,
            rawId: p.id,
            category: 'product',
            categoryBadge: isBn ? 'কাঁচামাল' : 'Material',
            categoryColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
            title: p.productName,
            codeOrSubtitle: `Inv: ${p.invoiceNumber} · ${p.supplier}`,
            section: p.category,
            spec: `${p.quantity} ${p.unit} · ৳${p.totalPrice.toLocaleString()}`,
            date: p.transactionDate,
            status: p.status,
            statusColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
            tab: 'expenses',
            purchaseRef: p
          });
        }
      });
    }

    // 2. Production Orders & Finished Goods
    if (homeFilterCategory === 'all' || homeFilterCategory === 'production' || homeFilterCategory === 'products') {
      productions.forEach(pr => {
        if (!q || pr.itemName.toLowerCase().includes(q) || (pr.buyer || '').toLowerCase().includes(q) || pr.section.toLowerCase().includes(q)) {
          records.push({
            id: 'prd-' + pr.id,
            rawId: pr.id,
            category: 'production',
            categoryBadge: isBn ? 'প্রোডাকশন' : 'Production',
            categoryColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
            title: pr.itemName,
            codeOrSubtitle: pr.buyer ? `Buyer: ${pr.buyer}` : 'Batch Order',
            section: pr.section,
            spec: `${pr.prodQty} / ${pr.orderQty} ${pr.unit || 'Pcs'} ${pr.size ? `(Size: ${pr.size})` : ''}`,
            date: pr.date,
            status: pr.status,
            statusColor: pr.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
            tab: 'production',
            productionRef: pr
          });
        }
      });
    }

    // 3. Product Sales Orders (পণ্য বিক্রি)
    if (homeFilterCategory === 'all' || homeFilterCategory === 'sales' || homeFilterCategory === 'products') {
      sales.forEach(sl => {
        if (!q || sl.productName.toLowerCase().includes(q) || sl.customerName.toLowerCase().includes(q) || sl.category.toLowerCase().includes(q) || sl.invoiceNumber.toLowerCase().includes(q)) {
          records.push({
            id: 'sale-' + sl.id,
            rawId: sl.id,
            category: 'sale',
            categoryBadge: isBn ? 'পণ্য বিক্রি' : 'Sale',
            categoryColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
            title: sl.productName,
            codeOrSubtitle: `Inv: ${sl.invoiceNumber} · ${sl.customerName}`,
            section: sl.category,
            spec: `${sl.quantity} ${sl.unit} · ৳${sl.totalAmount.toLocaleString()} (${sl.paymentStatus})`,
            date: sl.saleDate,
            status: sl.deliveryStatus,
            statusColor: sl.deliveryStatus === 'Delivered' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
            tab: 'product_requests',
            saleRef: sl
          });
        }
      });
    }

    // 4. Product Requests / Stock Refill
    if (homeFilterCategory === 'all' || homeFilterCategory === 'requests' || homeFilterCategory === 'products') {
      productRequests.forEach(req => {
        if (!q || req.productName.toLowerCase().includes(q) || req.requestNumber.toLowerCase().includes(q) || req.employeeName.toLowerCase().includes(q) || req.section.toLowerCase().includes(q)) {
          records.push({
            id: 'req-' + req.id,
            rawId: req.id,
            category: 'request',
            categoryBadge: isBn ? 'রিকুইজিশন' : 'Requisition',
            categoryColor: req.priority === 'Urgent' || req.priority === 'Critical' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
            title: req.productName,
            codeOrSubtitle: `${req.requestNumber} · ${req.employeeName}`,
            section: req.section,
            spec: `${req.quantity} ${req.unit} ${req.remainingQty !== undefined ? `(স্টক: ${req.remainingQty})` : ''}`,
            date: req.requestDate.split(' ')[0],
            status: req.status,
            statusColor: req.status === 'Received by Employee' ? 'bg-teal-100 text-teal-800' : req.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
            tab: 'product_requests',
            requestRef: req
          });
        }
      });
    }

    // 5. Employees & Team
    if (homeFilterCategory === 'all' || homeFilterCategory === 'employees') {
      users.forEach(u => {
        if (!q || u.fullName.toLowerCase().includes(q) || u.employeeId.toLowerCase().includes(q) || (u.designation || '').toLowerCase().includes(q) || (u.section || '').toLowerCase().includes(q)) {
          records.push({
            id: 'usr-' + u.id,
            rawId: u.id,
            category: 'employee',
            categoryBadge: isBn ? 'কর্মী' : 'Staff',
            categoryColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
            title: u.fullName,
            codeOrSubtitle: `${u.employeeId} · ${u.designation || 'Worker'}`,
            section: u.section || 'General',
            spec: u.whatsapp || (u.accountType === 'md' ? 'Managing Director' : u.accountType),
            date: u.joiningDate || 'Active',
            status: u.accountStatus || 'Active',
            statusColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
            tab: 'attendance',
            userRef: u
          });
        }
      });
    }

    // 6. Bills & Expenses
    if (homeFilterCategory === 'all' || homeFilterCategory === 'expenses') {
      expenses.forEach(exp => {
        if (!q || exp.employeeName.toLowerCase().includes(q) || exp.purpose.toLowerCase().includes(q) || exp.category.toLowerCase().includes(q)) {
          records.push({
            id: 'exp-' + exp.id,
            rawId: exp.id,
            category: 'expense',
            categoryBadge: isBn ? 'বিল/খরচ' : 'Expense',
            categoryColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
            title: exp.purpose,
            codeOrSubtitle: `${exp.employeeName} (${exp.category})`,
            section: exp.section,
            spec: `৳${Number(exp.amount).toLocaleString()}`,
            date: exp.transactionDate.split(' ')[0],
            status: exp.status,
            statusColor: exp.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
            tab: 'expenses',
            expenseRef: exp
          });
        }
      });
    }

    // 7. Leaves
    if (homeFilterCategory === 'all' || homeFilterCategory === 'leaves') {
      leaves.forEach(lv => {
        if (!q || lv.employeeName.toLowerCase().includes(q) || lv.leaveType.toLowerCase().includes(q) || lv.reason.toLowerCase().includes(q)) {
          records.push({
            id: 'lv-' + lv.id,
            rawId: lv.id,
            category: 'leave',
            categoryBadge: isBn ? 'ছুটি' : 'Leave',
            categoryColor: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800',
            title: lv.employeeName,
            codeOrSubtitle: `${lv.leaveType} · ${lv.reason}`,
            section: lv.section,
            spec: `${lv.daysCount} দিন (${lv.startDate} → ${lv.endDate})`,
            date: lv.requestDate,
            status: lv.status,
            statusColor: lv.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : lv.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800',
            tab: 'leave',
            leaveRef: lv
          });
        }
      });
    }

    return records;
  }, [homeSearchQuery, homeFilterCategory, purchases, sales, productions, productRequests, users, expenses, leaves, isBn]);

  // Public team roster (Admins hidden from worker directory serials)
  const publicUsers = users.filter(u => u.accountType !== 'hosting' && u.accountType !== 'admin');
  const visibleUsers = isManager ? publicUsers : users.filter(u => u.id === currentUser.id);

  // Overtime calculations for selected month or total
  const myOvertimeRecords = overtime.filter(o => isManager ? true : o.userId === currentUser.id);
  const myApprovedOtHours = myOvertimeRecords
    .filter(o => o.status === 'Approved')
    .reduce((sum, o) => sum + Number(o.hours || 0), 0);

  const myApprovedOtPay = myOvertimeRecords
    .filter(o => o.status === 'Approved')
    .reduce((sum, o) => {
      const u = users.find(x => x.id === o.userId);
      const rate = Number(u?.hourlyRate || 0);
      return sum + (Number(o.hours || 0) * rate);
    }, 0);

  const activeOrdersCount = productions.filter(p => p.status === 'Running').length;
  const cardBg = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900';

  const toggleMentionUser = (userId: string) => {
    setSelectedMentionIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllWorkers = () => {
    setSelectedMentionIds(publicUsers.map(u => u.id));
  };

  const handleClearMentions = () => {
    setSelectedMentionIds([]);
  };

  const mentionedUsersList = users.filter(u => companyProfile.mentionedUserIds?.includes(u.id));

  // Notice Board Element (Top-priority alert for employees and managers)
  const noticeBoardElement = (
    <div className={`p-4 sm:p-5 rounded-3xl transition-all shadow-xs ${
      isCurrentUserMentioned
        ? darkMode
          ? 'bg-amber-950/40 border-2 border-amber-600 text-amber-100 shadow-md ring-2 ring-amber-400/20'
          : 'bg-amber-50 border-2 border-amber-300 text-amber-950 shadow-md ring-2 ring-amber-400/20'
        : darkMode
          ? 'bg-slate-800/90 border border-slate-700 text-slate-100'
          : 'bg-slate-100 border border-slate-200 text-slate-900'
    }`}>
      {/* Alert Ribbon if current user is mentioned */}
      {isCurrentUserMentioned && (
        <div className="mb-3 p-2.5 rounded-xl bg-amber-500 text-white font-extrabold text-xs flex items-center justify-between gap-2 shadow-xs animate-bounce">
          <div className="flex items-center gap-2">
            <span className="text-base">🚨</span>
            <span>
              {isBn 
                ? `জরুরি এলার্ট: "${currentUser.fullName}", আপনাকে এই নোটিশে বিশেষভাবে মেনশন করা হয়েছে!` 
                : `Urgent Alert: "${currentUser.fullName}", you have been mentioned in this notice!`}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-white text-amber-900 text-[10px] font-black uppercase">
            {isBn ? 'আপনার জন্য' : 'For You'}
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="flex items-start gap-3.5 flex-1 w-full">
          <div className={`p-2.5 rounded-xl shrink-0 ${
            isCurrentUserMentioned 
              ? 'bg-amber-500 text-white animate-pulse' 
              : darkMode ? 'bg-indigo-950 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
          }`}>
            <Bell className="w-5 h-5" />
          </div>

          <div className="flex-1 w-full space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                darkMode ? 'text-indigo-300' : 'text-indigo-900'
              }`}>
                <span>📢</span>
                <span>{companyProfile.noticeTitle || (isBn ? 'ফ্যাক্টরি জরুরি নোটিশ ও কাজের সময়সূচী' : t.factoryNoticeBoard)}</span>
              </span>
              {companyProfile.noticeDate && (
                <span className={`text-[10px] font-mono font-bold ${
                  darkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {companyProfile.noticeDate.substring(0, 10)}
                </span>
              )}
            </div>

            {isEditingNotice ? (
              <div className="mt-2 space-y-3 w-full">
                {/* Custom Title Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                    {isBn ? 'নোটিশের শিরোনাম / টাইটেল (Title):' : 'Notice Title:'}
                  </label>
                  <input
                    type="text"
                    value={noticeTitleInput}
                    onChange={(e) => setNoticeTitleInput(e.target.value)}
                    placeholder={isBn ? 'যেমন: জরুরি নাইট শিফট নোটিশ, ডেলিভারি মিটিং...' : 'e.g. Urgent Night Shift Notice, Delivery Meeting...'}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/80 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 shadow-2xs"
                  />
                </div>

                {/* Description Textarea */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                    {isBn ? 'নোটিশের বিবরণ / মেসেজ (Description):' : 'Notice Message:'}
                  </label>
                  <textarea
                    value={noticeInput}
                    onChange={(e) => setNoticeInput(e.target.value)}
                    rows={3}
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/80 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 shadow-2xs"
                    placeholder={isBn ? 'সকল কর্মীর উদ্দেশ্যে নোটিশ বার্তা লিখুন...' : 'Enter notice message to broadcast to factory workers...'}
                  />
                </div>

                {/* Employee Mentions Picker */}
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <span>👥 {isBn ? 'কর্মীদের মেনশন করুন (যাদের মেনশন করবেন তারা জরুরি এলার্ট পাবে):' : 'Mention Employees (They will receive urgent alert):'}</span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-extrabold">({selectedMentionIds.length} জন)</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleSelectAllWorkers}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 cursor-pointer"
                      >
                        {isBn ? 'সবাইকে সিলেক্ট' : 'Select All'}
                      </button>
                      <button
                        type="button"
                        onClick={handleClearMentions}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 cursor-pointer"
                      >
                        {isBn ? 'ক্লিয়ার' : 'Clear'}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pt-1">
                    {publicUsers.map(u => {
                      const isSelected = selectedMentionIds.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => toggleMentionUser(u.id)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer select-none border ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                          }`}
                        >
                          <span>{isSelected ? '✓' : '@'}</span>
                          <span>{u.fullName}</span>
                          <span className={`text-[10px] font-mono ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>({u.employeeId})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Save and Cancel buttons */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      onUpdateCompanyNotice?.(noticeInput, noticeTitleInput, selectedMentionIds);
                      setIsEditingNotice(false);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs cursor-pointer shadow-xs transition flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isBn ? 'নোটিশ প্রকাশ করুন' : 'Save & Publish Notice'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setNoticeInput(companyProfile.noticeText || '');
                      setNoticeTitleInput(companyProfile.noticeTitle || (isBn ? 'ফ্যাক্টরি জরুরি নোটিশ ও কাজের সময়সূচী' : 'Factory Notice Board'));
                      setSelectedMentionIds(companyProfile.mentionedUserIds || []);
                      setIsEditingNotice(false);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer transition flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{isBn ? 'বাতিল' : 'Cancel'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className={`text-xs sm:text-sm font-bold leading-relaxed ${
                  isCurrentUserMentioned
                    ? (darkMode ? 'text-amber-100' : 'text-amber-950')
                    : (darkMode ? 'text-slate-100' : 'text-slate-900')
                }`}>
                  {companyProfile.noticeText || (isBn ? 'বর্তমানে কোনো নোটিশ নেই।' : 'No active factory notice.')}
                </p>

                {/* Mentioned Users List */}
                {mentionedUsersList.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1 mr-1">
                      <span>🏷️</span>
                      <span>{isBn ? 'মেনশন করা হয়েছে:' : 'Mentioned:'}</span>
                    </span>
                    {mentionedUsersList.map(u => (
                      <span
                        key={u.id}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          u.id === currentUser.id
                            ? 'bg-amber-400 text-amber-950 font-black animate-pulse'
                            : 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200'
                        }`}
                      >
                        <span>@{u.fullName}</span>
                        <span className="font-mono text-[9px]">({u.employeeId})</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {isManager && !isEditingNotice && (
          <button
            onClick={() => {
              setNoticeInput(companyProfile.noticeText || '');
              setNoticeTitleInput(companyProfile.noticeTitle || (isBn ? 'ফ্যাক্টরি জরুরি নোটিশ ও কাজের সময়সূচী' : 'Factory Notice Board'));
              setSelectedMentionIds(companyProfile.mentionedUserIds || []);
              setIsEditingNotice(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer transition self-start sm:self-auto shadow-2xs"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isBn ? 'নোটিশ এডিট / মেনশন করুন' : 'Edit Notice'}</span>
          </button>
        )}
      </div>
    </div>
  );

  // ========================================================
  // SIMPLIFIED EMPLOYEE HOME PAGE (Requirement:
  // "এমপ্লয়ি একাউন্টে হোম পেজে তারা তাদের যেন অতিরিক্ত ইন্টারফেস না থাকে।
  //  তারা তাদের শুধু ডাটা এন্ট্রি করার মতো যেন অপশনগুলো থাকে।
  //  প্রথম অপশন যেন থাকে ডিউটি প্রেজেন্ট আউট ইন মানে এটা।
  //  এবং দ্বিতীয় অপশন যেন থাকে তারা ওই যে বিলের, তারপরে হলো প্রোডাক্টের, তারপরে হলো প্রোডাকশনের।
  //  প্রোডাকশনেরটা সেকেন্ডে থাকবে তারপর ওগুলো থাকবে। তাদের এন্ট্রি সিস্টেমটা যেন আগে থাকে এবং ডিটেইলস মিটেইলস এগুলা যেন না থাকে।
  //  হোম পেজ যেন পরিষ্কার ক্লিয়ার একটা সুন্দর থাকে।")
  // ========================================================
  if (!isManager) {
    return (
      <div className="space-y-6">
        {/* Notice Alert if active or user mentioned */}
        {noticeBoardElement}

        {/* 1. First Option: Duty Present In / Out (Quick Attendance Punch Widget) */}
        {onAddAttendance && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>⏱️</span>
                <span>{isBn ? '১. ডিউটি প্রেজেন্ট ইন / আউট (দৈনিক হাজিরা)' : '1. Duty Present In / Out (Daily Attendance)'}</span>
              </span>
              <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {isBn ? '১-ক্লিকে হাজিরা' : '1-Click Punch'}
              </span>
            </div>
            <QuickPunchWidget
              currentUser={currentUser}
              users={users}
              attendance={attendance}
              language={language}
              darkMode={darkMode}
              onAddAttendance={onAddAttendance}
              onUpdateAttendanceStatus={onUpdateAttendanceStatus}
              onUpdateAttendanceRecord={onUpdateAttendanceRecord}
              onBatchAddAttendance={onBatchAddAttendance}
            />
          </div>
        )}

        {/* 2. Second Option: Data Entry Options (Production, Material Requisitions, Bills & Expenses) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>✍️</span>
              <span>{isBn ? '২. দ্রুত ডাটা এন্ট্রি অপশনসমূহ' : '2. Quick Data Entry Options'}</span>
            </span>
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
              {isBn ? 'ক্লিক করে এন্ট্রি করুন' : 'Tap to enter'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Entry 1: Production Entry */}
            <button
              type="button"
              onClick={onNavigateToProduction}
              className={`p-4 rounded-2xl border text-left transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer flex flex-col justify-between gap-3 group ${
                darkMode ? 'bg-slate-900 border-slate-800 hover:border-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition">
                  <Scissors className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  {currentUser.section || 'Production'}
                </span>
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {isBn ? 'দৈনিক প্রোডাকশন এন্ট্রি' : 'Daily Production Entry'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {isBn ? 'আপনার সেকশনের অর্ডার উৎপাদন ও পিস হিসাব জমা দিন' : 'Log daily produced output and pieces'}
                </p>
              </div>
            </button>

            {/* Entry 2: Product / Material Request */}
            <button
              type="button"
              onClick={() => onNavigateToTab?.('product_requests')}
              className={`p-4 rounded-2xl border text-left transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer flex flex-col justify-between gap-3 group ${
                darkMode ? 'bg-slate-900 border-slate-800 hover:border-rose-500' : 'bg-white border-slate-200 hover:border-rose-400 hover:bg-rose-50/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition">
                  <Package className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  {isBn ? 'রিকুইজিশন' : 'Requisition'}
                </span>
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {isBn ? 'পণ্য ও মালামাল রিকোয়েস্ট' : 'Product / Material Request'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {isBn ? 'কাজের জন্য প্রয়োজনীয় কাঁচামাল ও মালামাল রিকুইজিশন' : 'Request trims, fabric, and accessories'}
                </p>
              </div>
            </button>

            {/* Entry 3: Bills & Expenses */}
            <button
              type="button"
              onClick={() => onNavigateToTab?.('expenses')}
              className={`p-4 rounded-2xl border text-left transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer flex flex-col justify-between gap-3 group ${
                darkMode ? 'bg-slate-900 border-slate-800 hover:border-amber-500' : 'bg-white border-slate-200 hover:border-amber-400 hover:bg-amber-50/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition">
                  <Receipt className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  {isBn ? 'ভাউচার' : 'Voucher'}
                </span>
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {isBn ? 'বিল ও খরচাদি সাবমিট' : 'Bills & Expense Entry'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {isBn ? 'কারখানার খরচের ভাউচার ও রসিদ বিল এন্ট্রি করুন' : 'Submit factory expense vouchers'}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* 3. Third Section: Employee's Personal Profile & Earnings Summary */}
        <div className={`border rounded-3xl p-5 sm:p-6 shadow-xs ${cardBg}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3.5">
              <UserProfileBadge user={currentUser} showJoiningDate={true} darkMode={darkMode} language={language} />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenIdCardModal(currentUser)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
              >
                <IdCard className="w-4 h-4" />
                <span>{isBn ? 'ডিজিটাল আইডি কার্ড' : 'Digital ID Badge'}</span>
              </button>
              <button
                type="button"
                onClick={onOpenOvertimeModal}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
              >
                <Clock className="w-4 h-4" />
                <span>{t.logOvertime}</span>
              </button>
            </div>
          </div>

          {/* 4 Personal Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4">
            {/* Metric 1: Basic Salary & Hourly Rate */}
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">{t.basicSalary}</span>
                <DollarSign className="w-4 h-4" />
              </div>
              <div className="text-xl font-black font-mono">
                ৳ {Number(currentUser.basicSalary || 0).toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500 font-mono mt-1">
                {t.hourlyOtRate}: ৳ {Number(currentUser.hourlyRate || 0).toFixed(2)} / hr
              </p>
            </div>

            {/* Metric 2: Overtime Bill */}
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">{t.overtimeBill}</span>
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-xl font-black font-mono">
                {myApprovedOtHours.toFixed(1)} {t.hours}
              </div>
              <p className="text-[11px] text-slate-500 font-mono mt-1">
                {t.totalOtEarnings}: ৳ {myApprovedOtPay.toLocaleString()}
              </p>
            </div>

            {/* Metric 3: Attendance Logs */}
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">{t.attendanceCount}</span>
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div className="text-xl font-black font-mono">
                {attendance.filter(a => a.userId === currentUser.id).length} {isBn ? 'দিন' : 'Days'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {isBn ? 'ডিউটি: সকাল ৯:০০ - সন্ধ্যা ৬:০০' : 'Shift: 9:00 AM - 6:00 PM'}
              </p>
            </div>

            {/* Metric 4: Leave Calendar Shortcut */}
            <div 
              onClick={() => onNavigateToTab?.('calendar')}
              className={`p-4 rounded-2xl border cursor-pointer hover:border-indigo-400 transition ${
                darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">{isBn ? 'ছুটির ক্যালেন্ডার' : 'Holidays'}</span>
                <CalendarDays className="w-4 h-4" />
              </div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                <span>{isBn ? 'সরকারি ছুটির তালিকা' : 'Holiday Calendar'}</span>
                <span>→</span>
              </div>
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 font-semibold">
                {isBn ? 'ক্যালেন্ডার দেখতে চাপুন' : 'Click to view calendar'}
              </p>
            </div>
          </div>
        </div>

        {/* Live Action & Manual Edit Modal if active */}
        {activeActionRecord && (
          <DashboardLiveActionModal
            record={activeActionRecord}
            isOpen={Boolean(activeActionRecord)}
            onClose={() => setActiveActionRecord(null)}
            language={language}
            darkMode={darkMode}
            currentUser={currentUser}
            categories={categories}
            onSaveCategory={handleSaveCategory}
            onUpdateProduction={onUpdateProduction}
            onDeleteProduction={onDeleteProduction}
            onUpdatePurchase={onUpdatePurchase}
            onDeletePurchase={onDeletePurchase}
            onUpdateProductRequest={onUpdateProductRequest}
            onUpdateProductRequestStatus={onUpdateProductRequestStatus}
            onDeleteProductRequest={onDeleteProductRequest}
            onUpdateExpense={onUpdateExpense}
            onUpdateExpenseStatus={onUpdateExpenseStatus}
            onDeleteExpense={onDeleteExpense}
            onUpdateLeave={onUpdateLeave}
            onUpdateLeaveStatus={onUpdateLeaveStatus}
            onDeleteLeave={onDeleteLeave}
            onUpdateSale={onUpdateSale}
            onDeleteSale={onDeleteSale}
            onUpdateUser={onUpdateUser}
            onNavigateToTab={onNavigateToTab}
            onSuccessToast={(msg) => {
              setDashboardToast(msg);
              setTimeout(() => setDashboardToast(''), 4000);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Factory Notice Board (Displayed at the VERY TOP for workers so they see alerts first) */}
      {noticeBoardElement}

      {/* Home Page Top Utility Bar: Keyboard Shortcuts Button & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {onOpenShortcuts && (
            <button
              type="button"
              onClick={onOpenShortcuts}
              className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-sm shadow-indigo-500/20 cursor-pointer transition active:scale-95"
              title={isBn ? 'কীবোর্ড শর্টকাট সহায়িকা দেখতে চাপুন' : 'Click to view keyboard shortcuts'}
            >
              <Keyboard className="w-4 h-4" />
              <span>{isBn ? 'কীবোর্ড শর্টকাট' : 'Keyboard Shortcuts'}</span>
              <kbd className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] font-mono font-bold">?</kbd>
            </button>
          )}

          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className={`px-3.5 py-2 rounded-2xl border font-bold text-xs flex items-center gap-2 cursor-pointer transition ${
                darkMode ? 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden sm:inline">{isBn ? 'সার্বজনীন স্পটলাইট' : 'Spotlight Search'}</span>
              <kbd className="px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-400">Ctrl+K</kbd>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{isBn ? 'লাইভ ফ্যাক্টরি ডাটাবেস' : 'Live Factory Records'}</span>
        </div>
      </div>

      {/* Admin/manager one-tap workspace: keep the most-used factory modules close to the home screen */}
      {isManager && onNavigateToTab && (
        <section className={`rounded-2xl border p-3 sm:p-4 shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="text-sm font-black">{isBn ? 'দ্রুত অ্যাক্সেস · অ্যাডমিন ওয়ার্কস্পেস' : 'Quick Access · Admin Workspace'}</h2>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">{isBn ? 'এক ট্যাপে প্রয়োজনীয় মডিউল খুলুন — কম স্ক্রল, দ্রুত কাজ' : 'Open key modules in one tap — less scrolling, faster work'}</p>
            </div>
            <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-[10px] font-black">ERP SHORTCUTS</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {[
              { tab: 'attendance' as TabType, labelBn: 'হাজিরা', labelEn: 'Attendance', icon: CalendarCheck, tint: 'emerald' },
              { tab: 'overtime' as TabType, labelBn: 'ওভারটাইম', labelEn: 'Overtime', icon: Clock, tint: 'amber' },
              { tab: 'production' as TabType, labelBn: 'প্রোডাকশন', labelEn: 'Production', icon: Scissors, tint: 'indigo' },
              { tab: 'monthly_production' as TabType, labelBn: 'মাসিক রিপোর্ট', labelEn: 'Monthly Report', icon: TrendingUp, tint: 'blue' },
              { tab: 'product_requests' as TabType, labelBn: 'মালামাল রিকোয়েস্ট', labelEn: 'Material Requests', icon: Package, tint: 'rose' },
              { tab: 'payroll' as TabType, labelBn: 'বেতন ও পেরোল', labelEn: 'Payroll', icon: DollarSign, tint: 'violet' },
              { tab: 'expenses' as TabType, labelBn: 'বিল ও খরচ', labelEn: 'Bills & Expenses', icon: Receipt, tint: 'orange' },
              { tab: 'admin_panel' as TabType, labelBn: 'অ্যাডমিন সেটিংস', labelEn: 'Admin Settings', icon: Layers, tint: 'slate' },
            ].filter(item => item.tab !== 'payroll' || currentUser.accountType !== 'employee' || currentUser.adminAccess === 'basic' || currentUser.adminAccess === 'full')
             .filter(item => item.tab !== 'admin_panel' || isHiddenAdmin || isOwner || isMD || currentUser.adminAccess === 'basic' || currentUser.adminAccess === 'full')
             .map(item => {
               const Icon = item.icon;
               const selected = item.tab === 'admin_panel' ? false : false;
               return <button key={item.tab} type="button" onClick={() => onNavigateToTab(item.tab)} className={`group min-h-[74px] rounded-xl border p-2.5 text-left transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] ${darkMode ? 'bg-slate-950 border-slate-800 hover:border-indigo-500' : 'bg-slate-50 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/60'}`}>
                 <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 group-hover:scale-105 transition"><Icon className="h-4 w-4" /></span>
                 <span className="block text-[10px] sm:text-[11px] font-extrabold leading-tight">{isBn ? item.labelBn : item.labelEn}</span>
               </button>;
             })}
          </div>
        </section>
      )}

      {/* Interactive In-Screen Search Bar & Compact Filters */}
      <div className={`p-4 rounded-3xl border shadow-sm space-y-3.5 ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        {/* Search input field */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={homeSearchQuery}
            onChange={(e) => setHomeSearchQuery(e.target.value)}
            placeholder={isBn 
              ? 'যেকোনো প্রোডাক্ট আইটেম নাম, কর্মী, ইনভয়েস, প্রোডাকশন অর্ডার বা রিকুইজিশন সার্চ করুন...' 
              : 'Search any product item name, worker, invoice, production order, or requisition...'}
            className={`w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-2xl border font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
              darkMode ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 placeholder-slate-400'
            }`}
          />
          {homeSearchQuery && (
            <button
              onClick={() => setHomeSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Compact Filter Buttons / Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>{isBn ? 'ফিল্টার:' : 'Filter:'}</span>
          </span>

          {[
            { id: 'all', labelBn: 'সবকিছু (All)', labelEn: 'All' },
            { id: 'products', labelBn: 'পণ্য ও কাঁচামাল', labelEn: 'Products & Trims' },
            { id: 'production', labelBn: 'প্রোডাকশন', labelEn: 'Production' },
            { id: 'sales', labelBn: 'পণ্য বিক্রি', labelEn: 'Sales Orders' },
            { id: 'requests', labelBn: 'মালামাল রিকুইজিশন', labelEn: 'Requisitions' },
            { id: 'expenses', labelBn: 'বিল ও ভাউচার', labelEn: 'Bills & Expenses' },
            { id: 'employees', labelBn: 'কর্মী ও স্টাফ', labelEn: 'Employees' },
            { id: 'leaves', labelBn: 'ছুটির আবেদন', labelEn: 'Leaves' }
          ].map((f) => {
            const isActive = homeFilterCategory === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setHomeFilterCategory(f.id as any)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300'
                }`}
              >
                <span>{isBn ? f.labelBn : f.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* Live Records Table (Requirement: "এগুলো সব টেবিল আকারে দেন। এলোমেলো হিজিবিজি যেন না দেখায়। একটা টেবিলে সবকিছু টেবিল সিস্টেম করে দেন সুন্দর।") */}
        <div className="pt-2">
          <div className="flex items-center justify-between pb-2 border-b dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-indigo-500/10 text-indigo-500">
                <TableIcon className="w-3.5 h-3.5" />
              </span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200">
                {homeSearchQuery 
                  ? (isBn ? `সার্চ ফলাফল (${homeTableRecords.length} টি রেকর্ড পাওয়া গেছে)` : `Search Results (${homeTableRecords.length} found)`)
                  : (isBn ? `ফ্যাক্টরি লাইভ রেকর্ডস টেবিল (${homeTableRecords.length} টি আইটেম)` : `Factory Live Records Table (${homeTableRecords.length} items)`)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowLiveTable(!showLiveTable)}
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              {showLiveTable ? (isBn ? 'টেবিল সংক্ষেপ করুন' : 'Collapse') : (isBn ? 'টেবিল দেখান' : 'Expand')}
            </button>
          </div>

          {showLiveTable && (
            <div className="overflow-x-auto mt-2 rounded-2xl border dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                  darkMode ? 'bg-slate-800/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}>
                  <tr>
                    <th className="py-2.5 px-3.5"># / {isBn ? 'ধরণ' : 'Type'}</th>
                    <th className="py-2.5 px-3.5">{isBn ? 'পণ্য / আইটেম / নাম' : 'Product / Item / Details'}</th>
                    <th className="py-2.5 px-3.5">{isBn ? 'সেকশন / বিভাগ' : 'Section'}</th>
                    <th className="py-2.5 px-3.5">{isBn ? 'পরিমাণ / মূল্য / স্পেক' : 'Qty / Amount / Spec'}</th>
                    <th className="py-2.5 px-3.5">{isBn ? 'তারিখ' : 'Date'}</th>
                    <th className="py-2.5 px-3.5">{isBn ? 'অবস্থা' : 'Status'}</th>
                    <th className="py-2.5 px-3.5 text-right">{isBn ? 'অ্যাকশন' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {homeTableRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        <Search className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                        <p className="font-bold text-xs">{isBn ? 'কোন রেকর্ড পাওয়া যায়নি' : 'No matching records found'}</p>
                        <p className="text-[11px] mt-0.5">{isBn ? 'অন্য নাম বা কিওয়ার্ড দিয়ে সার্চ করুন' : 'Try searching with different terms'}</p>
                      </td>
                    </tr>
                  ) : (
                    homeTableRecords.slice(0, 15).map((row, idx) => (
                      <tr 
                        key={row.id} 
                        className={`hover:bg-indigo-50/40 dark:hover:bg-slate-800/50 transition-colors ${
                          idx % 2 === 0 ? (darkMode ? 'bg-slate-900/40' : 'bg-white') : (darkMode ? 'bg-slate-800/20' : 'bg-slate-50/60')
                        }`}
                      >
                        <td className="py-2.5 px-3.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${row.categoryColor}`}>
                            {row.categoryBadge}
                          </span>
                        </td>

                        <td className="py-2.5 px-3.5">
                          <button
                            type="button"
                            onClick={() => setActiveActionRecord(row)}
                            className="text-left font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 line-clamp-1 cursor-pointer transition block w-full"
                            title={isBn ? 'ম্যানুয়ালি পরিবর্তন করতে চাপুন' : 'Click to manually edit'}
                          >
                            {row.title}
                          </button>
                          <div className="text-[10px] text-slate-400 font-mono line-clamp-1">
                            {row.codeOrSubtitle}
                          </div>
                        </td>

                        <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-300 font-semibold">
                          {row.section}
                        </td>

                        <td className="py-2.5 px-3.5 font-bold text-slate-800 dark:text-slate-200">
                          {row.spec}
                        </td>

                        <td className="py-2.5 px-3.5 font-mono text-[11px] text-slate-500">
                          {row.date}
                        </td>

                        <td className="py-2.5 px-3.5">
                          <button
                            type="button"
                            onClick={() => setActiveActionRecord(row)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer hover:opacity-80 transition ${row.statusColor}`}
                            title={isBn ? 'স্ট্যাটাস ও তথ্য পরিবর্তন করতে চাপুন' : 'Click to change status/details'}
                          >
                            {row.status}
                          </button>
                        </td>

                          <td className="py-2.5 px-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {row.tab && onNavigateToTab && (
                                <button
                                  type="button"
                                  onClick={() => onNavigateToTab(row.tab)}
                                  className="px-2.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-extrabold text-[10px] sm:text-[11px] flex items-center gap-1 transition shadow-2xs cursor-pointer active:scale-95 shrink-0"
                                  title={isBn ? 'সরাসরি এর মূল মডিউলে নিয়ে যান' : 'Jump directly to this module'}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>{isBn ? 'মূল ট্যাবে যান' : 'Go to Tab'}</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setActiveActionRecord(row)}
                                className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] sm:text-[11px] flex items-center gap-1 transition shadow-xs cursor-pointer active:scale-95 shrink-0"
                                title={isBn ? 'ড্যাশবোর্ড থেকেই ম্যানুয়ালি এডিট ও একশন নিন' : 'Action and edit manually right on dashboard'}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>{isBn ? 'অ্যাকশন' : 'Action'}</span>
                              </button>
                            </div>
                          </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {homeTableRecords.length > 15 && (
                <div className="p-2.5 text-center border-t dark:border-slate-800 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                  {isBn ? `আরও ${homeTableRecords.length - 15} টি রেকর্ড রয়েছে — নির্দিষ্ট মডিউলে গিয়ে বিস্তারিত দেখুন` : `Showing 15 of ${homeTableRecords.length} records`}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 1.5 Quick 1-Click Attendance & Present Widget (Active 8:30-10:00 AM & 5:00-7:00 PM) */}
      {onAddAttendance && (
        <QuickPunchWidget
          currentUser={currentUser}
          users={users}
          attendance={attendance}
          language={language}
          darkMode={darkMode}
          onAddAttendance={onAddAttendance}
          onUpdateAttendanceStatus={onUpdateAttendanceStatus}
          onUpdateAttendanceRecord={onUpdateAttendanceRecord}
          onBatchAddAttendance={onBatchAddAttendance}
        />
      )}

      {/* 2. Priority Bar (Highlighted near top of Home Page) */}
      <PriorityBar
        productions={productions}
        selectedMonth={selectedMonth}
        onSelectMonth={onSelectMonth}
        language={language}
        darkMode={darkMode}
        onNavigateToProduction={onNavigateToProduction}
      />

      {/* 3. Welcome & Primary Profile Card */}
      <div className={`border rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${cardBg}`}>
        <div className="flex items-center gap-5">
          {/* Company Official Logo Mark Badge */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white dark:bg-slate-950 border-2 border-indigo-100 dark:border-slate-800 shadow-sm shrink-0 flex items-center justify-center p-2.5">
            <CompanyLogo logoUrl={companyProfile.logoUrl} size="lg" variant="mark-only" darkMode={darkMode} />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {isMD 
                  ? 'Managing Director'
                  : isOwner
                    ? 'Owner / Investor'
                    : isHiddenAdmin 
                      ? t.systemControl 
                      : `${currentUser.designation || 'Factory Worker'} · ${currentUser.section || 'General'}`}
              </span>
              {isMD && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white font-black text-[10px] tracking-wider uppercase shadow-2xs">
                  MD
                </span>
              )}
              {isOwner && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-black text-[10px] tracking-wider uppercase shadow-2xs">
                  Owner
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              {isHiddenAdmin ? companyProfile.name : currentUser.fullName}
            </h2>
            {!isHiddenAdmin ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {t.empId}: <span className="font-bold text-indigo-600 dark:text-indigo-400">{currentUser.employeeId}</span>
                <span className="mx-2 text-slate-300 dark:text-slate-600">·</span>
                {t.joiningDate}: <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatJoiningDate(currentUser.joiningDate)} ({currentUser.joiningDate})</span>
              </p>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {companyProfile.factoryRegNo} · {companyProfile.establishedYear} · {t.portalSubtitle}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={onOpenAttendanceModal}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.logAttendance}</span>
          </button>
          <button
            onClick={onOpenOvertimeModal}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Clock className="w-4 h-4" />
            <span>{t.logOvertime}</span>
          </button>
          {!isHiddenAdmin && (
            <button
              onClick={() => onOpenIdCardModal(currentUser)}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <IdCard className="w-4 h-4" />
              <span>{t.myIdCard}</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Basic Salary */}
        <div className={`border rounded-2xl p-5 space-y-1.5 shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t.basicSalary}</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black font-mono tabular-nums tracking-tight">
            ৳ {Number(currentUser.basicSalary || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            {t.hourlyOtRate}: ৳ {Number(currentUser.hourlyRate || 0).toFixed(2)} / hr
          </p>
        </div>

        {/* Metric 2: Overtime Bill */}
        <div className={`border rounded-2xl p-5 space-y-1.5 shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t.overtimeBill}</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black font-mono tabular-nums tracking-tight">
            {myApprovedOtHours.toFixed(1)} {t.hours}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            {t.totalOtEarnings}: ৳ {myApprovedOtPay.toLocaleString()}
          </p>
        </div>

        {/* Metric 3: Attendance Logs */}
        <div className={`border rounded-2xl p-5 space-y-1.5 shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t.attendanceCount}</span>
            <CalendarCheck className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black font-mono tabular-nums tracking-tight">
            {attendance.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {t.portalSubtitle}
          </p>
        </div>

        {/* Metric 4: Active Orders */}
        <div className={`border rounded-2xl p-5 space-y-1.5 shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t.activeOrders}</span>
            <Award className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black font-mono tabular-nums tracking-tight">
            {activeOrdersCount}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {companyProfile.establishedYear} · {companyProfile.factoryRegNo}
          </p>
        </div>
      </div>

      {/* Owner Executive Overview Banner (Requirement 1: Owner role access to authorized business reports & overview) */}
      {isOwner && (
        <div className={`p-5 rounded-3xl border shadow-sm space-y-3 bg-gradient-to-br from-emerald-500/10 via-slate-500/5 to-transparent ${cardBg}`}>
          <div className="flex items-center justify-between border-b pb-3 border-emerald-500/20">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">💼</span>
              <div>
                <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{isBn ? 'মালিক ও বোর্ড বিজনেস ওভারভিউ (Owner Executive Overview)' : 'Owner Executive Overview'}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px]">
                    Authorized
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isBn ? 'ব্যবসায়িক অগ্রগতি, অপারেশনাল রিকুইজিশন এবং মোট অর্ডারের বর্তমান অবস্থা' : 'High-level business health, active orders, and operational overview'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-slate-400">{selectedMonth}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">{t.activeOrders}</span>
              <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">{activeOrdersCount} Running</p>
            </div>
            <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">{isBn ? 'মোট কর্মীসংখ্যা' : 'Total Workforce'}</span>
              <p className="text-lg font-black text-slate-800 dark:text-white">{users.length} Members</p>
            </div>
            <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">{isBn ? 'পেন্ডিং খরচ অনুমোদন' : 'Pending Expenses'}</span>
              <p className="text-lg font-black text-amber-600">{expenses.filter(e => e.status === 'Pending').length} Bills</p>
            </div>
            <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">{isBn ? 'স্টক রিফিল অবস্থা' : 'Stock Status'}</span>
              <p className="text-lg font-black text-emerald-600">
                {productRequests.filter(r => (r.remainingQty !== undefined && r.remainingQty <= 10) || r.requestType === 'out_of_stock').length} Low Stock
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4.5 Operational Modules Quick Action & Status Grid (Leave, Expenses, Product Requests) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Module 1: Leave Management */}
        <div className={`border rounded-2xl p-4.5 space-y-3 shadow-xs transition hover:border-emerald-500/50 ${cardBg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <h4 className="font-extrabold text-sm">{t.leave}</h4>
            </div>
            {leaves.filter(l => l.status === 'Pending').length > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse">
                {leaves.filter(l => l.status === 'Pending').length} {isBn ? 'পেন্ডিং' : 'Pending'}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {leaves.length} {isBn ? 'মোট আবেদন' : 'Total'}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            {isBn 
              ? 'ছুটির আবেদন (নৈমিত্তিক, অসুস্থতাজনিত, বাৎসরিক) জমা ও অনুমোদন।' 
              : 'Submit Casual, Sick, Annual, or Emergency leaves with live approval.'}
          </p>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400">
              {isBn ? 'অনুমোদিত:' : 'Approved:'} <strong className="text-emerald-600">{leaves.filter(l => l.status === 'Approved').length}</strong>
            </span>
            {onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab('leave')}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{isBn ? 'ছুটি মডিউলে যান' : 'Open Leave'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Module 2: Bills & Expenses */}
        <div className={`border rounded-2xl p-4.5 space-y-3 shadow-xs transition hover:border-amber-500/50 ${cardBg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
              <h4 className="font-extrabold text-sm">{t.billsAndExpenses}</h4>
            </div>
            {expenses.filter(e => e.status === 'Pending').length > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                {expenses.filter(e => e.status === 'Pending').length} {isBn ? 'পেন্ডিং ভাউচার' : 'Pending'}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {expenses.length} {isBn ? 'ভাউচার' : 'Bills'}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            {isBn 
              ? 'কর্মীর যাতায়াত ও ফ্যাক্টরি বিল ভাউচার এবং কাঁচামাল ক্রয় মূল্য তুলনা।' 
              : 'Travel conveyance, office bills, and material purchase price comparison.'}
          </p>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400">
              {isBn ? 'পরিশোধিত:' : 'Paid:'} <strong className="text-amber-600">{expenses.filter(e => e.paymentStatus === 'Paid' || e.paymentStatus === 'Reimbursed').length}</strong>
            </span>
            {onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab('expenses')}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{isBn ? 'বিল ও খরচ দেখুন' : 'Open Expenses'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Module 3: Product Request / Stock Refill */}
        <div className={`border rounded-2xl p-4.5 space-y-3 shadow-xs transition hover:border-indigo-500/50 ${cardBg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
              <h4 className="font-extrabold text-sm">{t.productRequests}</h4>
            </div>
            {productRequests.filter(r => (r.remainingQty !== undefined && r.remainingQty <= 10) || r.requestType === 'out_of_stock').length > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>{productRequests.filter(r => (r.remainingQty !== undefined && r.remainingQty <= 10) || r.requestType === 'out_of_stock').length} {isBn ? 'লো স্টক' : 'Low Stock'}</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                {productRequests.length} {isBn ? 'আইটেম' : 'Items'}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            {isBn 
              ? 'যন্ত্রাংশ, সুঁই ও এক্সেসরিজ রিকুইজিশন, ডেলিভারি ও রিসিভ ট্র্যাকিং।' 
              : 'Machine needles, parts, and trims refill requests and receipt confirmation.'}
          </p>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400">
              {isBn ? 'পেন্ডিং:' : 'Pending:'} <strong className="text-indigo-600">{productRequests.filter(r => r.status === 'Pending').length}</strong>
            </span>
            {onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab('product_requests')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{isBn ? 'রিকোয়েস্ট খুলুন' : 'Open Requests'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Production Summary Shortcut Card */}
      <div className={`border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 bg-gradient-to-r from-indigo-500/10 via-emerald-500/10 to-transparent ${cardBg}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-xs">
            📊
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
              {isBn ? 'সেকশন ও কর্মীভিত্তিক মাসিক উৎপাদন রিপোর্ট' : 'Monthly Section & Worker Output Report'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isBn 
                ? 'যেই সেকশনের যেই কর্মী কত পিস প্রোডাকশন করলো তার সম্পূর্ণ তালিকা ও সিএসভি ডাউনলোড' 
                : 'Track pieces produced by individual workers, section summaries, and download CSVs'}
            </p>
          </div>
        </div>

        {onNavigateToProduction && (
          <button
            type="button"
            onClick={onNavigateToProduction}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 shrink-0"
          >
            <span>{isBn ? '📊 মাসিক রিপোর্ট দেখুন' : 'View Monthly Report'}</span>
            <span>➜</span>
          </button>
        )}
      </div>

      {/* 5. Weekly Production Trend & Efficiency Line Chart (Recharts) */}
      <ProductionTrendChart
        productions={productions}
        selectedMonth={selectedMonth}
        language={language}
        darkMode={darkMode}
      />

      {/* 6. Company Team Directory / Roster */}
      <div className={`border rounded-3xl p-6 space-y-4 shadow-xs ${cardBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-extrabold tracking-tight">
              {t.companyRoster}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t.companyRosterSubtitle}
            </p>
          </div>
          <div className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400">
            {t.totalMembers}: {visibleUsers.length}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {visibleUsers.map((u, index) => (
            <div
              key={u.id}
              className={`p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
                darkMode ? 'bg-slate-950/40 border-slate-800 hover:border-slate-700' : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xs font-mono font-bold text-slate-400 shrink-0">
                  #{index + 1}
                </span>
                <UserProfileBadge user={u} showJoiningDate={true} darkMode={darkMode} language={language} />
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <button
                  onClick={() => onOpenIdCardModal(u)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider transition cursor-pointer shadow-xs"
                >
                  {t.idBadge}
                </button>
                {u.whatsapp && (
                  <a
                    href={`https://wa.me/${u.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </a>
                )}
                {onOpenGmailModal && (
                  <button
                    onClick={() => onOpenGmailModal(u.id, 'absent')}
                    className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                    title={isBn ? `${u.fullName} কে ইমেইল পাঠান` : `Send email to ${u.fullName}`}
                  >
                    <Mail className="w-3 h-3" />
                    <span>Email</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. Factory Location & Google Maps Card */}


      {/* Floating Toast Notification for Dashboard Actions */}
      {dashboardToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{dashboardToast}</span>
        </div>
      )}

      {/* Dashboard Live Action & Manual Edit Modal (No Tab Switching Needed) */}
      {activeActionRecord && (
        <DashboardLiveActionModal
          record={activeActionRecord}
          isOpen={Boolean(activeActionRecord)}
          onClose={() => setActiveActionRecord(null)}
          language={language}
          darkMode={darkMode}
          currentUser={currentUser}
          categories={categories}
          onSaveCategory={handleSaveCategory}
          onUpdateProduction={onUpdateProduction}
          onDeleteProduction={onDeleteProduction}
          onUpdatePurchase={onUpdatePurchase}
          onDeletePurchase={onDeletePurchase}
          onUpdateProductRequest={onUpdateProductRequest}
          onUpdateProductRequestStatus={onUpdateProductRequestStatus}
          onDeleteProductRequest={onDeleteProductRequest}
          onUpdateExpense={onUpdateExpense}
          onUpdateExpenseStatus={onUpdateExpenseStatus}
          onDeleteExpense={onDeleteExpense}
          onUpdateLeave={onUpdateLeave}
          onUpdateLeaveStatus={onUpdateLeaveStatus}
          onDeleteLeave={onDeleteLeave}
          onUpdateSale={onUpdateSale}
          onDeleteSale={onDeleteSale}
          onUpdateUser={onUpdateUser}
          onNavigateToTab={onNavigateToTab}
          onSuccessToast={(msg) => {
            setDashboardToast(msg);
            setTimeout(() => setDashboardToast(''), 4000);
          }}
        />
      )}
    </div>
  );
};
