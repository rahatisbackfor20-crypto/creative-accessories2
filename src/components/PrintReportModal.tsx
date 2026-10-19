import React, { useState, useEffect } from 'react';
import { TabType, CompanyProfile, Language } from '../types';
import { translations } from '../i18n';
import { Printer, Copy, Check, X, Info } from 'lucide-react';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: TabType;
  companyProfile: CompanyProfile;
  language: Language;
  darkMode: boolean;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  currentTab,
  companyProfile,
  language,
  darkMode
}) => {
  const [copied, setCopied] = useState(false);
  const [printStatus, setPrintStatus] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const t = translations[language];
  const isBn = language === 'bn';

  const getTabTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return isBn ? 'ফ্যাক্টরি ড্যাশবোর্ড ও নোটিশ বোর্ড রিপোর্ট' : 'Factory Dashboard & Notice Summary';
      case 'production':
        return isBn ? 'দৈনিক ও মাসিক উৎপাদন অর্ডার রিপোর্ট' : 'Daily & Monthly Production Orders Report';
      case 'attendance':
        return isBn ? 'ডিজিটাল উপস্থিতি ও শিফট হাজিরা রিপোর্ট' : 'Digital Attendance & Shift Report';
      case 'overtime':
        return isBn ? 'ওভারটাইম ও অতিরিক্ত কাজের মজুরি হিসাব' : 'Overtime & Additional Hours Pay Sheet';
      case 'payroll':
        return isBn ? 'মাসিক পে-রোল ও পে-স্লিপ সমন্বিত হিসাব' : 'Monthly Payroll & Pay-Slips Sheet';
      case 'admin_panel':
        return isBn ? 'অ্যাডমিন ফ্যাক্টরি কনসোল রিপোর্ট' : 'Admin Factory Console Report';
      default:
        return companyProfile.name;
    }
  };

  const handleExecutePrint = () => {
    setPrintStatus(isBn ? 'প্রিন্ট ডায়ালগ খোলা হচ্ছে...' : 'Opening print dialog...');
    try {
      window.print();
    } catch (err) {
      console.warn('Window.print failed:', err);
      setPrintStatus(isBn ? 'কীবোর্ডের Ctrl + P চেপে প্রিন্ট করুন' : 'Press Ctrl + P on your keyboard to print');
    }
    setTimeout(() => setPrintStatus(''), 4000);
  };

  const handleCopySummary = () => {
    const summaryText = `=====================================\n` +
      `${companyProfile.name}\n` +
      `Registration: ${companyProfile.factoryRegNo}\n` +
      `Report: ${getTabTitle()}\n` +
      `Date: ${new Date().toLocaleDateString('en-GB')}\n` +
      `Contact: ${companyProfile.contactNumber} | ${companyProfile.email}\n` +
      `Address: ${companyProfile.address}\n` +
      `=====================================`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const modalBg = darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900';

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer no-print animate-fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`border-2 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-5 cursor-default ${modalBg}`}
      >
        {/* Top colored accent stripe */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-600 via-blue-600 to-emerald-600 rounded-t-3xl" />

        {/* Header */}
        <div className="flex justify-between items-start pt-1 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">
                {isBn ? 'রিপোর্ট প্রিন্ট ও এক্সপোর্ট কন্ট্রোল' : 'Print & Report Export'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {getTabTitle()}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Company and Document Meta Info Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
          <div className="flex justify-between items-center font-bold">
            <span className="text-slate-500 dark:text-slate-400">{isBn ? 'কারখানার নাম:' : 'Factory:'}</span>
            <span className="font-black text-indigo-600 dark:text-indigo-400">{companyProfile.name}</span>
          </div>
          <div className="flex justify-between items-center font-bold border-t border-slate-200/60 dark:border-slate-800/60 pt-1.5">
            <span className="text-slate-500 dark:text-slate-400">{isBn ? 'রেজিস্ট্রেশন নং:' : 'Reg No:'}</span>
            <span className="font-mono">{companyProfile.factoryRegNo}</span>
          </div>
          <div className="flex justify-between items-center font-bold border-t border-slate-200/60 dark:border-slate-800/60 pt-1.5">
            <span className="text-slate-500 dark:text-slate-400">{isBn ? 'তারিখ ও সময়:' : 'Generated Date:'}</span>
            <span className="font-mono">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
          <div className="flex justify-between items-center font-bold border-t border-slate-200/60 dark:border-slate-800/60 pt-1.5">
            <span className="text-slate-500 dark:text-slate-400">{isBn ? 'বর্তমান ভিউ:' : 'Active View:'}</span>
            <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 uppercase font-mono text-[10px]">
              {currentTab}
            </span>
          </div>
        </div>

        {/* Status notice */}
        {printStatus && (
          <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs font-bold flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{printStatus}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* 1. Main Direct Print Button */}
          <button
            type="button"
            onClick={handleExecutePrint}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <Printer className="w-4 h-4" />
            <span>{isBn ? '🖨️ এখনই প্রিন্ট দিন / PDF সেভ করুন' : 'Print Now / Save PDF'}</span>
          </button>

          {/* 2. Copy Report Summary */}
          <button
            type="button"
            onClick={handleCopySummary}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer border border-slate-300 dark:border-slate-700"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                <span className="text-emerald-600 dark:text-emerald-400 font-black">{isBn ? 'কপি সম্পন্ন হয়েছে ✓' : 'Copied ✓'}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>{isBn ? '📋 রিপোর্ট টেক্সট কপি করুন' : 'Copy Report Summary'}</span>
              </>
            )}
          </button>
        </div>

        {/* Helpful instructions footer */}
        <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
          <p className="font-bold flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>{isBn ? 'আইফ্রেম প্রিন্ট সহায়তা টিপস:' : 'Print Shortcut:'}</span>
          </p>
          <p>
            {isBn 
              ? 'ব্রাউজার বা আইফ্রেমের কারণে প্রিন্ট ডায়ালগ স্বয়ংক্রিয় না আসলে সরাসরি আপনার কীবোর্ডের Ctrl + P (ম্যাকে Cmd + P) চাপুন।' 
              : 'If your browser blocks the print dialog inside the preview frame, simply press Ctrl + P (Cmd + P on Mac).'}
          </p>
        </div>
      </div>
    </div>
  );
};
