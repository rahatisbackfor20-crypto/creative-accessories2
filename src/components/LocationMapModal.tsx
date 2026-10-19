import React, { useEffect } from 'react';
import { CompanyProfile, Language } from '../types';
import { MapPin, X, ExternalLink, Navigation } from 'lucide-react';

interface LocationMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyProfile: CompanyProfile;
  language: Language;
  darkMode: boolean;
}

export const LocationMapModal: React.FC<LocationMapModalProps> = ({
  isOpen,
  onClose,
  companyProfile,
  language,
  darkMode
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const isBn = language === 'bn';

  const embedUrl = companyProfile.mapEmbedUrl || 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d471.8386017066733!2d90.38116327282027!3d23.884990661020723!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c473c76676e9%3A0x68fd27d664e0676a!2sBamnartek%2C%20Dhaka%201230!5e1!3m2!1sen!2sbd!4v1792344078026!5m2!1sen!2sbd';

  const directMapUrl = 'https://maps.google.com/?q=Bamnartek,+Dhaka+1230';

  const modalBg = darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900';

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer no-print animate-fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`border-2 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative space-y-4 cursor-default ${modalBg}`}
      >
        {/* Top colored accent stripe */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-600 via-blue-600 to-emerald-600 rounded-t-3xl" />

        {/* Modal Header */}
        <div className="flex justify-between items-start pt-1 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">
                {isBn ? 'ফ্যাক্টরি লোকেশন ও গুগল ম্যাপ' : 'Factory Location & Google Map'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <span>{companyProfile.name}</span>
                <span>·</span>
                <span>{companyProfile.address}</span>
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Embedded Google Map Iframe */}
        <div className="rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-inner bg-slate-100 dark:bg-slate-950">
          <iframe
            src={embedUrl}
            width="100%"
            height="380"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            title="Creative Accessories Factory Map"
            className="w-full h-[320px] sm:h-[380px]"
          />
        </div>

        {/* Location Info & Navigation Links */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs">
          <div className="space-y-0.5">
            <div className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isBn ? 'কারখানার স্থায়ী ঠিকানা:' : 'Factory Address:'}</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              {companyProfile.address} · {companyProfile.contactNumber}
            </p>
          </div>

          <a
            href={directMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition flex items-center gap-1.5 shrink-0"
          >
            <span>{isBn ? 'গুগল ম্যাপে নেভিগেশন' : 'Open in Google Maps'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
