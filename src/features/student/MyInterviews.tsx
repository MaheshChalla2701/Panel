import React, { useState, useEffect } from 'react';
import { useAuth } from '../../app/providers/AuthContext';
import { repository } from '../../services/api/repository';
import { useToast } from '../../app/providers/ToastContext';
import {
  Calendar,
  Clock,
  ExternalLink,
  User,
  AlertTriangle,
  RotateCcw,
  XCircle,
  CheckCircle2,
  Filter,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { Interview, InterviewSlot } from '../../types';

export const MyInterviews: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [, setTick] = useState(0);

  useEffect(() => {
    return repository.subscribe(() => setTick((t) => t + 1));
  }, []);

  const student = repository.getStudentByUserId(currentUser.id);
  const interviews = repository.getInterviews().filter((i) => {
    return i.studentBadgeJourney.studentId === student?.id;
  });

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedInterview, setSelectedInterview] = useState<ReturnType<typeof repository.getInterviews>[number] | null>(null);

  // Reschedule Modal State
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [targetSlotId, setTargetSlotId] = useState<string>('');
  const [rescheduleReason, setRescheduleReason] = useState<string>('');

  // Cancel Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState<string>('');

  const availableSlots = repository
    .getSlots()
    .filter((s) => s.status === 'AVAILABLE' && new Date(s.startAt).getTime() > Date.now());

  const filteredInterviews = interviews.filter((i) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'UPCOMING') return i.interviewStatus === 'SCHEDULED' || i.interviewStatus === 'IN_PROGRESS';
    if (statusFilter === 'COMPLETED') return i.interviewStatus === 'COMPLETED';
    if (statusFilter === 'CANCELLED') return i.interviewStatus === 'CANCELLED';
    return true;
  });

  const handleCancel = () => {
    if (!selectedInterview || !cancellationReason) return;

    const res = repository.cancelInterview({
      interviewId: selectedInterview.id,
      actor: currentUser,
      reason: cancellationReason,
    });

    if (res.success) {
      toast({
        type: 'success',
        title: 'Interview Cancelled',
        message: 'The slot has been released back into the pool.',
      });
      setShowCancelModal(false);
      setSelectedInterview(null);
    } else {
      toast({
        type: 'error',
        title: 'Cancellation Error',
        message: res.error || 'Failed to cancel.',
      });
    }
  };

  const handleReschedule = () => {
    if (!selectedInterview || !targetSlotId) return;

    const res = repository.rescheduleInterview({
      interviewId: selectedInterview.id,
      newSlotId: targetSlotId,
      actor: currentUser,
      reason: rescheduleReason || 'Student requested reschedule via dashboard.',
    });

    if (res.success) {
      toast({
        type: 'success',
        title: 'Reschedule Successful',
        message: 'Your interview time has been safely updated.',
      });
      setShowRescheduleModal(false);
      setSelectedInterview(null);
    } else {
      toast({
        type: 'error',
        title: 'Reschedule Failed',
        message: res.error || 'Unable to reschedule.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              Part 5.2 — Screen 5 & 6
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Interviews & Attempt History</h1>
            <p className="text-sm text-slate-500 mt-1">
              View upcoming scheduled interviews, manage rescheduling/cancellations, and inspect past attempt history.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {['ALL', 'UPCOMING', 'COMPLETED', 'CANCELLED'].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-lg transition capitalize ${
                  statusFilter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interviews List */}
      {filteredInterviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm space-y-3">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <div className="text-sm font-bold text-slate-800">No interviews match this filter.</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You do not currently have any interview records matching "{statusFilter.toLowerCase()}".
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInterviews.map((intv) => {
            const isUpcoming = intv.interviewStatus === 'SCHEDULED' || intv.interviewStatus === 'IN_PROGRESS';
            const isCompleted = intv.interviewStatus === 'COMPLETED';
            const isCancelled = intv.interviewStatus === 'CANCELLED';

            return (
              <div
                key={intv.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-900">
                      {intv.studentBadgeJourney.badge.name}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      Attempt #{intv.attemptNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        isUpcoming
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : isCompleted
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {intv.interviewStatus.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {new Date(intv.scheduledStart).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {new Date(intv.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                        {new Date(intv.scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (IST)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Evaluator: {intv.interviewer.user.fullName}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {isUpcoming && (
                    <a
                      href={intv.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1"
                    >
                      Join Room <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  <button
                    onClick={() => setSelectedInterview(intv)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Screen 6: Detailed Interview Modal */}
      {selectedInterview && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  Interview Details
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedInterview.studentBadgeJourney.badge.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedInterview(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                <div className="text-slate-500 font-medium">Date & Schedule</div>
                <div className="font-bold text-slate-900 text-sm">
                  {new Date(selectedInterview.scheduledStart).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}{' '}
                  at{' '}
                  {new Date(selectedInterview.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                  (IST)
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="text-slate-500 font-medium">Evaluator Profile</div>
                <div className="font-bold text-slate-900">{selectedInterview.interviewer.user.fullName}</div>
                <div className="text-slate-600 text-[11px]">{selectedInterview.interviewer.title}</div>
                <div className="text-slate-400 text-[10px]">{selectedInterview.interviewer.bio}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="text-slate-500 font-medium">Meeting Connection</div>
                <a
                  href={selectedInterview.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline font-bold block"
                >
                  {selectedInterview.meetingLink}
                </a>
                <div className="text-[11px] text-slate-500">Passcode: {selectedInterview.meetingPasscode || 'GRIT2026'}</div>
              </div>

              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-[11px] text-blue-900 space-y-1">
                <div className="font-bold">Candidate Preparation Guidelines</div>
                <p className="text-slate-600">
                  Join 5 minutes prior to the scheduled slot. Ensure your local code repository is cloned and ready to share screen.
                </p>
              </div>

              {selectedInterview.cancellationReason && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 text-[11px]">
                  <strong>Cancellation Reason:</strong> {selectedInterview.cancellationReason}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              {selectedInterview.interviewStatus === 'SCHEDULED' ? (
                <>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowRescheduleModal(true)}
                      className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reschedule
                    </button>
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Cancel Booking
                    </button>
                  </div>
                  <button
                    onClick={() => setSelectedInterview(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Close
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setSelectedInterview(null)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Safe Reschedule Modal */}
      {showRescheduleModal && selectedInterview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">Reschedule Interview</h3>
            <p className="text-xs text-slate-500">
              Select an alternative slot. Your current slot ({new Date(selectedInterview.scheduledStart).toLocaleDateString()}) will only be released once your new slot has been securely reserved.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Choose New Available Slot</label>
                <select
                  value={targetSlotId}
                  onChange={(e) => setTargetSlotId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 text-slate-800"
                >
                  <option value="">Select a new time...</option>
                  {availableSlots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {new Date(s.startAt).toLocaleDateString()} at{' '}
                      {new Date(s.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull;{' '}
                      {s.interviewer.user.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Reason for Rescheduling</label>
                <input
                  type="text"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="e.g. Academic conflict, technical setup..."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-slate-50"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleReschedule}
                disabled={!targetSlotId}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs disabled:opacity-50"
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {showCancelModal && selectedInterview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-rose-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Cancel Interview Booking
            </h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to cancel your interview for {selectedInterview.studentBadgeJourney.badge.name}? The slot will be returned to the open schedule.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cancellation Reason</label>
              <textarea
                rows={3}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Please state why you are cancelling..."
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-slate-50"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Back
              </button>
              <button
                onClick={handleCancel}
                disabled={!cancellationReason}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs disabled:opacity-50"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
