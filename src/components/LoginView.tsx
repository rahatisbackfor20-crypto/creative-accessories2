import React, { useState, useRef } from 'react';
import { CompanyProfile, Language, User } from '../types';
import { translations } from '../i18n';
import { CompanyLogo } from './CompanyLogo';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  Globe, 
  Sun, 
  Moon, 
  Shield, 
  UserPlus, 
  LogIn, 
  Camera, 
  Upload, 
  Check, 
  Clock, 
  X,
  AlertCircle
} from 'lucide-react';

interface LoginViewProps {
  companyProfile: CompanyProfile;
  sections: string[];
  language: Language;
  darkMode: boolean;
  onLogin: (username: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  onRegisterUser: (user: User) => Promise<{ success: boolean; error?: string }>;
  onToggleLanguage: () => void;
  onToggleDarkMode: () => void;
  onOpenAdminGate: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  companyProfile,
  sections,
  language,
  darkMode,
  onLogin,
  onRegisterUser,
  onToggleLanguage,
  onToggleDarkMode,
  onOpenAdminGate
}) => {
  const t = translations[language];
  const isBn = language === 'bn';

  // Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regSection, setRegSection] = useState(sections[0] || 'Sewing');
  const [regDesignation, setRegDesignation] = useState('Senior Zipper Operator');
  const [regWhatsapp, setRegWhatsapp] = useState('+880');
  const [regPhotoUrl, setRegPhotoUrl] = useState('');
  const [regPhotoInputUrl, setRegPhotoInputUrl] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);
  const [regError, setRegError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setRegError(isBn ? 'ছবির আকার ৫MB এর কম হতে হবে।' : 'Image size must be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRegPhotoUrl(reader.result as string);
      setRegPhotoInputUrl('');
      setRegError('');
    };
    reader.onerror = () => {
      setRegError(isBn ? 'ছবি লোড করতে সমস্যা হয়েছে।' : 'Failed to read image.');
    };
    reader.readAsDataURL(file);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError(t.invalidCredentials);
      return;
    }

    setIsSubmitting(true);
    setError('');
    const res = await onLogin(username.trim(), password);
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || t.invalidCredentials);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName.trim() || !regUsername.trim() || !regPassword.trim()) {
      setRegError(isBn ? 'সকল প্রয়োজনীয় তথ্য পূরণ করুন।' : 'Please fill all required fields.');
      return;
    }

    setIsSubmitting(true);
    setRegError('');

    const todayStr = new Date().toISOString().split('T')[0];
    const newUser: User = {
      id: 'u-reg-' + Date.now(),
      fullName: regFullName.trim(),
      username: regUsername.trim(),
      password: regPassword.trim(),
      photoUrl: regPhotoUrl || '',
      accountType: 'employee',
      designation: regDesignation.trim() || 'Factory Worker',
      section: regSection,
      department: 'Production',
      employeeId: 'CAF-' + Math.floor(100 + Math.random() * 900),
      joiningDate: todayStr,
      registrationDate: todayStr,
      whatsapp: regWhatsapp.trim(),
      accountStatus: 'Pending', // Pending admin approval!
      basicSalary: 18000,
      hourlyRate: 75.00
    };

    const res = await onRegisterUser(newUser);
    setIsSubmitting(false);

    if (res.success) {
      setRegSuccess(true);
      setUsername(newUser.username);
    } else {
      setRegError(res.error || (isBn ? 'রেজিস্ট্রেশন ব্যর্থ হয়েছে।' : 'Registration failed.'));
    }
  };

  const cardBg = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900';
  const inputBg = darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900';

  return (
    <div className={`min-h-screen flex flex-col justify-between transition-colors ${
      darkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#f8fafc] text-slate-800'
    }`}>
      {/* Top Header */}
      <header className={`border-b backdrop-blur-md px-4 sm:px-6 py-3 ${
        darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'
      }`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div onDoubleClick={onOpenAdminGate} className="flex items-center cursor-pointer select-none">
            <CompanyLogo logoUrl={companyProfile.logoUrl} size="md" variant="full" darkMode={darkMode} />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleLanguage}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                darkMode ? 'border-slate-700 bg-slate-800 text-slate-200' : 'border-slate-200 bg-slate-100 text-slate-700'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              <span className="uppercase">{language === 'en' ? 'বাংলা' : 'EN'}</span>
            </button>

            <button
              onClick={onToggleDarkMode}
              className={`p-2 rounded-lg border text-xs font-medium cursor-pointer ${
                darkMode ? 'border-slate-700 bg-slate-800 text-amber-300' : 'border-slate-200 bg-slate-100 text-slate-700'
              }`}
            >
              {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Form View */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* Left Context Column */}
          <div className="md:col-span-6 space-y-4 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
              <Shield className="w-4 h-4" />
              <span>{t.liveDbConnected}</span>
            </span>

            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              {companyProfile.name}
            </h2>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl mx-auto md:mx-0">
              {t.loginPrompt}
            </p>

            <div className="pt-2 flex flex-wrap gap-3 justify-center md:justify-start text-xs text-slate-500 font-mono">
              <span className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                🏭 {t.productionTitle}
              </span>
              <span className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                📋 {t.attendanceTitle}
              </span>
              <span className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                ⚡ {t.overtimeTitle}
              </span>
            </div>
          </div>

          {/* Right Card: Login or Register */}
          <div className="md:col-span-6">
            <div className={`border rounded-3xl p-6 sm:p-8 shadow-xl space-y-5 ${cardBg}`}>
              
              {/* Top Tabs: Login vs Register */}
              <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setError('');
                  }}
                  className={`flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition ${
                    authMode === 'login'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isBn ? 'লগইন করুন' : 'Sign In'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setError('');
                  }}
                  className={`flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition ${
                    authMode === 'register'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isBn ? 'নতুন একাউন্ট রেজিস্টার' : 'Create Account'}</span>
                </button>
              </div>

              {/* ---------------- LOGIN FORM ---------------- */}
              {authMode === 'login' && (
                <div className="space-y-4">
                  <div className="text-center border-b pb-3 border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-extrabold tracking-tight">
                      {t.loginHeader}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t.portalSubtitle}
                    </p>
                  </div>

                  {error && (
                    <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold leading-relaxed">
                      ⚠️ {error}
                    </div>
                  )}

                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-600 dark:text-slate-300">
                        {t.username} *
                      </label>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="robiul / admin"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition focus:outline-none focus:border-indigo-600 ${inputBg}`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-600 dark:text-slate-300">
                        {t.password} *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition focus:outline-none focus:border-indigo-600 pr-12 ${inputBg}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-sm transition cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? t.verifyingLiveServer : t.signInButton}
                    </button>
                  </form>



                  <div className="pt-2 text-center flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setAuthMode('register')}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      {isBn ? 'কর্মী একাউন্ট নেই? রেজিস্টার করুন' : 'Need an account? Register'}
                    </button>
                    <button
                      type="button"
                      onClick={onOpenAdminGate}
                      className="text-[11px] font-semibold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                    >
                      🛡️ {t.unlockAdmin}
                    </button>
                  </div>
                </div>
              )}

              {/* ---------------- REGISTER FORM ---------------- */}
              {authMode === 'register' && (
                <div className="space-y-4">
                  {regSuccess ? (
                    <div className="space-y-4 text-center py-4">
                      <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 mx-auto flex items-center justify-center shadow-md animate-bounce">
                        <Clock className="w-7 h-7" />
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                          {isBn ? 'রেজিস্ট্রেশন সফলভাবে সম্পন্ন হয়েছে!' : 'Registration Submitted!'}
                        </h3>
                        <p className="text-xs text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/40 p-3 rounded-2xl border border-amber-200 dark:border-amber-900 leading-relaxed">
                          {isBn 
                            ? 'আপনার অ্যাকাউন্টটি তৈরি হয়েছে এবং এটি বর্তমানে অ্যাডমিন অনুমোদনের অপেক্ষায় (Pending Approval) রয়েছে। ফ্যাক্টরি অ্যাডমিন অনুমোদন দেওয়ার পর আপনি এই ইউজারনেম ও পাসওয়ার্ড দিয়ে লগইন করতে পারবেন।'
                            : 'Your account is pending admin approval. You will be able to log in once an administrator approves your registration.'}
                        </p>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setRegSuccess(false);
                            setAuthMode('login');
                          }}
                          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition cursor-pointer"
                        >
                          {isBn ? 'লগইন পেজে যান' : 'Go to Login'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-center border-b pb-3 border-slate-200 dark:border-slate-800">
                        <h3 className="text-lg font-extrabold tracking-tight">
                          {isBn ? 'নতুন কর্মী একাউন্ট তৈরি করুন' : 'New Worker Registration'}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {isBn ? 'রেজিস্ট্রেশন সম্পন্ন হলে অ্যাডমিন অনুমোদনের পর সক্রিয় হবে' : 'Accounts are activated after admin approval'}
                        </p>
                      </div>

                      {regError && (
                        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                          ⚠️ {regError}
                        </div>
                      )}

                      <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
                        {/* Profile Photo Upload / Preview */}
                        <div className="p-3 rounded-2xl border border-dashed border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/40 dark:bg-indigo-950/20 flex items-center gap-3">
                          <div className="relative shrink-0">
                            {regPhotoUrl ? (
                              <img
                                src={regPhotoUrl}
                                alt="Preview"
                                className="w-14 h-14 rounded-xl object-cover border-2 border-indigo-500 shadow-sm"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                <Camera className="w-6 h-6" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 space-y-1">
                            <span className="font-bold block text-slate-700 dark:text-slate-300">
                              {isBn ? 'প্রোফাইল ছবি (ঐচ্ছিক)' : 'Profile Photo (Optional)'}
                            </span>
                            <div className="flex gap-1.5 flex-wrap">
                              <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*"
                                onChange={handlePhotoFileChange}
                                className="hidden"
                              />
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                              >
                                <Upload className="w-3 h-3" />
                                <span>{isBn ? 'ছবি ফাইল আপলোড' : 'Upload File'}</span>
                              </button>
                              {regPhotoUrl && (
                                <button
                                  type="button"
                                  onClick={() => setRegPhotoUrl('')}
                                  className="px-2 py-1 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-300 font-bold text-[10px] cursor-pointer"
                                >
                                  {isBn ? 'মুছুন' : 'Remove'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Full Name */}
                        <div>
                          <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                            {t.fullName} *
                          </label>
                          <input
                            type="text"
                            required
                            value={regFullName}
                            onChange={(e) => setRegFullName(e.target.value)}
                            placeholder="e.g. Robiul Awal"
                            className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-indigo-600 ${inputBg}`}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          {/* Username */}
                          <div>
                            <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                              {t.username} *
                            </label>
                            <input
                              type="text"
                              required
                              value={regUsername}
                              onChange={(e) => setRegUsername(e.target.value)}
                              placeholder="robiul24"
                              className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-indigo-600 font-mono ${inputBg}`}
                            />
                          </div>

                          {/* Password */}
                          <div>
                            <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                              {t.password} *
                            </label>
                            <div className="relative">
                              <input
                                type={regShowPassword ? 'text' : 'password'}
                                required
                                value={regPassword}
                                onChange={(e) => setRegPassword(e.target.value)}
                                placeholder="••••••••"
                                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-indigo-600 font-mono pr-8 ${inputBg}`}
                              />
                              <button
                                type="button"
                                onClick={() => setRegShowPassword(!regShowPassword)}
                                aria-label={regShowPassword ? 'Hide password' : 'Show password'}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                              >
                                {regShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          {/* Section */}
                          <div>
                            <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                              {t.section} *
                            </label>
                            <select
                              value={regSection}
                              onChange={(e) => setRegSection(e.target.value)}
                              className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-indigo-600 cursor-pointer ${inputBg}`}
                            >
                              {sections.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>

                          {/* Designation */}
                          <div>
                            <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                              {t.designation} *
                            </label>
                            <input
                              type="text"
                              required
                              value={regDesignation}
                              onChange={(e) => setRegDesignation(e.target.value)}
                              placeholder="e.g. Senior Zipper Operator"
                              className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-indigo-600 ${inputBg}`}
                            />
                          </div>
                        </div>

                        {/* WhatsApp / Phone */}
                        <div>
                          <label className="block font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-300">
                            {t.whatsappNumber}
                          </label>
                          <input
                            type="text"
                            value={regWhatsapp}
                            onChange={(e) => setRegWhatsapp(e.target.value)}
                            placeholder="+8801712..."
                            className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-indigo-600 font-mono ${inputBg}`}
                          />
                        </div>

                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <UserPlus className="w-4 h-4" />
                            <span>{isSubmitting ? (isBn ? 'জমা দেওয়া হচ্ছে...' : 'Submitting...') : (isBn ? 'রেজিস্ট্রেশন জমা দিন' : 'Submit Registration')}</span>
                          </button>
                        </div>

                        <div className="pt-1 text-center">
                          <button
                            type="button"
                            onClick={() => setAuthMode('login')}
                            className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 cursor-pointer"
                          >
                            {isBn ? 'ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন' : 'Already have an account? Sign In'}
                          </button>
                        </div>
                      </form>
                    </>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t py-4 text-xs text-center text-slate-500 ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <span onDoubleClick={onOpenAdminGate} className="cursor-default select-none">
          {companyProfile.name} · {companyProfile.address}
        </span>
      </footer>
    </div>
  );
};
