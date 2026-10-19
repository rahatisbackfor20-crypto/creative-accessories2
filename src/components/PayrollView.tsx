import React, { useState, useMemo } from 'react';
import { User, OvertimeRecord, CompanyProfile, Language, PaymentStatus, PayrollStatusMap, PayrollPayment } from '../types';
import { translations } from '../i18n';
import { formatJoiningDate } from '../storage';
import { UserProfileBadge } from './UserProfileBadge';
import { 
  Printer, 
  MessageCircle, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Filter,
  Zap,
  Check,
  CheckSquare,
  Square,
  Users,
  Briefcase,
  RotateCcw,
  CheckCheck,
  FileSpreadsheet,
  FileText,
  Download,
  CreditCard,
  History
} from 'lucide-react';

interface PayrollViewProps {
  users: User[];
  overtime: OvertimeRecord[];
  currentUser: User;
  companyProfile: CompanyProfile;
  language: Language;
  darkMode: boolean;
  payrollStatusMap: PayrollStatusMap;
  payments?: PayrollPayment[];
  onUpdatePaymentStatus: (userId: string, month: string, status: PaymentStatus) => void;
  onBatchUpdatePaymentStatus?: (userIds: string[], month: string, status: PaymentStatus) => void;
  onRecordPayment?: (payment: Omit<PayrollPayment, 'id' | 'createdAt'>) => void;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
}

