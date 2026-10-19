import React, { useState, useMemo } from 'react';
import { ProductionRecord, User, Language, CompanyProfile } from '../types';
import { translations } from '../i18n';
import { UserProfileBadge } from './UserProfileBadge';
import { 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  Filter, 
  Search, 
  Users, 
  Layers, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Package, 
  Award, 
  BarChart3, 
  ChevronRight, 
  X, 
  Eye, 
  Printer, 
  Building2, 
  UserCheck 
} from 'lucide-react';

interface MonthlyProductionReportProps {
  productions: ProductionRecord[];
  users: User[];
  sections: string[];
  currentUser: User;
  companyProfile?: CompanyProfile;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  language: Language;
  darkMode: boolean;
  onOpenDailyEntries?: () => void;
}

export const MonthlyProductionReport: React.FC<MonthlyProductionReportProps> = ({
  productions,
  users,
  sections,
  currentUser,
  companyProfile,
  selectedMonth,
  onSelectMonth,
  language,
  darkMode,
  onOpenDailyEntries
}) => {
  const t = translations[language];
  const isBn = language === 'bn';

  const isFullAdmin = currentUser.accountType === 'hosting' || currentUser.accountType === 'admin' || currentUser.adminAccess === 'full' || currentUser.accountType === 'owner';
  const isMD = currentUser.accountType === 'md';
  const isStaff = currentUser.accountType === 'staff';
  const isManager = isFullAdmin || isMD || (isStaff && currentUser.adminAccess === 'full');
  const isBasicAccount = !isFullAdmin;
  const isRegularEmployee = !isFullAdmin && currentUser.accountType === 'employee';

  // Allowed sections: Full Admin sees all factory lines. Basic accounts ONLY see their own section!
  const allowedSections = useMemo(() => {
    if (isFullAdmin) return sections;
    if (currentUser.section && sections.includes(currentUser.section)) {
      return [currentUser.section];
    }
    return currentUser.section ? [currentUser.section] : (sections.length > 0 ? [sections[0]] : ['Sewing']);
  }, [isFullAdmin, sections, currentUser.section]);

  const defaultUserSection = allowedSections[0] || 'Sewing';

  // State: Filter by Section, Search Query, View Mode, Selected Employee for Drilldown
  type ViewMode = 'all' | 'section' | 'employee';
  const [viewMode, setViewMode] = useState<ViewMode>(isBasicAccount ? 'section' : 'all');
  const [selectedSection, setSelectedSection] = useState<string>(isBasicAccount ? defaultUserSection : 'all');
  const [selectedUserId, setSelectedUserId] = useState<string>(isRegularEmployee ? currentUser.id : 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailModalUser, setDetailModalUser] = useState<User | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [sectionViewStyle, setSectionViewStyle] = useState<'excel' | 'cards'>('excel');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  // Month options (current month + 5 previous months + 2 next months)
  const monthOptions = useMemo(() => {
    const list = [];
    const date = new Date();
    for (let i = -5; i <= 2; i++) {
      const d = new Date(date.getFullYear(), date.getMonth() + i, 1);
      const val = d.toISOString().substring(0, 7);
      const label = d.toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { month: 'long', year: 'numeric' });
      list.push({ value: val, label });
    }
    return list;
  }, [isBn]);

  // Filter productions for this month
  const monthProductions = useMemo(() => {
    return productions.filter(p => {
      const pMonth = (p.date || '').substring(0, 7);
      return !pMonth || pMonth === selectedMonth;
    });
  }, [productions, selectedMonth]);

  // Effective list based on permissions & viewMode
  const visibleProductions = useMemo(() => {
    return monthProductions.filter(p => {
      // Basic Account Restriction: strictly restricted to their assigned section
      if (isBasicAccount) {
        if (p.section !== defaultUserSection) return false;
      }

      // If regular employee: strictly restrict to their own records
      if (isRegularEmployee && p.userId !== currentUser.id) {
        return false;
      }

      // If viewMode === 'employee' and specific user selected
      if (selectedUserId !== 'all' && p.userId !== selectedUserId) {
        return false;
      }

      // If viewMode === 'section' or section selected (for full admins)
      if (isFullAdmin && selectedSection !== 'all' && p.section !== selectedSection) {
        return false;
      }

      // Search query filter (matches Item, Buyer, Company, or Operator Name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const op = users.find(u => u.id === p.userId);
        const matchesItem = (p.itemName || '').toLowerCase().includes(q);
        const matchesBuyer = (p.buyer || '').toLowerCase().includes(q);
        const matchesCompany = (p.company || '').toLowerCase().includes(q);
        const matchesOp = (op?.fullName || '').toLowerCase().includes(q) || (op?.employeeId || '').toLowerCase().includes(q);
        return matchesItem || matchesBuyer || matchesCompany || matchesOp;
      }

      return true;
    });
  }, [monthProductions, isBasicAccount, defaultUserSection, isRegularEmployee, currentUser.id, selectedUserId, isFullAdmin, selectedSection, searchQuery, users]);

  // Factory / Visible aggregates
  const totalProducedPieces = visibleProductions.reduce((sum, p) => sum + Number(p.prodQty || 0), 0);
  const totalOrderTargetPieces = visibleProductions.reduce((sum, p) => sum + Number(p.orderQty || 0), 0);
  const overallCompletionRate = totalOrderTargetPieces > 0 
    ? Math.min(100, Math.round((totalProducedPieces / totalOrderTargetPieces) * 100)) 
    : 0;

  // Distinct active operators in visible scope
  const distinctWorkerIds = useMemo(() => {
    const set = new Set<string>();
    visibleProductions.forEach(p => set.add(p.userId));
    return Array.from(set);
  }, [visibleProductions]);

  // Section breakdown stats (for Excel Sheet & Cards)
  // Full admin: all factory sections. Basic account: strictly their assigned section.
  const sectionStats = useMemo(() => {
    return allowedSections.map(secName => {
      const secProductions = monthProductions.filter(p => p.section === secName);
      const totalPieces = secProductions.reduce((s, p) => s + Number(p.prodQty || 0), 0);
      const targetPieces = secProductions.reduce((s, p) => s + Number(p.orderQty || 0), 0);
      const completion = targetPieces > 0 ? Math.min(100, Math.round((totalPieces / targetPieces) * 100)) : 0;
      const workerIds = new Set(secProductions.map(p => p.userId));
      const activeDays = new Set(secProductions.map(p => p.date)).size;
      const dailyAverage = activeDays > 0 ? Math.round(totalPieces / activeDays) : 0;
      return {
        section: secName,
        totalPieces,
        targetPieces,
        completion,
        workerCount: workerIds.size,
        orderCount: secProductions.length,
        dailyAverage
      };
    });
  }, [allowedSections, monthProductions]);

  // Excel Grand Totals
  const excelTotals = useMemo(() => {
    const totalPieces = sectionStats.reduce((s, st) => s + st.totalPieces, 0);
    const totalTarget = sectionStats.reduce((s, st) => s + st.targetPieces, 0);
    const totalWorkers = distinctWorkerIds.length;
    const totalOrders = sectionStats.reduce((s, st) => s + st.orderCount, 0);
    const overallCompletion = totalTarget > 0 ? Math.min(100, Math.round((totalPieces / totalTarget) * 100)) : 0;
    return { totalPieces, totalTarget, totalWorkers, totalOrders, overallCompletion };
  }, [sectionStats, distinctWorkerIds]);

  // Employee-wise breakdown for "মান্থলি কে কত প্রোডাকশন করেছে"
  // Basic account: strictly workers in their own section with themselves at the top
  const employeeMonthlySummary = useMemo(() => {
    let baseUsers = users;
    if (isBasicAccount) {
      // Basic account: ONLY their section's workers
      baseUsers = users.filter(u => u.section === defaultUserSection);
      // If basic regular employee, only show their own record
      if (currentUser.accountType === 'employee') {
        baseUsers = users.filter(u => u.id === currentUser.id);
      }
    } else if (selectedUserId !== 'all') {
      baseUsers = users.filter(u => u.id === selectedUserId);
    } else if (selectedSection !== 'all') {
      baseUsers = users.filter(u => u.section === selectedSection);
    }

    // Map each user to their monthly production metrics
    const list = baseUsers.map(user => {
      const userProds = monthProductions.filter(p => p.userId === user.id);
      const pieces = userProds.reduce((s, p) => s + Number(p.prodQty || 0), 0);
      const target = userProds.reduce((s, p) => s + Number(p.orderQty || 0), 0);
      const completion = target > 0 ? Math.min(100, Math.round((pieces / target) * 100)) : 0;
      const ordersCount = userProds.length;
      
      // Calculate distinct active days
      const activeDays = new Set(userProds.map(p => p.date)).size;
      const dailyAverage = activeDays > 0 ? Math.round(pieces / activeDays) : 0;
      
      const lastEntry = userProds.length > 0 
        ? userProds.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0] 
        : null;

      return {
        user,
        pieces,
        target,
        completion,
        ordersCount,
        activeDays,
        dailyAverage,
        lastDate: lastEntry?.date || 'N/A',
        records: userProds,
        isCurrentUser: user.id === currentUser.id
      };
    });

    // If search query is present, filter users
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return list.filter(item => 
        item.user.fullName.toLowerCase().includes(q) || 
        item.user.employeeId.toLowerCase().includes(q) ||
        (item.user.section || '').toLowerCase().includes(q)
      );
    }

    // Sort: current user always on top if basic account, then by pieces produced descending
    return list.sort((a, b) => {
      if (isBasicAccount) {
        if (a.isCurrentUser) return -1;
        if (b.isCurrentUser) return 1;
      }
      return b.pieces - a.pieces;
    });
  }, [users, isBasicAccount, defaultUserSection, currentUser, selectedUserId, selectedSection, monthProductions, searchQuery]);

  // Regular Employee's personal metrics
  const mySummary = useMemo(() => {
    return employeeMonthlySummary.find(item => item.user.id === currentUser.id) || {
      user: currentUser,
      pieces: 0,
      target: 0,
      completion: 0,
      ordersCount: 0,
      activeDays: 0,
      dailyAverage: 0,
      lastDate: 'N/A',
      records: []
    };
  }, [employeeMonthlySummary, currentUser]);

  // --- CSV Export Functions with UTF-8 BOM ---
  const handleExportCSV = (scope: 'all' | 'section' | 'employee', targetUser?: User, targetSec?: string) => {
    const compName = companyProfile?.name || 'Creative Accessories Factory';
    const factoryReg = companyProfile?.factoryRegNo || 'BD-ACC-2024-8841';
    const generatedDate = new Date().toISOString().split('T')[0];

    let exportRecords: ProductionRecord[] = [];
    let reportTitle = '';
    let filename = '';

    if (scope === 'employee') {
      const userToExport = targetUser || (selectedUserId !== 'all' ? users.find(u => u.id === selectedUserId) : currentUser);
      if (!userToExport) return;
      exportRecords = monthProductions.filter(p => p.userId === userToExport.id);
      reportTitle = `Employee Monthly Production - ${userToExport.fullName} (${userToExport.employeeId})`;
      filename = `Monthly_Production_${userToExport.employeeId}_${selectedMonth}.csv`;
    } else if (scope === 'section') {
      const secToExport = targetSec || (selectedSection !== 'all' ? selectedSection : sections[0] || 'Sewing');
      exportRecords = monthProductions.filter(p => p.section === secToExport);
      reportTitle = `Section Monthly Production - ${secToExport} Section`;
      filename = `Section_Production_${secToExport.replace(/\s+/g, '_')}_${selectedMonth}.csv`;
    } else {
      // All Factory Combined
      exportRecords = monthProductions;
      reportTitle = `Complete Factory Monthly Production Report`;
      filename = `All_Factory_Production_${selectedMonth}.csv`;
    }

    // CSV Headers & Meta
    const metaRows = [
      `"${compName}"`,
      `"Factory Reg No: ${factoryReg} | Bamnartek, Dhaka 1230, Bangladesh"`,
      `"Report: ${reportTitle}"`,
      `"Month: ${selectedMonth} | Export Date: ${generatedDate} | Generated By: ${currentUser.fullName} (${currentUser.designation || currentUser.accountType})"`,
      ''
    ];

    const headers = [
      'Sl No',
      'Date',
      'Operator / Employee Name',
      'Employee ID',
      'Designation',
      'Section',
      'Item Name / Description',
      'Buyer',
      'Company Name',
      'Length / Spec',
      'Target / Order Qty',
      'Produced Pieces (উৎপাদিত পিস)',
      'Unit',
      'Completion %',
      'Hours Worked',
      'Status',
      'Last Edited By'
    ];

    let totalOrder = 0;
    let totalProduced = 0;

    const dataRows = exportRecords.map((p, index) => {
      const op = users.find(u => u.id === p.userId) || currentUser;
      const order = Number(p.orderQty || 0);
      const prod = Number(p.prodQty || 0);
      totalOrder += order;
      totalProduced += prod;
      const pct = order > 0 ? Math.min(100, Math.round((prod / order) * 100)) : 0;

      return [
        index + 1,
        `"${p.date || ''}"`,
        `"${op.fullName}"`,
        `"${op.employeeId}"`,
        `"${op.designation || ''}"`,
        `"${p.section}"`,
        `"${p.itemName.replace(/"/g, '""')}"`,
        `"${p.buyer.replace(/"/g, '""')}"`,
        `"${p.company.replace(/"/g, '""')}"`,
        `"${p.length || ''}"`,
        order,
        prod,
        `"${p.unit || 'Pcs'}"`,
        `"${pct}%"`,
        p.hours || 9,
        `"${p.status}"`,
        `"${p.lastEditedBy || ''}"`
      ].join(',');
    });

    const overallPct = totalOrder > 0 ? Math.min(100, Math.round((totalProduced / totalOrder) * 100)) : 0;
    const summaryRows = [
      '',
      `"GRAND TOTAL",,,,,,,,,"Total Target: ${totalOrder}","Total Produced: ${totalProduced} Pcs",,"Average: ${overallPct}%",,,`
    ];

    // UTF-8 BOM for Microsoft Excel Bengali encoding
    const csvContent = '\uFEFF' + [...metaRows, headers.join(','), ...dataRows, ...summaryRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    triggerToast(isBn ? `✓ ${filename} সফলভাবে ডাউনলোড হয়েছে!` : `Downloaded ${filename}!`);
  };

  const cardBg = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900';
  const inputBg = darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900';

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-600 text-white font-extrabold text-xs shadow-lg flex items-center justify-between gap-3 animate-fade-in no-print border-2 border-emerald-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{toastMessage}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setToastMessage('')} 
            className="text-white hover:text-emerald-200 text-xs font-bold px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Header & Controls Bar */}
      <div className={`border rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${cardBg} no-print`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              <BarChart3 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">
                {isBn ? '📊 মাসিক সেকশন ও কর্মী প্রোডাকশন রিপোর্ট' : 'Monthly Section & Worker Production Report'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isBn 
                  ? 'কে কত পিস প্রোডাকশন করলো, সেকশনভিত্তিক ও কর্মীর মাসিক সামগ্রিক হিসাব এবং সিএসভি এক্সপোর্ট' 
                  : 'Monthly pieces produced breakdown by section and individual workers with CSV exports'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls: Month selector & CSV Exports */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => onSelectMonth(e.target.value)}
              className="bg-transparent text-xs font-black focus:outline-none cursor-pointer pr-1"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className={darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Export CSV Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {isManager && (
              <button
                type="button"
                onClick={() => handleExportCSV('all')}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                title={isBn ? 'ফ্যাক্টরির সকল সেকশন ও কর্মীর প্রোডাকশন CSV ডাউনলোড করুন' : 'Export All Factory Production CSV'}
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isBn ? '📥 সব একসাথে CSV' : '📥 All Combined CSV'}</span>
              </button>
            )}

            {selectedSection !== 'all' && isManager && (
              <button
                type="button"
                onClick={() => handleExportCSV('section', undefined, selectedSection)}
                className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                title={isBn ? `শুধুমাত্র ${selectedSection} সেকশনের CSV ডাউনলোড করুন` : `Export ${selectedSection} CSV`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isBn ? `📥 ${selectedSection} CSV` : `📥 ${selectedSection} CSV`}</span>
              </button>
            )}

            {isRegularEmployee && (
              <button
                type="button"
                onClick={() => handleExportCSV('employee', currentUser)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                title={isBn ? 'আমার এই মাসের উৎপাদিত পিসের CSV ডাউনলোড করুন' : 'Download My Monthly Production CSV'}
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isBn ? '📥 আমার প্রোডাকশন CSV' : '📥 My Production CSV'}</span>
              </button>
            )}

            {onOpenDailyEntries && (
              <button
                type="button"
                onClick={onOpenDailyEntries}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                title="Go to daily production entries"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{isBn ? '📋 দৈনিক এন্ট্রি তালিকা' : 'Daily Entries'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. MD Sir / Admin View Mode Switcher: Full Everything / By Whole Section / Single Individual Worker */}
      {/* 2. View Mode Switcher: Full Admin vs Basic Account Scoping */}
      <div className={`border rounded-2xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 ${cardBg} no-print`}>
        {isFullAdmin ? (
          /* Full Admin View Controls: All Factory / By Section / Single Worker */
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto">
            <button
              type="button"
              onClick={() => {
                setViewMode('all');
                setSelectedSection('all');
                setSelectedUserId('all');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                viewMode === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>🌐 {isBn ? 'সবারটা একসাথে (Full Factory)' : 'All Factory'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('section');
                if (selectedSection === 'all') setSelectedSection(sections[0] || 'Sewing');
                setSelectedUserId('all');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                viewMode === 'section'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>🏢 {isBn ? 'সেকশন অনুযায়ী (By Section)' : 'By Section'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('employee');
                if (selectedUserId === 'all' && users.length > 0) setSelectedUserId(users[0].id);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                viewMode === 'employee'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>👤 {isBn ? 'একজনের নির্দিষ্ট হিসাব (Single Worker)' : 'Single Worker'}</span>
            </button>
          </div>
        ) : (
          /* Basic Account View Indicator */
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-black flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>{isBn ? `আপনার সেকশন: ${defaultUserSection}` : `Your Section: ${defaultUserSection}`}</span>
            </span>
            <span className="text-[11px] text-slate-500 font-bold hidden sm:inline">
              {isBn ? '🔒 শুধুমাত্র নিজের সেকশন ও নিজের রেকর্ড দৃশ্যমান' : '🔒 Scoped to your section & records'}
            </span>
          </div>
        )}

        {/* Contextual Selectors based on View Mode */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Section dropdown for Full Admin */}
          {isFullAdmin && (viewMode === 'section' || viewMode === 'all') && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500">{isBn ? 'সেকশন:' : 'Section:'}</span>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold focus:outline-none cursor-pointer ${inputBg}`}
              >
                <option value="all">{isBn ? 'সকল সেকশন (All)' : 'All Sections'}</option>
                {sections.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

            {/* If Single Employee: Employee search / dropdown */}
            {viewMode === 'employee' && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500">{isBn ? 'কর্মী নির্বাচন:' : 'Worker:'}</span>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold focus:outline-none cursor-pointer max-w-[220px] truncate ${inputBg}`}
                >
                  <option value="all">{isBn ? 'সকল কর্মী (Everyone)' : 'Everyone'}</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.employeeId}) · {u.section || 'General'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Search Input */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs min-w-[180px] bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isBn ? 'কর্মী, আইডি বা আইটেম খুঁজুন...' : 'Search worker, ID, item...'}
                className="bg-transparent w-full text-xs focus:outline-none"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

      {/* 3. Regular Employee Personal Production Banner (When employee is logged in) */}
      {isRegularEmployee && (
        <div className={`border-2 border-indigo-500/40 rounded-3xl p-5 sm:p-6 shadow-md bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent ${cardBg}`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                👷
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black">{currentUser.fullName}</h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                    {currentUser.employeeId}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {currentUser.section || 'Production'} সেকশন · {currentUser.designation || 'Worker'}
                </p>
              </div>
            </div>

            {/* Employee's Monthly Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isBn ? 'মোট পিস' : 'Pieces'}</span>
                <div className="text-base sm:text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {mySummary.pieces.toLocaleString()} Pcs
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isBn ? 'টার্গেট' : 'Target'}</span>
                <div className="text-base sm:text-xl font-black font-mono">
                  {mySummary.target.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isBn ? 'অর্ডার সম্পন্ন' : 'Orders'}</span>
                <div className="text-base sm:text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                  {mySummary.ordersCount} টি
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isBn ? 'সম্পন্নতার হার' : 'Completion'}</span>
                <div className="text-base sm:text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {mySummary.completion}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Production Metrics Overview (4-5 KPIs) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* Total Pieces Produced */}
        <div className={`border rounded-2xl p-3.5 sm:p-4 space-y-1 shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
              {isBn ? 'মোট উৎপাদিত পিস' : 'Produced Pieces'}
            </span>
            <Package className="w-4 h-4" />
          </div>
          <div className="text-lg sm:text-2xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {totalProducedPieces.toLocaleString()} <span className="text-xs font-normal text-slate-400">Pcs</span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono truncate">
            {isBn ? 'এই মাসে সম্পন্ন উৎপাদন' : 'Recorded this month'}
          </p>
        </div>

        {/* Total Order Target Pieces */}
        <div className={`border rounded-2xl p-3.5 sm:p-4 space-y-1 shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
              {isBn ? 'মোট লক্ষ্যমাত্রা / অর্ডার' : 'Target Order Qty'}
            </span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-lg sm:text-2xl font-black font-mono tabular-nums">
            {totalOrderTargetPieces.toLocaleString()} <span className="text-xs font-normal text-slate-400">Pcs</span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono truncate">
            {visibleProductions.length} {isBn ? 'টি চলতি এন্ট্রি' : 'active orders'}
          </p>
        </div>

        {/* Overall Completion % */}
        <div className={`border rounded-2xl p-3.5 sm:p-4 space-y-1 shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
              {isBn ? 'সম্পন্নতার হার' : 'Completion Rate'}
            </span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-lg sm:text-2xl font-black font-mono tabular-nums text-blue-600 dark:text-blue-400">
            {overallCompletionRate}%
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${overallCompletionRate}%` }}
            />
          </div>
        </div>

        {/* Active Operators / Workers */}
        <div className={`border rounded-2xl p-3.5 sm:p-4 space-y-1 shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
              {isBn ? 'অংশগ্রহণকারী কর্মী' : 'Active Operators'}
            </span>
            <Users className="w-4 h-4" />
          </div>
          <div className="text-lg sm:text-2xl font-black font-mono tabular-nums text-purple-600 dark:text-purple-400">
            {distinctWorkerIds.length} <span className="text-xs font-normal text-slate-400">{isBn ? 'জন' : 'workers'}</span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono truncate">
            {isBn ? 'প্রোডাকশনে নিয়োজিত' : 'Logged entries'}
          </p>
        </div>

        {/* Active Sections */}
        <div className={`border rounded-2xl p-3.5 sm:p-4 space-y-1 shadow-xs hidden lg:block ${cardBg}`}>
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
              {isBn ? 'কার্যকর সেকশন' : 'Active Sections'}
            </span>
            <Building2 className="w-4 h-4" />
          </div>
          <div className="text-lg sm:text-2xl font-black font-mono tabular-nums text-amber-600 dark:text-amber-400">
            {sections.length} <span className="text-xs font-normal text-slate-400">{isBn ? 'টি' : 'sec'}</span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono truncate">
            {isBn ? 'ফ্যাক্টরি লাইন' : 'Production lines'}
          </p>
        </div>
      </div>

      {/* 5. Section Monthly Production: Microsoft Excel Spreadsheet Grid View */}
      <div className="space-y-3">
        {/* Excel Spreadsheet Container */}
        <div className="border border-emerald-700/60 dark:border-emerald-600/40 rounded-3xl overflow-hidden shadow-md bg-white dark:bg-slate-900">
          {/* Top Excel Ribbon Bar (Microsoft Excel Brand Theme) */}
          <div className="bg-[#107c41] text-white p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-xs">
                <FileSpreadsheet className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                    {isFullAdmin 
                      ? (isBn ? 'আলাদা আলাদা সেকশনের মাসিক প্রোডাকশন সামারি' : 'Section-by-Section Monthly Output')
                      : (isBn ? `আমার সেকশনের মাসিক প্রোডাকশন সামারি (${defaultUserSection})` : `My Section Monthly Output (${defaultUserSection})`)}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/25 text-white">
                    {isFullAdmin ? 'Excel Sheet Grid' : isBn ? 'লকড সেকশন' : 'Locked Section'}
                  </span>
                </div>
                <p className="text-xs text-emerald-100 mt-0.5">
                  {isFullAdmin 
                    ? (isBn ? 'Microsoft Excel স্প্রেডশিট গ্রিডে প্রতিটি সেকশনের মাসিক লক্ষ্যমাত্রা ও উৎপাদন বিশ্লেষণ' : 'Excel spreadsheet breakdown of output, target, and completion rate per line')
                    : (isBn ? `শুধুমাত্র আপনার অনুমোদিত ${defaultUserSection} সেকশনের এক্সেল সামারি ডাটা` : `Excel spreadsheet restricted strictly to your ${defaultUserSection} section`)}
                </p>
              </div>
            </div>

            {/* Excel Toolbar Actions */}
            <div className="flex items-center gap-2 self-end md:self-auto no-print">
              {/* View Switcher: Excel Table vs Cards */}
              <div className="flex items-center bg-black/20 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setSectionViewStyle('excel')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                    sectionViewStyle === 'excel' ? 'bg-white text-emerald-800 shadow-xs' : 'text-white/80 hover:text-white'
                  }`}
                  title={isBn ? 'এক্সেল স্প্রেডশিট টেবিল ভিউ' : 'Excel Sheet View'}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isBn ? 'এক্সেল ভিউ' : 'Excel'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSectionViewStyle('cards')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                    sectionViewStyle === 'cards' ? 'bg-white text-emerald-800 shadow-xs' : 'text-white/80 hover:text-white'
                  }`}
                  title={isBn ? 'কার্ড ভিউ' : 'Cards View'}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isBn ? 'কার্ড ভিউ' : 'Cards'}</span>
                </button>
              </div>

              {/* Export Excel / CSV */}
              <button
                type="button"
                onClick={() => handleExportCSV(isFullAdmin ? 'all' : 'section', undefined, defaultUserSection)}
                className="px-3 py-1.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-black text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                title={isBn ? 'এক্সেল CSV ফাইল হিসেবে ডাউনলোড করুন' : 'Export Excel CSV'}
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span>{isBn ? 'এক্সেল ডাউনলোড' : 'Export CSV'}</span>
              </button>
            </div>
          </div>

          {/* Excel Formula Bar Strip (fx) */}
          <div className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 px-3 py-1.5 flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 text-[11px]">
              A1:H{sectionStats.length + 1}
            </span>
            <span className="font-serif italic font-black text-slate-500 dark:text-slate-400 px-1">
              fx
            </span>
            <div className="flex-1 px-2.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 truncate text-[11px]">
              =SUM(PRODUCTION_PCS) / TARGET_PCS · <strong className="text-emerald-600 dark:text-emerald-400">TOTAL: {excelTotals.totalPieces.toLocaleString()} Pcs</strong> ({excelTotals.overallCompletion}%)
            </div>
            <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">
              {sectionStats.length} {isBn ? 'টি লাইন' : 'lines'} · {selectedMonth}
            </span>
          </div>

          {/* Excel View Mode: Table Grid */}
          {sectionViewStyle === 'excel' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans text-xs">
                {/* Excel Column Letters Coordinate Header */}
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/70 text-slate-400 dark:text-slate-500 font-mono text-[10px] text-center border-b border-slate-200 dark:border-slate-700 select-none">
                    <th className="w-10 p-1 border-r border-slate-200 dark:border-slate-700">#</th>
                    <th className="p-1 border-r border-slate-200 dark:border-slate-700 text-left px-3">A</th>
                    <th className="p-1 border-r border-slate-200 dark:border-slate-700">B</th>
                    <th className="p-1 border-r border-slate-200 dark:border-slate-700 text-right px-3">C</th>
                    <th className="p-1 border-r border-slate-200 dark:border-slate-700 text-right px-3">D</th>
                    <th className="p-1 border-r border-slate-200 dark:border-slate-700 px-3">E</th>
                    <th className="p-1 border-r border-slate-200 dark:border-slate-700">F</th>
                    <th className="p-1 border-r border-slate-200 dark:border-slate-700">G</th>
                    <th className="p-1">H</th>
                  </tr>
                  <tr className="bg-slate-50 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 font-black uppercase tracking-wider text-[11px] border-b border-slate-300 dark:border-slate-700">
                    <th className="w-10 p-2 text-center text-slate-400 font-mono border-r border-slate-200 dark:border-slate-700">
                      SL
                    </th>
                    <th className="p-3 border-r border-slate-200 dark:border-slate-700 min-w-[160px]">
                      {isBn ? 'সেকশন নাম (Section)' : 'Section Name'}
                    </th>
                    <th className="p-3 text-center border-r border-slate-200 dark:border-slate-700">
                      {isBn ? 'কর্মী সংখ্যা' : 'Workers'}
                    </th>
                    <th className="p-3 text-right font-mono border-r border-slate-200 dark:border-slate-700 min-w-[130px]">
                      {isBn ? 'উৎপাদিত পিস (Pcs)' : 'Total Pieces'}
                    </th>
                    <th className="p-3 text-right font-mono border-r border-slate-200 dark:border-slate-700 min-w-[120px]">
                      {isBn ? 'লক্ষ্যমাত্রা (Target)' : 'Target Qty'}
                    </th>
                    <th className="p-3 border-r border-slate-200 dark:border-slate-700 min-w-[150px]">
                      {isBn ? 'সম্পন্নতার হার (%)' : 'Completion Rate'}
                    </th>
                    <th className="p-3 text-center border-r border-slate-200 dark:border-slate-700">
                      {isBn ? 'অর্ডার ব্যাচ' : 'Batches'}
                    </th>
                    <th className="p-3 text-center border-r border-slate-200 dark:border-slate-700 min-w-[110px]">
                      {isBn ? 'দৈনিক গড়' : 'Daily Avg'}
                    </th>
                    <th className="p-3 text-center min-w-[140px] whitespace-nowrap">
                      {isBn ? 'অ্যাকশন / সিএসভি' : 'Action / CSV'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {sectionStats.map((stat, idx) => {
                    const isSelected = selectedSection === stat.section;
                    const rowNum = idx + 1;
                    return (
                      <tr
                        key={stat.section}
                        onClick={() => {
                          if (isFullAdmin) {
                            setSelectedSection(isSelected ? 'all' : stat.section);
                            setViewMode('section');
                          }
                        }}
                        className={`transition-colors cursor-pointer group ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-inset ring-emerald-500'
                            : idx % 2 === 0
                            ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                            : 'bg-slate-50/60 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {/* Excel Row Index */}
                        <td className="p-2.5 text-center font-mono font-bold text-slate-400 dark:text-slate-500 bg-slate-100/70 dark:bg-slate-800/60 border-r border-slate-200 dark:border-slate-700">
                          {rowNum}
                        </td>

                        {/* Column A: Section Name */}
                        <td className="p-3 border-r border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <span className="font-black text-slate-900 dark:text-white uppercase tracking-wide">
                              {stat.section}
                            </span>
                            {isSelected && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-600 text-white">
                                {isBn ? 'নির্বাচিত' : 'Active'}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Column B: Workers Count */}
                        <td className="p-3 text-center font-mono border-r border-slate-200 dark:border-slate-700">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {stat.workerCount} {isBn ? 'কর্মী' : 'workers'}
                          </span>
                        </td>

                        {/* Column C: Total Pieces Produced */}
                        <td className="p-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 tabular-nums text-sm border-r border-slate-200 dark:border-slate-700">
                          {stat.totalPieces.toLocaleString()}{' '}
                          <span className="text-[10px] font-normal text-slate-400">Pcs</span>
                        </td>

                        {/* Column D: Target Pieces */}
                        <td className="p-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300 tabular-nums border-r border-slate-200 dark:border-slate-700">
                          {stat.targetPieces.toLocaleString()}
                        </td>

                        {/* Column E: Completion % with Excel Data Bar */}
                        <td className="p-3 border-r border-slate-200 dark:border-slate-700">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between font-mono text-[11px]">
                              <span className="font-black text-slate-800 dark:text-slate-200">
                                {stat.completion}%
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {stat.completion >= 100 ? (isBn ? '✅ অর্জিত' : 'Goal Met') : `${stat.completion}%`}
                              </span>
                            </div>
                            {/* Excel Data-Bar Simulation */}
                            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  stat.completion >= 100
                                    ? 'bg-emerald-500'
                                    : stat.completion >= 60
                                    ? 'bg-indigo-600'
                                    : 'bg-amber-500'
                                }`}
                                style={{ width: `${Math.min(100, stat.completion)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Column F: Batches / Orders */}
                        <td className="p-3 text-center font-mono font-bold text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700">
                          {stat.orderCount} {isBn ? 'টি' : 'orders'}
                        </td>

                        {/* Column G: Daily Average */}
                        <td className="p-3 text-center font-mono font-semibold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700">
                          {stat.dailyAverage > 0 ? `~${stat.dailyAverage} pcs/d` : '-'}
                        </td>

                        {/* Column H: Actions */}
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            {isFullAdmin && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSection(isSelected ? 'all' : stat.section);
                                  setViewMode('section');
                                }}
                                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                                  isSelected
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <Filter className="w-3 h-3" />
                                <span>{isSelected ? (isBn ? 'নির্বাচিত' : 'Selected') : (isBn ? 'ফিল্টার' : 'Filter')}</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleExportCSV('section', undefined, stat.section)}
                              className="px-2 py-1 rounded-lg text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 transition cursor-pointer flex items-center gap-1"
                              title={isBn ? `${stat.section} এর CSV ডাউনলোড করুন` : `Export ${stat.section} CSV`}
                            >
                              <Download className="w-3 h-3" />
                              <span>CSV</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Excel Bottom Grand Total Row (SUM Row) */}
                  <tr className="bg-emerald-50 dark:bg-emerald-950/50 border-t-2 border-emerald-600 dark:border-emerald-500 font-bold">
                    <td className="p-2.5 text-center font-mono font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-900/40 border-r border-emerald-200 dark:border-emerald-800">
                      ∑
                    </td>
                    <td className="p-3 text-emerald-900 dark:text-emerald-200 font-black border-r border-emerald-200 dark:border-emerald-800">
                      {isBn ? 'মোট কারখানা হিসাব (Grand Total)' : 'Grand Total Factory Output'}
                    </td>
                    <td className="p-3 text-center font-mono font-black text-emerald-800 dark:text-emerald-300 border-r border-emerald-200 dark:border-emerald-800">
                      {excelTotals.totalWorkers} {isBn ? 'কর্মী' : 'workers'}
                    </td>
                    <td className="p-3 text-right font-mono font-black text-emerald-700 dark:text-emerald-300 tabular-nums text-base border-r border-emerald-200 dark:border-emerald-800">
                      {excelTotals.totalPieces.toLocaleString()} <span className="text-xs font-normal">Pcs</span>
                    </td>
                    <td className="p-3 text-right font-mono font-black text-slate-800 dark:text-slate-200 tabular-nums border-r border-emerald-200 dark:border-emerald-800">
                      {excelTotals.totalTarget.toLocaleString()}
                    </td>
                    <td className="p-3 border-r border-emerald-200 dark:border-emerald-800">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between font-mono text-[11px] text-emerald-800 dark:text-emerald-300">
                          <span>{isBn ? 'গড় অর্জন' : 'Avg'}: {excelTotals.overallCompletion}%</span>
                        </div>
                        <div className="w-full bg-emerald-200/60 dark:bg-emerald-900 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full"
                            style={{ width: `${Math.min(100, excelTotals.overallCompletion)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center font-mono font-black text-emerald-800 dark:text-emerald-300 border-r border-emerald-200 dark:border-emerald-800">
                      {excelTotals.totalOrders} {isBn ? 'টি ব্যাচ' : 'batches'}
                    </td>
                    <td className="p-3 text-center font-mono text-slate-500 dark:text-slate-400 border-r border-emerald-200 dark:border-emerald-800 text-[11px]">
                      =SUM(C)
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleExportCSV(isFullAdmin ? 'all' : 'section', undefined, defaultUserSection)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 mx-auto shadow-2xs cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>{isBn ? 'সব CSV' : 'All CSV'}</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            /* Cards View fallback */
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {sectionStats.map(stat => {
                const isSelected = selectedSection === stat.section;
                return (
                  <div 
                    key={stat.section}
                    className={`border rounded-2xl p-4 space-y-3 transition shadow-xs relative ${cardBg} ${
                      isSelected ? 'ring-2 ring-emerald-500 border-emerald-500' : 'hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-black uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                          {stat.section}
                        </span>
                        <div className="text-base sm:text-lg font-black font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                          {stat.totalPieces.toLocaleString()} <span className="text-xs font-medium text-slate-400">Pcs</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {stat.workerCount} {isBn ? 'কর্মী' : 'workers'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>{isBn ? 'লক্ষ্যমাত্রা:' : 'Target:'} {stat.targetPieces.toLocaleString()}</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{stat.completion}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            stat.completion >= 100 ? 'bg-emerald-500' : stat.completion >= 60 ? 'bg-indigo-600' : 'bg-amber-500'
                          }`}
                          style={{ width: `${stat.completion}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                      {isFullAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSection(isSelected ? 'all' : stat.section);
                            setViewMode('section');
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                            isSelected 
                              ? 'bg-emerald-600 text-white' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          <Filter className="w-3 h-3" />
                          <span>{isSelected ? (isBn ? 'নির্বাচিত' : 'Selected') : (isBn ? 'ফিল্টার' : 'Filter')}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleExportCSV('section', undefined, stat.section)}
                        className="px-2 py-1 rounded-lg text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer flex items-center gap-1 ml-auto"
                        title={isBn ? `এই সেকশনের (${stat.section}) CSV ফাইল ডাউনলোড করুন` : `Export ${stat.section} CSV`}
                      >
                        <Download className="w-3 h-3" />
                        <span>CSV</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 6. "মান্থলি কে কত প্রোডাকশন করেছে" Employee Roster & Table */}
      <div className={`border rounded-3xl overflow-hidden shadow-xs ${cardBg}`}>
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>
                {isRegularEmployee 
                  ? (isBn ? 'আমার ব্যক্তিগত মাসিক প্রোডাকশন লগ' : 'My Monthly Production Log') 
                  : isBasicAccount
                  ? (isBn ? `আমার সেকশনের কর্মীদের প্রোডাকশন লগ (${defaultUserSection})` : `Worker Production Log (${defaultUserSection})`)
                  : (isBn ? 'মান্থলি কে কত প্রোডাকশন করেছে (Worker Monthly Output)' : 'Worker Monthly Output Roster')}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isRegularEmployee
                ? (isBn ? 'আপনার উৎপাদিত পিস, অর্ডারের বিবরণ ও ব্যক্তিগত রেকর্ড' : 'Your personal output, pieces produced and daily logs')
                : isBasicAccount
                ? (isBn ? `শুধুমাত্র আপনার অনুমোদিত ${defaultUserSection} সেকশনের কর্মী ও আপনার ব্যক্তিগত প্রোডাকশন বিবরণ` : `Workers and output limited strictly to ${defaultUserSection} section`)
                : (isBn ? 'প্রতিটি কর্মীর আইডি, সেকশন, মোট উৎপাদিত পিস এবং ব্যক্তিগত সিএসভি ডাউনলোড' : 'Employee ID, section, total pieces produced, and individual CSV exports')}
            </p>
          </div>

          <div className="text-xs font-mono font-bold text-slate-400">
            {employeeMonthlySummary.length} {isBn ? 'জন কর্মী তালিকায়' : 'workers listed'}
          </div>
        </div>

        {/* Mobile View: Responsive CSS Grid / Flexbox Cards (Zero horizontal scroll on mobile) */}
        <div className="block md:hidden p-3 sm:p-4 space-y-3">
          {employeeMonthlySummary.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-bold text-xs">
              {isBn ? 'এই মাসে নির্বাচিত ফিল্টারে কোনো উৎপাদন রেকর্ড পাওয়া যায়নি।' : 'No production records found for this filter.'}
            </div>
          ) : (
            employeeMonthlySummary.map((item, idx) => {
              const isTop = idx === 0 && item.pieces > 0;
              return (
                <div
                  key={item.user.id}
                  className={`border rounded-2xl p-3.5 space-y-3 transition shadow-2xs ${
                    item.isCurrentUser
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500'
                      : darkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50/80 border-slate-200'
                  }`}
                >
                  {/* Top: Worker Profile & Top Producer Tag */}
                  <div className="flex items-start justify-between gap-2 border-b pb-2.5 border-slate-200/80 dark:border-slate-700/80">
                    <div className="flex items-center gap-2">
                      {item.isCurrentUser && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-600 text-white shadow-2xs shrink-0">
                          ⭐ {isBn ? 'আপনি' : 'You'}
                        </span>
                      )}
                      {isTop && !item.isCurrentUser && (
                        <span className="text-amber-500 font-black text-sm shrink-0" title="Top Producer">
                          🏆
                        </span>
                      )}
                      <UserProfileBadge 
                        user={item.user} 
                        size="sm" 
                        showJoiningDate={false} 
                        darkMode={darkMode} 
                        language={language} 
                      />
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                        {item.user.section || 'General'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {item.user.designation || 'Worker'}
                      </span>
                    </div>
                  </div>

                  {/* Production Output 2-Column Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        {isBn ? 'মোট উৎপাদিত পিস' : 'Pieces Produced'}
                      </span>
                      <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-base">
                        {item.pieces.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">Pcs</span>
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        {isBn ? 'অর্ডার লক্ষ্যমাত্রা' : 'Target Qty'}
                      </span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-200 text-base">
                        {item.target.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar & Rate */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono font-semibold">
                      <span>{isBn ? 'সম্পন্নতার হার' : 'Completion'}: <strong className="text-indigo-600 dark:text-indigo-400">{item.completion}%</strong></span>
                      <span className="text-slate-400">
                        {item.dailyAverage > 0 ? `~${item.dailyAverage} pcs/day` : (item.lastDate || '')}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          item.completion >= 100 ? 'bg-emerald-500' : item.completion >= 60 ? 'bg-indigo-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${item.completion}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer Actions: Orders Count, Details Modal & Individual CSV */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                    <span className="text-[11px] font-mono font-bold text-slate-500">
                      {item.ordersCount} {isBn ? 'টি অর্ডার এন্ট্রি' : 'orders'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setDetailModalUser(item.user)}
                        className="px-2.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-2xs active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isBn ? 'হিসাব' : 'View'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExportCSV('employee', item.user)}
                        className="px-2.5 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-2xs active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>CSV</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-extrabold uppercase tracking-wider">
                <th className="p-4">{isBn ? 'কর্মী ও আইডি' : 'Worker'}</th>
                <th className="p-4">{isBn ? 'সেকশন ও পদবি' : 'Section & Role'}</th>
                <th className="p-4 text-right">{isBn ? 'মোট উৎপাদিত পিস' : 'Total Pieces'}</th>
                <th className="p-4 text-right">{isBn ? 'অর্ডার লক্ষ্যমাত্রা' : 'Target Qty'}</th>
                <th className="p-4 w-40">{isBn ? 'সম্পন্নতার হার' : 'Progress'}</th>
                <th className="p-4 text-center">{isBn ? 'অর্ডার সংখ্যা' : 'Orders'}</th>
                <th className="p-4 text-center">{isBn ? 'সর্বশেষ কাজ' : 'Last Active'}</th>
                <th className="p-4 text-center whitespace-nowrap">{isBn ? 'অ্যাকশন / সিএসভি' : 'Actions / CSV'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {employeeMonthlySummary.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                    {isBn ? 'এই মাসে নির্বাচিত ফিল্টারে কোনো উৎপাদন রেকর্ড পাওয়া যায়নি।' : 'No production records found for this filter.'}
                  </td>
                </tr>
              ) : (
                employeeMonthlySummary.map((item, idx) => {
                  const isTop = idx === 0 && item.pieces > 0;
                  return (
                    <tr 
                      key={item.user.id}
                      className={`transition-colors ${
                        item.isCurrentUser
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 ring-1 ring-inset ring-emerald-500'
                          : darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Worker Badge */}
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          {item.isCurrentUser && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-600 text-white shadow-2xs shrink-0">
                              ⭐ {isBn ? 'আপনার রেকর্ড' : 'You'}
                            </span>
                          )}
                          {isTop && !item.isCurrentUser && (
                            <span className="text-amber-500 font-black text-xs shrink-0" title="Top Producer">
                              🏆
                            </span>
                          )}
                          <UserProfileBadge 
                            user={item.user} 
                            size="sm" 
                            showJoiningDate={false} 
                            darkMode={darkMode} 
                            language={language} 
                          />
                        </div>
                      </td>

                      {/* Section & Role */}
                      <td className="p-4">
                        <div className="font-extrabold text-slate-800 dark:text-slate-200">
                          {item.user.section || 'General'}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {item.user.designation || (item.user.accountType === 'employee' ? 'Worker' : item.user.accountType)}
                        </div>
                      </td>

                      {/* Total Pieces Produced this Month (Bold highlight) */}
                      <td className="p-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 tabular-nums text-sm sm:text-base">
                        {item.pieces.toLocaleString()} <span className="text-[11px] font-normal text-slate-400">Pcs</span>
                      </td>

                      {/* Target Order Qty */}
                      <td className="p-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                        {item.target.toLocaleString()}
                      </td>

                      {/* Completion Progress Bar */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono font-semibold">
                            <span>{item.completion}%</span>
                            <span className="text-slate-400">
                              {item.dailyAverage > 0 ? `~${item.dailyAverage}/day` : ''}
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${
                                item.completion >= 100 ? 'bg-emerald-500' : item.completion >= 60 ? 'bg-indigo-600' : 'bg-amber-500'
                              }`}
                              style={{ width: `${item.completion}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Orders Count */}
                      <td className="p-4 text-center font-mono font-bold">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {item.ordersCount}
                        </span>
                      </td>

                      {/* Last Active Date */}
                      <td className="p-4 text-center font-mono text-slate-400 text-[11px]">
                        {item.lastDate}
                      </td>

                      {/* Action Buttons: View Details & CSV */}
                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Drilldown modal button */}
                          <button
                            type="button"
                            onClick={() => setDetailModalUser(item.user)}
                            className="px-2.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-2xs active:scale-95"
                            title={isBn ? 'এই কর্মীর সকল অর্ডারের বিস্তারিত দেখুন' : 'View Detailed Production Logs'}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isBn ? 'হিসাব' : 'View'}</span>
                          </button>

                          {/* Individual Worker CSV download button */}
                          <button
                            type="button"
                            onClick={() => handleExportCSV('employee', item.user)}
                            className="px-2.5 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-2xs active:scale-95"
                            title={isBn ? `এই কর্মীর (${item.user.fullName}) প্রোডাকশন CSV ডাউনলোড করুন` : `Export ${item.user.fullName} CSV`}
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{isBn ? 'CSV' : 'CSV'}</span>
                          </button>
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

      {/* 7. Detailed Employee Log Drilldown Modal */}
      {detailModalUser && (() => {
        const userProds = monthProductions.filter(p => p.userId === detailModalUser.id);
        const totalPcs = userProds.reduce((s, p) => s + Number(p.prodQty || 0), 0);
        const totalOrd = userProds.reduce((s, p) => s + Number(p.orderQty || 0), 0);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in no-print">
            <div className={`w-full max-w-4xl max-h-[90vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden animate-scale-up ${cardBg}`}>
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <UserProfileBadge 
                    user={detailModalUser} 
                    size="md" 
                    showJoiningDate={false} 
                    darkMode={darkMode} 
                    language={language} 
                  />
                  <div>
                    <h3 className="text-base sm:text-lg font-black">
                      {detailModalUser.fullName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {detailModalUser.employeeId} · {detailModalUser.section || 'General'} · {selectedMonth}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExportCSV('employee', detailModalUser)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isBn ? 'এই কর্মীর CSV ডাউনলোড' : 'Download Worker CSV'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailModalUser(null)}
                    className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body: Summary Strip & Entries Table */}
              <div className="p-5 overflow-y-auto space-y-4">
                {/* Metric Strip */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isBn ? 'মোট উৎপাদিত পিস' : 'Total Pieces'}</span>
                    <div className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {totalPcs.toLocaleString()} Pcs
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isBn ? 'টার্গেট অর্ডার' : 'Total Target'}</span>
                    <div className="text-lg font-black font-mono">
                      {totalOrd.toLocaleString()} Pcs
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isBn ? 'অর্ডার এন্ট্রি' : 'Entries'}</span>
                    <div className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400">
                      {userProds.length} টি
                    </div>
                  </div>
                </div>

                {/* Individual records: Responsive card stack on mobile, table on desktop */}
                <div className="border rounded-2xl overflow-hidden border-slate-200 dark:border-slate-800">
                  {/* Mobile records list */}
                  <div className="block sm:hidden divide-y divide-slate-200 dark:divide-slate-800">
                    {userProds.length === 0 ? (
                      <div className="p-6 text-center text-slate-400">
                        {isBn ? 'কোনো উৎপাদন রেকর্ড নেই।' : 'No records.'}
                      </div>
                    ) : (
                      userProds.map(p => {
                        const pct = p.orderQty > 0 ? Math.round((p.prodQty / p.orderQty) * 100) : 0;
                        return (
                          <div key={p.id} className="p-3.5 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h5 className="font-extrabold text-xs">{p.itemName}</h5>
                                <div className="text-[10px] text-slate-400">{p.buyer} {p.company ? `· ${p.company}` : ''}</div>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                p.status === 'Completed'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : p.status === 'Running'
                                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              }`}>
                                {p.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <span className="text-[9px] uppercase font-bold text-slate-400 block">{isBn ? 'টার্গেট' : 'Target'}</span>
                                <span className="font-mono font-bold">{p.orderQty.toLocaleString()} {p.unit}</span>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <span className="text-[9px] uppercase font-bold text-slate-400 block">{isBn ? 'উৎপাদিত' : 'Produced'}</span>
                                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">{p.prodQty.toLocaleString()} {p.unit} ({pct}%)</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                              <span>{isBn ? 'সেকশন:' : 'Sec:'} <strong className="text-indigo-600 dark:text-indigo-400">{p.section}</strong></span>
                              <span>{p.date}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-extrabold uppercase">
                          <th className="p-3">{isBn ? 'তারিখ' : 'Date'}</th>
                          <th className="p-3">{isBn ? 'আইটেম ও বায়ার' : 'Item & Buyer'}</th>
                          <th className="p-3">{isBn ? 'সেকশন' : 'Section'}</th>
                          <th className="p-3 text-right">{isBn ? 'টার্গেট' : 'Target'}</th>
                          <th className="p-3 text-right">{isBn ? 'উৎপাদিত পিস' : 'Produced'}</th>
                          <th className="p-3 text-center">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                        </tr>
                      </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {userProds.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-400">
                            {isBn ? 'কোনো উৎপাদন রেকর্ড নেই।' : 'No records.'}
                          </td>
                        </tr>
                      ) : (
                        userProds.map(p => {
                          const pct = p.orderQty > 0 ? Math.round((p.prodQty / p.orderQty) * 100) : 0;
                          return (
                            <tr key={p.id}>
                              <td className="p-3 font-mono font-semibold">{p.date}</td>
                              <td className="p-3">
                                <div className="font-extrabold">{p.itemName}</div>
                                <div className="text-[10px] text-slate-400">{p.buyer} {p.company ? `· ${p.company}` : ''}</div>
                              </td>
                              <td className="p-3 font-semibold text-indigo-600 dark:text-indigo-400">{p.section}</td>
                              <td className="p-3 text-right font-mono">{p.orderQty.toLocaleString()} {p.unit}</td>
                              <td className="p-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                                {p.prodQty.toLocaleString()} {p.unit} ({pct}%)
                              </td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  p.status === 'Completed'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : p.status === 'Running'
                                      ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                }`}>
                                  {p.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setDetailModalUser(null)}
                  className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer"
                >
                  {isBn ? 'বন্ধ করুন' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
