import React, { useState, useEffect } from 'react';
import { User, CompanyProfile, Language, AttendanceRecord } from '../types';
import { translations } from '../i18n';
import { initAuth, googleSignIn, googleLogout, sendGmailMessage, getAccessToken } from '../gmail';
import { 
  Mail, 
  Send, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Users, 
  UserX, 
  Briefcase, 
  Sparkles, 
  LogOut,
  Clock,
  Check
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';

interface GmailDispatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  companyProfile: CompanyProfile;
  attendance: AttendanceRecord[];
  initialRecipientUserId?: string;
  initialTemplate?: 'absent' | 'production' | 'payroll' | 'custom';
  language: Language;
  darkMode: boolean;
}

export const GmailDispatcherModal: React.FC<GmailDispatcherModalProps> = ({
  isOpen,
  onClose,
  users,
  companyProfile,
  attendance,
  initialRecipientUserId,
  initialTemplate = 'absent',
  language,
  darkMode
}) => {
  const isBn = language === 'bn';
  const todayStr = new Date().toISOString().split('T')[0];

  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string>('');

  // Form state
  const [recipientType, setRecipientType] = useState<'individual' | 'absent_today' | 'custom'>('individual');
  const [selectedUserId, setSelectedUserId] = useState<string>(initialRecipientUserId || users[0]?.id || '');
  const [customEmail, setCustomEmail] = useState<string>('');
  const [templateType, setTemplateType] = useState<'absent' | 'production' | 'payroll' | 'custom'>(initialTemplate);
  const [subject, setSubject] = useState<string>('');
  const [bodyText, setBodyText] = useState<string>('');
  
  // Confirmation & sending state
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  // Initialize auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (u, t) => {
        setGoogleUser(u);
        setToken(t);
        setAuthError('');
      },
      () => {
        setGoogleUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Update initial recipient if prop changes
  useEffect(() => {
    if (initialRecipientUserId) {
      setSelectedUserId(initialRecipientUserId);
      setRecipientType('individual');
    }
    if (initialTemplate) {
      setTemplateType(initialTemplate);
    }
  }, [initialRecipientUserId, initialTemplate, isOpen]);

  // Absent workers today
  const absentRecordsToday = attendance.filter(a => a.date === todayStr && a.status === 'Absent');
  const absentUserIds = new Set(absentRecordsToday.map(a => a.userId));
  const absentUsers = users.filter(u => absentUserIds.has(u.id));

  const targetUser = users.find(u => u.id === selectedUserId);

  // Auto-generate template text
  useEffect(() => {
    const recipientName = targetUser ? targetUser.fullName : (isBn ? 'কর্মীবৃন্দ' : 'Employee');
    const recipientId = targetUser ? targetUser.employeeId : 'CAF-EMP';
    const sectionName = targetUser?.section || 'General Production';

    if (templateType === 'absent') {
      setSubject(isBn 
        ? `[জরুরি বিজ্ঞপ্তি] ফ্যাক্টরিতে তাৎক্ষণিক উপস্থিতি নির্দেশ - ${companyProfile.name}`
        : `[Urgent Notice] Immediate Attendance Required - ${companyProfile.name}`);
      setBodyText(isBn
        ? `প্রিয় ${recipientName} (আইডি: ${recipientId}),\n\nআপনি আজ (${todayStr}) তারিখে ক্রিয়েটিভ এক্সেসরিজ ফ্যাক্টরিতে অনুপস্থিত রয়েছেন। জরুরি কাজের ডেলিভারি এবং শিফট পরিচালনার স্বার্থে আপনার উপস্থিতি আবশ্যক।\n\nঅনুগ্রহ করে অনতিবিলম্বে কারখানায় রিপোর্ট করুন অথবা অনুপস্থিতির কারণ সম্পর্কে আপনার সেকশন সুপারভাইজার বা এইচআর ডিপার্টমেন্টকে সরাসরি অবহিত করুন।\n\nকারখানা যোগাযোগ: ${companyProfile.contactNumber}\nঠিকানা: ${companyProfile.address}\n\nধন্যবাদান্তে,\nঅ্যাডমিন ও ম্যানেজমেন্ট\n${companyProfile.name}`
        : `Dear ${recipientName} (ID: ${recipientId}),\n\nYou are marked absent today (${todayStr}) at Creative Accessories Factory. Your presence is required to meet our daily production target.\n\nPlease report to the factory immediately or notify your section supervisor or HR department regarding your reason for absence.\n\nFactory Contact: ${companyProfile.contactNumber}\nAddress: ${companyProfile.address}\n\nSincerely,\nAdmin & Management\n${companyProfile.name}`);
    } else if (templateType === 'production') {
      setSubject(isBn 
        ? `[উৎপাদন নোটিশ] সেকশন ওয়ার্ক অর্ডার ও জরুরি ডেলিভারি টার্গেট - ${sectionName}`
        : `[Production Update] Work Order & Delivery Schedule - ${sectionName}`);
      setBodyText(isBn
        ? `সম্মানিত ${recipientName},\n\nআমাদের ${sectionName} সেকশনে নতুন গুরুত্বপূর্ণ বায়ার অর্ডার চলমান রয়েছে। সময়মতো ডেলিভারি নিশ্চিত করতে আজকের উৎপাদনের কোয়ালিটি ও টার্গেট বজায় রাখা জরুরি।\n\nযেকোনো কারিগরি সহায়তা বা ওভারটাইমের জন্য সুপারভাইজারের সাথে যোগাযোগ রাখুন।\n\nধন্যবাদান্তে,\nপ্রোডাকশন ম্যানেজমেন্ট\n${companyProfile.name}`
        : `Dear ${recipientName},\n\nWe have critical buyer work orders currently running in ${sectionName}. Please ensure accurate output and strict quality control to meet our delivery commitment.\n\nFor any machine or overtime queries, please consult your supervisor.\n\nBest regards,\nProduction Management\n${companyProfile.name}`);
    } else if (templateType === 'payroll') {
      setSubject(isBn
        ? `[বেতন নোটিশ] আপনার মাসিক পে-স্লিপ ও বেতন বিতরণ চূড়ান্ত - ${companyProfile.name}`
        : `[Payroll Notice] Monthly Salary & Pay Slip Ready - ${companyProfile.name}`);
      setBodyText(isBn
        ? `সম্মানিত ${recipientName},\n\nআপনার চলতি মাসের বেসিক বেতন এবং অনুমোদিত ওভারটাইম বিল প্রস্তুত করা হয়েছে। আপনি পোর্টাল থেকে আপনার ডিজিটাল পে-স্লিপ প্রিন্ট/ডাউনলোড করতে পারেন।\n\nকোনো অসঙ্গতি থাকলে একাউন্টস শাখায় যোগাযোগ করুন।\n\nশুভেচ্ছা সহ,\nহিসাব ও পে-রোল বিভাগ\n${companyProfile.name}`
        : `Dear ${recipientName},\n\nYour monthly basic salary and approved overtime bill have been calculated. You may view and print your digital pay slip via the factory portal.\n\nFor any questions, please contact Accounts.\n\nWarm regards,\nAccounts & Payroll\n${companyProfile.name}`);
    }
  }, [templateType, selectedUserId, todayStr, companyProfile, isBn, targetUser]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError('');
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setToken(res.accessToken);
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Google Sign-in failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await googleLogout();
    setGoogleUser(null);
    setToken(null);
  };

  // Determine recipients list
  const getRecipientEmails = (): { email: string; name: string }[] => {
    if (recipientType === 'individual') {
      if (targetUser) {
        // Construct fallback or registered email
        const email = targetUser.username.includes('@') 
          ? targetUser.username 
          : `${targetUser.username.toLowerCase()}@creativeaccessories.com`;
        return [{ email, name: targetUser.fullName }];
      }
      return [];
    } else if (recipientType === 'absent_today') {
      return absentUsers.map(u => ({
        email: u.username.includes('@') ? u.username : `${u.username.toLowerCase()}@creativeaccessories.com`,
        name: u.fullName
      }));
    } else {
      if (customEmail.trim()) {
        return [{ email: customEmail.trim(), name: 'Recipient' }];
      }
      return [];
    }
  };

  const recipients = getRecipientEmails();

  const handleTriggerSend = () => {
    if (recipients.length === 0) {
      setSendResult({ success: false, message: isBn ? 'কোনো প্রাপক ইমেইল পাওয়া যায়নি।' : 'No recipient email specified.' });
      return;
    }
    if (!subject.trim() || !bodyText.trim()) {
      setSendResult({ success: false, message: isBn ? 'অনুগ্রহ করে বিষয় ও বার্তার বিবরণ লিখুন।' : 'Please enter subject and message body.' });
      return;
    }
    // Show explicit user confirmation dialog required by Workspace guidelines
    setIsConfirming(true);
  };

  const handleExecuteSend = async () => {
    setIsConfirming(false);
    setIsSending(true);
    setSendResult(null);

    const formattedHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: #4f46e5; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 20px; font-weight: bold;">${companyProfile.name}</h2>
          <p style="margin: 4px 0 0; font-size: 12px; opacity: 0.9;">Factory Reg: ${companyProfile.factoryRegNo} · Bamnartek, Dhaka</p>
        </div>
        <div style="padding: 24px;">
          <h3 style="color: #0f172a; margin-top: 0; font-size: 16px;">${subject}</h3>
          <div style="white-space: pre-wrap; font-size: 14px; color: #334155; margin: 16px 0;">${bodyText}</div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 11px; color: #64748b; margin: 0;">
            This email was sent via Creative Accessories Factory Portal.<br>
            Hotline: ${companyProfile.contactNumber} | Address: ${companyProfile.address}
          </p>
        </div>
      </div>
    `;

    try {
      let sentCount = 0;
      let lastErr = '';

      for (const r of recipients) {
        const res = await sendGmailMessage(r.email, subject, formattedHtml);
        if (res.success) {
          sentCount++;
        } else {
          lastErr = res.error || 'Failed to send';
        }
      }

      if (sentCount > 0) {
        setSendResult({
          success: true,
          message: isBn 
            ? `✓ জিমেইল মারফত সফলভাবে ${sentCount} টি ইমেইল পাঠানো সম্পন্ন হয়েছে!`
            : `✓ Successfully sent ${sentCount} email(s) via Gmail!`
        });
      } else {
        setSendResult({
          success: false,
          message: lastErr || (isBn ? 'ইমেইল পাঠাতে ব্যর্থ হয়েছে।' : 'Failed to send email.')
        });
      }
    } catch (e: any) {
      setSendResult({ success: false, message: e?.message || 'Error occurred while sending' });
    } finally {
      setIsSending(false);
    }
  };

  const cardBg = darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900';
  const inputBg = darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className={`border rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto ${cardBg}`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <span>{isBn ? '📧 জিমেইল ডেসপ্যাচার ও নোটিশ সেন্টার' : '📧 Gmail Dispatcher & Notice Center'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-bold">
                  Gmail API
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isBn ? 'অনুপস্থিত কর্মীকে অফিসে আসার তাগাদা, প্রোডাকশন নোটিশ ও যেকোনা ইমেইল পাঠান' : 'Send absentee follow-ups, production notices, or custom emails'}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Google Authentication Status Card */}
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          googleUser 
            ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60' 
            : 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60'
        }`}>
          {googleUser ? (
            <div className="flex items-center gap-3">
              {googleUser.photoURL ? (
                <img src={googleUser.photoURL} alt="Avatar" className="w-10 h-10 rounded-xl object-cover border border-emerald-400 shadow-xs" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center">
                  {googleUser.displayName?.charAt(0) || 'G'}
                </div>
              )}
              <div>
                <div className="text-xs font-black text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{googleUser.displayName || 'Authorized Google User'}</span>
                </div>
                <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                  {googleUser.email}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-xs font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{isBn ? 'গুগল জিমেইল একাউন্ট কানেক্ট করুন:' : 'Connect Google Workspace Account:'}</span>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                {isBn ? 'কর্মীদের সরাসরি অফিসিয়াল জিমেইল থেকে ইমেইল পাঠাতে আপনার গুগল অ্যাকাউন্ট সংযুক্ত করুন।' : 'Sign in to send official emails directly from your Gmail account.'}
              </p>
            </div>
          )}

          <div className="shrink-0 w-full sm:w-auto">
            {googleUser ? (
              <button
                type="button"
                onClick={handleGoogleLogout}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isBn ? 'লগআউট' : 'Sign Out'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition"
              >
                {/* Official Google G Logo */}
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isLoggingIn ? (isBn ? 'কানেক্ট হচ্ছে...' : 'Connecting...') : (isBn ? 'Google দিয়ে সাইন-ইন' : 'Sign in with Google')}</span>
              </button>
            )}
          </div>
        </div>

        {authError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-900">
            {authError}
          </div>
        )}

        {/* Template Selector Quick Bar */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500">
            {isBn ? '📋 রেডিমেড ইমেইল টেমপ্লেট নির্বাচন:' : '📋 Select Pre-made Template:'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setTemplateType('absent')}
              className={`p-2.5 rounded-xl border text-left font-bold transition cursor-pointer flex flex-col gap-1 ${
                templateType === 'absent'
                  ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-rose-300'
              }`}
            >
              <div className="flex items-center gap-1">
                <UserX className="w-3.5 h-3.5" />
                <span className="text-[11px]">{isBn ? 'অফিসে আসার তাগাদা' : 'Absent Follow-up'}</span>
              </div>
              <span className={`text-[9px] ${templateType === 'absent' ? 'text-white/80' : 'text-slate-400'}`}>
                {isBn ? 'অনুপস্থিত থাকলে মেইল' : 'Absent workers'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTemplateType('production')}
              className={`p-2.5 rounded-xl border text-left font-bold transition cursor-pointer flex flex-col gap-1 ${
                templateType === 'production'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5" />
                <span className="text-[11px]">{isBn ? 'প্রোডাকশন আপডেট' : 'Production Work'}</span>
              </div>
              <span className={`text-[9px] ${templateType === 'production' ? 'text-white/80' : 'text-slate-400'}`}>
                {isBn ? 'টার্গেট ও ডেলিভারি' : 'Target delivery'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTemplateType('payroll')}
              className={`p-2.5 rounded-xl border text-left font-bold transition cursor-pointer flex flex-col gap-1 ${
                templateType === 'payroll'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[11px]">{isBn ? 'বেতন ও পে-স্লিপ' : 'Payroll Notice'}</span>
              </div>
              <span className={`text-[9px] ${templateType === 'payroll' ? 'text-white/80' : 'text-slate-400'}`}>
                {isBn ? 'মাসিক বেতন প্রস্তুত' : 'Salary ready'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTemplateType('custom');
                setSubject('');
                setBodyText('');
              }}
              className={`p-2.5 rounded-xl border text-left font-bold transition cursor-pointer flex flex-col gap-1 ${
                templateType === 'custom'
                  ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-[11px]">{isBn ? 'কাস্টম মেইল' : 'Custom Email'}</span>
              </div>
              <span className={`text-[9px] ${templateType === 'custom' ? 'text-white/80' : 'text-slate-400'}`}>
                {isBn ? 'যেকোনো বার্তা লিখুন' : 'Any custom message'}
              </span>
            </button>
          </div>
        </div>

        {/* Recipient Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500">
              {isBn ? '👤 প্রাপক নির্বাচন (Recipients):' : '👤 Select Recipient(s):'}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRecipientType('individual')}
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md cursor-pointer ${
                  recipientType === 'individual' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {isBn ? 'নির্দিষ্ট কর্মী' : 'Individual'}
              </button>
              <button
                type="button"
                onClick={() => setRecipientType('absent_today')}
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md cursor-pointer ${
                  recipientType === 'absent_today' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {isBn ? `আজকের অনুপস্থিত (${absentUsers.length} জন)` : `Absent Today (${absentUsers.length})`}
              </button>
              <button
                type="button"
                onClick={() => setRecipientType('custom')}
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md cursor-pointer ${
                  recipientType === 'custom' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {isBn ? 'কাস্টম ইমেইল' : 'Custom Email'}
              </button>
            </div>
          </div>

          {recipientType === 'individual' && (
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className={`w-full p-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:border-indigo-600 ${inputBg}`}
            >
              {users.filter(u => u.accountType !== 'hosting').map(u => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.employeeId}) · {u.section} · {u.designation} {absentUserIds.has(u.id) ? ' (❌ আজ অনুপস্থিত)' : ''}
                </option>
              ))}
            </select>
          )}

          {recipientType === 'absent_today' && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs">
              <div className="font-bold text-rose-800 dark:text-rose-200 mb-1">
                {isBn ? `আজকের তারিখে অনুপস্থিত কর্মী তালিকা (${absentUsers.length} জন):` : `Workers marked absent today (${absentUsers.length}):`}
              </div>
              {absentUsers.length === 0 ? (
                <p className="text-slate-500 italic text-[11px]">
                  {isBn ? 'আজ কোনো কর্মী অনুপস্থিত মার্ক করা নেই।' : 'No workers marked absent today.'}
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {absentUsers.map(u => (
                    <span key={u.id} className="px-2 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-200 text-[10px] font-bold">
                      {u.fullName} ({u.employeeId})
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {recipientType === 'custom' && (
            <input
              type="email"
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
              placeholder="e.g. employee@gmail.com"
              className={`w-full p-2.5 rounded-xl border text-xs font-mono focus:outline-none focus:border-indigo-600 ${inputBg}`}
            />
          )}
        </div>

        {/* Email Subject */}
        <div>
          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
            {isBn ? 'মেইলের বিষয় (Subject) *' : 'Subject *'}
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Urgent Attendance Notice"
            className={`w-full p-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:border-indigo-600 ${inputBg}`}
          />
        </div>

        {/* Email Body */}
        <div>
          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
            {isBn ? 'ইমেইল বার্তা / বিবরণ (Message Body) *' : 'Message Body *'}
          </label>
          <textarea
            rows={5}
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            placeholder="Type your message to the worker..."
            className={`w-full p-3 rounded-xl border text-xs leading-relaxed focus:outline-none focus:border-indigo-600 font-sans ${inputBg}`}
          />
        </div>

        {/* Result Message Banner */}
        {sendResult && (
          <div className={`p-3.5 rounded-2xl text-xs font-extrabold flex items-center justify-between gap-2 ${
            sendResult.success 
              ? 'bg-emerald-600 text-white' 
              : 'bg-rose-600 text-white'
          }`}>
            <span>{sendResult.message}</span>
            <button type="button" onClick={() => setSendResult(null)} className="text-white font-bold cursor-pointer">✕</button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="text-[11px] text-slate-400">
            {googleUser 
              ? (isBn ? `প্রেরক: ${googleUser.email}` : `Sender: ${googleUser.email}`)
              : (isBn ? 'ইমেইল পাঠাতে প্রথমে গুগল সাইন-ইন সম্পন্ন করুন' : 'Sign in with Google to send')}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs cursor-pointer"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>

            {/* Direct Send button */}
            <button
              type="button"
              disabled={isSending || !googleUser}
              onClick={handleTriggerSend}
              className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-sm ${
                googleUser
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
                  : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? (isBn ? 'পাঠানো হচ্ছে...' : 'Sending...') : (isBn ? 'ইমেইল পাঠান' : 'Send Email')}</span>
            </button>
          </div>
        </div>

        {/* Explicit Confirmation Dialog (Mandatory per Workspace guidelines for mutating actions) */}
        {isConfirming && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className={`border-2 border-indigo-500 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 ${cardBg}`}>
              <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <h4 className="font-extrabold text-base">
                  {isBn ? 'ইমেইল পাঠানোর চূড়ান্ত অনুমোদন' : 'Confirm Email Dispatch'}
                </h4>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {isBn 
                  ? `আপনি কি নিশ্চিতভাবে ${recipients.length} জন কর্মীকে "${subject}" শিরোনামে জিমেইল মারফত ইমেইল পাঠাতে চান?`
                  : `Are you sure you want to send this email ("${subject}") to ${recipients.length} recipient(s) through your connected Gmail account?`}
              </p>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-mono space-y-1">
                <div><strong>To:</strong> {recipients.map(r => r.email).join(', ')}</div>
                <div><strong>Subject:</strong> {subject}</div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsConfirming(false)}
                  className="px-4 py-2 font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs cursor-pointer"
                >
                  {isBn ? 'না, বাতিল' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleExecuteSend}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs cursor-pointer shadow-sm transition"
                >
                  {isBn ? 'হ্যাঁ, পাঠিয়ে দিন' : 'Confirm & Send'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
