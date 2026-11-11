import React, { useState, useEffect } from 'react';
import { useAuth } from '../../app/providers/AuthContext';
import { repository } from '../../services/api/repository';
import { Link } from 'react-router-dom';
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

export const StudentHome: React.FC = () => {
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

  const requirements = repository.getBadgeRequirements(badge?.id || 'badge-1');
  const skills = repository.getStudentSkills(student?.id || 'stu-1');

  // Calculate skill stats
  const completedSkills = requirements.filter((req) => {
    const prog = skills.find((s) => s.skillId === req.skillId);
    return prog?.completionStatus === 'COMPLETED';
  });

  const completionPct = requirements.length > 0
    ? Math.round((completedSkills.length / requirements.length) * 100)
    : 0;

  // Check interviews
  const studentInterviews = repository
    .getInterviews()
    .filter((i) => i.studentBadgeJourneyId === primaryJourney?.id);

  const activeInterview = studentInterviews.find(
    (i) => i.bookingStatus === 'BOOKED' && (i.interviewStatus === 'SCHEDULED' || i.interviewStatus === 'IN_PROGRESS')
  );

  const completedInterview = studentInterviews.find(
    (i) => i.interviewStatus === 'COMPLETED'
  );

  const evaluation = completedInterview ? repository.getEvaluationForInterview(completedInterview.id) : undefined;

  // Determine Dynamic Next Step CTA
  let ctaConfig = {
    title: 'Complete your remaining skills',
    desc: 'You have incomplete mandatory skill milestones for this Track Badge.',
    buttonLabel: 'View Skill Requirements',
    buttonLink: '/badge-eligibility',
    buttonColor: 'bg-zinc-900 hover:bg-zinc-800 text-white',
    badgeVariant: 'bg-zinc-100 text-zinc-700',
  };

  if (primaryJourney?.badgeStatus === 'NULLIFIED') {
    ctaConfig = {
      title: 'Badge Nullified: Review Official Notice',
      desc: 'Academic integrity sanction in effect. Historical attempt data preserved.',
      buttonLabel: 'View Sanction Details',
      buttonLink: '/badge-status',
      buttonColor: 'bg-zinc-900 hover:bg-zinc-800 text-white',
      badgeVariant: 'bg-rose-50 text-rose-700 border border-rose-200/60',
    };
  } else if (primaryJourney?.badgeStatus === 'UNDER_REVIEW') {
    ctaConfig = {
      title: 'Badge Under Administrative Review',
      desc: 'Routine verification inquiry is pending. The review committee will conclude shortly.',
      buttonLabel: 'View Review Status',
      buttonLink: '/badge-status',
      buttonColor: 'bg-zinc-900 hover:bg-zinc-800 text-white',
      badgeVariant: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    };
  } else if (primaryJourney?.badgeStatus === 'AWARDED' || primaryJourney?.badgeStatus === 'REINSTATED') {
    ctaConfig = {
      title: 'Track Badge Cleared & Awarded',
      desc: 'You passed your live technical evaluation and earned this verified credential.',
      buttonLabel: 'View Credential',
      buttonLink: '/badge-status',
      buttonColor: 'bg-zinc-900 hover:bg-zinc-800 text-white',
      badgeVariant: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    };
  } else if (activeInterview) {
    ctaConfig = {
      title: 'Live Interview Scheduled',
      desc: `Confirmed for ${new Date(activeInterview.scheduledStart).toLocaleDateString()} with ${activeInterview.interviewer.user.fullName}.`,
      buttonLabel: 'View Session Details',
      buttonLink: '/my-interviews',
      buttonColor: 'bg-zinc-900 hover:bg-zinc-800 text-white',
      badgeVariant: 'bg-zinc-100 text-zinc-700 border border-zinc-200/60',
    };
  } else if (completedInterview && !evaluation) {
    ctaConfig = {
      title: 'Interview Concluded: Evaluation Pending',
      desc: 'Your live session has completed. The evaluator is finalizing official rubric scores.',
      buttonLabel: 'Check Status',
      buttonLink: '/my-interviews',
      buttonColor: 'bg-zinc-900 hover:bg-zinc-800 text-white',
      badgeVariant: 'bg-zinc-100 text-zinc-700 border border-zinc-200/60',
    };
  } else if (evaluation?.outcome === 'RETAKE_LATER') {
    ctaConfig = {
      title: 'Retake Cooldown Active',
      desc: 'Review feedback from your prior attempt. Re-booking unlocks following cooldown period.',
      buttonLabel: 'Review Feedback',
      buttonLink: '/badge-status',
      buttonColor: 'bg-zinc-900 hover:bg-zinc-800 text-white',
      badgeVariant: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    };
  } else if (primaryJourney?.eligibilityStatus === 'ELIGIBLE') {
    ctaConfig = {
      title: "Interview Eligibility Confirmed",
      desc: "All mandatory skills verified. Book your 45-minute live technical session.",
      buttonLabel: 'Book Interview Now',
      buttonLink: '/book-interview',
      buttonColor: 'bg-zinc-900 hover:bg-zinc-800 text-white',
      badgeVariant: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    };
  }

  return (
    <div className="space-y-6">
      {/* Candidate Profile Header Card */}
      <div className="bg-white rounded-xl border border-zinc-200/80 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200/60">
                {student?.studentCode || 'NIAT-2026-0101'}
              </span>
              <span className="text-xs text-zinc-500 font-medium">
                {student?.college || 'NIAT'} • {student?.batch || '2023-2027'}
              </span>
            </div>
            <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">
              {currentUser.fullName}
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Track: <span className="text-zinc-800 font-medium">{track?.name}</span> • Target: <span className="text-zinc-800 font-medium">{badge?.name}</span>
            </p>
          </div>

          <div className="flex items-center gap-4 border border-zinc-200/60 bg-zinc-50/60 px-4 py-2.5 rounded-lg">
            <div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">GRIT Miles</div>
              <div className="text-base font-semibold text-zinc-900">
                {student?.milesEarned.toLocaleString() || '4,850'}
              </div>
            </div>
            <div className="w-px h-6 bg-zinc-200"></div>
            <div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Qualiflyer</div>
              <div className="text-base font-semibold text-zinc-900">
                #{student?.qualiflyerRank || 12}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Part 7 Exact Message 1 Banner if Eligible and not booked */}
      {primaryJourney?.eligibilityStatus === 'ELIGIBLE' && !activeInterview && primaryJourney.badgeStatus === 'NOT_EARNED' && (
        <div className="bg-white rounded-xl p-5 border border-zinc-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>You're eligible for your interview!</span>
              </div>
              <p className="text-xs text-zinc-700 leading-relaxed max-w-2xl pt-1">
                "Congratulations! You've completed all requirements for your Intermediate Track Badge. You are now eligible to book your live interview with our technical panel. This 45-minute conversation will evaluate your problem-solving approach and project architecture. Slots are available on a first-come, first-served basis."
              </p>
              <div className="pt-2">
                <Link
                  to="/book-interview"
                  className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                  Book Interview <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Part 7 Exact Message 3 Banner if Passed & Awarded */}
      {(primaryJourney?.badgeStatus === 'AWARDED' || primaryJourney?.badgeStatus === 'REINSTATED') && (
        <div className="bg-white rounded-xl p-5 border border-zinc-200/80 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 text-zinc-900">
              <Award className="w-4 h-4" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Cleared your interview!
              </div>
              <p className="text-xs text-zinc-700 leading-relaxed max-w-2xl">
                "Congratulations! You have successfully passed your Track Badge interview. Your Specialist Badge has been awarded and your achievement has been recorded on your profile. Keep pushing forward in the GRIT competition!"
              </p>
              <div className="pt-1">
                <Link
                  to="/badge-status"
                  className="text-xs text-zinc-900 font-medium hover:underline inline-flex items-center gap-1"
                >
                  View official certificate and verification details &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Next Milestone Action Card */}
      <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${ctaConfig.badgeVariant}`}>
              Next Milestone Step
            </span>
          </div>
          <h2 className="text-sm font-semibold text-zinc-950">{ctaConfig.title}</h2>
          <p className="text-xs text-zinc-500">{ctaConfig.desc}</p>
        </div>
        <Link
          to={ctaConfig.buttonLink}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium text-xs transition-colors shrink-0 ${ctaConfig.buttonColor}`}
        >
          {ctaConfig.buttonLabel} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Grid: Skill Progression & Active Session */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Skill Progression (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-950">Track Skill Progression</h3>
              <p className="text-xs text-zinc-500">
                {completedSkills.length} of {requirements.length} mandatory skills verified
              </p>
            </div>
            <span className="text-xs font-mono font-medium text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200/60">
              {completionPct}% Complete
            </span>
          </div>

          {/* Minimalist Progress Track */}
          <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-zinc-900 transition-all duration-300 rounded-full"
              style={{ width: `${completionPct}%` }}
            />
          </div>

          {/* Skill List */}
          <div className="space-y-2 pt-1 divide-y divide-zinc-100">
            {requirements.map((req) => {
              const prog = skills.find((s) => s.skillId === req.skillId);
              const isDone = prog?.completionStatus === 'COMPLETED';

              return (
                <div
                  key={req.id}
                  className="flex items-center justify-between pt-2.5 first:pt-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-zinc-400">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-zinc-300" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-zinc-900">{req.skillName}</div>
                      <div className="text-[11px] text-zinc-500">{req.description}</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {isDone ? (
                      <span className="text-[11px] font-mono font-medium text-zinc-900 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200/60">
                        {prog.score}%
                      </span>
                    ) : (
                      <span className="text-[11px] text-zinc-400">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 text-right">
            <Link
              to="/badge-eligibility"
              className="text-xs text-zinc-600 hover:text-zinc-900 font-medium inline-flex items-center gap-1"
            >
              View detailed criteria & score thresholds &rarr;
            </Link>
          </div>
        </div>

        {/* Right: Active Interview / Summary Card */}
        <div className="space-y-4">
          {activeInterview ? (
            <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-900">Upcoming Live Session</span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  Confirmed
                </span>
              </div>

              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/60 text-xs space-y-1">
                <div className="font-medium text-zinc-900">{badge?.name}</div>
                <div className="text-zinc-600 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  {new Date(activeInterview.scheduledStart).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                  {' at '}
                  {new Date(activeInterview.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-zinc-500 text-[11px]">
                  Evaluator: {activeInterview.interviewer.user.fullName}
                </div>
              </div>

              <div className="space-y-2">
                <a
                  href={activeInterview.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs py-2 rounded-lg transition-colors"
                >
                  Join Meeting Room <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <Link
                  to="/my-interviews"
                  className="w-full inline-flex items-center justify-center text-zinc-600 hover:text-zinc-900 text-xs font-medium py-1.5 transition-colors border border-zinc-200/80 rounded-lg"
                >
                  Manage Booking
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs space-y-3">
              <span className="text-xs font-medium text-zinc-900">Badge Status</span>
              <div className="p-4 bg-zinc-50/50 rounded-lg border border-zinc-200/60 text-center space-y-1.5">
                <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-700 mx-auto flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div className="font-medium text-xs text-zinc-900">{badge?.name}</div>
                <div className="text-[11px] text-zinc-500 capitalize">
                  {primaryJourney?.badgeStatus.replace('_', ' ').toLowerCase()}
                </div>
              </div>

              <Link
                to="/badge-status"
                className="w-full inline-flex items-center justify-center text-xs text-zinc-600 hover:text-zinc-900 font-medium py-1 transition-colors"
              >
                View Credential History &rarr;
              </Link>
            </div>
          )}

          {/* Quick Guide Card */}
          <div className="bg-white rounded-xl border border-zinc-200/80 p-4 text-xs text-zinc-600 space-y-1.5 shadow-xs">
            <div className="font-medium text-zinc-900 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
              Interview Evaluation Scope
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-500">
              During the 45-minute live technical session, the evaluator will assess problem decomposition, code quality, and edge case resilience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
