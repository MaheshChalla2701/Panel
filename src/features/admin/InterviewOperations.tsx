import React, { useState, useEffect } from 'react';
import { repository } from '../../services/api/repository';
import { useAuth } from '../../app/providers/AuthContext';
import { useToast } from '../../app/providers/ToastContext';
import {
  Calendar,
  Clock,
  UserCheck,
  AlertCircle,
  ExternalLink,
  RotateCcw,
  UserX,
  UserPlus,
  Filter,
} from 'lucide-react';
import { Interview } from '../../types';

export const InterviewOperations: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [, setTick] = useState(0);

  useEffect(() => {
    return repository.subscribe(() => setTick((t) => t + 1));
  }, []);

  const interviews = repository.getInterviews();
  const interviewers = repository.getInterviewers();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [reassignModalTarget, setReassignModalTarget] = useState<ReturnType<typeof repository.getInterviews>[number] | null>(null);
  const [newInterviewerId, setNewInterviewerId] = useState<string>('');
  const [reassignReason, setReassignReason] = useState<string>('');

  const filteredInterviews = interviews.filter((i) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'UPCOMING') return i.interviewStatus === 'SCHEDULED' || i.interviewStatus === 'IN_PROGRESS';
    if (statusFilter === 'COMPLETED') return i.interviewStatus === 'COMPLETED';
    if (statusFilter === 'NO_SHOW') return i.interviewStatus === 'NO_SHOW';
    if (statusFilter === 'CANCELLED') return i.interviewStatus === 'CANCELLED';
    return true;
  });

  const handleReassign = () => {
    if (!reassignModalTarget || !newInterviewerId) return;

    const res = repository.reassignInterviewer({
      interviewId: reassignModalTarget.id,
      newInterviewerId,
      actor: currentUser,
      reason: reassignReason || 'Administrative schedule balancing.',
    });

    if (res.success) {
      toast({
        type: 'success',
        title: 'Interviewer Reassigned',
        message: 'The interview has been assigned to the new evaluator.',
      });
      setReassignModalTarget(null);
    } else {
      toast({
        type: 'error',
        title: 'Reassignment Failed',
        message: res.error || 'Failed to reassign.',
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
              Part 5.4 — Screen 16
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Interview Operations & Reassignment</h1>
            <p className="text-sm text-slate-500 mt-1">
              Live operational oversight: Manage booked interviews, handle no-shows, and balance interviewer allocations.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {['ALL', 'UPCOMING', 'COMPLETED', 'NO_SHOW', 'CANCELLED'].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-lg transition capitalize ${
                  statusFilter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.toLowerCase().replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Operations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Session Ref</th>
                <th className="py-3.5 px-4">Candidate & Badge</th>
                <th className="py-3.5 px-4">Assigned Evaluator</th>
                <th className="py-3.5 px-4">Timeslot (IST)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Administrative Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredInterviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No interviews match this filter.
                  </td>
                </tr>
              ) : (
                filteredInterviews.map((intv) => {
                  const isScheduled = intv.interviewStatus === 'SCHEDULED' || intv.interviewStatus === 'IN_PROGRESS';
                  return (
                    <tr key={intv.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {intv.id.toUpperCase()}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{intv.studentBadgeJourney.student.user.fullName}</div>
                        <div className="text-[10px] text-slate-400">{intv.studentBadgeJourney.badge.name}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{intv.interviewer.user.fullName}</div>
                        <div className="text-[10px] text-slate-400">{intv.interviewer.title}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">
                          {new Date(intv.scheduledStart).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(intv.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &ndash;{' '}
                          {new Date(intv.scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            isScheduled
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : intv.interviewStatus === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : intv.interviewStatus === 'NO_SHOW'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {intv.interviewStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isScheduled && (
                          <button
                            onClick={() => {
                              setReassignModalTarget(intv);
                              setNewInterviewerId(intv.interviewerId);
                            }}
                            className="inline-flex items-center gap-1 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-[11px] px-2.5 py-1 rounded-lg transition"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-blue-600" /> Reassign
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Reassignment Modal */}
      {reassignModalTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">Admin Evaluator Reassignment</h3>
            <p className="text-xs text-slate-500">
              Reassign candidate <strong>{reassignModalTarget.studentBadgeJourney.student.user.fullName}</strong> to another qualified evaluator.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Evaluator</label>
                <select
                  value={newInterviewerId}
                  onChange={(e) => setNewInterviewerId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 text-slate-800"
                >
                  {interviewers.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.user.fullName} ({i.title})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Reason for Administrative Reassignment</label>
                <input
                  type="text"
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="e.g. Workload balancing, evaluator emergency..."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-slate-50"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setReassignModalTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleReassign}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                Confirm Reassignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
