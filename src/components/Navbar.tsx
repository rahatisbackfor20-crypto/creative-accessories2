import React, { useState, useEffect, useRef } from 'react';
import { TabType, User, Language } from '../types';
import { translations } from '../i18n';
import { CompanyLogo } from './CompanyLogo';
import { 
  LogOut, 
  Sun, 
  Moon, 
  Globe, 
  Printer, 
  ShieldCheck, 
  Calendar, 
  Search, 
  Keyboard, 
  Boxes, 
  Home, 
  Users, 
  Scissors, 
  Wallet, 
  ChevronDown, 
  Clock, 
  FileText, 
  Package, 
  Receipt, 
  CalendarDays, 
  TrendingUp, 
  Check, 
  Sparkles,
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react';

interface NavbarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  currentUser: User;
  onLogout: () => void;
  onOpenAdminGate: () => void;
  isAdminUnlocked: boolean;
  language: Language;
  onToggleLanguage: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  logoUrl?: string;
  onOpenProfileModal: () => void;
  onOpenPrintModal?: () => void;
  onOpenSearch?: () => void;
  onOpenShortcuts?: () => void;
  pendingRequestsCount?: number;
  hasViewedProductRequests?: boolean;
}

interface MenuTabItem {
  id: TabType;
  labelBn: string;
  labelEn: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  subBn?: string;
  subEn?: string;
}

interface MenuGroup {
  id: string;
  labelBn: string;
  labelEn: string;
  icon: React.ComponentType<{ className?: string }>;
  tabs: MenuTabItem[];
}

