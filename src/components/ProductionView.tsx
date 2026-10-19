import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ProductionRecord, User, Language, CompanyProfile, ProductionSize } from '../types';
import { translations } from '../i18n';
import { INITIAL_SIZES } from '../storage';
import { UserProfileBadge } from './UserProfileBadge';
import { MonthlyProductionReport } from './MonthlyProductionReport';
import { Plus, Search, Filter, CheckCircle2, Clock, AlertCircle, Trash2, Edit3, BarChart3, ListFilter, Download, Upload, FileSpreadsheet, Layers, Check } from 'lucide-react';

interface ProductionViewProps {
  productions: ProductionRecord[];
  users: User[];
  sections: string[];
  currentUser: User;
  companyProfile?: CompanyProfile;
  sizes?: ProductionSize[];
  language: Language;
  darkMode: boolean;
  onAddProduction: (record: Omit<ProductionRecord, 'id'>) => void;
  onAddBatchProduction?: (records: Omit<ProductionRecord, 'id'>[]) => void;
  onSaveSizes?: (sizes: ProductionSize[]) => void;
  onAddSize?: (size: Omit<ProductionSize, 'id'>) => void;
  onUpdateSize?: (size: ProductionSize) => void;
  onDeleteSize?: (id: string) => void;
  onUpdateProduction?: (record: ProductionRecord) => void;
  onDeleteProduction?: (id: string) => void;
  selectedMonth?: string;
  onSelectMonth?: (month: string) => void;
  initialTab?: 'daily' | 'monthly';
  onTabChange?: (tab: 'daily' | 'monthly') => void;
}

