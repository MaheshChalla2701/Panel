import React, { useState, useEffect } from 'react';
import { repository } from '../../services/api/repository';
import { useAuth } from '../../app/providers/AuthContext';
import { useToast } from '../../app/providers/ToastContext';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileText,
  User,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  History,
} from 'lucide-react';
import { MalpracticeCase } from '../../types';

export const MalpracticeReview: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [, setTick] = useState(0);

  useEffect(() => {
    return repository.subscribe(() => setTick((t) => t + 1));
  }, []);

  const cases = repository.getMalpracticeCases();
  const journeys = repository.getJourneys();

  // Selected case for review
  const [selectedCase, setSelectedCase] = useState<ReturnType<typeof repository.getMalpracticeCases>[number] | null>(null);
  const [decision, setDecision] = useState<'CONFIRMED' | 'REJECTED'>('CONFIRMED');
  const [justification, setJustification] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Case Dialog
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [targetJourneyId, setTargetJourneyId] = useState<string>('');
  const [newReason, setNewReason] = useState<string>('');
  const [newEvidence, setNewEvidence] = useState<string>('');

  const handleResolveCase = () => {
    if (!selectedCase || !justification) {
      toast({
        type: 'error',
        title: 'Justification Required',
        message: 'You must provide a documented rationale for the disciplinary decision.',
      });
      return;
    }

    setIsSubmitting(true);

    const res = repository.resolveMalpracticeCase({
      caseId: selectedCase.id,
      decision,
      justification,
      actor: currentUser,
    });

    setIsSubmitting(false);

    if (res.success) {
      toast({
        type: 'success',
        title: `Case Marked ${decision}`,
        message:
          decision === 'CONFIRMED'
            ? 'Badge has been nullified and the candidate notified.'
            : 'Inquiry dismissed and badge credential reinstated.',
      });
      setSelectedCase(null);
      setJustification('');
    } else {
      toast({
        type: 'error',
        title: 'Operation Failed',
        message: res.error || 'Could not resolve malpractice case.',
      });
    }
  };

  const handleCreateCase = () => {
    if (!targetJourneyId || !newReason || !newEvidence) {
      toast({
        type: 'error',
        title: 'Fields Incomplete',
        message: 'Please select candidate journey, specify reason, and link audit evidence.',
      });
      return;
    }

    const res = repository.reportMalpractice({
      journeyId: targetJourneyId,
      reason: newReason,
      evidence: newEvidence,
      actor: currentUser,
    });

    if (res.success) {
      toast({
        type: 'success',
        title: 'Inquiry Case Created',
        message: 'Case logged and candidate badge journey moved to Under Review.',
      });
      setShowNewCaseModal(false);
      setTargetJourneyId('');
      setNewReason('');
      setNewEvidence('');
    } else {
      toast({
        type: 'error',
        title: 'Failed to Report',
        message: res.error || 'Could not initiate inquiry.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">
              Part 5.4 — Screen 18 &bull; Integrity Oversight
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Academic Integrity & Malpractice Board</h1>
            <p className="text-sm text-slate-500 mt-1">
              Review contest anomalies, adjudicate reported malpractice cases, and authorize badge nullification or reinstatement.
            </p>
          </div>

          <button
            onClick={() => setShowNewCaseModal(true)}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow"
          >
            <Plus className="w-4 h-4" /> Open New Inquiry
          </button>
        </div>
      </div>

      {/* Cases List */}
      <div className="space-y-4">
        {cases.map((c) => {
          const isPending = c.status === 'UNDER_INVESTIGATION' || c.status === 'REPORTED';
          const isConfirmed = c.status === 'CONFIRMED';
          const isRejected = c.status === 'REJECTED';

          return (
            <div
              key={c.id}
              className={`bg-white rounded-2xl border p-6 shadow-sm transition space-y-4 ${
                isPending
                  ? 'border-amber-300 ring-1 ring-amber-300'
                  : isConfirmed
                  ? 'border-rose-200'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                    isPending
                      ? 'bg-amber-100 text-amber-800'
                      : isConfirmed
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {isPending ? (
                      <Clock className="w-5 h-5" />
                    ) : isConfirmed ? (
                      <ShieldAlert className="w-5 h-5" />
                    ) : (
                      <ShieldCheck className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-xs">{c.id.toUpperCase()}</span>
                      <span className="text-slate-400">&bull;</span>
                      <span className="text-xs font-bold text-slate-900">
                        {c.studentBadgeJourney.student.user.fullName} ({c.studentBadgeJourney.student.studentCode})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Target Badge: <strong>{c.studentBadgeJourney.badge.name}</strong> &bull; Reported by:{' '}
                      {c.reportedByName || 'Automated Monitor'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                      isPending
                        ? 'bg-amber-50 text-amber-900 border-amber-300'
                        : isConfirmed
                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    }`}
                  >
                    Status: {c.status.replace('_', ' ')}
                  </span>

                  {isPending && (
                    <button
                      onClick={() => {
                        setSelectedCase(c);
                        setDecision('CONFIRMED');
                      }}
                      className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow"
                    >
                      Adjudicate Case &rarr;
                    </button>
                  )}
                </div>
              </div>

              {/* Allegation & Evidence */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Allegation Reason
                  </div>
                  <p className="text-slate-800 leading-relaxed">{c.reason}</p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Evidence & System Logs
                  </div>
                  <p className="font-mono text-[11px] text-slate-700 leading-relaxed">
                    {c.evidenceReference}
                  </p>
                </div>
              </div>

              {/* Resolution Decision if already resolved */}
              {c.decision && (
                <div
                  className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                    c.decision === 'CONFIRMED'
                      ? 'bg-rose-50 border-rose-200 text-rose-950'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>
                      Formal Adjudication Decision: {c.decision} ({c.decision === 'CONFIRMED' ? 'Badge Nullified' : 'Badge Reinstated'})
                    </span>
                    <span className="text-[10px] opacity-75">
                      Reviewed by {c.reviewerName} on {new Date(c.reviewedAt!).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="leading-relaxed opacity-90">{c.decisionJustification}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Adjudication Modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">
              Adjudicate Malpractice Inquiry ({selectedCase.id.toUpperCase()})
            </h3>
            <p className="text-xs text-slate-500">
              Candidate: <strong>{selectedCase.studentBadgeJourney.student.user.fullName}</strong> &bull; Target Badge:{' '}
              <strong>{selectedCase.studentBadgeJourney.badge.name}</strong>
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Official Adjudication Finding *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDecision('CONFIRMED')}
                    className={`p-3 rounded-xl border text-left transition ${
                      decision === 'CONFIRMED'
                        ? 'border-rose-600 bg-rose-50 ring-2 ring-rose-500 text-rose-950 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-extrabold">Confirm Malpractice</div>
                    <div className="text-[10px] opacity-80 mt-0.5">Nullify badge & log disciplinary action.</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecision('REJECTED')}
                    className={`p-3 rounded-xl border text-left transition ${
                      decision === 'REJECTED'
                        ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500 text-emerald-950 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-extrabold">Dismiss (Unsubstantiated)</div>
                    <div className="text-[10px] opacity-80 mt-0.5">Reinstate badge & exonerate candidate.</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Decision Justification & Evidence Summary *
                </label>
                <textarea
                  rows={4}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Detail the technical reasoning, forensic findings, and committee vote..."
                  className="w-full border border-slate-300 rounded-xl p-3 text-xs bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedCase(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveCase}
                disabled={isSubmitting || !justification}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Recording Decision...' : 'Commit Disciplinary Decision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Inquiry Modal */}
      {showNewCaseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">Initiate Academic Integrity Inquiry</h3>
            <p className="text-xs text-slate-500">
              Opening an inquiry places the badge status under review while forensic investigation proceeds.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Candidate Badge Journey</label>
                <select
                  value={targetJourneyId}
                  onChange={(e) => setTargetJourneyId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 text-slate-800"
                >
                  <option value="">Select student & badge...</option>
                  {journeys.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.student.user.fullName} ({j.student.studentCode}) &bull; {j.badge.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Allegation Summary</label>
                <input
                  type="text"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="e.g. Code plagiarism, proxy browser extension..."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Evidence & Log Reference</label>
                <textarea
                  rows={2}
                  value={newEvidence}
                  onChange={(e) => setNewEvidence(e.target.value)}
                  placeholder="Commit hashes, IP anomalies, proctoring screenshots..."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-slate-50"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowNewCaseModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCase}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                Submit Inquiry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
