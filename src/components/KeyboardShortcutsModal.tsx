import React, { useEffect } from 'react';
import { Language } from '../types';
import { translations } from '../i18n';
import { Keyboard, X, Command, Sparkles } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  darkMode: boolean;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  language,
  darkMode
}) => {
  const isBn = language === 'bn';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcutGroups = [
    {
      titleEn: 'General & Spotlight',
      titleBn: 'সাধারণ ও সার্চ কমান্ড',
      shortcuts: [
        { keys: ['Ctrl', 'K'], descEn: 'Open Universal Search / Command Palette', descBn: 'সার্বজনীন সার্চ ও কমান্ড প্যালেট খুলুন' },
        { keys: ['?'], descEn: 'Toggle Keyboard Shortcuts Cheat Sheet', descBn: 'কীবোর্ড শর্টকাট সহায়িকা প্রদর্শন' },
        { keys: ['Esc'], descEn: 'Close active modal / dialog', descBn: 'বর্তমান ডায়ালগ বা পপআপ বন্ধ করুন' }
      ]
    },
    {
      titleEn: 'Module Navigation (Shift + Key)',
      titleBn: 'দ্রুত মডিউল নেভিগেশন (Shift + Key)',
      shortcuts: [
        { keys: ['Shift', 'D'], descEn: 'Go to Dashboard', descBn: 'ড্যাশবোর্ডে যান' },
        { keys: ['Shift', 'P'], descEn: 'Daily Production Tracker', descBn: 'দৈনিক প্রোডাকশন খাতা' },
        { keys: ['Shift', 'M'], descEn: 'Monthly Production Summary', descBn: 'মাসিক প্রোডাকশন রিপোর্ট' },
        { keys: ['Shift', 'A'], descEn: 'Employee Attendance & Punch', descBn: 'হাজিরা খাতা ও পাঞ্চ' },
        { keys: ['Shift', 'L'], descEn: 'Leave Management & Approvals', descBn: 'ছুটি ব্যবস্থাপনা ও অনুমোদন' },
        { keys: ['Shift', 'O'], descEn: 'Overtime & Duty Records', descBn: 'ওভারটাইম ও ডিউটি রেকর্ড' },
        { keys: ['Shift', 'S'], descEn: 'Payroll & Salary Sheets', descBn: 'বেতন ও পে-রোল শীট' },
        { keys: ['Shift', 'E'], descEn: 'Bills, Vouchers & Purchases', descBn: 'বিল, ভাউচার ও ফ্যাক্টরি খরচ' },
        { keys: ['Shift', 'C'], descEn: 'Bangladesh Holiday Calendar', descBn: 'সরকারি ছুটির ক্যালেন্ডার' },
        { keys: ['Shift', 'R'], descEn: 'Product Requisitions & Stock', descBn: 'মালামাল রিকুইজিশন ও স্টক এলার্ট' }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className={`w-full max-w-lg rounded-3xl border shadow-2xl p-6 space-y-5 ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-indigo-500/10 text-indigo-500">
              <Keyboard className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-black text-base">
                {isBn ? 'কীবোর্ড শর্টকাট সহায়িকা' : 'Keyboard Shortcuts'}
              </h3>
              <p className="text-xs text-slate-400">
                {isBn ? 'সিস্টেমের যেকোনো স্থান থেকে দ্রুত কাজ করুন' : 'Work faster across factory modules with shortcuts'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {shortcutGroups.map((group, idx) => (
            <div key={idx} className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {isBn ? group.titleBn : group.titleEn}
              </span>
              <div className="space-y-1.5">
                {group.shortcuts.map((sc, sidx) => (
                  <div 
                    key={sidx}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                      darkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      {isBn ? sc.descBn : sc.descEn}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {sc.keys.map((k, kidx) => (
                        <kbd 
                          key={kidx}
                          className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-2xs text-slate-800 dark:text-slate-100"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-sm"
          >
            {isBn ? 'ঠিক আছে' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
};
