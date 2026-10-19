import React, { useState, useMemo } from 'react';
import { 
  BangladeshHolidayItem, 
  OFFICIAL_BANGLADESH_HOLIDAYS, 
  getNextUpcomingHoliday, 
  generateGoogleCalendarUrl, 
  generateIcsCalendarFile 
} from '../data/bangladeshHolidays';
import { Language, User } from '../types';
import { 
  Calendar, 
  CalendarDays, 
  ExternalLink, 
  Download, 
  Search, 
  Filter, 
  Clock, 
  Plus, 
  Check, 
  Sparkles, 
  Info,
  CalendarCheck2,
  Trash2
} from 'lucide-react';

interface BangladeshHolidayCalendarProps {
  language: Language;
  darkMode: boolean;
  currentUser?: User | null;
  onClose?: () => void;
  isModal?: boolean;
}

export const BangladeshHolidayCalendar: React.FC<BangladeshHolidayCalendarProps> = ({
  language,
  darkMode,
  currentUser,
  onClose,
  isModal = false
}) => {
  const isBn = language === 'bn';
  const isAdmin = currentUser && (
    currentUser.accountType === 'hosting' || 
    currentUser.accountType === 'admin' || 
    currentUser.accountType === 'md' || 
    currentUser.adminAccess === 'full'
  );

  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Custom Factory Holidays stored in localStorage
  const [customHolidays, setCustomHolidays] = useState<BangladeshHolidayItem[]>(() => {
    try {
      const saved = localStorage.getItem('caf_custom_holidays');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [newHolidayModalOpen, setNewHolidayModalOpen] = useState(false);
  const [newHolidayNameBn, setNewHolidayNameBn] = useState('');
  const [newHolidayNameEn, setNewHolidayNameEn] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('2026-06-15');
  const [newHolidayEndDate, setNewHolidayEndDate] = useState('');
  const [newHolidayDesc, setNewHolidayDesc] = useState('');
  const [newHolidayCat, setNewHolidayCat] = useState<'factory' | 'national' | 'muslim' | 'hindu'>('factory');

  const allHolidays = useMemo(() => {
    return [...OFFICIAL_BANGLADESH_HOLIDAYS, ...customHolidays];
  }, [customHolidays]);

  // Next upcoming holiday
  const upcoming = useMemo(() => {
    return getNextUpcomingHoliday(allHolidays);
  }, [allHolidays]);

  // Filtered list
  const filteredHolidays = useMemo(() => {
    return allHolidays.filter(h => {
      // Year filter
      if (selectedYear !== 'all' && !h.date.startsWith(selectedYear)) {
        return false;
      }

      // Month filter
      if (selectedMonth !== 'all') {
        const monthPart = h.date.split('-')[1];
        if (monthPart !== selectedMonth) return false;
      }

      // Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'muslim' && h.category !== 'muslim') return false;
        if (selectedCategory === 'hindu' && h.category !== 'hindu') return false;
        if (selectedCategory === 'national' && h.category !== 'national') return false;
        if (selectedCategory === 'other' && h.category !== 'buddhist' && h.category !== 'christian') return false;
        if (selectedCategory === 'factory' && h.category !== 'factory') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesBn = h.nameBn.toLowerCase().includes(q) || h.descriptionBn.toLowerCase().includes(q);
        const matchesEn = h.nameEn.toLowerCase().includes(q) || h.descriptionEn.toLowerCase().includes(q);
        const matchesDate = h.date.includes(q);
        if (!matchesBn && !matchesEn && !matchesDate) return false;
      }

      return true;
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [allHolidays, selectedYear, selectedMonth, selectedCategory, searchQuery]);

  // Download entire ICS file for Google Calendar import
  const handleDownloadIcs = () => {
    const icsData = generateIcsCalendarFile(allHolidays);
    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bangladesh_Factory_Holidays_${selectedYear}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Add custom factory holiday
  const handleSaveCustomHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayNameBn.trim() || !newHolidayDate) return;

    const newH: BangladeshHolidayItem = {
      id: `custom-${Date.now()}`,
      nameBn: newHolidayNameBn.trim(),
      nameEn: newHolidayNameEn.trim() || newHolidayNameBn.trim(),
      date: newHolidayDate,
      endDate: newHolidayEndDate || undefined,
      daysCount: newHolidayEndDate ? Math.max(1, Math.ceil((new Date(newHolidayEndDate).getTime() - new Date(newHolidayDate).getTime()) / (1000 * 60 * 60 * 24)) + 1) : 1,
      type: 'factory',
      category: newHolidayCat,
      descriptionBn: newHolidayDesc.trim() || 'কারখানার বিশেষ ছুটি।',
      descriptionEn: newHolidayDesc.trim() || 'Factory special leave day.'
    };

    const next = [...customHolidays, newH];
    setCustomHolidays(next);
    localStorage.setItem('caf_custom_holidays', JSON.stringify(next));
    setNewHolidayNameBn('');
    setNewHolidayNameEn('');
    setNewHolidayDesc('');
    setNewHolidayEndDate('');
    setNewHolidayModalOpen(false);
  };

  const handleDeleteCustomHoliday = (id: string) => {
    const next = customHolidays.filter(h => h.id !== id);
    setCustomHolidays(next);
    localStorage.setItem('caf_custom_holidays', JSON.stringify(next));
  };

  const toBnDigits = (numStr: string) => {
    if (!isBn) return numStr;
    const bnNums = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return numStr.replace(/\d/g, d => bnNums[parseInt(d, 10)]);
  };

  const formatDateDisplay = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const [y, m, d] = parts;
    const monthsBn = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIdx = parseInt(m, 10) - 1;
    if (isBn) {
      return `${toBnDigits(d)} ${monthsBn[monthIdx]} ${toBnDigits(y)}`;
    }
    return `${d} ${monthsEn[monthIdx]} ${y}`;
  };

  const cardBg = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900';

  return (
    <div className={`space-y-6 max-w-7xl mx-auto ${isModal ? 'p-1 sm:p-2' : ''}`}>
      {/* 1. Header Banner with Google Calendar Sync & Quick Actions */}
      <div className={`border rounded-3xl p-6 sm:p-7 shadow-xs relative overflow-hidden ${
        darkMode 
          ? 'bg-linear-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-slate-800 text-white' 
          : 'bg-linear-to-r from-indigo-50/70 via-sky-50/40 to-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-emerald-600 text-white flex items-center gap-1.5 shadow-xs">
                <span>🇧🇩</span>
                <span>{isBn ? 'সরকারি গেজেট অনুযায়ী' : 'Official BD Gazette'}</span>
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                <CalendarCheck2 className="w-3.5 h-3.5" />
                <span>{isBn ? 'গুগল ক্যালেন্ডার সাপোর্ট' : 'Google Calendar Ready'}</span>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight">
              {isBn 
                ? 'বাংলাদেশ সরকারি ও বাৎসরিক ছুটির ক্যালেন্ডার' 
                : 'Bangladesh Official & Factory Holiday Calendar'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              {isBn 
                ? 'পবিত্র ঈদ-উল-ফিতর, ঈদ-উল-আযহা, দুর্গাপূজা, ২১শে ফেব্রুয়ারি, ২৬শে মার্চ, বাংলা নববর্ষ ও সকল সরকারি ছুটির পূর্ণাঙ্গ তালিকা। ১-ক্লিকেই গুগল ক্যালেন্ডারে (Google Calendar) যোগ ও মোবাইল সিঙ্ক করতে পারবেন।' 
                : 'Complete list of Bangladesh gazetted public holidays including Eid, Durga Puja, Independence Day, and Factory Leave Days with 1-click Google Calendar sync.'}
            </p>
          </div>

          {/* Sync & Export Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0">
            <button
              type="button"
              onClick={handleDownloadIcs}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              title={isBn ? 'সকল ছুটি গুগল ক্যালেন্ডারে ইম্পোর্ট করার জন্য ডাউনলোড করুন' : 'Export all holidays for Google Calendar'}
            >
              <Download className="w-4 h-4" />
              <span>{isBn ? 'গুগল ক্যালেন্ডার সিঙ্ক (.ics)' : 'Export for Google Cal (.ics)'}</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setNewHolidayModalOpen(true)}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>{isBn ? 'কারখানা ছুটি যোগ' : 'Add Factory Leave'}</span>
              </button>
            )}

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                {isBn ? 'বন্ধ করুন' : 'Close'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. NEXT UPCOMING HOLIDAY NOTIFICATION (Clean, Simple, Subtle) */}
      {upcoming && (
        <div className={`border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          darkMode 
            ? 'bg-amber-950/20 border-amber-800/60 text-amber-100' 
            : 'bg-amber-50/80 border-amber-300 text-amber-950'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-500 text-white shadow-xs shrink-0 animate-bounce">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
                  🔔 {isBn ? 'পরবর্তী আসন্ন সরকারি ছুটি' : 'Next Upcoming Public Holiday'}
                </span>
                <span className="text-xs font-mono font-black text-amber-700 dark:text-amber-300">
                  {upcoming.daysRemaining === 0 
                    ? (isBn ? 'আজকে ছুটি!' : 'Today is Holiday!') 
                    : isBn ? `আর ${toBnDigits(upcoming.daysRemaining.toString())} দিন বাকি` : `${upcoming.daysRemaining} days remaining`}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black tracking-tight mt-0.5">
                {isBn ? upcoming.holiday.nameBn : upcoming.holiday.nameEn}
                <span className="text-xs font-bold font-mono ml-2 opacity-80">
                  ({formatDateDisplay(upcoming.holiday.date)})
                </span>
              </h3>
              <p className="text-xs opacity-90 mt-0.5">
                {isBn ? upcoming.holiday.descriptionBn : upcoming.holiday.descriptionEn}
              </p>
            </div>
          </div>

          <a
            href={generateGoogleCalendarUrl(upcoming.holiday)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0"
          >
            <CalendarCheck2 className="w-4 h-4" />
            <span>{isBn ? 'গুগল ক্যালেন্ডারে সেভ' : 'Add to Google Cal'}</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
        </div>
      )}

      {/* 3. FILTERS & SEARCH ROW */}
      <div className={`border rounded-2xl p-4 shadow-xs space-y-3 ${cardBg}`}>
        {/* Top filter row: Year tabs & Search input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Year selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start">
            {['2025', '2026', '2027', 'all'].map(year => (
              <button
                key={year}
                type="button"
                onClick={() => setSelectedYear(year)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                  selectedYear === year
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {year === 'all' ? (isBn ? 'সব বছর' : 'All Years') : toBnDigits(year)}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isBn ? 'ছুটির নাম দিয়ে সার্চ করুন (যেমন: ঈদ, পূজা)...' : 'Search holiday (e.g. Eid, Puja)...'}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 font-medium focus:outline-none focus:border-indigo-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-indigo-500" />
            <span>{isBn ? 'ক্যাটাগরি:' : 'Category:'}</span>
          </span>
          {[
            { id: 'all', labelBn: 'সকল ছুটি', labelEn: 'All Holidays', icon: '🗓️' },
            { id: 'muslim', labelBn: '🕌 ঈদ ও মুসলিম উৎসব', labelEn: 'Eid & Muslim', icon: '🕌' },
            { id: 'hindu', labelBn: '🛕 দুর্গাপূজা ও হিন্দু উৎসব', labelEn: 'Durga Puja & Hindu', icon: '🛕' },
            { id: 'national', labelBn: '🇧🇩 জাতীয় সাধারণ ছুটি', labelEn: 'National Days', icon: '🇧🇩' },
            { id: 'other', labelBn: '☸️✝️ বৌদ্ধ ও বড়দিন', labelEn: 'Buddhist & Christmas', icon: '🎄' },
            { id: 'factory', labelBn: '🏭 কারখানা ছুটি', labelEn: 'Factory Leaves', icon: '🏭' }
          ].map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer select-none border ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
              }`}
            >
              <span>{isBn ? cat.labelBn : cat.labelEn}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. HOLIDAY LIST CARDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold px-1">
          <span>
            {isBn ? `মোট ${toBnDigits(filteredHolidays.length.toString())}টি ছুটি পাওয়া গেছে` : `Found ${filteredHolidays.length} holidays`}
          </span>
          <span>
            {isBn ? 'Google Calendar বাটন চাপলে সরাসরি সিঙ্ক হবে' : 'Click Google Calendar to add instantly'}
          </span>
        </div>

        {filteredHolidays.length === 0 ? (
          <div className={`p-10 text-center rounded-3xl border ${cardBg}`}>
            <Calendar className="w-10 h-10 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
              {isBn ? 'কোনো ছুটির রেকর্ড পাওয়া যায়নি!' : 'No holidays found matching filters.'}
            </p>
            <button
              type="button"
              onClick={() => { setSelectedCategory('all'); setSearchQuery(''); setSelectedYear('all'); }}
              className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
            >
              {isBn ? 'ফিল্টার রিসেট করুন' : 'Reset filters'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredHolidays.map(holiday => {
              const googleCalUrl = generateGoogleCalendarUrl(holiday);
              const isPast = new Date(holiday.endDate || holiday.date).getTime() < new Date().getTime();

              return (
                <div
                  key={holiday.id}
                  className={`border rounded-2xl p-4 sm:p-5 transition hover:shadow-md relative flex flex-col justify-between ${cardBg} ${
                    isPast ? 'opacity-70' : ''
                  }`}
                >
                  <div className="space-y-2">
                    {/* Top row: Category tag & Days count badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          holiday.category === 'muslim'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200'
                            : holiday.category === 'hindu'
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200'
                              : holiday.category === 'national'
                                ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200'
                                : holiday.category === 'factory'
                                  ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200'
                                  : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200'
                        }`}>
                          {holiday.category === 'muslim' ? '🕌 মুসলিম' :
                           holiday.category === 'hindu' ? '🛕 হিন্দু' :
                           holiday.category === 'national' ? '🇧🇩 জাতীয়' :
                           holiday.category === 'factory' ? '🏭 কারখানা' : '✝️ অন্যান্য'}
                        </span>

                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          {holiday.type === 'general' ? (isBn ? 'সাধারণ ছুটি' : 'Public') : 
                           holiday.type === 'executive' ? (isBn ? 'নির্বাহী ছুটি' : 'Executive') :
                           holiday.type === 'factory' ? (isBn ? 'কারখানা ছুটি' : 'Factory Leave') : (isBn ? 'ঐচ্ছিক' : 'Optional')}
                        </span>
                      </div>

                      {holiday.daysCount > 1 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                          {toBnDigits(holiday.daysCount.toString())} {isBn ? 'দিনের ছুটি' : 'days off'}
                        </span>
                      )}
                    </div>

                    {/* Holiday Title */}
                    <div>
                      <h4 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                        {isBn ? holiday.nameBn : holiday.nameEn}
                      </h4>
                      {isBn && holiday.nameEn && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {holiday.nameEn}
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {isBn ? holiday.descriptionBn : holiday.descriptionEn}
                    </p>
                  </div>

                  {/* Bottom Row: Date display & Google Calendar Action Button */}
                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDateDisplay(holiday.date)}</span>
                      {holiday.endDate && (
                        <span className="text-slate-400"> - {formatDateDisplay(holiday.endDate)}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {holiday.type === 'factory' && isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomHoliday(holiday.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 cursor-pointer"
                          title="Delete custom leave"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <a
                        href={googleCalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold text-[11px] transition flex items-center gap-1 cursor-pointer border border-slate-200 dark:border-slate-700"
                        title={isBn ? 'এই ছুটিটি গুগল ক্যালেন্ডারে যোগ করুন' : 'Add to Google Calendar'}
                      >
                        <CalendarCheck2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>Google Cal</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. ADD CUSTOM FACTORY HOLIDAY MODAL (Admin only) */}
      {newHolidayModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl space-y-4 ${cardBg}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black flex items-center gap-2">
                <span>🏭</span>
                <span>{isBn ? 'কারখানার বাৎসরিক ছুটি যোগ করুন' : 'Add Factory Annual Holiday'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setNewHolidayModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomHoliday} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isBn ? 'ছুটির নাম (বাংলায়):' : 'Holiday Name (Bengali):'} *
                </label>
                <input
                  type="text"
                  required
                  value={newHolidayNameBn}
                  onChange={(e) => setNewHolidayNameBn(e.target.value)}
                  placeholder="যেমন: কারখানা বার্ষিক বনভোজন ও ছুটি"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isBn ? 'ছুটির নাম (ইংরেজিতে):' : 'Holiday Name (English):'}
                </label>
                <input
                  type="text"
                  value={newHolidayNameEn}
                  onChange={(e) => setNewHolidayNameEn(e.target.value)}
                  placeholder="e.g. Factory Annual Picnic & Leave"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isBn ? 'শুরুর তারিখ:' : 'Start Date:'} *
                  </label>
                  <input
                    type="date"
                    required
                    value={newHolidayDate}
                    onChange={(e) => setNewHolidayDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isBn ? 'শেষ তারিখ (যদি একাধিক দিন হয়):' : 'End Date (Optional):'}
                  </label>
                  <input
                    type="date"
                    value={newHolidayEndDate}
                    onChange={(e) => setNewHolidayEndDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isBn ? 'ছুটির বিবরণ:' : 'Description:'}
                </label>
                <textarea
                  rows={2}
                  value={newHolidayDesc}
                  onChange={(e) => setNewHolidayDesc(e.target.value)}
                  placeholder="ছুটি সংক্রান্ত বিস্তারিত বিবরণ লিখুন..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs cursor-pointer shadow-xs"
                >
                  {isBn ? 'সংরক্ষণ করুন' : 'Save Holiday'}
                </button>
                <button
                  type="button"
                  onClick={() => setNewHolidayModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
