import React, { useState, useMemo } from 'react';
import { 
  ExpenseRecord, 
  PurchaseRecord, 
  User, 
  CompanyProfile, 
  Language, 
  ExpenseStatus 
} from '../types';
import { translations } from '../i18n';
import { 
  Receipt, 
  ShoppingCart, 
  TrendingUp, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  FileText, 
  Trash2, 
  Check, 
  X, 
  DollarSign, 
  Calendar,
  Building,
  History,
  Tag,
  ArrowRight
} from 'lucide-react';

interface BillsExpensesViewProps {
  expenses: ExpenseRecord[];
  purchases: PurchaseRecord[];
  users: User[];
  currentUser: User;
  companyProfile: CompanyProfile;
  language: Language;
  darkMode: boolean;
  onAddExpense: (record: Omit<ExpenseRecord, 'id' | 'createdAt'>) => void;
  onUpdateExpenseStatus: (id: string, status: ExpenseStatus) => void;
  onDeleteExpense: (id: string) => void;
  onAddPurchase: (record: Omit<PurchaseRecord, 'id' | 'createdAt'>) => void;
  onDeletePurchase: (id: string) => void;
}

const INITIAL_EXPENSE_CATEGORIES = [
  'Travel & Conveyance',
  'Food & Refreshment',
  'Factory Rent & Lease',
  'Electricity, Gas & Generator Fuel',
  'Machine Spares & Maintenance',
  'Field Testing / Lab',
  'Office Supplies & Stationery',
  'Emergency Factory Utility',
  'Logistics & Courier',
  'Worker Welfare & Medical Aid',
  'Subcontracting & Washing',
  'Packaging & Box Supplies',
  'Other Factory Expense'
];

const PURCHASE_CATEGORIES = [
  'Zippers & Fasteners',
  'Hardware & Pullers',
  'Raw Fabric Tape',
  'Threads & Needles',
  'Packaging Materials',
  'Chemicals & Oil',
  'Machine Spare Parts',
  'General Factory Store'
];

