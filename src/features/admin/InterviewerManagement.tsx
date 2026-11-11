import React, { useState, useEffect } from 'react';
import { repository } from '../../services/api/repository';
import {
  UserCheck,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  ShieldCheck,
} from 'lucide-react';

export const InterviewerManagement: React.FC = () => {
  const [, setTick] = useState(0);

  useEffect(() => {
    return repository.subscribe(() => setTick((t) => t + 1));
  }, []);

  const interviewers = repository.getInterviewers();
  const interviews = repository.getInterviews();
  const availability = repository.getAvailability();

  const interviewerStats = interviewers.map((i) => {
    const intvForInterviewer = interviews.filter((intv) => intv.interviewerId === i.id);
    const upcomingCount = intvForInterviewer.filter(
      (intv) => intv.interviewStatus === 'SCHEDULED' || intv.interviewStatus === 'IN_PROGRESS'
    ).length;
    const completedCount = intvForInterviewer.filter(
      (intv) => intv.interviewStatus === 'COMPLETED'
    ).length;
    const activeSchedules = availability.filter((a) => a.interviewerId === i.id && a.isActive);

    const workloadPct = Math.min(
      100,
      Math.round((upcomingCount / (i.maxInterviewsPerDay * 2)) * 100)
    );

    return {
      interviewer: i,
      upcomingCount,
      completedCount,
      activeDaysCount: activeSchedules.length,
      workloadPct,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
          Part 5.4 — Screen 17
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Interviewer Capacity & Workload Oversight</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor evaluator utilization, active working schedules, assigned candidate loads, and historical throughput.
        </p>
      </div>

      {/* Evaluator Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {interviewerStats.map((item) => {
          const i = item.interviewer;
          return (
            <div
              key={i.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {i.user.fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{i.user.fullName}</h3>
                    <p className="text-xs text-slate-500 font-medium">{i.title}</p>
                    <div className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
                      Active Evaluator
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 text-xs text-slate-600">
                  <div className="py-2 flex justify-between">
                    <span>Working Days / Week</span>
                    <span className="font-bold text-slate-900">{item.activeDaysCount} Days</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span>Daily Max Capacity</span>
                    <span className="font-bold text-slate-900">{i.maxInterviewsPerDay} Candidates</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span>Assigned Upcoming</span>
                    <span className="font-bold text-blue-600">{item.upcomingCount} Sessions</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span>Completed Lifetime</span>
                    <span className="font-bold text-emerald-600">{item.completedCount} Evaluations</span>
                  </div>
                </div>

                {/* Utilization Gauge */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Workload Utilization</span>
                    <span className="font-bold text-slate-900">{item.workloadPct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        item.workloadPct > 80 ? 'bg-amber-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${item.workloadPct}%` }}
                    />
                  </div>
                </div>

                {/* Specialization tags */}
                <div className="pt-2">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">Specializations</div>
                  <div className="flex flex-wrap gap-1.5">
                    {i.specialization.map((spec) => (
                      <span key={spec} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
                Timezone: {i.timezone} &bull; Email: {i.user.email}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
