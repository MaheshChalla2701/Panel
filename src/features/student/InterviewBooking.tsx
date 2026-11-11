import React, { useState, useEffect } from 'react';
import { useAuth } from '../../app/providers/AuthContext';
import { repository } from '../../services/api/repository';
import { useToast } from '../../app/providers/ToastContext';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Filter,
  ArrowRight,
  Info,
  CalendarCheck,
} from 'lucide-react';
import { InterviewSlot, Interview } from '../../types';

export const InterviewBooking: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [, setTick] = useState(0);

  useEffect(() => {
    return repository.subscribe(() => setTick((t) => t + 1));
  }, []);

  const student = repository.getStudentByUserId(currentUser.id);
  const journeys = repository.getJourneys().filter((j) => j.studentId === student?.id);
  const primaryJourney = journeys[0] || repository.getJourneys()[0];
  const badge = primaryJourney?.badge;

  const interviewers = repository.getInterviewers();
  const allSlots = repository.getSlots();

  // Filters
  const [selectedInterviewerId, setSelectedInterviewerId] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-12');
  const [selectedSlot, setSelectedSlot] = useState<ReturnType<typeof repository.getSlots>[number] | null>(null);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [confirmedInterview, setConfirmedInterview] = useState<Interview | null>(null);

  // Available unique dates from slots
  const availableDates = Array.from(
    new Set(allSlots.map((s) => s.startAt.split('T')[0]))
  ).sort();

  // Filter slots for selected date & interviewer
  const filteredSlots = allSlots.filter((slot) => {
    const slotDate = slot.startAt.split('T')[0];
    if (slotDate !== selectedDate) return false;
    if (selectedInterviewerId !== 'ALL' && slot.interviewerId !== selectedInterviewerId) {
      return false;
    }
    return true;
  });

  const handleSelectSlot = (slot: ReturnType<typeof repository.getSlots>[number]) => {
    if (slot.status !== 'AVAILABLE') return;
    setSelectedSlot(slot);
  };

  const handleConfirmBooking = () => {
    if (!selectedSlot || !student || !primaryJourney) return;

    setBookingInProgress(true);

    // Call atomic transactional booking in repository
    const result = repository.bookInterviewSlot({
      studentId: student.id,
      journeyId: primaryJourney.id,
      slotId: selectedSlot.id,
      actor: currentUser,
    });

    setBookingInProgress(false);

    if (result.success && result.interview) {
      setConfirmedInterview(result.interview);
      toast({
        type: 'success',
        title: 'Interview Confirmed!',
        message: 'Your slot has been reserved successfully.',
      });
    } else {
      toast({
        type: 'error',
        title: 'Booking Failed',
        message: result.error || 'The slot could not be booked.',
      });
    }
  };

  // If already confirmed in this session, show Confirmation Screen (Screen 4)
  if (confirmedInterview) {
    const intvObj = repository.getInterview(confirmedInterview.id);
    const formattedDate = new Date(confirmedInterview.scheduledStart).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = new Date(confirmedInterview.scheduledStart).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in-50">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <CalendarCheck className="w-9 h-9" />
          </div>

          <div>
            <div className="text-xs uppercase font-bold text-emerald-600 tracking-wider">
              Part 5.2 — Screen 4 &bull; Official Confirmation
            </div>
            {/* Part 7 Exact Message 2 Title */}
            <h1 className="text-2xl font-black text-slate-900 mt-1">Your interview is confirmed!</h1>
            {/* Part 7 Exact Message 2 Body */}
            <p className="text-sm text-slate-600 max-w-lg mx-auto mt-2 leading-relaxed">
              "Your {badge?.track.name} – {badge?.name} interview is scheduled for {formattedDate} at {formattedTime} (Asia/Kolkata - IST). Your interviewer and meeting details are available below. Please join a few minutes early."
            </p>
          </div>

          {/* Details Card */}
          <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Booking Reference</span>
              <span className="font-mono font-bold text-slate-900">{confirmedInterview.id.toUpperCase()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Assigned Evaluator</span>
              <span className="font-bold text-slate-900">{intvObj?.interviewer.user.fullName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Meeting Room Link</span>
              <a
                href={confirmedInterview.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline font-semibold"
              >
                {confirmedInterview.meetingLink}
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Passcode</span>
              <span className="font-mono font-bold text-slate-700">{confirmedInterview.meetingPasscode || 'GRIT2026'}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[11px] text-slate-500">
              <span>Cancellation Policy</span>
              <span>Free cancellation up to 2 hours before scheduled slot</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/my-interviews')}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow"
            >
              View Interview Details
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
            >
              Return to Student Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pre-booking eligibility guard
  const isEligible = primaryJourney?.eligibilityStatus === 'ELIGIBLE';

  return (
    <div className="space-y-6">
      {/* Title Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              Part 5.2 — Screen 3
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Book Live Badge Interview</h1>
            <p className="text-sm text-slate-500 mt-1">
              Target Badge:{' '}
              <strong className="text-slate-800">{badge?.name}</strong> &bull; Slot Duration: 45 Minutes &bull; Timezone: Asia/Kolkata (IST)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Attempt #{primaryJourney?.currentAttemptNumber ? primaryJourney.currentAttemptNumber + 1 : 1} of 3
            </span>
          </div>
        </div>
      </div>

      {!isEligible && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center gap-3 text-xs text-rose-900">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <strong>Booking Currently Inaccessible:</strong> Your current status is{' '}
            <span className="font-bold uppercase">{primaryJourney?.eligibilityStatus}</span>. You must complete and verify all mandatory skill contests before booking an interview slot.
          </div>
        </div>
      )}

      {/* Booking Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-slate-500" />
          Filter Available Timeslots
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Date Picker Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Interview Date</label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {availableDates.map((dateStr) => {
                const d = new Date(dateStr);
                const isSelected = selectedDate === dateStr;
                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => {
                      setSelectedDate(dateStr);
                      setSelectedSlot(null);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold text-center border transition min-w-24 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div>{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <div className="text-sm font-black">{d.getDate()} {d.toLocaleDateString('en-US', { month: 'short' })}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Evaluator Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Interviewer Preference</label>
            <select
              value={selectedInterviewerId}
              onChange={(e) => {
                setSelectedInterviewerId(e.target.value);
                setSelectedSlot(null);
              }}
              className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Any Available Senior Evaluator</option>
              {interviewers.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.user.fullName} ({i.title})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Slots Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Available Slots for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </h3>
          <span className="text-xs text-slate-500">
            {filteredSlots.filter((s) => s.status === 'AVAILABLE').length} bookable slots found
          </span>
        </div>

        {filteredSlots.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
            No interview slots scheduled on this date for the selected criteria. Please choose another date.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSlots.map((slot) => {
              const isAvailable = slot.status === 'AVAILABLE';
              const isSelected = selectedSlot?.id === slot.id;
              const startTime = new Date(slot.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const endTime = new Date(slot.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <button
                  key={slot.id}
                  disabled={!isAvailable || !isEligible}
                  onClick={() => handleSelectSlot(slot)}
                  className={`p-4 rounded-xl border text-left transition relative ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-600 ring-2 ring-blue-500 shadow-sm'
                      : isAvailable && isEligible
                      ? 'bg-white border-slate-200 hover:border-blue-400 hover:bg-slate-50 cursor-pointer'
                      : 'bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      {startTime} – {endTime}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        isAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isAvailable ? 'Available' : 'Reserved'}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{slot.interviewer.user.fullName}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {slot.interviewer.title}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected Slot Confirmation Bar */}
        {selectedSlot && (
          <div className="mt-6 p-4 rounded-xl bg-blue-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-bottom-2">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-200">Selected Timeslot</div>
              <div className="text-sm font-extrabold mt-0.5">
                {new Date(selectedSlot.startAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at{' '}
                {new Date(selectedSlot.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                {selectedSlot.interviewer ? `with ${selectedSlot.interviewer.user.fullName}` : ''}
              </div>
            </div>

            <button
              onClick={handleConfirmBooking}
              disabled={bookingInProgress}
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-900 hover:bg-blue-50 font-bold text-xs px-6 py-2.5 rounded-xl transition shadow shrink-0"
            >
              {bookingInProgress ? 'Reserving Slot...' : 'Confirm & Reserve Slot'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Policy and Concurrency Protection Notice */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 text-xs text-slate-600 space-y-2">
        <div className="font-bold text-slate-900 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Transactional Booking Protection
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500">
          Slots are reserved atomically. If two candidates attempt to confirm the same slot simultaneously, only the first request succeeds; subsequent attempts will receive an instant conflict notice to select an alternate time without data corruption.
        </p>
      </div>
    </div>
  );
};