export const PayrollView: React.FC<PayrollViewProps> = ({
  users,
  overtime,
  currentUser,
  companyProfile,
  language,
  darkMode,
  payrollStatusMap,
  payments = [],
  onUpdatePaymentStatus,
  onBatchUpdatePaymentStatus,
  onRecordPayment,
  selectedMonth,
  onSelectMonth
}) => {
  const t = translations[language];
  const isBn = language === 'bn';
  const isFullAdmin = currentUser.accountType === 'hosting' || currentUser.accountType === 'admin' || currentUser.adminAccess === 'full';
  const isManager = isFullAdmin || currentUser.accountType === 'md' || currentUser.accountType === 'owner' || currentUser.accountType === 'staff' || currentUser.adminAccess === 'basic';
  
  const [toastMessage, setToastMessage] = useState<string>('');
  const [paymentModalUser, setPaymentModalUser] = useState<{ user: User; grossPay: number } | null>(null);
  const [payAmountInput, setPayAmountInput] = useState<string>('');
  const [payMethod, setPayMethod] = useState<'Cash' | 'bKash' | 'Nagad' | 'Bank Transfer' | 'Other'>('Cash');
  const [payRef, setPayRef] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');
  const [payDate, setPayDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'employee' | 'staff'>('all');
  const [printMenuOpen, setPrintMenuOpen] = useState<boolean>(false);
  const [quickPayMenuOpen, setQuickPayMenuOpen] = useState<boolean>(false);

  // Filter public users for payroll
  const publicUsers = useMemo(() => {
    return users.filter(u => u.accountType !== 'hosting' && u.accountType !== 'admin');
  }, [users]);

  // All workers (factory floor operators, cutting, sewing, etc.)
  const allWorkers = useMemo(() => {
    return publicUsers.filter(u => u.accountType === 'employee');
  }, [publicUsers]);

  // All staff (office staff, supervisors, management, MD)
  const allStaff = useMemo(() => {
    return publicUsers.filter(u => u.accountType === 'staff' || u.accountType === 'md');
  }, [publicUsers]);

  // Current visible users based on category filter
  const visibleUsers = useMemo(() => {
    if (!isManager) {
      return users.filter(u => u.id === currentUser.id);
    }
    if (categoryFilter === 'employee') {
      return allWorkers;
    }
    if (categoryFilter === 'staff') {
      return allStaff;
    }
    return publicUsers;
  }, [isManager, users, currentUser.id, categoryFilter, allWorkers, allStaff, publicUsers]);

  // Month options for dropdown: previous 3 months, current, and next 2 months
  const monthOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    const baseDate = new Date();
    for (let i = -3; i <= 3; i++) {
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1);
      const val = d.toISOString().substring(0, 7);
      const monthName = d.toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { month: 'long', year: 'numeric' });
      options.push({ value: val, label: monthName });
    }
    return options;
  }, [isBn]);

  // Helper to get status for employee in selected month
  const getStatus = (userId: string): PaymentStatus => {
    const key = `${userId}_${selectedMonth}`;
    return payrollStatusMap[key] || 'Due';
  };

  const [showPayrollCostBreakdown, setShowPayrollCostBreakdown] = useState<boolean>(true);

  // Calculations for total Paid, Due, Pending & Sector/Section Distribution
  let totalPayrollGross = 0;
  let totalPaidAmount = 0;
  let totalDueAmount = 0;
  let totalPendingAmount = 0;
  let totalBasicWages = 0;
  let totalOtWages = 0;
  let totalOtHours = 0;
  let workerTotalGross = 0;
  let staffTotalGross = 0;

  const sectionPayrollMap: Record<string, { total: number; count: number; name: string }> = {};

  visibleUsers.forEach((user) => {
    const userOvertime = overtime.filter(o => {
      const oMonth = (o.date || '').substring(0, 7);
      return o.userId === user.id && o.status === 'Approved' && (!oMonth || oMonth === selectedMonth);
    });
    const otHours = userOvertime.reduce((sum, o) => sum + Number(o.hours || 0), 0);
    const otEarnings = otHours * Number(user.hourlyRate || 0);
    const basic = Number(user.basicSalary || 0);
    const grossPay = basic + otEarnings;

    totalBasicWages += basic;
    totalOtWages += otEarnings;
    totalOtHours += otHours;

    if (user.accountType === 'employee') {
      workerTotalGross += grossPay;
    } else {
      staffTotalGross += grossPay;
    }

    const sec = user.section || 'General';
    if (!sectionPayrollMap[sec]) sectionPayrollMap[sec] = { total: 0, count: 0, name: sec };
    sectionPayrollMap[sec].total += grossPay;
    sectionPayrollMap[sec].count += 1;

    totalPayrollGross += grossPay;
    const st = getStatus(user.id);
    if (st === 'Paid') totalPaidAmount += grossPay;
    else if (st === 'Due') totalDueAmount += grossPay;
    else if (st === 'Pending') totalPendingAmount += grossPay;
  });

  const sectionPayrollList = Object.values(sectionPayrollMap).map(item => ({
    ...item,
    pct: totalPayrollGross > 0 ? Math.round((item.total / totalPayrollGross) * 100) : 0
  })).sort((a, b) => b.total - a.total);

  // Due users counts
  const allDueUsers = useMemo(() => {
    return publicUsers.filter(u => getStatus(u.id) !== 'Paid');
  }, [publicUsers, payrollStatusMap, selectedMonth]);

  const dueWorkers = useMemo(() => {
    return allWorkers.filter(u => getStatus(u.id) !== 'Paid');
  }, [allWorkers, payrollStatusMap, selectedMonth]);

  const dueStaff = useMemo(() => {
    return allStaff.filter(u => getStatus(u.id) !== 'Paid');
  }, [allStaff, payrollStatusMap, selectedMonth]);

  // Counts of currently selected items per category
  const selectedWorkerCount = useMemo(() => {
    return allWorkers.filter(w => selectedUserIds.has(w.id)).length;
  }, [allWorkers, selectedUserIds]);

  const selectedStaffCount = useMemo(() => {
    return allStaff.filter(s => selectedUserIds.has(s.id)).length;
  }, [allStaff, selectedUserIds]);

  // Whether all users in the currently active category filter are selected
  const isCategoryAllSelected = useMemo(() => {
    if (visibleUsers.length === 0) return false;
    return visibleUsers.every(u => selectedUserIds.has(u.id));
  }, [visibleUsers, selectedUserIds]);

  // Batch update helper
  const executeBatchUpdate = (targetUserIds: string[], status: PaymentStatus, successMsg: string) => {
    if (targetUserIds.length === 0) return;
    if (onBatchUpdatePaymentStatus) {
      onBatchUpdatePaymentStatus(targetUserIds, selectedMonth, status);
    } else {
      targetUserIds.forEach(id => onUpdatePaymentStatus(id, selectedMonth, status));
    }
    setToastMessage(successMsg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  // Toggle 'Select All' for the active category filter (Workers vs Staff vs All)
  const handleToggleSelectAllCategory = () => {
    if (isCategoryAllSelected) {
      // Deselect all users in the currently active category
      setSelectedUserIds(prev => {
        const next = new Set(prev);
        visibleUsers.forEach(u => next.delete(u.id));
        return next;
      });
    } else {
      // Select all users in the currently active category
      setSelectedUserIds(prev => {
        const next = new Set(prev);
        visibleUsers.forEach(u => next.add(u.id));
        return next;
      });
    }
  };

  // Dedicated toggle for Workers specifically
  const handleToggleWorkersOnly = () => {
    const workerIds = allWorkers.map(w => w.id);
    const allSelected = workerIds.length > 0 && workerIds.every(id => selectedUserIds.has(id));
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        workerIds.forEach(id => next.delete(id));
      } else {
        workerIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  // Dedicated toggle for Staff specifically
  const handleToggleStaffOnly = () => {
    const staffIds = allStaff.map(s => s.id);
    const allSelected = staffIds.length > 0 && staffIds.every(id => selectedUserIds.has(id));
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        staffIds.forEach(id => next.delete(id));
      } else {
        staffIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  // 1. Pay All (Workers + Staff)
  const handlePayAll = () => {
    const targetIds = allDueUsers.length > 0 ? allDueUsers.map(u => u.id) : publicUsers.map(u => u.id);
    if (targetIds.length === 0) return;
    executeBatchUpdate(
      targetIds, 
      'Paid', 
      isBn 
        ? `⚡ সফলভাবে ${targetIds.length} জন কর্মী ও স্টাফের বেতন পরিশোধিত (Paid) করা হয়েছে!` 
        : `⚡ Successfully marked all ${targetIds.length} workers & staff as Paid!`
    );
    setSelectedUserIds(new Set());
  };

  // 2. Pay All Workers (Employees only)
  const handlePayWorkersAll = () => {
    const targetIds = dueWorkers.length > 0 ? dueWorkers.map(u => u.id) : allWorkers.map(u => u.id);
    if (targetIds.length === 0) {
      setToastMessage(isBn ? 'কোনো ওয়ার্কার পাওয়া যায়নি।' : 'No workers found.');
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }
    executeBatchUpdate(
      targetIds, 
      'Paid', 
      isBn 
        ? `👷 সফলভাবে ${targetIds.length} জন কারখানার শ্রমিকের (Workers) বেতন পরিশোধিত (Paid) করা হয়েছে!` 
        : `👷 Successfully marked all ${targetIds.length} factory workers as Paid!`
    );
  };

  // 3. Pay All Staff (Office/Management staff only)
  const handlePayStaffAll = () => {
    const targetIds = dueStaff.length > 0 ? dueStaff.map(u => u.id) : allStaff.map(u => u.id);
    if (targetIds.length === 0) {
      setToastMessage(isBn ? 'কোনো স্টাফ পাওয়া যায়নি।' : 'No staff found.');
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }
    executeBatchUpdate(
      targetIds, 
      'Paid', 
      isBn 
        ? `👔 সফলভাবে ${targetIds.length} জন অফিস ও ম্যানেজমেন্ট স্টাফের বেতন পরিশোধিত (Paid) করা হয়েছে!` 
        : `👔 Successfully marked all ${targetIds.length} staff members as Paid!`
    );
  };

  // 4. Mark All Due (Reset)
  const handleResetAllToDue = () => {
    const allIds = publicUsers.map(u => u.id);
    executeBatchUpdate(
      allIds,
      'Due',
      isBn ? `সকল ${allIds.length} জন কর্মীর বেতন বকেয়া (Due) হিসেবে রিসেট করা হয়েছে।` : `Reset all ${allIds.length} staff to Due status.`
    );
    setSelectedUserIds(new Set());
  };

  // Multi-select individual toggle
  const handleToggleSelectUser = (userId: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  // Bulk Payment status update for whatever is currently selected
  const handleBatchSelectedAction = (status: PaymentStatus) => {
    const ids = Array.from(selectedUserIds);
    if (ids.length === 0) return;

    // Detect category composition of selected IDs for tailored feedback message
    const isOnlyWorkers = ids.every(id => allWorkers.some(w => w.id === id));
    const isOnlyStaff = ids.every(id => allStaff.some(s => s.id === id));
    
    let categoryNameBn = 'কর্মী ও স্টাফের';
    let categoryNameEn = 'workers & staff';
    if (isOnlyWorkers) {
      categoryNameBn = 'কারখানা শ্রমিকের (Workers)';
      categoryNameEn = 'factory workers';
    } else if (isOnlyStaff) {
      categoryNameBn = 'স্টাফের (Staff)';
      categoryNameEn = 'staff members';
    }

    const statusTextBn = status === 'Paid' ? 'পরিশোধিত (Paid)' : status === 'Due' ? 'বকেয়া (Due)' : 'অপেক্ষমাণ (Pending)';

    executeBatchUpdate(
      ids,
      status,
      isBn 
        ? `✓ নির্বাচিত ${ids.length} জন ${categoryNameBn} বেতন '${statusTextBn}' সফলভাবে আপডেট করা হয়েছে!`
        : `✓ Successfully updated ${ids.length} ${categoryNameEn} to ${status}!`
    );
    setSelectedUserIds(new Set());
  };

  // Quick single worker toggle
  const handleQuickTogglePayment = (userId: string) => {
    const current = getStatus(userId);
    const next: PaymentStatus = current === 'Paid' ? 'Due' : 'Paid';
    onUpdatePaymentStatus(userId, selectedMonth, next);
    setToastMessage(next === 'Paid' 
      ? (isBn ? '✓ বেতন এক ক্লিকে পরিশোধিত (Paid) করা হয়েছে!' : '✓ Worker marked as Paid!') 
      : (isBn ? 'বেতন বকেয়া (Due) হিসেবে চিহ্নিত করা হয়েছে।' : 'Worker marked as Due.'));
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handlePrintAllPayslips = () => {
    // 1. Try native browser print
    try {
      window.print();
    } catch (e) {
      console.warn('Native window.print in iframe:', e);
    }

    // 2. Generate and download standalone printable Pay Slips document with auto-print
    const slipsHtml = visibleUsers.map(user => {
      const userOvertime = overtime.filter(o => {
        const oMonth = (o.date || '').substring(0, 7);
        return o.userId === user.id && o.status === 'Approved' && (!oMonth || oMonth === selectedMonth);
      });
      const otHours = userOvertime.reduce((sum, o) => sum + Number(o.hours || 0), 0);
      const otEarnings = otHours * Number(user.hourlyRate || 0);
      const grossPay = Number(user.basicSalary || 0) + otEarnings;
      const status = getStatus(user.id);

      return `
        <div class="slip">
          <div class="slip-header">
            <div>
              <div class="company">${companyProfile.name}</div>
              <div class="factory-info">Official Pay Slip · Month: ${selectedMonth} · Reg: ${companyProfile.factoryRegNo}</div>
            </div>
            <div class="status ${status.toLowerCase()}">${status === 'Paid' ? 'PAID' : status === 'Due' ? 'DUE' : 'PENDING'}</div>
          </div>
          <div class="emp-row">
            <div>
              <div class="emp-name">${user.fullName}</div>
              <div class="emp-meta">${user.designation || 'Worker'} · ${user.section || 'General'} Section</div>
            </div>
            <div class="emp-id">ID: ${user.employeeId}</div>
          </div>
          <table class="slip-table">
            <tr><td>Joining Date</td><td class="text-right">${formatJoiningDate(user.joiningDate)} (${user.joiningDate})</td></tr>
            <tr><td>Basic Salary</td><td class="text-right">৳ ${Number(user.basicSalary || 0).toLocaleString()}</td></tr>
            <tr><td>Approved Overtime</td><td class="text-right">${otHours.toFixed(1)} hrs @ ৳${Number(user.hourlyRate || 0).toFixed(2)}/hr (৳ ${otEarnings.toLocaleString()})</td></tr>
            <tr class="gross"><td><strong>Total Net/Gross Payable</strong></td><td class="text-right"><strong>৳ ${grossPay.toLocaleString()}</strong></td></tr>
          </table>
          <div class="signature-line">
            <div>Employee Signature</div>
            <div>Authorized Accounts Signature</div>
          </div>
        </div>
      `;
    }).join('');

    const fullDocumentHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${companyProfile.name} - Payroll Slips (${selectedMonth})</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 20px; }
    .print-controls { max-width: 800px; margin: 0 auto 20px; display: flex; justify-content: space-between; align-items: center; background: white; padding: 15px 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
    .btn { padding: 10px 20px; border-radius: 8px; font-weight: 700; font-size: 13px; border: none; cursor: pointer; background: #4f46e5; color: white; }
    .page { max-width: 800px; margin: 0 auto; display: grid; grid-template-columns: 1fr; gap: 20px; }
    .slip { background: white; border: 1.5px solid #cbd5e1; border-radius: 16px; padding: 20px; page-break-inside: avoid; }
    .slip-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; margin-bottom: 12px; }
    .company { font-size: 15px; font-weight: 900; color: #1e1b4b; text-transform: uppercase; }
    .factory-info { font-size: 11px; color: #64748b; margin-top: 2px; }
    .status { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 900; }
    .status.paid { background: #dcfce7; color: #166534; }
    .status.due { background: #ffe4e6; color: #9f1239; }
    .status.pending { background: #fef3c7; color: #92400e; }
    .emp-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
    .emp-name { font-size: 14px; font-weight: 800; color: #0f172a; }
    .emp-meta { font-size: 11px; color: #64748b; }
    .emp-id { font-family: monospace; font-weight: 800; color: #4f46e5; font-size: 12px; }
    .slip-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 15px; }
    .slip-table td { padding: 6px 0; border-bottom: 1px dashed #e2e8f0; }
    .slip-table tr.gross td { border-top: 2px solid #e2e8f0; border-bottom: none; font-size: 13px; color: #4338ca; padding-top: 8px; }
    .text-right { text-align: right; }
    .signature-line { display: flex; justify-content: space-between; margin-top: 25px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 700; }
    @media print {
      .print-controls { display: none !important; }
      body { background: white !important; padding: 0 !important; }
      .page { max-width: 100% !important; }
    }
  </style>
</head>
<body>
  <div class="print-controls">
    <div><strong>${companyProfile.name}</strong> · Monthly Payroll Slips (${selectedMonth})</div>
    <button class="btn" onclick="window.print()">🖨️ প্রিন্ট করুন (Print Now / Save as PDF)</button>
  </div>
  <div class="page">
    ${slipsHtml}
  </div>
  <script>
    setTimeout(function() {
      try { window.print(); } catch(e){}
    }, 400);
  </script>
</body>
</html>`;

    const blob = new Blob([fullDocumentHtml], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `Payroll_Slips_${selectedMonth}_${companyProfile.name.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);

    setToastMessage(isBn ? '✓ পে-স্লিপ প্রিন্ট ফাইল ডাউনলোড সম্পন্ন হয়েছে!' : 'Payroll slips print document downloaded!');
    setTimeout(() => setToastMessage(''), 4500);
  };

  // Excel / CSV Export for external accounting systems, Tally, QuickBooks
  const handleExportExcel = () => {
    const headers = [
      'Sl No',
      'Employee ID',
      'Full Name',
      'Category / Role',
      'Designation',
      'Section',
      'Department',
      'WhatsApp / Phone',
      'Joining Date',
      'Basic Salary (BDT)',
      'Approved OT (Hours)',
      'Hourly Rate (BDT)',
      'OT Earnings (BDT)',
      'Gross Payable (BDT)',
      'Payment Status',
      'Salary Month',
      'Export Date'
    ];

    const dataRows = visibleUsers.map((user, idx) => {
      const userOvertime = overtime.filter(o => {
        const oMonth = (o.date || '').substring(0, 7);
        return o.userId === user.id && o.status === 'Approved' && (!oMonth || oMonth === selectedMonth);
      });
      const otHours = userOvertime.reduce((sum, o) => sum + Number(o.hours || 0), 0);
      const otEarnings = otHours * Number(user.hourlyRate || 0);
      const grossPay = Number(user.basicSalary || 0) + otEarnings;
      const status = getStatus(user.id);
      const role = user.accountType === 'employee' ? 'Worker' : user.accountType === 'staff' ? 'Staff' : user.accountType === 'md' ? 'Management (MD)' : 'Admin';

      return [
        idx + 1,
        `"${user.employeeId}"`,
        `"${user.fullName.replace(/"/g, '""')}"`,
        `"${role}"`,
        `"${(user.designation || '').replace(/"/g, '""')}"`,
        `"${(user.section || '').replace(/"/g, '""')}"`,
        `"${(user.department || '').replace(/"/g, '""')}"`,
        `"${(user.whatsapp || '').replace(/"/g, '""')}"`,
        `"${user.joiningDate || ''}"`,
        Number(user.basicSalary || 0).toFixed(2),
        otHours.toFixed(2),
        Number(user.hourlyRate || 0).toFixed(2),
        otEarnings.toFixed(2),
        grossPay.toFixed(2),
        `"${status}"`,
        `"${selectedMonth}"`,
        `"${new Date().toLocaleDateString('en-GB')}"`
      ].join(',');
    });

    const summaryRows = [
      '',
      `"--- FINANCIAL SUMMARY (${selectedMonth}) ---",,,,,,,,,,,,,,,,`,
      `"Total Selected Employees",${visibleUsers.length},,,,,,,,,,,,,,,`,
      `"Total Gross Payable (BDT)",${totalPayrollGross.toFixed(2)},,,,,,,,,,,,,,,`,
      `"Total Paid Amount (BDT)",${totalPaidAmount.toFixed(2)},,,,,,,,,,,,,,,`,
      `"Total Due Amount (BDT)",${totalDueAmount.toFixed(2)},,,,,,,,,,,,,,,`,
      `"Company","${companyProfile.name.replace(/"/g, '""')} - Factory Reg: ${companyProfile.factoryRegNo}",,,,,,,,,,,,,,,`
    ];

    // Prepend UTF-8 BOM so Microsoft Excel opens Unicode Bengali text and numbers cleanly
    const csvContent = '\uFEFF' + [headers.join(','), ...dataRows, ...summaryRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `Payroll_Export_${selectedMonth}_${companyProfile.name.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);

    setToastMessage(isBn 
      ? '📊 এক্সেল (Excel/CSV) ফাইল সফলভাবে তৈরি ও ডাউনলোড সম্পন্ন হয়েছে!' 
      : '📊 Excel/CSV payroll summary exported successfully!');
    setTimeout(() => setToastMessage(''), 4500);
  };

  const cardBg = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900';

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white font-extrabold text-xs sm:text-sm shadow-xl flex items-center justify-between gap-3 animate-fade-in no-print border-2 border-emerald-400">
          <div className="flex items-center gap-2.5">
            <Zap className="w-5 h-5 fill-amber-300 text-amber-300 animate-pulse shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button 
            type="button"
            onClick={() => setToastMessage('')}
            className="text-white hover:text-emerald-200 text-xs font-black px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/30 cursor-pointer transition"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Sleek Single-Line Tab Bar (Staff, Worker, All, Month, 1-Click Pay, and Print History on the right) */}
      <div className={`border rounded-2xl p-2.5 sm:p-3 shadow-xs ${cardBg} no-print`}>
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Left: Category Tab Bar (All, Workers, Staff) */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                categoryFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{isBn ? 'সকল' : 'All'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-200 dark:bg-slate-700">
                {publicUsers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter('employee')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                categoryFilter === 'employee'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{isBn ? 'ওয়ার্কার (Workers)' : 'Workers'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                {allWorkers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter('staff')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                categoryFilter === 'staff'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>{isBn ? 'স্টাফ (Staff)' : 'Staff'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                {allStaff.length}
              </span>
            </button>
          </div>

          {/* Middle: Month Selector & Quick 1-Click Pay Dropdown */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Month Filter */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
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

            {/* Quick 1-Click Pay Button / Dropdown for Admin */}
            {isManager && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setQuickPayMenuOpen(!quickPayMenuOpen)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition active:scale-95"
                  title="১-ক্লিকে বেতন পরিশোধের মেনু"
                >
                  <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  <span>{isBn ? '⚡ ১-ক্লিকে পে ▾' : '⚡ 1-Click Pay ▾'}</span>
                  {allDueUsers.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-black/25 text-white text-[10px] font-mono font-black">
                      {allDueUsers.length}
                    </span>
                  )}
                </button>

                {quickPayMenuOpen && (
                  <div className={`absolute left-0 mt-1.5 w-60 rounded-2xl border shadow-2xl p-2 z-30 space-y-1 animate-in fade-in zoom-in-95 ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    <button
                      type="button"
                      onClick={() => { setQuickPayMenuOpen(false); handlePayAll(); }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-bold flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                        <span>{isBn ? 'সকল কর্মী পে (Pay All)' : 'Pay All Workers & Staff'}</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">({allDueUsers.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setQuickPayMenuOpen(false); handlePayWorkersAll(); }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-bold flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        <span>{isBn ? 'সকল ওয়ার্কার পে' : 'Pay All Workers'}</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">({dueWorkers.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setQuickPayMenuOpen(false); handlePayStaffAll(); }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/40 text-xs font-bold flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                        <span>{isBn ? 'সকল স্টাফ পে' : 'Pay All Staff'}</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">({dueStaff.length})</span>
                    </button>
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                      <button
                        type="button"
                        onClick={() => { setQuickPayMenuOpen(false); handleResetAllToDue(); }}
                        className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px] font-bold text-rose-600 flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{isBn ? 'সকলকে বকেয়া (Due) রিসেট করুন' : 'Reset All to Due'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Print History & Excel Export (Compact buttons inside the tab bar) */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            {/* Print History Option */}
            <button
              type="button"
              onClick={handlePrintAllPayslips}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-extrabold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
              title={isBn ? 'পে-স্লিপ প্রিন্ট হিস্টরি বা পিডিএফ হিসেবে সেভ করুন' : 'Print History & Pay Slips'}
            >
              <Printer className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isBn ? '🖨️ প্রিন্ট হিস্টরি' : '🖨️ Print History'}</span>
            </button>

            {/* Export Excel Option */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs transition flex items-center gap-1 cursor-pointer shadow-2xs"
              title={isBn ? 'এক্সেল ফাইল ডাউনলোড করুন' : 'Export Excel'}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isBn ? 'এক্সেল' : 'Excel'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Compact Financial Overview Metrics (4-stat grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Total Gross */}
        <div className={`border rounded-2xl p-3 sm:p-4 space-y-0.5 shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider">{isBn ? 'মোট বেতন বিল' : 'Total Gross'}</span>
            <DollarSign className="w-3.5 h-3.5" />
          </div>
          <div className="text-base sm:text-xl font-black font-mono tabular-nums">
            ৳ {totalPayrollGross.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 font-mono truncate">
            {visibleUsers.length} {categoryFilter === 'employee' ? (isBn ? 'জন ওয়ার্কার' : 'workers') : categoryFilter === 'staff' ? (isBn ? 'জন স্টাফ' : 'staff') : (isBn ? 'জন কর্মী' : 'staff')}
          </p>
        </div>

        {/* Total Paid (Green) */}
        <div className={`border rounded-2xl p-3 sm:p-4 space-y-0.5 shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider">{isBn ? 'পরিশোধিত (Paid)' : 'Total Paid'}</span>
            <CheckCircle className="w-3.5 h-3.5" />
          </div>
          <div className="text-base sm:text-xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            ৳ {totalPaidAmount.toLocaleString()}
          </div>
          <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold font-mono">
            {totalPayrollGross > 0 ? Math.round((totalPaidAmount / totalPayrollGross) * 100) : 0}% {isBn ? 'পরিশোধ' : 'paid'}
          </p>
        </div>

        {/* Total Due (Red) */}
        <div className={`border rounded-2xl p-3 sm:p-4 space-y-0.5 shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider">{isBn ? 'বকেয়া (Due)' : 'Total Due'}</span>
            <AlertCircle className="w-3.5 h-3.5" />
          </div>
          <div className="text-base sm:text-xl font-black font-mono tabular-nums text-rose-600 dark:text-rose-400">
            ৳ {totalDueAmount.toLocaleString()}
          </div>
          <p className="text-[10px] text-rose-600 dark:text-rose-400 font-mono truncate">
            {allDueUsers.length} {isBn ? 'জনের বাকি' : 'due'}
          </p>
        </div>

        {/* Total Pending (Yellow/Amber) */}
        <div className={`border rounded-2xl p-3 sm:p-4 space-y-0.5 shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider">{isBn ? 'পেন্ডিং (Pending)' : 'Pending'}</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="text-base sm:text-xl font-black font-mono tabular-nums text-amber-600 dark:text-amber-400">
            ৳ {totalPendingAmount.toLocaleString()}
          </div>
          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-mono truncate">
            {visibleUsers.filter(u => getStatus(u.id) === 'Pending').length} {isBn ? 'জন অপেক্ষমাণ' : 'on hold'}
          </p>
        </div>
      </div>

      {/* 2.2 Payroll & Wages Cost Breakdown Card ("কোথায় কত টাকার খরচ হলো") */}
      {isManager && (
        <div className={`p-4 sm:p-5 rounded-3xl border shadow-xs space-y-4 no-print ${cardBg}`}>
          <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <DollarSign className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{isBn ? 'কোথায় কত টাকার খরচ হলো (পেরোল ও মজুরি বিশ্লেষণ)' : 'Payroll & Wages Cost Breakdown'}</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isBn ? 'মূল বেতন, ওভারটাইম খরচ এবং সেকশনভিত্তিক মজুরি বণ্টনের হিসাব' : 'Distribution between basic pay, overtime hours, and factory sections'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPayrollCostBreakdown(!showPayrollCostBreakdown)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              {showPayrollCostBreakdown ? (isBn ? 'সংক্ষেপ করুন ▲' : 'Collapse ▲') : (isBn ? 'বিস্তারিত দেখুন ▼' : 'Expand ▼')}
            </button>
          </div>

          {showPayrollCostBreakdown && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Primary 3-Metric Distribution */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Basic Wages */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {isBn ? 'মূল বেতন বাবদ খরচ (Basic Pay)' : 'Basic Salaries Total'}
                  </span>
                  <div className="text-base font-black font-mono text-slate-900 dark:text-white">
                    ৳ {totalBasicWages.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold">
                    {totalPayrollGross > 0 ? Math.round((totalBasicWages / totalPayrollGross) * 100) : 0}% {isBn ? 'মোট পেরোলের' : 'of total gross'}
                  </div>
                </div>

                {/* 2. Overtime Wages */}
                <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-1">
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                    {isBn ? 'ওভারটাইম ওটি বিল বাবদ খরচ' : 'Overtime Wages Total'}
                  </span>
                  <div className="text-base font-black font-mono text-amber-600 dark:text-amber-400">
                    ৳ {totalOtWages.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold font-mono">
                    {totalOtHours.toFixed(1)} {isBn ? 'ঘণ্টা ওটি সম্পন্ন' : 'total OT hours'}
                  </div>
                </div>

                {/* 3. Workers vs Staff Wage Split */}
                <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 space-y-1.5">
                  <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
                    {isBn ? 'ওয়ার্কার বনাম স্টাফ মজুরি বণ্টন' : 'Worker vs Staff Allocation'}
                  </span>
                  <div className="flex items-center justify-between text-xs font-mono font-bold">
                    <span className="text-blue-700 dark:text-blue-300">
                      {isBn ? 'ওয়ার্কার' : 'Workers'}: ৳{workerTotalGross.toLocaleString()}
                    </span>
                    <span className="text-purple-700 dark:text-purple-300">
                      {isBn ? 'স্টাফ' : 'Staff'}: ৳{staffTotalGross.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden flex">
                    <div
                      className="bg-blue-600 h-full"
                      style={{ width: `${totalPayrollGross > 0 ? (workerTotalGross / totalPayrollGross) * 100 : 50}%` }}
                      title="Workers"
                    />
                    <div
                      className="bg-purple-600 h-full"
                      style={{ width: `${totalPayrollGross > 0 ? (staffTotalGross / totalPayrollGross) * 100 : 50}%` }}
                      title="Staff"
                    />
                  </div>
                </div>
              </div>

              {/* Section-by-Section Payroll Distribution */}
              {sectionPayrollList.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                    {isBn ? 'সেকশনভিত্তিক বেতন খরচ বণ্টন (Section-Wise Wages):' : 'Section-Wise Wage Allocation:'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {sectionPayrollList.map((sec, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                            {sec.name}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                            {sec.pct}%
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400">
                            ৳ {sec.total.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold font-mono">
                            {sec.count} {isBn ? 'জন কর্মী' : 'staff'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-1 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full"
                            style={{ width: `${Math.min(100, Math.max(5, sec.pct))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2.5 Multi-Select & Batch Actions Bar (shown when users select cards or toggle select all) */}
      {isManager && (
        <div className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-2.5 transition-all no-print ${
          selectedUserIds.size > 0 
            ? 'bg-indigo-50 border-indigo-300 dark:bg-indigo-950/40 dark:border-indigo-700' 
            : 'bg-slate-50 border-slate-200 dark:bg-slate-900/60 dark:border-slate-800'
        }`}>
          {/* Select all toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSelectAllCategory}
              className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-100 cursor-pointer select-none"
            >
              {isCategoryAllSelected ? (
                <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>
                {isCategoryAllSelected
                  ? (isBn ? 'সব আনসিলেক্ট করুন' : 'Deselect All')
                  : (isBn ? `সকল ${categoryFilter === 'employee' ? 'ওয়ার্কার' : categoryFilter === 'staff' ? 'স্টাফ' : 'কর্মী'} একসাথে সিলেক্ট করুন` : 'Select All')}
              </span>
            </button>
            {selectedUserIds.size > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white font-mono text-[10px] font-black">
                {selectedUserIds.size} {isBn ? 'জন নির্বাচিত' : 'Selected'}
              </span>
            )}
          </div>

          {/* Batch Status Buttons */}
          {selectedUserIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 animate-fade-in">
              <button
                type="button"
                onClick={() => handleBatchSelectedAction('Paid')}
                className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider transition flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>{isBn ? '✓ পেইড (Paid)' : 'Mark Paid'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleBatchSelectedAction('Pending')}
                className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider transition flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{isBn ? '⏳ পেন্ডিং' : 'Pending'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleBatchSelectedAction('Due')}
                className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider transition flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{isBn ? '✗ বকেয়া' : 'Due'}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedUserIds(new Set())}
                className="px-2 py-1 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700 transition"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. Underneath the Tab Bar: Boxes of Employees with Name, ID, Salary & beside it Paid/Pending Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 w-full">
        {visibleUsers.length === 0 ? (
          <div className={`col-span-full border rounded-2xl p-8 text-center text-slate-400 font-bold text-xs ${cardBg}`}>
            {isBn ? 'এই ক্যাটাগরিতে কোনো কর্মী পাওয়া যায়নি।' : 'No employees found in this category.'}
          </div>
        ) : (
          visibleUsers.map((user) => {
            const userOvertime = overtime.filter(o => {
              const oMonth = (o.date || '').substring(0, 7);
              return o.userId === user.id && o.status === 'Approved' && (!oMonth || oMonth === selectedMonth);
            });
            const otHours = userOvertime.reduce((sum, o) => sum + Number(o.hours || 0), 0);
            const otEarnings = otHours * Number(user.hourlyRate || 0);
            const grossPay = Number(user.basicSalary || 0) + otEarnings;

            const currentPaymentStatus = getStatus(user.id);
            const isSelected = selectedUserIds.has(user.id);
            const isWorker = user.accountType === 'employee';

            const cleanWaNumber = (user.whatsapp || '').replace(/[^0-9]/g, '');
            const waStatusText = currentPaymentStatus === 'Paid' 
              ? (isBn ? 'পরিশোধিত (Paid)' : 'Paid') 
              : currentPaymentStatus === 'Due' 
                ? (isBn ? 'বকেয়া (Due)' : 'Due') 
                : (isBn ? 'পরে দেওয়া হবে (Pending)' : 'Pending');

            const waMessage = `Official Monthly Pay Slip - ${companyProfile.name}\n` +
              `Month: ${selectedMonth}\n` +
              `Employee: ${user.fullName} (${user.employeeId})\n` +
              `Designation: ${user.designation}\n` +
              `Joining Date: ${formatJoiningDate(user.joiningDate)} (${user.joiningDate})\n` +
              `Basic Salary: ৳${Number(user.basicSalary || 0).toLocaleString()}\n` +
              `Approved Overtime: ${otHours.toFixed(1)} hrs (৳${otEarnings.toLocaleString()})\n` +
              `Total Net/Gross Payable: ৳${grossPay.toLocaleString()}\n` +
              `Payment Status: ${waStatusText}`;

            return (
              <div 
                key={user.id}
                className={`border rounded-2xl p-4 space-y-3 shadow-xs transition relative overflow-hidden ${cardBg} ${
                  isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20' : ''
                }`}
              >
                {/* Employee Box Top: Checkbox, Name, ID, Designation & Role */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 min-w-0">
                    {isManager && (
                      <button
                        type="button"
                        onClick={() => handleToggleSelectUser(user.id)}
                        className="mt-0.5 text-slate-400 hover:text-indigo-600 cursor-pointer no-print shrink-0"
                        title={isSelected ? 'Deselect' : 'Select'}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight truncate">
                          {user.fullName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          ({user.employeeId})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                        <span className="font-medium text-indigo-600 dark:text-indigo-400 truncate">{user.designation || 'Worker'}</span>
                        <span>·</span>
                        <span className="truncate">{user.section || 'General'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Role Category Tag */}
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                    isWorker 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300' 
                      : 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300'
                  }`}>
                    {isWorker ? (isBn ? 'ওয়ার্কার' : 'Worker') : (isBn ? 'স্টাফ' : 'Staff')}
                  </span>
                </div>

                {/* Salary Box: Net Payable + Basic & Overtime breakdown */}
                <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {isBn ? 'বেতন (Net Payable):' : 'Net Salary:'}
                    </span>
                    <span className="font-mono font-black text-sm sm:text-base text-emerald-600 dark:text-emerald-400 tabular-nums">
                      ৳ {grossPay.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 border-t border-dashed border-slate-200 dark:border-slate-700 pt-1">
                    <span>{isBn ? 'মূল:' : 'Basic:'} ৳{Number(user.basicSalary || 0).toLocaleString()}</span>
                    <span>{isBn ? 'ওটি:' : 'OT:'} {otHours.toFixed(1)}h (৳{otEarnings.toLocaleString()})</span>
                  </div>
                </div>

                {/* Beside it: Salary Status Selector (Paid / Pending / Due) & 1-Click Pay */}
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 min-w-0 flex-1">
                    {/* 1-Click Pay Quick Toggle */}
                    {isManager && (
                      <button
                        type="button"
                        onClick={() => handleQuickTogglePayment(user.id)}
                        className={`px-2 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition cursor-pointer select-none shrink-0 ${
                          currentPaymentStatus === 'Paid'
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                        }`}
                        title={currentPaymentStatus === 'Paid' ? (isBn ? 'বকেয়া (Due) করুন' : 'Mark Due') : (isBn ? '১-ক্লিকে পে করুন' : '1-Click Pay')}
                      >
                        <Zap className={`w-3.5 h-3.5 ${currentPaymentStatus === 'Paid' ? 'text-slate-400' : 'fill-amber-300 text-amber-300'}`} />
                        <span>{currentPaymentStatus === 'Paid' ? 'Paid ✓' : (isBn ? '১-ক্লিকে পে' : 'Pay')}</span>
                      </button>
                    )}

                    {/* Salary Paid / Pending / Due Dropdown Selector */}
                    {isManager ? (
                      <select
                        value={currentPaymentStatus}
                        onChange={(e) => onUpdatePaymentStatus(user.id, selectedMonth, e.target.value as PaymentStatus)}
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border cursor-pointer focus:outline-none transition min-w-[110px] flex-1 sm:flex-initial ${
                          currentPaymentStatus === 'Paid'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                            : currentPaymentStatus === 'Pending'
                              ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                              : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                        }`}
                      >
                        <option value="Paid">✓ {isBn ? 'পেইড (Paid)' : 'Paid'}</option>
                        <option value="Pending">⏳ {isBn ? 'পেন্ডিং (Pending)' : 'Pending'}</option>
                        <option value="Due">✗ {isBn ? 'বকেয়া (Due)' : 'Due'}</option>
                      </select>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${
                        currentPaymentStatus === 'Paid'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : currentPaymentStatus === 'Pending'
                            ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}>
                        {currentPaymentStatus === 'Paid' ? (isBn ? 'পেইড ✓' : 'Paid') : currentPaymentStatus === 'Pending' ? (isBn ? 'পেন্ডিং ⏳' : 'Pending') : (isBn ? 'বকেয়া ✗' : 'Due')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Record Payment Button */}
                    {isManager && (
                      <button
                        type="button"
                        onClick={() => {
                          const userPayments = payments.filter(p => p.userId === user.id && p.month === selectedMonth);
                          const paidSoFar = userPayments.reduce((s, p) => s + p.amountPaid, 0);
                          const rem = Math.max(0, grossPay - paidSoFar);
                          setPaymentModalUser({ user, grossPay });
                          setPayAmountInput(rem > 0 ? String(rem) : String(grossPay));
                          setPayNotes('');
                          setPayRef('');
                        }}
                        className="no-print p-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition cursor-pointer"
                        title={isBn ? 'পেমেন্ট ট্রানজেকশন রেকর্ড ও হিস্টোরি' : 'Record Payment & History'}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* WhatsApp Payslip Action */}
                    {user.whatsapp && (
                      <a
                        href={`https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(waMessage)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="no-print p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center gap-1 shadow-2xs transition shrink-0"
                        title={isBn ? 'হোয়াটসঅ্যাপে পে-স্লিপ পাঠান' : 'Send WhatsApp Slip'}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* RECORD PAYMENT & PAYMENT HISTORY MODAL */}
      {paymentModalUser && (() => {
        const userPayments = payments.filter(p => p.userId === paymentModalUser.user.id && p.month === selectedMonth);
        const alreadyPaid = userPayments.reduce((s, p) => s + p.amountPaid, 0);
        const remainingBalance = Math.max(0, paymentModalUser.grossPay - alreadyPaid);

        const handleSavePayment = (e: React.FormEvent) => {
          e.preventDefault();
          const amt = parseFloat(payAmountInput) || 0;
          if (amt <= 0) {
            setToastMessage(isBn ? 'পরিশোধিত টাকার পরিমাণ অবশ্যই ০ থেকে বেশি হতে হবে।' : 'Payment amount must be greater than 0.');
            setTimeout(() => setToastMessage(''), 3000);
            return;
          }

          const newTotalPaid = alreadyPaid + amt;
          const newRemaining = Math.max(0, paymentModalUser.grossPay - newTotalPaid);
          const newStatus: PaymentStatus = newTotalPaid >= paymentModalUser.grossPay ? 'Paid' : 'Partially Paid';

          if (onRecordPayment) {
            onRecordPayment({
              userId: paymentModalUser.user.id,
              employeeId: paymentModalUser.user.employeeId,
              month: selectedMonth,
              amountDue: paymentModalUser.grossPay,
              amountPaid: amt,
              remainingBalance: newRemaining,
              paymentStatus: newStatus,
              paymentDate: payDate,
              paymentMethod: payMethod,
              referenceNumber: payRef.trim() || undefined,
              notes: payNotes.trim() || undefined,
              recordedBy: currentUser.fullName
            });
          }

          onUpdatePaymentStatus(paymentModalUser.user.id, selectedMonth, newStatus);
          setPaymentModalUser(null);
          setToastMessage(isBn 
            ? `✓ ৳${amt.toLocaleString()} টাকা পেমেন্ট সফলভাবে রেকর্ড হয়েছে! (${newStatus})` 
            : `✓ Successfully recorded payment of ৳${amt.toLocaleString()}! (${newStatus})`);
          setTimeout(() => setToastMessage(''), 4500);
        };

        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
            onClick={() => setPaymentModalUser(null)}
          >
            <div 
              className={`w-full max-w-lg rounded-2xl border shadow-2xl p-6 overflow-hidden transition-all max-h-[90vh] overflow-y-auto ${cardBg}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold">
                    {isBn ? 'বেতন পেমেন্ট রেকর্ড করুন' : 'Record Salary Payment'}
                  </h3>
                </div>
                <button onClick={() => setPaymentModalUser(null)} className="text-slate-400">✕</button>
              </div>

              {/* Summary Cards */}
              <div className="py-4 space-y-4 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">{isBn ? 'কর্মী ও মাস:' : 'Employee & Period:'}</span>
                  <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {paymentModalUser.user.fullName} ({paymentModalUser.user.employeeId}) · {paymentModalUser.user.section}
                  </p>
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                    Period: {selectedMonth}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">{isBn ? 'মোট প্রদেয়' : 'Total Due'}</span>
                    <p className="text-sm font-black font-mono text-slate-800 dark:text-slate-100 mt-0.5">
                      ৳{paymentModalUser.grossPay.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
                    <span className="text-[10px] text-emerald-600 uppercase font-bold">{isBn ? 'পরিশোধিত' : 'Paid So Far'}</span>
                    <p className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                      ৳{alreadyPaid.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20">
                    <span className="text-[10px] text-rose-600 uppercase font-bold">{isBn ? 'অবশিষ্ট বকেয়া' : 'Remaining'}</span>
                    <p className="text-sm font-black font-mono text-rose-600 dark:text-rose-400 mt-0.5">
                      ৳{remainingBalance.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Previous Transactions History */}
                {userPayments.length > 0 && (
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1">
                      <History className="w-3.5 h-3.5" />
                      <span>{isBn ? 'পূর্ববর্তী পেমেন্ট ট্রানজেকশন সমূহ:' : 'Payment Transactions History:'}</span>
                    </span>
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-32 overflow-y-auto">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500">
                          <tr>
                            <th className="p-1.5">Date</th>
                            <th className="p-1.5">Method</th>
                            <th className="p-1.5">Ref</th>
                            <th className="p-1.5 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {userPayments.map(p => (
                            <tr key={p.id}>
                              <td className="p-1.5 font-mono">{p.paymentDate}</td>
                              <td className="p-1.5">{p.paymentMethod}</td>
                              <td className="p-1.5 font-mono text-[10px] text-slate-400">{p.referenceNumber || '--'}</td>
                              <td className="p-1.5 text-right font-mono font-bold text-emerald-600">৳{p.amountPaid.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* New Payment Form */}
                <form onSubmit={handleSavePayment} className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                        {isBn ? 'পরিশোধিত পরিমাণ (৳) *' : 'Payment Amount (৳) *'}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={payAmountInput}
                        onChange={(e) => setPayAmountInput(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-black text-sm text-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                        {isBn ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}
                      </label>
                      <select
                        value={payMethod}
                        onChange={(e: any) => setPayMethod(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                      >
                        <option value="Cash">Cash (নগদ)</option>
                        <option value="bKash">bKash (বিকাশ)</option>
                        <option value="Nagad">Nagad (নগদ ডিজিটাল)</option>
                        <option value="Bank Transfer">Bank Transfer (ব্যাংক)</option>
                        <option value="Other">Other (অন্যান্য)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                        {isBn ? 'পেমেন্ট তারিখ' : 'Payment Date'}
                      </label>
                      <input
                        type="date"
                        required
                        value={payDate}
                        onChange={(e) => setPayDate(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                        {isBn ? 'ট্রানজেকশন / চেক নং' : 'Txn / Ref Number'}
                      </label>
                      <input
                        type="text"
                        value={payRef}
                        onChange={(e) => setPayRef(e.target.value)}
                        placeholder="e.g. TXN-10294"
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                      {isBn ? 'নোট বা মন্তব্য' : 'Notes / Remarks'}
                    </label>
                    <input
                      type="text"
                      value={payNotes}
                      onChange={(e) => setPayNotes(e.target.value)}
                      placeholder={isBn ? 'যেমন: অগ্রিম বা সম্পূর্ণ বেতন পরিশোধ' : 'e.g. Full settlement'}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setPaymentModalUser(null)}
                      className="px-4 py-2 font-bold text-slate-500 hover:text-slate-700"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold cursor-pointer shadow-xs transition"
                    >
                      {isBn ? 'পেমেন্ট নিশ্চিত করুন' : 'Confirm & Save Payment'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
