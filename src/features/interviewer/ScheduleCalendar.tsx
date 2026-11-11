import React, { useState, useEffect } from 'react';
import { useAuth } from '../../app/providers/AuthContext';
import { repository } from '../../services/api/repository';
import { Link } from 'react-router-dom';
import {
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const ScheduleCalendar: React.FC = () => {
  const { currentUser } = useAuth();
  const [, setTick] = useState(0);

  useEffect(() => {
    return repository.subscribe(() => setTick((t) => t + 1));
  }, []);

  const interviewer = repository.getInterviewerByUserId(currentUser.id) || repository.getInterviewers()[0];
  const interviews = repository.getInterviews().filter((i) => i.interviewerId === interviewer.id);

  const [viewMode, setViewMode] = useState<'DAY' | 'LIST'>('LIST');
  const [currentDate, setCurrentDate] = useState<string>('2026-11-11');

  const filteredInterviews = interviews.filter((i) => {
    if (viewMode === 'DAY') {
      return i.scheduledStart.startsWith(currentDate);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-zinc-950 tracking-tight">
              Schedule & Calendar
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Assigned sessions for {interviewer.user.fullName} ({interviews.length} total)
            </p>
          </div>

          <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-lg text-xs font-medium border border-zinc-200/60">
            {(['LIST', 'DAY'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded transition-colors capitalize ${
                  viewMode === mode ? 'bg-white text-zinc-950 font-medium shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {mode.toLowerCase()} View
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Date Navigation Bar (if DAY mode) */}
      {viewMode === 'DAY' && (
        <div className="bg-white rounded-xl border border-zinc-200/80 p-3 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const d = new Date(currentDate);
                d.setDate(d.getDate() - 1);
                setCurrentDate(d.toISOString().split('T')[0]);
              }}
              className="p-1 rounded hover:bg-zinc-100 text-zinc-500"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium text-zinc-950">
              {new Date(currentDate).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <button
              onClick={() => {
                const d = new Date(currentDate);
                d.setDate(d.getDate() + 1);
                setCurrentDate(d.toISOString().split('T')[0]);
              }}
              className="p-1 rounded hover:bg-zinc-100 text-zinc-500"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setCurrentDate('2026-11-11')}
            className="text-[11px] text-zinc-500 hover:text-zinc-900 font-medium px-2 py-0.5 rounded hover:bg-zinc-100"
          >
            Today
          </button>
        </div>
      )}

      {/* Schedule Feed */}
      {filteredInterviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200/80 p-10 text-center shadow-xs text-xs text-zinc-400">
          No interviews scheduled for this date view.
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredInterviews.map((intv) => {
            const evalObj = repository.getEvaluationForInterview(intv.id);
            return (
              <div
                key={intv.id}
                className="bg-white rounded-xl border border-zinc-200/80 p-4 shadow-xs hover:border-zinc-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-950 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      {new Date(intv.scheduledStart).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      •{' '}
                      {new Date(intv.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {' – '}
                      {new Date(intv.scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200/60">
                      {intv.interviewStatus.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="text-xs font-medium text-zinc-800">
                    {intv.studentBadgeJourney.student.user.fullName} ({intv.studentBadgeJourney.student.studentCode})
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {intv.studentBadgeJourney.badge.name} • Attempt #{intv.attemptNumber}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={intv.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    Meeting <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </a>

                  <Link
                    to={`/interviewer/workspace/${intv.id}`}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors shadow-xs"
                  >
                    {evalObj ? 'View Evaluation' : 'Evaluate'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
