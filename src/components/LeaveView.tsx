import React, { useState, useMemo } from 'react';
import { 
  LeaveRecord, 
  User, 
  Language, 
  LeaveStatus 
} from '../types';
import { translations } from '../i18n';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Plus, 
  Search, 
  Filter, 
  UserCheck, 
  Printer, 
  Trash2, 
  Check, 
  X,
  FileText
} from 'lucide-react';

interface LeaveViewProps {
  leaves: LeaveRecord[];
  users: User[];
  currentUser: User;
  language: Language;
  darkMode: boolean;
  onAddLeave: (record: Omit<LeaveRecord, 'id' | 'createdAt'>) => void;
  onUpdateLeaveStatus: (id: string, status: LeaveStatus, rejectionReason?: string) => void;
  onDeleteLeave: (id: string) => void;
}

const LEAVE_TYPES = [
  { id: 'Casual Leave', nameEn: 'Casual Leave (CL)', nameBn: 'নৈমিত্তিক ছুটি (CL)', color: 'bg-blue-500' },
  { id: 'Sick Leave', nameEn: 'Sick Leave (SL)', nameBn: 'অসুস্থতাজনিত ছুটি (SL)', color: 'bg-rose-500' },
  { id: 'Annual Leave', nameEn: 'Annual Leave (AL)', nameBn: 'বার্ষিক ছুটি (AL)', color: 'bg-emerald-500' },
  { id: 'Emergency Leave', nameEn: 'Emergency Leave (EL)', nameBn: 'জরুরি ছুটি (EL)', color: 'bg-amber-500' },
  { id: 'Maternity Leave', nameEn: 'Maternity Leave', nameBn: 'মাতৃত্বকালীন ছুটি', color: 'bg-purple-500' },
  { id: 'Other Leave', nameEn: 'Special / Other', nameBn: 'বিশেষ / অন্যান্য ছুটি', color: 'bg-slate-500' },
];

