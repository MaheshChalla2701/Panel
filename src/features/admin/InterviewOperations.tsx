import React, { useState, useEffect } from 'react';
import { repository } from '../../services/api/repository';
import { useAuth } from '../../app/providers/AuthContext';
import { useToast } from '../../app/providers/ToastContext';
import {
  UserCheck,
} from 'lucide-react';

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
      <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-zinc-950 tracking-tight">
              Interview Operations & Reassignment
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Manage schedule allocations, handle no-shows, and balance evaluator assignments.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-lg text-xs font-medium border border-zinc-200/60">
            {['ALL', 'UPCOMING', 'COMPLETED', 'NO_SHOW', 'CANCELLED'].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-2.5 py-1 rounded transition-colors capitalize ${
                  statusFilter === f ? 'bg-white text-zinc-950 font-medium shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {f.toLowerCase().replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Operations Table */}
      <div className="bg-white rounded-xl border border-zinc-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/70 border-b border-zinc-200/80 text-zinc-500 font-medium uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Ref</th>
                <th className="py-3 px-4">Candidate & Badge</th>
                <th className="py-3 px-4">Evaluator</th>
                <th className="py-3 px-4">Timeslot</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
              {filteredInterviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-zinc-400">
                    No interviews match this filter.
                  </td>
                </tr>
              ) : (
                filteredInterviews.map((intv) => {
                  const isScheduled = intv.interviewStatus === 'SCHEDULED' || intv.interviewStatus === 'IN_PROGRESS';
                  return (
                    <tr key={intv.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-zinc-950">
                        {intv.id.toUpperCase()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-zinc-950">{intv.studentBadgeJourney.student.user.fullName}</div>
                        <div className="text-[10px] text-zinc-400">{intv.studentBadgeJourney.badge.name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-zinc-800">{intv.interviewer.user.fullName}</div>
                        <div className="text-[10px] text-zinc-400">{intv.interviewer.title}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-zinc-900">
                          {new Date(intv.scheduledStart).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {new Date(intv.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                          {new Date(intv.scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            isScheduled
                              ? 'bg-zinc-100 text-zinc-700 border-zinc-200/80'
                              : intv.interviewStatus === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                              : intv.interviewStatus === 'NO_SHOW'
                              ? 'bg-rose-50 text-rose-700 border-rose-200/60'
                              : 'bg-zinc-50 text-zinc-500 border-zinc-200/60'
                          }`}
                        >
                          {intv.interviewStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isScheduled && (
                          <button
                            onClick={() => {
                              setReassignModalTarget(intv);
                              setNewInterviewerId(intv.interviewerId);
                            }}
                            className="inline-flex items-center gap-1 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-medium text-[11px] px-2.5 py-1 rounded transition-colors shadow-xs"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-zinc-500" /> Reassign
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
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-elevated border border-zinc-200 space-y-3.5 animate-in zoom-in-95">
            <h3 className="text-sm font-semibold text-zinc-950">Reassign Evaluator</h3>
            <p className="text-xs text-zinc-500">
              Reassign candidate <strong>{reassignModalTarget.studentBadgeJourney.student.user.fullName}</strong> to another qualified evaluator.
            </p>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-zinc-600 font-medium mb-1">Evaluator</label>
                <select
                  value={newInterviewerId}
                  onChange={(e) => setNewInterviewerId(e.target.value)}
                  className="w-full border border-zinc-200 rounded-lg px-2.5 py-1.5 bg-white text-zinc-800 text-xs"
                >
                  {interviewers.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.user.fullName} ({i.title})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-600 font-medium mb-1">Reason</label>
                <input
                  type="text"
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="e.g. Workload balancing..."
                  className="w-full border border-zinc-200 rounded-lg px-2.5 py-1.5 bg-white text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                onClick={() => setReassignModalTarget(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                onClick={handleReassign}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs shadow-xs"
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
