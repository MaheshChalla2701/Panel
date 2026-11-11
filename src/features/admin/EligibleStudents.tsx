import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { repository } from '../../services/api/repository';
import { useAuth } from '../../app/providers/AuthContext';
import { useToast } from '../../app/providers/ToastContext';
import {
  Search,
  Download,
  Bell,
  CheckCircle2,
} from 'lucide-react';

export const EligibleStudents: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [, setTick] = useState(0);

  useEffect(() => {
    return repository.subscribe(() => setTick((t) => t + 1));
  }, []);

  const journeys = repository.getJourneys();
  const interviews = repository.getInterviews();
  const tracks = repository.getTracks();

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<string>('ALL');
  const [bookingFilter, setBookingFilter] = useState<string>(
    searchParams.get('filter') === 'unbooked' ? 'UNBOOKED' : 'ALL'
  );

  // Map each journey to its active interview if any
  const journeyRows = journeys.map((j) => {
    const studentInterviews = interviews.filter((i) => i.studentBadgeJourneyId === j.id);
    const activeBooking = studentInterviews.find(
      (i) => i.bookingStatus === 'BOOKED' && i.interviewStatus !== 'CANCELLED'
    );
    const latestAttempt = studentInterviews[studentInterviews.length - 1];

    const isBooked = !!activeBooking;
    const isEligible = j.eligibilityStatus === 'ELIGIBLE';

    return {
      journey: j,
      student: j.student,
      badge: j.badge,
      track: j.badge.track,
      isEligible,
      isBooked,
      activeBooking,
      latestAttempt,
      attemptsCount: j.currentAttemptNumber,
    };
  });

  // Apply filters
  const filteredRows = journeyRows.filter((row) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = row.student.user.fullName.toLowerCase().includes(q);
      const matchCode = row.student.studentCode.toLowerCase().includes(q);
      const matchBadge = row.badge.name.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchBadge) return false;
    }

    if (selectedTrack !== 'ALL' && row.track.id !== selectedTrack) {
      return false;
    }

    if (bookingFilter === 'UNBOOKED') {
      return row.isEligible && !row.isBooked && row.journey.badgeStatus === 'NOT_EARNED';
    }
    if (bookingFilter === 'BOOKED') {
      return row.isBooked;
    }
    if (bookingFilter === 'ELIGIBLE_ONLY') {
      return row.isEligible;
    }

    return true;
  });

  // Action: Nudge Unbooked Candidate
  const handleNudgeStudent = (studentUserId: string, badgeName: string, studentName: string) => {
    (repository as any).createNotification({
      userId: studentUserId,
      type: 'INTERVIEW_REMINDER',
      title: 'Reminder: Book Your Track Badge Interview',
      message: `You completed all mandatory skills for the ${badgeName} badge. Please book an open interview slot to clear your credential.`,
      relatedEntityType: 'BADGE',
    });

    toast({
      type: 'success',
      title: 'Reminder Dispatched',
      message: `Booking reminder sent to ${studentName}.`,
    });
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Student Name',
      'Student Code',
      'Track',
      'Badge',
      'Eligibility Status',
      'Booking Status',
      'Scheduled Date',
      'Evaluator',
      'Attempts',
    ];

    const rows = filteredRows.map((r) => [
      `"${r.student.user.fullName}"`,
      `"${r.student.studentCode}"`,
      `"${r.track.name}"`,
      `"${r.badge.name}"`,
      `"${r.journey.eligibilityStatus}"`,
      `"${r.isBooked ? 'BOOKED' : 'UNBOOKED'}"`,
      `"${r.activeBooking ? new Date(r.activeBooking.scheduledStart).toLocaleDateString() : 'N/A'}"`,
      `"${r.activeBooking ? r.activeBooking.interviewer.user.fullName : 'Unassigned'}"`,
      `"${r.attemptsCount}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GRIT_Eligible_Students_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      type: 'info',
      title: 'CSV Export Generated',
      message: `${filteredRows.length} records exported successfully.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-zinc-950 tracking-tight">
              Eligible Students Pipeline
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Monitor candidates who achieved eligibility, track booking conversion, and dispatch reminders.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-medium text-xs px-3 py-1.5 rounded-lg transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-zinc-200/80 p-3.5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search candidate, code, badge..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'UNBOOKED', label: 'Eligible & Unbooked' },
              { id: 'BOOKED', label: 'Booked' },
              { id: 'ELIGIBLE_ONLY', label: 'Eligible Only' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setBookingFilter(f.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap border ${
                  bookingFilter === f.id
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                    : 'bg-white text-zinc-600 border-zinc-200/80 hover:bg-zinc-50'
                }`}
              >
                {f.label}
              </button>
            ))}

            {/* Track Select */}
            <select
              value={selectedTrack}
              onChange={(e) => setSelectedTrack(e.target.value)}
              className="text-xs font-medium border border-zinc-200 rounded-md px-2.5 py-1 bg-white text-zinc-700"
            >
              <option value="ALL">All Tracks</option>
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Operational Table */}
      <div className="bg-white rounded-xl border border-zinc-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/70 border-b border-zinc-200/80 text-zinc-500 font-medium uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Track & Badge</th>
                <th className="py-3 px-4">Eligibility</th>
                <th className="py-3 px-4">Booking Status</th>
                <th className="py-3 px-4">Interview Schedule</th>
                <th className="py-3 px-4">Attempts</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-zinc-400">
                    No student records found matching the active filters.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const isUnbooked = row.isEligible && !row.isBooked && row.journey.badgeStatus === 'NOT_EARNED';

                  return (
                    <tr
                      key={row.journey.id}
                      className="hover:bg-zinc-50/50 transition-colors"
                    >
                      {/* Student Name */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-zinc-950">{row.student.user.fullName}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">{row.student.studentCode}</div>
                      </td>

                      {/* Track & Badge */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-zinc-800">{row.badge.name}</div>
                        <div className="text-[10px] text-zinc-400">{row.track.name}</div>
                      </td>

                      {/* Eligibility Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            row.journey.eligibilityStatus === 'ELIGIBLE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                              : 'bg-zinc-100 text-zinc-600 border-zinc-200/60'
                          }`}
                        >
                          {row.journey.eligibilityStatus.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Booking Status */}
                      <td className="py-3 px-4">
                        {row.journey.badgeStatus === 'AWARDED' ? (
                          <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                            Badge Awarded
                          </span>
                        ) : row.journey.badgeStatus === 'NULLIFIED' ? (
                          <span className="text-[10px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60">
                            Nullified
                          </span>
                        ) : row.isBooked ? (
                          <span className="text-[10px] font-medium text-zinc-800 bg-zinc-100 border border-zinc-200/80 px-2 py-0.5 rounded flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Booked
                          </span>
                        ) : row.isEligible ? (
                          <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded w-fit inline-block">
                            Not Booked
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-400">Incomplete</span>
                        )}
                      </td>

                      {/* Interview Schedule */}
                      <td className="py-3 px-4">
                        {row.activeBooking ? (
                          <div>
                            <div className="font-medium text-zinc-950">
                              {new Date(row.activeBooking.scheduledStart).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}{' '}
                              at{' '}
                              {new Date(row.activeBooking.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-[10px] text-zinc-400">
                              {row.activeBooking.interviewer.user.fullName}
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-400 italic">None</span>
                        )}
                      </td>

                      {/* Attempts */}
                      <td className="py-3 px-4">
                        <span className="font-mono text-zinc-800">{row.attemptsCount}</span>
                        <span className="text-zinc-400"> / 3</span>
                      </td>

                      {/* Operations */}
                      <td className="py-3 px-4 text-right">
                        {isUnbooked && (
                          <button
                            onClick={() =>
                              handleNudgeStudent(
                                row.student.userId,
                                row.badge.name,
                                row.student.user.fullName
                              )
                            }
                            className="inline-flex items-center gap-1 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-[11px] px-2.5 py-1 rounded transition-colors shadow-xs"
                          >
                            <Bell className="w-3 h-3" /> Nudge to Book
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
