import React, { useState, useEffect } from 'react';
import { useAuth } from '../../app/providers/AuthContext';
import { repository } from '../../services/api/repository';
import { Link, useNavigate } from 'react-router-dom';
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  Flame,
  ChevronRight,
  Sparkles,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

export const StudentHome: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [, setTick] = useState(0);

  useEffect(() => {
    return repository.subscribe(() => setTick((t) => t + 1));
  }, []);

  const student = repository.getStudentByUserId(currentUser.id);
  const journeys = repository.getJourneys().filter((j) => j.studentId === student?.id);
  // Main journey for student (Badge 1: AI Foundations & Prompting)
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

  const pendingSkills = requirements.filter((req) => {
    const prog = skills.find((s) => s.skillId === req.skillId);
    return prog?.completionStatus !== 'COMPLETED';
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

  // Determine Dynamic CTA (Part 5.2 Screen 1 requirement)
  let ctaConfig = {
    title: 'Complete your remaining skills',
    desc: 'You have incomplete required skill milestones for this Track Badge.',
    buttonLabel: 'View Skill Requirements',
    buttonLink: '/badge-eligibility',
    buttonColor: 'bg-slate-900 hover:bg-slate-800 text-white',
    badgeVariant: 'bg-slate-100 text-slate-700',
  };

  if (primaryJourney?.badgeStatus === 'NULLIFIED') {
    ctaConfig = {
      title: 'Badge Nullified: Review Official Notice',
      desc: 'Academic integrity sanction in effect. Historical attempt data preserved.',
      buttonLabel: 'View Sanction Details',
      buttonLink: '/badge-status',
      buttonColor: 'bg-rose-700 hover:bg-rose-800 text-white',
      badgeVariant: 'bg-rose-100 text-rose-800',
    };
  } else if (primaryJourney?.badgeStatus === 'UNDER_REVIEW') {
    ctaConfig = {
      title: 'Badge Under Administrative Review',
      desc: 'Verification inquiry is pending. Our review committee will update you shortly.',
      buttonLabel: 'View Review Status',
      buttonLink: '/badge-status',
      buttonColor: 'bg-amber-600 hover:bg-amber-700 text-white',
      badgeVariant: 'bg-amber-100 text-amber-800',
    };
  } else if (primaryJourney?.badgeStatus === 'AWARDED' || primaryJourney?.badgeStatus === 'REINSTATED') {
    ctaConfig = {
      title: 'Congratulations! Track Badge Awarded',
      desc: 'You cleared your live interview and earned the verified Track Badge!',
      buttonLabel: 'View Your Badge',
      buttonLink: '/badge-status',
      buttonColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      badgeVariant: 'bg-emerald-100 text-emerald-800',
    };
  } else if (activeInterview) {
    ctaConfig = {
      title: 'Live Interview Booked & Confirmed',
      desc: `Scheduled for ${new Date(activeInterview.scheduledStart).toLocaleDateString()} with ${activeInterview.interviewer.user.fullName}.`,
      buttonLabel: 'View Interview Details',
      buttonLink: '/my-interviews',
      buttonColor: 'bg-blue-600 hover:bg-blue-700 text-white',
      badgeVariant: 'bg-blue-100 text-blue-800',
    };
  } else if (completedInterview && !evaluation) {
    ctaConfig = {
      title: 'Interview Evaluation Pending',
      desc: 'Your interview concluded recently. The interviewer is finalizing your evaluation scores.',
      buttonLabel: 'View Interview Status',
      buttonLink: '/my-interviews',
      buttonColor: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      badgeVariant: 'bg-indigo-100 text-indigo-800',
    };
  } else if (evaluation?.outcome === 'RETAKE_LATER') {
    ctaConfig = {
      title: 'Retake Required: Cooldown Active',
      desc: 'Review feedback from your previous attempt. Re-booking unlocks following cooldown period.',
      buttonLabel: 'Check Retake Eligibility',
      buttonLink: '/badge-status',
      buttonColor: 'bg-amber-600 hover:bg-amber-700 text-white',
      badgeVariant: 'bg-amber-100 text-amber-800',
    };
  } else if (primaryJourney?.eligibilityStatus === 'ELIGIBLE') {
    ctaConfig = {
      title: "You're eligible for your interview!",
      desc: "All required skills are completed. Book your 45-minute live interview slot with an expert evaluator.",
      buttonLabel: 'Book Interview Now',
      buttonLink: '/book-interview',
      buttonColor: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
      badgeVariant: 'bg-emerald-100 text-emerald-800',
    };
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {student?.studentCode || 'NIAT-2026-0101'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {student?.college || 'NIAT Hyderabad'} &bullet; {student?.batch || '2023-2027'}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {currentUser.fullName}
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Track: <strong className="text-slate-800">{track?.name}</strong> &mdash; Target Badge:{' '}
              <strong className="text-blue-600">{badge?.name}</strong>
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <div className="text-right">
              <div className="text-xs text-slate-500 font-medium">GRIT Miles</div>
              <div className="text-xl font-black text-amber-600 flex items-center gap-1 justify-end">
                <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
                {student?.milesEarned.toLocaleString() || '4,850'}
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="text-right">
              <div className="text-xs text-slate-500 font-medium">Qualiflyer Rank</div>
              <div className="text-xl font-black text-slate-900">
                #{student?.qualiflyerRank || 12}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Part 7 Exact Message 1 Banner if Eligible and not booked */}
      {primaryJourney?.eligibilityStatus === 'ELIGIBLE' && !activeInterview && primaryJourney.badgeStatus === 'NOT_EARNED' && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-6 text-white shadow-md border border-blue-800 animate-in fade-in-50">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="inline-block text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-700/70 text-blue-200">
                Official Eligibility Notification
              </div>
              <h2 className="text-xl font-bold tracking-tight">You're eligible for your interview!</h2>
              <p className="text-sm text-blue-100 leading-relaxed max-w-2xl">
                "Congratulations! You've completed all required skills for the {track?.name} – {badge?.name} badge. You're now eligible to book your interview. Choose an available time slot to take the next step towards earning your badge."
              </p>
              <div className="pt-2">
                <Link
                  to="/book-interview"
                  className="inline-flex items-center gap-2 bg-white text-blue-900 hover:bg-blue-50 px-5 py-2.5 rounded-xl font-bold text-sm transition shadow"
                >
                  Book Interview <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic CTA Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${ctaConfig.badgeVariant}`}>
              Next Milestone Step
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900">{ctaConfig.title}</h3>
          <p className="text-sm text-slate-500">{ctaConfig.desc}</p>
        </div>
        <Link
          to={ctaConfig.buttonLink}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition shrink-0 ${ctaConfig.buttonColor}`}
        >
          {ctaConfig.buttonLabel} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Grid: Skill Progression & Upcoming Interview Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Skill Progression (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Track Badge Skill Progression</h3>
              <p className="text-xs text-slate-500">
                {badge?.name} &bull; {completedSkills.length} of {requirements.length} skills verified
              </p>
            </div>
            <span className="text-sm font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
              {completionPct}% Complete
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                completionPct === 100 ? 'bg-emerald-500' : 'bg-blue-600'
              }`}
              style={{ width: `${completionPct}%` }}
            />
          </div>

          {/* Skill List */}
          <div className="space-y-3 pt-2">
            {requirements.map((req) => {
              const prog = skills.find((s) => s.skillId === req.skillId);
              const isDone = prog?.completionStatus === 'COMPLETED';

              return (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 transition bg-slate-50/50"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{req.skillName}</div>
                      <div className="text-[11px] text-slate-500">{req.description}</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {isDone ? (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        Score: {prog.score}%
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-md">
                        {prog?.completionStatus === 'IN_PROGRESS' ? 'In Progress' : 'Pending'}
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
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
            >
              View detailed criteria & verification breakdown <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right: Active Interview or Previous Status Card */}
        <div className="space-y-6">
          {/* Active Interview Card */}
          {activeInterview ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">Upcoming Live Interview</h4>
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Confirmed
                </span>
              </div>

              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 text-xs space-y-1.5">
                <div className="font-semibold text-blue-950">{badge?.name}</div>
                <div className="text-blue-800 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(activeInterview.scheduledStart).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                  {' at '}
                  {new Date(activeInterview.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-blue-700 text-[11px]">Evaluator: {activeInterview.interviewer.user.fullName}</div>
              </div>

              <div className="space-y-2">
                <a
                  href={activeInterview.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl transition"
                >
                  Join Online Room <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <Link
                  to="/my-interviews"
                  className="w-full inline-flex items-center justify-center text-slate-600 hover:text-slate-900 text-xs font-semibold py-2 transition"
                >
                  Manage / Reschedule Booking
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-900">Badge Status Summary</h4>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-600 mx-auto flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
                <div className="font-bold text-sm text-slate-900">{badge?.name}</div>
                <div className="text-xs text-slate-500">
                  Status:{' '}
                  <span className="font-bold uppercase tracking-wider text-slate-800">
                    {primaryJourney?.badgeStatus.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <Link
                to="/badge-status"
                className="w-full inline-flex items-center justify-center text-xs font-semibold text-blue-600 hover:text-blue-800 py-1 transition"
              >
                View Full Badge History & Audits &rarr;
              </Link>
            </div>
          )}

          {/* Quick Help Card */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 text-xs text-slate-600 space-y-2">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Interview Preparation Checklist
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              During the 45-minute live interview, your evaluator will test conceptual clarity, inspect your code repository, and review problem-solving methodology. Ensure a functional camera and microphone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
