import React from 'react';
import { SyncStatus, User, Language } from '../types';
import { translations } from '../i18n';
import { formatJoiningDate } from '../storage';
import { RefreshCw, CheckCircle2, AlertTriangle, Calendar, UserCheck } from 'lucide-react';

interface StatusStripProps {
  syncStatus: SyncStatus;
  currentUser: User;
  language: Language;
  darkMode: boolean;
}

export const StatusStrip: React.FC<StatusStripProps> = ({
  syncStatus,
  currentUser,
  language,
  darkMode
}) => {
  const t = translations[language];
  const isHiddenAdmin = currentUser.accountType === 'hosting' || currentUser.accountType === 'admin';

  return (
    <div className={`no-print border-b text-xs transition-colors shadow-2xs ${
      darkMode ? 'bg-slate-800/95 border-slate-700 text-slate-100' : 'bg-slate-100 border-slate-200 text-slate-800'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3">
        {/* Sync telemetry */}
        <div className="flex items-center gap-2">
          {syncStatus === 'online' && (
            <span className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t.liveDbConnected}</span>
            </span>
          )}
          {syncStatus === 'syncing' && (
            <span className="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-300">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{t.syncing}</span>
            </span>
          )}
          {syncStatus === 'offline' && (
            <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
              <span>{t.offlineLocal}</span>
            </span>
          )}
          {syncStatus === 'error' && (
            <span className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{t.checkFirebaseRules}</span>
            </span>
          )}
        </div>

        {/* User Identity & Joining Date context */}
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="font-extrabold text-slate-900 dark:text-white">{currentUser.fullName}</span>
            <span className="text-slate-400 dark:text-slate-400 font-bold">·</span>
            <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-200">{currentUser.employeeId}</span>
          </span>

          {!isHiddenAdmin && currentUser.joiningDate && (
            <>
              <span className="text-slate-400 dark:text-slate-400 font-bold">·</span>
              <span className="flex items-center gap-1 font-mono text-[11px] text-emerald-700 dark:text-emerald-300 font-bold">
                <Calendar className="w-3.5 h-3.5" />
                <span>{t.joiningDate}: {formatJoiningDate(currentUser.joiningDate)}</span>
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
