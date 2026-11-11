import React, { useState, useEffect } from 'react';
import { useAuth } from '../../app/providers/AuthContext';
import { repository } from '../../services/api/repository';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  UserCheck,
  FileCheck2,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  TrendingUp,
  Award,
} from 'lucide-react';

export const InterviewerDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [, setTick] = useState(0);

  useEffect(() => {
    return repository.subscribe(() => setTick((t) => t + 1));
  }, []);

  const interviewer = repository.getInterviewerByUserId(currentUser.id) || repository.getInterviewers()[0];
  const allInterviews = repository.getInterviews().filter((i) => i.interviewerId === interviewer.id);

  // Today is 2026-11-11
  const todayStr = '2026-11-11';
  const todaysInterviews = allInterviews.filter((i) => i.scheduledStart.startsWith(todayStr));
  const upcomingInterviews = allInterviews.filter((i) => {
    return (
      (i.interviewStatus === 'SCHEDULED' || i.interviewStatus === 'IN_PROGRESS') &&
      i.scheduledStart >= todayStr
    );
  });
  const completedInterviews = allInterviews.filter((i) => i.interviewStatus === 'COMPLETED');
  const pendingEvaluations = allInterviews.filter((i) => {
    return i.interviewStatus === 'COMPLETED' && !repository.getEvaluationForInterview(i.id);
  });

  const slots = repository.getSlots({ interviewerId: interviewer.id });
  const availability = repository.getAvailability(interviewer.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              Part 5.3 — Screen 9 &bull; Interviewer Workspace
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Welcome, {currentUser.fullName}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {interviewer.title} &bull; Specialization: {interviewer.specialization.join(', ')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/interviewer/availability"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow"
            >
              Configure Working Hours
            </Link>
            <Link
              to="/interviewer/schedule"
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
            >
              Full Calendar
            </Link>
          </div>
        </div>
      </div>

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs text-slate-500 font-medium">Today's Interviews</div>
          <div className="text-2xl font-black text-slate-900">{todaysInterviews.length}</div>
          <div className="text-[11px] text-blue-600 font-medium">Scheduled for today</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs text-slate-500 font-medium">Upcoming Bookings</div>
          <div className="text-2xl font-black text-blue-600">{upcomingInterviews.length}</div>
          <div className="text-[11px] text-slate-400">Total future sessions</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs text-slate-500 font-medium">Pending Evaluations</div>
          <div className={`text-2xl font-black ${pendingEvaluations.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {pendingEvaluations.length}
          </div>
          <div className="text-[11px] text-amber-600 font-medium">Requires outcome recording</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs text-slate-500 font-medium">Completed Evaluations</div>
          <div className="text-2xl font-black text-emerald-600">{completedInterviews.length}</div>
          <div className="text-[11px] text-slate-400">Lifetime assessed</div>
        </div>
      </div>

      {/* Pending Evaluations Alert (Action Needed) */}
      {pendingEvaluations.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
            <AlertCircle className="w-4 h-4 text-amber-700" />
            Action Required: Pending Candidate Evaluations
          </div>
          <p className="text-xs text-amber-950">
            You have completed interview sessions awaiting official evaluation submission. Please fill the rubric scores to release student results.
          </p>

          <div className="divide-y divide-amber-200/60 border border-amber-200 rounded-xl bg-white/80 overflow-hidden">
            {pendingEvaluations.map((p) => (
              <div key={p.id} className="p-3.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900">{p.studentBadgeJourney.student.user.fullName}</span>
                  <span className="text-slate-500 mx-2">&bull;</span>
                  <span className="text-slate-600">{p.studentBadgeJourney.badge.name}</span>
                </div>
                <Link
                  to={`/interviewer/workspace/${p.id}`}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition"
                >
                  Submit Evaluation &rarr;
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Today's Schedule & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Today's Agenda (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Today's Interview Schedule</h3>
            <span className="text-xs text-slate-500">{new Date(todayStr).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </div>

          {todaysInterviews.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
              No interview sessions booked for today.
            </div>
          ) : (
            <div className="space-y-3">
              {todaysInterviews.map((intv) => {
                const evalObj = repository.getEvaluationForInterview(intv.id);
                return (
                  <div
                    key={intv.id}
                    className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">
                          {new Date(intv.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' – '}
                          {new Date(intv.scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          {intv.interviewStatus.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-slate-800">
                        {intv.studentBadgeJourney.student.user.fullName} &bull; {intv.studentBadgeJourney.student.studentCode}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {intv.studentBadgeJourney.badge.name} (Attempt #{intv.attemptNumber})
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={intv.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 transition"
                      >
                        Join Room <ExternalLink className="w-3 h-3" />
                      </a>

                      <Link
                        to={`/interviewer/workspace/${intv.id}`}
                        className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition"
                      >
                        {evalObj ? 'View Evaluation' : 'Open Workspace'}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Workload & Availability Preview */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-900">Weekly Workload Distribution</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Configured Weekly Days</span>
                <span className="font-bold text-slate-900">{availability.length} Days</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Daily Max Capacity</span>
                <span className="font-bold text-slate-900">{interviewer.maxInterviewsPerDay} Interviews</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Open Bookable Slots</span>
                <span className="font-bold text-emerald-600">{slots.filter((s) => s.status === 'AVAILABLE').length} Slots</span>
              </div>
            </div>

            <Link
              to="/interviewer/availability"
              className="w-full inline-flex items-center justify-center text-xs font-bold text-blue-600 hover:text-blue-800 py-1 transition"
            >
              Modify Working Hours & Exceptions &rarr;
            </Link>
          </div>

          <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 text-xs text-slate-600 space-y-2">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-600" />
              Role Permission Guard
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Evaluator permissions are strictly isolated. You can only view and evaluate students assigned to your calendar. Submitted evaluations are cryptographically logged and immutable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
