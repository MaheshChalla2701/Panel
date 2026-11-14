import React, { useState, useEffect } from 'react';
import { useAuth } from '../../app/providers/AuthContext';
import { repository } from '../../services/api/repository';
import { evaluateRetakeEligibility } from '../../domain/policies/retakePolicy';
import {
  Award,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ShieldCheck,
  FileText,
  RotateCcw,
} from 'lucide-react';

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

  const interviews = repository
    .getInterviews()
    .filter((i) => i.studentBadgeJourneyId === primaryJourney?.id);

  const completedInterviews = interviews.filter((i) => i.interviewStatus === 'COMPLETED');
  const latestCompleted = completedInterviews[completedInterviews.length - 1];
  const evaluation = latestCompleted ? repository.getEvaluationForInterview(latestCompleted.id) : undefined;

  const retakeEvaluation = evaluateRetakeEligibility(interviews);

  const statusMeta: Record<
    string,
    { title: string; desc: string; badgeClass: string; icon: any }
  > = {
    NOT_EARNED: {
      title: 'Badge In Progress',
      desc: 'Complete all mandatory skills and clear the live evaluation to earn this badge.',
      badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-200/60',
      icon: Clock,
    },
    PENDING_AWARD: {
      title: 'Evaluation Passed — Pending Award',
      desc: 'The technical evaluation cleared benchmarks. Awaiting administrative issuance.',
      badgeClass: 'bg-zinc-100 text-zinc-800 border-zinc-300',
      icon: Clock,
    },
    AWARDED: {
      title: 'Track Badge Awarded',
      desc: 'Officially verified and recorded across NIAT academic credentials.',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
      icon: Award,
    },
    UNDER_REVIEW: {
      title: 'Under Administrative Verification',
      desc: 'A routine verification inquiry is active. Historical attempt records remain preserved.',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/60',
      icon: Clock,
    },
    NULLIFIED: {
      title: 'Badge Nullified (Academic Integrity Action)',
      desc: 'Administrative inquiry concluded with nullification. Historical evaluation data is preserved in compliance archive.',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/60',
      icon: ShieldAlert,
    },
    REINSTATED: {
      title: 'Badge Reinstated Following Review',
      desc: 'The administrative review concluded in your favor. Your credential is fully restored.',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
      icon: ShieldCheck,
    },
  };

  const currentStatusConfig = statusMeta[primaryJourney?.badgeStatus || 'NOT_EARNED'];
  const StatusIcon = currentStatusConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs">
        <h1 className="text-lg font-semibold text-zinc-950 tracking-tight">
          Badge Status & Official Evaluation Result
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Verified badge credential status, candidate feedback, structured rubric scores, and attempt logs.
        </p>
      </div>

      {/* Part 7 Exact Message 3 Banner if PASSED */}
      {primaryJourney?.badgeStatus === 'AWARDED' && (
        <div className="bg-white rounded-xl p-5 border border-zinc-200/80 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Official Track Badge Awarded
              </div>
              <p className="text-xs text-zinc-700 leading-relaxed max-w-2xl">
                "Congratulations! You have successfully passed your Track Badge interview. Your Specialist Badge has been awarded and your achievement has been recorded on your profile. Keep pushing forward in the Panel competition!"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Badge Credential Card */}
      <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-zinc-100 border border-zinc-200/60 flex items-center justify-center shrink-0 text-zinc-800">
              <StatusIcon className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">{track?.name}</span>
                <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border ${currentStatusConfig.badgeClass}`}>
                  {primaryJourney?.badgeStatus.replace('_', ' ')}
                </span>
              </div>
              <h2 className="text-base font-semibold text-zinc-950 mt-0.5">{badge?.name}</h2>
              <p className="text-xs text-zinc-500 mt-0.5 max-w-lg">{currentStatusConfig.desc}</p>
            </div>
          </div>

          <div className="text-left md:text-right shrink-0 bg-zinc-50 p-3 rounded-lg border border-zinc-200/60 text-xs space-y-0.5">
            <div className="text-zinc-400 text-[10px] uppercase font-medium">Candidate</div>
            <div className="font-medium text-zinc-950">{student?.user.fullName}</div>
            <div className="text-zinc-500 font-mono text-[11px]">{student?.studentCode}</div>
            {primaryJourney?.awardedAt && (
              <div className="text-zinc-600 font-medium text-[11px] pt-1">
                Issued: {new Date(primaryJourney.awardedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Interview Result & Rubric Scores (if evaluated) */}
        {evaluation ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                Evaluation Rubric Breakdown
              </h3>
              <span className={`text-[10px] font-medium uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                evaluation.outcome === 'PASS'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                  : evaluation.outcome === 'RETAKE_LATER'
                  ? 'bg-amber-50 text-amber-700 border-amber-200/60'
                  : 'bg-rose-50 text-rose-700 border-rose-200/60'
              }`}>
                Outcome: {evaluation.outcome.replace('_', ' ')}
              </span>
            </div>

            {/* Rubric Scores Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/60 text-center">
                <div className="text-[11px] text-zinc-500 font-medium">Problem Solving</div>
                <div className="text-xl font-semibold text-zinc-950 mt-0.5">
                  {evaluation.scoreData.problemSolvingScore} <span className="text-xs font-normal text-zinc-400">/ 5.0</span>
                </div>
              </div>

              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/60 text-center">
                <div className="text-[11px] text-zinc-500 font-medium">Conceptual Clarity</div>
                <div className="text-xl font-semibold text-zinc-950 mt-0.5">
                  {evaluation.scoreData.conceptualUnderstandingScore} <span className="text-xs font-normal text-zinc-400">/ 5.0</span>
                </div>
              </div>

              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/60 text-center">
                <div className="text-[11px] text-zinc-500 font-medium">Communication & Defense</div>
                <div className="text-xl font-semibold text-zinc-950 mt-0.5">
                  {evaluation.scoreData.communicationScore} <span className="text-xs font-normal text-zinc-400">/ 5.0</span>
                </div>
              </div>
            </div>

            {/* Candidate Feedback (Strictly Student-Facing — Redacting Private Notes) */}
            <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200/60 space-y-1.5">
              <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-zinc-500" />
                Interviewer Feedback
              </div>
              <p className="text-xs text-zinc-800 leading-relaxed font-medium">
                "{evaluation.studentFeedback}"
              </p>
              <div className="text-[10px] text-zinc-400 pt-0.5">
                Evaluator: <strong>{latestCompleted.interviewer.user.fullName}</strong> • Submitted on{' '}
                {new Date(evaluation.submittedAt).toLocaleDateString()}
              </div>
            </div>

            {/* Retake Policy & Cooldown Info */}
            {evaluation.outcome === 'RETAKE_LATER' && (
              <div className="p-3.5 bg-amber-50/60 rounded-lg border border-amber-200/60 space-y-1 text-xs text-amber-900">
                <div className="font-medium flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                  Retake Eligibility & Preparation Cooldown
                </div>
                <p className="text-[11px] leading-relaxed">
                  {retakeEvaluation.reason || 'You are eligible to rebook after the mandatory 7-day preparation cooldown.'}
                </p>
                <div className="text-[10px] text-amber-800 font-medium">
                  Attempts Used: {latestCompleted.attemptNumber} of 3 • Next Attempt: #{retakeEvaluation.attemptNumber}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-5 bg-zinc-50 rounded-lg text-center text-xs text-zinc-400 border border-zinc-200/60">
            No completed interview evaluations recorded for this badge yet.
          </div>
        )}

        {/* Historical Attempts Table */}
        <div className="pt-4 border-t border-zinc-100 space-y-2.5">
          <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
            Attempt Records (Append-Only Audit)
          </h3>
          {interviews.length === 0 ? (
            <div className="text-xs text-zinc-400">No attempts logged.</div>
          ) : (
            <div className="divide-y divide-zinc-100 border border-zinc-200/80 rounded-lg overflow-hidden text-xs">
              {interviews.map((intv) => (
                <div key={intv.id} className="p-3 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-medium text-zinc-800 text-[11px]">Attempt #{intv.attemptNumber}</span>
                    <span className="text-zinc-500 text-xs">
                      {new Date(intv.scheduledStart).toLocaleDateString()} with {intv.interviewer.user.fullName}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-zinc-600 uppercase tracking-wider text-[10px] bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200/60">
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
