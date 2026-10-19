import React from 'react';
import { ProductionRecord, Language } from '../types';
import { translations } from '../i18n';
import { 
  AlertTriangle, 
  Calendar, 
  Clock, 
  ChevronRight, 
  CheckCircle2, 
  TrendingUp, 
  Package, 
  Filter
} from 'lucide-react';

interface PriorityBarProps {
  productions: ProductionRecord[];
  selectedMonth: string; // 'YYYY-MM'
  onSelectMonth: (month: string) => void;
  language: Language;
  darkMode: boolean;
  onNavigateToProduction?: () => void;
}

export const PriorityBar: React.FC<PriorityBarProps> = ({
  productions,
  selectedMonth,
  onSelectMonth,
  language,
  darkMode,
  onNavigateToProduction
}) => {
  const t = translations[language];
  const isBn = language === 'bn';

  // Calculate days remaining from deliveryDate
  const getDeliveryCountdown = (deliveryDateStr?: string) => {
    if (!deliveryDateStr) return { days: 999, label: isBn ? 'তারিখ নেই' : 'No date', status: 'normal' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(deliveryDateStr);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        days: diffDays,
        label: isBn ? `${Math.abs(diffDays)} দিন ওভারডিউ!` : `${Math.abs(diffDays)}d Overdue!`,
        status: 'overdue'
      };
    } else if (diffDays === 0) {
      return {
        days: 0,
        label: isBn ? '🚨 আজকে ডেলিভারি' : '🚨 Due Today',
        status: 'today'
      };
    } else if (diffDays === 1) {
      return {
        days: 1,
        label: isBn ? '⚡ আগামীকাল ডেলিভারি' : '⚡ Due Tomorrow',
        status: 'urgent'
      };
    } else if (diffDays <= 3) {
      return {
        days: diffDays,
        label: isBn ? `⏳ ${diffDays} দিন বাকি` : `⏳ ${diffDays} days left`,
        status: 'urgent'
      };
    } else {
      return {
        days: diffDays,
        label: isBn ? `📅 ${diffDays} দিন বাকি` : `📅 ${diffDays} days left`,
        status: 'normal'
      };
    }
  };

  // Filter productions for selected month (matching orderDate, deliveryDate, or date)
  const monthProductions = productions.filter(p => {
    const recordMonth = (p.deliveryDate || p.date || '').substring(0, 7);
    return recordMonth === selectedMonth;
  });

  // Pending productions (status !== 'Completed') sorted by urgency
  const pendingOrders = [...monthProductions]
    .filter(p => p.status !== 'Completed')
    .sort((a, b) => {
      const da = a.deliveryDate ? new Date(a.deliveryDate).getTime() : 9999999999999;
      const db = b.deliveryDate ? new Date(b.deliveryDate).getTime() : 9999999999999;
      return da - db;
    });

  // Calculate totals for selected month
  const totalTargetQty = monthProductions.reduce((sum, p) => sum + Number(p.orderQty || 0), 0);
  const totalProducedQty = monthProductions.reduce((sum, p) => sum + Number(p.prodQty || 0), 0);
  const totalMonthAmount = monthProductions.reduce((sum, p) => sum + Number(p.totalAmount || (p.orderQty * 15)), 0);
  const completionRate = totalTargetQty > 0 ? Math.min(100, Math.round((totalProducedQty / totalTargetQty) * 100)) : 0;

  // Month options for dropdown: previous 2 months, current, and next 3 months
  const generateMonthOptions = () => {
    const options: { value: string; label: string }[] = [];
    const baseDate = new Date();
    for (let i = -3; i <= 4; i++) {
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1);
      const val = d.toISOString().substring(0, 7);
      const monthName = d.toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { month: 'long', year: 'numeric' });
      options.push({ value: val, label: monthName });
    }
    return options;
  };
  const monthOptions = generateMonthOptions();

  const cardBg = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-2">
      {/* Card 1: কাজের প্রায়োরিটি ও ডেলিভারি কাউন্টডাউন (8 Cols on desktop) */}
      <div className={`lg:col-span-7 border rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between ${cardBg}`}>
        <div>
          <div className="flex items-center justify-between border-b pb-3.5 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base tracking-tight flex items-center gap-2">
                  <span>{isBn ? 'কাজের প্রায়োরিটি ও ডেলিভারি কাউন্টডাউন' : 'Priority Line & Delivery Deadlines'}</span>
                  {pendingOrders.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                      {pendingOrders.length} {isBn ? 'বাকি' : 'Pending'}
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isBn ? 'জরুরি ডেলিভারি অর্ডারসমূহ ও বাকি উৎপাদনের তালিকা' : 'Active production backlog and delivery countdown'}
                </p>
              </div>
            </div>

            {onNavigateToProduction && (
              <button
                onClick={onNavigateToProduction}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>{isBn ? 'সব দেখুন' : 'View all'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Pending items list */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 my-2">
            {pendingOrders.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs flex flex-col items-center gap-1.5">
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                <span className="font-semibold">{isBn ? 'এই মাসের সকল ডেলিভারি ও প্রোডাকশন সম্পন্ন!' : 'All production orders for this month are completed!'}</span>
              </div>
            ) : (
              pendingOrders.slice(0, 3).map((item) => {
                const countdown = getDeliveryCountdown(item.deliveryDate);
                const remaining = Math.max(0, item.orderQty - item.prodQty);
                const pct = Math.min(100, Math.round((item.prodQty / item.orderQty) * 100));

                return (
                  <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold truncate text-slate-800 dark:text-slate-100">
                          {item.itemName}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                          ({item.buyer})
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                          {remaining.toLocaleString()} {item.unit} {isBn ? 'বাকি' : 'left'}
                        </span>
                        <span>·</span>
                        <span className="font-mono">{item.section}</span>
                      </div>

                      {/* Mini progress bar */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            pct >= 80 ? 'bg-emerald-500' : pct >= 40 ? 'bg-indigo-600' : 'bg-amber-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Delivery Countdown Badge */}
                    <div className="text-right shrink-0">
                      <span className={`inline-block px-2.5 py-1 rounded-xl text-[11px] font-extrabold ${
                        countdown.status === 'overdue'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : countdown.status === 'today'
                            ? 'bg-rose-500 text-white animate-pulse'
                            : countdown.status === 'urgent'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}>
                        {countdown.label}
                      </span>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {isBn ? 'ডেলিভারি' : 'Due'}: {item.deliveryDate || 'N/A'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer info strip */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] flex justify-between items-center text-slate-500 font-mono">
          <span>{isBn ? 'রানিং মাস' : 'Selected Month'}: {selectedMonth}</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
            {isBn ? 'প্রোডাকশন অগ্রগতি' : 'Progress'}: {completionRate}%
          </span>
        </div>
      </div>

      {/* Card 2: জরুরি অ্যালার্ট ও ডেলিভারি ডেট ফিল্টার (5 Cols on desktop) */}
      <div className={`lg:col-span-5 border rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between ${cardBg}`}>
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-3.5 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Filter className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base tracking-tight">
                  {isBn ? 'জরুরি অ্যালার্ট ও মাস ফিল্টার' : 'Month Filter & Alerts'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isBn ? 'বর্তমান মাসের রানিং হিসাব ও তারিখ পরিবর্তন' : 'Current active month and date selector'}
                </p>
              </div>
            </div>
          </div>

          {/* Month selector dropdown */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {isBn ? '📅 মাস ও বছর সিলেক্ট করুন (Month Filter)' : '📅 Select Month & Year'}
            </label>
            <div className="flex gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => onSelectMonth(e.target.value)}
                className={`flex-1 px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none focus:border-indigo-600 ${
                  darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                {monthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} {opt.value === new Date().toISOString().substring(0, 7) ? (isBn ? ' (বর্তমান মাস)' : ' (Current)') : ''}
                  </option>
                ))}
              </select>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => onSelectMonth(e.target.value)}
                className={`px-3 py-2 rounded-xl border text-xs font-mono focus:outline-none focus:border-indigo-600 ${
                  darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              />
            </div>
          </div>

          {/* Quick Month Metrics */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className={`p-3.5 rounded-2xl border space-y-1.5 shadow-2xs transition-colors ${
              darkMode 
                ? 'bg-indigo-950/25 border-indigo-800/60 text-white' 
                : 'bg-indigo-50/40 border-indigo-200 text-slate-900'
            }`}>
              <span className={`text-xs font-black uppercase tracking-wider block ${
                darkMode ? 'text-indigo-200' : 'text-slate-900'
              }`}>
                {isBn ? 'মোট অর্ডার' : 'Total Orders'}
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                {monthProductions.length} {isBn ? 'টি' : 'orders'}
              </div>
              <div className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2 py-0.5 rounded-lg ${
                darkMode ? 'text-indigo-200 bg-indigo-900/60' : 'text-indigo-950 bg-indigo-100/90'
              }`}>
                <span>{isBn ? 'বাকি' : 'Pending'}:</span>
                <span className="font-black text-indigo-700 dark:text-white">{pendingOrders.length}</span>
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border space-y-1.5 shadow-2xs transition-colors ${
              darkMode 
                ? 'bg-emerald-950/25 border-emerald-800/60 text-white' 
                : 'bg-emerald-50/40 border-emerald-200 text-slate-900'
            }`}>
              <span className={`text-xs font-black uppercase tracking-wider block ${
                darkMode ? 'text-emerald-200' : 'text-slate-900'
              }`}>
                {isBn ? 'উৎপাদন লক্ষ্য' : 'Target Output'}
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                {totalTargetQty.toLocaleString()}
              </div>
              <div className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2 py-0.5 rounded-lg ${
                darkMode ? 'text-emerald-200 bg-emerald-900/60' : 'text-emerald-950 bg-emerald-100/90'
              }`}>
                <span>{isBn ? 'সম্পন্ন' : 'Done'}:</span>
                <span className="font-black text-emerald-700 dark:text-white">{totalProducedQty.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Value */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-700 dark:text-slate-300 font-bold">
            {isBn ? 'মোট অর্ডারের মূল্য:' : 'Total Month Value:'}
          </span>
          <span className="font-black font-mono text-indigo-600 dark:text-indigo-400 text-sm sm:text-base">
            ৳ {totalMonthAmount.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};
