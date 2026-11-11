import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';

// Student Screens
import { StudentHome } from '../../features/student/StudentHome';
import { BadgeEligibility } from '../../features/student/BadgeEligibility';
import { InterviewBooking } from '../../features/student/InterviewBooking';
import { MyInterviews } from '../../features/student/MyInterviews';
import { BadgeStatusAndResults } from '../../features/student/BadgeStatusAndResults';

// Interviewer Screens
import { InterviewerDashboard } from '../../features/interviewer/InterviewerDashboard';
import { AvailabilityManagement } from '../../features/interviewer/AvailabilityManagement';
import { ScheduleCalendar } from '../../features/interviewer/ScheduleCalendar';
import { InterviewWorkspace } from '../../features/interviewer/InterviewWorkspace';

// Admin Screens
import { AdminOverview } from '../../features/admin/AdminOverview';
import { EligibleStudents } from '../../features/admin/EligibleStudents';
import { InterviewOperations } from '../../features/admin/InterviewOperations';
import { InterviewerManagement } from '../../features/admin/InterviewerManagement';
import { MalpracticeReview } from '../../features/admin/MalpracticeReview';
import { AuditLogView } from '../../features/admin/AuditLogView';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          {/* Student Routes */}
          <Route index element={<StudentHome />} />
          <Route path="badge-eligibility" element={<BadgeEligibility />} />
          <Route path="book-interview" element={<InterviewBooking />} />
          <Route path="my-interviews" element={<MyInterviews />} />
          <Route path="badge-status" element={<BadgeStatusAndResults />} />

          {/* Interviewer Routes */}
          <Route path="interviewer" element={<InterviewerDashboard />} />
          <Route path="interviewer/availability" element={<AvailabilityManagement />} />
          <Route path="interviewer/schedule" element={<ScheduleCalendar />} />
          <Route path="interviewer/workspace/:interviewId" element={<InterviewWorkspace />} />
          <Route path="interviewer/evaluations" element={<ScheduleCalendar />} />

          {/* Admin Routes */}
          <Route path="admin" element={<AdminOverview />} />
          <Route path="admin/eligible-students" element={<EligibleStudents />} />
          <Route path="admin/interviews" element={<InterviewOperations />} />
          <Route path="admin/interviewers" element={<InterviewerManagement />} />
          <Route path="admin/malpractice" element={<MalpracticeReview />} />
          <Route path="admin/audit-logs" element={<AuditLogView />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
