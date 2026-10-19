import React, { useState } from 'react';
import { AttendanceRecord, User, Language, LeaveRecord } from '../types';
import { translations } from '../i18n';
import { UserProfileBadge } from './UserProfileBadge';
import { Plus, Search, Calendar, CheckCircle2, Clock, XCircle, Trash2, Zap, CheckCheck, Mail } from 'lucide-react';

interface AttendanceViewProps {
  attendance: AttendanceRecord[];
  users: User[];
  currentUser: User;
  leaves?: LeaveRecord[];
  language: Language;
  darkMode: boolean;
  onAddAttendance: (record: Omit<AttendanceRecord, 'id'>) => void;
  onBatchAddAttendance?: (records: Omit<AttendanceRecord, 'id'>[]) => void;
  onUpdateStatus?: (id: string, status: 'Present' | 'Late' | 'Absent') => void;
  onDeleteAttendance?: (id: string) => void;
  onOpenGmailModal?: (recipientId?: string, template?: 'absent' | 'production' | 'payroll' | 'custom') => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  attendance,
  users,
  currentUser,
  leaves = [],
  language,
  darkMode,
  onAddAttendance,
  onBatchAddAttendance,
  onUpdateStatus,
  onDeleteAttendance,
  onOpenGmailModal
}) => {
  const t = translations[language];
  const isBn = language === 'bn';
  const isFullAdmin = currentUser.accountType === 'hosting' || currentUser.accountType === 'admin' || currentUser.adminAccess === 'full';
  const isManager = isFullAdmin || currentUser.accountType === 'md' || currentUser.accountType === 'staff' || currentUser.adminAccess === 'basic';
  const publicUsers = users.filter(u => u.accountType !== 'hosting' && u.accountType !== 'admin');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [selectedAttDate, setSelectedAttDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Form state
  const [targetUserId, setTargetUserId] = useState(isManager ? (publicUsers[0]?.id || currentUser.id) : currentUser.id);
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attStatus, setAttStatus] = useState<'Present' | 'Late' | 'Absent'>('Present');
  const [inTime, setInTime] = useState('09:00 AM');
  const [outTime, setOutTime] = useState('06:00 PM');
  const [shift, setShift] = useState('General Shift (9:00 AM - 6:00 PM)');

  const visibleAttendance = isManager 
    ? attendance.filter(a => {
        const u = users.find(x => x.id === a.userId);
        return u && u.accountType !== 'hosting' && u.accountType !== 'admin';
      })
    : attendance.filter(a => a.userId === currentUser.id);

  const filteredAttendance = visibleAttendance.filter(a => {
    const user = users.find(u => u.id === a.userId);
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || (user && (user.fullName.toLowerCase().includes(q) || user.employeeId.toLowerCase().includes(q))) || a.date.includes(q);
    return matchesStatus && matchesSearch;
  });

  // Calculate unrecorded active employees for the selected date
  const activePublicUsers = publicUsers.filter(u => u.accountStatus === 'Active');
  const unrecordedUsers = activePublicUsers.filter(u => {
    const hasRecord = attendance.some(a => a.userId === u.id && a.date === selectedAttDate);
    const hasApprovedLeave = leaves.some(l => 
      l.userId === u.id && 
      l.status === 'Approved' && 
      l.startDate <= selectedAttDate && 
      l.endDate >= selectedAttDate
    );
    return !hasRecord && !hasApprovedLeave;
  });

  const handleMarkAllAsPresent = () => {
    if (unrecordedUsers.length === 0) {
      setToastMsg(isBn 
        ? `নির্বাচিত তারিখে (${selectedAttDate}) সকল কর্মীর হাজিরা ইতিমধ্যে উপস্থিত হিসেবে রেকর্ড আছে!` 
        : `All employees already have attendance records for ${selectedAttDate}!`);
      setTimeout(() => setToastMsg(''), 3500);
      return;
    }

    const newRecords: Omit<AttendanceRecord, 'id'>[] = unrecordedUsers.map(u => ({
      userId: u.id,
      date: selectedAttDate,
      status: 'Present' as const,
      inTime: '08:55 AM',
      outTime: '06:00 PM',
      shift: 'General Shift (9:00 AM - 6:00 PM)'
    }));

    if (onBatchAddAttendance) {
      onBatchAddAttendance(newRecords);
    } else {
      newRecords.forEach(r => onAddAttendance(r));
    }

    setToastMsg(isBn 
      ? `⚡ এক ক্লিকে ${unrecordedUsers.length} জন কর্মীকে ${selectedAttDate} তারিখে 'উপস্থিত (Present)' মার্ক করা হয়েছে!` 
      : `⚡ Successfully marked all ${unrecordedUsers.length} employees as Present for ${selectedAttDate}!`);
    setTimeout(() => setToastMsg(''), 4500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddAttendance({
      userId: isFullAdmin ? targetUserId : currentUser.id,
      date: attDate,
      status: attStatus,
      inTime,
      outTime,
      shift
    });
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

      {/* Header & Mark All Present Quick Action */}
      <div className={`border rounded-3xl p-6 shadow-xs flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 ${cardBg}`}>
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">
            {t.attendanceTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.attendanceSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Specific Date Picker for Mark All As Present (Admin only) */}
          {isFullAdmin && (
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Calendar className="w-4 h-4 text-slate-400 ml-1.5 shrink-0" />
              <input
                type="date"
                value={selectedAttDate}
                onChange={(e) => setSelectedAttDate(e.target.value)}
                className="bg-transparent text-xs font-black focus:outline-none cursor-pointer pr-1"
                title={isBn ? 'হাজিরার তারিখ নির্ধারণ করুন' : 'Select attendance date'}
              />
              <button
                type="button"
                onClick={() => setSelectedAttDate(new Date().toISOString().split('T')[0])}
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs cursor-pointer hover:bg-indigo-50"
              >
                {isBn ? 'আজ' : 'Today'}
              </button>
            </div>
          )}

          {/* Mark All As Present Button (Admin only) */}
          {isFullAdmin && (
            <button
              type="button"
              onClick={handleMarkAllAsPresent}
              className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center gap-2 cursor-pointer shadow-sm select-none shrink-0 ${
                unrecordedUsers.length > 0
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
              }`}
              title={isBn ? `${selectedAttDate} তারিখে সকল বাকি কর্মীর উপস্থিতি এক ক্লিকে নিশ্চিত করুন` : `Mark all remaining employees as present for ${selectedAttDate}`}
            >
              {unrecordedUsers.length > 0 ? (
                <>
                  <Zap className="w-4 h-4 fill-amber-300 text-amber-300 animate-pulse" />
                  <span>{isBn ? '⚡ এক ক্লিকে সকল কর্মী উপস্থিত' : '⚡ Mark All as Present'}</span>
                  <span className="px-2 py-0.5 rounded-full bg-black/25 text-white text-[10px] font-mono font-black">
                    {unrecordedUsers.length} {isBn ? 'বাকি' : 'Due'}
                  </span>
                </>
              ) : (
                <>
                  <CheckCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{isBn ? '✓ সবাই উপস্থিত (Completed)' : '✓ All Present'}</span>
                </>
              )}
            </button>
          )}

          {/* Email Absent Workers Button */}
          {isManager && onOpenGmailModal && (
            <button
              type="button"
              onClick={() => onOpenGmailModal(undefined, 'absent')}
              className="px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 active:scale-95"
              title={isBn ? 'অনুপস্থিত কর্মীদের অবিলম্বে অফিসে আসার তাগাদা দিয়ে ইমেইল পাঠান' : 'Send Gmail notice to absent workers'}
            >
              <Mail className="w-4 h-4" />
              <span>{isBn ? '✉️ অনুপস্থিতদের মেইল' : '✉️ Email Absentees'}</span>
            </button>
          )}

          {/* New Attendance Entry Modal Trigger */}
          <button
            type="button"
            onClick={() => {
              setTargetUserId(isManager ? (publicUsers[0]?.id || currentUser.id) : currentUser.id);
              setModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t.newAttendanceEntry}</span>
          </button>
        </div>
      </div>

      {/* Duty Timing & Overtime Notice Banner */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 flex items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
            ⏰
          </span>
          <div>
            <span className="font-extrabold text-slate-900 dark:text-white">
              {isBn ? 'ফ্যাক্টরি ডিউটি সময়:' : 'Factory Duty Hours:'}
            </span>{' '}
            <span className="font-semibold text-indigo-700 dark:text-indigo-300">
              {isBn ? 'সকাল ৯:০০ টা - সন্ধ্যা ৬:০০ টা' : '9:00 AM - 6:00 PM'}
            </span>
            <span className="mx-2 text-slate-300 dark:text-slate-600">·</span>
            <span className="text-slate-600 dark:text-slate-300">
              {isBn ? 'সন্ধ্যা ৬:০০ টার পরের কাজ ওভারটাইম হিসেবে গণ্য হবে।' : 'Work performed after 6:00 PM counts as overtime.'}
            </span>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 shrink-0 hidden sm:inline-block">
          {isBn ? '৯ ঘণ্টা শিফট' : '9-Hr Shift'}
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className={`border rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 ${cardBg}`}>
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchWorker}
            className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-indigo-500 ${inputBg}`}
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('Present')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              statusFilter === 'Present'
                ? 'bg-emerald-600 text-white shadow-xs'
                : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {t.present}
          </button>
          <button
            onClick={() => setStatusFilter('Late')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              statusFilter === 'Late'
                ? 'bg-amber-600 text-white shadow-xs'
                : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {t.late}
          </button>
          <button
            onClick={() => setStatusFilter('Absent')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              statusFilter === 'Absent'
                ? 'bg-rose-600 text-white shadow-xs'
                : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {t.absent}
          </button>
        </div>
      </div>

      {/* Attendance Content: Responsive Grid/Flexbox on Mobile, Multi-column Table on Desktop */}
      <div className={`border rounded-3xl overflow-hidden shadow-xs ${cardBg}`}>
        {/* Mobile View: Responsive CSS Grid / Flexbox Cards (No horizontal scroll, 100% content visibility) */}
        <div className="block md:hidden p-3 sm:p-4 space-y-3">
          {filteredAttendance.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-bold text-xs">
              No attendance records match your filter.
            </div>
          ) : (
            filteredAttendance.map(att => {
              const user = users.find(u => u.id === att.userId);
              if (!user) return null;

              return (
                <div
                  key={att.id}
                  className={`border rounded-2xl p-3.5 space-y-2.5 transition shadow-2xs ${
                    darkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50/80 border-slate-200'
                  }`}
                >
                  {/* Card Top: Worker Profile & Date */}
                  <div className="flex items-start justify-between gap-2 border-b pb-2.5 border-slate-200/80 dark:border-slate-700/80">
                    <UserProfileBadge user={user} showJoiningDate={true} darkMode={darkMode} language={language} size="sm" />
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <Calendar className="w-3 h-3 text-indigo-500" />
                        <span>{att.date}</span>
                      </span>
                    </div>
                  </div>

                  {/* Shift & Time Breakdown in 2-Column Responsive Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">{t.inTime}</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {att.inTime || 'N/A'}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">{t.outTime}</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-sm">
                        {att.outTime || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Shift Details */}
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{att.shift}</span>
                  </div>

                  {/* Card Footer: Status Selector & Actions (Full mobile visibility) */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                    <div className="flex-1 min-w-0">
                      {((isFullAdmin || att.userId === currentUser.id) && onUpdateStatus) ? (
                        <select
                          value={att.status}
                          onChange={(e) => onUpdateStatus(att.id, e.target.value as 'Present' | 'Late' | 'Absent')}
                          className={`w-full text-xs font-bold px-3 py-1.5 rounded-xl border cursor-pointer focus:outline-none transition ${
                            att.status === 'Present'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                              : att.status === 'Late'
                                ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                                : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                          }`}
                        >
                          <option value="Present">✓ {t.present}</option>
                          <option value="Late">⏳ {t.late}</option>
                          <option value="Absent">✗ {t.absent}</option>
                        </select>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {att.status === 'Present' && (
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{t.present}</span>
                            </span>
                          )}
                          {att.status === 'Late' && (
                            <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 text-xs">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{t.late}</span>
                            </span>
                          )}
                          {att.status === 'Absent' && (
                            <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 text-xs">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>{t.absent}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action buttons on mobile */}
                    <div className="flex items-center gap-1 shrink-0">
                      {isManager && att.status === 'Absent' && onOpenGmailModal && (
                        <button
                          type="button"
                          onClick={() => onOpenGmailModal(att.userId, 'absent')}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
                          title="Email absentee"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>{isBn ? 'মেইল' : 'Email'}</span>
                        </button>
                      )}
                      {(isFullAdmin || att.userId === currentUser.id) && onDeleteAttendance && (
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteAttendance(att.id);
                            setToastMsg(isBn ? '✓ হাজিরা রেকর্ডটি মুছে ফেলা হয়েছে।' : 'Attendance record deleted.');
                            setTimeout(() => setToastMsg(''), 3500);
                          }}
                          className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 cursor-pointer transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
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
                <th className="p-4">{t.fullName} & {t.joiningDate}</th>
                <th className="p-4">{t.date}</th>
                <th className="p-4">{t.shift}</th>
                <th className="p-4 font-mono">{t.inTime}</th>
                <th className="p-4 font-mono">{t.outTime}</th>
                <th className="p-4 text-center">{t.status}</th>
                {isManager && <th className="p-4 text-center">{isBn ? 'অ্যাকশন' : 'Action'}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={isManager ? 7 : 6} className="p-8 text-center text-slate-400">
                    No attendance records match your filter.
                  </td>
                </tr>
              ) : (
                filteredAttendance.map(att => {
                  const user = users.find(u => u.id === att.userId);
                  if (!user) return null;

                  return (
                    <tr
                      key={att.id}
                      className={`transition-colors ${
                        darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="p-4">
                        <UserProfileBadge user={user} showJoiningDate={true} darkMode={darkMode} language={language} />
                      </td>

                      <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{att.date}</span>
                        </span>
                      </td>

                      <td className="p-4 text-slate-600 dark:text-slate-400">
                        {att.shift}
                      </td>

                      <td className="p-4 font-mono font-semibold tabular-nums">
                        {att.inTime}
                      </td>

                      <td className="p-4 font-mono font-semibold tabular-nums">
                        {att.outTime}
                      </td>

                      <td className="p-4 text-center">
                        {((isFullAdmin || att.userId === currentUser.id) && onUpdateStatus) ? (
                          <select
                            value={att.status}
                            onChange={(e) => onUpdateStatus(att.id, e.target.value as 'Present' | 'Late' | 'Absent')}
                            className={`text-xs font-bold px-2.5 py-1 rounded-xl border cursor-pointer focus:outline-none transition ${
                              att.status === 'Present'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                : att.status === 'Late'
                                  ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                                  : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                            }`}
                          >
                            <option value="Present">✓ {t.present}</option>
                            <option value="Late">⏳ {t.late}</option>
                            <option value="Absent">✗ {t.absent}</option>
                          </select>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-[11px] text-slate-400" title={isBn ? 'অন্যের হাজিরা রেকর্ড (পরিবর্তনযোগ্য নয়)' : 'Other worker record (read only)'}>🔒</span>
                            {att.status === 'Present' && (
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{t.present}</span>
                              </span>
                            )}
                            {att.status === 'Late' && (
                              <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{t.late}</span>
                              </span>
                            )}
                            {att.status === 'Absent' && (
                              <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center justify-center gap-1">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>{t.absent}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {isManager && (
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {att.status === 'Absent' && onOpenGmailModal && (
                              <button
                                type="button"
                                onClick={() => onOpenGmailModal(att.userId, 'absent')}
                                className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-950 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition active:scale-95 shadow-xs"
                                title={isBn ? 'এই অনুপস্থিত কর্মীকে তাৎক্ষণিক ইমেইল পাঠান' : 'Send attendance notice to this absent worker'}
                              >
                                <Mail className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline text-[10px]">{isBn ? 'মেইল' : 'Email'}</span>
                              </button>
                            )}
                            {(isFullAdmin || att.userId === currentUser.id) && onDeleteAttendance && (
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteAttendance(att.id);
                                  setToastMsg(isBn ? '✓ হাজিরা রেকর্ডটি সফলভাবে মুছে ফেলা হয়েছে।' : 'Attendance record deleted.');
                                  setTimeout(() => setToastMsg(''), 3500);
                                }}
                                className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 cursor-pointer transition active:scale-90"
                                title={isBn ? 'ডিলিট করুন' : 'Delete'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
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

      {/* Attendance Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 ${cardBg}`}>
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="font-extrabold text-base">{t.newAttendanceEntry}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                  {isBn ? 'কর্মী (Employee) *' : 'Employee *'}
                </label>
                {isFullAdmin ? (
                  <select
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  >
                    {publicUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.employeeId}) - {u.section}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/40 text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 truncate">
                      <span>🔒</span>
                      <span>{currentUser.fullName} ({currentUser.employeeId})</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal shrink-0">
                      ({currentUser.section || 'General'} Section)
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {t.date} *
                  </label>
                  <input
                    type="date"
                    required
                    value={attDate}
                    onChange={(e) => setAttDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 font-mono ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {t.status} *
                  </label>
                  <select
                    value={attStatus}
                    onChange={(e) => setAttStatus(e.target.value as 'Present' | 'Late' | 'Absent')}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  >
                    <option value="Present">{t.present}</option>
                    <option value="Late">{t.late}</option>
                    <option value="Absent">{t.absent}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {t.inTime} *
                  </label>
                  <input
                    type="text"
                    required
                    value={inTime}
                    onChange={(e) => setInTime(e.target.value)}
                    placeholder="08:00 AM"
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 font-mono ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {t.outTime} *
                  </label>
                  <input
                    type="text"
                    required
                    value={outTime}
                    onChange={(e) => setOutTime(e.target.value)}
                    placeholder="05:00 PM"
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 font-mono ${inputBg}`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                  {t.shift}
                </label>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 ${inputBg}`}
                >
                  <option value="General (8 Hrs)">General Shift (8 Hrs)</option>
                  <option value="Morning Shift">Morning Shift (6:00 AM - 2:00 PM)</option>
                  <option value="Evening Shift">Evening Shift (2:00 PM - 10:00 PM)</option>
                  <option value="Night Shift">Night Shift (10:00 PM - 6:00 AM)</option>
                </select>
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
                  {t.saveAttendance}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
