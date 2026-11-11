import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthContext';
import { repository } from '../../services/api/repository';
import { useToast } from '../../app/providers/ToastContext';
import {
  ExternalLink,
  ArrowLeft,
  Lock,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { EvaluationOutcome, InterviewStatus } from '../../types';

export const InterviewWorkspace: React.FC = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [, setTick] = useState(0);

  useEffect(() => {
    return repository.subscribe(() => setTick((t) => t + 1));
  }, []);

  const interview = repository.getInterview(interviewId || '');
  const existingEval = interview ? repository.getEvaluationForInterview(interview.id) : undefined;

  // Form State
  const [outcome, setOutcome] = useState<EvaluationOutcome>(existingEval?.outcome || 'PASS');
  const [problemSolvingScore, setProblemSolvingScore] = useState<number>(existingEval?.scoreData.problemSolvingScore || 4.5);
  const [conceptualUnderstandingScore, setConceptualUnderstandingScore] = useState<number>(existingEval?.scoreData.conceptualUnderstandingScore || 4.5);
  const [communicationScore, setCommunicationScore] = useState<number>(existingEval?.scoreData.communicationScore || 4.5);
  const [practicalCodingScore, setPracticalCodingScore] = useState<number>(existingEval?.scoreData.practicalCodingScore || 4.5);

  const [technicalAssessment, setTechnicalAssessment] = useState<string>(existingEval?.technicalAssessment || '');
  const [communicationAssessment, setCommunicationAssessment] = useState<string>(existingEval?.communicationAssessment || '');
  const [overallComments, setOverallComments] = useState<string>(existingEval?.overallComments || '');
  const [studentFeedback, setStudentFeedback] = useState<string>(existingEval?.studentFeedback || '');
  const [privateNotes, setPrivateNotes] = useState<string>(existingEval?.privateNotes || '');

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!interview) {
    return (
      <div className="bg-white rounded-xl border border-zinc-200/80 p-10 text-center text-xs space-y-2">
        <div className="text-zinc-500 font-medium">Interview record not found.</div>
        <button
          onClick={() => navigate('/interviewer')}
          className="text-zinc-900 font-medium hover:underline"
        >
          &larr; Return to Dashboard
        </button>
      </div>
    );
  }

  const student = interview.studentBadgeJourney.student;
  const badge = interview.studentBadgeJourney.badge;
  const track = badge.track;
  const requirements = repository.getBadgeRequirements(badge.id);
  const skills = repository.getStudentSkills(student.id);

  const handleUpdateStatus = (status: InterviewStatus) => {
    const res = repository.updateInterviewStatus({
      interviewId: interview.id,
      status,
      actor: currentUser,
    });

    if (res.success) {
      toast({
        type: 'success',
        title: 'Status Updated',
        message: `Interview marked as ${status.replace('_', ' ')}.`,
      });
    } else {
      toast({
        type: 'error',
        title: 'Update Failed',
        message: res.error || 'Failed to update status.',
      });
    }
  };

  const handleFinalSubmit = () => {
    if (!studentFeedback || !technicalAssessment || !privateNotes) {
      toast({
        type: 'error',
        title: 'Form Incomplete',
        message: 'Please fill technical assessment, student feedback, and private reviewer notes.',
      });
      return;
    }

    setIsSubmitting(true);

    const res = repository.submitEvaluation({
      evaluationData: {
        interviewId: interview.id,
        interviewerId: interview.interviewerId,
        outcome,
        scoreData: {
          problemSolvingScore,
          conceptualUnderstandingScore,
          communicationScore,
          practicalCodingScore,
        },
        technicalAssessment,
        communicationAssessment: communicationAssessment || 'Good communication style.',
        overallComments: overallComments || 'Overall satisfactory performance.',
        studentFeedback,
        privateNotes,
      },
      actor: currentUser,
    });

    setIsSubmitting(false);
    setShowConfirmModal(false);

    if (res.success) {
      toast({
        type: 'success',
        title: 'Evaluation Submitted',
        message: `Recorded outcome: ${outcome}. Candidate journey updated.`,
      });
    } else {
      toast({
        type: 'error',
        title: 'Submission Error',
        message: res.error || 'Could not submit evaluation.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/interviewer')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-950 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">Live Status:</span>
          <span className="text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200/60">
            {interview.interviewStatus.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Main Grid: Candidate Context & Workspace (Left 1 col, Right 2 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Student Profile & Verification Audit */}
        <div className="space-y-4">
          {/* Candidate Card */}
          <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-zinc-900 text-white font-medium text-xs flex items-center justify-center">
                {student.user.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-zinc-950 text-sm">{student.user.fullName}</h3>
                <div className="text-[11px] text-zinc-400 font-mono">{student.studentCode}</div>
              </div>
            </div>

            <div className="divide-y divide-zinc-100 text-xs text-zinc-600">
              <div className="py-1.5 flex justify-between">
                <span className="text-zinc-400">College</span>
                <span className="font-medium text-zinc-900">{student.college}</span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span className="text-zinc-400">Batch</span>
                <span className="font-medium text-zinc-900">{student.batch} ({student.academicYear})</span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span className="text-zinc-400">GRIT Miles</span>
                <span className="font-medium text-zinc-900">
                  {student.milesEarned.toLocaleString()}
                </span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span className="text-zinc-400">Qualiflyer</span>
                <span className="font-medium text-zinc-900">#{student.qualiflyerRank}</span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span className="text-zinc-400">Attempt</span>
                <span className="font-medium text-zinc-900">#{interview.attemptNumber} of 3</span>
              </div>
            </div>

            {/* Attendance Quick Controls */}
            <div className="pt-2 border-t border-zinc-100 space-y-1.5">
              <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Attendance</div>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <button
                  onClick={() => handleUpdateStatus('STUDENT_CHECKED_IN')}
                  className="px-2 py-1 rounded border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-medium"
                >
                  Checked In
                </button>
                <button
                  onClick={() => handleUpdateStatus('IN_PROGRESS')}
                  className="px-2 py-1 rounded border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-medium"
                >
                  In Progress
                </button>
                <button
                  onClick={() => handleUpdateStatus('COMPLETED')}
                  className="px-2 py-1 rounded border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-medium"
                >
                  Completed
                </button>
                <button
                  onClick={() => handleUpdateStatus('NO_SHOW')}
                  className="px-2 py-1 rounded border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-medium"
                >
                  No Show
                </button>
              </div>
            </div>

            {/* Online Room Link */}
            <div className="pt-1">
              <a
                href={interview.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs py-2 rounded-lg transition-colors shadow-xs"
              >
                Launch Room <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Prerequisite Skills List */}
          <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs space-y-2.5">
            <h4 className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
              Prerequisite Contest Skills
            </h4>
            <div className="divide-y divide-zinc-100 text-xs">
              {requirements.map((req) => {
                const prog = skills.find((s) => s.skillId === req.skillId);

                return (
                  <div key={req.id} className="py-2 flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-zinc-900">{req.skillName}</div>
                      <div className="text-[10px] text-zinc-400">{req.description}</div>
                    </div>
                    <span className="text-[10px] font-mono font-medium text-zinc-700 bg-zinc-100 px-1.5 py-0.2 rounded shrink-0">
                      {prog?.score || 85}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Screen 13 Evaluation Form (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h2 className="text-base font-semibold text-zinc-950 tracking-tight">Structured Evaluation Form</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Target Badge: <span className="font-medium text-zinc-800">{badge.name}</span> ({track.name})
                </p>
              </div>

              {existingEval && (
                <span className="text-xs font-medium text-zinc-700 bg-zinc-100 border border-zinc-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Evaluation Immutable & Saved
                </span>
              )}
            </div>

            {/* Outcome Selection (Pass, Fail, Retake Later) */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                Official Outcome *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: 'PASS',
                    label: 'Pass',
                    desc: 'Clear benchmarks; trigger badge award.',
                  },
                  {
                    id: 'RETAKE_LATER',
                    label: 'Retake Later',
                    desc: 'Promising; candidate requires cooldown.',
                  },
                  {
                    id: 'FAIL',
                    label: 'Fail',
                    desc: 'Unsatisfactory performance across rubric.',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!!existingEval}
                    onClick={() => setOutcome(item.id as EvaluationOutcome)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      outcome === item.id
                        ? 'border-zinc-950 bg-zinc-950 text-white shadow-xs'
                        : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700'
                    }`}
                  >
                    <div className="font-semibold text-xs">{item.label}</div>
                    <div className={`text-[10px] mt-0.5 leading-snug ${outcome === item.id ? 'text-zinc-300' : 'text-zinc-500'}`}>
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Rubric Score Sliders (1 to 5) */}
            <div className="space-y-3 pt-1">
              <label className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                Rubric Scores (Scale 1.0 to 5.0)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/60 space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-zinc-800">Problem Solving</span>
                    <span className="text-zinc-950 font-mono">{problemSolvingScore}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    disabled={!!existingEval}
                    value={problemSolvingScore}
                    onChange={(e) => setProblemSolvingScore(Number(e.target.value))}
                    className="w-full accent-zinc-900"
                  />
                </div>

                <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/60 space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-zinc-800">Conceptual Clarity</span>
                    <span className="text-zinc-950 font-mono">{conceptualUnderstandingScore}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    disabled={!!existingEval}
                    value={conceptualUnderstandingScore}
                    onChange={(e) => setConceptualUnderstandingScore(Number(e.target.value))}
                    className="w-full accent-zinc-900"
                  />
                </div>

                <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/60 space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-zinc-800">Communication & Defense</span>
                    <span className="text-zinc-950 font-mono">{communicationScore}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    disabled={!!existingEval}
                    value={communicationScore}
                    onChange={(e) => setCommunicationScore(Number(e.target.value))}
                    className="w-full accent-zinc-900"
                  />
                </div>

                <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/60 space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-zinc-800">Practical Implementation</span>
                    <span className="text-zinc-950 font-mono">{practicalCodingScore}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    disabled={!!existingEval}
                    value={practicalCodingScore}
                    onChange={(e) => setPracticalCodingScore(Number(e.target.value))}
                    className="w-full accent-zinc-900"
                  />
                </div>
              </div>
            </div>

            {/* Assessment Notes */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                  Technical Assessment Analysis *
                </label>
                <textarea
                  rows={2}
                  disabled={!!existingEval}
                  value={technicalAssessment}
                  onChange={(e) => setTechnicalAssessment(e.target.value)}
                  placeholder="Detail the candidate's understanding and implementation depth..."
                  className="w-full border border-zinc-200 rounded-lg p-2.5 text-xs bg-white focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              {/* Student-Facing Feedback (CRITICAL SEPARATION) */}
              <div className="p-3.5 bg-zinc-50 rounded-lg border border-zinc-200/60 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-zinc-900">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-zinc-500" />
                    Student-Facing Feedback (Visible to Candidate) *
                  </span>
                  <span className="text-[10px] uppercase font-medium text-zinc-500 bg-white px-1.5 py-0.2 rounded border border-zinc-200">
                    Candidate Facing
                  </span>
                </div>
                <textarea
                  rows={2}
                  disabled={!!existingEval}
                  value={studentFeedback}
                  onChange={(e) => setStudentFeedback(e.target.value)}
                  placeholder="Constructive feedback to guide candidate growth..."
                  className="w-full border border-zinc-200 rounded-lg p-2 text-xs bg-white"
                />
              </div>

              {/* Private Reviewer Notes (NEVER EXPOSED TO CANDIDATE) */}
              <div className="p-3.5 bg-zinc-50 rounded-lg border border-zinc-200/60 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-zinc-900">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-zinc-500" />
                    Private Reviewer Notes (Confidential / Internal) *
                  </span>
                  <span className="text-[10px] uppercase font-medium text-zinc-500 bg-white px-1.5 py-0.2 rounded border border-zinc-200">
                    Internal Only
                  </span>
                </div>
                <textarea
                  rows={2}
                  disabled={!!existingEval}
                  value={privateNotes}
                  onChange={(e) => setPrivateNotes(e.target.value)}
                  placeholder="Confidential notes on code ownership, integrity, or retake focus areas..."
                  className="w-full border border-zinc-200 rounded-lg p-2 text-xs bg-white"
                />
              </div>
            </div>

            {/* Submission CTA */}
            {!existingEval && (
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                <div className="text-[11px] text-zinc-400 max-w-xs">
                  Once committed, evaluations are immutable and logged into the audit ledger.
                </div>

                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition-colors shadow-xs"
                >
                  Review & Submit Official Evaluation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-elevated border border-zinc-200 space-y-3.5 animate-in zoom-in-95">
            <h3 className="text-sm font-semibold text-zinc-950">
              Confirm Official Submission
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Record outcome of <strong className="text-zinc-950 uppercase">{outcome.replace('_', ' ')}</strong> for candidate <strong>{student.user.fullName}</strong>?
            </p>
            <div className="p-3 bg-zinc-50 rounded-lg text-xs space-y-1 text-zinc-500">
              <div>• Badge Issuance: {outcome === 'PASS' ? 'Will be formally awarded' : 'No badge issued'}</div>
              <div>• Retake Policy: {outcome === 'RETAKE_LATER' ? '7-day preparation cooldown enforced' : 'N/A'}</div>
              <div>• Immutability: Append-only audit record created</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-100"
              >
                Edit
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs disabled:opacity-50 shadow-xs"
              >
                {isSubmitting ? 'Recording...' : 'Confirm Official Submission'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
