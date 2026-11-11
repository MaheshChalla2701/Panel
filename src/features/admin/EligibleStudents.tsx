import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { repository } from '../../services/api/repository';
import { useAuth } from '../../app/providers/AuthContext';
import { useToast } from '../../app/providers/ToastContext';
import {
  Users,
  Search,
  Filter,
  Download,
  Bell,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  UserCheck,
} from 'lucide-react';

export const EligibleStudents: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [, setTick] = useState(0);

  useEffect(() => {
    return repository.subscribe(() => setTick((t) => t + 1));
  }, []);

  const journeys = repository.getJourneys();
  const interviews = repository.getInterviews();
  const interviewers = repository.getInterviewers();
  const tracks = repository.getTracks();

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<string>('ALL');
  const [bookingFilter, setBookingFilter] = useState<string>(
    searchParams.get('filter') === 'unbooked' ? 'UNBOOKED' : 'ALL'
  );

  // Direct Assign Dialog State
  const [assignTargetJourneyId, setAssignTargetJourneyId] = useState<string | null>(null);
  const [targetInterviewerId, setTargetInterviewerId] = useState<string>('');

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
    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = row.student.user.fullName.toLowerCase().includes(q);
      const matchCode = row.student.studentCode.toLowerCase().includes(q);
      const matchBadge = row.badge.name.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchBadge) return false;
    }

    // Track filter
    if (selectedTrack !== 'ALL' && row.track.id !== selectedTrack) {
      return false;
    }

    // Booking filter
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

  // Action: Nudge Unbooked Candidate (Part 5.4 Screen 15)
  const handleNudgeStudent = (studentUserId: string, badgeName: string, studentName: string) => {
    // Repository method / direct notification
    // We can simulate an instant administrative reminder notification
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
      message: `In-app booking reminder sent to ${studentName}.`,
    });
  };

  // CSV Export (Part 11)
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
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              Part 5.4 — Screen 15
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Eligible Students Management</h1>
            <p className="text-sm text-slate-500 mt-1">
              Core operation: Track candidates who achieved badge eligibility, monitor booking velocity, and nudge unbooked students.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-sm"
            >
              <Download className="w-4 h-4" /> Export CSV Report
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by student name, code, or badge..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'ALL', label: 'All Candidates' },
              { id: 'UNBOOKED', label: 'Eligible & Unbooked ⚡', highlight: true },
              { id: 'BOOKED', label: 'Confirmed Bookings' },
              { id: 'ELIGIBLE_ONLY', label: 'Eligible Only' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setBookingFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
                  bookingFilter === f.id
                    ? f.highlight
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                      : 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}

            {/* Track Select */}
            <select
              value={selectedTrack}
              onChange={(e) => setSelectedTrack(e.target.value)}
              className="text-xs font-semibold border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-700"
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
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Student & Code</th>
                <th className="py-3.5 px-4">Track & Badge</th>
                <th className="py-3.5 px-4">Eligibility Status</th>
                <th className="py-3.5 px-4">Booking Status</th>
                <th className="py-3.5 px-4">Interview Schedule</th>
                <th className="py-3.5 px-4">Attempts</th>
                <th className="py-3.5 px-4 text-right">Quick Operations</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No student records found matching the active filters.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const isUnbooked = row.isEligible && !row.isBooked && row.journey.badgeStatus === 'NOT_EARNED';

                  return (
                    <tr
                      key={row.journey.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isUnbooked ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* Student Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{row.student.user.fullName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{row.student.studentCode}</div>
                        <div className="text-[10px] text-slate-500">{row.student.college}</div>
                      </td>

                      {/* Track & Badge */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{row.badge.name}</div>
                        <div className="text-[10px] text-slate-400">{row.track.name}</div>
                      </td>

                      {/* Eligibility Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            row.journey.eligibilityStatus === 'ELIGIBLE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : row.journey.eligibilityStatus === 'REQUIRES_ADMIN_REVIEW'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : row.journey.eligibilityStatus === 'ELIGIBILITY_REVOKED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {row.journey.eligibilityStatus.replace('_', ' ')}
                        </span>
                        {row.journey.eligibleAt && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Since {new Date(row.journey.eligibleAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>

                      {/* Booking Status */}
                      <td className="py-3.5 px-4">
                        {row.journey.badgeStatus === 'AWARDED' ? (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            Badge Awarded
                          </span>
                        ) : row.journey.badgeStatus === 'NULLIFIED' ? (
                          <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                            Nullified
                          </span>
                        ) : row.isBooked ? (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3 text-blue-600" /> Booked
                          </span>
                        ) : row.isEligible ? (
                          <span className="text-[10px] font-black text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit animate-pulse">
                            <AlertCircle className="w-3 h-3 text-amber-700" /> NOT BOOKED
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Skills Incomplete</span>
                        )}
                      </td>

                      {/* Interview Schedule */}
                      <td className="py-3.5 px-4">
                        {row.activeBooking ? (
                          <div>
                            <div className="font-bold text-slate-900">
                              {new Date(row.activeBooking.scheduledStart).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}{' '}
                              at{' '}
                              {new Date(row.activeBooking.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {row.activeBooking.interviewer.user.fullName}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No active session</span>
                        )}
                      </td>

                      {/* Attempts */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800">{row.attemptsCount}</span>
                        <span className="text-slate-400"> / 3</span>
                      </td>

                      {/* Operations */}
                      <td className="py-3.5 px-4 text-right">
                        {isUnbooked && (
                          <button
                            onClick={() =>
                              handleNudgeStudent(
                                row.student.userId,
                                row.badge.name,
                                row.student.user.fullName
                              )
                            }
                            className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] px-3 py-1.5 rounded-lg transition shadow-sm"
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
