import React, { useState, useEffect } from 'react';
import { repository } from '../../services/api/repository';
import {
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Award,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  Flame,
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

  const students = repository.getStudents();
  const journeys = repository.getJourneys();
  const interviews = repository.getInterviews();
  const evaluations = repository.getEvaluations();
  const interviewers = repository.getInterviewers();
  const malpracticeCases = repository.getMalpracticeCases();

  // Part 11 Mathematical Calculations from Real Application Data (Never Hardcoded!)
  const eligibleJourneys = journeys.filter((j) => j.eligibilityStatus === 'ELIGIBLE');
  const uniqueEligibleStudentIds = new Set(eligibleJourneys.map((j) => j.studentId));
  const totalEligibleStudents = uniqueEligibleStudentIds.size;

  // Active bookings
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
  const noShows = interviews.filter((i) => i.interviewStatus === 'NO_SHOW');
  const noShowPct =
    interviews.length > 0 ? Math.round((noShows.length / interviews.length) * 100) : 0;

  const pendingEvaluations = completedInterviews.filter(
    (i) => !evaluations.find((e) => e.interviewId === i.id)
  );

  const passCount = evaluations.filter((e) => e.outcome === 'PASS').length;
  const retakeCount = evaluations.filter((e) => e.outcome === 'RETAKE_LATER').length;
  const failCount = evaluations.filter((e) => e.outcome === 'FAIL').length;
  const totalEvaluations = evaluations.length;

  const passPct = totalEvaluations > 0 ? Math.round((passCount / totalEvaluations) * 100) : 0;
  const retakePct = totalEvaluations > 0 ? Math.round((retakeCount / totalEvaluations) * 100) : 0;
  const failPct = totalEvaluations > 0 ? Math.round((failCount / totalEvaluations) * 100) : 0;

  // Outcome Chart Data
  const outcomeData = [
    { name: 'Passed', value: passCount, color: '#10B981' },
    { name: 'Retake Later', value: retakeCount, color: '#F59E0B' },
    { name: 'Failed', value: failCount, color: '#EF4444' },
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
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              Part 5.4 — Screen 14 &bull; Admin Operations
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Interview Operations Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">
              Real-time pipeline analytics, booking velocity, evaluator workload, and integrity oversight.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/eligible-students?filter=unbooked"
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition shadow flex items-center gap-1.5"
            >
              <AlertCircle className="w-4 h-4 text-slate-950" />
              Identify {unbookedEligibleStudentsCount} Unbooked Students
            </Link>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (Part 11) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] text-slate-500 font-medium">Eligible Students</div>
          <div className="text-2xl font-black text-slate-900">{totalEligibleStudents}</div>
          <div className="text-[10px] text-slate-400">All tracks combined</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] text-slate-500 font-medium">Booked Students</div>
          <div className="text-2xl font-black text-blue-600">{studentsBookedCount}</div>
          <div className="text-[10px] text-blue-600 font-bold">{bookingConversionPct}% Conversion</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-300 bg-amber-50/40 shadow-sm space-y-1">
          <div className="text-[11px] text-amber-900 font-bold">Unbooked Eligible</div>
          <div className="text-2xl font-black text-amber-600">{unbookedEligibleStudentsCount}</div>
          <div className="text-[10px] text-amber-700 font-medium">Requires follow-up</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] text-slate-500 font-medium">Upcoming Interviews</div>
          <div className="text-2xl font-black text-slate-900">{upcomingInterviews.length}</div>
          <div className="text-[10px] text-slate-400">On active schedules</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] text-slate-500 font-medium">Pending Evaluations</div>
          <div className={`text-2xl font-black ${pendingEvaluations.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {pendingEvaluations.length}
          </div>
          <div className="text-[10px] text-slate-400">Interviews ended</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] text-slate-500 font-medium">Pass Rate</div>
          <div className="text-2xl font-black text-emerald-600">{passPct}%</div>
          <div className="text-[10px] text-slate-400">{passCount} cleared / {totalEvaluations} total</div>
        </div>
      </div>

      {/* Visual Analytics Charts (Part 11) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Track Progression Distribution (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Track Pipeline: Eligible vs Awarded Badges</h3>
            <span className="text-xs text-slate-500">Real-time counts</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trackDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="eligible" name="Eligible" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="awarded" name="Awarded" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Evaluation Outcomes Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Outcome Distribution</h3>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={outcomeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {outcomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Pass Rate
              </span>
              <span className="font-bold text-slate-900">{passPct}% ({passCount})</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Retake Later
              </span>
              <span className="font-bold text-slate-900">{retakePct}% ({retakeCount})</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Fail
              </span>
              <span className="font-bold text-slate-900">{failPct}% ({failCount})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Highlights Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/admin/eligible-students"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 transition shadow-sm space-y-2"
        >
          <div className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center justify-between">
            <span>Eligible Candidates Table</span>
            <ArrowRight className="w-4 h-4" />
          </div>
          <div className="text-sm font-black text-slate-900">Manage Candidate Bookings</div>
          <p className="text-xs text-slate-500">
            Search, filter by track, export CSV, and dispatch reminders to candidates who haven't reserved a slot.
          </p>
        </Link>

        <Link
          to="/admin/malpractice"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 transition shadow-sm space-y-2"
        >
          <div className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center justify-between">
            <span>Malpractice Review Board</span>
            <ArrowRight className="w-4 h-4" />
          </div>
          <div className="text-sm font-black text-slate-900">
            {malpracticeCases.filter((c) => c.status === 'UNDER_INVESTIGATION' || c.status === 'REPORTED').length} Active Inquiries
          </div>
          <p className="text-xs text-slate-500">
            Authorized administrative adjudication for reported contest anomalies and badge nullification actions.
          </p>
        </Link>

        <Link
          to="/admin/audit-logs"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-400 transition shadow-sm space-y-2"
        >
          <div className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
            <span>System Audit Trail</span>
            <ArrowRight className="w-4 h-4" />
          </div>
          <div className="text-sm font-black text-slate-900">Immutable Event Logs</div>
          <p className="text-xs text-slate-500">
            Append-only records capturing every state transition, booking, evaluation, and administrative override.
          </p>
        </Link>
      </div>
    </div>
  );
};
