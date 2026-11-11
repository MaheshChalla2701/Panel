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
} from 'lucide-react';

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
        message: 'The slot has been released back into the schedule pool.',
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
      <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-zinc-950 tracking-tight">
              My Interviews & Attempt History
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Manage scheduled live sessions, execute safe rescheduling, and inspect attempt records.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-lg text-xs font-medium border border-zinc-200/60">
            {['ALL', 'UPCOMING', 'COMPLETED', 'CANCELLED'].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-2.5 py-1 rounded text-xs transition-colors capitalize ${
                  statusFilter === f ? 'bg-white text-zinc-950 font-medium shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
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
        <div className="bg-white rounded-xl border border-zinc-200/80 p-10 text-center shadow-xs space-y-2">
          <Calendar className="w-8 h-8 text-zinc-300 mx-auto" />
          <div className="text-xs font-medium text-zinc-800">No interview records found</div>
          <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
            You do not currently have any records matching "{statusFilter.toLowerCase()}".
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredInterviews.map((intv) => {
            const isUpcoming = intv.interviewStatus === 'SCHEDULED' || intv.interviewStatus === 'IN_PROGRESS';
            const isCompleted = intv.interviewStatus === 'COMPLETED';

            return (
              <div
                key={intv.id}
                className="bg-white rounded-xl border border-zinc-200/80 p-4 shadow-xs hover:border-zinc-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-950">
                      {intv.studentBadgeJourney.badge.name}
                    </span>
                    <span className="text-[10px] font-mono font-medium text-zinc-500 bg-zinc-100 px-1.5 py-0.2 rounded border border-zinc-200/60">
                      Attempt #{intv.attemptNumber}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                        isUpcoming
                          ? 'bg-zinc-100 text-zinc-700 border-zinc-200/80'
                          : isCompleted
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                          : 'bg-zinc-50 text-zinc-500 border-zinc-200/60'
                      }`}
                    >
                      {intv.interviewStatus.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      <span>
                        {new Date(intv.scheduledStart).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      <span>
                        {new Date(intv.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                        {new Date(intv.scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{intv.interviewer.user.fullName}</span>
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
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors flex items-center gap-1 shadow-xs"
                    >
                      Join Room <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  <button
                    onClick={() => setSelectedInterview(intv)}
                    className="px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition-colors"
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
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-elevated border border-zinc-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
              <div>
                <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                  Session Dossier
                </span>
                <h3 className="text-sm font-semibold text-zinc-950">
                  {selectedInterview.studentBadgeJourney.badge.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedInterview(null)}
                className="text-zinc-400 hover:text-zinc-600 p-1 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/60 space-y-0.5">
                <div className="text-zinc-400 text-[10px] uppercase font-medium">Scheduled Time</div>
                <div className="font-medium text-zinc-950 text-xs">
                  {new Date(selectedInterview.scheduledStart).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}{' '}
                  at{' '}
                  {new Date(selectedInterview.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/60 space-y-0.5">
                <div className="text-zinc-400 text-[10px] uppercase font-medium">Assigned Evaluator</div>
                <div className="font-medium text-zinc-950">{selectedInterview.interviewer.user.fullName}</div>
                <div className="text-zinc-500 text-[11px]">{selectedInterview.interviewer.title}</div>
              </div>

              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/60 space-y-0.5">
                <div className="text-zinc-400 text-[10px] uppercase font-medium">Connection Details</div>
                <a
                  href={selectedInterview.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-zinc-900 underline font-medium block truncate"
                >
                  {selectedInterview.meetingLink}
                </a>
                <div className="text-[11px] text-zinc-500">Passcode: {selectedInterview.meetingPasscode || 'GRIT2026'}</div>
              </div>

              {selectedInterview.cancellationReason && (
                <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/60 text-zinc-600 text-[11px]">
                  <strong>Cancellation Reason:</strong> {selectedInterview.cancellationReason}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100">
              {selectedInterview.interviewStatus === 'SCHEDULED' ? (
                <>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowRescheduleModal(true)}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Reschedule
                    </button>
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-600 text-xs font-medium transition-colors flex items-center gap-1"
                    >
                      <XCircle className="w-3 h-3 text-zinc-400" /> Cancel
                    </button>
                  </div>
                  <button
                    onClick={() => setSelectedInterview(null)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-100"
                  >
                    Close
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setSelectedInterview(null)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 text-white font-medium text-xs shadow-xs"
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
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-elevated border border-zinc-200 space-y-3.5 animate-in zoom-in-95">
            <h3 className="text-sm font-semibold text-zinc-950">Reschedule Interview</h3>
            <p className="text-xs text-zinc-500">
              Select an alternative slot. Your confirmed slot will only be released once the new slot has been securely committed.
            </p>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-zinc-600 font-medium mb-1">New Available Slot</label>
                <select
                  value={targetSlotId}
                  onChange={(e) => setTargetSlotId(e.target.value)}
                  className="w-full border border-zinc-200 rounded-lg px-2.5 py-1.5 bg-white text-zinc-800 text-xs"
                >
                  <option value="">Select a new time...</option>
                  {availableSlots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {new Date(s.startAt).toLocaleDateString()} at{' '}
                      {new Date(s.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                      {s.interviewer.user.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-600 font-medium mb-1">Reason for Rescheduling</label>
                <input
                  type="text"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="e.g. Schedule conflict..."
                  className="w-full border border-zinc-200 rounded-lg px-2.5 py-1.5 bg-white text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                onClick={handleReschedule}
                disabled={!targetSlotId}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs disabled:opacity-50 shadow-xs"
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {showCancelModal && selectedInterview && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-elevated border border-zinc-200 space-y-3.5 animate-in zoom-in-95">
            <h3 className="text-sm font-semibold text-zinc-950 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-zinc-500" /> Cancel Interview Booking
            </h3>
            <p className="text-xs text-zinc-500">
              Are you sure you want to cancel your interview for {selectedInterview.studentBadgeJourney.badge.name}? The slot will be returned to the open schedule.
            </p>

            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">Reason</label>
              <textarea
                rows={2}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="State your reason..."
                className="w-full border border-zinc-200 rounded-lg p-2 text-xs bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-100"
              >
                Back
              </button>
              <button
                onClick={handleCancel}
                disabled={!cancellationReason}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs disabled:opacity-50 shadow-xs"
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