export const BillsExpensesView: React.FC<BillsExpensesViewProps> = ({
  expenses = [],
  purchases = [],
  users = [],
  currentUser,
  companyProfile,
  language,
  darkMode,
  onAddExpense,
  onUpdateExpenseStatus,
  onDeleteExpense,
  onAddPurchase,
  onDeletePurchase
}) => {
  const isBn = language === 'bn';
  const t = translations[language];

  const canManage = currentUser.accountType === 'hosting' || 
                    currentUser.accountType === 'owner' || 
                    currentUser.accountType === 'md' || 
                    currentUser.accountType === 'admin';

  const [activeTab, setActiveTab] = useState<'expenses' | 'purchases' | 'price_history'>('expenses');
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  // Dynamic Categories state with LocalStorage persistence
  const [expenseCategories, setExpenseCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('creative_factory_expense_categories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_EXPENSE_CATEGORIES;
  });
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [showAddCategoryInput, setShowAddCategoryInput] = useState(false);
  const [breakdownType, setBreakdownType] = useState<'expenses' | 'purchases'>('expenses');

  // Filter State
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Form State: Expense
  const [expUserId, setExpUserId] = useState(currentUser.id);
  const [expCategory, setExpCategory] = useState(expenseCategories[0] || INITIAL_EXPENSE_CATEGORIES[0]);
  const [expOrigin, setExpOrigin] = useState('');
  const [expDestination, setExpDestination] = useState('');
  const [expPurpose, setExpPurpose] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expDescription, setExpDescription] = useState('');
  const [expPaymentMethod, setExpPaymentMethod] = useState<'Cash' | 'bKash' | 'Nagad' | 'Bank' | 'Company Account'>('Cash');
  const [expVoucherNo, setExpVoucherNo] = useState('');

  const handleAddCustomCategory = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!expenseCategories.includes(trimmed)) {
      const updated = [...expenseCategories, trimmed];
      setExpenseCategories(updated);
      localStorage.setItem('creative_factory_expense_categories', JSON.stringify(updated));
    }
    setExpCategory(trimmed);
    setNewCategoryInput('');
    setShowAddCategoryInput(false);
  };

  // Form State: Purchase
  const [purProductName, setPurProductName] = useState('');
  const [purCategory, setPurCategory] = useState(PURCHASE_CATEGORIES[0]);
  const [purSupplier, setPurSupplier] = useState('');
  const [purQuantity, setPurQuantity] = useState('');
  const [purUnit, setPurUnit] = useState('Piece');
  const [purUnitPrice, setPurUnitPrice] = useState('');
  const [purInvoiceNumber, setPurInvoiceNumber] = useState('');
  const [purDate, setPurDate] = useState(new Date().toISOString().split('T')[0]);
  const [purDescription, setPurDescription] = useState('');

  // Live Previous Purchase Price Lookup & Comparison (Requirement 6)
  const previousPurchase = useMemo(() => {
    if (!purProductName.trim()) return null;
    const match = purchases
      .filter(p => p.productName.trim().toLowerCase() === purProductName.trim().toLowerCase())
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
    return match[0] || null;
  }, [purchases, purProductName]);

  const currentPriceNum = parseFloat(purUnitPrice) || 0;
  const prevPriceNum = previousPurchase ? previousPurchase.unitPrice : 0;
  const priceDiff = currentPriceNum - prevPriceNum;
  const percentDiff = prevPriceNum > 0 ? ((currentPriceNum - prevPriceNum) / prevPriceNum) * 100 : 0;

  // Calculations
  const totalExpenseAmount = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  const totalPurchaseAmount = useMemo(() => {
    return purchases.reduce((sum, p) => sum + (Number(p.totalPrice) || 0), 0);
  }, [purchases]);

  const pendingExpenseCount = useMemo(() => {
    return expenses.filter(e => e.status === 'Pending').length;
  }, [expenses]);

  const reimbursedExpenseAmount = useMemo(() => {
    return expenses
      .filter(e => e.paymentStatus === 'Reimbursed' || e.paymentStatus === 'Paid')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  // Sector Breakdown (Where & How Much Factory Money Was Spent)
  const sectorBreakdown = useMemo(() => {
    const map: Record<string, { total: number; count: number; name: string }> = {};
    expenses.forEach(e => {
      const cat = e.category || 'Other Factory Expense';
      if (!map[cat]) map[cat] = { total: 0, count: 0, name: cat };
      map[cat].total += Number(e.amount) || 0;
      map[cat].count += 1;
    });
    return Object.values(map).map(item => ({
      ...item,
      pct: totalExpenseAmount > 0 ? Math.round((item.total / totalExpenseAmount) * 100) : 0
    })).sort((a, b) => b.total - a.total);
  }, [expenses, totalExpenseAmount]);

  // Purchase Sector Breakdown
  const purchaseSectorBreakdown = useMemo(() => {
    const map: Record<string, { total: number; count: number; name: string }> = {};
    purchases.forEach(p => {
      const cat = p.category || 'General Factory Store';
      if (!map[cat]) map[cat] = { total: 0, count: 0, name: cat };
      map[cat].total += Number(p.totalPrice) || 0;
      map[cat].count += 1;
    });
    return Object.values(map).map(item => ({
      ...item,
      pct: totalPurchaseAmount > 0 ? Math.round((item.total / totalPurchaseAmount) * 100) : 0
    })).sort((a, b) => b.total - a.total);
  }, [purchases, totalPurchaseAmount]);

  // Price History grouped by product
  const priceHistoryList = useMemo(() => {
    const map: Record<string, PurchaseRecord[]> = {};
    purchases.forEach(p => {
      const key = p.productName.trim().toLowerCase();
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });

    return Object.keys(map).map(k => {
      const records = map[k].sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
      const latest = records[0];
      const lowest = Math.min(...records.map(r => r.unitPrice));
      const highest = Math.max(...records.map(r => r.unitPrice));
      return {
        productName: latest.productName,
        category: latest.category,
        unit: latest.unit,
        latestPrice: latest.unitPrice,
        latestDate: latest.transactionDate,
        latestSupplier: latest.supplier,
        lowestPrice: lowest,
        highestPrice: highest,
        purchaseCount: records.length,
        history: records
      };
    });
  }, [purchases]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (!canManage && e.userId !== currentUser.id) return false;
      if (selectedCategoryFilter !== 'all' && e.category !== selectedCategoryFilter) return false;
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        (e.employeeName || '').toLowerCase().includes(q) ||
        (e.purpose || '').toLowerCase().includes(q) ||
        (e.category || '').toLowerCase().includes(q) ||
        (e.origin || '').toLowerCase().includes(q) ||
        (e.destination || '').toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q)
      );
    });
  }, [expenses, canManage, currentUser.id, searchTerm, selectedCategoryFilter]);

  // Filtered Purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        (p.productName || '').toLowerCase().includes(q) ||
        (p.supplier || '').toLowerCase().includes(q) ||
        (p.invoiceNumber || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      );
    });
  }, [purchases, searchTerm]);

  // Submit Expense
  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetUser = users.find(u => u.id === expUserId) || currentUser;
    const amountVal = parseFloat(expAmount) || 0;

    onAddExpense({
      type: 'employee_expense',
      userId: targetUser.id,
      employeeId: targetUser.employeeId || 'CAF-EXP',
      employeeName: targetUser.fullName,
      section: targetUser.section || 'Factory Floor',
      origin: expOrigin.trim() || undefined,
      destination: expDestination.trim() || undefined,
      purpose: expPurpose.trim() || 'Official Expense',
      category: expCategory,
      amount: amountVal,
      transactionDate: expDate + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      description: expDescription.trim() || undefined,
      status: canManage && expUserId === currentUser.id ? 'Approved' : 'Pending',
      paymentStatus: 'Pending'
    });

    setIsExpenseModalOpen(false);
    setExpPurpose('');
    setExpAmount('');
    setExpDescription('');
    setExpOrigin('');
    setExpDestination('');
  };

  // Submit Purchase
  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(purQuantity) || 1;
    const unitPrice = parseFloat(purUnitPrice) || 0;
    const total = qty * unitPrice;

    onAddPurchase({
      type: 'company_purchase',
      productName: purProductName.trim(),
      category: purCategory,
      supplier: purSupplier.trim() || 'Local Market / Vendor',
      quantity: qty,
      unit: purUnit,
      unitPrice,
      totalPrice: total,
      transactionDate: purDate + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      invoiceNumber: purInvoiceNumber.trim() || `INV-${Date.now().toString().slice(-6)}`,
      description: purDescription.trim() || undefined,
      createdBy: currentUser.fullName,
      createdById: currentUser.id,
      status: 'Approved'
    });

    setIsPurchaseModalOpen(false);
    setPurProductName('');
    setPurSupplier('');
    setPurQuantity('');
    setPurUnitPrice('');
    setPurInvoiceNumber('');
    setPurDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Receipt className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl font-black tracking-tight">
                {isBn ? 'বিল, ভাউচার ও ফ্যাক্টরি খরচ' : 'Bills, Vouchers & Factory Expenses'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isBn 
                  ? 'কর্মীদের কনভেন্স ও ভ্রমণ বিল, কাঁচামাল ক্রয়ের ইনভয়েস এবং ক্রয়মূল্য যাচাইকরণ' 
                  : 'Track staff expense claims, factory purchase invoices, and monitor raw material pricing trends'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer transition"
          >
            <Plus className="w-4 h-4" />
            <span>{isBn ? 'কর্মীর বিল যোগ করুন' : 'Add Expense Claim'}</span>
          </button>

          {canManage && (
            <button
              onClick={() => setIsPurchaseModalOpen(true)}
              className="flex-1 md:flex-none px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer transition"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{isBn ? 'ফ্যাক্টরি ক্রয় রেকর্ড' : 'Record Purchase'}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl border shadow-sm space-y-1 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>{isBn ? 'কর্মীদের মোট বিল' : 'Staff Claims'}</span>
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            ৳{totalExpenseAmount.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">
            {expenses.length} {isBn ? 'টি আবেদন' : 'claims submitted'}
          </div>
        </div>

        <div className={`p-4 rounded-2xl border shadow-sm space-y-1 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>{isBn ? 'ফ্যাক্টরি কাঁচামাল ক্রয়' : 'Factory Purchases'}</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <ShoppingCart className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            ৳{totalPurchaseAmount.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">
            {purchases.length} {isBn ? 'টি চালান / ইনভয়েস' : 'invoices recorded'}
          </div>
        </div>

        <div className={`p-4 rounded-2xl border shadow-sm space-y-1 ${
          pendingExpenseCount > 0 ? (darkMode ? 'bg-amber-950/20 border-amber-800/40' : 'bg-amber-50/60 border-amber-200') : (darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200')
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>{isBn ? 'অপেক্ষমান বিল' : 'Pending Approvals'}</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {pendingExpenseCount}
          </div>
          <div className="text-[11px] text-slate-400">
            {isBn ? 'অনুমোদন প্রয়োজন' : 'Awaiting admin review'}
          </div>
        </div>

        <div className={`p-4 rounded-2xl border shadow-sm space-y-1 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>{isBn ? 'পরিশোধিত বিল' : 'Reimbursed / Paid'}</span>
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
            ৳{reimbursedExpenseAmount.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">
            {isBn ? 'কর্মীদের পরিশোধ করা হয়েছে' : 'Reimbursed to staff'}
          </div>
        </div>
      </div>

      {/* Prominent Sector & Purpose Cost Breakdown ("কোথায় কোথায় কত টাকার খরচ হলো") */}
      <div className={`p-5 sm:p-6 rounded-3xl border shadow-xs space-y-4 ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <span>{isBn ? 'কোথায় কোথায় কত টাকার খরচ হলো (Sector Cost Breakdown)' : 'Where & How Much Money Was Spent'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isBn 
                  ? 'ফ্যাক্টরির বিভিন্ন খাত ও ক্যাটাগরি অনুযায়ী খরচের মোট পরিমাণ ও শতকরা বিভাজন' 
                  : 'Categorical distribution of operational expenditures and purchase bills'}
              </p>
            </div>
          </div>

          {/* Toggle between Expense Claims and Material Purchases */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setBreakdownType('expenses')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                breakdownType === 'expenses'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>{isBn ? 'কর্মীদের বিলের খাত' : 'Staff Expenses'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/20 text-white">
                ৳{totalExpenseAmount.toLocaleString()}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setBreakdownType('purchases')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                breakdownType === 'purchases'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>{isBn ? 'কাঁচামাল ও মালামাল ক্রয়' : 'Purchases'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/20 text-white">
                ৳{totalPurchaseAmount.toLocaleString()}
              </span>
            </button>
          </div>
        </div>

        {/* Breakdown Items Grid */}
        {breakdownType === 'expenses' ? (
          sectorBreakdown.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              {isBn ? 'এখনো কোনো খরচের ভাউচার রেকর্ড করা হয়নি।' : 'No expense claims recorded yet.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sectorBreakdown.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedCategoryFilter(selectedCategoryFilter === item.name ? 'all' : item.name);
                    setActiveTab('expenses');
                  }}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-2 hover:shadow-xs ${
                    selectedCategoryFilter === item.name
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40'
                      : darkMode ? 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                      {item.name}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 shrink-0">
                      {item.pct}%
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400">
                      ৳{item.total.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {item.count} {isBn ? 'টি ভাউচার' : 'claims'}
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(4, item.pct))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          purchaseSectorBreakdown.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              {isBn ? 'এখনো কোনো মালামাল ক্রয়ের ইনভয়েস নেই।' : 'No purchase invoices recorded yet.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {purchaseSectorBreakdown.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setActiveTab('purchases');
                  }}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-2 hover:shadow-xs ${
                    darkMode ? 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                      {item.name}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
                      {item.pct}%
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                      ৳{item.total.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {item.count} {isBn ? 'টি চালান' : 'invoices'}
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(4, item.pct))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center justify-between gap-4 border-b dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'expenses'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>{isBn ? 'কর্মীদের বিল ও খরচ' : 'Employee Claims'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/20 text-white">
              {expenses.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'purchases'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{isBn ? 'কোম্পানি ক্রয় ও চালান' : 'Company Purchases'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/20 text-white">
              {purchases.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('price_history')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'price_history'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{isBn ? 'দর যাচাই ও মূল্য ইতিহাস' : 'Price History & Trends'}</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-64 hidden sm:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isBn ? 'খুঁজুন...' : 'Search...'}
            className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
            }`}
          />
        </div>
      </div>

      {/* 1. Employee Expenses Tab */}
      {activeTab === 'expenses' && (
        <div className={`rounded-3xl border shadow-sm overflow-hidden ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                darkMode ? 'bg-slate-800/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                <tr>
                  <th className="py-3 px-4">{isBn ? 'কর্মী' : 'Employee'}</th>
                  <th className="py-3 px-4">{isBn ? 'ক্যাটাগরি ও বিবরণ' : 'Category & Purpose'}</th>
                  <th className="py-3 px-4">{isBn ? 'যাত্রা স্থান (Origin → Dest)' : 'Route'}</th>
                  <th className="py-3 px-4">{isBn ? 'পরিমাণ (BDT)' : 'Amount'}</th>
                  <th className="py-3 px-4">{isBn ? 'তারিখ' : 'Date'}</th>
                  <th className="py-3 px-4">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                  <th className="py-3 px-4 text-right">{isBn ? 'পদক্ষেপ' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-semibold">{isBn ? 'কোন খরচের রেকর্ড পাওয়া যায়নি' : 'No expense records found'}</p>
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => {
                    const isPending = exp.status === 'Pending';
                    const isApproved = exp.status === 'Approved';

                    return (
                      <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {exp.employeeName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {exp.employeeId} · {exp.section}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {exp.category}
                          </span>
                          <p className="text-slate-700 dark:text-slate-300 font-medium mt-1">
                            {exp.purpose}
                          </p>
                          {exp.description && (
                            <p className="text-[11px] text-slate-400 truncate">{exp.description}</p>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {exp.origin || exp.destination ? (
                            <div className="text-slate-600 dark:text-slate-300">
                              <span>{exp.origin || 'Factory'}</span>
                              <span className="mx-1 text-slate-400">→</span>
                              <span className="font-bold">{exp.destination || 'Field'}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-black text-slate-900 dark:text-slate-100">
                          ৳{Number(exp.amount).toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                          {exp.transactionDate}
                        </td>

                        <td className="py-3.5 px-4">
                          {isPending && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              {isBn ? 'অপেক্ষমান' : 'Pending'}
                            </span>
                          )}
                          {isApproved && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              {isBn ? 'অনুমোদিত' : 'Approved'}
                            </span>
                          )}
                          {exp.status === 'Rejected' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                              {isBn ? 'বাতিল' : 'Rejected'}
                            </span>
                          )}
                          {exp.paymentStatus === 'Reimbursed' && (
                            <span className="ml-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                              Paid
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {canManage && isPending && (
                              <>
                                <button
                                  onClick={() => onUpdateExpenseStatus(exp.id, 'Approved')}
                                  title={isBn ? 'অনুমোদন করুন' : 'Approve'}
                                  className="p-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 cursor-pointer"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => onUpdateExpenseStatus(exp.id, 'Rejected')}
                                  title={isBn ? 'বাতিল করুন' : 'Reject'}
                                  className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 cursor-pointer"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}

                            {canManage && (
                              <button
                                onClick={() => {
                                  if (confirm(isBn ? 'মুছে ফেলতে চান?' : 'Delete expense record?')) {
                                    onDeleteExpense(exp.id);
                                  }
                                }}
                                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Company Purchases Tab */}
      {activeTab === 'purchases' && (
        <div className={`rounded-3xl border shadow-sm overflow-hidden ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                darkMode ? 'bg-slate-800/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                <tr>
                  <th className="py-3 px-4">{isBn ? 'পণ্য ও ইনভয়েস' : 'Product & Invoice'}</th>
                  <th className="py-3 px-4">{isBn ? 'ক্যাটাগরি' : 'Category'}</th>
                  <th className="py-3 px-4">{isBn ? 'সরবরাহকারী' : 'Supplier'}</th>
                  <th className="py-3 px-4">{isBn ? 'পরিমাণ' : 'Quantity'}</th>
                  <th className="py-3 px-4">{isBn ? 'একক দর (BDT)' : 'Unit Price'}</th>
                  <th className="py-3 px-4">{isBn ? 'মোট মূল্য' : 'Total Price'}</th>
                  <th className="py-3 px-4">{isBn ? 'তারিখ' : 'Date'}</th>
                  <th className="py-3 px-4 text-right">{isBn ? 'পদক্ষেপ' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-semibold">{isBn ? 'কোন ক্রয়ের রেকর্ড পাওয়া যায়নি' : 'No purchase records found'}</p>
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((pur) => (
                    <tr key={pur.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {pur.productName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {pur.invoiceNumber}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {pur.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {pur.supplier}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {pur.quantity} {pur.unit}
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        ৳{pur.unitPrice.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        ৳{pur.totalPrice.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {pur.transactionDate}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {canManage && (
                          <button
                            onClick={() => {
                              if (confirm(isBn ? 'এই ক্রয়ের রেকর্ড মুছে ফেলতে চান?' : 'Delete this purchase record?')) {
                                onDeletePurchase(pur.id);
                              }
                            }}
                            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Price History Tab */}
      {activeTab === 'price_history' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {priceHistoryList.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400">
                <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="font-semibold">{isBn ? 'কোন ক্রয়ের ইতিহাস এখনো নেই' : 'No purchase price history available yet'}</p>
              </div>
            ) : (
              priceHistoryList.map((item, idx) => (
                <div key={idx} className={`p-5 rounded-3xl border shadow-sm space-y-3 ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        {item.category}
                      </span>
                      <h4 className="font-black text-sm text-slate-900 dark:text-slate-100 mt-1">
                        {item.productName}
                      </h4>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      {item.purchaseCount}x orders
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">{isBn ? 'সর্বশেষ দর' : 'Latest Rate'}</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                        ৳{item.latestPrice.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">/{item.unit}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">{isBn ? 'সর্বনিম্ন / সর্বোচ্চ' : 'Range (Low / High)'}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        ৳{item.lowestPrice.toFixed(2)} - ৳{item.highestPrice.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">{item.latestSupplier}</span>
                    </div>
                  </div>

                  {/* History timeline list */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {isBn ? 'পূর্ববর্তী ইনভয়েসসমূহ' : 'Historical Invoices'}
                    </span>
                    {item.history.slice(0, 3).map((h, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>{h.transactionDate.split(' ')[0]} ({h.supplier.split(' ')[0]})</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">৳{h.unitPrice.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`max-w-md w-full rounded-3xl p-6 border shadow-2xl space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b dark:border-slate-800">
              <h3 className="font-black text-base flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-500" />
                <span>{isBn ? 'কর্মীদের খরচের বিল জমা' : 'Submit Expense Claim'}</span>
              </h3>
              <button 
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="space-y-3 text-xs">
              {canManage && (
                <div>
                  <label className="block font-bold text-slate-500 mb-1">
                    {isBn ? 'কর্মী নির্বাচন' : 'Employee'}
                  </label>
                  <select
                    value={expUserId}
                    onChange={(e) => setExpUserId(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.employeeId} · {u.section})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Dynamic Category with Custom Option Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    {isBn ? 'খরচের ক্যাটাগরি ও অপশন' : 'Expense Category & Options'} *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddCategoryInput(!showAddCategoryInput)}
                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>{showAddCategoryInput ? '✕ বন্ধ' : '+ নতুন ক্যাটাগরি অপশন যোগ'}</span>
                  </button>
                </div>

                {/* Quick Category Selector Pills */}
                <div className="flex flex-wrap gap-1">
                  {expenseCategories.slice(0, 6).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setExpCategory(c)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        expCategory === c
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {c.split('&')[0].trim()}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    list="bills-expense-categories-list"
                    placeholder={isBn ? 'ক্যাটাগরি লিখুন বা লিস্ট থেকে বেছে নিন...' : 'Type or select category...'}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                  <datalist id="bills-expense-categories-list">
                    {expenseCategories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </datalist>
                </div>

                {/* Custom Category Inline Form */}
                {showAddCategoryInput && (
                  <div className="flex gap-2 p-2 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50">
                    <input
                      type="text"
                      value={newCategoryInput}
                      onChange={(e) => setNewCategoryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomCategory(newCategoryInput);
                        }
                      }}
                      placeholder={isBn ? 'নতুন ক্যাটাগরির নাম লিখুন (যেমন: কারখানা ভাড়া, ফুয়েল...)' : 'Type new category name...'}
                      className={`flex-1 px-2.5 py-1.5 rounded-lg border text-xs ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddCustomCategory(newCategoryInput)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-2xs transition"
                    >
                      {isBn ? 'যোগ করুন' : 'Add'}
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-500 mb-1">
                    {isBn ? 'যাত্রার স্থান (Origin)' : 'Origin'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Factory Bamnartek"
                    value={expOrigin}
                    onChange={(e) => setExpOrigin(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">
                    {isBn ? 'গন্তব্য (Destination)' : 'Destination'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Buying House / Lab"
                    value={expDestination}
                    onChange={(e) => setExpDestination(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">
                  {isBn ? 'খরচের উদ্দেশ্য' : 'Purpose'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sample handover or lab test delivery"
                  value={expPurpose}
                  onChange={(e) => setExpPurpose(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-500 mb-1">
                    {isBn ? 'পরিমাণ (BDT)' : 'Amount (BDT)'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="৳ 0.00"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">
                    {isBn ? 'তারিখ' : 'Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">
                  {isBn ? 'অতিরিক্ত মন্তব্য বা ভাউচার নম্বর' : 'Description / Notes'}
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Rickshaw & CNG fare with cash memo attached"
                  value={expDescription}
                  onChange={(e) => setExpDescription(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl border hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-sm"
                >
                  {isBn ? 'বিল জমা দিন' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Purchase Modal */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`max-w-md w-full rounded-3xl p-6 border shadow-2xl space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b dark:border-slate-800">
              <h3 className="font-black text-base flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-500" />
                <span>{isBn ? 'কোম্পানি ক্রয় ও চালান যোগ করুন' : 'Record Company Purchase'}</span>
              </h3>
              <button 
                onClick={() => setIsPurchaseModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePurchaseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-500 mb-1">
                  {isBn ? 'পণ্যের নাম' : 'Product / Material Name'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Antique Brass Zipper Slider #5"
                  value={purProductName}
                  onChange={(e) => setPurProductName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-500">
                      {isBn ? 'ক্যাটাগরি *' : 'Category *'}
                    </label>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      {isBn ? '✏️ ফ্রি টাইপ' : '✏️ Free typing'}
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={purCategory}
                    onChange={(e) => setPurCategory(e.target.value)}
                    list="bills-purchase-categories-list"
                    placeholder={isBn ? 'ক্যাটাগরি লিখুন বা বেছে নিন...' : 'Type or select category...'}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                  <datalist id="bills-purchase-categories-list">
                    {PURCHASE_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">
                    {isBn ? 'সরবরাহকারী / দোকান' : 'Supplier'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dhaka Metal Works"
                    value={purSupplier}
                    onChange={(e) => setPurSupplier(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-500 mb-1">
                    {isBn ? 'পরিমাণ' : 'Quantity'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="1"
                    value={purQuantity}
                    onChange={(e) => setPurQuantity(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">
                    {isBn ? 'একক' : 'Unit'}
                  </label>
                  <select
                    value={purUnit}
                    onChange={(e) => setPurUnit(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="Piece">Piece (পিস)</option>
                    <option value="Roll">Roll (রোল)</option>
                    <option value="Kg">Kg (কেজি)</option>
                    <option value="Meter">Meter (মিটার)</option>
                    <option value="Dozen">Dozen (ডজন)</option>
                    <option value="Box">Box (বক্স)</option>
                    <option value="Gross">Gross (গ্রস)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">
                    {isBn ? 'একক দর (BDT)' : 'Unit Price'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={purUnitPrice}
                    onChange={(e) => setPurUnitPrice(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              {/* Computed total banner */}
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-black text-center text-sm">
                {isBn ? 'মোট বিল: ৳' : 'Total Price: ৳'}
                {((parseFloat(purQuantity) || 0) * (parseFloat(purUnitPrice) || 0)).toLocaleString()}
              </div>

              {/* Requirement 6: Previous Purchase Price Comparison Card */}
              {purProductName.trim() && (
                <div className={`p-3 rounded-2xl border text-xs space-y-1.5 transition ${
                  !previousPurchase 
                    ? (darkMode ? 'bg-slate-800/60 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500')
                    : currentPriceNum > 0 && priceDiff > 0
                      ? (darkMode ? 'bg-rose-950/30 border-rose-900/60 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800')
                      : currentPriceNum > 0 && priceDiff < 0
                        ? (darkMode ? 'bg-emerald-950/30 border-emerald-900/60 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800')
                        : (darkMode ? 'bg-indigo-950/30 border-indigo-900/60 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-800')
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1">
                      <span>📊</span>
                      <span>{isBn ? 'পূর্ববর্তী ক্রয়মূল্য তুলনা (Price History):' : 'Previous Purchase Price Comparison:'}</span>
                    </span>
                    {previousPurchase && (
                      <span className="font-mono text-[10px] opacity-75">
                        {previousPurchase.transactionDate.split(' ')[0]}
                      </span>
                    )}
                  </div>

                  {!previousPurchase ? (
                    <p className="text-[11px] opacity-80">
                      {isBn ? 'এই পণ্যের পূর্ববর্তী কোনো ক্রয় রেকর্ড নেই (No previous price available)' : 'No previous price available for this product'}
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-black/5 dark:border-white/10">
                      <div>
                        <span className="text-[10px] opacity-75 block">{isBn ? 'পূর্বের ক্রয় দর:' : 'Previous Rate:'}</span>
                        <span className="font-bold text-sm">
                          ৳{prevPriceNum.toFixed(2)} <span className="text-[10px] font-normal font-mono">/{previousPurchase.unit}</span>
                        </span>
                        <span className="text-[10px] block opacity-75 truncate">{previousPurchase.supplier}</span>
                      </div>
                      <div>
                        <span className="text-[10px] opacity-75 block">{isBn ? 'দর পরিবর্তন:' : 'Price Difference:'}</span>
                        {currentPriceNum > 0 ? (
                          priceDiff > 0 ? (
                            <span className="font-black text-xs text-rose-600 dark:text-rose-400 block">
                              🔺 +৳{priceDiff.toFixed(2)} (+{percentDiff.toFixed(1)}%) বৃদ্ধি
                            </span>
                          ) : priceDiff < 0 ? (
                            <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 block">
                              🔻 -৳{Math.abs(priceDiff).toFixed(2)} ({percentDiff.toFixed(1)}%) সাশ্রয়
                            </span>
                          ) : (
                            <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400 block">
                              ✓ অপরিবর্তিত (No change)
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] opacity-70 block">{isBn ? 'বর্তমান দর লিখলে তুলনা হবে' : 'Enter unit price to compare'}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-500 mb-1">
                    {isBn ? 'ইনভয়েস বা মেমো নং' : 'Invoice Number'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV-9912"
                    value={purInvoiceNumber}
                    onChange={(e) => setPurInvoiceNumber(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">
                    {isBn ? 'ক্রয়ের তারিখ' : 'Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={purDate}
                    onChange={(e) => setPurDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-4 py-2 rounded-xl border hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-sm"
                >
                  {isBn ? 'ক্রয় সংরক্ষণ করুন' : 'Save Purchase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
