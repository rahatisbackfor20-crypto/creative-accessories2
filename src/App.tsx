import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  User, 
  CompanyProfile, 
  AttendanceRecord, 
  OvertimeRecord, 
  ProductionRecord, 
  TabType, 
  Language, 
  SyncStatus,
  PaymentStatus,
  PayrollStatusMap,
  LeaveRecord,
  ExpenseRecord,
  PurchaseRecord,
  SaleRecord,
  ProductRequest,
  ProductionSize,
  PayrollPayment,
  DutySettings,
  LeaveStatus,
  ExpenseStatus,
  ProductRequestStatus
} from './types';
import { 
  DEFAULT_FIREBASE_URL, 
  INITIAL_COMPANY_PROFILE, 
  INITIAL_SECTIONS, 
  INITIAL_USERS, 
  INITIAL_ATTENDANCE, 
  INITIAL_OVERTIME, 
  INITIAL_PRODUCTIONS, 
  INITIAL_LEAVES,
  INITIAL_EXPENSES,
  INITIAL_PURCHASES,
  INITIAL_SALES,
  INITIAL_SIZES,
  INITIAL_PRODUCT_REQUESTS,
  INITIAL_PAYMENTS,
  DEFAULT_DUTY_SETTINGS,
  normalizeFirebaseUrl 
} from './storage';
import { X } from 'lucide-react';

import { Navbar } from './components/Navbar';
import { StatusStrip } from './components/StatusStrip';
import { DashboardView } from './components/DashboardView';
import { ProductionView } from './components/ProductionView';
import { AttendanceView } from './components/AttendanceView';
import { OvertimeView } from './components/OvertimeView';
import { PayrollView } from './components/PayrollView';
import { LeaveView } from './components/LeaveView';
import { BillsExpensesView } from './components/BillsExpensesView';
import { ProductRequestView } from './components/ProductRequestView';
import { AdminPanelView } from './components/AdminPanelView';

import { DigitalIdCardModal } from './components/DigitalIdCardModal';

import { UserProfileModal } from './components/UserProfileModal';
import { PrintReportModal } from './components/PrintReportModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { BangladeshHolidayCalendar } from './components/BangladeshHolidayCalendar';
import { getNextUpcomingHoliday } from './data/bangladeshHolidays';