const ADOBE_MENU_GROUPS: MenuGroup[] = [
  {
    id: 'home',
    labelBn: 'হোম',
    labelEn: 'Home',
    icon: Home,
    tabs: [
      { 
        id: 'dashboard', 
        labelBn: 'ড্যাশবোর্ড ওভারভিউ', 
        labelEn: 'Dashboard Overview',
        icon: Home,
        shortcut: 'Alt+1',
        subBn: 'ফ্যাক্টরি লাইভ ওভারভিউ ও জরুরি অ্যাকশন',
        subEn: 'Factory overview & key actions'
      }
    ]
  },
  {
    id: 'production',
    labelBn: 'প্রোডাকশন',
    labelEn: 'Production',
    icon: Scissors,
    tabs: [
      { 
        id: 'production', 
        labelBn: 'দৈনিক প্রোডাকশন এন্ট্রি', 
        labelEn: 'Daily Production Entry',
        icon: Scissors,
        shortcut: 'Alt+2',
        subBn: 'অর্ডার ট্র্যাকিং ও দৈনিক উৎপাদন ইনপুট',
        subEn: 'Order tracking & live lines'
      },
      { 
        id: 'monthly_production', 
        labelBn: 'মাসিক উৎপাদন রিপোর্ট', 
        labelEn: 'Monthly Production Report',
        icon: TrendingUp,
        shortcut: 'Alt+3',
        subBn: 'মাসভিত্তিক উৎপাদন হিসাব ও গ্রাফ চার্ট',
        subEn: 'Monthly quota & performance'
      }
    ]
  },
  {
    id: 'hr',
    labelBn: 'হাজিরা ও ছুটি',
    labelEn: 'Attendance & Leave',
    icon: Users,
    tabs: [
      { 
        id: 'attendance', 
        labelBn: 'দৈনিক হাজিরা শিট', 
        labelEn: 'Daily Attendance',
        icon: Calendar,
        shortcut: 'Alt+4',
        subBn: 'কর্মীদের পাঞ্চ ও দৈনিক উপস্থিতি খাতা',
        subEn: 'Worker daily roster & punch log'
      },
      { 
        id: 'overtime', 
        labelBn: 'ওভারটাইম হিসাব', 
        labelEn: 'Overtime Tracking',
        icon: Clock,
        shortcut: 'Alt+5',
        subBn: 'অতিরিক্ত কাজের ঘণ্টা ও ওটি হিসাব',
        subEn: 'Extra hours & overtime records'
      },
      { 
        id: 'leave', 
        labelBn: 'ছুটি ব্যবস্থাপনা', 
        labelEn: 'Leave Management',
        icon: FileText,
        shortcut: 'Alt+6',
        subBn: 'ছুটির আবেদন ও ছুটির ব্যালেন্স রেকর্ড',
        subEn: 'Leave requests & approvals'
      },
      { 
        id: 'calendar', 
        labelBn: 'সরকারি ছুটির ক্যালেন্ডার', 
        labelEn: 'Holiday Calendar',
        icon: CalendarDays,
        shortcut: 'Alt+7',
        subBn: 'জাতীয় ও ধর্মীয় সরকারি ছুটির তালিকা',
        subEn: 'Yearly official holiday calendar'
      }
    ]
  },
  {
    id: 'bills_and_requests',
    labelBn: 'বিল, খরচাদি ও রিকোয়েস্ট',
    labelEn: 'Bills, Expenses & Requests',
    icon: Package,
    tabs: [
      { 
        id: 'product_requests', 
        labelBn: 'পণ্য ও মালামাল রিকোয়েস্ট', 
        labelEn: 'Material Requisitions',
        icon: Package,
        shortcut: 'Alt+8',
        subBn: 'কাঁচামাল ও প্রয়োজনীয় সামগ্রী রিকুইজিশন',
        subEn: 'Raw material requisition requests'
      },
      { 
        id: 'expenses', 
        labelBn: 'বিল ও দৈনিক খরচাদি', 
        labelEn: 'Bills & Expenses',
        icon: Receipt,
        shortcut: 'Alt+9',
        subBn: 'ফ্যাক্টরি ভাউচার ও দৈনিক খরচ খাতা',
        subEn: 'Factory vouchers & expenses'
      },
      { 
        id: 'payroll', 
        labelBn: 'বেতন ও পে-রোল শিট', 
        labelEn: 'Payroll & Salary Sheet',
        icon: Wallet,
        shortcut: 'Alt+0',
        subBn: 'কর্মীদের মাসিক বেতন, হাজিরা ও পেমেন্ট',
        subEn: 'Monthly worker salary sheet'
      },
      { 
        id: 'products_trade', 
        labelBn: 'প্রোডাক্ট ট্রেড হাব ও স্টক', 
        labelEn: 'Product Trade Hub & Stock',
        icon: Boxes,
        subBn: 'পণ্য স্টক ও ক্যাটালগ ট্রেড ইনভেন্টরি',
        subEn: 'Finished stock & trade inventory'
      }
    ]
  },
  {
    id: 'admin',
    labelBn: 'অ্যাডমিন প্যানেল',
    labelEn: 'Admin Panel',
    icon: ShieldCheck,
    tabs: [
      { 
        id: 'admin_panel', 
        labelBn: 'অ্যাডমিন কন্ট্রোল প্যানেল', 
        labelEn: 'Admin Master Panel',
        icon: ShieldCheck,
        shortcut: 'Alt+A',
        subBn: 'সিস্টেম কন্ট্রোল, ডাটাবেস ও পারমিশন',
        subEn: 'Database, roles & system setup'
      }
    ]
  }
];

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onLogout,
  onOpenAdminGate,
  isAdminUnlocked,
  language,
  onToggleLanguage,
  darkMode,
  onToggleDarkMode,
  logoUrl,
  onOpenProfileModal,
  onOpenPrintModal,
  onOpenSearch,
  onOpenShortcuts,
  pendingRequestsCount = 0,
  hasViewedProductRequests = false
}) => {
  const t = translations[language];
  const isBn = language === 'bn';
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);

  // Permission checks
  const isFullAdmin = isAdminUnlocked || currentUser.accountType === 'hosting' || currentUser.accountType === 'admin' || currentUser.adminAccess === 'full';
  const isBasicAdmin = isFullAdmin || currentUser.adminAccess === 'basic' || currentUser.accountType === 'md' || currentUser.accountType === 'staff';
  const canAccessPayroll = currentUser.accountType !== 'employee' || isFullAdmin || currentUser.adminAccess === 'basic' || currentUser.adminAccess === 'full';

  // Find currently active menu group based on selected tab
  const activeGroup = ADOBE_MENU_GROUPS.find(g => g.tabs.some(tab => tab.id === currentTab)) || ADOBE_MENU_GROUPS[0];
  const activeTabItem = activeGroup.tabs.find(tab => tab.id === currentTab);

  // Adobe software behavior: Click outside closes menu; Escape key closes menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenu(null);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Adobe menu behavior: Click to open/toggle. If any menu is already open, hover switches menu seamlessly!
  const handleMenuClick = (groupId: string) => {
    setOpenMenu(prev => (prev === groupId ? null : groupId));
  };

  const handleMenuMouseEnter = (groupId: string) => {
    if (openMenu !== null && openMenu !== groupId) {
      setOpenMenu(groupId);
    }
  };

  const handleSelectTab = (tabId: TabType) => {
    if (tabId === 'admin_panel' && !isFullAdmin && !isAdminUnlocked) {
      onOpenAdminGate();
    } else {
      onSelectTab(tabId);
    }
    setOpenMenu(null);
  };

  return (
    <header className={`no-print sticky top-0 z-50 border-b shadow-sm backdrop-blur-md transition-colors select-none ${
      darkMode ? 'bg-slate-900/98 border-slate-800 text-white' : 'bg-white/98 border-slate-200 text-slate-900'
    }`}>
      {/* ========================================================
          LINE 1: COMPANY BRAND HEADER & TOP UTILITIES
         ======================================================== */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand Logo & Factory Name */}
        <div 
          onClick={() => onSelectTab('dashboard')} 
          className="flex items-center gap-2 cursor-pointer select-none shrink-0 group"
          title={isBn ? 'ড্যাশবোর্ডে ফিরে যান' : 'Go to Dashboard'}
        >
          {/* Desktop full logo */}
          <div className="hidden sm:block">
            <CompanyLogo logoUrl={logoUrl} size="md" variant="full" darkMode={darkMode} />
          </div>
          {/* Mobile responsive compact logo */}
          <div className="sm:hidden flex items-center gap-1.5">
            <CompanyLogo logoUrl={logoUrl} size="sm" variant="mark-only" darkMode={darkMode} />
            <div className="flex flex-col leading-tight">
              <span className="text-[13px] font-black tracking-tight text-indigo-900 dark:text-white">
                Creative
              </span>
              <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">
                Accessories
              </span>
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-1.5 ml-2 pl-3 border-l border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{isBn ? 'লাইভ ক্লাউড সিঙ্কড' : 'Cloud Sync'}</span>
          </div>
        </div>

        {/* Right: Search, Shortcuts, Theme, Language, Profile & Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Quick Search */}
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              title={isBn ? 'সার্বজনীন স্পটলাইট সার্চ (Ctrl+K)' : 'Spotlight Search (Ctrl+K)'}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                darkMode ? 'border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700' : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden md:inline text-[11px] font-bold">{isBn ? 'সার্চ' : 'Search'}</span>
              <kbd className="hidden lg:inline px-1 py-0.2 rounded text-[9px] font-mono bg-white/20 dark:bg-black/20 text-slate-400">Ctrl+K</kbd>
            </button>
          )}

          {/* Keyboard Shortcuts */}
          {onOpenShortcuts && (
            <button
              type="button"
              onClick={onOpenShortcuts}
              title={isBn ? 'কিবোর্ড শর্টকাট সহায়িকা (?)' : 'Keyboard Shortcuts (?)'}
              className={`hidden sm:flex p-1.5 sm:p-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                darkMode ? 'border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700' : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5 text-indigo-500" />
            </button>
          )}

          {/* Language Switcher */}
          <button
            type="button"
            onClick={onToggleLanguage}
            title="Toggle English / বাংলা"
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
              darkMode ? 'border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700' : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-indigo-500" />
            <span className="tabular-nums uppercase text-[11px] sm:text-xs font-black">
              {language === 'en' ? 'বাং' : 'EN'}
            </span>
          </button>

          {/* Dark / Light Mode Switcher */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            title={darkMode ? t.lightMode : t.darkMode}
            className={`p-1.5 sm:p-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer shrink-0 ${
              darkMode ? 'border-slate-700 bg-slate-800/80 text-amber-300 hover:bg-slate-700' : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Global Print Button */}
          <button
            type="button"
            onClick={() => {
              try {
                window.print();
              } catch (e) {
                console.warn(e);
              }
              onOpenPrintModal?.();
            }}
            title={isBn ? 'বর্তমান রিপোর্ট প্রিন্ট বা পিডিএফ করুন' : 'Print / Export to PDF'}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
              darkMode 
                ? 'border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700' 
                : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Printer className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden xl:inline font-bold">{isBn ? 'প্রিন্ট' : 'Print'}</span>
          </button>

          {/* User Profile Badge */}
          <div className="flex items-center gap-1 sm:gap-2 pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onOpenProfileModal}
              title={isBn ? `${currentUser.fullName} - প্রোফাইল ও আইডি কার্ড` : `${currentUser.fullName} - Profile & ID Card`}
              className={`p-1 sm:px-2.5 sm:py-1 rounded-xl border text-xs flex items-center gap-1.5 transition cursor-pointer select-none shrink-0 ring-1 ring-indigo-500/20 ${
                darkMode 
                  ? 'border-slate-700 bg-slate-800/90 hover:bg-slate-700 text-slate-200' 
                  : 'border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/70 text-slate-800'
              }`}
            >
              <div className="relative shrink-0">
                {currentUser.photoUrl ? (
                  <img
                    src={currentUser.photoUrl}
                    alt={currentUser.fullName}
                    className="w-7 h-7 rounded-lg object-cover border border-indigo-400 shadow-2xs"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-[11px] shadow-2xs">
                    {currentUser.fullName.charAt(0)}
                  </div>
                )}
                {isFullAdmin ? (
                  <span 
                    title="Full Control Admin"
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-purple-600 border border-white dark:border-slate-900 flex items-center justify-center text-[7px] text-white font-black"
                  >
                    ★
                  </span>
                ) : currentUser.adminAccess === 'basic' ? (
                  <span 
                    title="Basic Data Entry Access"
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border border-white dark:border-slate-900 flex items-center justify-center text-[7px] text-white font-black"
                  >
                    ⚡
                  </span>
                ) : null}
              </div>

              <div className="hidden sm:flex flex-col text-left leading-tight">
                <span className="text-xs font-black truncate max-w-[90px] md:max-w-[120px]">
                  {currentUser.fullName}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate max-w-[90px] md:max-w-[120px]">
                  {isFullAdmin ? 'Full Admin' : currentUser.adminAccess === 'basic' ? 'Basic Access' : (currentUser.designation || currentUser.accountType)}
                </span>
              </div>
            </button>

            {/* Logout Button */}
            <button
              type="button"
              onClick={onLogout}
              title={t.logout}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0 ${
                darkMode ? 'bg-rose-950/40 border-rose-900/60 text-rose-300 hover:bg-rose-900/50' : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{t.logout}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          LINE 2: ADOBE SOFTWARE STYLE LOCKED MENU BAR (TOOLS BAR)
          - Locked right under header line, stays fixed on scroll
          - Exact visual style from user image (pill-shaped menus with ⌵)
          - Adobe-style hover switching & dropdown menu hierarchy
         ======================================================== */}
      <div 
        ref={menuBarRef} 
        className={`border-t transition-colors ${
          darkMode ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-100/90 border-slate-200'
        }`}
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-6 py-1 flex items-center justify-between gap-1 overflow-visible">
          {/* Horizontal Menu Items Bar (Fixed & Frozen, no scroll clipping) */}
          <nav className="flex items-center gap-1 sm:gap-2 overflow-visible py-0.5 select-none">
            {ADOBE_MENU_GROUPS.filter(group => {
              if (group.id === 'bills_and_requests' && !canAccessPayroll && currentUser.accountType === 'employee') {
                // Regular employees can still see requests and expenses
                return true;
              }
              if (group.id === 'admin') return isBasicAdmin || isFullAdmin;
              return true;
            }).map((group, groupIdx) => {
              const isGroupActive = group.tabs.some(tab => tab.id === currentTab);
              const isGroupOpen = openMenu === group.id;
              const hasBadge = group.id === 'bills_and_requests' && pendingRequestsCount > 0;
              const isRightAligned = groupIdx >= 3;

              return (
                <div key={group.id} className="relative shrink-0">
                  {/* Menu Button matching image.png */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuClick(group.id);
                    }}
                    onMouseEnter={() => handleMenuMouseEnter(group.id)}
                    className={`px-3 py-1.5 sm:px-3.5 sm:py-1.5 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap flex items-center gap-1.5 cursor-pointer transition select-none ${
                      isGroupActive
                        ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-500/50'
                        : isGroupOpen
                          ? darkMode ? 'bg-slate-800 text-white ring-1 ring-slate-700' : 'bg-slate-200/90 text-slate-950 ring-1 ring-slate-300'
                          : darkMode 
                            ? 'text-slate-300 hover:text-white hover:bg-slate-800' 
                            : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/70'
                    }`}
                  >
                    <span>{isBn ? group.labelBn : group.labelEn}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isGroupOpen ? 'rotate-180 opacity-100' : 'opacity-70'}`} />
                    {hasBadge && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0"></span>
                    )}
                  </button>

                  {/* Adobe Dropdown Menu Overlay (High z-index, never clipped) */}
                  {isGroupOpen && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className={`absolute top-full mt-1.5 w-72 sm:w-84 max-w-[calc(100vw-24px)] rounded-2xl border shadow-2xl z-[100] p-1.5 animate-in fade-in-50 zoom-in-95 duration-150 ${
                        isRightAligned ? 'right-0' : 'left-0'
                      } ${
                        darkMode 
                          ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-black/80' 
                          : 'bg-white border-slate-200 text-slate-900 shadow-indigo-950/20'
                      }`}
                    >
                      {/* Menu Header with Category Title */}
                      <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span>{isBn ? group.labelBn : group.labelEn}</span>
                        <span className="text-[9px] font-mono font-normal">ADOBE ERP MENU</span>
                      </div>

                      {/* Dropdown Tab Items */}
                      <div className="py-1 space-y-0.5">
                        {group.tabs.map(tab => {
                          const Icon = tab.icon;
                          const isCurrent = currentTab === tab.id;
                          const isRequisition = tab.id === 'product_requests';

                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => handleSelectTab(tab.id)}
                              className={`w-full px-3 py-2 text-left rounded-xl flex items-center justify-between gap-2.5 transition cursor-pointer select-none group ${
                                isCurrent
                                  ? 'bg-indigo-600 text-white shadow-2xs font-extrabold'
                                  : darkMode
                                    ? 'hover:bg-slate-800/90 text-slate-200'
                                    : 'hover:bg-indigo-50/80 text-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className={`p-1.5 rounded-lg shrink-0 ${
                                  isCurrent
                                    ? 'bg-white/20 text-white'
                                    : darkMode
                                      ? 'bg-slate-800 text-indigo-400 group-hover:scale-105 transition'
                                      : 'bg-indigo-100/70 text-indigo-700 group-hover:scale-105 transition'
                                }`}>
                                  <Icon className="w-4 h-4" />
                                </span>
                                <div className="flex flex-col min-w-0 text-left">
                                  <span className={`text-xs font-bold leading-tight truncate ${isCurrent ? 'text-white' : ''}`}>
                                    {isBn ? tab.labelBn : tab.labelEn}
                                  </span>
                                  <span className={`text-[10px] leading-tight truncate ${
                                    isCurrent ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'
                                  }`}>
                                    {isBn ? tab.subBn : tab.subEn}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {isRequisition && pendingRequestsCount > 0 && (
                                  <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black">
                                    {pendingRequestsCount}
                                  </span>
                                )}
                                {tab.shortcut && (
                                  <kbd className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-medium ${
                                    isCurrent
                                      ? 'bg-white/20 text-white'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                  }`}>
                                    {tab.shortcut}
                                  </kbd>
                                )}
                                {isCurrent && (
                                  <Check className="w-4 h-4 text-white shrink-0 ml-0.5" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Adobe-style quick utility links inside group */}
                      {group.id === 'home' && (
                        <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between px-2 text-[10px] text-slate-400">
                          <span>{isBn ? 'শর্টকাট দিয়ে দ্রুত জাম্প করুন' : 'Jump with keyboard shortcuts'}</span>
                          <span className="font-mono text-indigo-500 font-bold">Alt + 1..0</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Right indicator: Current Active Tab Badge */}
          {activeTabItem && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              <span className="text-slate-900 dark:text-slate-200">{isBn ? activeTabItem.labelBn : activeTabItem.labelEn}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

