import React, { useState } from 'react';
import { OvertimeRecord, User, Language } from '../types';
import { translations } from '../i18n';
import { UserProfileBadge } from './UserProfileBadge';
import { Plus, Clock, DollarSign, CheckCircle, Search, Trash2, Calendar } from 'lucide-react';

interface OvertimeViewProps {
  overtime: OvertimeRecord[];
  users: User[];
  currentUser: User;
  language: Language;
  darkMode: boolean;
  onAddOvertime: (record: Omit<OvertimeRecord, 'id'>) => void;
  onUpdateStatus?: (id: string, status: 'Approved' | 'Pending' | 'Rejected') => void;
  onDeleteOvertime?: (id: string) => void;
}

export const OvertimeView: React.FC<OvertimeViewProps> = ({
  overtime,
  users,
  currentUser,
  language,
  darkMode,
  onAddOvertime,
  onUpdateStatus,
  onDeleteOvertime
}) => {
  const t = translations[language];
  const isBn = language === 'bn';
  const isFullAdmin = currentUser.accountType === 'hosting' || currentUser.accountType === 'admin' || currentUser.adminAccess === 'full';
  const isManager = isFullAdmin || currentUser.accountType === 'md' || currentUser.accountType === 'staff' || currentUser.adminAccess === 'basic';
  const isAdminOrHosting = isFullAdmin;
  const publicUsers = users.filter(u => u.accountType !== 'hosting' && u.accountType !== 'admin');

  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Form
  const [targetUserId, setTargetUserId] = useState(isManager ? (publicUsers[0]?.id || currentUser.id) : currentUser.id);
  const [otDate, setOtDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState('');
  const [reason, setReason] = useState('');

  const visibleOvertime = isManager
    ? overtime.filter(o => {
        const u = users.find(x => x.id === o.userId);
        return u && u.accountType !== 'hosting' && u.accountType !== 'admin';
      })
    : overtime.filter(o => o.userId === currentUser.id);

  const filteredOvertime = visibleOvertime.filter(o => {
    const user = users.find(u => u.id === o.userId);
    const q = searchQuery.toLowerCase();
    return !q || (user && user.fullName.toLowerCase().includes(q)) || o.date.includes(q) || o.reason.toLowerCase().includes(q);
  });

  const totalApprovedHours = filteredOvertime
    .filter(o => o.status === 'Approved')
    .reduce((s, o) => s + Number(o.hours || 0), 0);

  const totalApprovedPayout = filteredOvertime
    .filter(o => o.status === 'Approved')
    .reduce((s, o) => {
      const u = users.find(x => x.id === o.userId);
      return s + (Number(o.hours || 0) * Number(u?.hourlyRate || 0));
    }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetUser = users.find(u => u.id === targetUserId) || currentUser;

    onAddOvertime({
      userId: targetUserId,
      date: otDate,
      hours: Number(hours),
      section: targetUser.section || 'Sewing',
      reason: reason.trim() || 'General overtime batch run',
      status: isManager ? 'Approved' : 'Pending',
      approvedBy: isManager ? currentUser.fullName : undefined
    });

    setHours('');
    setReason('');
    setModalOpen(false);
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

      {/* Header */}
      <div className={`border rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${cardBg}`}>
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">
            {t.overtimeTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.overtimeSubtitle}
          </p>
        </div>

        <button
          onClick={() => {
            setTargetUserId(isManager ? (publicUsers[0]?.id || currentUser.id) : currentUser.id);
            setModalOpen(true);
          }}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t.newOvertimeEntry}</span>
        </button>
      </div>

      {/* Duty Timing & Overtime Notice Banner */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 flex items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
            ⏰
          </span>
          <div>
            <span className="font-extrabold text-slate-900 dark:text-white">
              {isBn ? 'রেগুলার ডিউটি সময়:' : 'Regular Factory Duty:'}
            </span>{' '}
            <span className="font-semibold text-indigo-700 dark:text-indigo-300">
              {isBn ? 'সকাল ৯:০০ টা - সন্ধ্যা ৬:০০ টা' : '9:00 AM - 6:00 PM'}
            </span>
            <span className="mx-2 text-slate-300 dark:text-slate-600">·</span>
            <span className="text-slate-600 dark:text-slate-300">
              {isBn ? 'সন্ধ্যা ৬:০০ টার পর যেকোনো অতিরিক্ত কাজ ওভারটাইম হিসেবে গণ্য হবে।' : 'Work performed after 6:00 PM counts as overtime.'}
            </span>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/60 shrink-0 hidden sm:inline-block">
          {isBn ? '৬:০০ PM এর পর ওভারটাইম' : 'OT after 6:00 PM'}
        </span>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`border rounded-2xl p-4 space-y-1 shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t.otHoursCount}</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-xl font-black font-mono tabular-nums">
            {totalApprovedHours.toFixed(1)} {t.hours}
          </div>
        </div>

        <div className={`border rounded-2xl p-4 space-y-1 shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t.totalOtEarnings}</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="text-xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            ৳ {totalApprovedPayout.toLocaleString()}
          </div>
        </div>

        <div className={`border rounded-2xl p-4 space-y-1 shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Formula</span>
            <CheckCircle className="w-4 h-4" />
          </div>
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
            {t.formulaNote}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className={`border rounded-2xl p-4 shadow-xs flex items-center gap-2 ${cardBg}`}>
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`${t.searchWorker}`}
          className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-indigo-500 ${inputBg}`}
        />
      </div>

      {/* Overtime Table */}
      {/* Overtime Content: Responsive Grid/Flexbox on Mobile, Multi-column Table on Desktop */}
      <div className={`border rounded-3xl overflow-hidden shadow-xs ${cardBg}`}>
        {/* Mobile View: Responsive CSS Grid / Flexbox Cards (Zero horizontal scroll, full content visibility) */}
        <div className="block md:hidden p-3 sm:p-4 space-y-3">
          {filteredOvertime.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-bold text-xs">
              No overtime records found.
            </div>
          ) : (
            filteredOvertime.map((ot) => {
              const user = users.find(u => u.id === ot.userId);
              if (!user) return null;
              const earned = Number(ot.hours || 0) * Number(user.hourlyRate || 0);

              return (
                <div
                  key={ot.id}
                  className={`border rounded-2xl p-3.5 space-y-3 transition shadow-2xs ${
                    darkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50/80 border-slate-200'
                  }`}
                >
                  {/* Card Top: Worker Profile & Date */}
                  <div className="flex items-start justify-between gap-2 border-b pb-2.5 border-slate-200/80 dark:border-slate-700/80">
                    <UserProfileBadge user={user} showJoiningDate={true} darkMode={darkMode} language={language} size="sm" />
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
                      <Calendar className="w-3 h-3 text-indigo-500" />
                      <span>{ot.date}</span>
                    </span>
                  </div>

                  {/* Overtime Reason */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    {ot.reason || 'General Overtime Production'}
                  </p>

                  {/* 3-Column Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2 text-xs text-center">
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">{t.hours}</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                        {ot.hours}h
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">{t.hourlyOtRate}</span>
                      <span className="font-mono text-slate-500 text-xs">
                        ৳{Number(user.hourlyRate || 0).toFixed(0)}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">{t.earnedAmount}</span>
                      <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        ৳{earned.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Footer: Status & Actions */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                    <div className="flex-1 min-w-0">
                      {isAdminOrHosting && onUpdateStatus ? (
                        <select
                          value={ot.status}
                          onChange={(e) => onUpdateStatus(ot.id, e.target.value as 'Approved' | 'Pending' | 'Rejected')}
                          className={`w-full text-xs font-bold px-3 py-1.5 rounded-xl border cursor-pointer focus:outline-none transition ${
                            ot.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                              : ot.status === 'Pending'
                                ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                                : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                          }`}
                        >
                          <option value="Approved">✓ {t.approved}</option>
                          <option value="Pending">⏳ {t.pending}</option>
                          <option value="Rejected">✗ {t.rejected}</option>
                        </select>
                      ) : (
                        <span className={`font-bold text-xs flex items-center gap-1 ${
                          ot.status === 'Approved' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {ot.status === 'Approved' ? `✓ ${t.approved}` : `⏳ ${t.pending}`}
                        </span>
                      )}
                    </div>

                    {isAdminOrHosting && onDeleteOvertime && (
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteOvertime(ot.id);
                          setToastMsg(isBn ? '✓ ওভারটাইম রেকর্ডটি মুছে ফেলা হয়েছে।' : 'Overtime record deleted.');
                          setTimeout(() => setToastMsg(''), 3500);
                        }}
                        className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-500 hover:text-rose-700 cursor-pointer transition shrink-0"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
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
                <th className="p-4">{t.fullName} & {t.joiningDate}</th>
                <th className="p-4">{t.date}</th>
                <th className="p-4">{t.reasonDescription}</th>
                <th className="p-4 text-right">{t.hours}</th>
                <th className="p-4 text-right">{t.hourlyOtRate}</th>
                <th className="p-4 text-right">{t.earnedAmount}</th>
                <th className="p-4 text-center">{t.status}</th>
                {isAdminOrHosting && <th className="p-4 text-center">{isBn ? 'অ্যাকশন' : 'Action'}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredOvertime.length === 0 ? (
                <tr>
                  <td colSpan={isAdminOrHosting ? 8 : 7} className="p-8 text-center text-slate-400">
                    No overtime records found.
                  </td>
                </tr>
              ) : (
                filteredOvertime.map((ot) => {
                  const user = users.find(u => u.id === ot.userId);
                  if (!user) return null;
                  const earned = Number(ot.hours || 0) * Number(user.hourlyRate || 0);

                  return (
                    <tr 
                      key={ot.id}
                      className={`transition-colors ${
                        darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="p-4">
                        <UserProfileBadge user={user} showJoiningDate={true} darkMode={darkMode} language={language} />
                      </td>

                      <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {ot.date}
                      </td>

                      <td className="p-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {ot.reason || 'General Overtime Work'}
                      </td>

                      <td className="p-4 text-right font-mono font-bold tabular-nums">
                        {ot.hours} {t.hours}
                      </td>

                      <td className="p-4 text-right font-mono text-slate-500 tabular-nums">
                        ৳ {Number(user.hourlyRate || 0).toFixed(2)}
                      </td>

                      <td className="p-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                        ৳ {earned.toLocaleString()}
                      </td>

                      <td className="p-4 text-center">
                        {isAdminOrHosting && onUpdateStatus ? (
                          <select
                            value={ot.status}
                            onChange={(e) => onUpdateStatus(ot.id, e.target.value as 'Approved' | 'Pending' | 'Rejected')}
                            className={`text-xs font-bold px-2.5 py-1 rounded-xl border cursor-pointer focus:outline-none transition ${
                              ot.status === 'Approved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                : ot.status === 'Pending'
                                  ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                                  : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                            }`}
                          >
                            <option value="Approved">✓ {t.approved}</option>
                            <option value="Pending">⏳ {t.pending}</option>
                            <option value="Rejected">✗ {t.rejected}</option>
                          </select>
                        ) : isManager && onUpdateStatus && ot.status === 'Pending' ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onUpdateStatus(ot.id, 'Approved')}
                              className="px-2 py-1 rounded bg-emerald-600 text-white font-bold text-[10px] cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => onUpdateStatus(ot.id, 'Rejected')}
                              className="px-2 py-1 rounded bg-rose-600 text-white font-bold text-[10px] cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className={`font-bold text-[11px] ${
                            ot.status === 'Approved' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                          }`}>
                            {ot.status === 'Approved' ? `✓ ${t.approved}` : `⏳ ${t.pending}`}
                          </span>
                        )}
                      </td>

                      {isAdminOrHosting && (
                        <td className="p-4 text-center">
                          {onDeleteOvertime && (
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteOvertime(ot.id);
                                setToastMsg(isBn ? '✓ ওভারটাইম রেকর্ডটি সফলভাবে মুছে ফেলা হয়েছে।' : 'Overtime record deleted.');
                                setTimeout(() => setToastMsg(''), 3500);
                              }}
                              className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 hover:text-rose-700 cursor-pointer transition active:scale-90"
                              title={isBn ? 'ডিলিট করুন' : 'Delete'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 ${cardBg}`}>
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="font-extrabold text-base">{t.newOvertimeEntry}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {isManager && (
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    Employee *
                  </label>
                  <select
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  >
                    {publicUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.employeeId}) · ৳{u.hourlyRate}/hr
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {t.date} *
                  </label>
                  <input
                    type="date"
                    required
                    value={otDate}
                    onChange={(e) => setOtDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 font-mono ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {t.hours} *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="12"
                    required
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="e.g. 2.5"
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 font-mono ${inputBg}`}
                  />
                  {/* Quick OT calculation from 6:00 PM shift end */}
                  <div className="flex flex-wrap gap-1 pt-1.5">
                    {[1, 2, 2.5, 3, 4].map(h => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setHours(h.toString())}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border cursor-pointer transition ${
                          hours === h.toString()
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                        }`}
                        title={isBn ? `সন্ধ্যা ৬:০০ টার পর ${h} ঘণ্টা কাজ (${6 + Math.floor(h)}:${h % 1 === 0 ? '00' : '30'} PM পর্যন্ত)` : `${h} hrs after 6:00 PM`}
                      >
                        +{h}h ({6 + Math.floor(h)}:{h % 1 === 0 ? '00' : '30'} PM)
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                  {t.reasonDescription}
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Extra shift for H&M order completion"
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 ${inputBg}`}
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
                💡 {t.formulaNote}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold cursor-pointer shadow-sm transition"
                >
                  {t.saveOvertime}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
