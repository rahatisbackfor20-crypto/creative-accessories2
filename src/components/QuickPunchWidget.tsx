import React, { useState, useEffect, useMemo } from 'react';
import { User, AttendanceRecord, Language } from '../types';
import { 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Users, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  AlertCircle,
  CalendarCheck,
  Check,
  X
} from 'lucide-react';

interface QuickPunchWidgetProps {
  currentUser: User;
  users: User[];
  attendance: AttendanceRecord[];
  language: Language;
  darkMode: boolean;
  onAddAttendance: (record: Omit<AttendanceRecord, 'id'>) => Promise<void> | void;
  onUpdateAttendanceStatus?: (id: string, status: 'Present' | 'Late' | 'Absent') => Promise<void> | void;
  onUpdateAttendanceRecord?: (record: AttendanceRecord) => Promise<void> | void;
  onBatchAddAttendance?: (records: Omit<AttendanceRecord, 'id'>[]) => Promise<void> | void;
}

export const QuickPunchWidget: React.FC<QuickPunchWidgetProps> = ({
  currentUser,
  users,
  attendance,
  language,
  darkMode,
  onAddAttendance,
  onUpdateAttendanceStatus,
  onUpdateAttendanceRecord,
  onBatchAddAttendance
}) => {
  const isBn = language === 'bn';
  const isManager = currentUser.accountType === 'hosting' || 
                    currentUser.accountType === 'admin' || 
                    currentUser.accountType === 'md' || 
                    currentUser.accountType === 'staff' ||
                    currentUser.adminAccess === 'full' ||
                    currentUser.adminAccess === 'basic';

  // Live real-time clock
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Format 12-hour AM/PM time
  const formatTime12 = (d: Date) => {
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    const strMinutes = minutes < 10 ? '0' + minutes : minutes;
    const strHours = hours < 10 ? '0' + hours : hours;
    return `${strHours}:${strMinutes} ${ampm}`;
  };

  const toBnDigits = (numStr: string) => {
    if (!isBn) return numStr;
    const bnNums = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return numStr.replace(/\d/g, d => bnNums[parseInt(d, 10)]);
  };

  const currentTimeStr = formatTime12(now);
  const currentTimeDisplay = toBnDigits(currentTimeStr);

  // Time Window Calculations
  // Morning: 08:30 AM to 10:00 AM (8 * 60 + 30 = 510 to 10 * 60 = 600)
  // Evening: 05:00 PM to 07:00 PM (17 * 60 = 1020 to 19 * 60 = 1140)
  const totalMinutes = now.getHours() * 60 + now.getMinutes();
  const isRealMorningWindow = totalMinutes >= 510 && totalMinutes <= 600;
  const isRealEveningWindow = totalMinutes >= 1020 && totalMinutes <= 1140;
  const isRealWindowActive = isRealMorningWindow || isRealEveningWindow;

  // Manual test / force expand override so user can punch or test anytime
  const [manualExpand, setManualExpand] = useState<boolean | null>(null);
  const [simulatedWindow, setSimulatedWindow] = useState<'real' | 'morning' | 'evening'>('real');

  const effectiveMorningWindow = simulatedWindow === 'morning' || (simulatedWindow === 'real' && isRealMorningWindow);
  const effectiveEveningWindow = simulatedWindow === 'evening' || (simulatedWindow === 'real' && isRealEveningWindow);
  const isWindowActive = manualExpand !== null ? manualExpand : (effectiveMorningWindow || effectiveEveningWindow);

  // Check current user attendance today
  const myRecordToday = useMemo(() => {
    return attendance.find(a => a.userId === currentUser.id && a.date === todayStr);
  }, [attendance, currentUser.id, todayStr]);

  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'info' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick punch for another worker (if manager)
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');

  const publicUsers = useMemo(() => {
    return users.filter(u => u.accountType !== 'hosting' && u.accountType !== 'admin' && u.accountStatus === 'Active');
  }, [users]);

  // Unrecorded workers today
  const unrecordedWorkers = useMemo(() => {
    return publicUsers.filter(u => !attendance.some(a => a.userId === u.id && a.date === todayStr));
  }, [publicUsers, attendance, todayStr]);

  const presentCountToday = publicUsers.length - unrecordedWorkers.length;

  // 1-Click Punch Handler for Current User
  const handleQuickPresent = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const punchTime = currentTimeStr;
      
      if (!myRecordToday) {
        // Create new attendance record
        const newRecord: Omit<AttendanceRecord, 'id'> = {
          userId: currentUser.id,
          date: todayStr,
          status: 'Present',
          inTime: punchTime,
          outTime: effectiveEveningWindow ? punchTime : '06:00 PM',
          shift: 'General Shift (9:00 AM - 6:00 PM)'
        };

        await onAddAttendance(newRecord);

        setToastMsg({
          text: isBn 
            ? `🎉 চমৎকার! আপনার আজকের হাজিরা এক ক্লিকে সফলভাবে সম্পন্ন হয়েছে (ইন-টাইম: ${toBnDigits(punchTime)})` 
            : `🎉 Great! Your attendance has been logged successfully (In-time: ${punchTime})`,
          type: 'success'
        });
      } else {
        // Already recorded today -> update status or out-time
        if (effectiveEveningWindow) {
          if (onUpdateAttendanceRecord) {
            await onUpdateAttendanceRecord({
              ...myRecordToday,
              outTime: punchTime,
              status: 'Present'
            });
          } else if (onUpdateAttendanceStatus) {
            await onUpdateAttendanceStatus(myRecordToday.id, 'Present');
          }
          setToastMsg({
            text: isBn 
              ? `🏁 আপনার আজকের প্রস্থান (Out-Time: ${toBnDigits(punchTime)}) সফলভাবে আপডেট হয়েছে!` 
              : `🏁 Your today's out-time (${punchTime}) has been recorded!`,
            type: 'success'
          });
        } else {
          setToastMsg({
            text: isBn 
              ? `✅ আপনার আজকের হাজিরা ইতিমধ্যে রেকর্ড রয়েছে (ইন-টাইম: ${toBnDigits(myRecordToday.inTime)})` 
              : `✅ You have already marked attendance today (In: ${myRecordToday.inTime})`,
            type: 'info'
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  // 1-Click Mark for selected worker (for managers)
  const handlePunchForWorker = async (targetUserId: string) => {
    if (!targetUserId || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const worker = users.find(u => u.id === targetUserId);
      const punchTime = currentTimeStr;
      
      const existing = attendance.find(a => a.userId === targetUserId && a.date === todayStr);
      if (!existing) {
        await onAddAttendance({
          userId: targetUserId,
          date: todayStr,
          status: 'Present',
          inTime: punchTime,
          outTime: '06:00 PM',
          shift: 'General Shift (9:00 AM - 6:00 PM)'
        });
        setToastMsg({
          text: isBn 
            ? `⚡ কর্মী ${worker?.fullName || ''}-এর হাজিরা সফলভাবে 'উপস্থিত' হিসেবে রেকর্ড হয়েছে!` 
            : `⚡ Marked ${worker?.fullName || ''} as Present!`,
          type: 'success'
        });
      }
      setSelectedWorkerId('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  // 1-Click Mark All Unrecorded as Present (for managers)
  const handleBatchMarkAll = async () => {
    if (unrecordedWorkers.length === 0 || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const punchTime = currentTimeStr;
      const records: Omit<AttendanceRecord, 'id'>[] = unrecordedWorkers.map(u => ({
        userId: u.id,
        date: todayStr,
        status: 'Present',
        inTime: punchTime,
        outTime: '06:00 PM',
        shift: 'General Shift (9:00 AM - 6:00 PM)'
      }));

      if (onBatchAddAttendance) {
        await onBatchAddAttendance(records);
      } else {
        for (const r of records) {
          await onAddAttendance(r);
        }
      }

      setToastMsg({
        text: isBn 
          ? `⚡ এক ক্লিকে বাকি ${toBnDigits(unrecordedWorkers.length.toString())} জন কর্মীকে উপস্থিত (Present) মার্ক করা হয়েছে!` 
          : `⚡ Successfully marked all ${unrecordedWorkers.length} employees as Present!`,
        type: 'success'
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  // Card background styling
  const cardBg = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900';

  return (
    <div className="w-full transition-all duration-300">
      {/* Toast Alert */}
      {toastMsg && (
        <div className={`mb-3 p-3 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold shadow-md animate-fade-in ${
          toastMsg.type === 'success' 
            ? 'bg-emerald-600 text-white shadow-emerald-600/20' 
            : 'bg-indigo-600 text-white shadow-indigo-600/20'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMsg.text}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setToastMsg(null)}
            className="p-1 rounded-lg hover:bg-white/20 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ACTIVE TIME WINDOW VIEW (8:30 - 10:00 AM & 5:00 - 7:00 PM) */}
      {isWindowActive ? (
        <div className={`border-2 rounded-3xl p-4 sm:p-6 shadow-lg transition-all relative overflow-hidden ${
          effectiveEveningWindow
            ? darkMode 
              ? 'border-amber-500/70 bg-linear-to-br from-slate-900 via-amber-950/30 to-slate-900' 
              : 'border-amber-400 bg-linear-to-br from-amber-50/90 via-orange-50/50 to-white'
            : darkMode 
              ? 'border-emerald-500/70 bg-linear-to-br from-slate-900 via-emerald-950/30 to-slate-900' 
              : 'border-emerald-400 bg-linear-to-br from-emerald-50/90 via-teal-50/50 to-white'
        }`}>
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>

          {/* Top Row: Active status indicator & Live clock & Collapse button */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4">
            <div className="flex items-center gap-2.5">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                effectiveEveningWindow
                  ? 'bg-amber-500 text-white shadow-xs animate-pulse'
                  : 'bg-emerald-600 text-white shadow-xs animate-pulse'
              }`}>
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                <span>
                  {effectiveEveningWindow
                    ? (isBn ? '🌇 বিকেলের প্রস্থান উইন্ডো (০৫:০০ - ০৭:০০ PM)' : '🌇 Evening Punch-Out Window (5:00 - 7:00 PM)')
                    : (isBn ? '🌅 সকালের হাজিরা উইন্ডো চালু (০৮:৩০ - ১০:০০ AM)' : '🌅 Morning Punch-In Window (8:30 - 10:00 AM)')}
                </span>
              </span>

              {/* Time window status tag */}
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 hidden sm:inline-flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-500" />
                <span>{isBn ? 'সহজ ১-ক্লিক প্রেসেন্ট' : 'Easy 1-Click Punch'}</span>
              </span>
            </div>

            {/* Live Clock Display & Controls */}
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-xl bg-slate-950/80 dark:bg-black/60 text-emerald-400 font-mono text-xs sm:text-sm font-black flex items-center gap-1.5 border border-emerald-500/30 shadow-inner">
                <Clock className="w-3.5 h-3.5 animate-spin-slow" />
                <span>{currentTimeDisplay}</span>
              </div>

              {/* Window simulation switcher (handy for testing anytime) */}
              <div className="hidden lg:flex items-center gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setSimulatedWindow(prev => prev === 'morning' ? 'real' : 'morning')}
                  title="Test Morning 8:30-10:00 AM window"
                  className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer border ${
                    simulatedWindow === 'morning' 
                      ? 'bg-emerald-600 text-white border-emerald-600' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  8:30 AM
                </button>
                <button
                  type="button"
                  onClick={() => setSimulatedWindow(prev => prev === 'evening' ? 'real' : 'evening')}
                  title="Test Evening 5:00-7:00 PM window"
                  className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer border ${
                    simulatedWindow === 'evening' 
                      ? 'bg-amber-600 text-white border-amber-600' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  5:00 PM
                </button>
              </div>

              {/* Close / Cancel button */}
              <button
                type="button"
                onClick={() => setManualExpand(false)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer transition text-xs font-bold flex items-center gap-1 shrink-0"
                title={isBn ? 'বন্ধ করুন / ক্যানসেল' : 'Close / Cancel'}
              >
                <X className="w-3.5 h-3.5" />
                <span>{isBn ? 'বন্ধ' : 'Close'}</span>
              </button>
            </div>
          </div>

          {/* MAIN 1-CLICK ACTION SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Left: User status & One-Click Button */}
            <div className={`md:col-span-8 p-4 sm:p-5 rounded-2xl border transition-all ${
              myRecordToday 
                ? 'bg-emerald-500/10 border-emerald-500/30' 
                : 'bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-xs'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {currentUser.fullName}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                      {currentUser.employeeId}
                    </span>
                  </div>

                  {myRecordToday ? (
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isBn ? 'আজকের হাজিরা সম্পন্ন (Present)' : 'Present Logged Today'}</span>
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-xs text-slate-600 dark:text-slate-300 font-mono font-bold">
                        {isBn ? 'ইন-টাইম:' : 'In:'} <span className="text-emerald-600 dark:text-emerald-400">{toBnDigits(myRecordToday.inTime)}</span>
                      </span>
                      {myRecordToday.outTime && myRecordToday.outTime !== '06:00 PM' && (
                        <>
                          <span className="text-slate-400">·</span>
                          <span className="text-xs text-slate-600 dark:text-slate-300 font-mono font-bold">
                            {isBn ? 'আউট-টাইম:' : 'Out:'} <span className="text-amber-600 dark:text-amber-400">{toBnDigits(myRecordToday.outTime)}</span>
                          </span>
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {isBn 
                        ? '👉 নিচে সবুজ বাটনে শুধু একটি ক্লিক দিন, আপনার আজকের হাজিরা তৎক্ষণাৎ প্রেজেন্ট হয়ে যাবে!' 
                        : '👉 Click the green button below to mark your attendance in 1-click!'}
                    </p>
                  )}
                </div>

                {/* The 1-Click Action Button */}
                <div className="w-full sm:w-auto shrink-0">
                  {myRecordToday ? (
                    effectiveEveningWindow ? (
                      <button
                        type="button"
                        onClick={handleQuickPresent}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ring-2 ring-amber-400/50"
                      >
                        <Clock className="w-4 h-4 animate-spin-slow" />
                        <span>{isBn ? '🏁 এক ক্লিকে প্রস্থান (Out) দিন' : '🏁 1-Click Out-Time'}</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs shadow-xs select-none">
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>{isBn ? 'উপস্থিত আছেন ✓' : 'Marked Present ✓'}</span>
                      </div>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={handleQuickPresent}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-sm uppercase tracking-wider shadow-lg hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer ring-4 ring-emerald-500/30 animate-pulse"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>{isBn ? '✅ এক ক্লিকে প্রেজেন্ট দিন' : '✅ 1-Click Present'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Team Snapshot / Quick Batch (Visible to Managers & Staff) */}
            <div className={`md:col-span-4 p-4 rounded-2xl border ${
              darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white/60 border-slate-200'
            }`}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{isBn ? 'আজকের কারখানা হাজিরা' : 'Factory Attendance'}</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  {toBnDigits(presentCountToday.toString())}/{toBnDigits(publicUsers.length.toString())} {isBn ? 'উপস্থিত' : 'Present'}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-3">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${publicUsers.length > 0 ? (presentCountToday / publicUsers.length) * 100 : 0}%` }}
                />
              </div>

              {isManager ? (
                <div className="space-y-2">
                  {unrecordedWorkers.length > 0 ? (
                    <button
                      type="button"
                      onClick={handleBatchMarkAll}
                      disabled={isSubmitting}
                      className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      <span>
                        {isBn 
                          ? `বাকি ${toBnDigits(unrecordedWorkers.length.toString())} জনকে ১-ক্লিকে প্রেজেন্ট দিন` 
                          : `Batch Mark ${unrecordedWorkers.length} Remaining`}
                      </span>
                    </button>
                  ) : (
                    <div className="text-center py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      🎉 {isBn ? 'সকল কর্মীর আজকের হাজিরা সম্পন্ন!' : 'All employees present today!'}
                    </div>
                  )}

                  {/* Quick Punch for single worker */}
                  {unrecordedWorkers.length > 0 && (
                    <div className="flex gap-1.5 pt-1">
                      <select
                        value={selectedWorkerId}
                        onChange={(e) => setSelectedWorkerId(e.target.value)}
                        className="flex-1 text-[11px] py-1.5 px-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-semibold"
                      >
                        <option value="">{isBn ? '-- কর্মী সিলেক্ট করুন --' : '-- Select Worker --'}</option>
                        {unrecordedWorkers.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.fullName} ({u.employeeId})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handlePunchForWorker(selectedWorkerId)}
                        disabled={!selectedWorkerId || isSubmitting}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-[11px] cursor-pointer"
                        title={isBn ? 'এই কর্মীকে প্রেজেন্ট দিন' : 'Punch for worker'}
                      >
                        {isBn ? 'প্রেজেন্ট' : 'Punch'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {isBn ? 'আপনার সহকর্মীদের মধ্যে ' : ''}
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{toBnDigits(presentCountToday.toString())}</span>
                  {isBn ? ' জন ইতিমধ্যে ডিউটিতে যোগ দিয়েছেন।' : ' colleagues have punched in today.'}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* COLLAPSED VIEW (OUTSIDE 8:30-10:00 AM & 5:00-7:00 PM) */
        /* "তারপর ওইটা আবার জায়গাটা জায়গায় চলে যাবে। মানে সহজেই মানুষ ঢুকে প্রেজেন্ট এক ক্লিকেই দিতে পারে।" */
        <div className={`border rounded-2xl p-3 sm:p-3.5 transition-all shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${cardBg}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl shrink-0 ${
              myRecordToday 
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              {myRecordToday ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            </div>

            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>⏱️ {isBn ? 'হাজিরা সময়সূচী:' : 'Attendance Schedule:'}</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                    {isBn ? 'সকাল ০৮:৩০ - ১০:০০ টা' : '08:30 - 10:00 AM'}
                  </span>
                  <span className="text-slate-400">&</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold">
                    {isBn ? 'বিকেল ০৫:০০ - ০৭:০০ টা' : '05:00 - 07:00 PM'}
                  </span>
                </span>

                {myRecordToday && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    ✓ {isBn ? 'আজ উপস্থিত' : 'Present Today'} ({toBnDigits(myRecordToday.inTime)})
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {myRecordToday
                  ? (isBn 
                      ? `আজকের তারিখ ${todayStr}-এ আপনার হাজিরা সম্পন্ন হয়েছে। নির্ধারিত সময়ে অটোমেটিক উইন্ডো খুলবে।` 
                      : `Your attendance is recorded for today (${todayStr}).`)
                  : (isBn 
                      ? 'উক্ত সময়ে হোম পেজে বড় ১-ক্লিক বাটন চালু থাকে। যেকোনো সময় এখনই হাজিরা দিতে বাটনে ক্লিক করুন।' 
                      : 'Punch window activates automatically during shift hours. Click to punch anytime.')}
              </p>
            </div>
          </div>

          {/* Quick Punch / Expand Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <span className="text-xs font-mono font-bold text-slate-400 hidden md:inline">
              {currentTimeDisplay}
            </span>

            {!myRecordToday ? (
              <button
                type="button"
                onClick={handleQuickPresent}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isBn ? 'এখনই প্রেজেন্ট দিন (1-Click)' : 'Punch Present Now'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setManualExpand(true)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition"
              >
                <span>{isBn ? 'উইন্ডো বিস্তারিত' : 'View Window'}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Expand / Minimize Toggle */}
            <button
              type="button"
              onClick={() => setManualExpand(true)}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition"
              title={isBn ? 'বড় করে দেখুন' : 'Expand'}
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
