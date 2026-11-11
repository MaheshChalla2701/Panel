import React, { useState, useEffect } from 'react';
import { repository } from '../../services/api/repository';
import { useAuth } from '../../app/providers/AuthContext';
import { useToast } from '../../app/providers/ToastContext';
import {
  ShieldAlert,
  ShieldCheck,
  Plus,
  Clock,
} from 'lucide-react';

export const MalpracticeReview: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [, setTick] = useState(0);

  useEffect(() => {
    return repository.subscribe(() => setTick((t) => t + 1));
  }, []);

  const cases = repository.getMalpracticeCases();
  const journeys = repository.getJourneys();

  const [selectedCase, setSelectedCase] = useState<ReturnType<typeof repository.getMalpracticeCases>[number] | null>(null);
  const [decision, setDecision] = useState<'CONFIRMED' | 'REJECTED'>('CONFIRMED');
  const [justification, setJustification] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [targetJourneyId, setTargetJourneyId] = useState<string>('');
  const [newReason, setNewReason] = useState<string>('');
  const [newEvidence, setNewEvidence] = useState<string>('');

  const handleResolveCase = () => {
    if (!selectedCase || !justification) {
      toast({
        type: 'error',
        title: 'Justification Required',
        message: 'Please provide documented rationale for this decision.',
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
            ? 'Badge nullified and candidate notified.'
            : 'Inquiry dismissed and credential reinstated.',
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
        message: 'Please select candidate, specify reason, and link audit evidence.',
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
      <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-zinc-950 tracking-tight">
              Academic Integrity & Malpractice Board
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Review contest anomalies, adjudicate reported malpractice, and authorize nullification or reinstatement.
            </p>
          </div>

          <button
            onClick={() => setShowNewCaseModal(true)}
            className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Open Inquiry
          </button>
        </div>
      </div>

      {/* Cases List */}
      <div className="space-y-3">
        {cases.map((c) => {
          const isPending = c.status === 'UNDER_INVESTIGATION' || c.status === 'REPORTED';
          const isConfirmed = c.status === 'CONFIRMED';

          return (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs transition-colors space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-800 flex items-center justify-center font-medium">
                    {isPending ? (
                      <Clock className="w-4 h-4 text-zinc-500" />
                    ) : isConfirmed ? (
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-medium text-zinc-950">{c.id.toUpperCase()}</span>
                      <span className="text-zinc-300">•</span>
                      <span className="text-xs font-medium text-zinc-950">
                        {c.studentBadgeJourney.student.user.fullName} ({c.studentBadgeJourney.student.studentCode})
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Target: <span className="font-medium text-zinc-700">{c.studentBadgeJourney.badge.name}</span> • Reported by: {c.reportedByName || 'Automated Monitor'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      isPending
                        ? 'bg-amber-50 text-amber-700 border-amber-200/60'
                        : isConfirmed
                        ? 'bg-rose-50 text-rose-700 border-rose-200/60'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                    }`}
                  >
                    {c.status.replace('_', ' ')}
                  </span>

                  {isPending && (
                    <button
                      onClick={() => {
                        setSelectedCase(c);
                        setDecision('CONFIRMED');
                      }}
                      className="px-3 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition-colors shadow-xs"
                    >
                      Adjudicate Case &rarr;
                    </button>
                  )}
                </div>
              </div>

              {/* Description & Evidence */}
              <div className="text-xs space-y-1.5 text-zinc-600">
                <div>
                  <span className="text-zinc-400 font-medium">Allegation:</span> {c.reason}
                </div>
                {c.evidenceReference && (
                  <div>
                    <span className="text-zinc-400 font-medium">Evidence Audit:</span> {c.evidenceReference}
                  </div>
                )}
                {c.decisionJustification && (
                  <div className="text-[11px] text-zinc-500 pt-1 border-t border-zinc-100">
                    <span className="font-medium text-zinc-700">Decision Justification:</span> {c.decisionJustification}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Adjudication Modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-elevated border border-zinc-200 space-y-3.5 animate-in zoom-in-95">
            <h3 className="text-sm font-semibold text-zinc-950">Adjudicate Malpractice Inquiry</h3>
            <p className="text-xs text-zinc-500">
              Reviewing case {selectedCase.id.toUpperCase()} for candidate {selectedCase.studentBadgeJourney.student.user.fullName}.
            </p>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-zinc-600 font-medium mb-1">Decision</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecision('CONFIRMED')}
                    className={`p-2 rounded-lg border text-center font-medium transition-colors ${
                      decision === 'CONFIRMED'
                        ? 'border-zinc-900 bg-zinc-900 text-white shadow-xs'
                        : 'border-zinc-200 bg-white text-zinc-700'
                    }`}
                  >
                    Confirm Malpractice
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision('REJECTED')}
                    className={`p-2 rounded-lg border text-center font-medium transition-colors ${
                      decision === 'REJECTED'
                        ? 'border-zinc-900 bg-zinc-900 text-white shadow-xs'
                        : 'border-zinc-200 bg-white text-zinc-700'
                    }`}
                  >
                    Dismiss & Reinstate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-zinc-600 font-medium mb-1">Administrative Justification *</label>
                <textarea
                  rows={3}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Document formal justification..."
                  className="w-full border border-zinc-200 rounded-lg p-2 text-xs bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                onClick={() => setSelectedCase(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveCase}
                disabled={isSubmitting || !justification}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs disabled:opacity-50 shadow-xs"
              >
                {isSubmitting ? 'Recording...' : 'Commit Decision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Inquiry Modal */}
      {showNewCaseModal && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-elevated border border-zinc-200 space-y-3.5 animate-in zoom-in-95">
            <h3 className="text-sm font-semibold text-zinc-950">Open Malpractice Inquiry</h3>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-zinc-600 font-medium mb-1">Candidate Journey</label>
                <select
                  value={targetJourneyId}
                  onChange={(e) => setTargetJourneyId(e.target.value)}
                  className="w-full border border-zinc-200 rounded-lg px-2.5 py-1.5 bg-white text-xs"
                >
                  <option value="">Select candidate journey...</option>
                  {journeys.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.student.user.fullName} • {j.badge.name} ({j.badgeStatus})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-600 font-medium mb-1">Allegation / Anomaly</label>
                <input
                  type="text"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="e.g. Code similarity score 94%..."
                  className="w-full border border-zinc-200 rounded-lg px-2.5 py-1.5 bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-zinc-600 font-medium mb-1">Audit Evidence</label>
                <textarea
                  rows={2}
                  value={newEvidence}
                  onChange={(e) => setNewEvidence(e.target.value)}
                  placeholder="Repository diff, submission hashes..."
                  className="w-full border border-zinc-200 rounded-lg p-2 text-xs bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                onClick={() => setShowNewCaseModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCase}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs shadow-xs"
              >
                File Inquiry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
