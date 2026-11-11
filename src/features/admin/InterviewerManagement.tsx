import React, { useState, useEffect } from 'react';
import { repository } from '../../services/api/repository';

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
      <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs">
        <h1 className="text-lg font-semibold text-zinc-950 tracking-tight">
          Interviewer Roster & Capacity Oversight
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Monitor evaluator workload, weekly schedules, active sessions, and throughput.
        </p>
      </div>

      {/* Evaluator Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {interviewerStats.map((item) => {
          const i = item.interviewer;
          return (
            <div
              key={i.id}
              className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 text-white font-medium text-xs flex items-center justify-center shrink-0">
                    {i.user.fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-950 text-sm">{i.user.fullName}</h3>
                    <p className="text-xs text-zinc-500">{i.title}</p>
                    <div className="text-[10px] text-zinc-600 bg-zinc-100 border border-zinc-200/60 px-1.5 py-0.2 rounded font-medium inline-block mt-1">
                      Active
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-zinc-100 text-xs text-zinc-600">
                  <div className="py-1.5 flex justify-between">
                    <span className="text-zinc-400">Working Days</span>
                    <span className="font-medium text-zinc-950">{item.activeDaysCount} Days/wk</span>
                  </div>
                  <div className="py-1.5 flex justify-between">
                    <span className="text-zinc-400">Daily Max</span>
                    <span className="font-medium text-zinc-950">{i.maxInterviewsPerDay} Slots</span>
                  </div>
                  <div className="py-1.5 flex justify-between">
                    <span className="text-zinc-400">Assigned Upcoming</span>
                    <span className="font-medium text-zinc-950">{item.upcomingCount} Sessions</span>
                  </div>
                  <div className="py-1.5 flex justify-between">
                    <span className="text-zinc-400">Completed Total</span>
                    <span className="font-medium text-zinc-950">{item.completedCount} Evaluations</span>
                  </div>
                </div>

                {/* Utilization Gauge */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400 text-[11px]">Utilization</span>
                    <span className="font-mono text-zinc-900">{item.workloadPct}%</span>
                  </div>
                  <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-zinc-900 rounded-full"
                      style={{ width: `${item.workloadPct}%` }}
                    />
                  </div>
                </div>

                {/* Specialization tags */}
                <div className="pt-1">
                  <div className="text-[10px] uppercase font-medium text-zinc-400 mb-1">Domains</div>
                  <div className="flex flex-wrap gap-1">
                    {i.specialization.map((spec) => (
                      <span key={spec} className="text-[10px] bg-zinc-50 text-zinc-600 border border-zinc-200/60 px-1.5 py-0.2 rounded font-medium">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 text-[10px] text-zinc-400">
                {i.timezone} • {i.user.email}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