export const ProductionView: React.FC<ProductionViewProps> = ({
  productions,
  users,
  sections,
  currentUser,
  companyProfile,
  sizes = INITIAL_SIZES,
  language,
  darkMode,
  onAddProduction,
  onAddBatchProduction,
  onSaveSizes,
  onUpdateProduction,
  onDeleteProduction,
  selectedMonth,
  onSelectMonth,
  initialTab = 'daily',
  onTabChange
}) => {
  const t = translations[language];
  const isBn = language === 'bn';
  const [productionSubTab, setProductionSubTab] = useState<'daily' | 'monthly'>(initialTab);

  useEffect(() => {
    if (initialTab && initialTab !== productionSubTab) {
      setProductionSubTab(initialTab);
    }
  }, [initialTab]);
  const isFullAdmin = currentUser.accountType === 'hosting' || currentUser.accountType === 'admin' || currentUser.adminAccess === 'full' || currentUser.accountType === 'owner';
  const isBasicAccount = !isFullAdmin;
  const isRegularEmployee = !isFullAdmin && currentUser.accountType === 'employee';
  const isAdminOrHosting = isFullAdmin;
  const employeeSection = currentUser.section;

  const [selectedSection, setSelectedSection] = useState<string>(() => {
    if (isBasicAccount && employeeSection) return employeeSection;
    return 'all';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [itemName, setItemName] = useState('');
  const [buyer, setBuyer] = useState('');
  const [company, setCompany] = useState('');
  const [length, setLength] = useState('');
  const [orderQty, setOrderQty] = useState('');
  const [prodQty, setProdQty] = useState('');
  const [unit, setUnit] = useState('Pcs');
  const [formSection, setFormSection] = useState(() => {
    if (isRegularEmployee && employeeSection) return employeeSection;
    return sections[0] || 'Sewing';
  });
  const [status, setStatus] = useState<'Running' | 'Completed' | 'Delayed'>('Running');
  const [selectedSize, setSelectedSize] = useState<string>('L');
  const [manualSizeInput, setManualSizeInput] = useState<string>('L');
  const [multiSizeMode, setMultiSizeMode] = useState(false);
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, string>>({
    'XS': '',
    'S': '',
    'M': '',
    'L': '',
    'XL': '',
    'XXL': ''
  });
  const [customBreakdownInput, setCustomBreakdownInput] = useState('');

  // Size management state
  const [sizeList, setSizeList] = useState<ProductionSize[]>(sizes || INITIAL_SIZES);
  const [sizeModalOpen, setSizeModalOpen] = useState(false);
  const [newSizeName, setNewSizeName] = useState('');

  // Bulk CSV state
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkFormat, setBulkFormat] = useState<'auto' | 'row' | 'matrix'>('auto');
  const [csvText, setCsvText] = useState('');
  const [csvFileName, setCsvFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [bulkSummary, setBulkSummary] = useState<{ imported: number; skipped: number; failed: number } | null>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  // Active sizes for selector
  const activeSizes = useMemo(() => {
    return sizeList.filter(s => s.isActive);
  }, [sizeList]);

  // Edit Production Record State (Quota: max 5 edits for workers, unlimited for admin)
  const [editingRecord, setEditingRecord] = useState<ProductionRecord | null>(null);
  const [editProdQty, setEditProdQty] = useState('');
  const [editOrderQty, setEditOrderQty] = useState('');
  const [editLength, setEditLength] = useState('');
  const [editSize, setEditSize] = useState('L');
  const [editUnit, setEditUnit] = useState('Pcs');
  const [editStatus, setEditStatus] = useState<'Running' | 'Completed' | 'Delayed'>('Running');
  const [resetCounterByAdmin, setResetCounterByAdmin] = useState(false);
  const [editError, setEditError] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const filteredProductions = productions.filter(p => {
    if (isBasicAccount && employeeSection && p.section !== employeeSection) {
      return false;
    }
    if (isRegularEmployee && p.userId !== currentUser.id) {
      return false;
    }
    const matchesSection = selectedSection === 'all' || p.section === selectedSection;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || p.itemName.toLowerCase().includes(q) || p.buyer.toLowerCase().includes(q) || p.company.toLowerCase().includes(q);
    return matchesSection && matchesSearch;
  });

  const handleSizeQtyChange = (sizeKey: string, val: string) => {
    const updated = { ...sizeQuantities, [sizeKey]: val };
    setSizeQuantities(updated);
    const totalPieces = Object.values(updated).reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0);
    if (totalPieces > 0) {
      setProdQty(totalPieces.toString());
    }
  };

  const handleAddBreakdownSize = () => {
    const trimmed = customBreakdownInput.trim().toUpperCase();
    if (!trimmed) return;
    if (sizeQuantities[trimmed] === undefined) {
      setSizeQuantities(prev => ({ ...prev, [trimmed]: '' }));
    }
    if (!sizeList.some(s => s.name.toUpperCase() === trimmed)) {
      const nextList: ProductionSize[] = [
        ...sizeList,
        { id: `sz-${Date.now()}`, name: trimmed, isActive: true, order: sizeList.length + 1 }
      ];
      setSizeList(nextList);
      onSaveSizes?.(nextList);
    }
    setCustomBreakdownInput('');
    setToastMsg(isBn ? `✓ "${trimmed}" সাইজ যুক্ত হয়েছে!` : `✓ "${trimmed}" size added!`);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const handleSaveQuickCustomSize = (customName: string) => {
    const trimmed = customName.trim().toUpperCase();
    if (!trimmed) return;
    if (sizeList.some(s => s.name.toUpperCase() === trimmed)) {
      setToastMsg(isBn ? 'এই সাইজটি ইতিমধ্যে তালিকায় রয়েছে।' : 'Size already in list.');
      setTimeout(() => setToastMsg(''), 2500);
      return;
    }
    const nextList: ProductionSize[] = [
      ...sizeList,
      { id: `sz-${Date.now()}`, name: trimmed, isActive: true, order: sizeList.length + 1 }
    ];
    setSizeList(nextList);
    onSaveSizes?.(nextList);
    setToastMsg(isBn ? `✓ "${trimmed}" সাইজ তালিকায় যুক্ত হয়েছে!` : `✓ "${trimmed}" size saved!`);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetSection = isFullAdmin ? formSection : (currentUser.section || sections[0] || 'Sewing');

    const finalSize = multiSizeMode 
      ? Object.entries(sizeQuantities).filter(([_, qty]) => Number(qty) > 0).map(([sz, qty]) => `${sz}:${qty}`).join(', ') || manualSizeInput || selectedSize || 'L'
      : (manualSizeInput.trim() || selectedSize || 'L');

    onAddProduction({
      userId: currentUser.id,
      date: new Date().toISOString().split('T')[0],
      section: targetSection,
      itemName: itemName.trim(),
      buyer: buyer.trim() || 'Direct Buyer',
      company: company.trim() || 'Creative Accessories Factory',
      length: length.trim(),
      size: finalSize,
      orderQty: Number(orderQty),
      prodQty: Number(prodQty),
      unit: unit || 'Pcs',
      startTime: '09:00 AM',
      endTime: '06:00 PM',
      hours: 9,
      status,
      editCount: 0
    });

    // Reset
    setItemName('');
    setBuyer('');
    setCompany('');
    setLength('');
    setOrderQty('');
    setProdQty('');
    setManualSizeInput('L');
    setSelectedSize('L');
    setSizeQuantities({
      'XS': '',
      'S': '',
      'M': '',
      'L': '',
      'XL': '',
      'XXL': ''
    });
    setMultiSizeMode(false);
    setModalOpen(false);
  };

  // Add custom size
  const handleAddCustomSize = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSizeName.trim().toUpperCase();
    if (!trimmed) return;
    if (sizeList.some(s => s.name.toUpperCase() === trimmed)) {
      setToastMsg(isBn ? 'এই সাইজটি ইতিমধ্যে রয়েছে।' : 'Size already exists.');
      setTimeout(() => setToastMsg(''), 3000);
      return;
    }
    const nextList: ProductionSize[] = [
      ...sizeList,
      { id: `sz-${Date.now()}`, name: trimmed, isActive: true, order: sizeList.length + 1 }
    ];
    setSizeList(nextList);
    onSaveSizes?.(nextList);
    setNewSizeName('');
  };

  const handleToggleSize = (sizeId: string) => {
    const nextList = sizeList.map(s => s.id === sizeId ? { ...s, isActive: !s.isActive } : s);
    setSizeList(nextList);
    onSaveSizes?.(nextList);
  };

  // Production CSV Bulk Parser (Supports Row-based AND Wide Matrix formats)
  const parseProductionCsv = (rawText: string) => {
    const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      setParsedRows([]);
      return;
    }

    const header = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const isMatrix = bulkFormat === 'matrix' || (bulkFormat === 'auto' && (
      header.some(h => ['xs', 's', 'm', 'l', 'xl', 'xxl', '3xl', '4xl'].includes(h.toLowerCase()))
    ));

    const records: any[] = [];
    const dataLines = lines.slice(1);

    if (isMatrix) {
      // Matrix Format: employee_id, product, date, [Size columns...]
      // Find size columns in header
      const sizeCols: { colIndex: number; sizeName: string }[] = [];
      header.forEach((h, idx) => {
        if (idx >= 3) {
          sizeCols.push({ colIndex: idx, sizeName: h.toUpperCase() });
        }
      });

      dataLines.forEach((line, rowIdx) => {
        const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
        const empId = parts[0] || '';
        const prod = parts[1] || '';
        const date = parts[2] || new Date().toISOString().split('T')[0];
        const matchedUser = users.find(u => u.employeeId.toLowerCase() === empId.toLowerCase());

        sizeCols.forEach(sc => {
          const qty = parseFloat(parts[sc.colIndex] || '0');
          if (qty > 0) {
            records.push({
              rowNum: rowIdx + 2,
              empId,
              empName: matchedUser?.fullName || 'Worker',
              matchedUser,
              product: prod,
              date,
              size: sc.sizeName,
              quantity: qty,
              isValid: Boolean(matchedUser && prod && qty > 0),
              error: !matchedUser ? `Worker ${empId} not found` : (!prod ? 'Missing product name' : undefined)
            });
          }
        });
      });
    } else {
      // Row Format: employee_id, product, date, size, quantity, notes
      dataLines.forEach((line, rowIdx) => {
        const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
        const empId = parts[0] || '';
        const prod = parts[1] || '';
        const date = parts[2] || new Date().toISOString().split('T')[0];
        const sizeVal = (parts[3] || 'L').toUpperCase();
        const qty = parseFloat(parts[4] || '0');
        const notes = parts[5] || '';
        const matchedUser = users.find(u => u.employeeId.toLowerCase() === empId.toLowerCase());

        records.push({
          rowNum: rowIdx + 2,
          empId,
          empName: matchedUser?.fullName || 'Worker',
          matchedUser,
          product: prod,
          date,
          size: sizeVal,
          quantity: qty,
          notes,
          isValid: Boolean(matchedUser && prod && qty > 0),
          error: !matchedUser ? `Worker ${empId} not found` : (!prod ? 'Missing product name' : (qty <= 0 ? 'Invalid quantity' : undefined))
        });
      });
    }

    setParsedRows(records);
  };

  const handleExecuteBulkProductionImport = () => {
    const validRows = parsedRows.filter(r => r.isValid && r.matchedUser);
    if (validRows.length === 0) {
      setToastMsg(isBn ? 'ইমপোর্ট করার মতো কোনো বৈধ রেকর্ড পাওয়া যায়নি।' : 'No valid production records to import.');
      setTimeout(() => setToastMsg(''), 3500);
      return;
    }

    const newRecords: Omit<ProductionRecord, 'id'>[] = validRows.map(r => ({
      userId: r.matchedUser.id,
      date: r.date,
      section: r.matchedUser.section || sections[0] || 'Sewing',
      itemName: r.product,
      buyer: 'Batch Import Order',
      company: 'Creative Accessories Factory',
      size: r.size,
      orderQty: r.quantity,
      prodQty: r.quantity,
      unit: 'Pcs',
      startTime: '09:00 AM',
      endTime: '06:00 PM',
      hours: 9,
      status: 'Completed',
      notes: r.notes || 'CSV Import'
    }));

    if (onAddBatchProduction) {
      onAddBatchProduction(newRecords);
    } else {
      newRecords.forEach(rec => onAddProduction(rec));
    }

    setBulkSummary({
      imported: validRows.length,
      skipped: parsedRows.length - validRows.length,
      failed: parsedRows.length - validRows.length
    });

    setToastMsg(isBn 
      ? `সফলভাবে ${validRows.length} টি প্রোডাকশন এন্ট্রি বাল্ক যোগ করা হয়েছে!` 
      : `Successfully bulk imported ${validRows.length} production entries!`);
    setTimeout(() => setToastMsg(''), 5000);
  };

  const handleOpenEdit = (p: ProductionRecord) => {
    // Permission check: Only entry creator in their assigned section can edit, unless full admin
    if (!isFullAdmin && p.userId !== currentUser.id) {
      setToastMsg(isBn 
        ? '⚠️ অনুমতি নেই: আপনি শুধুমাত্র নিজের এন্ট্রি করা প্রোডাকশন ডাটা এডিট করতে পারবেন।' 
        : 'Permission denied: You can only edit your own production entries.');
      setTimeout(() => setToastMsg(''), 4500);
      return;
    }

    if (!isFullAdmin && currentUser.section && p.section !== currentUser.section) {
      setToastMsg(isBn 
        ? `⚠️ অনুমতি নেই: আপনি শুধুমাত্র আপনার নির্ধারিত সেকশনের (${currentUser.section}) ডাটা এডিট করতে পারবেন।` 
        : `Permission denied: You can only edit records from your assigned section (${currentUser.section}).`);
      setTimeout(() => setToastMsg(''), 4500);
      return;
    }

    const editCount = p.editCount || 0;
    if (!isFullAdmin && editCount >= 5) {
      setToastMsg(isBn ? 'এই প্রোডাকশন রেকর্ডটি ইতিমধ্যে সর্বোচ্চ ৫ বার পরিবর্তন করা হয়েছে। পরিবর্তনের জন্য ফ্যাক্টরি অ্যাডমিনের সাথে যোগাযোগ করুন।' : 'Maximum 5 edits reached for this record. Please contact an admin.');
      setTimeout(() => setToastMsg(''), 4500);
      return;
    }
    setEditingRecord(p);
    setEditProdQty(p.prodQty.toString());
    setEditOrderQty(p.orderQty.toString());
    setEditLength(p.length || '');
    setEditSize(p.size || 'L');
    setEditUnit(p.unit || 'Pcs');
    setEditStatus(p.status);
    setResetCounterByAdmin(false);
    setEditError('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    const numProd = Number(editProdQty);
    const numOrder = Number(editOrderQty);

    if (isNaN(numProd) || numProd < 0) {
      setEditError(isBn ? 'অনুগ্রহ করে সঠিক উৎপাদিত সংখ্যা লিখুন।' : 'Please enter a valid produced quantity.');
      return;
    }
    if (isNaN(numOrder) || numOrder <= 0) {
      setEditError(isBn ? 'অনুগ্রহ করে সঠিক অর্ডারের সংখ্যা লিখুন।' : 'Please enter a valid order quantity.');
      return;
    }

    const prevEdits = editingRecord.editCount || 0;
    if (!isAdminOrHosting && prevEdits >= 5) {
      setEditError(isBn ? 'সর্বোচ্চ ৫ বার এডিট সম্পন্ন হয়েছে। আপনি আর পরিবর্তন করতে পারবেন না।' : 'Maximum 5 edits reached.');
      return;
    }

    const nextEditCount = isAdminOrHosting
      ? (resetCounterByAdmin ? 0 : prevEdits)
      : prevEdits + 1;

    const updated: ProductionRecord = {
      ...editingRecord,
      prodQty: numProd,
      orderQty: numOrder,
      size: editSize.trim() || editingRecord.size || 'L',
      length: editLength.trim(),
      unit: editUnit,
      status: editStatus,
      editCount: nextEditCount,
      lastEditedBy: currentUser.fullName,
      lastEditedAt: new Date().toISOString()
    };

    onUpdateProduction?.(updated);
    setEditingRecord(null);
  };

  const cardBg = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900';
  const inputBg = darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900';

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-600 text-white font-extrabold text-xs shadow-lg flex items-center justify-between gap-3 animate-fade-in no-print border-2 border-emerald-400">
          <span>{toastMsg}</span>
          <button 
            type="button" 
            onClick={() => setToastMsg('')} 
            className="text-white hover:text-emerald-200 text-xs font-bold px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Production Mode Tab Bar: Daily Entries vs Monthly Report ("মান্থলি কে কত করেছে") */}
      <div className={`border rounded-2xl p-2 sm:p-2.5 shadow-xs ${cardBg} no-print`}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setProductionSubTab('daily');
                onTabChange?.('daily');
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                productionSubTab === 'daily'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>{isBn ? '📋 দৈনিক এন্ট্রি ও তালিকা' : '📋 Daily Entries'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                productionSubTab === 'daily' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {productions.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setProductionSubTab('monthly');
                onTabChange?.('monthly');
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                productionSubTab === 'monthly'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-300" />
              <span>{isBn ? '📊 মাসিক কে কত করেছে (রিপোর্ট)' : '📊 Monthly Report (Who Produced)'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-400 text-slate-950 font-black">
                Monthly
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {productionSubTab === 'daily' && (
              <button
                onClick={() => setModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{t.newProductionEntry}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* View Switch: Monthly Report vs Daily Entries */}
      {productionSubTab === 'monthly' ? (
        <MonthlyProductionReport
          productions={productions}
          users={users}
          sections={sections}
          currentUser={currentUser}
          companyProfile={companyProfile}
          selectedMonth={selectedMonth || new Date().toISOString().substring(0, 7)}
          onSelectMonth={onSelectMonth || (() => {})}
          language={language}
          darkMode={darkMode}
          onOpenDailyEntries={() => {
            setProductionSubTab('daily');
            onTabChange?.('daily');
          }}
        />
      ) : (
        <>
          {/* Header & Controls */}
          <div className={`border rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${cardBg}`}>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">
                {t.productionTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t.productionSubtitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSizeModalOpen(true)}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-2xs"
              >
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>{t.manageSizes}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBulkModalOpen(true);
                  setBulkSummary(null);
                }}
                className="px-3.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-indigo-100 transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{t.bulkCsvImport}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProductionSubTab('monthly');
                  onTabChange?.('monthly');
                }}
                className="px-3.5 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-emerald-100 transition shadow-xs"
              >
                <BarChart3 className="w-4 h-4" />
                <span>{isBn ? '📊 মাসিক রিপোর্ট' : '📊 Monthly Report'}</span>
              </button>

              <button
                onClick={() => setModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{t.newProductionEntry}</span>
              </button>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className={`border rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 ${cardBg}`}>
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`${t.itemName}, ${t.buyer}...`}
            className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-indigo-500 ${inputBg}`}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {!isFullAdmin && employeeSection ? (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white shadow-xs flex items-center gap-1.5 whitespace-nowrap">
                <span>🏢 {isBn ? 'আপনার সেকশন:' : 'My Section:'}</span>
                <span className="underline decoration-indigo-300 font-black">{employeeSection}</span>
              </span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap hidden sm:inline">
                ({isBn ? 'শুধুমাত্র আপনার সেকশনের প্রোডাকশন হিসাব' : 'Only your section production'})
              </span>
            </div>
          ) : (
            <>
              <button
                onClick={() => setSelectedSection('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition cursor-pointer ${
                  selectedSection === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : darkMode
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t.allSections}
              </button>
              {sections.map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedSection(s)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition cursor-pointer ${
                    selectedSection === s
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : darkMode
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Production Content: Responsive Grid/Flexbox on Mobile, Multi-column Table on Desktop */}
      <div className={`border rounded-3xl overflow-hidden shadow-xs ${cardBg}`}>
        {/* Mobile View: Responsive CSS Grid / Flexbox Cards (Zero horizontal scroll, full mobile visibility) */}
        <div className="block md:hidden p-3 sm:p-4 space-y-3.5">
          {filteredProductions.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <p className="font-medium">{t.noProductionFound}</p>
              <button
                onClick={() => setModalOpen(true)}
                className="mt-2 text-indigo-600 font-bold underline cursor-pointer"
              >
                + {t.newProductionEntry}
              </button>
            </div>
          ) : (
            filteredProductions.map((p) => {
              const operator = users.find(u => u.id === p.userId) || currentUser;
              const pct = Math.min(100, Math.round((p.prodQty / Math.max(1, p.orderQty)) * 100));
              const editCount = p.editCount || 0;
              const isOwner = p.userId === currentUser.id;
              const isMySection = isFullAdmin || p.section === currentUser.section;
              const isQuotaAvailable = isFullAdmin || editCount < 5;
              const canEdit = isFullAdmin || (isOwner && isMySection && isQuotaAvailable);
              const canDelete = isFullAdmin || (isOwner && isMySection);

              return (
                <div
                  key={p.id}
                  className={`border rounded-2xl p-3.5 space-y-3 transition shadow-2xs ${
                    darkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50/80 border-slate-200'
                  }`}
                >
                  {/* Card Header: Item Name, Section & Status */}
                  <div className="flex items-start justify-between gap-2 border-b pb-2.5 border-slate-200/80 dark:border-slate-700/80">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                        {p.itemName}
                      </h4>
                      <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 mt-0.5">
                        <span>{p.section}</span>
                        {p.length && <span>· {p.length}</span>}
                      </div>
                    </div>

                    <span className="shrink-0">
                      {p.status === 'Completed' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{t.completed}</span>
                        </span>
                      )}
                      {p.status === 'Running' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{t.running}</span>
                        </span>
                      )}
                      {p.status === 'Delayed' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>{t.delayed}</span>
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Operator & Buyer Info */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <UserProfileBadge user={operator} size="sm" showJoiningDate={false} darkMode={darkMode} language={language} />
                    <div className="text-right text-[11px] min-w-0">
                      <span className="font-bold text-slate-700 dark:text-slate-300 truncate block">{p.buyer}</span>
                      <span className="text-[10px] text-slate-400 truncate block">{p.company}</span>
                    </div>
                  </div>

                  {/* Production Metrics Grid (2 columns: Target vs Produced) */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">{t.orderQuantity}</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-200 text-sm">
                        {p.orderQty.toLocaleString()} {p.unit}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">{t.producedQuantity}</span>
                      <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        {p.prodQty.toLocaleString()} {p.unit}
                      </span>
                    </div>
                  </div>

                  {/* Completion Rate & Date Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono font-semibold">
                      <span className="text-slate-500">{t.completionRate}: <strong className="text-indigo-600 dark:text-indigo-400">{pct}%</strong></span>
                      <span className="text-slate-400">{p.date}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-indigo-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                    <div className="text-[10px] font-mono text-slate-400">
                      {p.lastEditedAt ? (
                        <span>{isBn ? 'এডিট' : 'Edit'}: {editCount}/5</span>
                      ) : (
                        <span>ID: {p.id.slice(-6)}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {canEdit ? (
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs ${
                            isFullAdmin
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300'
                          }`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{isBn ? 'এডিট' : 'Edit'}</span>
                          <span className="text-[10px] font-mono font-bold opacity-80">
                            ({5 - editCount})
                          </span>
                        </button>
                      ) : (
                        <div className="px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-semibold flex items-center gap-1">
                          <span>🔒</span>
                          <span className="text-[10px]">{isBn ? 'লক' : 'Locked'}</span>
                        </div>
                      )}

                      {canDelete && onDeleteProduction && (
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteProduction(p.id);
                            setToastMsg(isBn ? `✓ "${p.itemName}" মুছে ফেলা হয়েছে।` : `Deleted "${p.itemName}".`);
                            setTimeout(() => setToastMsg(''), 3500);
                          }}
                          className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-500 hover:text-rose-700 cursor-pointer transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Multi-column Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-extrabold uppercase tracking-wider">
                <th className="p-4">{t.itemName} & {t.section}</th>
                <th className="p-4">{t.buyer}</th>
                <th className="p-4">{t.lineOperator}</th>
                <th className="p-4 text-right">{t.orderQuantity}</th>
                <th className="p-4 text-right">{t.producedQuantity}</th>
                <th className="p-4 w-44">{t.completionRate}</th>
                <th className="p-4 text-center">{t.status}</th>
                <th className="p-4 text-center whitespace-nowrap">{isBn ? 'অ্যাকশন / এডিট' : 'Action / Edit'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredProductions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <p className="font-medium">{t.noProductionFound}</p>
                    <button
                      onClick={() => setModalOpen(true)}
                      className="mt-2 text-indigo-600 font-bold underline cursor-pointer"
                    >
                      + {t.newProductionEntry}
                    </button>
                  </td>
                </tr>
              ) : (
                filteredProductions.map((p) => {
                  const operator = users.find(u => u.id === p.userId) || currentUser;
                  const pct = Math.min(100, Math.round((p.prodQty / Math.max(1, p.orderQty)) * 100));
                  const editCount = p.editCount || 0;
                  const isOwner = p.userId === currentUser.id;
                  const isMySection = isFullAdmin || p.section === currentUser.section;
                  const isQuotaAvailable = isFullAdmin || editCount < 5;
                  const canEdit = isFullAdmin || (isOwner && isMySection && isQuotaAvailable);
                  const canDelete = isFullAdmin || (isOwner && isMySection);

                  return (
                    <tr 
                      key={p.id}
                      className={`transition-colors ${
                        darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="p-4">
                        <div className="font-extrabold text-sm">{p.itemName}</div>
                        <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                          {p.section} Section {p.length ? `· ${p.length}` : ''}
                        </div>
                        {p.lastEditedAt && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {isBn ? 'সর্বশেষ এডিট' : 'Edited'}: {p.lastEditedBy || 'User'} ({editCount}/5)
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{p.buyer}</span>
                        <div className="text-[10px] text-slate-400">{p.company}</div>
                      </td>

                      <td className="p-4">
                        <UserProfileBadge user={operator} size="sm" showJoiningDate={false} darkMode={darkMode} language={language} />
                      </td>

                      <td className="p-4 text-right font-mono font-bold tabular-nums">
                        {p.orderQty.toLocaleString()} {p.unit}
                      </td>

                      <td className="p-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {p.prodQty.toLocaleString()} {p.unit}
                      </td>

                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono font-semibold">
                            <span>{pct}%</span>
                            <span className="text-slate-400">{p.date}</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${
                                pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-indigo-600' : 'bg-amber-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 font-semibold text-[11px]">
                          {p.status === 'Completed' && (
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{t.completed}</span>
                            </span>
                          )}
                          {p.status === 'Running' && (
                            <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{t.running}</span>
                            </span>
                          )}
                          {p.status === 'Delayed' && (
                            <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>{t.delayed}</span>
                            </span>
                          )}
                        </span>
                      </td>

                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {canEdit ? (
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
                                isFullAdmin
                                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300'
                              }`}
                              title={isFullAdmin ? 'অ্যাডমিন এডিট (আনলিমিটেড)' : `এডিট করুন (আর ${5 - editCount} বার পরিবর্তন করা যাবে)`}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>{isBn ? 'এডিট' : 'Edit'}</span>
                              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                isFullAdmin
                                  ? 'bg-indigo-200 dark:bg-indigo-900/80 text-indigo-800 dark:text-indigo-200'
                                  : editCount >= 4
                                    ? 'bg-rose-200 text-rose-800 dark:bg-rose-900/80 dark:text-rose-200'
                                    : 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-200'
                              }`}>
                                {isFullAdmin ? `ADM (${editCount}/5)` : `${5 - editCount} বার বাকি`}
                              </span>
                            </button>
                          ) : !isOwner && !isFullAdmin ? (
                            <div 
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-400 text-xs font-semibold flex items-center gap-1 select-none"
                              title={isBn ? 'এই রেকর্ডটি অন্য কর্মী এন্ট্রি করেছেন। শুধু অ্যাডমিন বা এন্ট্রিদাতা এডিট করতে পারবেন।' : 'Entered by another user. View only.'}
                            >
                              <span className="text-amber-500">🔒</span>
                              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{isBn ? 'অন্যের এন্ট্রি' : 'View Only'}</span>
                            </div>
                          ) : !isMySection && !isFullAdmin ? (
                            <div 
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-400 text-xs font-semibold flex items-center gap-1 select-none"
                              title={isBn ? `এটি অন্য সেকশনের রেকর্ড। আপনি শুধুমাত্র ${currentUser.section} সেকশন এডিট করতে পারবেন।` : 'Other section record. Locked.'}
                            >
                              <span className="text-amber-500">🔒</span>
                              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{p.section}</span>
                            </div>
                          ) : (
                            <div 
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-500 text-xs font-bold flex items-center gap-1.5 cursor-not-allowed select-none"
                              title={isBn ? 'সর্বোচ্চ ৫ বার পরিবর্তনের সীমা পূর্ণ হয়েছে।' : 'Maximum 5 edits reached. Only an admin can edit.'}
                            >
                              <span className="text-amber-500">🔒</span>
                              <span className="line-through">{isBn ? 'লক' : 'Locked'}</span>
                              <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-1 rounded">
                                {isBn ? '৫/৫ শেষ' : '5/5 used'}
                              </span>
                            </div>
                          )}

                          {canDelete && onDeleteProduction && (
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteProduction(p.id);
                                setToastMsg(isBn ? `✓ "${p.itemName}" রেকর্ডটি সফলভাবে মুছে ফেলা হয়েছে।` : `Deleted production record "${p.itemName}".`);
                                setTimeout(() => setToastMsg(''), 3500);
                              }}
                              className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 hover:text-rose-700 cursor-pointer transition active:scale-90"
                              title={isBn ? 'ডিলিট করুন' : 'Delete'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
      </>
      )}

      {/* New Production Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`border rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 ${cardBg}`}>
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="font-extrabold text-base">{t.newProductionEntry}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {t.itemName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g. Metal Zipper #5"
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {t.buyer} *
                  </label>
                  <input
                    type="text"
                    required
                    value={buyer}
                    onChange={(e) => setBuyer(e.target.value)}
                    placeholder="e.g. H&M / Zara"
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {t.section} *
                  </label>
                  {!isFullAdmin ? (
                    <div className="p-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/40 text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 truncate">
                        <span>🔒</span>
                        <span>{currentUser.section || sections[0] || 'Sewing'}</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-normal shrink-0">
                        ({isBn ? 'নির্ধারিত' : 'Assigned'})
                      </span>
                    </div>
                  ) : (
                    <select
                      value={formSection}
                      onChange={(e) => setFormSection(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 ${inputBg}`}
                    >
                      {sections.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {t.companyName}
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Apex Apparel Ltd."
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {t.orderQuantity} *
                  </label>
                  <input
                    type="number"
                    required
                    value={orderQty}
                    onChange={(e) => setOrderQty(e.target.value)}
                    placeholder="5000"
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 font-mono ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {t.producedQuantity} *
                  </label>
                  <input
                    type="number"
                    required
                    value={prodQty}
                    onChange={(e) => setProdQty(e.target.value)}
                    placeholder="1850"
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 font-mono ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {t.unit}
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  >
                    <option value="Pcs">Pcs</option>
                    <option value="Doz">Doz</option>
                    <option value="Gross">Gross</option>
                    <option value="Yards">Yards</option>
                  </select>
                </div>
              </div>

              {/* Flexible Size Selection & Manual Input System */}
              <div className="p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      {t.size} & {isBn ? 'ম্যানুয়াল ইনপুট (XS, S, M, L, XL, XXL ইত্যাদি):' : 'Manual Size Input:'}
                    </span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/50">
                      {isBn ? 'কাস্টম সাইজ সক্রিয়' : 'Custom Sizes Enabled'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMultiSizeMode(!multiSizeMode)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition cursor-pointer flex items-center gap-1 ${
                      multiSizeMode
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 hover:border-indigo-400'
                    }`}
                  >
                    <span>⚡</span>
                    <span>{isBn ? 'মাল্টি-সাইজ কোয়ান্টিটি ইনপুট' : 'Multi-Size Breakdown'}</span>
                  </button>
                </div>

                {/* Quick Selectable Size Chips / Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                    {isBn ? 'সাইজ বাছাই:' : 'Select:'}
                  </span>
                  {activeSizes.map((sz: ProductionSize) => {
                    const isSelected = manualSizeInput.trim().toUpperCase() === sz.name.toUpperCase();
                    return (
                      <button
                        key={sz.id}
                        type="button"
                        onClick={() => {
                          setSelectedSize(sz.name);
                          setManualSizeInput(sz.name);
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-2xs scale-105'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                        }`}
                      >
                        {sz.name}
                      </button>
                    );
                  })}
                </div>

                {/* Manual Size Input Field with Instant "+ Save to list" button */}
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualSizeInput}
                      onChange={(e) => {
                        setManualSizeInput(e.target.value);
                        setSelectedSize(e.target.value);
                      }}
                      placeholder={isBn ? 'সাইজ নাম লিখুন (যেমন: XS, S, M, L, XL, XXL, 3XL, 34, 36, 5# ইত্যাদি)...' : 'Type any custom size (e.g. XS, S, M, L, XL, XXL, 38, 5#)...'}
                      className={`flex-1 px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none focus:border-indigo-600 ${inputBg}`}
                    />
                    {manualSizeInput.trim() && !sizeList.some(s => s.name.toUpperCase() === manualSizeInput.trim().toUpperCase()) && (
                      <button
                        type="button"
                        onClick={() => handleSaveQuickCustomSize(manualSizeInput)}
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0 transition shadow-2xs"
                        title="Save as permanent size option for future entries"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isBn ? `তালিকায় "${manualSizeInput.toUpperCase()}" সেভ করুন` : `Save "${manualSizeInput.toUpperCase()}"`}</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {isBn 
                      ? '💡 এখানে আপনি যেকোনো নতুন সাইজ টাইপ করতে পারেন। প্রয়োজনে সাইজ বাড়াতে বা পরিবর্তন করতে সরাসরি লিখুন।' 
                      : '💡 You can type any custom size name directly. It will be recorded with this production entry.'}
                  </p>
                </div>

                {/* Multi-Size Matrix Breakdown Mode */}
                {multiSizeMode && (
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                        <span>🔢</span>
                        <span>{isBn ? 'সাইজ অনুযায়ী উৎপাদিত পিস লিখুন (অটো যোগফল হবে):' : 'Enter Pieces Produced per Size (Auto-Summed):'}</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        Total: {prodQty || '0'} {unit}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {Object.keys(sizeQuantities).map((szKey) => (
                        <div key={szKey} className="space-y-0.5">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                            {szKey}
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={sizeQuantities[szKey] || ''}
                            onChange={(e) => handleSizeQtyChange(szKey, e.target.value)}
                            placeholder="0"
                            className={`w-full p-1.5 text-center rounded-lg border text-xs font-mono font-bold focus:outline-none focus:border-indigo-600 ${inputBg}`}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Add another size column */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <input
                        type="text"
                        value={customBreakdownInput}
                        onChange={(e) => setCustomBreakdownInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddBreakdownSize();
                          }
                        }}
                        placeholder={isBn ? 'আরও সাইজ বাড়ান (যেমন: 3XL, 4XL, 36...)' : 'Add another size (e.g. 3XL, 38)...'}
                        className={`flex-1 px-2.5 py-1 rounded-lg border text-xs ${inputBg}`}
                      />
                      <button
                        type="button"
                        onClick={handleAddBreakdownSize}
                        className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold hover:bg-indigo-100 cursor-pointer transition shrink-0"
                      >
                        + {isBn ? 'সাইজ কলাম যুক্ত করুন' : 'Add Size Column'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    Specification / Length
                  </label>
                  <input
                    type="text"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    placeholder="e.g. 24 Inch"
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-hidden ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {t.status}
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'Running' | 'Completed' | 'Delayed')}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-hidden ${inputBg}`}
                  >
                    <option value="Running">{t.running}</option>
                    <option value="Completed">{t.completed}</option>
                    <option value="Delayed">{t.delayed}</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold cursor-pointer shadow-sm transition"
                >
                  {t.saveProduction}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Production Record Modal (With 5-Edit Maximum Quota Tracker) */}
      {editingRecord && (
        <div 
          onClick={() => setEditingRecord(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`border rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 cursor-default ${cardBg}`}
          >
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">
                    {isBn ? 'প্রোডাকশন হিস্টোরি পরিবর্তন / এডিট' : 'Edit Production Record'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {editingRecord.itemName} · {editingRecord.section} Section
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingRecord(null)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            {/* Quota Progress Banner */}
            <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <span>📊 {isBn ? 'এডিট ব্যবহারের সীমা:' : 'Edit Quota:'}</span>
                  <span className="font-mono font-extrabold text-indigo-700 dark:text-indigo-300">
                    {editingRecord.editCount || 0}/5 {isBn ? 'বার ব্যবহৃত' : 'used'}
                  </span>
                </span>
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  isAdminOrHosting 
                    ? 'bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200' 
                    : (editingRecord.editCount || 0) >= 4 
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200' 
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                }`}>
                  {isAdminOrHosting 
                    ? (isBn ? 'অ্যাডমিন (আনলিমিটেড)' : 'Admin Unlimited')
                    : isBn 
                      ? `বাকি ${Math.max(0, 5 - (editingRecord.editCount || 0))} বার` 
                      : `${Math.max(0, 5 - (editingRecord.editCount || 0))} left`}
                </span>
              </div>

              {/* 5-Step visual indicator */}
              <div className="grid grid-cols-5 gap-1.5 pt-1">
                {[1, 2, 3, 4, 5].map((step) => {
                  const used = (editingRecord.editCount || 0) >= step;
                  return (
                    <div 
                      key={step} 
                      className={`h-2 rounded-full transition-all ${
                        used ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  );
                })}
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                {isAdminOrHosting 
                  ? (isBn ? '🛡️ অ্যাডমিন হিসেবে আপনি যতবার ইচ্ছা পরিবর্তন করতে পারবেন।' : '🛡️ As an admin, you have unlimited editing rights.')
                  : (isBn 
                      ? `⚠️ একজন কর্মী সর্বোচ্চ ৫ বার প্রোডাকশন রেকর্ড পরিবর্তন করতে পারেন। ৫ বার শেষ হলে আর কোনো পরিবর্তন করা যাবে না (শুধুমাত্র অ্যাডমিন পারবেন)।`
                      : `⚠️ Workers may edit each record up to 5 times. Afterward, only an admin can edit.`)}
              </p>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                ⚠️ {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {t.orderQuantity} *
                  </label>
                  <input
                    type="number"
                    required
                    value={editOrderQty}
                    onChange={(e) => setEditOrderQty(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 font-mono font-bold ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {t.producedQuantity} *
                  </label>
                  <input
                    type="number"
                    required
                    value={editProdQty}
                    onChange={(e) => setEditProdQty(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 font-mono font-bold ${inputBg}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {t.unit}
                  </label>
                  <select
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 font-bold ${inputBg}`}
                  >
                    <option value="Pcs">Pcs</option>
                    <option value="Gross">Gross</option>
                    <option value="Doz">Doz</option>
                    <option value="Yards">Yards</option>
                    <option value="Meters">Meters</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    Specification / Length
                  </label>
                  <input
                    type="text"
                    value={editLength}
                    onChange={(e) => setEditLength(e.target.value)}
                    placeholder="e.g. 24 Inch"
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  />
                </div>
              </div>

              {/* Edit Size Field with Quick Chips & Manual Input */}
              <div className="p-3 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-700 dark:text-slate-300">
                    {t.size} (XS, S, M, L, XL, XXL ইত্যাদি):
                  </label>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                    Current: {editSize || 'L'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {activeSizes.map((sz) => {
                    const isSelected = editSize.trim().toUpperCase() === sz.name.toUpperCase();
                    return (
                      <button
                        key={sz.id}
                        type="button"
                        onClick={() => setEditSize(sz.name)}
                        className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                        }`}
                      >
                        {sz.name}
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  value={editSize}
                  onChange={(e) => setEditSize(e.target.value)}
                  placeholder="e.g. XS, S, M, L, XL, 38, Custom..."
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs font-bold focus:outline-none focus:border-indigo-600 ${inputBg}`}
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                  {t.status}
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'Running' | 'Completed' | 'Delayed')}
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 font-bold ${inputBg}`}
                >
                  <option value="Running">{t.running}</option>
                  <option value="Completed">{t.completed}</option>
                  <option value="Delayed">{t.delayed}</option>
                </select>
              </div>

              {/* Admin Special Control: Reset Worker's Counter */}
              {isAdminOrHosting && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={resetCounterByAdmin}
                      onChange={(e) => setResetCounterByAdmin(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                      {isBn ? 'কর্মীর এডিট কাউন্টার ০-এ রিসেট করুন (Reset edit quota to 0)' : 'Reset edit counter back to 0'}
                    </span>
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold cursor-pointer shadow-sm transition"
                >
                  {isBn ? 'পরিবর্তন সেভ করুন' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SIZE MANAGEMENT MODAL */}
      {sizeModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSizeModalOpen(false)}
        >
          <div 
            className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 overflow-hidden transition-all ${cardBg}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold">
                  {t.manageSizes}
                </h3>
              </div>
              <button onClick={() => setSizeModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              {/* Add Custom Size Form */}
              <form onSubmit={handleAddCustomSize} className="flex gap-2">
                <input
                  type="text"
                  value={newSizeName}
                  onChange={(e) => setNewSizeName(e.target.value)}
                  placeholder={isBn ? 'নতুন সাইজের নাম (যেমন: 5XL, 32W, FREE)' : 'New size (e.g. 5XL, 32W, Free)'}
                  className={`flex-1 p-2 rounded-xl border font-bold uppercase ${inputBg}`}
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                >
                  + {isBn ? 'যোগ করুন' : 'Add'}
                </button>
              </form>

              {/* Sizes List */}
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  {isBn ? 'বিদ্যমান সাইজ তালিকা (সক্রিয়/নিষ্ক্রিয় করুন):' : 'Available Sizes (Toggle to activate/deactivate):'}
                </span>
                {sizeList.map(sz => (
                  <div 
                    key={sz.id}
                    className="flex items-center justify-between p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40"
                  >
                    <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                      {sz.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleSize(sz.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition ${
                        sz.isActive
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {sz.isActive ? (isBn ? 'সক্রিয় (Active)' : 'Active') : (isBn ? 'নিষ্ক্রিয় (Inactive)' : 'Inactive')}
                    </button>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-slate-400 italic">
                {isBn ? 'কোন সাইজ নিষ্ক্রিয় করলেও পূর্ববর্তী তৈরি করা রেকর্ড মুছে যাবে না।' : 'Deactivating a size will not remove historical production records.'}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSizeModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs cursor-pointer"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK PRODUCTION CSV IMPORT MODAL */}
      {bulkModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setBulkModalOpen(false)}
        >
          <div 
            className={`w-full max-w-3xl rounded-2xl border shadow-2xl p-6 overflow-hidden transition-all max-h-[90vh] flex flex-col ${cardBg}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold">
                  {t.bulkCsvImport}
                </h3>
              </div>
              <button onClick={() => setBulkModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <div className="py-4 space-y-4 flex-1 overflow-y-auto text-xs">
              {/* Format selection */}
              <div className="flex items-center gap-4 p-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
                <span className="font-bold text-slate-700 dark:text-slate-300">Format:</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="bulkFormat"
                    checked={bulkFormat === 'auto'}
                    onChange={() => {
                      setBulkFormat('auto');
                      if (csvText) parseProductionCsv(csvText);
                    }}
                  />
                  <span>Auto-detect</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="bulkFormat"
                    checked={bulkFormat === 'matrix'}
                    onChange={() => {
                      setBulkFormat('matrix');
                      if (csvText) parseProductionCsv(csvText);
                    }}
                  />
                  <span>Wide Size-Matrix (XS, S, M, L...)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="bulkFormat"
                    checked={bulkFormat === 'row'}
                    onChange={() => {
                      setBulkFormat('row');
                      if (csvText) parseProductionCsv(csvText);
                    }}
                  />
                  <span>Row-based</span>
                </label>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1 text-[11px]">
                <p className="font-bold text-slate-700 dark:text-slate-200">
                  {bulkFormat === 'matrix' ? 'Matrix Format Example:' : 'Row Format Example:'}
                </p>
                <code className="text-indigo-600 dark:text-indigo-400 font-mono block break-all">
                  {bulkFormat === 'matrix' 
                    ? 'employee_id, product, date, XS, S, M, L, XL, XXL, 3XL, 4XL' 
                    : 'employee_id, product, date, size, quantity, notes'}
                </code>
              </div>

              {/* Upload or Paste */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-600 dark:text-slate-300">
                    {isBn ? 'CSV ফাইল আপলোড' : 'Upload CSV File'}
                  </label>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    ref={bulkFileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setCsvFileName(file.name);
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        const content = evt.target?.result as string;
                        setCsvText(content);
                        parseProductionCsv(content);
                      };
                      reader.readAsText(file);
                    }}
                    className="w-full text-xs file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white cursor-pointer"
                  />
                  {csvFileName && (
                    <span className="text-[11px] text-emerald-600 font-bold block mt-1">
                      ✓ {csvFileName}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-600 dark:text-slate-300">
                    {isBn ? 'অথবা CSV পেস্ট করুন' : 'Or Paste CSV Content'}
                  </label>
                  <textarea
                    rows={3}
                    value={csvText}
                    onChange={(e) => {
                      setCsvText(e.target.value);
                      parseProductionCsv(e.target.value);
                    }}
                    placeholder="CAF-301, Metal Zipper #5, 2026-10-18, L, 500, Batch run"
                    className={`w-full p-2.5 rounded-xl border font-mono text-xs ${inputBg}`}
                  />
                </div>
              </div>

              {/* Parsed Preview Table */}
              {parsedRows.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {isBn ? `তৈরি হবে মোট ${parsedRows.length} টি প্রোডাকশন এন্ট্রি:` : `Generated ${parsedRows.length} Production Entries:`}
                    </span>
                    <span className="text-emerald-600 font-bold text-[11px]">
                      ✓ {parsedRows.filter(r => r.isValid).length} Valid
                    </span>
                  </div>

                  <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 sticky top-0">
                        <tr>
                          <th className="p-2">Row</th>
                          <th className="p-2">Worker</th>
                          <th className="p-2">Product</th>
                          <th className="p-2">Date</th>
                          <th className="p-2">Size</th>
                          <th className="p-2 text-right">Quantity</th>
                          <th className="p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {parsedRows.map((r, i) => (
                          <tr key={i} className={!r.isValid ? 'bg-rose-50/50 dark:bg-rose-950/20' : ''}>
                            <td className="p-2 font-mono">{r.rowNum}</td>
                            <td className="p-2 font-bold">{r.empName} ({r.empId})</td>
                            <td className="p-2">{r.product}</td>
                            <td className="p-2 font-mono">{r.date}</td>
                            <td className="p-2 font-bold text-indigo-600">{r.size}</td>
                            <td className="p-2 font-mono font-bold text-right">{r.quantity}</td>
                            <td className="p-2">
                              {r.isValid ? (
                                <span className="text-emerald-600 font-bold">✓ Valid</span>
                              ) : (
                                <span className="text-rose-600 font-semibold">{r.error}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Summary */}
              {bulkSummary && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl font-bold flex items-center justify-between text-emerald-800 dark:text-emerald-300">
                  <span>
                    ✓ {isBn ? `সফলভাবে ${bulkSummary.imported} টি এন্ট্রি ইমপোর্ট হয়েছে` : `Successfully imported ${bulkSummary.imported} entries`}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setBulkModalOpen(false)}
                className="px-4 py-2 font-bold text-slate-500 hover:text-slate-700"
              >
                {t.close}
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkProductionImport}
                disabled={parsedRows.filter(r => r.isValid).length === 0}
                className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold cursor-pointer shadow-xs transition"
              >
                {isBn ? `বৈধ ${parsedRows.filter(r => r.isValid).length} টি এন্ট্রি সেভ করুন` : `Import ${parsedRows.filter(r => r.isValid).length} Records`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
