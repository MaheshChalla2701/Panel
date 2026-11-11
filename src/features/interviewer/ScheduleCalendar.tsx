import React, { useState, useEffect } from 'react';
import { useAuth } from '../../app/providers/AuthContext';
import { repository } from '../../services/api/repository';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { Interview } from '../../types';

export const ScheduleCalendar: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [, setTick] = useState(0);

  useEffect(() => {
    return repository.subscribe(() => setTick((t) => t + 1));
  }, []);

  const interviewer = repository.getInterviewerByUserId(currentUser.id) || repository.getInterviewers()[0];
  const interviews = repository.getInterviews().filter((i) => i.interviewerId === interviewer.id);

  const [viewMode, setViewMode] = useState<'DAY' | 'WEEK' | 'LIST'>('LIST');
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
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              Part 5.3 — Screen 11
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Interviewer Daily & Weekly Schedule</h1>
            <p className="text-sm text-slate-500 mt-1">
              Evaluator: <strong className="text-slate-800">{interviewer.user.fullName}</strong> &bull; Total Assigned Interviews: {interviews.length}
            </p>
          </div>

          {/* View Toggles */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
              {(['LIST', 'DAY', 'WEEK'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 rounded-lg transition capitalize ${
                    viewMode === mode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {mode.toLowerCase()} View
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Date Navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const d = new Date(currentDate);
              d.setDate(d.getDate() - 1);
              setCurrentDate(d.toISOString().split('T')[0]);
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold text-slate-900">
            {new Date(currentDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
          <button
            onClick={() => {
              const d = new Date(currentDate);
              d.setDate(d.getDate() + 1);
              setCurrentDate(d.toISOString().split('T')[0]);
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={() => setCurrentDate('2026-11-11')}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800"
        >
          Jump to Today (11 Nov)
        </button>
      </div>

      {/* Interviews Grid / List */}
      <div className="space-y-3">
        {filteredInterviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400">
            No interview sessions scheduled for this period.
          </div>
        ) : (
          filteredInterviews.map((intv) => {
            const isCompleted = intv.interviewStatus === 'COMPLETED';
            const isNoShow = intv.interviewStatus === 'NO_SHOW';
            const isScheduled = intv.interviewStatus === 'SCHEDULED' || intv.interviewStatus === 'IN_PROGRESS';
            const hasEval = !!repository.getEvaluationForInterview(intv.id);

            return (
              <div
                key={intv.id}
                onClick={() => navigate(`/interviewer/workspace/${intv.id}`)}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-blue-400 hover:shadow-md transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900">
                      {new Date(intv.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &ndash;{' '}
                      {new Date(intv.scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (IST)
                    </span>
                    <span className="text-slate-300">&bull;</span>
                    <span className="text-xs text-slate-500 font-semibold">
                      {new Date(intv.scheduledStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        isScheduled
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : isCompleted
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isNoShow
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {intv.interviewStatus.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                      {intv.studentBadgeJourney.student.user.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {intv.studentBadgeJourney.student.user.fullName} &bull;{' '}
                        <span className="text-slate-500 font-normal">{intv.studentBadgeJourney.student.studentCode}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Track: {intv.studentBadgeJourney.badge.track.name} &bull; Target Badge:{' '}
                        <strong className="text-slate-700">{intv.studentBadgeJourney.badge.name}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {hasEval ? (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Evaluated
                    </span>
                  ) : isCompleted ? (
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 animate-pulse">
                      Evaluation Pending
                    </span>
                  ) : null}

                  <button className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition">
                    Open Workspace &rarr;
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
