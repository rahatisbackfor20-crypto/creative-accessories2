import React, { useState, useRef, useEffect } from 'react';
import { User, CompanyProfile, Language } from '../types';
import { translations } from '../i18n';
import { formatJoiningDate, getInitials } from '../storage';
import { CompanyLogo } from './CompanyLogo';
import { 
  Camera, 
  Upload, 
  Check, 
  Clock, 
  AlertCircle, 
  X, 
  User as UserIcon, 
  Phone, 
  Briefcase, 
  Layers, 
  Calendar, 
  DollarSign,
  ShieldCheck,
  Eye,
  EyeOff,
  Key
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen?: boolean;
  user: User | null;
  companyProfile: CompanyProfile;
  language: Language;
  darkMode: boolean;
  onClose: () => void;
  onUpdateUser: (updatedUser: User) => Promise<void> | void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen = true,
  user,
  companyProfile,
  language,
  darkMode,
  onClose,
  onUpdateUser
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;
  const t = translations[language];
  const isBn = language === 'bn';

  const isAdminOrHosting = user.accountType === 'hosting' || user.accountType === 'admin';

  const [previewPhoto, setPreviewPhoto] = useState<string>(user.photoUrl || '');
  const [inputUrl, setInputUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password visibility & editing state
  const [passwordValue, setPasswordValue] = useState<string>(user.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordSavedMsg, setPasswordSavedMsg] = useState('');

  useEffect(() => {
    if (user) {
      setPreviewPhoto(user.photoUrl || '');
      setPasswordValue(user.password || '');
      setShowPassword(false);
    }
  }, [user]);

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValue.trim()) {
      setErrorMsg(isBn ? 'পাসওয়ার্ড খালি রাখা যাবে না।' : 'Password cannot be empty.');
      return;
    }
    setIsSavingPassword(true);
    setErrorMsg('');
    try {
      await onUpdateUser({
        ...user,
        password: passwordValue.trim()
      });
      setPasswordSavedMsg(isBn ? 'পাসওয়ার্ড সফলভাবে সংরক্ষিত হয়েছে!' : 'Password updated successfully!');
      setTimeout(() => setPasswordSavedMsg(''), 3500);
    } catch {
      setErrorMsg(isBn ? 'পাসওয়ার্ড সংরক্ষণ ব্যর্থ হয়েছে।' : 'Failed to update password.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(isBn ? 'ফাইলের আকার ৫MB এর কম হতে হবে।' : 'File size must be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewPhoto(result);
      setInputUrl('');
      setErrorMsg('');
    };
    reader.onerror = () => {
      setErrorMsg(isBn ? 'ছবি লোড করতে ব্যর্থ হয়েছে।' : 'Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!inputUrl.trim()) return;
    setPreviewPhoto(inputUrl.trim());
    setInputUrl('');
    setErrorMsg('');
  };

  const handleSubmitPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewPhoto || previewPhoto === user.photoUrl) {
      setErrorMsg(isBn ? 'অনুগ্রহ করে নতুন কোনো ছবি নির্বাচন করুন।' : 'Please select a new photo.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      if (isAdminOrHosting) {
        // Admin updates directly
        await onUpdateUser({
          ...user,
          photoUrl: previewPhoto,
          pendingPhotoUrl: undefined
        });
        setSuccessMsg(isBn ? 'আপনার প্রোফাইল ছবি সরাসরি আপডেট হয়েছে!' : 'Profile photo updated directly!');
      } else {
        // Regular worker submits for admin approval
        await onUpdateUser({
          ...user,
          pendingPhotoUrl: previewPhoto
        });
        setSuccessMsg(
          isBn 
            ? 'আপনার নতুন ছবিটি সফলভাবে জমা হয়েছে এবং অ্যাডমিন অনুমোদনের (Pending Approval) অপেক্ষায় রয়েছে।'
            : 'New photo submitted and awaiting admin approval.'
        );
      }
      setTimeout(() => {
        setSuccessMsg('');
      }, 4000);
    } catch {
      setErrorMsg(isBn ? 'সংরক্ষণ ব্যর্থ হয়েছে, পুনরায় চেষ্টা করুন।' : 'Failed to save, please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardBg = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const innerBg = darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200';
  const inputBg = darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900';

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`border rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 cursor-default ${cardBg}`}
      >
        
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight leading-tight">
                {isBn ? 'আমার প্রোফাইল ও আইডি কার্ড' : 'My Profile & ID Card'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {companyProfile.name}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Pending Approval Notice if Worker has a pending photo */}
        {user.pendingPhotoUrl && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <Clock className="w-4 h-4 text-amber-600 animate-spin" />
              <span>{isBn ? '⏳ নতুন প্রোফাইল ছবি অনুমোদনের অপেক্ষায় (Pending Approval)' : '⏳ New Photo Pending Admin Approval'}</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
              {isBn 
                ? 'আপনি সম্প্রতি একটি নতুন প্রোফাইল ছবি জমা দিয়েছেন। অ্যাডমিন প্যানেল থেকে অনুমোদন করার সাথে সাথে এটি আপনার মূল প্রোফাইলে সক্রিয় হবে।'
                : 'You have submitted a new profile photo. It will become your active avatar once reviewed and approved by an admin.'}
            </p>
            <div className="flex items-center gap-3 pt-1">
              <div className="text-[10px] font-bold text-slate-500">অনুরোধকৃত ছবি:</div>
              <img 
                src={user.pendingPhotoUrl} 
                alt="Pending" 
                className="w-10 h-10 rounded-xl object-cover border-2 border-amber-400 shadow-xs" 
              />
            </div>
          </div>
        )}

        {/* User Card & Photo Upload Section */}
        <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${innerBg}`}>
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            {/* Avatar Preview */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-800 shadow-md bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center">
                {previewPhoto ? (
                  <img 
                    src={previewPhoto} 
                    alt={user.fullName} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span className="text-3xl font-black text-indigo-600 tracking-tight">
                    {getInitials(user.fullName)}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md cursor-pointer transition"
                title={isBn ? 'ছবি পরিবর্তন করুন' : 'Change Photo'}
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Basic Info */}
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h4 className="font-extrabold text-lg leading-tight">{user.fullName}</h4>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                  {user.employeeId}
                </span>
              </div>
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {user.designation}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {user.section} Section · {user.department || 'Production'}
              </p>
              <div className="pt-1">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  user.accountStatus === 'Active' 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}>
                  <ShieldCheck className="w-3 h-3" />
                  <span>{user.accountStatus === 'Active' ? (isBn ? 'সক্রিয় অ্যাকাউন্ট (Active)' : 'Active Account') : (isBn ? 'অপেক্ষমাণ (Pending)' : 'Pending')}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Photo Upload Controls */}
          <form onSubmit={handleSubmitPhoto} className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              {isBn ? 'নতুন প্রোফাইল ছবি যুক্ত করুন / আপলোড করুন:' : 'Upload or Change Profile Photo:'}
            </span>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2.5 px-3 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 hover:bg-indigo-100/60 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <Upload className="w-4 h-4" />
                <span>{isBn ? 'ডিভাইস থেকে ছবি আপলোড করুন' : 'Upload from Device (File)'}</span>
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="বা ছবির সরাসরি ওয়েব লিঙ্ক পেস্ট করুন (https://...)"
                className={`flex-1 px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-indigo-600 font-mono ${inputBg}`}
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                disabled={!inputUrl.trim()}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs disabled:opacity-40 cursor-pointer transition"
              >
                {isBn ? 'লিঙ্ক নিন' : 'Use URL'}
              </button>
            </div>

            {/* Submit Photo Button */}
            {previewPhoto && previewPhoto !== user.photoUrl && (
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-sm transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {isAdminOrHosting 
                      ? (isBn ? 'ছবি সরাসরি সেভ ও আপডেট করুন' : 'Update Photo Directly') 
                      : (isBn ? 'ছবি অ্যাডমিন অনুমোদনের জন্য পাঠান' : 'Submit Photo for Admin Approval')}
                  </span>
                </button>
                {!isAdminOrHosting && (
                  <p className="text-[10px] text-center text-slate-500 mt-1">
                    {isBn ? '* কর্মীদের ছবি পরিবর্তনের ক্ষেত্রে অ্যাডমিন অনুমোদন প্রয়োজন।' : '* Profile photo updates for workers require admin approval.'}
                  </p>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className={`p-3 rounded-2xl border ${innerBg}`}>
            <div className="flex items-center gap-1.5 text-slate-400 font-bold mb-1">
              <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
              <span>{isBn ? 'পদবী ও সেকশন' : 'Role & Section'}</span>
            </div>
            <div className="font-extrabold text-sm">{user.designation}</div>
            <div className="text-[11px] text-slate-500">{user.section}</div>
          </div>

          <div className={`p-3 rounded-2xl border ${innerBg}`}>
            <div className="flex items-center gap-1.5 text-slate-400 font-bold mb-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isBn ? 'যোগদানের তারিখ' : 'Joining Date'}</span>
            </div>
            <div className="font-extrabold text-sm font-mono">{formatJoiningDate(user.joiningDate)}</div>
            <div className="text-[11px] text-slate-500 font-mono">({user.joiningDate})</div>
          </div>

          <div className={`p-3 rounded-2xl border ${innerBg}`}>
            <div className="flex items-center gap-1.5 text-slate-400 font-bold mb-1">
              <DollarSign className="w-3.5 h-3.5 text-indigo-500" />
              <span>{isBn ? 'মূল বেতন ও ওভারটাইম রেট' : 'Salary & OT'}</span>
            </div>
            <div className="font-extrabold text-sm font-mono text-emerald-600 dark:text-emerald-400">
              ৳ {Number(user.basicSalary || 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">OT: ৳{Number(user.hourlyRate || 0).toFixed(2)}/hr</div>
          </div>

          <div className={`p-3 rounded-2xl border ${innerBg}`}>
            <div className="flex items-center gap-1.5 text-slate-400 font-bold mb-1">
              <Phone className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isBn ? 'হোয়াটসঅ্যাপ / ফোন' : 'WhatsApp'}</span>
            </div>
            <div className="font-extrabold text-sm font-mono">{user.whatsapp || 'N/A'}</div>
            <div className="text-[11px] text-slate-500 font-mono">User: {user.username}</div>
          </div>
        </div>

        {/* Password & Security Section with Eye Toggle Button */}
        <div className={`p-4 rounded-2xl border space-y-2.5 ${innerBg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold text-xs">
              <Key className="w-4 h-4 text-indigo-500" />
              <span>{isBn ? 'লগইন পাসওয়ার্ড ও নিরাপত্তা' : 'Login Password & Security'}</span>
            </div>
            {passwordSavedMsg && (
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>{passwordSavedMsg}</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSavePassword} className="space-y-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                {isBn ? 'লগইন পাসওয়ার্ড (দৃশ্যমান করতে চোখের আইকনে ক্লিক করুন):' : 'Login Password (click eye icon to toggle visibility):'}
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordValue}
                    onChange={(e) => setPasswordValue(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-indigo-600 font-mono pr-10 ${inputBg}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordValue !== (user.password || '') && (
                  <button
                    type="submit"
                    disabled={isSavingPassword || !passwordValue.trim()}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {isSavingPassword ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (isBn ? 'পাসওয়ার্ড সংরক্ষণ' : 'Save Password')}
                  </button>
                )}
              </div>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {isBn 
                ? 'পাসওয়ার্ড দেখতে বা লুকাতে চোখের আইকনে ক্লিক করুন। প্রয়োজন অনুযায়ী পরিবর্তন করে সংরক্ষণ করতে পারেন।' 
                : 'Click the eye icon to view or hide the password. Edit and save if you wish to update it.'}
            </p>
          </form>
        </div>

        {/* Close Button */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs cursor-pointer shadow-xs transition"
          >
            {isBn ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
