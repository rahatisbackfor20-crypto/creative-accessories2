import React, { useState } from 'react';
import { User, Language } from '../types';
import { formatJoiningDate, getInitials } from '../storage';
import { translations } from '../i18n';
import { Calendar } from 'lucide-react';

interface UserProfileBadgeProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  showSection?: boolean;
  showJoiningDate?: boolean;
  darkMode?: boolean;
  language?: Language;
}

export const UserProfileBadge: React.FC<UserProfileBadgeProps> = ({
  user,
  size = 'md',
  showSection = true,
  showJoiningDate = true,
  darkMode = false,
  language = 'en'
}) => {
  const [imgErr, setImgErr] = useState(false);
  const t = translations[language];

  const designation = user.accountType === 'md' ? 'Managing Director (MD)' : (user.designation || 'Factory Worker');
  const sectionText = user.section ? (user.section.toLowerCase().includes('section') ? user.section : `${user.section} Section`) : '';

  const avatarSize = size === 'lg' ? 'w-12 h-12 text-base' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-xs';

  return (
    <div className="flex items-center gap-3">
      <div className="relative shrink-0">
        {user.photoUrl && !imgErr ? (
          <img
            src={user.photoUrl}
            alt={user.fullName}
            referrerPolicy="no-referrer"
            onError={() => setImgErr(true)}
            className={`${avatarSize} rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs`}
          />
        ) : (
          <div className={`${avatarSize} rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center shadow-xs select-none tracking-tight`}>
            {getInitials(user.fullName)}
          </div>
        )}
      </div>

      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-xs font-bold leading-tight truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            {user.fullName}
          </span>
          <span className="text-[11px] font-mono text-slate-400">({user.employeeId})</span>
        </div>
        
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
          <span className="font-medium text-indigo-600 dark:text-indigo-400">{designation}</span>
          {showSection && sectionText && (
            <>
              <span aria-hidden="true">·</span>
              <span>{sectionText}</span>
            </>
          )}
        </div>

        {showJoiningDate && user.joiningDate && (
          <div className="flex items-center gap-1 mt-0.5 text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
            <Calendar className="w-3 h-3 shrink-0" />
            <span>{t.joiningDate}: {formatJoiningDate(user.joiningDate)} ({user.joiningDate})</span>
          </div>
        )}
      </div>
    </div>
  );
};
