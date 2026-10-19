import React, { useEffect, useRef, useState } from 'react';
import { acceptInvite, AuthError, getUser, handleAuthCallback, login, logout, MissingIdentityError, onAuthChange, requestPasswordRecovery, updateUser, type User as IdentityUser } from '@netlify/identity';
import { LockKeyhole, Mail, ArrowRight, LoaderCircle } from 'lucide-react';
import App from './App';
import { CompanyLogo } from './components/CompanyLogo';
import { canEnterPortal, portalUser } from './identityAccess';

type Mode = 'login' | 'forgot' | 'reset' | 'invite';

export default function IdentityPortal() {
  const [user, setUser] = useState<IdentityUser | null>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const invite = useRef<string | undefined>(undefined);
  const callbackStarted = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthChange((event, next) => {
      setUser(next);
      if (event === 'recovery') setMode('reset');
    });
    if (!callbackStarted.current) {
      callbackStarted.current = true;
      void (async () => {
        try {
          const result = await handleAuthCallback();
          if (result?.type === 'invite') {
            invite.current = result.token;
            setMode('invite');
          } else if (result?.type === 'recovery') {
            setMode('reset');
            setUser(result.user);
          } else {
            setUser(result?.user || await getUser());
          }
        } catch {
          setError('লিংকটি অকার্যকর বা মেয়াদ শেষ। নতুন আমন্ত্রণ বা পাসওয়ার্ড রিসেট লিংক নিন।');
        } finally { setReady(true); }
      })();
    }
    const syncSession = () => { void getUser().then(setUser); };
    window.addEventListener('focus', syncSession);
    return () => { unsubscribe(); window.removeEventListener('focus', syncSession); };
  }, []);

  async function signOut() {
    setBusy(true);
    try {
      await logout();
      setUser(null);
      setMode('login');
      invite.current = undefined;
      setPassword(''); setConfirmation('');
      for (const key of ['caf_active_user', 'caf_session_user_id']) {
        localStorage.removeItem(key); sessionStorage.removeItem(key);
      }
    } catch { setError('লগআউট সম্পন্ন হয়নি। আবার চেষ্টা করুন।'); }
    finally { setBusy(false); }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setNotice('');
    if ((mode === 'reset' || mode === 'invite') && password !== confirmation) {
      setError('দুটি পাসওয়ার্ড মেলেনি।'); return;
    }
    setBusy(true);
    try {
      if (mode === 'forgot') {
        await requestPasswordRecovery(email.trim());
        setNotice('ইমেইলটি নিবন্ধিত থাকলে পাসওয়ার্ড রিসেটের লিংক পাবেন। ইনবক্স ও স্প্যাম দেখুন।');
      } else if (mode === 'invite') {
        if (!invite.current) throw new Error('Missing invitation');
        const next = await acceptInvite(invite.current, password);
        invite.current = undefined; setUser(next); setMode('login');
      } else if (mode === 'reset') {
        await updateUser({ password });
        setUser(await getUser()); setMode('login');
      } else {
        setUser(await login(email.trim(), password));
      }
      setPassword(''); setConfirmation('');
    } catch (err) {
      if (err instanceof MissingIdentityError) {
        setError('ইমেইল লগইন এখনও সক্রিয় হয়নি। সাইট প্রকাশের পর আবার চেষ্টা করুন।');
      } else if (err instanceof AuthError && err.status === 401) {
        setError('ইমেইল বা পাসওয়ার্ড সঠিক নয়, অথবা লিংকের মেয়াদ শেষ।');
      } else {
        setError('অনুরোধ সম্পন্ন হয়নি। ইমেইল নিশ্চিত করুন, আমন্ত্রণ বা রিসেট লিংকের মেয়াদ দেখুন এবং আবার চেষ্টা করুন।');
      }
    } finally { setBusy(false); }
  }

  if (!ready) return <main className="min-h-screen bg-slate-50 grid place-items-center"><p role="status" className="flex gap-3 text-slate-600"><LoaderCircle className="animate-spin" />লগইন পরীক্ষা হচ্ছে…</p></main>;
  const allowed = canEnterPortal(user);
  if (user && allowed && mode !== 'reset' && mode !== 'invite') {
    return <App key={user.id} identityUser={portalUser(user)} onIdentityLogout={signOut} />;
  }
  const settingPassword = mode === 'reset' || mode === 'invite';
  const awaitingAccess = user && !allowed && !settingPassword;
  const title = awaitingAccess ? 'অ্যাকাউন্টের অনুমোদন প্রয়োজন' : mode === 'forgot' ? 'পাসওয়ার্ড পুনরুদ্ধার' : settingPassword ? 'নিজের পাসওয়ার্ড সেট করুন' : 'ইমেইল দিয়ে প্রবেশ করুন';
  const input = 'w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500';
  return <main className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
    <header className="border-b border-slate-200 bg-white px-6 py-5"><div className="max-w-6xl mx-auto"><CompanyLogo variant="full" /></div></header>
    <div className="flex-1 max-w-5xl w-full mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-center p-6 py-12">
      <section className="space-y-6">
        <span className="inline-flex items-center gap-2 text-indigo-700 text-sm font-semibold"><LockKeyhole size={18} /> Creative Accessories · কর্মী পোর্টাল</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">আপনার কাজের তথ্য,<br />আপনার অ্যাকাউন্টে।</h1>
        <p className="text-slate-600 leading-7">ডিফল্ট ইউজারনেম বা পাসওয়ার্ডের প্রয়োজন নেই। আমন্ত্রণের ইমেইল খুলে নিজের পাসওয়ার্ড সেট করুন। এরপর সেই ইমেইল ও পাসওয়ার্ড দিয়ে প্রবেশ করুন।</p>
        <details className="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-7">
          <summary className="cursor-pointer font-semibold">প্রথম অ্যাডমিনের অ্যাকাউন্ট চালু করার নিয়ম</summary>
          <ol className="list-decimal pl-5 pt-3 space-y-2"><li>Netlify ড্যাশবোর্ডে এই প্রকল্পের Identity খুলুন এবং Invite users থেকে নিজের ইমেইলে আমন্ত্রণ পাঠান।</li><li>ইমেইলের লিংক খুলে এখানে নিজের পাসওয়ার্ড সেট করুন।</li><li>Identity-এর ব্যবহারকারী তালিকায় নিজের অ্যাকাউন্ট খুলে Roles-এ <code>admin</code> যোগ করে সংরক্ষণ করুন। তারপর আবার লগইন করুন।</li></ol>
        </details>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <Mail className="text-indigo-600 mb-5" size={28} />
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
        {notice && <p role="status" className="mb-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}
        {awaitingAccess ? <div className="space-y-5"><p className="text-sm leading-7 text-slate-600">ইমেইল নিশ্চিত করে অ্যাডমিনের অনুমোদন নিন। অ্যাডমিন হলে উপরের নির্দেশনা অনুযায়ী ভূমিকা সেট করে আবার লগইন করুন।</p><button disabled={busy} onClick={() => void signOut()} className="text-indigo-700 underline disabled:opacity-50">লগআউট করে আবার প্রবেশ করুন</button></div> : <form onSubmit={submit} className="space-y-5">
          {!settingPassword && <label className="block text-sm font-semibold">ইমেইল<input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} className={`${input} mt-2`} disabled={busy} /></label>}
          {mode !== 'forgot' && <label className="block text-sm font-semibold">{settingPassword ? 'নতুন পাসওয়ার্ড (কমপক্ষে ১২ অক্ষর)' : 'পাসওয়ার্ড'}<input type="password" autoComplete={settingPassword ? 'new-password' : 'current-password'} minLength={settingPassword ? 12 : undefined} required value={password} onChange={e => setPassword(e.target.value)} className={`${input} mt-2`} disabled={busy} /></label>}
          {settingPassword && <label className="block text-sm font-semibold">পাসওয়ার্ড আবার লিখুন<input type="password" autoComplete="new-password" minLength={12} required value={confirmation} onChange={e => setConfirmation(e.target.value)} className={`${input} mt-2`} disabled={busy} /></label>}
          <button disabled={busy} className="w-full flex items-center justify-center gap-3 bg-indigo-700 text-white font-semibold rounded-xl px-5 py-3 hover:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50">{busy ? 'অপেক্ষা করুন…' : mode === 'forgot' ? 'রিসেট লিংক পাঠান' : settingPassword ? 'পাসওয়ার্ড সংরক্ষণ করুন' : 'প্রবেশ করুন'}<ArrowRight size={18} /></button>
          {!settingPassword && <button type="button" disabled={busy} onClick={() => { setMode(mode === 'forgot' ? 'login' : 'forgot'); setError(''); setNotice(''); setPassword(''); }} className="text-sm font-semibold text-indigo-700 hover:underline disabled:opacity-50">{mode === 'forgot' ? 'লগইনে ফিরে যান' : 'পাসওয়ার্ড ভুলে গেছেন?'}</button>}
          {settingPassword && <button type="button" disabled={busy} onClick={() => void signOut()} className="text-sm text-slate-600 underline">বাতিল করে লগইনে ফিরুন</button>}
        </form>}
      </section>
    </div>
  </main>;
}
