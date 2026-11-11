import React, { useState, useEffect } from 'react';
import { repository } from '../../services/api/repository';
import {
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const AdminOverview: React.FC = () => {
  const [, setTick] = useState(0);

  useEffect(() => {
    return repository.subscribe(() => setTick((t) => t + 1));
  }, []);

  const journeys = repository.getJourneys();
  const interviews = repository.getInterviews();
  const evaluations = repository.getEvaluations();

  // Calculations from application data
  const eligibleJourneys = journeys.filter((j) => j.eligibilityStatus === 'ELIGIBLE');
  const uniqueEligibleStudentIds = new Set(eligibleJourneys.map((j) => j.studentId));
  const totalEligibleStudents = uniqueEligibleStudentIds.size;

  const bookedStudentIds = new Set(
    interviews
      .filter((i) => i.bookingStatus === 'BOOKED' && i.interviewStatus !== 'CANCELLED')
      .map((i) => i.studentBadgeJourney.studentId)
  );

  const studentsBookedCount = bookedStudentIds.size;
  const unbookedEligibleStudentsCount = Array.from(uniqueEligibleStudentIds).filter(
    (id) => !bookedStudentIds.has(id)
  ).length;

  const bookingConversionPct =
    totalEligibleStudents > 0
      ? Math.round((studentsBookedCount / totalEligibleStudents) * 100)
      : 0;

  const upcomingInterviews = interviews.filter(
    (i) => i.interviewStatus === 'SCHEDULED' || i.interviewStatus === 'IN_PROGRESS'
  );

  const completedInterviews = interviews.filter((i) => i.interviewStatus === 'COMPLETED');

  const pendingEvaluations = completedInterviews.filter(
    (i) => !evaluations.find((e) => e.interviewId === i.id)
  );

  const passCount = evaluations.filter((e) => e.outcome === 'PASS').length;
  const retakeCount = evaluations.filter((e) => e.outcome === 'RETAKE_LATER').length;
  const failCount = evaluations.filter((e) => e.outcome === 'FAIL').length;
  const totalEvaluations = evaluations.length;

  const passPct = totalEvaluations > 0 ? Math.round((passCount / totalEvaluations) * 100) : 0;

  // Outcome Chart Data
  const outcomeData = [
    { name: 'Passed', value: passCount, color: '#18181B' },
    { name: 'Retake Later', value: retakeCount, color: '#A1A1AA' },
    { name: 'Failed', value: failCount, color: '#E4E4E7' },
  ];

  // Track Distribution Data
  const tracks = repository.getTracks();
  const trackDistribution = tracks.map((t) => {
    const trackJourneys = journeys.filter((j) => j.badge.trackId === t.id);
    return {
      name: t.name.replace(' Mastery', '').replace(' Development', ''),
      eligible: trackJourneys.filter((j) => j.eligibilityStatus === 'ELIGIBLE').length,
      awarded: trackJourneys.filter((j) => j.badgeStatus === 'AWARDED').length,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-zinc-950 tracking-tight">
              Interview Operations Dashboard
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Pipeline analytics, booking conversion, evaluator workload, and integrity oversight.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/eligible-students"
              className="px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition-colors shadow-xs flex items-center gap-1.5"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{unbookedEligibleStudentsCount} Unbooked Eligible</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs space-y-1">
          <div className="text-[11px] text-zinc-400 font-medium">Eligible Students</div>
          <div className="text-xl font-semibold text-zinc-950">{totalEligibleStudents}</div>
          <div className="text-[10px] text-zinc-500">Across all tracks</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs space-y-1">
          <div className="text-[11px] text-zinc-400 font-medium">Booked Students</div>
          <div className="text-xl font-semibold text-zinc-950">{studentsBookedCount}</div>
          <div className="text-[10px] text-zinc-500">{bookingConversionPct}% conversion</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs space-y-1">
          <div className="text-[11px] text-zinc-400 font-medium">Unbooked Eligible</div>
          <div className="text-xl font-semibold text-zinc-950">{unbookedEligibleStudentsCount}</div>
          <div className="text-[10px] text-zinc-500">Awaiting booking</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs space-y-1">
          <div className="text-[11px] text-zinc-400 font-medium">Upcoming Sessions</div>
          <div className="text-xl font-semibold text-zinc-950">{upcomingInterviews.length}</div>
          <div className="text-[10px] text-zinc-500">Active slots</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs space-y-1">
          <div className="text-[11px] text-zinc-400 font-medium">Pending Evaluations</div>
          <div className="text-xl font-semibold text-zinc-950">{pendingEvaluations.length}</div>
          <div className="text-[10px] text-zinc-500">Concluded sessions</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs space-y-1">
          <div className="text-[11px] text-zinc-400 font-medium">Pass Rate</div>
          <div className="text-xl font-semibold text-zinc-950">{passPct}%</div>
          <div className="text-[10px] text-zinc-500">{passCount} passed / {totalEvaluations} total</div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Track Progression Distribution (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
              Track Pipeline: Eligible vs Awarded
            </h3>
            <span className="text-[11px] text-zinc-400">Real-time counts</span>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trackDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#71717A' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#71717A' }} />
                <Tooltip contentStyle={{ backgroundColor: '#18181B', borderRadius: '8px', color: '#FFF', fontSize: '12px' }} />
                <Bar dataKey="eligible" name="Eligible" fill="#71717A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="awarded" name="Awarded" fill="#18181B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Evaluation Outcomes Breakdown */}
        <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs space-y-3.5">
          <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
            Outcome Distribution
          </h3>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={outcomeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {outcomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#18181B', borderRadius: '8px', color: '#FFF', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between py-1">
              <span className="flex items-center gap-1.5 text-zinc-600">
                <span className="w-2 h-2 rounded-full bg-zinc-900"></span> Passed
              </span>
              <span className="font-mono font-medium text-zinc-950">{passCount}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="flex items-center gap-1.5 text-zinc-600">
                <span className="w-2 h-2 rounded-full bg-zinc-400"></span> Retake Later
              </span>
              <span className="font-mono font-medium text-zinc-950">{retakeCount}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="flex items-center gap-1.5 text-zinc-600">
                <span className="w-2 h-2 rounded-full bg-zinc-200"></span> Fail
              </span>
              <span className="font-mono font-medium text-zinc-950">{failCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
