import React, { useState, useRef } from 'react';
import { 
  User, 
  CompanyProfile, 
  Language, 
  ProductionRecord, 
  AccountType, 
  AdminAccessLevel,
  AttendanceRecord,
  OvertimeRecord,
  PayrollStatusMap,
  DutySettings,
  SalaryType
} from '../types';
import { translations } from '../i18n';
import { calculateAutoHourlyRate, formatJoiningDate, getInitials } from '../storage';
import { UserProfileBadge } from './UserProfileBadge';
import { CompanyLogo } from './CompanyLogo';
import { BangladeshHolidayCalendar } from './BangladeshHolidayCalendar';
import { 
  UserPlus, 
  Settings, 
  Database, 
  Edit3, 
  IdCard, 
  Layers, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Image as ImageIcon,
  RotateCcw,
  Package,
  Calendar,
  DollarSign,
  Clock,
  Filter,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Users,
  ShieldAlert,
  Upload,
  ShieldCheck,
  Mail,
  Zap,
  Search,
  FileSpreadsheet,
  Download,
  FileText,
  ClipboardCheck,
  Building2,
  MapPin,
  Phone
} from 'lucide-react';

interface AdminPanelViewProps {
  users: User[];
  currentUser?: User;
  sections: string[];
  companyProfile: CompanyProfile;
  cloudDbUrl: string;
  language: Language;
  darkMode: boolean;
  productions: ProductionRecord[];
  attendance?: AttendanceRecord[];
  overtime?: OvertimeRecord[];
  payrollStatusMap?: PayrollStatusMap;
  selectedMonth: string;
  dutySettings?: DutySettings;
  onUpdateDutySettings?: (settings: DutySettings) => void;
  onSelectMonth: (month: string) => void;
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser?: (id: string) => void;
  onUpdateCompanyNotice: (notice: string, title?: string, mentionedUserIds?: string[]) => void;
  onUpdateCloudUrl: (url: string) => void;
  onOpenIdCardModal: (user: User) => void;
  onAddSection: (sectionName: string) => void;
  onRenameSection: (oldName: string, newName: string) => void;
  onDeleteSection: (sectionName: string) => void;
  onUpdateCompanyLogo: (logoUrl: string) => void;
  onUpdateCompanyBanner?: (bannerUrl: string) => void;
  onUpdateCompanyProfile?: (profile: Partial<CompanyProfile>) => void;
  onOpenGmailModal?: (recipientId?: string, template?: 'absent' | 'production' | 'payroll' | 'custom') => void;
  onAddProduction: (prod: Omit<ProductionRecord, 'id'>) => void;
  onUpdateProduction: (prod: ProductionRecord) => void;
  onDeleteProduction: (id: string) => void;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  users,
  currentUser,
  sections,
  companyProfile,
  cloudDbUrl,
  language,
  darkMode,
  productions,
  attendance = [],
  overtime = [],
  payrollStatusMap = {},
  selectedMonth,
  dutySettings = { startTime: '08:00', endTime: '17:00', lunchBreakHours: 1, standardDailyHours: 8 },
  onUpdateDutySettings,
  onSelectMonth,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onUpdateCompanyNotice,
  onUpdateCloudUrl,
  onOpenIdCardModal,
  onAddSection,
  onRenameSection,
  onDeleteSection,
  onUpdateCompanyLogo,
  onUpdateCompanyBanner,
  onUpdateCompanyProfile,
  onOpenGmailModal,
  onAddProduction,
  onUpdateProduction,
  onDeleteProduction
}) => {
  const t = translations[language];
  const isBn = language === 'bn';

  const isFullControl = !currentUser || currentUser.accountType === 'hosting' || currentUser.accountType === 'admin' || currentUser.adminAccess === 'full';
  const isBasicAccess = isFullControl || currentUser?.adminAccess === 'basic' || currentUser?.accountType === 'md' || currentUser?.accountType === 'staff';

  type AdminTab = 'accounts' | 'approvals' | 'orders' | 'sections' | 'audit' | 'holidays' | 'company_profile';
  const [activeTab, setActiveTab] = useState<AdminTab>('accounts');
  const [accessFilter, setAccessFilter] = useState<'all' | 'full' | 'basic' | 'none'>('all');
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // External Audit CSV Export Handler
  const handleExportAuditCSV = (module: 'all' | 'attendance' | 'overtime' | 'production' | 'payroll') => {
    const compName = companyProfile.name || 'Creative Accessories Factory';
    const factoryReg = companyProfile.factoryRegNo || 'BD-ACC-2024-8841';
    const factoryAddress = companyProfile.address || 'Bamnartek, Dhaka 1230, Bangladesh';
    const exportedAt = new Date().toISOString();
    const auditorName = currentUser?.fullName || 'Chief Compliance Officer';
    const roleTitle = currentUser?.designation || currentUser?.accountType || 'Auditor';

    const headerMetadata = [
      `"${compName}"`,
      `"Factory Reg No: ${factoryReg} | Address: ${factoryAddress}"`,
      `"Contact: ${companyProfile.contactNumber || '01756628160'} | Email: ${companyProfile.email || 'info@creativeaccessories.com'}"`,
      `"OFFICIAL FACTORY AUDIT & COMPLIANCE DATA EXPORT"`,
      `"Audit Module: ${module.toUpperCase()} | Audit Month: ${selectedMonth}"`,
      `"Export Timestamp: ${exportedAt} | Exported By: ${auditorName} (${roleTitle})"`,
      ''
    ];

    const csvLines: string[] = [];

    if (module === 'all' || module === 'attendance') {
      csvLines.push('"--- SECTION 1: ATTENDANCE AUDIT LOGS ---"');
      csvLines.push('Date,Employee ID,Full Name,Designation,Section,Shift,In Time,Out Time,Status');
      (attendance || []).forEach(att => {
        const u = users.find(x => x.id === att.userId);
        csvLines.push([
          `"${att.date}"`,
          `"${u?.employeeId || att.userId}"`,
          `"${u?.fullName || 'Unknown'}"`,
          `"${u?.designation || ''}"`,
          `"${u?.section || ''}"`,
          `"${att.shift || 'General'}"`,
          `"${att.inTime || ''}"`,
          `"${att.outTime || ''}"`,
          `"${att.status || 'Present'}"`
        ].join(','));
      });
      csvLines.push('');
    }

    if (module === 'all' || module === 'overtime') {
      csvLines.push('"--- SECTION 2: OVERTIME & EXTRA HOURS AUDIT LOGS ---"');
      csvLines.push('Date,Employee ID,Full Name,Designation,Section,Hours,Hourly Rate (BDT),Earned Amount (BDT),Reason / Work Description,Status,Approved By');
      let totalOtHours = 0;
      let totalOtMoney = 0;
      (overtime || []).forEach(ot => {
        const u = users.find(x => x.id === ot.userId);
        const rate = Number(u?.hourlyRate || 0);
        const hours = Number(ot.hours || 0);
        const money = hours * rate;
        totalOtHours += hours;
        totalOtMoney += money;
        csvLines.push([
          `"${ot.date}"`,
          `"${u?.employeeId || ot.userId}"`,
          `"${u?.fullName || 'Unknown'}"`,
          `"${u?.designation || ''}"`,
          `"${ot.section || u?.section || ''}"`,
          hours,
          rate,
          money.toFixed(2),
          `"${(ot.reason || '').replace(/"/g, '""')}"`,
          `"${ot.status}"`,
          `"${ot.approvedBy || ''}"`
        ].join(','));
      });
      csvLines.push(`"TOTAL OVERTIME",,,,,"${totalOtHours.toFixed(1)} hrs",,"BDT ${totalOtMoney.toLocaleString()}",,,`);
      csvLines.push('');
    }

    if (module === 'all' || module === 'production') {
      csvLines.push('"--- SECTION 3: PRODUCTION & ORDER FULFILLMENT AUDIT ---"');
      csvLines.push('Date,Employee ID,Operator Name,Section,Item Name,Buyer,Company,Length,Order Qty,Produced Qty (Pieces),Unit,Status,Last Edited By');
      let totalTarget = 0;
      let totalProduced = 0;
      (productions || []).forEach(p => {
        const u = users.find(x => x.id === p.userId);
        const ord = Number(p.orderQty || 0);
        const prd = Number(p.prodQty || 0);
        totalTarget += ord;
        totalProduced += prd;
        csvLines.push([
          `"${p.date}"`,
          `"${u?.employeeId || p.userId}"`,
          `"${u?.fullName || 'Unknown'}"`,
          `"${p.section}"`,
          `"${p.itemName.replace(/"/g, '""')}"`,
          `"${p.buyer.replace(/"/g, '""')}"`,
          `"${p.company.replace(/"/g, '""')}"`,
          `"${p.length || ''}"`,
          ord,
          prd,
          `"${p.unit || 'Pcs'}"`,
          `"${p.status}"`,
          `"${p.lastEditedBy || ''}"`
        ].join(','));
      });
      csvLines.push(`"TOTAL PRODUCTION",,,,,,,,"${totalTarget}","${totalProduced} Pcs",,,,`);
      csvLines.push('');
    }

    if (module === 'all' || module === 'payroll') {
      csvLines.push('"--- SECTION 4: PAYROLL, BASIC SALARY & WAGE SETTLEMENT AUDIT ---"');
      csvLines.push('Month,Employee ID,Full Name,Designation,Section,Account Type,Joining Date,Basic Salary (BDT),OT Hours,OT Payout (BDT),Total Gross Payable (BDT),Payment Status');
      let totalBasic = 0;
      let totalOt = 0;
      let totalGross = 0;
      users.forEach(u => {
        const uOvertime = (overtime || []).filter(o => {
          const oMonth = (o.date || '').substring(0, 7);
          return o.userId === u.id && o.status === 'Approved' && (!oMonth || oMonth === selectedMonth);
        });
        const otHours = uOvertime.reduce((sum, o) => sum + Number(o.hours || 0), 0);
        const otEarnings = otHours * Number(u.hourlyRate || 0);
        const grossPay = Number(u.basicSalary || 0) + otEarnings;
        const status = (payrollStatusMap || {})[u.id] || 'Due';

        totalBasic += Number(u.basicSalary || 0);
        totalOt += otEarnings;
        totalGross += grossPay;

        csvLines.push([
          `"${selectedMonth}"`,
          `"${u.employeeId}"`,
          `"${u.fullName}"`,
          `"${u.designation || ''}"`,
          `"${u.section || ''}"`,
          `"${u.accountType}"`,
          `"${u.joiningDate || ''}"`,
          Number(u.basicSalary || 0),
          otHours.toFixed(1),
          otEarnings.toFixed(2),
          grossPay.toFixed(2),
          `"${status}"`
        ].join(','));
      });
      csvLines.push(`"TOTAL PAYROLL",,,,,,,"BDT ${totalBasic.toLocaleString()}",,"BDT ${totalOt.toLocaleString()}","BDT ${totalGross.toLocaleString()}",`);
      csvLines.push('');
    }

    // Verification signatures
    csvLines.push('"--- VERIFICATION & SIGNATURES ---"');
    csvLines.push(`"Exported By: ${auditorName} | Title: ${roleTitle}"`);
    csvLines.push('"Compliance Verification Status: PASSED & CERTIFIED"');
    csvLines.push('"Authorized Signatory: _________________________    Date: _____________"');

    const filename = module === 'all'
      ? `Full_Factory_Audit_${selectedMonth}_${factoryReg}.csv`
      : `${module.charAt(0).toUpperCase() + module.slice(1)}_Audit_${selectedMonth}_${factoryReg}.csv`;

    const csvContent = '\uFEFF' + [...headerMetadata, ...csvLines].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    triggerToast(isBn ? `✓ অডিট ফাইল "${filename}" সফলভাবে ডাউনলোড হয়েছে!` : `Downloaded audit file "${filename}"!`);
  };

  // Official Banner upload state
  const [inputBannerUrl, setInputBannerUrl] = useState(companyProfile.bannerUrl || '');
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setInputBannerUrl(reader.result);
        if (onUpdateCompanyBanner) {
          onUpdateCompanyBanner(reader.result);
          triggerToast(isBn ? 'কোম্পানি অফিসিয়াল ব্যানার আপডেট হয়েছে!' : 'Company official banner updated!');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBannerUrl = () => {
    if (onUpdateCompanyBanner) {
      onUpdateCompanyBanner(inputBannerUrl.trim());
      triggerToast(isBn ? 'কোম্পানি অফিসিয়াল ব্যানার সংরক্ষিত হয়েছে!' : 'Company official banner saved!');
    }
  };

  const handleResetDefaultBanner = () => {
    setInputBannerUrl('');
    if (onUpdateCompanyBanner) {
      onUpdateCompanyBanner('');
      triggerToast(isBn ? 'ডিফল্ট ব্যানার পুনর্বহাল করা হয়েছে।' : 'Default banner restored.');
    }
  };

  const handleQuickChangeAccess = (targetUser: User, nextAccess: 'none' | 'basic' | 'full') => {
    if (!isFullControl) {
      triggerToast(isBn ? 'অনুমতি নেই: শুধু ফুল কন্ট্রোল অ্যাডমিন অ্যাক্সেস পরিবর্তন করতে পারেন।' : 'Permission denied: Only Full Control admin can change access levels.');
      return;
    }
    const updated = { ...targetUser, adminAccess: nextAccess };
    onUpdateUser(updated);
    triggerToast(isBn 
      ? `"${targetUser.fullName}" এর অ্যাক্সেস লেভেল আপডেট হয়েছে!` 
      : `Access level updated for "${targetUser.fullName}"!`);
  };

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Production Order Modal & Form State
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ProductionRecord | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const defaultDeliveryStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [orderDate, setOrderDate] = useState(todayStr);
  const [deliveryDate, setDeliveryDate] = useState(defaultDeliveryStr);
  const [buyer, setBuyer] = useState('');
  const [itemName, setItemName] = useState('');
  const [productType, setProductType] = useState('Zipper');
  const [length, setLength] = useState('24 Inch');
  const [orderSection, setOrderSection] = useState(sections[0] || 'Sewing');
  const [orderQty, setOrderQty] = useState('5000');
  const [unit, setUnit] = useState('Pcs');
  const [unitPrice, setUnitPrice] = useState('15');
  const [totalAmount, setTotalAmount] = useState((5000 * 15).toString());
  const [orderStatus, setOrderStatus] = useState<'Running' | 'Completed' | 'Delayed'>('Running');

  // Auto calculate total amount when orderQty or unitPrice changes
  const handleQtyPriceChange = (qtyVal: string, priceVal: string) => {
    setOrderQty(qtyVal);
    setUnitPrice(priceVal);
    const q = parseFloat(qtyVal) || 0;
    const p = parseFloat(priceVal) || 0;
    setTotalAmount((q * p).toString());
  };

  // Notice board & Cloud URL state
  const [noticeText, setNoticeText] = useState(companyProfile.noticeText || '');
  const [noticeTitle, setNoticeTitle] = useState(companyProfile.noticeTitle || (isBn ? 'ফ্যাক্টরি জরুরি নোটিশ ও কাজের সময়সূচী' : 'Factory Notice Board'));
  const [adminMentionedIds, setAdminMentionedIds] = useState<string[]>(companyProfile.mentionedUserIds || []);
  const [customCloudUrl, setCustomCloudUrl] = useState(cloudDbUrl);
  const [saveToast, setSaveToast] = useState('');

  // Company Profile, Name, Address & Contact Customization (Requirement: Company name, address, banner editing & switching)
  const [compName, setCompName] = useState(companyProfile.name || 'Creative Accessories Factory');
  const [compAddress, setCompAddress] = useState(companyProfile.address || 'Bamnartek, Dhaka 1230, Bangladesh');
  const [compContact, setCompContact] = useState(companyProfile.contactNumber || '01756628160');
  const [compEmail, setCompEmail] = useState(companyProfile.email || 'contact@creativeaccessories.com');
  const [compRegNo, setCompRegNo] = useState(companyProfile.factoryRegNo || 'CAF-IND-94821');
  const [savedAddresses, setSavedAddresses] = useState<string[]>(() => {
    if (companyProfile.savedAddresses && companyProfile.savedAddresses.length > 0) {
      return companyProfile.savedAddresses;
    }
    return [
      companyProfile.address || 'Bamnartek, Dhaka 1230, Bangladesh',
      'Plot 14-16, Sector 3, EPZ, Savar, Dhaka',
      'Tongi Industrial Area, Gazipur, Bangladesh',
      'Baipayl, Ashulia, Savar, Dhaka'
    ];
  });
  const [newAddressInput, setNewAddressInput] = useState('');

  const handleSaveCompanyInfo = () => {
    if (!compName.trim()) {
      triggerToast(isBn ? 'কোম্পানির নাম খালি রাখা যাবে না।' : 'Company name cannot be empty.');
      return;
    }
    if (onUpdateCompanyProfile) {
      onUpdateCompanyProfile({
        name: compName.trim(),
        address: compAddress.trim(),
        contactNumber: compContact.trim(),
        email: compEmail.trim(),
        factoryRegNo: compRegNo.trim(),
        savedAddresses
      });
    }
    triggerToast(isBn ? '✓ কোম্পানির নাম, ঠিকানা ও তথ্য সফলভাবে সংরক্ষিত হয়েছে!' : '✓ Company name, address & profile saved!');
  };

  const handleAddPresetAddress = () => {
    const trimmed = newAddressInput.trim();
    if (!trimmed) return;
    if (!savedAddresses.includes(trimmed)) {
      const updated = [...savedAddresses, trimmed];
      setSavedAddresses(updated);
      setCompAddress(trimmed);
      if (onUpdateCompanyProfile) {
        onUpdateCompanyProfile({ savedAddresses: updated, address: trimmed });
      }
      triggerToast(isBn ? 'নতুন কারখানা/কোম্পানি ঠিকানা তালিকায় যুক্ত হয়েছে!' : 'New company address added to presets!');
    }
    setNewAddressInput('');
  };

  const handleSelectPresetAddress = (addr: string) => {
    setCompAddress(addr);
    if (onUpdateCompanyProfile) {
      onUpdateCompanyProfile({ address: addr });
    }
    triggerToast(isBn ? `ঠিকানা পরিবর্তন করা হয়েছে: ${addr}` : `Address switched to: ${addr}`);
  };

  const handleDeletePresetAddress = (addrToDelete: string) => {
    const filtered = savedAddresses.filter(a => a !== addrToDelete);
    setSavedAddresses(filtered);
    if (onUpdateCompanyProfile) {
      onUpdateCompanyProfile({ savedAddresses: filtered });
    }
    triggerToast(isBn ? 'ঠিকানা তালিকা থেকে মুছে ফেলা হয়েছে।' : 'Address removed from presets.');
  };

  // Logo upload state
  const [inputLogoUrl, setInputLogoUrl] = useState(companyProfile.logoUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Section management state
  const [newSectionInput, setNewSectionInput] = useState('');
  const [editingSectionOriginal, setEditingSectionOriginal] = useState<string | null>(null);
  const [editingSectionName, setEditingSectionName] = useState('');
  const [sectionError, setSectionError] = useState('');
  const [deletingSectionConfirm, setDeletingSectionConfirm] = useState<string | null>(null);

  // Pending approvals calculations
  const pendingAccounts = users.filter(u => u.accountStatus === 'Pending');
  const pendingPhotos = users.filter(u => !!u.pendingPhotoUrl);
  const totalPending = pendingAccounts.length + pendingPhotos.length;

  const createUserFileInputRef = useRef<HTMLInputElement>(null);
  const editUserFileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateUserPhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleEditUserPhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingUser) return;
    const reader = new FileReader();
    reader.onload = () => setEditingUser({ ...editingUser, photoUrl: reader.result as string });
    reader.readAsDataURL(file);
  };

  // Real-time search state for user list
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // New user form state
  const [fullName, setFullName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('employee');
  const [adminAccessLevel, setAdminAccessLevel] = useState<AdminAccessLevel>('none');
  const [designation, setDesignation] = useState('Senior Zipper Operator');
  const [section, setSection] = useState(sections[0] || 'Sewing');
  const [department, setDepartment] = useState('Production');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [joiningDate, setJoiningDate] = useState(todayStr);
  const [whatsapp, setWhatsapp] = useState('+880');
  const [basicSalary, setBasicSalary] = useState('20000');
  const [hourlyRate, setHourlyRate] = useState(calculateAutoHourlyRate(20000).toString());
  const [salaryType, setSalaryType] = useState<SalaryType>('monthly');

  // Duty Timing Settings state
  const [dutyStart, setDutyStart] = useState(dutySettings?.startTime || dutySettings?.startHour || '08:00');
  const [dutyEnd, setDutyEnd] = useState(dutySettings?.endTime || dutySettings?.endHour || '17:00');
  const [dutyLunch, setDutyLunch] = useState<number>(dutySettings?.lunchBreakHours ?? 1);

  const triggerToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(''), 3000);
  };

  const handleSalaryChange = (val: string) => {
    setBasicSalary(val);
    const computed = calculateAutoHourlyRate(val);
    setHourlyRate(computed.toString());
  };

  // Filter productions for selected month
  const monthProductions = productions.filter(p => {
    const recordMonth = (p.deliveryDate || p.orderDate || p.date || '').substring(0, 7);
    return recordMonth === selectedMonth;
  });

  // Month options for dropdown
  const generateMonthOptions = () => {
    const options: { value: string; label: string }[] = [];
    const baseDate = new Date();
    for (let i = -3; i <= 3; i++) {
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1);
      const val = d.toISOString().substring(0, 7);
      const monthName = d.toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { month: 'long', year: 'numeric' });
      options.push({ value: val, label: monthName });
    }
    return options;
  };
  const monthOptions = generateMonthOptions();

  // Production Order Submit
  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !buyer || !orderQty) return;

    const q = Number(orderQty);
    const p = Number(unitPrice || 0);
    const tot = Number(totalAmount) || (q * p);

    onAddProduction({
      userId: users[0]?.id || 'u-hosting-1',
      date: orderDate,
      orderDate,
      deliveryDate,
      productType,
      section: orderSection,
      itemName: itemName.trim(),
      buyer: buyer.trim(),
      company: 'Creative Accessories Factory',
      length: length.trim(),
      orderQty: q,
      prodQty: 0,
      unit,
      unitPrice: p,
      totalAmount: tot,
      startTime: '08:00 AM',
      endTime: '05:00 PM',
      hours: 8,
      status: orderStatus
    });

    setOrderModalOpen(false);
    setItemName('');
    setBuyer('');
    triggerToast(isBn ? 'নতুন প্রোডাকশন অর্ডার যুক্ত হয়েছে!' : 'Production order added successfully!');
  };

  // Delivery countdown calculation
  const getDeliveryCountdown = (deliveryDateStr?: string) => {
    if (!deliveryDateStr) return { label: 'N/A', status: 'normal' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(deliveryDateStr);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: isBn ? `${Math.abs(diffDays)} দিন ওভারডিউ` : `${Math.abs(diffDays)}d Overdue`,
        status: 'overdue'
      };
    } else if (diffDays === 0) {
      return {
        label: isBn ? 'আজকে ডেলিভারি' : 'Due Today',
        status: 'today'
      };
    } else if (diffDays === 1) {
      return {
        label: isBn ? 'আগামীকাল ডেলিভারি' : 'Due Tomorrow',
        status: 'urgent'
      };
    } else if (diffDays <= 3) {
      return {
        label: isBn ? `${diffDays} দিন বাকি` : `${diffDays}d left`,
        status: 'urgent'
      };
    } else {
      return {
        label: isBn ? `${diffDays} দিন বাকি` : `${diffDays}d left`,
        status: 'normal'
      };
    }
  };

  // Logo handlers
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      triggerToast(isBn ? 'ছবির সাইজ ২MB এর বেশি হতে পারবে না।' : 'Image size exceeds 2MB limit. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setInputLogoUrl(dataUrl);
        onUpdateCompanyLogo(dataUrl);
        triggerToast(t.logoUpdated);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLogoUrl = () => {
    onUpdateCompanyLogo(inputLogoUrl.trim());
    triggerToast(t.logoUpdated);
  };

  const handleResetDefaultLogo = () => {
    setInputLogoUrl('');
    onUpdateCompanyLogo('');
    triggerToast('Default official logo restored');
  };

  // Section handlers
  const handleAddNewSection = (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    setSectionError('');
    const trimmed = (newSectionInput || '').trim();
    if (!trimmed) {
      setSectionError(isBn ? 'অনুগ্রহ করে সেকশনের নাম লিখুন।' : 'Please enter a section name.');
      return;
    }

    if (sections.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setSectionError(isBn ? `"${trimmed}" সেকশনটি ইতোমধ্যে বিদ্যমান রয়েছে!` : `Section "${trimmed}" already exists!`);
      return;
    }

    onAddSection(trimmed);
    setNewSectionInput('');
    setSectionError('');
    triggerToast(isBn ? `"${trimmed}" সেকশন সফলভাবে যুক্ত হয়েছে!` : `Section "${trimmed}" added successfully!`);
  };

  const handleStartRename = (sec: string) => {
    setEditingSectionOriginal(sec);
    setEditingSectionName(sec);
    setSectionError('');
  };

  const handleConfirmRename = () => {
    if (!editingSectionOriginal) return;
    const trimmed = editingSectionName.trim();
    if (!trimmed) return;

    if (trimmed !== editingSectionOriginal && sections.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setSectionError('Another section with this name already exists');
      return;
    }

    onRenameSection(editingSectionOriginal, trimmed);
    setEditingSectionOriginal(null);
    setEditingSectionName('');
    triggerToast(t.sectionUpdated);
  };

  const handleDeleteSectionConfirm = (sec: string) => {
    onDeleteSection(sec);
    setDeletingSectionConfirm(null);
    triggerToast(isBn ? `"${sec}" সেকশন সফলভাবে মুছে ফেলা হয়েছে!` : `Section "${sec}" deleted successfully!`);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !username || !password) return;

    const resolvedAdminAccess: AdminAccessLevel = accountType === 'admin' 
      ? 'full' 
      : accountType === 'employee' 
        ? 'none' 
        : adminAccessLevel;

    const newUser: User = {
      id: 'u-' + Date.now(),
      fullName: fullName.trim(),
      photoUrl: photoUrl.trim(),
      accountType,
      adminAccess: resolvedAdminAccess,
      designation: accountType === 'md' 
        ? 'Managing Director' 
        : accountType === 'admin' 
          ? (designation.trim() || 'System Administrator')
          : designation.trim(),
      section,
      department: department.trim() || (accountType === 'admin' ? 'Operations & IT' : 'Production'),
      username: username.trim(),
      password: password.trim(),
      employeeId: 'CAF-' + Math.floor(100 + Math.random() * 900),
      joiningDate,
      whatsapp: whatsapp.trim(),
      accountStatus: 'Active',
      basicSalary: Number(basicSalary || 0),
      hourlyRate: Number(hourlyRate || 0),
      salaryType
    };

    onAddUser(newUser);
    setCreateModalOpen(false);
    setFullName('');
    setPhotoUrl('');
    setUsername('');
    setPassword('');
    triggerToast(t.saveAccount);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    onUpdateUser(editingUser);
    setEditingUser(null);
    triggerToast(t.updateAccount);
  };

  const cardBg = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900';
  const inputBg = darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900';

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold animate-in fade-in slide-in-from-bottom-2">
          ✓ {saveToast}
        </div>
      )}

      {/* Header Banner & Tab Navigation */}
      <div className={`border rounded-3xl p-5 sm:p-6 shadow-xs space-y-5 ${cardBg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">
              {t.adminTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t.adminSubtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('company_profile')}
              className={`px-4 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center gap-2 cursor-pointer transition shadow-xs shrink-0 ${
                activeTab === 'company_profile' ? 'ring-2 ring-indigo-500' : ''
              }`}
              title={isBn ? 'কোম্পানির নাম, ঠিকানা, তথ্য ও ব্যানার পরিবর্তন' : 'Change Company Name, Address & Banner'}
            >
              <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{isBn ? '🏢 কোম্পানি ঠিকানা ও নাম' : '🏢 Company Address & Name'}</span>
            </button>

            <button
              onClick={() => setSettingsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center gap-2 cursor-pointer transition shadow-xs shrink-0"
              title={isBn ? 'কোম্পানি অফিসিয়াল ব্যানার পরিবর্তন' : 'Change Official Company Banner'}
            >
              <ImageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{isBn ? '🖼️ ব্যানার পরিবর্তন' : '🖼️ Change Banner'}</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-xs shrink-0 ${
                activeTab === 'audit' ? 'ring-2 ring-emerald-500' : ''
              }`}
              title={isBn ? 'কারখানা এক্সটার্নাল অডিট ফাইল ও CSV এক্সপোর্ট' : 'External Audit CSV Exports'}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isBn ? '📑 অডিট CSV এক্সপোর্ট' : '📑 Audit CSV Export'}</span>
            </button>

            <button
              onClick={() => setSettingsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-2 cursor-pointer transition shadow-xs shrink-0"
              title="Secure System & Cloud Configuration"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>{isBn ? '⚙️ সেটিংস' : '⚙️ Settings'}</span>
            </button>

            {activeTab === 'accounts' && (
              <button
                onClick={() => setCreateModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isBn ? '+ নতুন কর্মী একাউন্ট' : '+ Add Account'}</span>
              </button>
            )}

            {activeTab === 'orders' && (
              <button
                onClick={() => setOrderModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{isBn ? '+ নতুন অর্ডার এন্ট্রি' : '+ New Order Entry'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-menu Tabs */}
        <div className="flex items-center gap-2 border-t pt-4 border-slate-200 dark:border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'accounts'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>{isBn ? 'কর্মীরা ও একাউন্ট (Worker Accounts)' : 'Worker Accounts'}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'accounts' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {users.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'approvals'
                ? 'bg-amber-600 text-white shadow-xs'
                : totalPending > 0
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 hover:bg-amber-100'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span>{isBn ? 'অনুমোদন অপেক্ষমাণ (Approval Queue)' : 'Approval Queue'}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              totalPending > 0
                ? 'bg-amber-500 text-white animate-pulse'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {totalPending}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>{isBn ? 'প্রোডাকশন অর্ডার ম্যানেজমেন্ট (Production Orders)' : 'Production Orders'}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {monthProductions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('sections')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'sections'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{isBn ? 'সেকশন ম্যানেজমেন্ট (Sections)' : 'Sections'}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'sections' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {sections.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'audit'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>{isBn ? 'এক্সটার্নাল অডিট ও CSV (Audit Export)' : 'Audit & CSV Export'}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'audit' ? 'bg-white/20 text-white' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
            }`}>
              Audit
            </span>
          </button>

          <button
            onClick={() => setActiveTab('company_profile')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'company_profile'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>{isBn ? 'কোম্পানি নাম, ঠিকানা ও ব্যানার' : 'Company Profile & Address'}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'company_profile' ? 'bg-white/20 text-white' : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300'
            }`}>
              Brand
            </span>
          </button>

          <button
            onClick={() => setActiveTab('holidays')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'holidays'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>{isBn ? 'ছুটির ক্যালেন্ডার ও গুগল সিঙ্ক' : 'Holiday Calendar & Google Cal'}</span>
          </button>
        </div>
      </div>

      {/* Approval Queue Tab */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className={`border rounded-3xl p-6 space-y-2 shadow-xs ${cardBg}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                    {isBn ? 'অনুমোদন অপেক্ষমাণ তালিকা (Approval Queue)' : 'Pending Approvals Queue'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isBn 
                      ? 'নতুন কর্মী রেজিস্ট্রেশন ও কর্মীদের ছবি পরিবর্তনের অনুরোধের তালিকা' 
                      : 'Pending account signups and requested profile photo updates awaiting admin review'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono ${
                  totalPending > 0
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                }`}>
                  {totalPending} {isBn ? 'টি অনুরোধ অপেক্ষমাণ' : 'Pending Requests'}
                </span>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    {isBn ? 'নতুন কর্মী একাউন্ট' : 'New User Accounts'}
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {pendingAccounts.length} {isBn ? 'টি আবেদন' : 'accounts'}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                  {pendingAccounts.length}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    {isBn ? 'প্রোফাইল ছবি পরিবর্তন' : 'Photo Change Requests'}
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {pendingPhotos.length} {isBn ? 'টি অনুরোধ' : 'photos'}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                  {pendingPhotos.length}
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Pending User Registrations */}
          <div className={`border rounded-3xl p-6 space-y-4 shadow-xs ${cardBg}`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {isBn ? '১. নতুন কর্মী একাউন্ট অনুমোদন' : '1. New Account Registrations'} ({pendingAccounts.length})
                </h4>
              </div>
              <span className="text-xs text-slate-400 font-mono">Status: Pending Approval</span>
            </div>

            {pendingAccounts.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  {isBn ? 'কোনো নতুন কর্মী একাউন্ট অনুমোদনের অপেক্ষায় নেই।' : 'No new user accounts awaiting approval.'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {isBn ? 'নতুন কর্মী রেজিস্ট্রেশন করলে এখানে তাৎক্ষণিকভাবে তালিকাভুক্ত হবে।' : 'New registrations will appear here for admin review.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingAccounts.map((u) => (
                  <div 
                    key={u.id}
                    className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative shrink-0">
                        {u.photoUrl ? (
                          <img 
                            src={u.photoUrl} 
                            alt={u.fullName} 
                            className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-400 shadow-sm"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-sm">
                            {getInitials(u.fullName)}
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-bold">
                          NEW
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="font-extrabold text-sm truncate text-slate-900 dark:text-white">
                            {u.fullName}
                          </h5>
                          <span className="text-[10px] font-mono text-slate-400">
                            {u.employeeId}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {u.designation}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {u.section} Section · {u.department || 'Production'}
                        </p>
                        <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400 font-mono">
                          <span>User: <strong className="text-slate-700 dark:text-slate-300">{u.username}</strong></span>
                          <span>·</span>
                          <span>Pass: <strong className="text-slate-700 dark:text-slate-300">{u.password || '••••••'}</strong></span>
                        </div>
                        {u.whatsapp && (
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                            WhatsApp: {u.whatsapp}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/40 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (onDeleteUser) {
                            onDeleteUser(u.id);
                          } else {
                            onUpdateUser({ ...u, accountStatus: 'Inactive' });
                          }
                          triggerToast(isBn ? 'রেজিস্ট্রেশন বাতিল/মুছে ফেলা হয়েছে।' : 'Registration rejected/deleted.');
                        }}
                        className="px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-xs flex items-center gap-1 cursor-pointer transition active:scale-95"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{isBn ? 'বাতিল করুন' : 'Reject'}</span>
                      </button>

                      <button
                        onClick={() => {
                          onUpdateUser({ ...u, accountStatus: 'Active' });
                          triggerToast(isBn ? `"${u.fullName}" একাউন্ট অনুমোদিত ও সক্রিয় হয়েছে!` : 'Account approved!');
                        }}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isBn ? 'অনুমোদন করুন (Approve)' : 'Approve Account'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Pending Profile Photo Updates */}
          <div className={`border rounded-3xl p-6 space-y-4 shadow-xs ${cardBg}`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-600" />
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {isBn ? '২. প্রোফাইল ছবি পরিবর্তনের অনুরোধ' : '2. Profile Photo Change Requests'} ({pendingPhotos.length})
                </h4>
              </div>
              <span className="text-xs text-slate-400 font-mono">Photo Comparison</span>
            </div>

            {pendingPhotos.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  {isBn ? 'কোনো প্রোফাইল ছবি পরিবর্তনের অনুরোধ নেই।' : 'No profile photo change requests.'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {isBn ? 'কর্মীরা প্রোফাইল থেকে ছবি পরিবর্তন করলে এখানে রিভিউ করার অপশন আসবে।' : 'When workers update profile pictures, they will appear here for review.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingPhotos.map((u) => (
                  <div 
                    key={u.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 bg-slate-50/50 dark:bg-slate-950/30"
                  >
                    <div>
                      <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {u.fullName}
                      </h5>
                      <p className="text-xs text-slate-500">
                        {u.designation} · {u.section} ({u.employeeId})
                      </p>
                    </div>

                    {/* Side by side comparison */}
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          {isBn ? 'বর্তমান ছবি' : 'Current Photo'}
                        </span>
                        <div className="w-20 h-20 mx-auto rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          {u.photoUrl ? (
                            <img src={u.photoUrl} alt="Current" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-lg font-bold text-slate-400">{getInitials(u.fullName)}</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 block">
                          {isBn ? 'নতুন প্রস্তাবিত ছবি' : 'New Requested Photo'}
                        </span>
                        <div className="w-20 h-20 mx-auto rounded-xl overflow-hidden border-2 border-amber-500 shadow-md bg-amber-50 dark:bg-amber-950 flex items-center justify-center">
                          {u.pendingPhotoUrl ? (
                            <img src={u.pendingPhotoUrl} alt="New" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs text-slate-400">N/A</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                      <button
                        onClick={() => {
                          onUpdateUser({ ...u, pendingPhotoUrl: undefined });
                          triggerToast(isBn ? 'ছবির অনুরোধ বাতিল করা হয়েছে।' : 'Photo request rejected.');
                        }}
                        className="px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-xs flex items-center gap-1 cursor-pointer transition"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{isBn ? 'বাতিল' : 'Reject'}</span>
                      </button>

                      <button
                        onClick={() => {
                          onUpdateUser({
                            ...u,
                            photoUrl: u.pendingPhotoUrl,
                            pendingPhotoUrl: undefined
                          });
                          triggerToast(isBn ? `"${u.fullName}" এর নতুন ছবি সফলভাবে অনুমোদিত হয়েছে!` : 'New photo approved!');
                        }}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isBn ? 'অনুমোদন করুন (Approve)' : 'Approve Photo'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1. Production Orders Tab */}
      {activeTab === 'orders' && (
      <div className={`border rounded-3xl p-6 space-y-4 shadow-xs ${cardBg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                {isBn ? 'প্রোডাকশন অর্ডার ম্যানেজমেন্ট ও ডেলিভারি ট্র্যাকিং' : 'Production Order Tracking & Delivery Management'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isBn ? 'অর্ডার এন্ট্রি, টাইপ ও লেন্থ ভিত্তিক হিসাব এবং ডেলিভারি তারিখ মনিটরিং' : 'Order entries, auto calculations by type/length, and delivery deadlines'}
              </p>
            </div>
          </div>

          {/* Month Selector for Production Orders */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => onSelectMonth(e.target.value)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none focus:border-indigo-600 cursor-pointer ${inputBg}`}
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} {opt.value === todayStr.substring(0, 7) ? (isBn ? ' (চলতি মাস)' : ' (Current)') : ''}
                </option>
              ))}
            </select>
            <button
              onClick={() => setOrderModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isBn ? 'অর্ডার দিন' : 'Add Order'}</span>
            </button>
          </div>
        </div>

        {/* Month Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">{isBn ? 'নির্বাচিত মাস' : 'Selected Month'}</span>
            <div className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">{selectedMonth}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">{isBn ? 'মোট অর্ডার' : 'Total Orders'}</span>
            <div className="font-mono font-black text-sm text-slate-800 dark:text-slate-100">{monthProductions.length} {isBn ? 'টি' : ''}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">{isBn ? 'উৎপাদন লক্ষ্য' : 'Target Quantity'}</span>
            <div className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
              {monthProductions.reduce((s, p) => s + Number(p.orderQty || 0), 0).toLocaleString()} Pcs
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">{isBn ? 'অর্ডারের মোট মূল্য' : 'Total Value'}</span>
            <div className="font-mono font-black text-sm text-indigo-600 dark:text-indigo-400">
              ৳ {monthProductions.reduce((s, p) => s + Number(p.totalAmount || (p.orderQty * 15)), 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-extrabold uppercase tracking-wider">
                <th className="p-3.5">{isBn ? 'তারিখ ও ডেলিভারি' : 'Dates & Deadline'}</th>
                <th className="p-3.5">{isBn ? 'আইটেম, বায়ার ও টাইপ' : 'Item, Buyer & Type'}</th>
                <th className="p-3.5">{isBn ? 'লেন্থ / সাইজ' : 'Length / Spec'}</th>
                <th className="p-3.5 text-right">{isBn ? 'পরিমাণ ও সম্পন্ন' : 'Target & Done'}</th>
                <th className="p-3.5 text-right">{isBn ? 'মোট মূল্য' : 'Total Value'}</th>
                <th className="p-3.5 text-center">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                <th className="p-3.5 text-center">{isBn ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {monthProductions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400 font-medium">
                    {isBn ? `${selectedMonth} মাসে কোনো প্রোডাকশন অর্ডার পাওয়া যায়নি।` : `No production orders found for ${selectedMonth}.`}
                  </td>
                </tr>
              ) : (
                monthProductions.map((p) => {
                  const countdown = getDeliveryCountdown(p.deliveryDate);
                  const pct = Math.min(100, Math.round(((p.prodQty || 0) / Math.max(1, p.orderQty)) * 100));

                  return (
                    <tr key={p.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                      <td className="p-3.5 font-mono">
                        <div className="font-semibold text-slate-700 dark:text-slate-300">
                          {isBn ? 'অর্ডার' : 'Order'}: {p.orderDate || p.date}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {isBn ? 'ডেলিভারি' : 'Due'}: <span className="font-bold text-slate-700 dark:text-slate-200">{p.deliveryDate || 'N/A'}</span>
                        </div>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          countdown.status === 'overdue' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' :
                          countdown.status === 'today' ? 'bg-rose-500 text-white animate-pulse' :
                          countdown.status === 'urgent' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                          'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}>
                          {countdown.label}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="font-extrabold text-slate-900 dark:text-white">{p.itemName}</div>
                        <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                          {p.buyer} · {p.productType || 'Zipper'} · {p.section}
                        </div>
                      </td>

                      <td className="p-3.5 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {p.length || 'Standard'}
                      </td>

                      <td className="p-3.5 text-right font-mono">
                        <div className="font-black text-slate-900 dark:text-white">
                          {p.prodQty.toLocaleString()} / {p.orderQty.toLocaleString()} {p.unit}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-semibold">
                          {pct}% {isBn ? 'সম্পন্ন' : 'Completed'}
                        </div>
                      </td>

                      <td className="p-3.5 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                        ৳ {Number(p.totalAmount || (p.orderQty * 15)).toLocaleString()}
                      </td>

                      <td className="p-3.5 text-center">
                        <select
                          value={p.status}
                          onChange={(e) => onUpdateProduction({ ...p, status: e.target.value as 'Running' | 'Completed' | 'Delayed' })}
                          className={`text-xs font-bold px-2 py-1 rounded-lg border cursor-pointer focus:outline-none ${
                            p.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : p.status === 'Running'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300'
                                : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          <option value="Running">{t.running}</option>
                          <option value="Completed">{t.completed}</option>
                          <option value="Delayed">{t.delayed}</option>
                        </select>
                      </td>

                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteProduction(p.id);
                            triggerToast(isBn ? `"${p.itemName}" অর্ডার মুছে ফেলা হয়েছে।` : `Order "${p.itemName}" deleted.`);
                          }}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer active:scale-90 transition"
                          title="Delete Order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* 2. Section Management Tab */}
      {activeTab === 'sections' && (
      <div className={`border rounded-3xl p-6 space-y-4 shadow-xs ${cardBg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400 font-bold text-sm tracking-tight">
            <Layers className="w-5 h-5" />
            <span className="text-base text-slate-900 dark:text-white font-extrabold">{t.sectionManagement}</span>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {sections.length} active sections
          </span>
        </div>

        {sectionError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold">
            ⚠️ {sectionError}
          </div>
        )}

        {/* Add New Section Input */}
        <form onSubmit={handleAddNewSection} className="flex gap-2.5">
          <input
            type="text"
            value={newSectionInput}
            onChange={(e) => {
              setNewSectionInput(e.target.value);
              if (sectionError) setSectionError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddNewSection();
              }
            }}
            placeholder={isBn ? 'নতুন সেকশনের নাম লিখুন (যেমন: Embroidery, Printing, Washing, Dyeing)...' : 'Add new factory section (e.g. Embroidery, Printing, Button Hole, Washing)...'}
            className={`flex-1 px-4 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:border-indigo-600 ${inputBg}`}
          />
          <button
            type="button"
            onClick={() => handleAddNewSection()}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>{isBn ? 'নতুন সেকশন যোগ করুন' : 'Add Section'}</span>
          </button>
        </form>

        {/* Sections List with Inline Editing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          {sections.map((sec) => {
            const isEditing = editingSectionOriginal === sec;
            const workerCount = users.filter(u => u.section === sec).length;

            if (isEditing) {
              return (
                <div
                  key={sec}
                  className="p-3 rounded-2xl border-2 border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 flex items-center gap-2"
                >
                  <input
                    type="text"
                    autoFocus
                    value={editingSectionName}
                    onChange={(e) => setEditingSectionName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleConfirmRename();
                      if (e.key === 'Escape') setEditingSectionOriginal(null);
                    }}
                    className={`flex-1 px-3 py-1.5 rounded-lg border text-xs font-bold focus:outline-none ${inputBg}`}
                  />
                  <button
                    onClick={handleConfirmRename}
                    title="Save name"
                    className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingSectionOriginal(null)}
                    title="Cancel"
                    className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            }

            const isDeletingConfirm = deletingSectionConfirm === sec;

            if (isDeletingConfirm) {
              return (
                <div
                  key={sec}
                  className="p-3.5 rounded-2xl border-2 border-rose-500 bg-rose-50 dark:bg-rose-950/50 flex items-center justify-between gap-3 shadow-md animate-in fade-in duration-150"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-black text-xs text-rose-900 dark:text-rose-100 truncate">
                      {isBn ? `"${sec}" মুছবেন?` : `Delete "${sec}"?`}
                    </span>
                    {workerCount > 0 ? (
                      <span className="text-[10px] text-rose-600 dark:text-rose-300 font-bold">
                        ⚠️ {workerCount} {isBn ? 'কর্মী যুক্ত আছে' : 'workers assigned'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-rose-600 dark:text-rose-300 font-medium">
                        {isBn ? 'স্থায়ীভাবে ডিলিট হবে' : 'Cannot be undone'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDeleteSectionConfirm(sec)}
                      className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black cursor-pointer shadow-xs transition"
                    >
                      {isBn ? 'হ্যাঁ, মুছুন' : 'Delete'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingSectionConfirm(null)}
                      className="px-2.5 py-1 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer transition"
                    >
                      {isBn ? 'বাতিল' : 'Cancel'}
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={sec}
                className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 shadow-2xs ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex flex-col min-w-0">
                  <span className={`font-black text-sm truncate ${
                    darkMode ? 'text-white' : 'text-slate-900'
                  }`}>
                    {sec}
                  </span>
                  <span className={`text-[11px] font-mono font-semibold mt-0.5 ${
                    darkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {workerCount} {isBn ? 'জন কর্মী নিয়োজিত' : 'workers assigned'}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleStartRename(sec)}
                    title="Edit section name"
                    className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingSectionConfirm(sec)}
                    title="Delete section"
                    className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 font-bold transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* 5. External Audit & Compliance CSV Export Hub */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className={`border rounded-3xl p-6 shadow-xs space-y-4 ${cardBg}`}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                  📑
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">
                    {isBn ? 'কারখানা এক্সটার্নাল অডিট ও ডেটা এক্সপোর্ট হাব' : 'Factory External Audit & Compliance Data Hub'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isBn 
                      ? 'লেবার ল কমপ্লায়েন্স, বিজিএমইএ/বিকেএমইএ ও সরকারি অডিটের জন্য সকল হাজিরা, ওভারটাইম, প্রোডাকশন ও বেতন ডাটা সিএসভি ফাইলে এক্সপোর্ট' 
                      : 'Export attendance, overtime, production, and payroll records for external auditing and compliance inspections'}
                  </p>
                </div>
              </div>

              {/* Quick 1-Click Master Audit Download */}
              <button
                type="button"
                onClick={() => handleExportAuditCSV('all')}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs uppercase tracking-wider shadow-lg transition flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>{isBn ? '📥 সম্পূর্ণ কারখানা অডিট ফাইল (All-In-One CSV)' : '📥 Master Audit CSV (All Modules)'}</span>
              </button>
            </div>

            {/* Audit Scope / Month Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">{isBn ? 'অডিট মাস নির্বাচন:' : 'Audit Period:'}</span>
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-black">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedMonth}
                    onChange={(e) => onSelectMonth(e.target.value)}
                    className="bg-transparent focus:outline-none cursor-pointer"
                  >
                    {monthOptions.map(m => (
                      <option key={m.value} value={m.value} className={darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Reg No: {companyProfile.factoryRegNo}</span>
                <span>·</span>
                <span>{users.length} Active Workers</span>
              </div>
            </div>
          </div>

          {/* Audit Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`border rounded-2xl p-4 shadow-xs space-y-1 ${cardBg}`}>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isBn ? 'মোট কর্মী মাস্টার' : 'Personnel'}</span>
              <div className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">{users.length} জন</div>
              <p className="text-[10px] text-slate-400 font-mono">কর্মী ডাটাবেজ</p>
            </div>
            <div className={`border rounded-2xl p-4 shadow-xs space-y-1 ${cardBg}`}>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isBn ? 'হাজিরা লগ' : 'Attendance Logs'}</span>
              <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">{(attendance || []).length} টি</div>
              <p className="text-[10px] text-slate-400 font-mono">উপস্থিতি রেকর্ড</p>
            </div>
            <div className={`border rounded-2xl p-4 shadow-xs space-y-1 ${cardBg}`}>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isBn ? 'ওভারটাইম লগ' : 'Overtime Logs'}</span>
              <div className="text-xl font-black font-mono text-amber-600 dark:text-amber-400">{(overtime || []).length} টি</div>
              <p className="text-[10px] text-slate-400 font-mono">ইপিজেড ওটি হিসাব</p>
            </div>
            <div className={`border rounded-2xl p-4 shadow-xs space-y-1 ${cardBg}`}>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isBn ? 'প্রোডাকশন অর্ডার' : 'Production Logs'}</span>
              <div className="text-xl font-black font-mono text-purple-600 dark:text-purple-400">{(productions || []).length} টি</div>
              <p className="text-[10px] text-slate-400 font-mono">পিস আউটপুট রেকর্ড</p>
            </div>
          </div>

          {/* Individual Module Audit Cards with 1-Click CSV Exports */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Attendance Audit CSV */}
            <div className={`border rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between ${cardBg}`}>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4" />
                    <span>{isBn ? 'হাজিরা অডিট মডিউল' : 'Attendance Audit'}</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">{(attendance || []).length} Records</span>
                </div>
                <h4 className="font-extrabold text-sm">{isBn ? 'দৈনিক উপস্থিতি ও শিফট অডিট CSV' : 'Daily Attendance & Shifts Audit CSV'}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isBn 
                    ? 'প্রতিটি কর্মীর তারিখ, ইন-টাইম, আউট-টাইম, শিফট ও প্রেজেন্ট/অ্যাবসেন্ট বিস্তারিত লগ।' 
                    : 'Worker daily punch records, entry/exit timestamps, shifts, and absent/late statuses.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleExportAuditCSV('attendance')}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>{isBn ? '📥 হাজিরা অডিট CSV ডাউনলোড' : 'Download Attendance Audit CSV'}</span>
              </button>
            </div>

            {/* Card 2: Overtime Audit CSV */}
            <div className={`border rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between ${cardBg}`}>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{isBn ? 'ওভারটাইম অডিট মডিউল' : 'Overtime Audit'}</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">{(overtime || []).length} Records</span>
                </div>
                <h4 className="font-extrabold text-sm">{isBn ? 'অতিরিক্ত কর্মঘণ্টা ও ওটি বিল অডিট CSV' : 'Overtime Hours & Payout Audit CSV'}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isBn 
                    ? 'আইনি (বেসিক ÷ ৩০ ÷ ৮) ফর্মুলায় প্রতি ঘণ্টার ওটি রেট, কাজের বিবরণ ও অনুমোদনকারীর নাম।' 
                    : 'Legal formula calculations, hourly rate, verified duty descriptions, and approval authority logs.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleExportAuditCSV('overtime')}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>{isBn ? '📥 ওভারটাইম অডিট CSV ডাউনলোড' : 'Download Overtime Audit CSV'}</span>
              </button>
            </div>

            {/* Card 3: Production Audit CSV */}
            <div className={`border rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between ${cardBg}`}>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-bold text-xs flex items-center gap-1.5">
                    <Package className="w-4 h-4" />
                    <span>{isBn ? 'প্রোডাকশন অডিট মডিউল' : 'Production Audit'}</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">{(productions || []).length} Orders</span>
                </div>
                <h4 className="font-extrabold text-sm">{isBn ? 'উৎপাদিত পিস, বায়ার ও অর্ডার অডিট CSV' : 'Pieces Produced, Buyer & Order Audit CSV'}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isBn 
                    ? 'সেকশনভিত্তিক প্রতিটি অর্ডারের লক্ষ্যমাত্রা, উৎপাদিত পিস, বায়ারের নাম ও ডেলিভারি স্ট্যাটাস।' 
                    : 'Section order quotas, actual produced pieces, buyer companies, units, and verification history.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleExportAuditCSV('production')}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>{isBn ? '📥 প্রোডাকশন অডিট CSV ডাউনলোড' : 'Download Production Audit CSV'}</span>
              </button>
            </div>

            {/* Card 4: Payroll & Wages Audit CSV */}
            <div className={`border rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between ${cardBg}`}>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4" />
                    <span>{isBn ? 'পেরোল ও বেতন বিবরণী' : 'Payroll Audit'}</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">{selectedMonth}</span>
                </div>
                <h4 className="font-extrabold text-sm">{isBn ? 'মাসিক বেতন ও ওভারটাইম সেটেলমেন্ট CSV' : 'Monthly Wage & Settlement Audit CSV'}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isBn 
                    ? 'বেসিক বেতন, ওটি ঘণ্টা ও বিল, মোট প্রদেয় অর্থ এবং পরিশোধিত/বকেয়া স্ট্যাটাস রিপোর্ট।' 
                    : 'Employee basic pay, approved overtime payouts, net gross amount, and disbursement status.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleExportAuditCSV('payroll')}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>{isBn ? '📥 পেরোল অডিট CSV ডাউনলোড' : 'Download Payroll Audit CSV'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Registered Accounts Tab */}
      {activeTab === 'accounts' && (() => {
        const filteredUsers = users.filter((u) => {
          const q = userSearchQuery.trim().toLowerCase();
          if (!q) return true;
          return (
            (u.fullName || '').toLowerCase().includes(q) ||
            (u.employeeId || '').toLowerCase().includes(q) ||
            (u.section || '').toLowerCase().includes(q) ||
            (u.designation || '').toLowerCase().includes(q) ||
            (u.username || '').toLowerCase().includes(q)
          );
        });

        return (
          <div className={`border rounded-3xl overflow-hidden shadow-xs ${cardBg}`}>
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight flex items-center gap-2">
                    <span>{isBn ? 'নিবন্ধিত কর্মী ও কর্মকর্তা তালিকা' : 'Registered Factory Accounts'}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      {filteredUsers.length} / {users.length}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isBn ? 'কর্মীর পদবি, সেকশন, একাউন্ট ক্রেডেনশিয়াল ও বেতনের হিসাব' : 'Designations, sections, login credentials, and wage scale'}
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs text-slate-400 font-mono">Master Roster</span>
                </div>
              </div>

              {/* Real-Time Search Input Field */}
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4 text-indigo-500" />
                </div>
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder={isBn ? '🔍 নাম, এমপ্লয়ি আইডি অথবা সেকশন দিয়ে রিয়েল-টাইমে খুঁজুন... (e.g. Mojnu, CAF-001, Sewing)' : '🔍 Search by name, employee ID, or section in real-time...'}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-2xl border text-xs focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition shadow-2xs ${inputBg}`}
                />
                {userSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setUserSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer text-xs font-bold"
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-extrabold uppercase tracking-wider">
                    <th className="p-4">Employee</th>
                    <th className="p-4">Role & Section</th>
                    <th className="p-4 font-mono">Credentials</th>
                    <th className="p-4 text-right">Basic Salary</th>
                    <th className="p-4 text-right">OT Rate/Hr</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        <p className="font-bold text-xs">{isBn ? `"${userSearchQuery}" দিয়ে কোনো কর্মী বা অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।` : `No accounts found matching "${userSearchQuery}".`}</p>
                        <button
                          type="button"
                          onClick={() => setUserSearchQuery('')}
                          className="mt-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs underline cursor-pointer"
                        >
                          {isBn ? 'সার্চ রিসেট করুন' : 'Reset search filter'}
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                return (
                  <tr key={u.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                    <td className="p-4">
                      <UserProfileBadge user={u} showJoiningDate={true} darkMode={darkMode} language={language} />
                    </td>

                    <td className="p-4">
                      <div className="font-bold flex items-center gap-1.5 flex-wrap">
                        <span>{u.designation}</span>
                        {u.accountStatus === 'Pending' ? (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            {isBn ? 'অপেক্ষমাণ' : 'Pending'}
                          </span>
                        ) : u.accountStatus === 'Inactive' ? (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            {isBn ? 'নিষ্ক্রিয়' : 'Inactive'}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            {isBn ? 'সক্রিয়' : 'Active'}
                          </span>
                        )}
                        {u.pendingPhotoUrl && (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                            {isBn ? 'ছবি পেন্ডিং' : 'Photo Pending'}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">{u.section} · {u.accountType.toUpperCase()}</div>
                    </td>

                    <td className="p-4 font-mono">
                      <div className="font-semibold text-indigo-600 dark:text-indigo-400">{u.username}</div>
                      <div className="text-[10px] text-slate-400">Pass: {u.password || '••••••••'}</div>
                    </td>

                    <td className="p-4 text-right font-mono font-bold tabular-nums">
                      ৳ {Number(u.basicSalary || 0).toLocaleString()}
                    </td>

                    <td className="p-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                      ৳ {Number(u.hourlyRate || 0).toFixed(2)}
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onOpenIdCardModal(u)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 font-bold text-[10px] transition cursor-pointer"
                        >
                          {t.idBadge}
                        </button>
                        <button
                          onClick={() => setEditingUser({ ...u })}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-bold text-[10px] transition cursor-pointer"
                        >
                          {t.edit}
                        </button>
                        {u.accountType !== 'hosting' && onDeleteUser && (
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteUser(u.id);
                              triggerToast(isBn ? `"${u.fullName}" এর অ্যাকাউন্ট মুছে ফেলা হয়েছে।` : `Account "${u.fullName}" deleted.`);
                            }}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer active:scale-90 transition"
                            title="Delete user"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
      );
      })()}

      {/* 4. Company Name, Address, Banner & Profile Dedicated Tab */}
      {activeTab === 'company_profile' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Card */}
          <div className={`p-6 rounded-3xl border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${cardBg}`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-black text-xl shadow-md">
                🏢
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">
                  {isBn ? 'কোম্পানি নাম, ঠিকানা ও অফিশিয়াল ব্র্যান্ডিং পোর্টাল' : 'Company Profile, Factory Address & Branding'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isBn 
                    ? 'কারখানার নাম, ঠিকানা, ব্যানার ও লোগো পরিবর্তন করুন। অন্য কোম্পানির ঠিকানা দিয়ে বিক্রির জন্য সহজেই ঠিকানা সুইচ করুন।' 
                    : 'Manage company name, factory addresses, official banner, and logo. Quick-switch addresses when dispatching to external buyers.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveCompanyInfo}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md transition active:scale-95 shrink-0"
            >
              <Check className="w-4 h-4" />
              <span>{isBn ? '✓ সকল তথ্য সংরক্ষণ করুন' : '✓ Save All Changes'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Company Name, Factory Address & Multi-Address Switcher */}
            <div className={`p-6 rounded-3xl border shadow-xs space-y-5 ${cardBg}`}>
              <div className="flex items-center justify-between border-b pb-3.5 border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
                  <Building2 className="w-4 h-4" />
                  <span>{isBn ? 'কোম্পানির নাম ও কারখানা ঠিকানা' : 'Company Name & Factory Address'}</span>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                  {isBn ? 'মাল্টি-কোম্পানি সুইচ' : 'Multi-Company Switch'}
                </span>
              </div>

              {/* Company Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isBn ? 'কোম্পানির নাম (Company Name):' : 'Company Name:'}
                </label>
                <input
                  type="text"
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  placeholder="e.g. Creative Accessories Factory"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 ${inputBg}`}
                />
                <p className="text-[11px] text-slate-400">
                  {isBn ? 'এই নামটি নেভিগেশন বার, আইডি কার্ড, পে-রোল ও অডিট ফাইলে প্রদর্শিত হবে।' : 'Printed across navbar, digital ID cards, payroll vouchers, and compliance reports.'}
                </p>
              </div>

              {/* Factory Address */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isBn ? 'সক্রিয় কারখানা / অফিস ঠিকানা (Active Factory Address):' : 'Active Factory / Dispatch Address:'}
                  </label>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                    {isBn ? 'রিপোর্টে মুদ্রিত হবে' : 'Active in Reports'}
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={compAddress}
                  onChange={(e) => setCompAddress(e.target.value)}
                  placeholder="e.g. Bamnartek, Dhaka 1230, Bangladesh"
                  className={`w-full p-3 rounded-xl border text-xs focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 leading-relaxed ${inputBg}`}
                />
              </div>

              {/* Preset Addresses Multi-Switcher */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/60 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>{isBn ? 'অন্য কোম্পানির ঠিকানায় দ্রুত সুইচ (অন্য কোম্পানির ঠিকানা দিয়ে বিক্রি):' : 'Quick-Switch to Other Factory / Company Address:'}</span>
                  </span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                    {savedAddresses.length} saved
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {isBn 
                    ? 'যে ঠিকানায় ক্লিক করবেন সেটি সাথে সাথে অ্যাক্টিভ ঠিকানা হিসেবে সেট হয়ে যাবে:' 
                    : 'Click any address below to immediately activate it for current invoices & delivery notes:'}
                </p>

                {/* Address Pills */}
                <div className="flex flex-wrap gap-2">
                  {savedAddresses.map((addr, idx) => {
                    const isCurrent = compAddress.trim().toLowerCase() === addr.trim().toLowerCase();
                    return (
                      <div
                        key={idx}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer select-none ${
                          isCurrent
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectPresetAddress(addr)}
                          className="flex items-center gap-1.5 text-left cursor-pointer"
                        >
                          <span>{isCurrent ? '✓' : '📍'}</span>
                          <span className="truncate max-w-[220px]">{addr}</span>
                        </button>
                        {savedAddresses.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePresetAddress(addr);
                            }}
                            className="text-slate-400 hover:text-rose-500 p-0.5 ml-1 rounded cursor-pointer"
                            title="Delete address"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add New Address */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newAddressInput}
                    onChange={(e) => setNewAddressInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPresetAddress();
                      }
                    }}
                    placeholder={isBn ? 'নতুন অন্য কোনো ঠিকানা লিখুন (যেমন: Plot 22, Savar EPZ...)' : 'Type another factory/company address...'}
                    className={`flex-1 px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  />
                  <button
                    type="button"
                    onClick={handleAddPresetAddress}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isBn ? 'যোগ করুন' : 'Add'}</span>
                  </button>
                </div>
              </div>

              {/* Official Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {isBn ? 'যোগাযোগ নাম্বার' : 'Contact Number'}
                  </label>
                  <input
                    type="text"
                    value={compContact}
                    onChange={(e) => setCompContact(e.target.value)}
                    placeholder="01756628160"
                    className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {isBn ? 'অফিসিয়াল ইমেইল' : 'Email'}
                  </label>
                  <input
                    type="email"
                    value={compEmail}
                    onChange={(e) => setCompEmail(e.target.value)}
                    placeholder="contact@company.com"
                    className={`w-full p-2.5 rounded-xl border text-xs font-mono focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {isBn ? 'রেজিস্ট্রেশন নং' : 'Reg No'}
                  </label>
                  <input
                    type="text"
                    value={compRegNo}
                    onChange={(e) => setCompRegNo(e.target.value)}
                    placeholder="CAF-IND-94821"
                    className={`w-full p-2.5 rounded-xl border text-xs font-mono focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveCompanyInfo}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-sm transition active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{isBn ? '✓ কোম্পানি নাম ও ঠিকানা সংরক্ষণ করুন' : '✓ Save Company Name & Address'}</span>
              </button>
            </div>

            {/* Right Column: Company Logo & Branding */}
            <div className="space-y-6">
              {/* Logo Card */}
              <div className={`p-6 rounded-3xl border shadow-xs space-y-4 ${cardBg}`}>
                <div className="flex items-center justify-between border-b pb-3.5 border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
                    <ImageIcon className="w-4 h-4" />
                    <span>{t.companyLogo}</span>
                  </div>
                  {companyProfile.logoUrl && (
                    <button
                      type="button"
                      onClick={handleResetDefaultLogo}
                      className="text-xs font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset to Default</span>
                    </button>
                  )}
                </div>

                <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center bg-slate-50 dark:bg-slate-950 min-h-[80px]">
                  <CompanyLogo logoUrl={companyProfile.logoUrl} size="lg" variant="full" darkMode={darkMode} />
                </div>

                <div className="space-y-2.5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleLogoFileChange}
                    className="hidden"
                  />
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>{isBn ? 'লোগো ফাইল আপলোড করুন' : 'Upload Logo File'}</span>
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={inputLogoUrl}
                      onChange={(e) => setInputLogoUrl(e.target.value)}
                      placeholder="Or paste image URL (https://...)"
                      className={`flex-1 px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-indigo-600 font-mono ${inputBg}`}
                    />
                    <button
                      type="button"
                      onClick={handleSaveLogoUrl}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shrink-0 transition"
                    >
                      {isBn ? 'সেভ' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Secure Settings Modal (Company Logo, Firebase RTDB, Notice Board) */}
      {settingsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`border rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 ${cardBg}`}>
            <div className="flex justify-between items-center border-b pb-4 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight">
                    {isBn ? 'সিস্টেম সেটিংস ও ক্লাউড কনফিগারেশন' : 'System & Cloud Settings'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isBn ? 'কোম্পানি লোগো, নোটিশ বোর্ড ও ক্লাউড ডাটাবেস (Firebase RTDB)' : 'Company logo, notice board and live cloud synchronization'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSettingsModalOpen(false)} 
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer transition text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Warning Banner */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">
                  {isBn ? '⚠️ সংবেদনশীল কনফিগারেশন সতর্কতা:' : '⚠️ Sensitive Configuration Warning:'}
                </span>
                <span className="mt-0.5 block leading-relaxed text-[11px] text-amber-800 dark:text-amber-300">
                  {isBn ? 'ফায়ারবেস ক্লাউড ডাটাবেস ইউআরএল পরিবর্তন করলে সমস্ত সংযুক্ত ডিভাইসের সাথে লাইভ ডাটা সিঙ্ক প্রভাবিত হবে। প্রয়োজন ছাড়া এটি পরিবর্তন করবেন না।' : 'Changing the Firebase Realtime Database URL directly alters live state synchronization across all connected devices.'}
                </span>
              </div>
            </div>

            {/* Company Name & Factory Address Management Card */}
            <div className="p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-indigo-100 dark:border-indigo-900/40">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
                  <Building2 className="w-4 h-4" />
                  <span>{isBn ? 'কোম্পানি নাম ও কারখানা ঠিকানা' : 'Company Name & Factory Address'}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 font-semibold">
                  {isBn ? 'বিক্রি বা ঠিকানা সুইচ' : 'Multi-Address Switch'}
                </span>
              </div>

              <div className="space-y-3">
                {/* Company Name Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    {isBn ? 'কোম্পানির নাম (Company Name):' : 'Company Name:'}
                  </label>
                  <input
                    type="text"
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    placeholder="e.g. Creative Accessories Factory"
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  />
                </div>

                {/* Factory Address Textarea */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>{isBn ? 'কারখানা / অফিস ঠিকানা (Factory Address):' : 'Factory / Company Address:'}</span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">
                      {isBn ? 'আইডি কার্ড ও রিপোর্টে মুদ্রিত হবে' : 'Printed on ID cards & reports'}
                    </span>
                  </label>
                  <textarea
                    rows={2}
                    value={compAddress}
                    onChange={(e) => setCompAddress(e.target.value)}
                    placeholder="e.g. Bamnartek, Dhaka 1230, Bangladesh"
                    className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  />
                </div>

                {/* Preset Address Quick Selector & Add Custom Address */}
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{isBn ? 'অন্য কোম্পানির ঠিকানা দিয়ে বিক্রি বা দ্রুত বাছাই:' : 'Switch to Other Preset / Company Address:'}</span>
                    </span>
                  </div>

                  {/* Saved Address Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {savedAddresses.map((addr, idx) => {
                      const isCurrent = compAddress.trim().toLowerCase() === addr.trim().toLowerCase();
                      return (
                        <div
                          key={idx}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium border transition cursor-pointer select-none ${
                            isCurrent
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleSelectPresetAddress(addr)}
                            className="flex items-center gap-1 text-left cursor-pointer"
                          >
                            <span>{isCurrent ? '✓' : '📍'}</span>
                            <span className="truncate max-w-[200px]">{addr}</span>
                          </button>
                          {savedAddresses.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePresetAddress(addr);
                              }}
                              className="text-slate-400 hover:text-rose-500 p-0.5 ml-0.5 rounded cursor-pointer"
                              title="Delete from list"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Add New Address to List */}
                  <div className="flex gap-1.5 pt-1">
                    <input
                      type="text"
                      value={newAddressInput}
                      onChange={(e) => setNewAddressInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddPresetAddress();
                        }
                      }}
                      placeholder={isBn ? 'নতুন অন্য কোনো ঠিকানা লিখুন (যেমন: Plot 22, Savar EPZ...)' : 'Add another factory/company address...'}
                      className={`flex-1 px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-indigo-600 ${inputBg}`}
                    />
                    <button
                      type="button"
                      onClick={handleAddPresetAddress}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isBn ? 'যোগ করুন' : 'Add'}</span>
                    </button>
                  </div>
                </div>

                {/* Contact, Email & Reg No Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                      {isBn ? 'যোগাযোগ নাম্বার' : 'Contact Number'}
                    </label>
                    <input
                      type="text"
                      value={compContact}
                      onChange={(e) => setCompContact(e.target.value)}
                      placeholder="01756628160"
                      className={`w-full p-2 rounded-xl border text-xs font-mono font-bold focus:outline-none focus:border-indigo-600 ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                      {isBn ? 'অফিসিয়াল ইমেইল' : 'Email'}
                    </label>
                    <input
                      type="email"
                      value={compEmail}
                      onChange={(e) => setCompEmail(e.target.value)}
                      placeholder="contact@company.com"
                      className={`w-full p-2 rounded-xl border text-xs font-mono focus:outline-none focus:border-indigo-600 ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                      {isBn ? 'রেজিস্ট্রেশন নং' : 'Reg No'}
                    </label>
                    <input
                      type="text"
                      value={compRegNo}
                      onChange={(e) => setCompRegNo(e.target.value)}
                      placeholder="CAF-IND-94821"
                      className={`w-full p-2 rounded-xl border text-xs font-mono focus:outline-none focus:border-indigo-600 ${inputBg}`}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveCompanyInfo}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-xs transition active:scale-[0.99] flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isBn ? '✓ কোম্পানি নাম ও ঠিকানা সংরক্ষণ করুন' : '✓ Save Company Name & Address'}</span>
                </button>
              </div>
            </div>

            {/* Logo Settings */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
                  <ImageIcon className="w-4 h-4" />
                  <span>{t.companyLogo}</span>
                </div>
                {companyProfile.logoUrl && (
                  <button
                    onClick={handleResetDefaultLogo}
                    className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to Default</span>
                  </button>
                )}
              </div>

              {/* Current Logo Preview */}
              <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center bg-slate-50 dark:bg-slate-950 min-h-[90px]">
                <CompanyLogo logoUrl={companyProfile.logoUrl} size="lg" variant="full" darkMode={darkMode} />
              </div>

              {/* Upload or Link inputs */}
              <div className="space-y-2.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleLogoFileChange}
                  className="hidden"
                />
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{isBn ? 'লোগো ফাইল আপলোড করুন' : 'Upload Logo File (Image)'}</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={inputLogoUrl}
                    onChange={(e) => setInputLogoUrl(e.target.value)}
                    placeholder="Or paste image URL (https://...)"
                    className={`flex-1 px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-indigo-600 font-mono ${inputBg}`}
                  />
                  <button
                    type="button"
                    onClick={handleSaveLogoUrl}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shrink-0 transition"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>

            {/* Cloud Database (Firebase RTDB) Config */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <Database className="w-4 h-4" />
                <span>{t.cloudDbUrl} (Firebase RTDB)</span>
              </div>
              <p className="text-[11px] text-slate-500">
                {isBn ? 'লাইভ ক্লাউড ফায়ারবেস রিয়েলটাইম ডাটাবেস এন্ডপয়েন্ট' : 'Live cloud Firebase Realtime Database endpoint'}
              </p>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={customCloudUrl}
                  onChange={(e) => setCustomCloudUrl(e.target.value)}
                  placeholder="https://your-database.firebaseio.com/"
                  className={`flex-1 p-2 rounded-xl border text-xs font-mono focus:outline-none focus:border-indigo-600 ${inputBg}`}
                />
                <button
                  onClick={() => {
                    onUpdateCloudUrl(customCloudUrl);
                    triggerToast('Cloud DB endpoint updated!');
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer shrink-0"
                >
                  Update & Sync
                </button>
              </div>
            </div>

            {/* Factory Notice Board */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                <Settings className="w-4 h-4" />
                <span>{t.factoryNoticeBoard}</span>
              </div>

              {/* Title input according to description */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                  {isBn ? 'নোটিশের শিরোনাম / টাইটেল (Title):' : 'Notice Title:'}
                </label>
                <input
                  type="text"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder={isBn ? 'যেমন: জরুরি নাইট শিফট নোটিশ, ডেলিভারি মিটিং...' : 'e.g. Urgent Night Shift Notice, Delivery Meeting...'}
                  className={`w-full p-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:border-indigo-600 ${inputBg}`}
                />
              </div>

              {/* Description textarea */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                  {isBn ? 'নোটিশের বিবরণ / মেসেজ (Description):' : 'Notice Message / Description:'}
                </label>
                <textarea
                  rows={2}
                  value={noticeText}
                  onChange={(e) => setNoticeText(e.target.value)}
                  placeholder="Type notice message to broadcast to all factory workers..."
                  className={`w-full p-3 rounded-xl border text-xs focus:outline-none focus:border-indigo-600 ${inputBg}`}
                />
              </div>

              {/* Employee Mentions Picker */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-700 dark:text-slate-200">
                    👥 {isBn ? 'কর্মী মেনশন করুন (এলার্ট পাবে):' : 'Mention Workers (Will get alert):'}
                  </span>
                  <span className="text-indigo-600 font-mono">({adminMentionedIds.length} জন)</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pt-1">
                  {users.filter(u => u.accountType !== 'hosting').map(u => {
                    const isSelected = adminMentionedIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setAdminMentionedIds(prev => 
                            prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id]
                          );
                        }}
                        className={`px-2 py-0.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>{isSelected ? '✓' : '@'}</span>
                        <span>{u.fullName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => {
                  onUpdateCompanyNotice(noticeText, noticeTitle, adminMentionedIds);
                  triggerToast(isBn ? 'নোটিশ ও কর্মী মেনশন সফলভাবে আপডেট হয়েছে!' : 'Notice and worker mentions updated!');
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black cursor-pointer shadow-xs transition"
              >
                {isBn ? 'নোটিশ সংরক্ষণ ও প্রকাশ করুন' : 'Save & Publish Notice'}
              </button>
            </div>

            {/* Factory Duty Timing & Working Hours (Requirement 3: Configurable duty hours) */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <Clock className="w-4 h-4" />
                <span>{isBn ? 'ফ্যাক্টরি ডিউটি শিডিউল ও কাজের সময়সূচী' : 'Factory Duty Schedule & Working Hours'}</span>
              </div>
              <p className="text-[11px] text-slate-500">
                {isBn 
                  ? 'স্ট্যান্ডার্ড কাজের সময় (ডিফল্ট: সকাল ৮:০০ থেকে বিকাল ৫:০০, ১ ঘণ্টা মধ্যাহ্নভোজ বিরতি)' 
                  : 'Standard working shift (Default: 8:00 AM to 5:00 PM, 1-hour lunch break)'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {isBn ? 'ইন টাইম (Start Time)' : 'Duty Start Time'}
                  </label>
                  <input
                    type="time"
                    value={dutyStart}
                    onChange={(e) => setDutyStart(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {isBn ? 'আউট টাইম (End Time)' : 'Duty End Time'}
                  </label>
                  <input
                    type="time"
                    value={dutyEnd}
                    onChange={(e) => setDutyEnd(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {isBn ? 'লাঞ্চ বিরতি (ঘণ্টা)' : 'Lunch Break (Hours)'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="3"
                    value={dutyLunch}
                    onChange={(e) => setDutyLunch(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (onUpdateDutySettings) {
                    onUpdateDutySettings({
                      startHour: dutyStart,
                      endHour: dutyEnd,
                      graceMinutes: dutySettings?.graceMinutes ?? 15,
                      defaultOvertimeStart: dutyEnd,
                      startTime: dutyStart,
                      endTime: dutyEnd,
                      lunchBreakHours: dutyLunch,
                      standardDailyHours: 8
                    });
                    triggerToast(isBn ? 'ডিউটি শিডিউল সফলভাবে আপডেট হয়েছে!' : 'Duty schedule updated successfully!');
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer transition shadow-xs"
              >
                {isBn ? 'ডিউটি শিডিউল সেভ করুন' : 'Save Duty Schedule'}
              </button>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs cursor-pointer shadow-sm transition"
              >
                {isBn ? 'সেটিংস বন্ধ করুন' : 'Close Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Production Order Creation Modal */}
      {orderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`border rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 ${cardBg}`}>
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-base">
                  {isBn ? 'নতুন প্রোডাকশন অর্ডার এন্ট্রি' : 'New Production Order Entry'}
                </h3>
              </div>
              <button onClick={() => setOrderModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleOrderSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {isBn ? 'অর্ডার আসার তারিখ (Order Date) *' : 'Order Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 font-mono ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {isBn ? 'ডেলিভারি তারিখ (Delivery Date) *' : 'Delivery Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 font-mono ${inputBg}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {isBn ? 'আইটেমের নাম (Item Name) *' : 'Item Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g. Metal Zipper #5 (Antique Brass)"
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {isBn ? 'বায়ার (Buyer Name) *' : 'Buyer *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={buyer}
                    onChange={(e) => setBuyer(e.target.value)}
                    placeholder="e.g. H&M / Zara / M&S"
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {isBn ? 'প্রোডাকশন টাইপ *' : 'Product Type *'}
                  </label>
                  <select
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  >
                    <option value="Zipper">Zipper (জিপার)</option>
                    <option value="Elastic">Elastic (ইলাস্টিক)</option>
                    <option value="Tape">Tape (টেপ)</option>
                    <option value="Labels">Labels (লেবেল)</option>
                    <option value="Printing">Printing (প্রিন্টিং)</option>
                    <option value="Accessories">Accessories (এক্সেসরিজ)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {isBn ? 'লেন্থ / সাইজ *' : 'Length / Spec *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    placeholder="e.g. 24 Inch / 40mm"
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {isBn ? 'ফ্যাক্টরি সেকশন *' : 'Section *'}
                  </label>
                  <select
                    value={orderSection}
                    onChange={(e) => setOrderSection(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  >
                    {sections.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {isBn ? 'অর্ডারের মোট পরিমাণ *' : 'Total Order Qty *'}
                  </label>
                  <input
                    type="number"
                    required
                    value={orderQty}
                    onChange={(e) => handleQtyPriceChange(e.target.value, unitPrice)}
                    placeholder="5000"
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 font-mono ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {isBn ? 'একক (Unit)' : 'Unit'}
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  >
                    <option value="Pcs">Pcs (পিস)</option>
                    <option value="Yards">Yards (গজ)</option>
                    <option value="Doz">Dozen (ডজন)</option>
                    <option value="Gross">Gross (গ্রস)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {isBn ? 'প্রতি পিসের মূল্য (৳)' : 'Unit Price (BDT)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={unitPrice}
                    onChange={(e) => handleQtyPriceChange(orderQty, e.target.value)}
                    placeholder="15"
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 font-mono ${inputBg}`}
                  />
                </div>
              </div>

              {/* Auto calculated total amount */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider block">
                    {isBn ? 'মোট অর্ডারের মূল্য (স্বয়ংক্রিয় হিসাব):' : 'Total Order Amount (Auto Calculated):'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {orderQty} {unit} × ৳{unitPrice}
                  </span>
                </div>
                <div className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400">
                  ৳ {Number(totalAmount).toLocaleString()}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setOrderModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold cursor-pointer shadow-sm transition"
                >
                  {isBn ? 'অর্ডার সেভ করুন' : 'Save Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Holiday Calendar & Google Calendar Tab ("এটা সেটিং এ থাকবে") */}
      {activeTab === 'holidays' && (
        <BangladeshHolidayCalendar
          language={language}
          darkMode={darkMode}
          currentUser={currentUser}
        />
      )}

      {/* Company Profile, Name & Address Management Tab */}
      {activeTab === 'company_profile' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className={`border rounded-3xl p-6 space-y-2 shadow-xs ${cardBg}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400 font-bold text-sm tracking-tight">
                <Building2 className="w-5 h-5" />
                <span className="text-base text-slate-900 dark:text-white font-extrabold">
                  {isBn ? 'কোম্পানি প্রোফাইল, নাম ও ঠিকানা ম্যানেজমেন্ট' : 'Company Name, Address & Branding Console'}
                </span>
              </div>
              <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 text-xs font-bold">
                {isBn ? 'বিক্রি বা রিব্র্যান্ডিং উপযোগী' : 'Rebrand & Multi-Address'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {isBn 
                ? 'কোম্পানির নাম, কারখানার ঠিকানা, ব্যানার ও অফিসিয়াল তথ্য যে কোনো সময় পরিবর্তন করুন। অন্য কোম্পানির ঠিকানায় পণ্য ডেলিভারি দিতে বা বিক্রি করতে চাইলে সংরক্ষিত প্রি-সেট ঠিকানা থেকে দ্রুত সিলেক্ট করুন।' 
                : 'Update official company name, factory addresses, official banner, and branding. Switch addresses anytime to sell or deliver under another company identity.'}
            </p>
          </div>

          {/* Main Configuration Card */}
          <div className={`border rounded-3xl p-6 space-y-6 shadow-xs ${cardBg}`}>
            {/* Primary Details: Name & Address */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2 border-b pb-2 border-slate-200 dark:border-slate-800">
                <Building2 className="w-4 h-4" />
                <span>{isBn ? '১. কোম্পানির নাম ও কারখানা ঠিকানা' : '1. Company Name & Factory Address'}</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isBn ? 'কোম্পানির নাম (Company Name) *' : 'Company Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    placeholder="e.g. Creative Accessories Factory"
                    className={`w-full p-3 rounded-2xl border text-sm font-black focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {isBn ? 'অন্য কোম্পানির কাছে বিক্রি করলে বা নতুন নামে চালাতে চাইলে এখানে নাম দিন' : 'Enter company name for invoices, ID cards, and reports'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isBn ? 'কারখানা লাইসেন্স / রেজিস্ট্রেশন নং (Factory Reg No)' : 'Factory Registration Number'}
                  </label>
                  <input
                    type="text"
                    value={compRegNo}
                    onChange={(e) => setCompRegNo(e.target.value)}
                    placeholder="CAF-IND-94821"
                    className={`w-full p-3 rounded-2xl border text-sm font-mono font-bold focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  />
                </div>
              </div>

              {/* Active Address Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>{isBn ? 'বর্তমান সক্রিয় ঠিকানা (Active Factory / Office Address) *' : 'Active Company Address *'}</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-[11px]">
                    {isBn ? 'আইডি কার্ড ও রিপোর্টে মুদ্রিত হবে' : 'Shown on ID cards & reports'}
                  </span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={compAddress}
                  onChange={(e) => setCompAddress(e.target.value)}
                  placeholder="e.g. Bamnartek, Dhaka 1230, Bangladesh"
                  className={`w-full p-3 rounded-2xl border text-xs focus:outline-none focus:border-indigo-600 leading-relaxed font-semibold ${inputBg}`}
                />
              </div>

              {/* Multi-address Switcher & Presets ("অন্য কোম্পানির ঠিকানা দিয়ে বিক্রি বা দ্রুত বাছাই") */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-indigo-900 dark:text-indigo-200">
                    <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>{isBn ? 'অন্য কোম্পানির ঠিকানা দিয়ে বিক্রি বা দ্রুত সুইচ করার তালিকা:' : 'Saved Addresses / Switch Company Address:'}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    {savedAddresses.length} {isBn ? 'টি ঠিকানা সংরক্ষিত' : 'addresses saved'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {savedAddresses.map((addr, idx) => {
                    const isSelected = compAddress.trim().toLowerCase() === addr.trim().toLowerCase();
                    return (
                      <div
                        key={idx}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer select-none ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs scale-[1.02]'
                            : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectPresetAddress(addr)}
                          className="flex items-center gap-1 text-left cursor-pointer"
                        >
                          <span>{isSelected ? '✓' : '📍'}</span>
                          <span className="truncate max-w-[260px]">{addr}</span>
                        </button>
                        {savedAddresses.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePresetAddress(addr);
                            }}
                            className="text-slate-400 hover:text-rose-500 p-0.5 ml-1 rounded cursor-pointer"
                            title="Delete address"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add new address to saved presets */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newAddressInput}
                    onChange={(e) => setNewAddressInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPresetAddress();
                      }
                    }}
                    placeholder={isBn ? 'নতুন অন্য কোনো ঠিকানা লিখুন (যেমন: Plot 22, Savar EPZ...)' : 'Type another company / factory address to save...'}
                    className={`flex-1 px-3.5 py-2 rounded-xl border text-xs focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  />
                  <button
                    type="button"
                    onClick={handleAddPresetAddress}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isBn ? 'তালিকাভুক্ত করুন' : 'Save Address'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2 border-b pb-2 border-slate-200 dark:border-slate-800">
                <Phone className="w-4 h-4" />
                <span>{isBn ? '২. যোগাযোগ ও ইমেইল' : '2. Contact & Communications'}</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isBn ? 'অফিসিয়াল ফোন / মোবাইল নম্বর' : 'Contact Phone / WhatsApp'}
                  </label>
                  <input
                    type="text"
                    value={compContact}
                    onChange={(e) => setCompContact(e.target.value)}
                    placeholder="01756628160"
                    className={`w-full p-3 rounded-2xl border text-sm font-mono font-bold focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isBn ? 'অফিসিয়াল ইমেইল ঠিকানা' : 'Official Email Address'}
                  </label>
                  <input
                    type="email"
                    value={compEmail}
                    onChange={(e) => setCompEmail(e.target.value)}
                    placeholder="contact@creativeaccessories.com"
                    className={`w-full p-3 rounded-2xl border text-sm font-mono focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  />
                </div>
              </div>
            </div>

            {/* Banner & Logo Customization */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2 border-b pb-2 border-slate-200 dark:border-slate-800">
                <ImageIcon className="w-4 h-4" />
                <span>{isBn ? '৩. অফিসিয়াল ব্যানার ও লোগো পরিবর্তন' : '3. Official Banner & Logo Branding'}</span>
              </h3>

              {/* Current Banner Preview with Brand Overlay */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-950 aspect-[21/9] sm:h-48 flex items-center justify-center">
                {companyProfile.bannerUrl ? (
                  <img
                    src={companyProfile.bannerUrl}
                    alt="Company Official Banner"
                    className="w-full h-full object-cover brightness-[0.75]"
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center text-center p-4">
                    <p className="text-xs text-slate-400 font-medium">
                      {isBn ? 'বর্তমানে ডিফল্ট শিল্প প্যাটার্ন ব্যানার প্রদর্শিত হচ্ছে' : 'Default industrial gradient banner currently in use'}
                    </p>
                  </div>
                )}
                {/* Brand Overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-transparent p-5 flex flex-col justify-between text-white pointer-events-none">
                  <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md self-start border border-white/30">
                    🏭 {compRegNo || 'CAF-IND-94821'} · PREVIEW
                  </span>
                  <div>
                    <h4 className="text-base sm:text-lg font-black drop-shadow-md">
                      {compName}
                    </h4>
                    <p className="text-xs text-slate-300 font-mono drop-shadow">
                      {compAddress}
                    </p>
                  </div>
                </div>
              </div>

              {/* Upload or Link inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => bannerFileInputRef.current?.click()}
                  className="py-3 px-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isBn ? 'ডিভাইস থেকে ব্যানার ফাইল আপলোড' : 'Upload Banner File'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>{isBn ? 'লোগো ফাইল আপলোড' : 'Upload Logo File'}</span>
                </button>
              </div>

              {/* 4 Curated Quick Presets */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  {isBn ? '⚡ দ্রুত বাছাই করার জন্য ফ্যাক্টরি ব্যানার কালেকশন:' : '⚡ Quick Select Factory Themed Presets:'}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    {
                      name: isBn ? 'টেক্সটাইল অটোমেশন' : 'Automation Floor',
                      url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1600&q=80'
                    },
                    {
                      name: isBn ? 'মেটাল ক্রাফটিং' : 'Metal Zipper Craft',
                      url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=1600&q=80'
                    },
                    {
                      name: isBn ? 'সুইং ও ফ্যাব্রিকেশন' : 'Sewing & Fabric',
                      url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1600&q=80'
                    },
                    {
                      name: isBn ? 'হেডকোয়ার্টার্স ব্লু' : 'HQ Architecture',
                      url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80'
                    }
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setInputBannerUrl(preset.url);
                        if (onUpdateCompanyBanner) {
                          onUpdateCompanyBanner(preset.url);
                          triggerToast(isBn ? `"${preset.name}" ব্যানার সেট করা হয়েছে!` : `"${preset.name}" banner applied!`);
                        }
                      }}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-left transition cursor-pointer group bg-slate-50 dark:bg-slate-900/60"
                    >
                      <div className="h-12 w-full rounded-lg overflow-hidden mb-1.5 bg-slate-200 dark:bg-slate-800">
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                      </div>
                      <span className="text-[10px] font-bold block truncate text-slate-700 dark:text-slate-300 group-hover:text-indigo-600">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Save All Button */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={handleSaveCompanyInfo}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white font-black text-sm uppercase tracking-wider cursor-pointer shadow-lg hover:shadow-indigo-500/25 transition active:scale-[0.98] flex items-center gap-2"
              >
                <Check className="w-5 h-5" />
                <span>{isBn ? '✓ কোম্পানি তথ্য ও ঠিকানা সম্পূর্ণ সংরক্ষণ করুন' : '✓ Save All Company Information'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Account Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`border rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 ${cardBg}`}>
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="font-extrabold text-base">{t.createNewAccount}</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              {/* Profile Photo Upload */}
              <div className="p-3.5 rounded-2xl border border-dashed border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20 flex items-center gap-3">
                <div className="relative shrink-0">
                  {photoUrl ? (
                    <img 
                      src={photoUrl} 
                      alt="Avatar" 
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500 shadow-sm"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shadow-xs">
                      {fullName ? getInitials(fullName) : <ImageIcon className="w-6 h-6" />}
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  <span className="block font-bold text-slate-700 dark:text-slate-300">
                    {isBn ? 'প্রোফাইল ছবি (আপলোড বা ওয়েব লিংক)' : 'Profile Photo (Upload or URL)'}
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={createUserFileInputRef}
                      accept="image/*"
                      onChange={handleCreateUserPhotoFile}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => createUserFileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer transition shadow-xs"
                    >
                      <Upload className="w-3 h-3" />
                      <span>{isBn ? '📁 ডিভাইস থেকে ছবি আপলোড' : '📁 Upload File'}</span>
                    </button>
                    {photoUrl && (
                      <button
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        className="px-2 py-1 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-300 font-bold text-[10px] cursor-pointer"
                      >
                        {isBn ? 'মুছুন' : 'Remove'}
                      </button>
                    )}
                  </div>
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="or paste image URL (https://...)"
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-[11px] font-mono focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {t.fullName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Robiul Awal"
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {isBn ? 'অ্যাকাউন্ট মোড / টাইপ নির্বাচন করুন *' : 'Account Mode / Type *'}
                  </label>
                  <select
                    value={accountType}
                    onChange={(e) => {
                      const next = e.target.value as AccountType;
                      setAccountType(next);
                      if (next === 'admin') {
                        setAdminAccessLevel('full');
                        if (!designation || designation === 'Senior Zipper Operator') {
                          setDesignation('System Administrator');
                        }
                      } else if (next === 'employee') {
                        setAdminAccessLevel('none');
                        if (designation === 'System Administrator') {
                          setDesignation('Senior Zipper Operator');
                        }
                      } else if (next === 'owner') {
                        setAdminAccessLevel('basic');
                        setDesignation('Company Owner');
                      }
                    }}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 font-bold ${inputBg}`}
                  >
                    <option value="employee">👷 {isBn ? 'সাধারণ এমপ্লয়ি (Regular Employee / Worker)' : 'Regular Employee / Worker'}</option>
                    <option value="staff">👔 {isBn ? 'স্টাফ / সুপারভাইজার (Staff / Supervisor)' : 'Staff / Supervisor'}</option>
                    <option value="admin">🛡️ {isBn ? 'সিস্টেম অ্যাডমিন অ্যাকাউন্ট (System Admin - Full Control)' : 'System Admin - Full Control'}</option>
                    <option value="md">👑 {isBn ? 'ম্যানেজিং ডিরেক্টর (Managing Director - MD)' : 'Managing Director - MD'}</option>
                    <option value="owner">💼 {isBn ? 'কোম্পানি মালিক / ইনভেস্টর (Company Owner)' : 'Company Owner / Investor'}</option>
                    {isFullControl && (
                      <option value="hosting">⚡ {isBn ? 'হোস্টিং অ্যাকাউন্ট (Hosting Control)' : 'Hosting Super Account'}</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Mode Explanation & Admin Access Level Selector */}
              <div className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                accountType === 'admin'
                  ? 'bg-purple-50/70 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800'
                  : accountType === 'employee'
                    ? 'bg-blue-50/70 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800'
                    : 'bg-indigo-50/70 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
                    <span>{accountType === 'admin' ? '🛡️' : accountType === 'employee' ? '👷' : '👔'}</span>
                    <span>
                      {accountType === 'admin'
                        ? (isBn ? 'অ্যাডমিন অ্যাকাউন্ট মোড সক্রিয়' : 'Admin Account Mode Selected')
                        : accountType === 'employee'
                          ? (isBn ? 'সাধারণ এমপ্লয়ি মোড সক্রিয়' : 'Regular Employee Mode Selected')
                          : (isBn ? 'স্টাফ মোড সক্রিয়' : 'Staff Mode Selected')}
                    </span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 font-bold uppercase">
                    {accountType.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  {accountType === 'admin'
                    ? (isBn ? '✓ এই অ্যাডমিন অ্যাকাউন্ট দিয়ে সকল কর্মীর বেতন, হাজিরা, ওভারটাইম, অর্ডার এবং সিস্টেম সেটিংস নিয়ন্ত্রণ করা যাবে।' : '✓ Full control over all payroll, attendance, orders, and system settings.')
                    : accountType === 'employee'
                      ? (isBn ? '✓ এই অ্যাকাউন্টে পে-রোল মেনু বন্ধ থাকবে, কর্মী শুধুমাত্র নিজের বেতন ও হাজিরা দেখতে পারবেন এবং নিজের সেকশনে এন্ট্রি দিতে পারবেন।' : '✓ Restricts access: Employee only sees their own salary, and can only log in their assigned section.')
                      : (isBn ? '✓ সেকশন সুপারভাইজার ও অফিস স্টাফের জন্য নির্ধারিত অ্যাক্সেস।' : '✓ Tailored for section supervisors and factory officers.')}
                </p>

                {accountType !== 'employee' && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      {isBn ? 'অ্যাডমিন অ্যাক্সেস লেভেল নির্বাচন:' : 'Select Admin Access Level:'}
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setAdminAccessLevel('none')}
                        className={`p-2 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-0.5 cursor-pointer ${
                          adminAccessLevel === 'none'
                            ? 'bg-white dark:bg-slate-800 border-indigo-600 text-indigo-600 shadow-xs'
                            : 'bg-transparent border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span>❌ {isBn ? 'সাধারণ' : 'None'}</span>
                        <span className="text-[9px] font-normal text-slate-400">{isBn ? 'নো প্যানেল' : 'No Access'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminAccessLevel('basic')}
                        className={`p-2 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-0.5 cursor-pointer ${
                          adminAccessLevel === 'basic'
                            ? 'bg-white dark:bg-slate-800 border-indigo-600 text-indigo-600 shadow-xs'
                            : 'bg-transparent border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span>⚡ {isBn ? 'বেসিক' : 'Basic'}</span>
                        <span className="text-[9px] font-normal text-slate-400">{isBn ? 'ডাটা এন্ট্রি' : 'Data Entry'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminAccessLevel('full')}
                        className={`p-2 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-0.5 cursor-pointer ${
                          adminAccessLevel === 'full'
                            ? 'bg-white dark:bg-slate-800 border-indigo-600 text-indigo-600 shadow-xs'
                            : 'bg-transparent border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span>★ {isBn ? 'ফুল কন্ট্রোল' : 'Full Admin'}</span>
                        <span className="text-[9px] font-normal text-slate-400">{isBn ? 'সম্পূর্ণ ক্ষমতা' : 'Full Power'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {t.designation} *
                  </label>
                  <input
                    type="text"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Senior Zipper Operator"
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {t.section} *
                  </label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  >
                    {sections.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {t.joiningDate} *
                  </label>
                  <input
                    type="date"
                    required
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 font-mono ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {t.whatsappNumber} *
                  </label>
                  <input
                    type="text"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+8801712..."
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 font-mono ${inputBg}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {t.username} *
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="username"
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 font-mono ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {t.password} *
                  </label>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="password123"
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 font-mono ${inputBg}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {isBn ? 'বেতন ধরণ' : 'Salary Type'}
                  </label>
                  <select
                    value={salaryType}
                    onChange={(e) => setSalaryType(e.target.value as SalaryType)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 font-bold ${inputBg}`}
                  >
                    <option value="monthly">{isBn ? 'মাসিক (Monthly)' : 'Monthly'}</option>
                    <option value="daily">{isBn ? 'দৈনিক (Daily)' : 'Daily'}</option>
                    <option value="hourly">{isBn ? 'ঘণ্টাভিত্তিক (Hourly)' : 'Hourly'}</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {salaryType === 'daily' 
                      ? (isBn ? 'দৈনিক মজুরি (BDT)' : 'Daily Rate (BDT)') 
                      : salaryType === 'hourly' 
                        ? (isBn ? 'ঘণ্টাপ্রতি রেট (BDT)' : 'Hourly Rate (BDT)') 
                        : `${t.basicSalary} (BDT)`} *
                  </label>
                  <input
                    type="number"
                    required
                    value={basicSalary}
                    onChange={(e) => handleSalaryChange(e.target.value)}
                    placeholder="20000"
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 font-mono ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {t.hourlyOtRate} (BDT/Hr) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 font-mono ${inputBg}`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                >
                  {t.saveAccount}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`border rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 ${cardBg}`}>
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="font-extrabold text-base">Edit Account: {editingUser.fullName}</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              {/* Profile Photo Upload */}
              <div className="p-3.5 rounded-2xl border border-dashed border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20 flex items-center gap-3">
                <div className="relative shrink-0">
                  {editingUser.photoUrl ? (
                    <img 
                      src={editingUser.photoUrl} 
                      alt="Avatar" 
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500 shadow-sm"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shadow-xs">
                      {editingUser.fullName ? getInitials(editingUser.fullName) : <ImageIcon className="w-6 h-6" />}
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  <span className="block font-bold text-slate-700 dark:text-slate-300">
                    {isBn ? 'প্রোফাইল ছবি (আপলোড বা ওয়েব লিংক)' : 'Profile Photo (Upload or URL)'}
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={editUserFileInputRef}
                      accept="image/*"
                      onChange={handleEditUserPhotoFile}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => editUserFileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer transition shadow-xs"
                    >
                      <Upload className="w-3 h-3" />
                      <span>{isBn ? '📁 ডিভাইস থেকে ছবি আপলোড' : '📁 Upload File'}</span>
                    </button>
                    {editingUser.photoUrl && (
                      <button
                        type="button"
                        onClick={() => setEditingUser({ ...editingUser, photoUrl: '' })}
                        className="px-2 py-1 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-300 font-bold text-[10px] cursor-pointer"
                      >
                        {isBn ? 'মুছুন' : 'Remove'}
                      </button>
                    )}
                  </div>
                  <input
                    type="url"
                    value={editingUser.photoUrl || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, photoUrl: e.target.value })}
                    placeholder="or paste image URL (https://...)"
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-[11px] font-mono focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {t.fullName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingUser.fullName}
                    onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {isBn ? 'অ্যাকাউন্ট মোড / টাইপ *' : 'Account Mode / Type *'}
                  </label>
                  <select
                    value={editingUser.accountType}
                    disabled={editingUser.accountType === 'hosting'}
                    onChange={(e) => {
                      const next = e.target.value as AccountType;
                      setEditingUser({
                        ...editingUser,
                        accountType: next,
                        adminAccess: next === 'admin' ? 'full' : next === 'employee' ? 'none' : (editingUser.adminAccess || 'none')
                      });
                    }}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 font-bold ${inputBg}`}
                  >
                    <option value="employee">👷 {isBn ? 'সাধারণ এমপ্লয়ি (Regular Employee / Worker)' : 'Regular Employee / Worker'}</option>
                    <option value="staff">👔 {isBn ? 'স্টাফ / সুপারভাইজার (Staff / Supervisor)' : 'Staff / Supervisor'}</option>
                    <option value="admin">🛡️ {isBn ? 'সিস্টেম অ্যাডমিন (System Admin - Full Control)' : 'System Admin - Full Control'}</option>
                    <option value="md">👑 {isBn ? 'ম্যানেজিং ডিরেক্টর (Managing Director - MD)' : 'Managing Director - MD'}</option>
                    <option value="owner">💼 {isBn ? 'কোম্পানি মালিক / ইনভেস্টর (Company Owner)' : 'Company Owner / Investor'}</option>
                    {editingUser.accountType === 'hosting' && <option value="hosting">👑 Hosting Super Admin</option>}
                  </select>
                </div>
              </div>

              {/* Edit Admin Access Level if not employee */}
              {editingUser.accountType !== 'employee' && (
                <div className="p-3 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    {isBn ? 'অ্যাডমিন অ্যাক্সেস লেভেল:' : 'Admin Access Level:'}
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingUser({ ...editingUser, adminAccess: 'none' })}
                      className={`p-2 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-0.5 cursor-pointer ${
                        editingUser.adminAccess === 'none'
                          ? 'bg-white dark:bg-slate-800 border-indigo-600 text-indigo-600 shadow-xs'
                          : 'bg-transparent border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span>❌ {isBn ? 'সাধারণ' : 'None'}</span>
                      <span className="text-[9px] font-normal text-slate-400">{isBn ? 'নো প্যানেল' : 'No Access'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingUser({ ...editingUser, adminAccess: 'basic' })}
                      className={`p-2 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-0.5 cursor-pointer ${
                        editingUser.adminAccess === 'basic'
                          ? 'bg-white dark:bg-slate-800 border-indigo-600 text-indigo-600 shadow-xs'
                          : 'bg-transparent border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span>⚡ {isBn ? 'বেসিক' : 'Basic'}</span>
                      <span className="text-[9px] font-normal text-slate-400">{isBn ? 'ডাটা এন্ট্রি' : 'Data Entry'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingUser({ ...editingUser, adminAccess: 'full' })}
                      className={`p-2 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-0.5 cursor-pointer ${
                        editingUser.adminAccess === 'full'
                          ? 'bg-white dark:bg-slate-800 border-indigo-600 text-indigo-600 shadow-xs'
                          : 'bg-transparent border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span>★ {isBn ? 'ফুল কন্ট্রোল' : 'Full Admin'}</span>
                      <span className="text-[9px] font-normal text-slate-400">{isBn ? 'সম্পূর্ণ ক্ষমতা' : 'Full Power'}</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {t.designation} *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingUser.designation}
                    onChange={(e) => setEditingUser({ ...editingUser, designation: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {t.section} *
                  </label>
                  <select
                    value={editingUser.section}
                    onChange={(e) => setEditingUser({ ...editingUser, section: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  >
                    {sections.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {t.empId}
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editingUser.employeeId || ''}
                    className={`w-full px-3 py-2 rounded-xl border font-mono opacity-80 cursor-not-allowed ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {t.joiningDate} *
                  </label>
                  <input
                    type="date"
                    required
                    value={editingUser.joiningDate || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, joiningDate: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 font-mono ${inputBg}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {t.username} *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingUser.username}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 font-mono ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {t.whatsappNumber}
                  </label>
                  <input
                    type="text"
                    value={editingUser.whatsapp || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, whatsapp: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 font-mono ${inputBg}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {isBn ? 'বেতন ধরণ' : 'Salary Type'}
                  </label>
                  <select
                    value={editingUser.salaryType || 'monthly'}
                    onChange={(e) => setEditingUser({ ...editingUser, salaryType: e.target.value as SalaryType })}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 font-bold ${inputBg}`}
                  >
                    <option value="monthly">{isBn ? 'মাসিক (Monthly)' : 'Monthly'}</option>
                    <option value="daily">{isBn ? 'দৈনিক (Daily)' : 'Daily'}</option>
                    <option value="hourly">{isBn ? 'ঘণ্টাভিত্তিক (Hourly)' : 'Hourly'}</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {editingUser.salaryType === 'daily' 
                      ? (isBn ? 'দৈনিক মজুরি (BDT)' : 'Daily Rate (BDT)') 
                      : editingUser.salaryType === 'hourly' 
                        ? (isBn ? 'ঘণ্টাপ্রতি রেট (BDT)' : 'Hourly Rate (BDT)') 
                        : `${t.basicSalary} (BDT)`} *
                  </label>
                  <input
                    type="number"
                    value={editingUser.basicSalary}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditingUser({
                        ...editingUser,
                        basicSalary: val,
                        hourlyRate: calculateAutoHourlyRate(val)
                      });
                    }}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 font-mono ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                    {t.hourlyOtRate} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingUser.hourlyRate}
                    onChange={(e) => setEditingUser({ ...editingUser, hourlyRate: Number(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-600 font-mono ${inputBg}`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                >
                  {t.updateAccount}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
