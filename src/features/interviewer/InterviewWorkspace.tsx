import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthContext';
import { repository } from '../../services/api/repository';
import { useToast } from '../../app/providers/ToastContext';
import {
  User,
  Award,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  FileCheck2,
  AlertTriangle,
  Flame,
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
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
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs space-y-3">
        <div className="text-slate-500 font-bold">Interview record not found.</div>
        <button
          onClick={() => navigate('/interviewer')}
          className="text-blue-600 font-semibold hover:underline"
        >
          &larr; Return to Interviewer Dashboard
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
        message: `Interview status changed to ${status.replace('_', ' ')}.`,
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
        title: 'Official Evaluation Recorded!',
        message: `Evaluation submitted with outcome: ${outcome}. Candidate journey updated.`,
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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Live Status:</span>
          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
            {interview.interviewStatus.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Main Grid: Candidate Context & Workspace (Left 1 col, Right 2 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Student Profile & Verification Audit */}
        <div className="space-y-6">
          {/* Candidate Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-900 text-white font-extrabold text-sm flex items-center justify-center">
                {student.user.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">{student.user.fullName}</h3>
                <div className="text-xs text-slate-500 font-mono">{student.studentCode}</div>
              </div>
            </div>

            <div className="divide-y divide-slate-100 text-xs text-slate-600">
              <div className="py-2 flex justify-between">
                <span>College</span>
                <span className="font-semibold text-slate-900">{student.college}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span>Batch & Year</span>
                <span className="font-semibold text-slate-900">{student.batch} ({student.academicYear})</span>
              </div>
              <div className="py-2 flex justify-between">
                <span>GRIT Miles</span>
                <span className="font-bold text-amber-600 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  {student.milesEarned.toLocaleString()}
                </span>
              </div>
              <div className="py-2 flex justify-between">
                <span>Qualiflyer Rank</span>
                <span className="font-bold text-slate-900">#{student.qualiflyerRank}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span>Attempt Number</span>
                <span className="font-bold text-blue-600">#{interview.attemptNumber} of 3</span>
              </div>
            </div>

            {/* Attendance Quick Controls (Part 5.3 Screen 12) */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Attendance Controls</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleUpdateStatus('STUDENT_CHECKED_IN')}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700"
                >
                  Checked In
                </button>
                <button
                  onClick={() => handleUpdateStatus('IN_PROGRESS')}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold"
                >
                  In Progress
                </button>
                <button
                  onClick={() => handleUpdateStatus('COMPLETED')}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold"
                >
                  Mark Completed
                </button>
                <button
                  onClick={() => handleUpdateStatus('NO_SHOW')}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold"
                >
                  Mark No Show
                </button>
              </div>
            </div>

            {/* Online Room Link */}
            <div className="pt-2">
              <a
                href={interview.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition shadow"
              >
                Launch Live Room <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Verified Skill Requirements Checklist */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Badge Criteria Rubric & Prerequisite Skills
            </h4>
            <div className="divide-y divide-slate-100 text-xs">
              {requirements.map((req) => {
                const prog = skills.find((s) => s.skillId === req.skillId);
                const isDone = prog?.completionStatus === 'COMPLETED';

                return (
                  <div key={req.id} className="py-2.5 flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900">{req.skillName}</div>
                      <div className="text-[11px] text-slate-400">{req.description}</div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded shrink-0">
                      Score: {prog?.score || 85}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Screen 13 Evaluation Form (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-0.5">
                  Part 5.3 — Screen 13
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Structured Evaluation Form</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Target Badge: <strong>{badge.name}</strong> ({track.name})
                </p>
              </div>

              {existingEval && (
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Evaluation Immutable & Saved
                </span>
              )}
            </div>

            {/* Outcome Selection (Pass, Fail, Retake Later) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Official Interview Outcome *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'PASS',
                    label: 'Pass',
                    desc: 'Clear benchmarks; trigger official Track Badge award.',
                    activeClass: 'border-emerald-500 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500',
                  },
                  {
                    id: 'RETAKE_LATER',
                    label: 'Retake Later',
                    desc: 'Promising foundation; candidate requires cooldown prep.',
                    activeClass: 'border-amber-500 bg-amber-50/70 text-amber-950 ring-2 ring-amber-500',
                  },
                  {
                    id: 'FAIL',
                    label: 'Fail',
                    desc: 'Unsatisfactory performance across mandatory rubric.',
                    activeClass: 'border-rose-500 bg-rose-50/70 text-rose-950 ring-2 ring-rose-500',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!!existingEval}
                    onClick={() => setOutcome(item.id as EvaluationOutcome)}
                    className={`p-3.5 rounded-xl border text-left transition ${
                      outcome === item.id
                        ? item.activeClass
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="font-extrabold text-sm">{item.label}</div>
                    <div className="text-[11px] opacity-80 mt-1 leading-snug">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Rubric Score Sliders (1 to 5) */}
            <div className="space-y-4 pt-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Evaluation Rubric Scores (Scale 1.0 to 5.0)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Problem Solving & Algorithmic Rigor</span>
                    <span className="text-blue-600 font-mono text-sm">{problemSolvingScore} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    disabled={!!existingEval}
                    value={problemSolvingScore}
                    onChange={(e) => setProblemSolvingScore(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Conceptual Understanding</span>
                    <span className="text-blue-600 font-mono text-sm">{conceptualUnderstandingScore} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    disabled={!!existingEval}
                    value={conceptualUnderstandingScore}
                    onChange={(e) => setConceptualUnderstandingScore(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Communication & Architectural Defense</span>
                    <span className="text-blue-600 font-mono text-sm">{communicationScore} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    disabled={!!existingEval}
                    value={communicationScore}
                    onChange={(e) => setCommunicationScore(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Practical Code Implementation</span>
                    <span className="text-blue-600 font-mono text-sm">{practicalCodingScore} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    disabled={!!existingEval}
                    value={practicalCodingScore}
                    onChange={(e) => setPracticalCodingScore(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Assessment Notes */}
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Technical Assessment Analysis *
                </label>
                <textarea
                  rows={3}
                  disabled={!!existingEval}
                  value={technicalAssessment}
                  onChange={(e) => setTechnicalAssessment(e.target.value)}
                  placeholder="Detail the candidate's understanding of attention mechanisms, token costs, evaluation metrics..."
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Student-Facing Feedback (CRITICAL SEPARATION) */}
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-blue-600" />
                    Student-Facing Constructive Feedback (Visible to Candidate) *
                  </span>
                  <span className="text-[10px] uppercase font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                    Public to Student
                  </span>
                </div>
                <textarea
                  rows={3}
                  disabled={!!existingEval}
                  value={studentFeedback}
                  onChange={(e) => setStudentFeedback(e.target.value)}
                  placeholder="Constructive feedback to guide student preparation and acknowledge strengths..."
                  className="w-full border border-blue-200 rounded-xl p-3 text-xs bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Private Reviewer Notes (CRITICAL: NEVER EXPOSED TO STUDENT) */}
              <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-950">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-amber-700" />
                    Private Reviewer Notes (Strictly Confidential — Admins & Evaluators Only) *
                  </span>
                  <span className="text-[10px] uppercase font-bold text-amber-800 bg-white px-2 py-0.5 rounded border border-amber-200">
                    Internal Only
                  </span>
                </div>
                <textarea
                  rows={3}
                  disabled={!!existingEval}
                  value={privateNotes}
                  onChange={(e) => setPrivateNotes(e.target.value)}
                  placeholder="Confidential notes on integrity, hesitation, percentile placement, or retake focus areas..."
                  className="w-full border border-amber-200 rounded-xl p-3 text-xs bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Submission CTA */}
            {!existingEval && (
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] text-slate-500 max-w-sm">
                  Clicking submit prompts a confirmation modal. Once committed, evaluations are immutable except through administrative audit correction.
                </div>

                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow"
                >
                  Review & Submit Official Evaluation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal (Part 5.3 Screen 13 requirement) */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-blue-600" />
              Confirm Official Evaluation Submission
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              You are recording an official assessment outcome of{' '}
              <strong className="text-slate-900 uppercase underline">{outcome.replace('_', ' ')}</strong> for candidate{' '}
              <strong>{student.user.fullName}</strong>.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-600">
              <div>&bull; Badge Award: {outcome === 'PASS' ? 'Will be formally processed & awarded' : 'No badge issued'}</div>
              <div>&bull; Retake Policy: {outcome === 'RETAKE_LATER' ? '7-day preparation cooldown enforced' : 'N/A'}</div>
              <div>&bull; Immutability: Stored with append-only cryptographic audit record</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Go Back & Edit
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Recording Outcome...' : 'Confirm Official Submission'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
