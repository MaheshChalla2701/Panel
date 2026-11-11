import React, { useState, useEffect } from 'react';
import { useAuth } from '../../app/providers/AuthContext';
import { repository } from '../../services/api/repository';
import { Link } from 'react-router-dom';
import {
  Clock,
  ExternalLink,
  AlertCircle,
  UserCheck,
} from 'lucide-react';

export const InterviewerDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [, setTick] = useState(0);

  useEffect(() => {
    return repository.subscribe(() => setTick((t) => t + 1));
  }, []);

  const interviewer = repository.getInterviewerByUserId(currentUser.id) || repository.getInterviewers()[0];
  const allInterviews = repository.getInterviews().filter((i) => i.interviewerId === interviewer.id);

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
      <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-zinc-950 tracking-tight">
              {currentUser.fullName}
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              {interviewer.title} • {interviewer.specialization.join(', ')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/interviewer/availability"
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition-colors shadow-xs"
            >
              Working Hours
            </Link>
            <Link
              to="/interviewer/schedule"
              className="px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-medium text-xs transition-colors"
            >
              Schedule
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs space-y-1">
          <div className="text-[11px] text-zinc-400 font-medium">Today's Sessions</div>
          <div className="text-xl font-semibold text-zinc-950">{todaysInterviews.length}</div>
          <div className="text-[10px] text-zinc-500">Scheduled today</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs space-y-1">
          <div className="text-[11px] text-zinc-400 font-medium">Upcoming Bookings</div>
          <div className="text-xl font-semibold text-zinc-950">{upcomingInterviews.length}</div>
          <div className="text-[10px] text-zinc-500">Future candidates</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs space-y-1">
          <div className="text-[11px] text-zinc-400 font-medium">Pending Evaluations</div>
          <div className="text-xl font-semibold text-zinc-950">{pendingEvaluations.length}</div>
          <div className="text-[10px] text-zinc-500">Awaiting rubric submission</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs space-y-1">
          <div className="text-[11px] text-zinc-400 font-medium">Completed Evaluations</div>
          <div className="text-xl font-semibold text-zinc-950">{completedInterviews.length}</div>
          <div className="text-[10px] text-zinc-500">Total verified</div>
        </div>
      </div>

      {/* Pending Evaluations Alert */}
      {pendingEvaluations.length > 0 && (
        <div className="bg-white border border-zinc-200/80 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-900">
            <AlertCircle className="w-4 h-4 text-zinc-500" />
            <span>Pending Candidate Evaluations ({pendingEvaluations.length})</span>
          </div>
          <p className="text-xs text-zinc-500">
            The following completed sessions require official rubric evaluation scores.
          </p>

          <div className="divide-y divide-zinc-100 border border-zinc-200/80 rounded-lg overflow-hidden">
            {pendingEvaluations.map((p) => (
              <div key={p.id} className="p-3 bg-white flex items-center justify-between text-xs">
                <div>
                  <span className="font-medium text-zinc-950">{p.studentBadgeJourney.student.user.fullName}</span>
                  <span className="text-zinc-300 mx-2">•</span>
                  <span className="text-zinc-500">{p.studentBadgeJourney.badge.name}</span>
                </div>
                <Link
                  to={`/interviewer/workspace/${p.id}`}
                  className="px-3 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition-colors shadow-xs"
                >
                  Submit Evaluation &rarr;
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Today's Schedule & Quick Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Today's Agenda (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
              Today's Schedule
            </h3>
            <span className="text-xs text-zinc-400">
              {new Date(todayStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>

          {todaysInterviews.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400 bg-zinc-50 rounded-lg border border-zinc-200/60">
              No interview sessions booked for today.
            </div>
          ) : (
            <div className="space-y-2">
              {todaysInterviews.map((intv) => {
                const evalObj = repository.getEvaluationForInterview(intv.id);
                return (
                  <div
                    key={intv.id}
                    className="p-3.5 rounded-lg border border-zinc-200/80 bg-white hover:border-zinc-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-950 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          {new Date(intv.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' – '}
                          {new Date(intv.scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200/60">
                          {intv.interviewStatus.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="text-xs font-medium text-zinc-800">
                        {intv.studentBadgeJourney.student.user.fullName} • {intv.studentBadgeJourney.student.studentCode}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        {intv.studentBadgeJourney.badge.name} (Attempt #{intv.attemptNumber})
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={intv.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-medium flex items-center gap-1 transition-colors"
                      >
                        Room <ExternalLink className="w-3 h-3 text-zinc-400" />
                      </a>

                      <Link
                        to={`/interviewer/workspace/${intv.id}`}
                        className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors shadow-xs"
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
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
              Workload & Capacity
            </h4>
            <div className="space-y-2 text-xs divide-y divide-zinc-100">
              <div className="flex justify-between pt-1 text-zinc-600">
                <span>Working Days</span>
                <span className="font-medium text-zinc-900">{availability.length} Days</span>
              </div>
              <div className="flex justify-between pt-2 text-zinc-600">
                <span>Daily Max Capacity</span>
                <span className="font-medium text-zinc-900">{interviewer.maxInterviewsPerDay} Interviews</span>
              </div>
              <div className="flex justify-between pt-2 text-zinc-600">
                <span>Open Bookable Slots</span>
                <span className="font-medium text-zinc-900">{slots.filter((s) => s.status === 'AVAILABLE').length} Slots</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/interviewer/availability"
                className="text-xs text-zinc-600 hover:text-zinc-950 font-medium inline-flex items-center gap-1"
              >
                Modify Hours & Overrides &rarr;
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200/80 p-4 text-xs text-zinc-500 space-y-1 shadow-xs">
            <div className="font-medium text-zinc-900 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-zinc-400" />
              Evaluator Isolation
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-500">
              You can only view and evaluate candidates assigned to your calendar. Submitted evaluations are cryptographically logged and immutable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
