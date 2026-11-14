import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, Check, GraduationCap, LockKeyhole, LogOut, ShieldCheck, Sparkles, UserRoundCheck } from 'lucide-react';
import { UserRole } from '../types';
import { supabase } from '../services/supabase/client';
import { LiveInterviewBooking } from '../features/student/LiveInterviewBooking';

interface LiveProfile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}

const roleOptions: Array<{ role: UserRole; title: string; description: string; icon: React.ElementType }> = [
  { role: 'STUDENT', title: 'Student', description: 'Book and manage your badge interview.', icon: GraduationCap },
  { role: 'INTERVIEWER', title: 'Interviewer', description: 'Manage assigned interviews and evaluations.', icon: UserRoundCheck },
  { role: 'ADMIN', title: 'Administrator', description: 'Manage the interview programme and access.', icon: BriefcaseBusiness },
];

const readError = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error && 'message' in error && typeof error.message === 'string') return error.message;
  return fallback;
};

const LiveEntry: React.FC<{ onAuthenticated: (role: UserRole) => Promise<void>; error: string | null; onOpenDemo: () => void }> = ({ onAuthenticated, error, onOpenDemo }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT');
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const selectedOption = roleOptions.find((option) => option.role === selectedRole)!;
  const SelectedRoleIcon = selectedOption.icon;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setSubmitting(true);
    setFormError(null);
    setNotice(null);

    if (mode === 'sign-up') {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      setSubmitting(false);

      if (signUpError) {
        setFormError(signUpError.message);
        return;
      }

      if (!data.session) {
        setFormError('Your account was created, but a sign-in session could not be started. Please contact your programme coordinator.');
        return;
      }

      await onAuthenticated('STUDENT');
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (signInError) {
      setFormError(signInError.message);
      return;
    }
    await onAuthenticated(selectedRole);
  };

  return (
    <main className="auth-page">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(circle_at_5%_5%,#3f3f46_0,transparent_26%),radial-gradient(circle_at_92%_100%,#27272a_0,transparent_32%)]" />
      <div className="auth-card">
        <section className="auth-intro">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-indigo-400/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-sm font-bold text-zinc-950 shadow-lg shadow-black/20">G</div>
              <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">NIAT</p><p className="mt-0.5 text-sm font-semibold tracking-tight">Panel Interview Hub</p></div>
            </div>
            <div className="mt-10 max-w-md md:mt-14">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-zinc-300"><Sparkles className="h-3.5 w-3.5 text-indigo-300" /> Secure interview operations</div>
              <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">One trusted place for every badge interview.</h1>
              <p className="mt-4 max-w-sm text-sm leading-6 text-zinc-400">Show what you know. Schedule your interview, connect with an evaluator, and take the next step in your learning journey.</p>
            </div>
            <section aria-label="Choose portal" className="mt-8 grid gap-2.5 md:mt-10">
              {roleOptions.map((option) => {
                const Icon = option.icon;
                const selected = option.role === selectedRole;
                return (
                  <button key={option.role} type="button" aria-pressed={selected} onClick={() => { setSelectedRole(option.role); setMode(option.role === 'STUDENT' ? mode : 'sign-in'); setFormError(null); setNotice(null); }} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${selected ? 'border-white bg-white text-zinc-950 shadow-lg shadow-black/10' : 'border-white/10 bg-white/[0.03] text-white hover:border-white/30 hover:bg-white/[0.07]'}`}>
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${selected ? 'bg-zinc-950 text-white' : 'bg-white/10 text-zinc-200'}`}><Icon className="h-5 w-5" /></span>
                    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{option.title}</span><span className={`mt-0.5 block truncate text-[11px] ${selected ? 'text-zinc-500' : 'text-zinc-400'}`}>{option.description}</span></span>
                    {selected && <Check className="h-4 w-4 shrink-0 text-emerald-600" />}
                  </button>
                );
              })}
            </section>
          </div>
          <div className="relative mt-8 flex items-center gap-2 text-[11px] leading-5 text-zinc-400 md:mt-10"><ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" /> NIAT Academic Integrity</div>
        </section>

        <section className="auth-form-panel">
          <form onSubmit={handleSubmit} className="mx-auto w-full max-w-sm">
            <div className="mb-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-800 shadow-sm"><SelectedRoleIcon className="h-5 w-5" /></div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">{selectedOption.title} portal</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">{mode === 'sign-up' ? 'Create your account' : 'Welcome back'}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{mode === 'sign-up' ? 'Create a student account with any email address.' : 'Sign in with the email address linked to this portal.'}</p>
            </div>
            <div className="space-y-4">
              {mode === 'sign-up' && <label className="block text-xs font-semibold text-zinc-700">Full name<input type="text" required autoComplete="name" placeholder="Your full name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-4 focus:ring-zinc-200/60" /></label>}
              <label className="block text-xs font-semibold text-zinc-700">Email address<input type="email" required autoComplete="email" placeholder="name@example.com" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-4 focus:ring-zinc-200/60" /></label>
              <label className="block text-xs font-semibold text-zinc-700">Password<input type="password" required minLength={8} autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'} placeholder={mode === 'sign-up' ? 'At least 8 characters' : 'Enter your password'} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-4 focus:ring-zinc-200/60" /></label>
            </div>
            {(formError || error) && <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-5 text-rose-700">{formError || error}</p>}
            {notice && <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs leading-5 text-emerald-800">{notice}</p>}
            <button type="submit" disabled={submitting} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-zinc-950/15 transition hover:-translate-y-0.5 hover:bg-zinc-800 disabled:translate-y-0 disabled:opacity-60"><LockKeyhole className="h-4 w-4" />{submitting ? (mode === 'sign-up' ? 'Creating account...' : 'Signing in...') : (mode === 'sign-up' ? 'Create student account' : `Continue as ${selectedOption.title}`)}<ArrowRight className="h-4 w-4" /></button>
            {selectedRole === 'STUDENT' ? <button type="button" onClick={() => { setMode(mode === 'sign-up' ? 'sign-in' : 'sign-up'); setFormError(null); setNotice(null); }} className="mt-4 w-full text-center text-xs font-medium text-zinc-600 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-950">{mode === 'sign-up' ? 'Already have an account? Sign in' : 'New student? Create an account'}</button> : <p className="mt-4 text-center text-[11px] leading-5 text-zinc-500">Interviewer and administrator accounts are created by programme administrators.</p>}
            <p className="mt-4 text-center text-[11px] leading-5 text-zinc-500">Need access? Contact your programme coordinator.</p>
            <button type="button" onClick={onOpenDemo} className="mt-3 w-full text-center text-xs font-semibold text-indigo-700 underline decoration-indigo-200 underline-offset-4 hover:text-indigo-950">Open the assignment demo with all roles and scenarios</button>
          </form>
        </section>
      </div>
    </main>
  );
};

const LiveShell: React.FC<{ profile: LiveProfile; onSignOut: () => Promise<void>; onOpenDemo: () => void }> = ({ profile, onSignOut, onOpenDemo }) => {
  const navigate = useNavigate();
  const handleSignOut = async () => { await onSignOut(); navigate('/', { replace: true }); };
  return (
    <div className="Panel-workspace live-workspace min-h-screen text-zinc-950">
      <header className="border-b border-zinc-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6"><div><p className="text-sm font-semibold">Panel Interview Hub</p><p className="text-[11px] text-zinc-500">NIAT · {profile.role}</p></div><div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-xs font-medium">{profile.fullName}</p><p className="text-[11px] text-zinc-500">{profile.email}</p></div><button type="button" onClick={handleSignOut} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"><LogOut className="h-3.5 w-3.5" />Sign out</button></div></div></header>
      <main className="workspace-content mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
        <div className="mb-4 flex justify-end"><button type="button" onClick={onOpenDemo} className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">Open assignment demo</button></div>
        <div className="workspace-welcome"><span className="workspace-eyebrow">Your workspace</span><h1>Hello, {profile.fullName.split(' ')[0]}</h1><p>{profile.role === 'STUDENT' ? 'Take the next step toward your track badge.' : 'Your interview programme, in one place.'}</p></div>
        {profile.role === 'STUDENT' ? <LiveInterviewBooking profileId={profile.id} /> : <RoleWorkspace role={profile.role} />}
      </main>
    </div>
  );
};

const RoleWorkspace: React.FC<{ role: Exclude<UserRole, 'STUDENT'> }> = ({ role }) => (
  <section className="workspace-empty">
    <ShieldCheck aria-hidden="true" />
    <h2>{role === 'ADMIN' ? 'Administrative workspace' : 'Interviewer workspace'}</h2>
    <p>Your account is ready. This live workspace is still being connected to the programme tools.</p>
    <p>Schedules and operations are not available here yet. Contact your programme coordinator for assistance.</p>
  </section>
);

export const LiveApp: React.FC = () => {
  const [profile, setProfile] = useState<LiveProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadProfile = useCallback(async (expectedRole?: UserRole) => {
    if (!supabase) return;
    setLoading(true); setError(null);
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) { setProfile(null); setLoading(false); return; }
    const { data, error: profileError } = await supabase.from('users').select('id, full_name, email, role').eq('auth_user_id', authData.user.id).maybeSingle();
    if (profileError || !data) { await supabase.auth.signOut(); setProfile(null); setError(profileError ? readError(profileError, 'Your account profile could not be loaded.') : 'This account has not been provisioned for Panel.'); setLoading(false); return; }
    const resolvedProfile: LiveProfile = { id: data.id, fullName: data.full_name, email: data.email, role: data.role as UserRole };
    if (expectedRole && resolvedProfile.role !== expectedRole) { await supabase.auth.signOut(); setProfile(null); setError(`This account is assigned the ${resolvedProfile.role.toLowerCase()} role. Select that portal to sign in.`); setLoading(false); return; }
    setProfile(resolvedProfile); setLoading(false);
  }, []);

  useEffect(() => {
    void loadProfile();
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange(() => { void loadProfile(); });
    return () => data.subscription.unsubscribe();
  }, [loadProfile]);

  if (loading) return <main className="grid min-h-screen place-items-center bg-zinc-950 text-sm text-zinc-300">Loading secure access...</main>;
  const openAssignmentDemo = () => {
    localStorage.setItem('Panel_assignment_demo_mode', 'true');
    window.location.reload();
  };
  return profile ? <BrowserRouter><Routes><Route path="*" element={<LiveShell profile={profile} onOpenDemo={openAssignmentDemo} onSignOut={async () => { await supabase?.auth.signOut(); setProfile(null); }} />} /></Routes></BrowserRouter> : <LiveEntry onAuthenticated={loadProfile} error={error} onOpenDemo={openAssignmentDemo} />;
};
