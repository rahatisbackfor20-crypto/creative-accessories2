import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  User, 
  ProductionRecord, 
  AttendanceRecord, 
  OvertimeRecord, 
  LeaveRecord, 
  ExpenseRecord, 
  PurchaseRecord, 
  ProductRequest, 
  Language, 
  TabType 
} from '../types';
import { 
  Search, 
  X, 
  User as UserIcon, 
  Scissors, 
  Calendar, 
  Receipt, 
  Package, 
  Clock, 
  DollarSign, 
  ArrowRight, 
  Layers,
  Sparkles,
  Shield
} from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  productions: ProductionRecord[];
  attendance: AttendanceRecord[];
  overtime: OvertimeRecord[];
  leaves?: LeaveRecord[];
  expenses?: ExpenseRecord[];
  purchases?: PurchaseRecord[];
  productRequests?: ProductRequest[];
  currentUser: User;
  language: Language;
  darkMode: boolean;
  onNavigateToTab: (tab: TabType) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  users = [],
  productions = [],
  attendance = [],
  overtime = [],
  leaves = [],
  expenses = [],
  purchases = [],
  productRequests = [],
  currentUser,
  language,
  darkMode,
  onNavigateToTab
}) => {
  const isBn = language === 'bn';
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const q = query.trim().toLowerCase();

  // Search results
  const matchedUsers = useMemo(() => {
    if (!q) return [];
    return users.filter(u => 
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.employeeId || '').toLowerCase().includes(q) ||
      (u.section || '').toLowerCase().includes(q) ||
      (u.designation || '').toLowerCase().includes(q) ||
      (u.whatsapp || '').includes(q)
    ).slice(0, 5);
  }, [users, q]);

  const matchedProductions = useMemo(() => {
    if (!q) return [];
    return productions.filter(p => 
      (p.itemName || '').toLowerCase().includes(q) ||
      (p.section || '').toLowerCase().includes(q) ||
      (p.notes || '').toLowerCase().includes(q) ||
      (p.buyer || '').toLowerCase().includes(q)
    ).slice(0, 4);
  }, [productions, q]);

  const matchedLeaves = useMemo(() => {
    if (!q) return [];
    return leaves.filter(l => 
      (l.employeeName || '').toLowerCase().includes(q) ||
      (l.employeeId || '').toLowerCase().includes(q) ||
      (l.leaveType || '').toLowerCase().includes(q) ||
      (l.reason || '').toLowerCase().includes(q)
    ).slice(0, 4);
  }, [leaves, q]);

  const matchedExpenses = useMemo<{ expMatches: ExpenseRecord[]; purMatches: PurchaseRecord[] }>(() => {
    if (!q) return { expMatches: [], purMatches: [] };
    const expMatches = expenses.filter(e => 
      (e.employeeName || '').toLowerCase().includes(q) ||
      (e.purpose || '').toLowerCase().includes(q) ||
      (e.category || '').toLowerCase().includes(q)
    ).slice(0, 3);

    const purMatches = purchases.filter(p => 
      (p.productName || '').toLowerCase().includes(q) ||
      (p.supplier || '').toLowerCase().includes(q) ||
      (p.invoiceNumber || '').toLowerCase().includes(q)
    ).slice(0, 3);

    return { expMatches, purMatches };
  }, [expenses, purchases, q]);

  const matchedRequests = useMemo(() => {
    if (!q) return [];
    return productRequests.filter(r => 
      (r.productName || '').toLowerCase().includes(q) ||
      (r.requestNumber || '').toLowerCase().includes(q) ||
      (r.employeeName || '').toLowerCase().includes(q) ||
      (r.reason || '').toLowerCase().includes(q)
    ).slice(0, 4);
  }, [productRequests, q]);

  // Quick navigation destinations
  const quickLinks: { id: TabType; titleEn: string; titleBn: string; icon: any }[] = [
    { id: 'dashboard', titleEn: 'Dashboard Overview', titleBn: 'ড্যাশবোর্ড ওভারভিউ', icon: Layers },
    { id: 'production', titleEn: 'Daily Production Tracker', titleBn: 'দৈনিক প্রোডাকশন খাতা', icon: Scissors },
    { id: 'monthly_production', titleEn: 'Monthly Production Summary', titleBn: 'মাসিক প্রোডাকশন রিপোর্ট', icon: Calendar },
    { id: 'attendance', titleEn: 'Employee Attendance & Punch', titleBn: 'হাজিরা খাতা ও পাঞ্চ', icon: Clock },
    { id: 'leave', titleEn: 'Leave Management & Approvals', titleBn: 'ছুটি ব্যবস্থাপনা ও অনুমোদন', icon: Calendar },
    { id: 'overtime', titleEn: 'Overtime & Duty Hours', titleBn: 'ওভারটাইম ও ডিউটি রেকর্ড', icon: Clock },
    { id: 'payroll', titleEn: 'Payroll & Salary Sheets', titleBn: 'বেতন ও পে-রোল ম্যানেজমেন্ট', icon: DollarSign },
    { id: 'expenses', titleEn: 'Bills, Vouchers & Purchases', titleBn: 'বিল, ভাউচার ও ফ্যাক্টরি খরচ', icon: Receipt },
    { id: 'calendar', titleEn: 'Bangladesh Holiday Calendar', titleBn: 'সরকারি ছুটির ক্যালেন্ডার', icon: Calendar },
    { id: 'product_requests', titleEn: 'Product & Material Requisitions', titleBn: 'মালামাল রিকুইজিশন ও স্টক এলার্ট', icon: Package }
  ];

  const matchedQuickLinks = useMemo(() => {
    if (!q) return quickLinks.slice(0, 6);
    return quickLinks.filter(l => 
      l.titleEn.toLowerCase().includes(q) || 
      l.titleBn.toLowerCase().includes(q) ||
      l.id.toLowerCase().includes(q)
    );
  }, [quickLinks, q]);

  const hasAnyResults = matchedUsers.length > 0 || 
                        matchedProductions.length > 0 || 
                        matchedLeaves.length > 0 || 
                        matchedExpenses.expMatches.length > 0 || 
                        matchedExpenses.purMatches.length > 0 || 
                        matchedRequests.length > 0 || 
                        (q ? matchedQuickLinks.length > 0 : false);

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose} 
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 cursor-pointer"
    >
      <div 
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[80vh] transition-all cursor-default ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar with Mouse Click Close Button */}
        <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <Search className="w-5 h-5 text-indigo-500 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isBn 
                ? 'কর্মীর নাম, আইডি, প্রোডাকশন, বিল, রিকুইজিশন বা যেকোনো ট্যাব খুঁজুন...' 
                : 'Search employee, ID, production, leave, bills, requisitions, or modules...'}
              className="w-full text-sm font-semibold bg-transparent focus:outline-none placeholder-slate-400"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer shrink-0"
                title={isBn ? 'লেখা মুছুন' : 'Clear input'}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mouse Clickable Close Button & ESC Badge */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-2xs active:scale-95"
              title={isBn ? 'সার্চ উইন্ডো বন্ধ করুন (মাউস দিয়ে ক্লিক করুন)' : 'Close search window (Click with mouse)'}
            >
              <X className="w-4 h-4" />
              <span>{isBn ? 'বন্ধ করুন' : 'Close'}</span>
            </button>
            <span className="hidden sm:inline-block px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 border dark:border-slate-700">
              ESC
            </span>
          </div>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Quick empty state when no query */}
          {!q && (
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                {isBn ? 'সরাসরি নেভিগেশন' : 'Quick Navigation'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {matchedQuickLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <button
                      key={link.id}
                      onClick={() => onNavigateToTab(link.id)}
                      className={`p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition cursor-pointer ${
                        darkMode 
                          ? 'bg-slate-800/40 border-slate-800 hover:bg-slate-800 hover:border-slate-700' 
                          : 'bg-slate-50 border-slate-100 hover:bg-indigo-50/50 hover:border-indigo-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                          <Icon className="w-4 h-4" />
                        </span>
                        <div>
                          <div className="font-bold text-xs">
                            {isBn ? link.titleBn : link.titleEn}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Tab: {link.id}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* If searching and no match */}
          {q && !hasAnyResults && (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Search className="w-8 h-8 mx-auto opacity-30" />
              <p className="font-bold text-sm">
                {isBn ? `"${query}" এর জন্য কোনো ফলাফল পাওয়া যায়নি` : `No results found for "${query}"`}
              </p>
              <p className="text-xs text-slate-500">
                {isBn ? 'অন্য কোনো নাম, আইডি বা কিওয়ার্ড দিয়ে চেষ্টা করুন' : 'Try searching by employee name, ID, or item name'}
              </p>
            </div>
          )}

          {/* 1. Matched Users */}
          {matchedUsers.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                👥 {isBn ? 'কর্মকর্তা ও কর্মচারীবৃন্দ' : 'Employees & Staff'}
              </span>
              <div className="space-y-1.5">
                {matchedUsers.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => onNavigateToTab('attendance')}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition cursor-pointer ${
                      darkMode ? 'bg-slate-800/50 border-slate-800 hover:bg-slate-800' : 'bg-slate-50 border-slate-100 hover:bg-indigo-50/50 hover:border-indigo-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                        {u.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-xs flex items-center gap-1.5">
                          <span>{u.fullName}</span>
                          {u.accountType === 'md' && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-purple-500 text-white">MD</span>
                          )}
                          {u.accountType === 'owner' && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500 text-white">Owner</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {u.employeeId || 'ID'} · {u.section || 'General'} · {u.designation || 'Worker'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500">
                        {u.whatsapp || u.section}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Matched Productions */}
          {matchedProductions.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                ✂️ {isBn ? 'প্রোডাকশন রেকর্ড' : 'Production Records'}
              </span>
              <div className="space-y-1.5">
                {matchedProductions.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onNavigateToTab('production')}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition cursor-pointer ${
                      darkMode ? 'bg-slate-800/50 border-slate-800 hover:bg-slate-800' : 'bg-slate-50 border-slate-100 hover:bg-indigo-50/50 hover:border-indigo-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs">
                        {p.itemName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {p.section} · {p.date} · {p.buyer ? `Buyer: ${p.buyer}` : (p.notes || '')}
                      </div>
                    </div>
                    <div className="text-right font-black text-indigo-600 dark:text-indigo-400 text-xs">
                      {p.prodQty} {p.unit || 'pcs'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Matched Leaves */}
          {matchedLeaves.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                🗓️ {isBn ? 'ছুটির আবেদনসমূহ' : 'Leave Records'}
              </span>
              <div className="space-y-1.5">
                {matchedLeaves.map((l) => (
                  <div
                    key={l.id}
                    onClick={() => onNavigateToTab('leave')}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition cursor-pointer ${
                      darkMode ? 'bg-slate-800/50 border-slate-800 hover:bg-slate-800' : 'bg-slate-50 border-slate-100 hover:bg-indigo-50/50 hover:border-indigo-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs">
                        {l.employeeName} ({l.leaveType})
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {l.startDate} to {l.endDate} ({l.daysCount} days) · {l.reason}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      l.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {l.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Matched Expenses & Purchases */}
          {(matchedExpenses.expMatches.length > 0 || matchedExpenses.purMatches.length > 0) && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                🧾 {isBn ? 'বিল ও ফ্যাক্টরি খরচ' : 'Bills & Purchases'}
              </span>
              <div className="space-y-1.5">
                {matchedExpenses.expMatches.map((e) => (
                  <div
                    key={e.id}
                    onClick={() => onNavigateToTab('expenses')}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition cursor-pointer ${
                      darkMode ? 'bg-slate-800/50 border-slate-800 hover:bg-slate-800' : 'bg-slate-50 border-slate-100 hover:bg-indigo-50/50 hover:border-indigo-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs">
                        {e.employeeName} — {e.purpose}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {e.category} · {e.transactionDate}
                      </div>
                    </div>
                    <div className="text-right font-black text-xs text-slate-900 dark:text-slate-100">
                      ৳{Number(e.amount).toLocaleString()}
                    </div>
                  </div>
                ))}

                {matchedExpenses.purMatches.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onNavigateToTab('expenses')}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition cursor-pointer ${
                      darkMode ? 'bg-slate-800/50 border-slate-800 hover:bg-slate-800' : 'bg-slate-50 border-slate-100 hover:bg-indigo-50/50 hover:border-indigo-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs">
                        {p.productName} ({p.supplier})
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Inv: {p.invoiceNumber} · {p.quantity} {p.unit}
                      </div>
                    </div>
                    <div className="text-right font-black text-xs text-emerald-600 dark:text-emerald-400">
                      ৳{Number(p.totalPrice).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Matched Product Requests */}
          {matchedRequests.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                📦 {isBn ? 'মালামাল রিকুইজিশন ও স্টক' : 'Product Requisitions'}
              </span>
              <div className="space-y-1.5">
                {matchedRequests.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => onNavigateToTab('product_requests')}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition cursor-pointer ${
                      darkMode ? 'bg-slate-800/50 border-slate-800 hover:bg-slate-800' : 'bg-slate-50 border-slate-100 hover:bg-indigo-50/50 hover:border-indigo-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <span>{r.productName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({r.requestNumber})</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {r.quantity} {r.unit} · Req by {r.employeeName} ({r.section})
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      r.priority === 'Urgent' || r.priority === 'Critical' ? 'bg-rose-500/10 text-rose-500' : 'bg-indigo-500/10 text-indigo-500'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className={`p-3 border-t text-[11px] flex items-center justify-between ${
          darkMode ? 'bg-slate-800/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'
        }`}>
          <div className="flex items-center gap-2">
            <span className="font-mono bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded">Ctrl + K</span>
            <span>{isBn ? 'সার্বজনীন সার্চ' : 'Universal Spotlight'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded">ESC</span>
            <span>{isBn ? 'বন্ধ করুন' : 'Close'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
