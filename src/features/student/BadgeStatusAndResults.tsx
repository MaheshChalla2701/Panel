import React, { useState, useEffect } from 'react';
import { useAuth } from '../../app/providers/AuthContext';
import { repository } from '../../services/api/repository';
import { evaluateRetakeEligibility } from '../../domain/policies/retakePolicy';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Star,
  FileText,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const BadgeStatusAndResults: React.FC = () => {
  const { currentUser } = useAuth();
  const [, setTick] = useState(0);

  useEffect(() => {
    return repository.subscribe(() => setTick((t) => t + 1));
  }, []);

  const student = repository.getStudentByUserId(currentUser.id);
  const journeys = repository.getJourneys().filter((j) => j.studentId === student?.id);
  const primaryJourney = journeys[0] || repository.getJourneys()[0];
  const badge = primaryJourney?.badge;
  const track = badge?.track;

  // Student interviews for this journey
  const interviews = repository
    .getInterviews()
    .filter((i) => i.studentBadgeJourneyId === primaryJourney?.id);

  const completedInterviews = interviews.filter((i) => i.interviewStatus === 'COMPLETED');
  const latestCompleted = completedInterviews[completedInterviews.length - 1];
  const evaluation = latestCompleted ? repository.getEvaluationForInterview(latestCompleted.id) : undefined;

  // Retake check
  const retakeEvaluation = evaluateRetakeEligibility(interviews);

  // Badge Status config
  const statusMeta: Record<
    string,
    { title: string; desc: string; badgeClass: string; icon: any }
  > = {
    NOT_EARNED: {
      title: 'Badge In Progress (Not Yet Earned)',
      desc: 'Complete all mandatory skill contests and clear the live interview to unlock this badge.',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
      icon: Clock,
    },
    PENDING_AWARD: {
      title: 'Interview Passed — Awaiting Formal Issuance',
      desc: 'Your evaluation cleared benchmarks. The badge is undergoing formal award issuance.',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: Clock,
    },
    AWARDED: {
      title: 'Official Track Badge Awarded',
      desc: 'Verified by senior evaluators and recognized across NIAT and GRIT international qualifiers.',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: Award,
    },
    UNDER_REVIEW: {
      title: 'Badge Verification Under Administrative Review',
      desc: 'A routine administrative review is active. Your previous evaluation records remain preserved.',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
      icon: AlertCircle,
    },
    NULLIFIED: {
      title: 'Badge Nullified (Academic Integrity Action)',
      desc: 'Formal administrative inquiry concluded with nullification. Historical attempt records remain archived.',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
      icon: ShieldAlert,
    },
    REINSTATED: {
      title: 'Badge Reinstated Following Review',
      desc: 'The administrative review concluded in your favor. Your Track Badge has been fully restored.',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: ShieldCheck,
    },
  };

  const currentStatusConfig = statusMeta[primaryJourney?.badgeStatus || 'NOT_EARNED'];
  const StatusIcon = currentStatusConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
          Part 5.2 — Screen 7 & 8
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Badge Status & Official Evaluation Result</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review verified badge credential status, candidate feedback, structured rubric scores, and attempt logs.
        </p>
      </div>

      {/* Part 7 Exact Message 3 Banner if PASSED */}
      {primaryJourney?.badgeStatus === 'AWARDED' && (
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 rounded-2xl p-6 text-white shadow-md border border-emerald-800 animate-in fade-in-50">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="inline-block text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-700/70 text-emerald-200">
                Official Result Notification
              </div>
              {/* Part 7 Exact Message 3 Title */}
              <h2 className="text-xl font-bold tracking-tight">Congratulations! You've cleared your interview!</h2>
              {/* Part 7 Exact Message 3 Body */}
              <p className="text-sm text-emerald-100 leading-relaxed max-w-2xl">
                "Your interview for the {track?.name} – {badge?.name} badge has been marked as Passed. Your badge has been awarded. Keep progressing towards your next milestone!"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Screen 8: Badge Credential Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border ${
              primaryJourney?.badgeStatus === 'AWARDED' || primaryJourney?.badgeStatus === 'REINSTATED'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-600'
                : primaryJourney?.badgeStatus === 'UNDER_REVIEW'
                ? 'bg-amber-50 border-amber-300 text-amber-600'
                : primaryJourney?.badgeStatus === 'NULLIFIED'
                ? 'bg-rose-50 border-rose-300 text-rose-600'
                : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}>
              <StatusIcon className="w-8 h-8" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{track?.name}</span>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${currentStatusConfig.badgeClass}`}>
                  {primaryJourney?.badgeStatus.replace('_', ' ')}
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 mt-1">{badge?.name}</h2>
              <p className="text-xs text-slate-600 mt-1">{currentStatusConfig.desc}</p>
            </div>
          </div>

          <div className="text-left md:text-right shrink-0 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs space-y-1">
            <div className="text-slate-500">Candidate</div>
            <div className="font-bold text-slate-900">{student?.user.fullName}</div>
            <div className="text-slate-400 font-mono text-[11px]">{student?.studentCode}</div>
            {primaryJourney?.awardedAt && (
              <div className="text-emerald-700 font-semibold text-[11px] pt-1">
                Issued: {new Date(primaryJourney.awardedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Screen 7: Interview Result & Rubric Scores (if evaluated) */}
        {evaluation ? (
          <div className="mt-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Official Evaluator Assessment Summary</h3>
              <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                evaluation.outcome === 'PASS'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : evaluation.outcome === 'RETAKE_LATER'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                Outcome: {evaluation.outcome.replace('_', ' ')}
              </span>
            </div>

            {/* Rubric Scores Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
                <div className="text-xs text-slate-500 font-semibold">Problem Solving</div>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {evaluation.scoreData.problemSolvingScore} <span className="text-xs font-normal text-slate-400">/ 5.0</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
                <div className="text-xs text-slate-500 font-semibold">Conceptual Understanding</div>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {evaluation.scoreData.conceptualUnderstandingScore} <span className="text-xs font-normal text-slate-400">/ 5.0</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
                <div className="text-xs text-slate-500 font-semibold">Communication & Defense</div>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {evaluation.scoreData.communicationScore} <span className="text-xs font-normal text-slate-400">/ 5.0</span>
                </div>
              </div>
            </div>

            {/* Student Feedback (Student-Facing Only — Never exposes private notes!) */}
            <div className="p-5 bg-blue-50/50 rounded-xl border border-blue-200/80 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                Interviewer Feedback to Student
              </div>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                "{evaluation.studentFeedback}"
              </p>
              <div className="text-[11px] text-slate-500 pt-1">
                Evaluator: <strong>{latestCompleted.interviewer.user.fullName}</strong> &bull; Submitted on{' '}
                {new Date(evaluation.submittedAt).toLocaleDateString()}
              </div>
            </div>

            {/* Retake Policy & Cooldown Info (Part 3.6 & Part 5.2 Screen 7) */}
            {evaluation.outcome === 'RETAKE_LATER' && (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-2 text-xs text-amber-950">
                <div className="font-bold flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-amber-700" />
                  Retake Eligibility & Preparation Cooldown
                </div>
                <p className="leading-relaxed">
                  {retakeEvaluation.reason || 'You are eligible to attempt this interview again after the mandatory preparation cooldown period.'}
                </p>
                <div className="text-[11px] text-amber-800 font-semibold">
                  Attempts Used: {latestCompleted.attemptNumber} of 3 &bull; Next Attempt: #{retakeEvaluation.attemptNumber}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
            No completed interview evaluations recorded for this badge yet.
          </div>
        )}

        {/* Historical Attempts Table */}
        <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Interview Attempt Records (Immutable Audit)</h3>
          {interviews.length === 0 ? (
            <div className="text-xs text-slate-400">No attempts logged.</div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
              {interviews.map((intv) => (
                <div key={intv.id} className="p-3.5 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-700">Attempt #{intv.attemptNumber}</span>
                    <span className="text-slate-500">
                      {new Date(intv.scheduledStart).toLocaleDateString()} with {intv.interviewer.user.fullName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 uppercase tracking-wider text-[10px] bg-slate-100 px-2 py-0.5 rounded">
                      {intv.interviewStatus.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
