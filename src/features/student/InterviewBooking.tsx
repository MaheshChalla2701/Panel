import React, { useState, useEffect } from 'react';
import { useAuth } from '../../app/providers/AuthContext';
import { repository } from '../../services/api/repository';
import { useToast } from '../../app/providers/ToastContext';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  User,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Filter,
  ArrowRight,
} from 'lucide-react';
import { Interview } from '../../types';
import { isSupabaseConfigured } from '../../services/supabase/client';
import { LiveInterviewBooking } from './LiveInterviewBooking';

const DemoInterviewBooking: React.FC = () => {
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
        title: 'Interview Confirmed',
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
      <div className="max-w-xl mx-auto space-y-6 animate-in fade-in-50 pt-4">
        <div className="bg-white rounded-xl border border-zinc-200/80 p-6 sm:p-8 shadow-xs text-center space-y-5">
          <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-900 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>

          <div>
            <span className="text-[10px] uppercase font-medium text-zinc-400 tracking-wider">
              Booking Confirmation
            </span>
            <h1 className="text-xl font-semibold text-zinc-950 mt-1">
              Your interview is confirmed!
            </h1>
            <p className="text-xs text-zinc-600 max-w-md mx-auto mt-2 leading-relaxed">
              "Your Track Badge interview has been confirmed for {formattedDate} at {formattedTime}. Please review the technical focus areas for your badge level and ensure your development environment is prepared. You can reschedule or cancel up to 24 hours before your scheduled time."
            </p>
          </div>

          {/* Details Card */}
          <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200/60 text-left text-xs space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60">
              <span className="text-zinc-500">Booking Reference</span>
              <span className="font-mono font-medium text-zinc-950">{confirmedInterview.id.toUpperCase()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Evaluator</span>
              <span className="font-medium text-zinc-900">{intvObj?.interviewer.user.fullName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Meeting Room</span>
              <a
                href={confirmedInterview.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="text-zinc-900 underline font-medium"
              >
                Launch Room
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Passcode</span>
              <span className="font-mono font-medium text-zinc-700">{confirmedInterview.meetingPasscode || 'GRIT2026'}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-zinc-200/60 text-[11px] text-zinc-400">
              <span>Policy</span>
              <span>Cancellation allowed up to 24h prior</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <button
              onClick={() => navigate('/my-interviews')}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition-colors shadow-xs"
            >
              View Interview Details
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full sm:w-auto px-4 py-2 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-medium text-xs transition-colors"
            >
              Return Home
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
      <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-zinc-950 tracking-tight">
              Book Live Badge Interview
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Target: <span className="text-zinc-800 font-medium">{badge?.name}</span> • 45 Minutes • Timezone: Asia/Kolkata (IST)
            </p>
          </div>

          <div>
            <span className="text-xs font-mono font-medium px-2.5 py-1 rounded bg-zinc-100 text-zinc-700 border border-zinc-200/60">
              Attempt #{primaryJourney?.currentAttemptNumber ? primaryJourney.currentAttemptNumber + 1 : 1} of 3
            </span>
          </div>
        </div>
      </div>

      {!isEligible && (
        <div className="bg-zinc-50 border border-zinc-200/80 p-4 rounded-xl flex items-center gap-3 text-xs text-zinc-700">
          <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0" />
          <div>
            <strong className="text-zinc-900">Booking Currently Inaccessible:</strong> Complete and verify all mandatory skill contests before booking an interview slot.
          </div>
        </div>
      )}

      {/* Date & Filter Controls */}
      <div className="bg-white rounded-xl border border-zinc-200/80 p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5" />
          Filter Timeslots
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Date Picker Buttons */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-500 mb-1">Select Date</label>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium text-center border transition-colors min-w-20 ${
                      isSelected
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                        : 'bg-white text-zinc-700 border-zinc-200/80 hover:bg-zinc-50'
                    }`}
                  >
                    <div className="text-[10px] text-zinc-400">{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <div className="font-semibold">{d.getDate()} {d.toLocaleDateString('en-US', { month: 'short' })}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Evaluator Filter */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-500 mb-1">Evaluator</label>
            <select
              value={selectedInterviewerId}
              onChange={(e) => {
                setSelectedInterviewerId(e.target.value);
                setSelectedSlot(null);
              }}
              className="w-full text-xs font-medium border border-zinc-200/80 rounded-lg px-2.5 py-2 bg-white text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900"
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
      <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
            Available Slots ({filteredSlots.filter((s) => s.status === 'AVAILABLE').length})
          </h3>
          <span className="text-[11px] text-zinc-400">
            {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>

        {filteredSlots.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400 bg-zinc-50 rounded-lg border border-zinc-200/60">
            No interview slots scheduled on this date.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
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
                  className={`p-3 rounded-lg border text-left transition-colors relative ${
                    isSelected
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                      : isAvailable && isEligible
                      ? 'bg-white border-zinc-200/80 hover:border-zinc-400 cursor-pointer'
                      : 'bg-zinc-50 border-zinc-200/60 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold flex items-center gap-1.5">
                      <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-zinc-300' : 'text-zinc-400'}`} />
                      {startTime} – {endTime}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                        isSelected
                          ? 'bg-zinc-800 text-zinc-200'
                          : isAvailable
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-zinc-100 text-zinc-500'
                      }`}
                    >
                      {isAvailable ? 'Available' : 'Reserved'}
                    </span>
                  </div>

                  <div className={`text-[11px] flex items-center gap-1.5 ${isSelected ? 'text-zinc-300' : 'text-zinc-600'}`}>
                    <User className="w-3 h-3 text-zinc-400" />
                    <span>{slot.interviewer.user.fullName}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected Slot Confirmation Bar */}
        {selectedSlot && (
          <div className="mt-4 p-3.5 rounded-lg bg-zinc-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-bottom-2">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">Selected Slot</div>
              <div className="text-xs font-medium mt-0.5">
                {new Date(selectedSlot.startAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at{' '}
                {new Date(selectedSlot.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                {selectedSlot.interviewer ? `with ${selectedSlot.interviewer.user.fullName}` : ''}
              </div>
            </div>

            <button
              onClick={handleConfirmBooking}
              disabled={bookingInProgress}
              className="inline-flex items-center justify-center gap-1.5 bg-white text-zinc-900 hover:bg-zinc-100 font-medium text-xs px-4 py-2 rounded-lg transition-colors shrink-0"
            >
              {bookingInProgress ? 'Reserving...' : 'Confirm & Reserve Slot'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Policy Footnote */}
      <div className="bg-white rounded-xl border border-zinc-200/80 p-4 text-xs text-zinc-500 space-y-1 shadow-xs">
        <div className="font-medium text-zinc-900 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
          Transactional Booking Protection
        </div>
        <p className="text-[11px] leading-relaxed text-zinc-500">
          Slots are allocated atomically. If two candidates submit simultaneously, the engine confirms the first commit and notifies the second safely without state corruption.
        </p>
      </div>
    </div>
  );
};

export const InterviewBooking: React.FC = () => {
  const assignmentDemoMode = localStorage.getItem('grit_assignment_demo_mode') === 'true';
  return isSupabaseConfigured && !assignmentDemoMode ? <LiveInterviewBooking /> : <DemoInterviewBooking />;
};
