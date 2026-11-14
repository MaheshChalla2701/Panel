import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, LogIn, ShieldCheck, User } from 'lucide-react';
import { useToast } from '../../app/providers/ToastContext';
import { isSupabaseConfigured, supabase } from '../../services/supabase/client';

type LiveSlotStatus = 'AVAILABLE' | 'RESERVED' | 'BOOKED' | 'BLOCKED';

interface LiveSlot {
  id: string;
  interviewerId: string;
  interviewerName: string;
  startAt: string;
  endAt: string;
  status: LiveSlotStatus;
}

interface LiveJourney {
  id: string;
  eligibilityStatus: string;
  badgeStatus: string;
  currentAttemptNumber: number;
  badgeName: string;
  trackName: string;
}

const INDIA_TIME_ZONE = 'Asia/Kolkata';

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: INDIA_TIME_ZONE,
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

const timeFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: INDIA_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

const getIndiaDateKey = (value: string) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: INDIA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
};

const readError = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return fallback;
};

const LiveSignIn: React.FC<{ onSignedIn: () => Promise<void> }> = ({ onSignedIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;

    setSubmitting(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    await onSignedIn();
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl border border-zinc-200/80 p-6 shadow-xs space-y-5">
      <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-900 flex items-center justify-center">
        <LogIn className="w-5 h-5" />
      </div>
      <div>
        <h1 className="text-lg font-semibold text-zinc-950">Sign in to book a live interview</h1>
        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
          Booking is tied to your verified NIAT account so availability stays synchronized for every candidate.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-xs font-medium text-zinc-700">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </label>
        <label className="block text-xs font-medium text-zinc-700">
          Password
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </label>
        {error && <p className="text-xs text-rose-700">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
};

export const LiveInterviewBooking: React.FC<{ profileId?: string }> = ({ profileId }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [journey, setJourney] = useState<LiveJourney | null>(null);
  const [slots, setSlots] = useState<LiveSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [confirmedSlot, setConfirmedSlot] = useState<LiveSlot | null>(null);

  const loadBookingData = useCallback(async () => {
    if (!supabase) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      setError(authError.message);
      setIsLoading(false);
      return;
    }

    if (!authData.user) {
      setIsAuthenticated(false);
      setJourney(null);
      setSlots([]);
      setIsLoading(false);
      return;
    }

    setIsAuthenticated(true);
    let resolvedProfileId = profileId;
    if (!resolvedProfileId) {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authData.user.id)
        .maybeSingle();

      if (profileError || !profile) {
        setError(readError(profileError, 'Could not load your Panel profile.'));
        setIsLoading(false);
        return;
      }
      resolvedProfileId = profile.id;
    }

    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', resolvedProfileId)
      .maybeSingle();

    if (studentError) {
      setError(readError(studentError, 'Could not load your student profile.'));
      setIsLoading(false);
      return;
    }

    if (!student) {
      setError('Your student profile is still being prepared. Please try again in a moment.');
      setIsLoading(false);
      return;
    }

    const [{ data: journeyRows, error: journeyError }, { data: slotRows, error: slotsError }] = await Promise.all([
      supabase
        .from('student_badge_journeys')
        .select('id, eligibility_status, badge_status, current_attempt_number, badge:badges(name, track:tracks(name))')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false })
        .limit(1),
      supabase
        .from('booking_slots')
        .select('id, interviewer_id, interviewer_name, start_at, end_at, status')
        .gte('start_at', new Date().toISOString())
        .order('start_at', { ascending: true }),
    ]);

    if (journeyError || slotsError) {
      setError(readError(journeyError || slotsError, 'Could not load live booking data.'));
      setIsLoading(false);
      return;
    }

    const firstJourney = journeyRows?.[0];
    if (!firstJourney) {
      setError('No badge journey is available for your account.');
      setIsLoading(false);
      return;
    }

    const badge = (Array.isArray(firstJourney.badge) ? firstJourney.badge[0] : firstJourney.badge) as {
      name?: string;
      track?: { name?: string } | Array<{ name?: string }>;
    } | null;
    const trackSource = badge?.track;
    const track = (Array.isArray(trackSource) ? trackSource[0] : trackSource) as { name?: string } | undefined;
    setJourney({
      id: firstJourney.id,
      eligibilityStatus: firstJourney.eligibility_status,
      badgeStatus: firstJourney.badge_status,
      currentAttemptNumber: firstJourney.current_attempt_number,
      badgeName: badge?.name || 'Track badge',
      trackName: track?.name || 'NIAT',
    });

    const liveSlots = (slotRows || []).map((slot) => ({
      id: slot.id,
      interviewerId: slot.interviewer_id,
      interviewerName: slot.interviewer_name,
      startAt: slot.start_at,
      endAt: slot.end_at,
      status: slot.status as LiveSlotStatus,
    }));
    setSlots(liveSlots);
    setSelectedDate((current) => current && liveSlots.some((slot) => getIndiaDateKey(slot.startAt) === current)
      ? current
      : liveSlots[0] ? getIndiaDateKey(liveSlots[0].startAt) : null);
    setSelectedSlotId((current) => liveSlots.some((slot) => slot.id === current && slot.status === 'AVAILABLE') ? current : null);
    setIsLoading(false);
  }, [profileId]);

  useEffect(() => {
    void loadBookingData();
  }, [loadBookingData]);

  useEffect(() => {
    const client = supabase;
    if (!client || !isAuthenticated) return;

    const channel = client
      .channel('booking-slots-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'interview_slots' }, () => {
        void loadBookingData();
      })
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [isAuthenticated, loadBookingData]);

  const availableDates = useMemo(
    () => Array.from(new Set(slots.map((slot) => getIndiaDateKey(slot.startAt)))),
    [slots],
  );
  const filteredSlots = useMemo(
    () => slots.filter((slot) => getIndiaDateKey(slot.startAt) === selectedDate),
    [selectedDate, slots],
  );
  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId) || null;
  const isEligible = journey?.eligibilityStatus === 'ELIGIBLE' && journey.badgeStatus !== 'AWARDED';

  const handleBooking = async () => {
    if (!supabase || !journey || !selectedSlot) return;

    setBookingInProgress(true);
    const { error: bookingError } = await supabase.rpc('book_interview_slot', {
      p_journey_id: journey.id,
      p_slot_id: selectedSlot.id,
    });
    setBookingInProgress(false);

    if (bookingError) {
      toast({
        type: 'error',
        title: 'Booking failed',
        message: readError(bookingError, 'The selected slot is no longer available.'),
      });
      await loadBookingData();
      return;
    }

    setConfirmedSlot(selectedSlot);
    setSelectedSlotId(null);
    toast({
      type: 'success',
      title: 'Interview confirmed',
      message: 'Your booking was saved and all connected schedules have updated.',
    });
    await loadBookingData();
  };

  if (!isSupabaseConfigured) {
    return <p className="text-sm text-rose-700">Live booking is not configured.</p>;
  }

  if (isLoading) {
    return <div className="workspace-empty" role="status"><Clock aria-hidden="true" /><h2>Finding your interview slots</h2><p>Loading your badge details and evaluator availability.</p></div>;
  }

  if (!isAuthenticated) {
    return <LiveSignIn onSignedIn={loadBookingData} />;
  }

  if (error) {
    return (
      <div className="workspace-empty" role="alert">
        <AlertCircle aria-hidden="true" /><h2>Booking is not available yet</h2><p>{error}</p>
        <button type="button" onClick={() => void loadBookingData()}>Check again</button>
      </div>
    );
  }

  if (confirmedSlot) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-xl border border-zinc-200/80 p-7 shadow-xs text-center space-y-4">
        <CheckCircle2 className="h-9 w-9 text-emerald-600 mx-auto" />
        <div>
          <h1 className="text-xl font-semibold text-zinc-950">Your interview is confirmed</h1>
          <p className="mt-2 text-sm text-zinc-600">
            {dateFormatter.format(new Date(confirmedSlot.startAt))} · {timeFormatter.format(new Date(confirmedSlot.startAt))}–{timeFormatter.format(new Date(confirmedSlot.endAt))} IST with {confirmedSlot.interviewerName}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs">
        <h1 className="text-lg font-semibold text-zinc-950 tracking-tight">Book Live Badge Interview</h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Target: <span className="font-medium text-zinc-800">{journey?.badgeName}</span> · {journey?.trackName} · 45 Minutes · Timezone: Asia/Kolkata (IST)
        </p>
      </div>

      {!isEligible && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Your badge journey is not currently eligible for an interview booking.</span>
        </div>
      )}

      <section className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap gap-2" aria-label="Select interview date">
          {availableDates.map((date) => {
            const sampleSlot = slots.find((slot) => getIndiaDateKey(slot.startAt) === date);
            return (
              <button
                key={date}
                type="button"
                onClick={() => { setSelectedDate(date); setSelectedSlotId(null); }}
                className={`rounded-lg border px-3 py-2 text-xs font-medium ${selectedDate === date ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'}`}
              >
                {sampleSlot && dateFormatter.format(new Date(sampleSlot.startAt))}
              </button>
            );
          })}
        </div>

        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">Slots ({filteredSlots.length})</h2>
          <span className="text-[11px] text-zinc-500">{filteredSlots.filter((slot) => slot.status === 'AVAILABLE').length} available</span>
        </div>

        {filteredSlots.length === 0 ? (
          <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 text-center text-xs text-zinc-500">No interview slots are scheduled for this date.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {filteredSlots.map((slot) => {
              const canSelect = isEligible && slot.status === 'AVAILABLE';
              const isSelected = selectedSlotId === slot.id;
              return (
                <button
                  key={slot.id}
                  type="button"
                  disabled={!canSelect}
                  onClick={() => setSelectedSlotId(slot.id)}
                  className={`rounded-lg border p-3 text-left transition-colors ${isSelected ? 'border-zinc-900 bg-zinc-900 text-white' : canSelect ? 'border-zinc-200 hover:border-zinc-400' : 'border-zinc-200 bg-zinc-50 opacity-60 cursor-not-allowed'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-semibold"><Clock className="h-3.5 w-3.5" />{timeFormatter.format(new Date(slot.startAt))}–{timeFormatter.format(new Date(slot.endAt))}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${slot.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-200 text-zinc-600'}`}>{slot.status === 'AVAILABLE' ? 'Available' : 'Reserved'}</span>
                  </div>
                  <p className={`mt-2 flex items-center gap-1.5 text-[11px] ${isSelected ? 'text-zinc-300' : 'text-zinc-600'}`}><User className="h-3 w-3" />{slot.interviewerName}</p>
                </button>
              );
            })}
          </div>
        )}

        {selectedSlot && (
          <div className="flex flex-col gap-3 rounded-lg bg-zinc-900 p-3.5 text-white sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs">Selected: {dateFormatter.format(new Date(selectedSlot.startAt))}, {timeFormatter.format(new Date(selectedSlot.startAt))} IST</p>
            <button type="button" onClick={handleBooking} disabled={bookingInProgress} className="rounded-lg bg-white px-4 py-2 text-xs font-medium text-zinc-900 hover:bg-zinc-100 disabled:opacity-60">
              {bookingInProgress ? 'Reserving…' : 'Confirm & reserve'}
            </button>
          </div>
        )}
      </section>

      <div className="rounded-xl border border-zinc-200/80 bg-white p-4 text-xs text-zinc-500 shadow-xs">
        <p className="flex items-center gap-1.5 font-medium text-zinc-900"><ShieldCheck className="h-3.5 w-3.5" />Live booking protection</p>
        <p className="mt-1 text-[11px] leading-relaxed">The server validates and commits each reservation in one database transaction. Connected schedules refresh when the slot changes.</p>
      </div>
    </div>
  );
};