export const LeaveView: React.FC<LeaveViewProps> = ({
  leaves = [],
  users = [],
  currentUser,
  language,
  darkMode,
  onAddLeave,
  onUpdateLeaveStatus,
  onDeleteLeave,
}) => {
  const isBn = language === 'bn';
  const t = translations[language];

  const canManage = currentUser.accountType === 'hosting' || 
                    currentUser.accountType === 'owner' || 
                    currentUser.accountType === 'md' || 
                    currentUser.accountType === 'admin' ||
                    currentUser.accountType === 'staff';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | LeaveStatus>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [rejectingLeaveId, setRejectingLeaveId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Form State
  const [selectedUserId, setSelectedUserId] = useState(currentUser.id);
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');

  // Calculate days difference
  const daysCount = useMemo(() => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  }, [startDate, endDate]);

  // Today's date in YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // Active leaves today
  const onLeaveToday = useMemo(() => {
    return leaves.filter(l => {
      if (l.status !== 'Approved') return false;
      return l.startDate <= todayStr && l.endDate >= todayStr;
    });
  }, [leaves, todayStr]);

  // Stats
  const totalCount = leaves.length;
  const pendingCount = leaves.filter(l => l.status === 'Pending').length;
  const approvedCount = leaves.filter(l => l.status === 'Approved').length;
  const rejectedCount = leaves.filter(l => l.status === 'Rejected').length;

  // Filtered leaves
  const filteredLeaves = useMemo(() => {
    return leaves.filter(l => {
      // If regular employee, only show their leaves unless admin
      if (!canManage && l.userId !== currentUser.id) return false;

      // Status filter
      if (statusFilter !== 'All' && l.status !== statusFilter) return false;

      // Type filter
      if (typeFilter !== 'All' && l.leaveType !== typeFilter) return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = (l.employeeName || '').toLowerCase().includes(q);
        const matchId = (l.employeeId || '').toLowerCase().includes(q);
        const matchSection = (l.section || '').toLowerCase().includes(q);
        const matchReason = (l.reason || '').toLowerCase().includes(q);
        if (!matchName && !matchId && !matchSection && !matchReason) return false;
      }

      return true;
    });
  }, [leaves, canManage, currentUser.id, statusFilter, typeFilter, searchTerm]);

  // Handle Form Submit
  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetUser = users.find(u => u.id === selectedUserId) || currentUser;

    onAddLeave({
      userId: targetUser.id,
      employeeId: targetUser.employeeId || 'CAF-W',
      employeeName: targetUser.fullName,
      section: targetUser.section || 'Factory Floor',
      leaveType,
      startDate,
      endDate,
      daysCount,
      reason: reason.trim() || 'Personal / General Leave',
      requestDate: new Date().toISOString().split('T')[0],
      status: canManage && selectedUserId === currentUser.id ? 'Approved' : 'Pending',
      approvedBy: canManage && selectedUserId === currentUser.id ? currentUser.fullName : undefined,
      approvalDate: canManage && selectedUserId === currentUser.id ? new Date().toISOString().split('T')[0] : undefined
    });

    setIsApplyModalOpen(false);
    setReason('');
  };

  const handleConfirmReject = () => {
    if (rejectingLeaveId) {
      onUpdateLeaveStatus(rejectingLeaveId, 'Rejected', rejectionReason.trim() || undefined);
      setRejectingLeaveId(null);
      setRejectionReason('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl font-black tracking-tight">
                {isBn ? 'ছুটি ব্যবস্থাপনা ও অনুমোদন' : 'Leave Management & Approvals'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isBn 
                  ? 'কর্মীদের ছুটির আবেদন গ্রহণ, মূল্যায়ন, অনুমোদন এবং হাজিরা খাতার সাথে সিঙ্ক' 
                  : 'Manage employee leave applications, review requests, track leave balances, and sync with attendance'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setIsApplyModalOpen(true)}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-indigo-500/20 cursor-pointer transition"
          >
            <Plus className="w-4 h-4" />
            <span>{isBn ? 'ছুটির আবেদন করুন' : 'Apply for Leave'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* On Leave Today */}
        <div className={`p-4 rounded-2xl border shadow-sm space-y-1 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>{isBn ? 'আজ ছুটিতে আছেন' : 'On Leave Today'}</span>
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
              <UserCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {onLeaveToday.length} <span className="text-xs font-normal text-slate-400">{isBn ? 'জন' : 'pers'}</span>
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            {onLeaveToday.length > 0 
              ? onLeaveToday.map(l => l.employeeName.split(' ')[0]).join(', ')
              : (isBn ? 'আজ কেউ ছুটিতে নেই' : 'No workers on leave today')}
          </div>
        </div>

        {/* Pending Requests */}
        <div className={`p-4 rounded-2xl border shadow-sm space-y-1 ${
          pendingCount > 0 ? (darkMode ? 'bg-amber-950/20 border-amber-800/40' : 'bg-amber-50/60 border-amber-200') : (darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200')
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>{isBn ? 'অপেক্ষমান আবেদন' : 'Pending Requests'}</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {pendingCount}
          </div>
          <div className="text-[11px] text-slate-400">
            {isBn ? 'অনুমোদনের অপেক্ষায়' : 'Awaiting review'}
          </div>
        </div>

        {/* Approved Leaves */}
        <div className={`p-4 rounded-2xl border shadow-sm space-y-1 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>{isBn ? 'অনুমোদিত ছুটি' : 'Approved Leaves'}</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {approvedCount}
          </div>
          <div className="text-[11px] text-slate-400">
            {isBn ? 'গৃহীত আবেদন' : 'Accepted requests'}
          </div>
        </div>

        {/* Total Records */}
        <div className={`p-4 rounded-2xl border shadow-sm space-y-1 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>{isBn ? 'মোট রেকর্ড' : 'Total Applications'}</span>
            <span className="p-1.5 rounded-lg bg-slate-500/10 text-slate-500">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black">
            {totalCount}
          </div>
          <div className="text-[11px] text-slate-400">
            {rejectedCount} {isBn ? 'বাতিলকৃত' : 'rejected'}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={`p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isBn ? 'কর্মীর নাম, আইডি, সেকশন বা কারণ দিয়ে খুঁজুন...' : 'Search employee name, ID, section, reason...'}
            className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 placeholder-slate-400'
            }`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className={`text-xs px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
              darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <option value="All">{isBn ? 'সব স্ট্যাটাস' : 'All Status'}</option>
            <option value="Pending">{isBn ? 'অপেক্ষমান (Pending)' : 'Pending'}</option>
            <option value="Approved">{isBn ? 'অনুমোদিত (Approved)' : 'Approved'}</option>
            <option value="Rejected">{isBn ? 'বাতিল (Rejected)' : 'Rejected'}</option>
            <option value="Cancelled">{isBn ? 'প্রত্যাহার (Cancelled)' : 'Cancelled'}</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={`text-xs px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
              darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <option value="All">{isBn ? 'সব ধরণের ছুটি' : 'All Leave Types'}</option>
            {LEAVE_TYPES.map(lt => (
              <option key={lt.id} value={lt.id}>{isBn ? lt.nameBn : lt.nameEn}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Leave Applications Table / List */}
      <div className={`rounded-3xl border shadow-sm overflow-hidden ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b text-[11px] font-bold uppercase tracking-wider ${
              darkMode ? 'bg-slate-800/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              <tr>
                <th className="py-3 px-4">{isBn ? 'কর্মী' : 'Employee'}</th>
                <th className="py-3 px-4">{isBn ? 'ছুটির ধরণ' : 'Leave Type'}</th>
                <th className="py-3 px-4">{isBn ? 'তারিখ ও মেয়াদ' : 'Duration'}</th>
                <th className="py-3 px-4">{isBn ? 'কারণ' : 'Reason'}</th>
                <th className="py-3 px-4">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                <th className="py-3 px-4 text-right">{isBn ? 'পদক্ষেপ' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold">{isBn ? 'কোন ছুটির রেকর্ড পাওয়া যায়নি' : 'No leave records found'}</p>
                    <p className="text-[11px] mt-0.5">{isBn ? 'নতুন ছুটির আবেদন করতে উপরের বাটনে ক্লিক করুন' : 'Click "Apply for Leave" to create a new application'}</p>
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((record) => {
                  const isPending = record.status === 'Pending';
                  const isApproved = record.status === 'Approved';
                  const isRejected = record.status === 'Rejected';

                  return (
                    <tr key={record.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors`}>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                            {record.employeeName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">
                              {record.employeeName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {record.employeeId} · {record.section}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {record.leaveType}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {record.startDate} {record.startDate !== record.endDate ? `→ ${record.endDate}` : ''}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {record.daysCount} {isBn ? 'দিন' : 'day(s)'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-600 dark:text-slate-300 line-clamp-2">
                          {record.reason}
                        </p>
                        {record.approvalComments && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                            ✓ {record.approvalComments}
                          </div>
                        )}
                        {record.status === 'Rejected' && (
                          <div className="text-[10px] text-rose-500 mt-0.5">
                            ✗ {isBn ? 'বাতিল করা হয়েছে' : 'Rejected'}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {isPending && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1 w-max">
                            <Clock className="w-3 h-3" />
                            {isBn ? 'অপেক্ষমান' : 'Pending'}
                          </span>
                        )}
                        {isApproved && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-3 h-3" />
                            {isBn ? 'অনুমোদিত' : 'Approved'}
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1 w-max">
                            <XCircle className="w-3 h-3" />
                            {isBn ? 'বাতিল' : 'Rejected'}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canManage && isPending && (
                            <>
                              <button
                                onClick={() => onUpdateLeaveStatus(record.id, 'Approved')}
                                title={isBn ? 'অনুমোদন করুন' : 'Approve'}
                                className="p-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold transition cursor-pointer"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setRejectingLeaveId(record.id)}
                                title={isBn ? 'বাতিল করুন' : 'Reject'}
                                className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold transition cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {/* Delete or Cancel */}
                          {(canManage || (record.userId === currentUser.id && isPending)) && (
                            <button
                              onClick={() => {
                                if (confirm(isBn ? 'আপনি কি নিশ্চিতভাবে এই ছুটির রেকর্ড মুছে ফেলতে চান?' : 'Are you sure you want to delete this leave record?')) {
                                  onDeleteLeave(record.id);
                                }
                              }}
                              title={isBn ? 'মুছে ফেলুন' : 'Delete'}
                              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
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

      {/* Apply Leave Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`max-w-md w-full rounded-3xl p-6 border shadow-2xl space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b dark:border-slate-800">
              <h3 className="font-black text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                <span>{isBn ? 'ছুটির আবেদন ফরম' : 'Leave Application Form'}</span>
              </h3>
              <button 
                onClick={() => setIsApplyModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4 text-xs">
              {/* Employee selector (if admin/staff/MD/owner) */}
              {canManage ? (
                <div>
                  <label className="block font-bold text-slate-500 mb-1">
                    {isBn ? 'কর্মচারী নির্বাচন করুন' : 'Select Employee'}
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.employeeId || 'ID'} · {u.section || 'General'})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border dark:border-slate-800">
                  <div className="font-bold">{currentUser.fullName}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{currentUser.employeeId} · {currentUser.section}</div>
                </div>
              )}

              {/* Leave Type */}
              <div>
                <label className="block font-bold text-slate-500 mb-1">
                  {isBn ? 'ছুটির ধরণ' : 'Leave Type'}
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  {LEAVE_TYPES.map(lt => (
                    <option key={lt.id} value={lt.id}>{isBn ? lt.nameBn : lt.nameEn}</option>
                  ))}
                </select>
              </div>

              {/* Date Ranges */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 mb-1">
                    {isBn ? 'শুরুর তারিখ' : 'Start Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (e.target.value > endDate) setEndDate(e.target.value);
                    }}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">
                    {isBn ? 'শেষের তারিখ' : 'End Date'}
                  </label>
                  <input
                    type="date"
                    required
                    min={startDate}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              {/* Days Count banner */}
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold text-center">
                {isBn ? `মোট ছুটির দিন: ${daysCount} দিন` : `Total Days Requested: ${daysCount} Day(s)`}
              </div>

              {/* Reason */}
              <div>
                <label className="block font-bold text-slate-500 mb-1">
                  {isBn ? 'ছুটির কারণ ও বিবরণ' : 'Reason for Leave'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={isBn ? 'ছুটির বিস্তারিত কারণ লিখুন...' : 'Write reason for leave request...'}
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 placeholder-slate-400'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 rounded-xl border hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-sm transition"
                >
                  {isBn ? 'আবেদন জমা দিন' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingLeaveId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`max-w-sm w-full rounded-3xl p-5 border shadow-2xl space-y-3 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="font-black text-sm flex items-center gap-2 text-rose-500">
              <XCircle className="w-5 h-5" />
              <span>{isBn ? 'ছুটি বাতিলের কারণ' : 'Reason for Rejection'}</span>
            </h3>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={isBn ? 'বাতিল করার কারণ লিখুন (ঐচ্ছিক)...' : 'Enter rejection comments (optional)...'}
              className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
              }`}
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingLeaveId(null)}
                className="px-3 py-1.5 text-xs rounded-xl border hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
              >
                {isBn ? 'ফিরে যান' : 'Back'}
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-1.5 text-xs rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer shadow-sm"
              >
                {isBn ? 'বাতিল নিশ্চিত করুন' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