export default function App({ identityUser, onIdentityLogout }: { identityUser: User; onIdentityLogout: () => Promise<void> }) {
  // Theme & Language
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('caf_theme') === 'dark';
  });
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('caf_lang') as Language) || 'bn';
  });

  // Cloud & Local State
  const [cloudDbUrl, setCloudDbUrl] = useState<string>(() => {
    const saved = localStorage.getItem('caf_cloud_url');
    return saved && saved.trim() ? saved.trim() : DEFAULT_FIREBASE_URL;
  });
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('syncing');

  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => {
    try {
      const saved = localStorage.getItem('caf_company');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.contactNumber || parsed.contactNumber.includes('1712-345678') || parsed.contactNumber === '+880 1712-345678') {
          parsed.contactNumber = '01756628160';
        }
        if (!parsed.address || !parsed.address.includes('Bamnartek')) {
          parsed.address = 'Bamnartek, Dhaka 1230, Bangladesh';
        }
        return parsed;
      }
      return INITIAL_COMPANY_PROFILE;
    } catch {
      return INITIAL_COMPANY_PROFILE;
    }
  });

  const [sections, setSections] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('caf_sections');
      return saved ? JSON.parse(saved) : INITIAL_SECTIONS;
    } catch {
      return INITIAL_SECTIONS;
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('caf_users');
      if (saved) {
        const parsed: User[] = JSON.parse(saved);
        return parsed;
      }
      return INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem('caf_attendance');
      return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
    } catch {
      return INITIAL_ATTENDANCE;
    }
  });

  const [overtime, setOvertime] = useState<OvertimeRecord[]>(() => {
    try {
      const saved = localStorage.getItem('caf_overtime');
      return saved ? JSON.parse(saved) : INITIAL_OVERTIME;
    } catch {
      return INITIAL_OVERTIME;
    }
  });

  const [productions, setProductions] = useState<ProductionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('caf_productions');
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTIONS;
    } catch {
      return INITIAL_PRODUCTIONS;
    }
  });

  const [leaves, setLeaves] = useState<LeaveRecord[]>(() => {
    try {
      const saved = localStorage.getItem('caf_leaves');
      return saved ? JSON.parse(saved) : INITIAL_LEAVES;
    } catch {
      return INITIAL_LEAVES;
    }
  });

  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    try {
      const saved = localStorage.getItem('caf_expenses');
      return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  const [purchases, setPurchases] = useState<PurchaseRecord[]>(() => {
    try {
      const saved = localStorage.getItem('caf_purchases');
      return saved ? JSON.parse(saved) : INITIAL_PURCHASES;
    } catch {
      return INITIAL_PURCHASES;
    }
  });

  const [sales, setSales] = useState<SaleRecord[]>(() => {
    try {
      const saved = localStorage.getItem('caf_sales');
      return saved ? JSON.parse(saved) : INITIAL_SALES;
    } catch {
      return INITIAL_SALES;
    }
  });

  const [productRequests, setProductRequests] = useState<ProductRequest[]>(() => {
    try {
      const saved = localStorage.getItem('caf_product_requests');
      return saved ? JSON.parse(saved) : INITIAL_PRODUCT_REQUESTS;
    } catch {
      return INITIAL_PRODUCT_REQUESTS;
    }
  });

  const [hasViewedProductRequests, setHasViewedProductRequests] = useState<boolean>(() => {
    return localStorage.getItem('caf_has_viewed_requests') === 'true';
  });

  const [holidayBannerDismissed, setHolidayBannerDismissed] = useState<boolean>(() => {
    return sessionStorage.getItem('caf_holiday_banner_dismissed') === 'true';
  });

  const [sizes, setSizes] = useState<ProductionSize[]>(() => {
    try {
      const saved = localStorage.getItem('caf_sizes');
      return saved ? JSON.parse(saved) : INITIAL_SIZES;
    } catch {
      return INITIAL_SIZES;
    }
  });

  const [payments, setPayments] = useState<PayrollPayment[]>(() => {
    try {
      const saved = localStorage.getItem('caf_payments');
      return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
    } catch {
      return INITIAL_PAYMENTS;
    }
  });

  const [dutySettings, setDutySettings] = useState<DutySettings>(() => {
    try {
      const saved = localStorage.getItem('caf_duty_settings');
      return saved ? JSON.parse(saved) : DEFAULT_DUTY_SETTINGS;
    } catch {
      return DEFAULT_DUTY_SETTINGS;
    }
  });

  const [payrollStatusMap, setPayrollStatusMap] = useState<PayrollStatusMap>(() => {
    try {
      const saved = localStorage.getItem('caf_payroll_status');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return new Date().toISOString().substring(0, 7);
  });

  // Identity controls authentication and permissions; directory records provide profile details only.
  const [profileUser, setCurrentUser] = useState<User | null>(identityUser);
  const currentUser: User = {
    ...(profileUser || identityUser),
    id: identityUser.id,
    username: identityUser.username,
    accountType: identityUser.accountType,
    adminAccess: identityUser.adminAccess,
    accountStatus: identityUser.accountStatus,
    password: undefined,
  };

  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');


  // Modals
  const [idCardModalUser, setIdCardModalUser] = useState<User | null>(null);

  const [userProfileModalOpen, setUserProfileModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const upcomingHoliday = useMemo(() => {
    return getNextUpcomingHoliday();
  }, []);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('caf_theme', darkMode ? 'dark' : 'light');
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('caf_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('caf_company', JSON.stringify(companyProfile));
  }, [companyProfile]);

  useEffect(() => {
    localStorage.setItem('caf_sections', JSON.stringify(sections));
  }, [sections]);

  useEffect(() => {
    localStorage.setItem('caf_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('caf_attendance', JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem('caf_overtime', JSON.stringify(overtime));
  }, [overtime]);

  useEffect(() => {
    localStorage.setItem('caf_productions', JSON.stringify(productions));
  }, [productions]);

  useEffect(() => {
    localStorage.setItem('caf_leaves', JSON.stringify(leaves));
  }, [leaves]);

  useEffect(() => {
    localStorage.setItem('caf_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('caf_purchases', JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem('caf_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    if (currentTab === 'product_requests' || (currentTab as string) === 'products_trade') {
      if (!hasViewedProductRequests) {
        setHasViewedProductRequests(true);
        localStorage.setItem('caf_has_viewed_requests', 'true');
      }
    }
  }, [currentTab, hasViewedProductRequests]);

  useEffect(() => {
    localStorage.setItem('caf_product_requests', JSON.stringify(productRequests));
  }, [productRequests]);

  useEffect(() => {
    localStorage.setItem('caf_sizes', JSON.stringify(sizes));
  }, [sizes]);

  useEffect(() => {
    localStorage.setItem('caf_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('caf_duty_settings', JSON.stringify(dutySettings));
  }, [dutySettings]);

  // Global Keyboard Shortcuts (Ctrl+K for Search, ? for Shortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K: Open Global Search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen(prev => !prev);
      }
      // ? key (Shift + /) or Ctrl + /: Open Keyboard Shortcuts modal
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName);
      if (!isInput && (e.key === '?' || ((e.ctrlKey || e.metaKey) && e.key === '/'))) {
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Ref tracking for realtime polling
  const urlRef = useRef(cloudDbUrl);
  urlRef.current = cloudDbUrl;
  const pushingRef = useRef(false);
  const lastSnap = useRef('');

  // Access checks
  const isFullAdmin = identityUser.accountType === 'admin';
  const canAccessPayroll = currentUser?.accountType !== 'employee' || isFullAdmin || currentUser?.adminAccess === 'basic' || currentUser?.adminAccess === 'full';

  useEffect(() => {
    if (currentUser && !canAccessPayroll && currentTab === 'payroll') {
      setCurrentTab('dashboard');
    }
  }, [currentUser, currentTab, canAccessPayroll]);

  // Sync with Cloud Firebase RTDB
  const mergeList = <T extends { id: string }>(cloudList: T[] | undefined, localList: T[]): T[] => {
    const map = new Map<string, T>();
    (Array.isArray(cloudList) ? cloudList : []).forEach(x => map.set(x.id, x));
    (Array.isArray(localList) ? localList : []).forEach(x => map.set(x.id, x));
    return Array.from(map.values());
  };

  const pushToCloud = async (nextState: Partial<{
    companyProfile: CompanyProfile;
    users: User[];
    attendance: AttendanceRecord[];
    overtime: OvertimeRecord[];
    productions: ProductionRecord[];
    leaves: LeaveRecord[];
    expenses: ExpenseRecord[];
    purchases: PurchaseRecord[];
    sales: SaleRecord[];
    productRequests: ProductRequest[];
    sizes: ProductionSize[];
    payments: PayrollPayment[];
    dutySettings: DutySettings;
    sections: string[];
    payrollStatusMap: PayrollStatusMap;
    cloudDbUrl: string;
  }> = {}) => {
    const base = normalizeFirebaseUrl(nextState.cloudDbUrl !== undefined ? nextState.cloudDbUrl : cloudDbUrl);
    if (!base) return;

    pushingRef.current = true;
    setSyncStatus('syncing');
    try {
      let cloud: any = null;
      try {
        const r = await fetch(`${base}/caf_portal_db.json`, { cache: 'no-store' });
        if (r.ok) cloud = await r.json();
      } catch (e) {}

      const payload = {
        companyProfile: nextState.companyProfile || companyProfile,
        users: nextState.users || mergeList(cloud?.users, users),
        attendance: mergeList(cloud?.attendance, nextState.attendance || attendance),
        overtime: mergeList(cloud?.overtime, nextState.overtime || overtime),
        productions: mergeList(cloud?.productions, nextState.productions || productions),
        leaves: mergeList(cloud?.leaves, nextState.leaves || leaves),
        expenses: mergeList(cloud?.expenses, nextState.expenses || expenses),
        purchases: mergeList(cloud?.purchases, nextState.purchases || purchases),
        sales: mergeList(cloud?.sales, nextState.sales || sales),
        productRequests: mergeList(cloud?.productRequests, nextState.productRequests || productRequests),
        sizes: mergeList(cloud?.sizes, nextState.sizes || sizes),
        payments: mergeList(cloud?.payments, nextState.payments || payments),
        dutySettings: nextState.dutySettings || cloud?.dutySettings || dutySettings,
        sections: nextState.sections !== undefined ? nextState.sections : (Array.isArray(sections) && sections.length > 0 ? sections : (Array.isArray(cloud?.sections) ? cloud.sections : [])),
        payrollStatusMap: nextState.payrollStatusMap || cloud?.payrollStatusMap || payrollStatusMap,
        updatedAt: new Date().toISOString()
      };

      const res = await fetch(`${base}/caf_portal_db.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Cloud push failed');

      if (payload.companyProfile) setCompanyProfile(payload.companyProfile);
      setUsers(payload.users);
      setAttendance(payload.attendance);
      setOvertime(payload.overtime);
      setProductions(payload.productions);
      setLeaves(payload.leaves);
      setExpenses(payload.expenses);
      setPurchases(payload.purchases);
      setProductRequests(payload.productRequests);
      setSizes(payload.sizes);
      setPayments(payload.payments);
      if (payload.dutySettings) setDutySettings(payload.dutySettings);
      if (Array.isArray(payload.sections)) setSections(payload.sections);
      if (payload.payrollStatusMap) setPayrollStatusMap(payload.payrollStatusMap);
      lastSnap.current = '';
      setSyncStatus('online');
    } catch (err) {
      setSyncStatus('offline');
    } finally {
      pushingRef.current = false;
    }
  };

  const fetchFromCloud = async (customUrl?: string) => {
    const base = normalizeFirebaseUrl(customUrl !== undefined ? customUrl : cloudDbUrl);
    if (!base) {
      setSyncStatus('offline');
      return null;
    }
    setSyncStatus('syncing');
    try {
      const res = await fetch(`${base}/caf_portal_db.json`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Cloud fetch failed');
      const data = await res.json();
      if (data) {
        if (data.companyProfile) setCompanyProfile(data.companyProfile);
        if (Array.isArray(data.users)) {
          setUsers(data.users);
          setCurrentUser(prev => { const profile = data.users.find((u: User) => u.id === identityUser.id); return profile ? { ...profile, password: undefined } : prev; });
        }
        if (Array.isArray(data.attendance)) setAttendance(data.attendance);
        if (Array.isArray(data.overtime)) setOvertime(data.overtime);
        if (Array.isArray(data.productions)) setProductions(data.productions);
        if (Array.isArray(data.leaves)) setLeaves(data.leaves);
        if (Array.isArray(data.expenses)) setExpenses(data.expenses);
        if (Array.isArray(data.purchases)) setPurchases(data.purchases);
        if (Array.isArray(data.sales)) setSales(data.sales);
        if (Array.isArray(data.productRequests)) setProductRequests(data.productRequests);
        if (Array.isArray(data.sizes)) setSizes(data.sizes);
        if (Array.isArray(data.payments)) setPayments(data.payments);
        if (data.dutySettings) setDutySettings(data.dutySettings);
        if (Array.isArray(data.sections)) setSections(data.sections);
        if (data.payrollStatusMap) setPayrollStatusMap(data.payrollStatusMap);
        setSyncStatus('online');
        return data;
      } else {
        await pushToCloud({ cloudDbUrl: base });
        return null;
      }
    } catch (err) {
      setSyncStatus('offline');
      return null;
    }
  };

  // Background Polling Loop (every 4s)
  useEffect(() => {
    const tick = async () => {
      const base = normalizeFirebaseUrl(urlRef.current);
      if (!base || pushingRef.current || document.hidden) return;
      try {
        const res = await fetch(`${base}/caf_portal_db.json`, { cache: 'no-store' });
        if (!res.ok) {
          setSyncStatus('offline');
          return;
        }
        const data = await res.json();
        if (!data) {
          await pushToCloud({ cloudDbUrl: base });
          return;
        }

        const snap = JSON.stringify([
          data.companyProfile,
          data.users,
          data.attendance,
          data.overtime,
          data.productions,
          data.leaves,
          data.expenses,
          data.purchases,
          data.productRequests,
          data.sizes,
          data.payments,
          data.dutySettings,
          data.sections,
          data.payrollStatusMap
        ]);

        if (snap === lastSnap.current) {
          setSyncStatus('online');
          return;
        }
        lastSnap.current = snap;

        if (data.companyProfile) setCompanyProfile(data.companyProfile);
        if (Array.isArray(data.users)) {
          setUsers(data.users);
          setCurrentUser(prev => { const profile = data.users.find((u: User) => u.id === identityUser.id); return profile ? { ...profile, password: undefined } : prev; });
        }
        if (Array.isArray(data.attendance)) setAttendance(data.attendance);
        if (Array.isArray(data.overtime)) setOvertime(data.overtime);
        if (Array.isArray(data.productions)) setProductions(data.productions);
        if (Array.isArray(data.leaves)) setLeaves(data.leaves);
        if (Array.isArray(data.expenses)) setExpenses(data.expenses);
        if (Array.isArray(data.purchases)) setPurchases(data.purchases);
        if (Array.isArray(data.productRequests)) setProductRequests(data.productRequests);
        if (Array.isArray(data.sizes)) setSizes(data.sizes);
        if (Array.isArray(data.payments)) setPayments(data.payments);
        if (data.dutySettings) setDutySettings(data.dutySettings);
        if (Array.isArray(data.sections)) setSections(data.sections);
        if (data.payrollStatusMap) setPayrollStatusMap(data.payrollStatusMap);
        setSyncStatus('online');
      } catch {
        setSyncStatus('offline');
      }
    };

    tick();
    const interval = setInterval(tick, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    void onIdentityLogout();
  };

  // Operational Action Handlers
  const handleAddProduction = async (record: Omit<ProductionRecord, 'id'>) => {
    const newRecord: ProductionRecord = {
      ...record,
      id: 'prd-' + Date.now()
    };
    const nextList = [newRecord, ...productions];
    setProductions(nextList);
    await pushToCloud({ productions: nextList });
  };

  const handleUpdateProduction = async (updated: ProductionRecord) => {
    const nextList = productions.map(p => p.id === updated.id ? updated : p);
    setProductions(nextList);
    await pushToCloud({ productions: nextList });
  };

  const handleDeleteProduction = async (id: string) => {
    const nextList = productions.filter(p => p.id !== id);
    setProductions(nextList);
    await pushToCloud({ productions: nextList });
  };

  const handleAddAttendance = async (record: Omit<AttendanceRecord, 'id'>) => {
    const newRecord: AttendanceRecord = {
      ...record,
      id: 'att-' + Date.now()
    };
    const nextList = [newRecord, ...attendance];
    setAttendance(nextList);
    await pushToCloud({ attendance: nextList });
  };

  const handleBatchAddAttendance = async (records: Omit<AttendanceRecord, 'id'>[]) => {
    if (records.length === 0) return;
    const now = Date.now();
    const newRecords: AttendanceRecord[] = records.map((r, i) => ({
      ...r,
      id: `att-${now}-${i}`
    }));
    const nextList = [...newRecords, ...attendance];
    setAttendance(nextList);
    await pushToCloud({ attendance: nextList });
  };

  const handleUpdateAttendanceStatus = async (id: string, status: 'Present' | 'Late' | 'Absent') => {
    const nextList = attendance.map(a => a.id === id ? { ...a, status } : a);
    setAttendance(nextList);
    await pushToCloud({ attendance: nextList });
  };

  const handleUpdateAttendanceRecord = async (record: AttendanceRecord) => {
    const nextList = attendance.map(a => a.id === record.id ? record : a);
    setAttendance(nextList);
    await pushToCloud({ attendance: nextList });
  };

  const handleDeleteAttendance = async (id: string) => {
    const nextList = attendance.filter(a => a.id !== id);
    setAttendance(nextList);
    await pushToCloud({ attendance: nextList });
  };

  const handleAddOvertime = async (record: Omit<OvertimeRecord, 'id'>) => {
    const newRecord: OvertimeRecord = {
      ...record,
      id: 'ot-' + Date.now()
    };
    const nextList = [newRecord, ...overtime];
    setOvertime(nextList);
    await pushToCloud({ overtime: nextList });
  };

  const handleUpdateOvertimeStatus = async (id: string, status: 'Approved' | 'Pending' | 'Rejected') => {
    const nextList = overtime.map(o => o.id === id ? { ...o, status, approvedBy: currentUser?.fullName } : o);
    setOvertime(nextList);
    await pushToCloud({ overtime: nextList });
  };

  const handleDeleteOvertime = async (id: string) => {
    const nextList = overtime.filter(o => o.id !== id);
    setOvertime(nextList);
    await pushToCloud({ overtime: nextList });
  };

  // Leave Handlers
  const handleAddLeave = async (record: Omit<LeaveRecord, 'id' | 'createdAt'>) => {
    const newRecord: LeaveRecord = {
      ...record,
      id: 'lv-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    const nextList = [newRecord, ...leaves];
    setLeaves(nextList);
    await pushToCloud({ leaves: nextList });
  };

  const handleUpdateLeaveStatus = async (id: string, status: LeaveStatus, rejectionReason?: string) => {
    const nextList = leaves.map(l => {
      if (l.id !== id) return l;
      return {
        ...l,
        status,
        rejectionReason: status === 'Rejected' ? rejectionReason : undefined,
        approvedBy: currentUser?.fullName,
        approvedAt: new Date().toISOString()
      };
    });
    setLeaves(nextList);
    await pushToCloud({ leaves: nextList });
  };

  const handleDeleteLeave = async (id: string) => {
    const nextList = leaves.filter(l => l.id !== id);
    setLeaves(nextList);
    await pushToCloud({ leaves: nextList });
  };

  const handleUpdateLeave = async (record: LeaveRecord) => {
    const nextList = leaves.map(l => l.id === record.id ? record : l);
    setLeaves(nextList);
    await pushToCloud({ leaves: nextList });
  };

  // Expense Handlers
  const handleAddExpense = async (record: Omit<ExpenseRecord, 'id' | 'createdAt'>) => {
    const newRecord: ExpenseRecord = {
      ...record,
      id: 'exp-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    const nextList = [newRecord, ...expenses];
    setExpenses(nextList);
    await pushToCloud({ expenses: nextList });
  };

  const handleUpdateExpenseStatus = async (id: string, status: ExpenseStatus) => {
    const nextList = expenses.map(e => {
      if (e.id !== id) return e;
      return {
        ...e,
        status,
        approver: status === 'Approved' ? currentUser?.fullName : e.approver,
        paymentStatus: status === 'Approved' ? ('Reimbursed' as const) : e.paymentStatus
      };
    });
    setExpenses(nextList);
    await pushToCloud({ expenses: nextList });
  };

  const handleUpdateExpense = async (record: ExpenseRecord) => {
    const nextList = expenses.map(e => e.id === record.id ? record : e);
    setExpenses(nextList);
    await pushToCloud({ expenses: nextList });
  };

  const handleDeleteExpense = async (id: string) => {
    const nextList = expenses.filter(e => e.id !== id);
    setExpenses(nextList);
    await pushToCloud({ expenses: nextList });
  };

  // Purchase Handlers
  const handleAddPurchase = async (record: Omit<PurchaseRecord, 'id' | 'createdAt'>) => {
    const newRecord: PurchaseRecord = {
      ...record,
      id: 'pur-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    const nextList = [newRecord, ...purchases];
    setPurchases(nextList);
    await pushToCloud({ purchases: nextList });
  };

  const handleUpdatePurchase = async (record: PurchaseRecord) => {
    const nextList = purchases.map(p => p.id === record.id ? record : p);
    setPurchases(nextList);
    await pushToCloud({ purchases: nextList });
  };

  const handleDeletePurchase = async (id: string) => {
    const nextList = purchases.filter(p => p.id !== id);
    setPurchases(nextList);
    await pushToCloud({ purchases: nextList });
  };

  // Sale Handlers (পণ্য বিক্রি)
  const handleAddSale = async (record: Omit<SaleRecord, 'id' | 'createdAt'>) => {
    const newRecord: SaleRecord = {
      ...record,
      id: 'sale-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    const nextList = [newRecord, ...sales];
    setSales(nextList);
    await pushToCloud({ sales: nextList });
  };

  const handleDeleteSale = async (id: string) => {
    const nextList = sales.filter(s => s.id !== id);
    setSales(nextList);
    await pushToCloud({ sales: nextList });
  };

  const handleUpdateSale = async (sale: SaleRecord) => {
    const nextList = sales.map(s => s.id === sale.id ? sale : s);
    setSales(nextList);
    await pushToCloud({ sales: nextList });
  };

  // Product Request Handlers
  const handleAddProductRequest = async (request: Omit<ProductRequest, 'id' | 'createdAt'>) => {
    const newRequest: ProductRequest = {
      ...request,
      id: 'pr-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    const nextList = [newRequest, ...productRequests];
    setProductRequests(nextList);
    setHasViewedProductRequests(false);
    try {
      localStorage.setItem('caf_has_viewed_requests', 'false');
    } catch {}
    await pushToCloud({ productRequests: nextList });
  };

  const handleUpdateProductRequestStatus = async (id: string, status: ProductRequestStatus, notes?: string) => {
    const nextList = productRequests.map(r => {
      if (r.id !== id) return r;
      return {
        ...r,
        status,
        adminNotes: notes !== undefined ? notes : r.adminNotes,
        approvedBy: ['Approved', 'Ordered', 'Delivered', 'Received by Employee'].includes(status) ? currentUser?.fullName : r.approvedBy,
        deliveryDate: status === 'Delivered' ? new Date().toISOString() : r.deliveryDate
      };
    });
    setProductRequests(nextList);
    await pushToCloud({ productRequests: nextList });
  };

  const handleUpdateProductRequest = async (request: ProductRequest) => {
    const nextList = productRequests.map(r => r.id === request.id ? request : r);
    setProductRequests(nextList);
    await pushToCloud({ productRequests: nextList });
  };

  const handleConfirmProductReceipt = async (id: string, byUserId: string) => {
    const nextList = productRequests.map(r => {
      if (r.id !== id) return r;
      return {
        ...r,
        status: 'Received' as ProductRequestStatus,
        receivedByEmployee: true,
        receivedAt: new Date().toISOString()
      };
    });
    setProductRequests(nextList);
    await pushToCloud({ productRequests: nextList });
  };

  const handleDeleteProductRequest = async (id: string) => {
    const nextList = productRequests.filter(r => r.id !== id);
    setProductRequests(nextList);
    await pushToCloud({ productRequests: nextList });
  };

  // Size Management Handlers
  const handleAddSize = async (size: Omit<ProductionSize, 'id'>) => {
    const newSize: ProductionSize = {
      ...size,
      id: 'sz-' + Date.now()
    };
    const nextList = [...sizes, newSize];
    setSizes(nextList);
    await pushToCloud({ sizes: nextList });
  };

  const handleUpdateSize = async (size: ProductionSize) => {
    const nextList = sizes.map(s => s.id === size.id ? size : s);
    setSizes(nextList);
    await pushToCloud({ sizes: nextList });
  };

  const handleDeleteSize = async (id: string) => {
    const nextList = sizes.filter(s => s.id !== id);
    setSizes(nextList);
    await pushToCloud({ sizes: nextList });
  };

  // Payroll Handlers
  const handleUpdatePaymentStatus = async (userId: string, month: string, status: PaymentStatus) => {
    const key = `${userId}_${month}`;
    const nextMap = { ...payrollStatusMap, [key]: status };
    setPayrollStatusMap(nextMap);
    try {
      localStorage.setItem('caf_payroll_status', JSON.stringify(nextMap));
    } catch {}
    await pushToCloud({ payrollStatusMap: nextMap });
  };

  const handleBatchUpdatePaymentStatus = async (userIds: string[], month: string, status: PaymentStatus) => {
    const nextMap = { ...payrollStatusMap };
    userIds.forEach(uid => {
      nextMap[`${uid}_${month}`] = status;
    });
    setPayrollStatusMap(nextMap);
    try {
      localStorage.setItem('caf_payroll_status', JSON.stringify(nextMap));
    } catch {}
    await pushToCloud({ payrollStatusMap: nextMap });
  };

  const handleRecordPayment = async (payment: Omit<PayrollPayment, 'id' | 'createdAt'>) => {
    const newPayment: PayrollPayment = {
      ...payment,
      id: 'pay-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    const nextList = [newPayment, ...payments];
    setPayments(nextList);
    await pushToCloud({ payments: nextList });
  };

  // Duty Settings Handler
  const handleUpdateDutySettings = async (settings: DutySettings) => {
    setDutySettings(settings);
    await pushToCloud({ dutySettings: settings });
  };

  // User Handlers
  const handleAddUser = async (user: User) => {
    const nextList = [...users, user];
    setUsers(nextList);
    await pushToCloud({ users: nextList });
  };

  const handleRegisterUser = async (user: User): Promise<{ success: boolean; error?: string }> => {
    const exists = users.some(u => u.username && u.username.toLowerCase() === user.username.toLowerCase());
    if (exists) {
      return {
        success: false,
        error: language === 'bn' 
          ? 'এই ইউজারনেমটি ইতিমধ্যে ব্যবহৃত হয়েছে। অন্য একটি ইউজারনেম নির্বাচন করুন।' 
          : 'Username is already taken. Please choose another username.'
      };
    }
    const nextList = [...users, user];
    setUsers(nextList);
    await pushToCloud({ users: nextList });
    return { success: true };
  };

  const handleUpdateUser = async (user: User) => {
    const nextList = users.map(u => u.id === user.id ? user : u);
    setUsers(nextList);
    await pushToCloud({ users: nextList });
    if (currentUser && currentUser.id === user.id) {
      if (user.accountStatus !== 'Active') {
        handleLogout();
      } else {
        setCurrentUser(user);

      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const nextList = users.filter(u => u.id !== userId);
    setUsers(nextList);
    await pushToCloud({ users: nextList });
    if (currentUser && currentUser.id === userId) {
      handleLogout();
    }
  };

  const handleUpdateCompanyNotice = async (notice: string, title?: string, mentionedIds?: string[]) => {
    const updated: CompanyProfile = { 
      ...companyProfile, 
      noticeText: notice,
      noticeTitle: title || companyProfile.noticeTitle || 'ফ্যাক্টরি নোটিশ বোর্ড',
      noticeDate: new Date().toISOString(),
      mentionedUserIds: mentionedIds !== undefined ? mentionedIds : (companyProfile.mentionedUserIds || [])
    };
    setCompanyProfile(updated);
    await pushToCloud({ companyProfile: updated });
  };

  const handleUpdateCompanyLogo = async (logoUrl: string) => {
    const updated = { ...companyProfile, logoUrl };
    setCompanyProfile(updated);
    try {
      localStorage.setItem('caf_company', JSON.stringify(updated));
    } catch {}
    await pushToCloud({ companyProfile: updated });
  };

  const handleUpdateCompanyBanner = async (bannerUrl: string) => {
    const updated = { ...companyProfile, bannerUrl };
    setCompanyProfile(updated);
    try {
      localStorage.setItem('caf_company', JSON.stringify(updated));
    } catch {}
    await pushToCloud({ companyProfile: updated });
  };

  const handleUpdateCompanyProfile = async (profileUpdate: Partial<CompanyProfile>) => {
    const updated: CompanyProfile = { ...companyProfile, ...profileUpdate };
    setCompanyProfile(updated);
    try {
      localStorage.setItem('caf_company', JSON.stringify(updated));
    } catch {}
    await pushToCloud({ companyProfile: updated });
  };

  const handleAddSection = async (sectionName: string) => {
    const trimmed = sectionName.trim();
    if (!trimmed) return;
    if (sections.includes(trimmed)) return;
    const nextSections = [...sections, trimmed];
    setSections(nextSections);
    try {
      localStorage.setItem('caf_sections', JSON.stringify(nextSections));
    } catch {}
    await pushToCloud({ sections: nextSections });
  };

  const handleRenameSection = async (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    const nextSections = sections.map(s => s === oldName ? trimmed : s);
    setSections(nextSections);
    try {
      localStorage.setItem('caf_sections', JSON.stringify(nextSections));
    } catch {}
    // Update users and productions
    const nextUsers = users.map(u => u.section === oldName ? { ...u, section: trimmed } : u);
    setUsers(nextUsers);
    const nextProd = productions.map(p => p.section === oldName ? { ...p, section: trimmed } : p);
    setProductions(nextProd);
    await pushToCloud({ sections: nextSections, users: nextUsers, productions: nextProd });
  };

  const handleDeleteSection = async (sectionName: string) => {
    const nextSections = sections.filter(s => s !== sectionName);
    setSections(nextSections);
    try {
      localStorage.setItem('caf_sections', JSON.stringify(nextSections));
    } catch {}
    await pushToCloud({ sections: nextSections });
  };

  const handleUpdateCloudUrl = async (url: string) => {
    setCloudDbUrl(url);
    localStorage.setItem('caf_cloud_url', url);
    await fetchFromCloud(url);
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${
      darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-[#f8fafc] text-slate-800'
    }`}>
      {/* Top Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAdminGate={() => { if (isFullAdmin) setCurrentTab('admin_panel'); }}
        isAdminUnlocked={isFullAdmin}
        language={language}
        onToggleLanguage={() => setLanguage(l => l === 'en' ? 'bn' : 'en')}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        logoUrl={companyProfile.logoUrl}
        onOpenProfileModal={() => setUserProfileModalOpen(true)}
        onOpenPrintModal={() => setPrintModalOpen(true)}
        onOpenSearch={() => setIsGlobalSearchOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        pendingRequestsCount={productRequests.filter(r => r.status === 'Pending').length}
        hasViewedProductRequests={hasViewedProductRequests}
      />

      {/* Global Status Strip */}
      <StatusStrip
        syncStatus={syncStatus}
        currentUser={currentUser}
        language={language}
        darkMode={darkMode}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-5">
        {/* Urgent Mention Alert at Top for Employee Accounts */}
        {(currentUser.accountType === 'employee' || currentUser.accountType === 'staff') && 
          companyProfile.mentionedUserIds?.includes(currentUser.id) && (
            <div className={`p-4 rounded-2xl border-2 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              darkMode ? 'bg-amber-950/60 border-amber-500 text-amber-100' : 'bg-amber-50 border-amber-400 text-amber-950'
            }`}>
              <div className="flex items-start sm:items-center gap-3">
                <span className="text-2xl animate-bounce">🚨</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
                      {companyProfile.noticeTitle || 'জরুরি নোটিশ এলার্ট'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase">
                      {language === 'bn' ? 'আপনাকে মেনশন করা হয়েছে' : 'You are mentioned'}
                    </span>
                  </div>
                  <p className="text-xs font-bold mt-0.5">
                    {companyProfile.noticeText}
                  </p>
                </div>
              </div>
              {currentTab !== 'dashboard' && (
                <button
                  onClick={() => setCurrentTab('dashboard')}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs cursor-pointer shrink-0 transition"
                >
                  {language === 'bn' ? 'নোটিশ বোর্ডে যান' : 'Go to Notice'}
                </button>
              )}
            </div>
          )}

        {/* 1. Dashboard View */}
        {currentTab === 'dashboard' && (
          <DashboardView
            currentUser={currentUser}
            users={users}
            companyProfile={companyProfile}
            attendance={attendance}
            overtime={overtime}
            productions={productions}
            leaves={leaves}
            expenses={expenses}
            productRequests={productRequests}
            purchases={purchases}
            sales={sales}
            language={language}
            darkMode={darkMode}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
            onOpenAttendanceModal={() => setCurrentTab('attendance')}
            onOpenOvertimeModal={() => setCurrentTab('overtime')}
            onOpenIdCardModal={setIdCardModalUser}
            onUpdateCompanyNotice={handleUpdateCompanyNotice}
            onNavigateToProduction={() => setCurrentTab('production')}
            onNavigateToAdmin={() => setCurrentTab('admin_panel')}
            onNavigateToTab={setCurrentTab}
            onOpenSearch={() => setIsGlobalSearchOpen(true)}
            onOpenShortcuts={() => setIsShortcutsOpen(true)}
            onAddAttendance={handleAddAttendance}
            onUpdateAttendanceStatus={handleUpdateAttendanceStatus}
            onUpdateAttendanceRecord={handleUpdateAttendanceRecord}
            onBatchAddAttendance={handleBatchAddAttendance}
            onUpdateProduction={handleUpdateProduction}
            onDeleteProduction={handleDeleteProduction}
            onUpdatePurchase={handleUpdatePurchase}
            onDeletePurchase={handleDeletePurchase}
            onUpdateProductRequest={handleUpdateProductRequest}
            onUpdateProductRequestStatus={handleUpdateProductRequestStatus}
            onDeleteProductRequest={handleDeleteProductRequest}
            onUpdateExpense={handleUpdateExpense}
            onUpdateExpenseStatus={handleUpdateExpenseStatus}
            onDeleteExpense={handleDeleteExpense}
            onUpdateLeave={handleUpdateLeave}
            onUpdateLeaveStatus={handleUpdateLeaveStatus}
            onDeleteLeave={handleDeleteLeave}
            onUpdateSale={handleUpdateSale}
            onDeleteSale={handleDeleteSale}
            onUpdateUser={handleUpdateUser}
          />
        )}

        {/* 2. Production View */}
        {(currentTab === 'production' || currentTab === 'monthly_production') && (
          <ProductionView
            productions={productions}
            users={users}
            sections={sections}
            currentUser={currentUser}
            companyProfile={companyProfile}
            language={language}
            darkMode={darkMode}
            sizes={sizes}
            onSaveSizes={async (newSizes) => {
              setSizes(newSizes);
              await pushToCloud({ sizes: newSizes });
            }}
            onAddSize={handleAddSize}
            onUpdateSize={handleUpdateSize}
            onDeleteSize={handleDeleteSize}
            onAddProduction={handleAddProduction}
            onUpdateProduction={handleUpdateProduction}
            onDeleteProduction={handleDeleteProduction}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
            initialTab={currentTab === 'monthly_production' ? 'monthly' : 'daily'}
            onTabChange={(tab) => setCurrentTab(tab === 'monthly' ? 'monthly_production' : 'production')}
          />
        )}

        {/* 3. Attendance View */}
        {currentTab === 'attendance' && (
          <AttendanceView
            attendance={attendance}
            users={users}
            currentUser={currentUser}
            leaves={leaves}
            language={language}
            darkMode={darkMode}
            onAddAttendance={handleAddAttendance}
            onBatchAddAttendance={handleBatchAddAttendance}
            onUpdateStatus={handleUpdateAttendanceStatus}
            onDeleteAttendance={handleDeleteAttendance}
          />
        )}

        {/* 4. Leave Management View */}
        {currentTab === 'leave' && (
          <LeaveView
            leaves={leaves}
            users={users}
            currentUser={currentUser}
            language={language}
            darkMode={darkMode}
            onAddLeave={handleAddLeave}
            onUpdateLeaveStatus={handleUpdateLeaveStatus}
            onDeleteLeave={handleDeleteLeave}
          />
        )}

        {/* 5. Overtime View */}
        {currentTab === 'overtime' && (
          <OvertimeView
            overtime={overtime}
            users={users}
            currentUser={currentUser}
            language={language}
            darkMode={darkMode}
            onAddOvertime={handleAddOvertime}
            onUpdateStatus={handleUpdateOvertimeStatus}
            onDeleteOvertime={handleDeleteOvertime}
          />
        )}

        {/* 6. Payroll View */}
        {currentTab === 'payroll' && (
          <PayrollView
            users={users}
            overtime={overtime}
            currentUser={currentUser}
            companyProfile={companyProfile}
            language={language}
            darkMode={darkMode}
            payrollStatusMap={payrollStatusMap}
            payments={payments}
            onUpdatePaymentStatus={handleUpdatePaymentStatus}
            onBatchUpdatePaymentStatus={handleBatchUpdatePaymentStatus}
            onRecordPayment={handleRecordPayment}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
          />
        )}

        {/* 7. Bills & Expenses View */}
        {currentTab === 'expenses' && (
          <BillsExpensesView
            expenses={expenses}
            purchases={purchases}
            users={users}
            currentUser={currentUser}
            companyProfile={companyProfile}
            language={language}
            darkMode={darkMode}
            onAddExpense={handleAddExpense}
            onUpdateExpenseStatus={handleUpdateExpenseStatus}
            onDeleteExpense={handleDeleteExpense}
            onAddPurchase={handleAddPurchase}
            onDeletePurchase={handleDeletePurchase}
          />
        )}

        {/* 8. Holiday Calendar View */}
        {currentTab === 'calendar' && (
          <BangladeshHolidayCalendar
            language={language}
            darkMode={darkMode}
            currentUser={currentUser}
          />
        )}

        {/* 9. Admin Panel View */}
        {currentTab === 'admin_panel' && isFullAdmin && (
          <AdminPanelView
            users={users}
            currentUser={currentUser}
            sections={sections}
            companyProfile={companyProfile}
            cloudDbUrl={cloudDbUrl}
            language={language}
            darkMode={darkMode}
            productions={productions}
            attendance={attendance}
            overtime={overtime}
            payrollStatusMap={payrollStatusMap}
            selectedMonth={selectedMonth}
            dutySettings={dutySettings}
            onUpdateDutySettings={handleUpdateDutySettings}
            onSelectMonth={setSelectedMonth}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onUpdateCompanyNotice={handleUpdateCompanyNotice}
            onUpdateCloudUrl={handleUpdateCloudUrl}
            onOpenIdCardModal={setIdCardModalUser}
            onAddSection={handleAddSection}
            onRenameSection={handleRenameSection}
            onDeleteSection={handleDeleteSection}
            onUpdateCompanyLogo={handleUpdateCompanyLogo}
            onUpdateCompanyBanner={handleUpdateCompanyBanner}
            onUpdateCompanyProfile={handleUpdateCompanyProfile}
            onAddProduction={handleAddProduction}
            onUpdateProduction={handleUpdateProduction}
            onDeleteProduction={handleDeleteProduction}
          />
        )}

        {/* 10. Products & Trade Master Hub (Buying, Selling, Database & Requests) */}
        {(currentTab === 'product_requests' || (currentTab as string) === 'products_trade') && (
          <ProductRequestView
            requests={productRequests}
            purchases={purchases}
            sales={sales}
            productions={productions}
            users={users}
            currentUser={currentUser}
            language={language}
            darkMode={darkMode}
            onAddRequest={handleAddProductRequest}
            onUpdateStatus={handleUpdateProductRequestStatus}
            onConfirmReceipt={handleConfirmProductReceipt}
            onDeleteRequest={handleDeleteProductRequest}
            onAddPurchase={handleAddPurchase}
            onDeletePurchase={handleDeletePurchase}
            onAddSale={handleAddSale}
            onDeleteSale={handleDeleteSale}
            onUpdateSale={handleUpdateSale}
          />
        )}
      </main>



      {/* Footer */}
      <footer className={`no-print border-t py-4 text-xs text-center text-slate-500 mt-auto ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{companyProfile.name} · {companyProfile.factoryRegNo}</span>
          <span className="text-[11px] text-slate-400">
            📍 Bamnartek, Dhaka 1230, Bangladesh · 📞 {companyProfile.contactNumber}
          </span>
        </div>
      </footer>

      {/* Global Modals */}
      {userProfileModalOpen && currentUser && (
        <UserProfileModal
          isOpen={userProfileModalOpen}
          user={currentUser}
          companyProfile={companyProfile}
          language={language}
          darkMode={darkMode}
          onClose={() => setUserProfileModalOpen(false)}
          onUpdateUser={handleUpdateUser}
        />
      )}

      <DigitalIdCardModal
        user={idCardModalUser}
        companyProfile={companyProfile}
        language={language}
        onClose={() => setIdCardModalUser(null)}
      />

      <PrintReportModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        currentTab={currentTab}
        companyProfile={companyProfile}
        language={language}
        darkMode={darkMode}
      />

      {/* Universal Global Search Modal (Ctrl + K) */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        users={users}
        productions={productions}
        attendance={attendance}
        overtime={overtime}
        leaves={leaves}
        expenses={expenses}
        purchases={purchases}
        productRequests={productRequests}
        currentUser={currentUser}
        language={language}
        darkMode={darkMode}
        onNavigateToTab={(tab) => {
          setCurrentTab(tab);
          setIsGlobalSearchOpen(false);
        }}
      />

      {/* Keyboard Shortcuts Modal (?) */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        language={language}
        darkMode={darkMode}
      />
    </div>
  );
}
