import {
  User,
  Student,
  Interviewer,
  Track,
  Badge,
  BadgeRequirement,
  StudentSkillProgress,
  StudentBadgeJourney,
  InterviewerAvailability,
  InterviewSlot,
  Interview,
  InterviewEvaluation,
  MalpracticeCase,
  BadgeEvent,
  Notification,
  AuditLog,
  BookingStatus,
  InterviewStatus,
  BadgeStatus,
  UserRole,
} from '../../types';

import {
  SEED_USERS,
  SEED_STUDENTS,
  SEED_INTERVIEWERS,
  SEED_TRACKS,
  SEED_BADGES,
  SEED_BADGE_REQUIREMENTS,
  SEED_STUDENT_SKILLS,
  SEED_JOURNEYS,
  SEED_AVAILABILITY,
  SEED_SLOTS,
  SEED_INTERVIEWS,
  SEED_EVALUATIONS,
  SEED_MALPRACTICE_CASES,
  SEED_BADGE_EVENTS,
  SEED_NOTIFICATIONS,
  SEED_AUDIT_LOGS,
} from '../../data/demo/seedData';

import {
  canTransitionEligibility,
  canTransitionBooking,
  canTransitionInterview,
  canTransitionBadge,
  canTransitionMalpractice,
} from '../../domain/state-machines/transitions';

import { validateBookingRequest, validateRescheduleRequest } from '../../domain/policies/bookingPolicy';
import { evaluateStudentEligibility } from '../../domain/validators/eligibilityValidator';

interface DatabaseState {
  users: User[];
  students: Student[];
  interviewers: Interviewer[];
  tracks: Track[];
  badges: Badge[];
  badgeRequirements: BadgeRequirement[];
  studentSkills: StudentSkillProgress[];
  journeys: StudentBadgeJourney[];
  availability: InterviewerAvailability[];
  slots: InterviewSlot[];
  interviews: Interview[];
  evaluations: InterviewEvaluation[];
  malpracticeCases: MalpracticeCase[];
  badgeEvents: BadgeEvent[];
  notifications: Notification[];
  auditLogs: AuditLog[];
}

const STORAGE_KEY = 'grit_interview_hub_db_v1';

class Repository {
  private state: DatabaseState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): DatabaseState {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Could not read from localStorage, using initial seeds', e);
    }
    return this.getInitialState();
  }

  private getInitialState(): DatabaseState {
    return {
      users: [...SEED_USERS],
      students: [...SEED_STUDENTS],
      interviewers: [...SEED_INTERVIEWERS],
      tracks: [...SEED_TRACKS],
      badges: [...SEED_BADGES],
      badgeRequirements: [...SEED_BADGE_REQUIREMENTS],
      studentSkills: [...SEED_STUDENT_SKILLS],
      journeys: [...SEED_JOURNEYS],
      availability: [...SEED_AVAILABILITY],
      slots: [...SEED_SLOTS],
      interviews: [...SEED_INTERVIEWS],
      evaluations: [...SEED_EVALUATIONS],
      malpracticeCases: [...SEED_MALPRACTICE_CASES],
      badgeEvents: [...SEED_BADGE_EVENTS],
      notifications: [...SEED_NOTIFICATIONS],
      auditLogs: [...SEED_AUDIT_LOGS],
    };
  }

  private saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Could not save to localStorage', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public resetDemoData() {
    this.state = this.getInitialState();
    this.saveState();
  }

  // --- Read Operations ---
  public getUsers(): User[] {
    return [...this.state.users];
  }

  public getUser(id: string): User | undefined {
    return this.state.users.find((u) => u.id === id);
  }

  public getStudents(): (Student & { user: User })[] {
    return this.state.students.map((s) => ({
      ...s,
      user: this.state.users.find((u) => u.id === s.userId)!,
    }));
  }

  public getStudent(studentId: string): (Student & { user: User }) | undefined {
    const s = this.state.students.find((stu) => stu.id === studentId);
    if (!s) return undefined;
    return {
      ...s,
      user: this.state.users.find((u) => u.id === s.userId)!,
    };
  }

  public getStudentByUserId(userId: string): (Student & { user: User }) | undefined {
    const s = this.state.students.find((stu) => stu.userId === userId);
    if (!s) return undefined;
    return {
      ...s,
      user: this.state.users.find((u) => u.id === s.userId)!,
    };
  }

  public getInterviewers(): (Interviewer & { user: User })[] {
    return this.state.interviewers.map((i) => ({
      ...i,
      user: this.state.users.find((u) => u.id === i.userId)!,
    }));
  }

  public getInterviewer(interviewerId: string): (Interviewer & { user: User }) | undefined {
    const i = this.state.interviewers.find((intv) => intv.id === interviewerId);
    if (!i) return undefined;
    return {
      ...i,
      user: this.state.users.find((u) => u.id === i.userId)!,
    };
  }

  public getInterviewerByUserId(userId: string): (Interviewer & { user: User }) | undefined {
    const i = this.state.interviewers.find((intv) => intv.userId === userId);
    if (!i) return undefined;
    return {
      ...i,
      user: this.state.users.find((u) => u.id === i.userId)!,
    };
  }

  public getTracks(): Track[] {
    return [...this.state.tracks];
  }

  public getBadges(): (Badge & { track: Track })[] {
    return this.state.badges.map((b) => ({
      ...b,
      track: this.state.tracks.find((t) => t.id === b.trackId)!,
    }));
  }

  public getBadge(id: string): (Badge & { track: Track }) | undefined {
    const b = this.state.badges.find((badge) => badge.id === id);
    if (!b) return undefined;
    return {
      ...b,
      track: this.state.tracks.find((t) => t.id === b.trackId)!,
    };
  }

  public getBadgeRequirements(badgeId: string): BadgeRequirement[] {
    return this.state.badgeRequirements.filter((r) => r.badgeId === badgeId);
  }

  public getStudentSkills(studentId: string): StudentSkillProgress[] {
    return this.state.studentSkills.filter((s) => s.studentId === studentId);
  }

  public getJourneys(): (StudentBadgeJourney & { student: Student & { user: User }; badge: Badge & { track: Track } })[] {
    return this.state.journeys.map((j) => {
      const student = this.getStudent(j.studentId)!;
      const badge = this.getBadge(j.badgeId)!;
      return {
        ...j,
        student,
        badge,
      };
    });
  }

  public getJourney(id: string): (StudentBadgeJourney & { student: Student & { user: User }; badge: Badge & { track: Track } }) | undefined {
    const j = this.state.journeys.find((journey) => journey.id === id);
    if (!j) return undefined;
    const student = this.getStudent(j.studentId)!;
    const badge = this.getBadge(j.badgeId)!;
    return {
      ...j,
      student,
      badge,
    };
  }

  public getJourneyForStudentAndBadge(studentId: string, badgeId: string) {
    const j = this.state.journeys.find((journey) => journey.studentId === studentId && journey.badgeId === badgeId);
    if (!j) return undefined;
    return this.getJourney(j.id);
  }

  public getAvailability(interviewerId?: string): InterviewerAvailability[] {
    if (interviewerId) {
      return this.state.availability.filter((a) => a.interviewerId === interviewerId);
    }
    return [...this.state.availability];
  }

  public getSlots(filters?: { interviewerId?: string; status?: string }): (InterviewSlot & { interviewer: Interviewer & { user: User } })[] {
    let slots = [...this.state.slots];
    if (filters?.interviewerId) {
      slots = slots.filter((s) => s.interviewerId === filters.interviewerId);
    }
    if (filters?.status) {
      slots = slots.filter((s) => s.status === filters.status);
    }
    return slots.map((s) => ({
      ...s,
      interviewer: this.getInterviewer(s.interviewerId)!,
    }));
  }

  public getInterviews(): (Interview & {
    studentBadgeJourney: StudentBadgeJourney & { student: Student & { user: User }; badge: Badge & { track: Track } };
    interviewer: Interviewer & { user: User };
    evaluation?: InterviewEvaluation;
  })[] {
    return this.state.interviews.map((i) => {
      const studentBadgeJourney = this.getJourney(i.studentBadgeJourneyId)!;
      const interviewer = this.getInterviewer(i.interviewerId)!;
      const evaluation = this.state.evaluations.find((e) => e.interviewId === i.id);
      return {
        ...i,
        studentBadgeJourney,
        interviewer,
        evaluation,
      };
    });
  }

  public getInterview(id: string) {
    const interviews = this.getInterviews();
    return interviews.find((i) => i.id === id);
  }

  public getEvaluations(): InterviewEvaluation[] {
    return [...this.state.evaluations];
  }

  public getEvaluationForInterview(interviewId: string): InterviewEvaluation | undefined {
    return this.state.evaluations.find((e) => e.interviewId === interviewId);
  }

  public getMalpracticeCases(): (MalpracticeCase & {
    studentBadgeJourney: StudentBadgeJourney & { student: Student & { user: User }; badge: Badge & { track: Track } };
  })[] {
    return this.state.malpracticeCases.map((m) => ({
      ...m,
      studentBadgeJourney: this.getJourney(m.studentBadgeJourneyId)!,
    }));
  }

  public getNotifications(userId: string): Notification[] {
    return this.state.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public markNotificationRead(id: string) {
    const notif = this.state.notifications.find((n) => n.id === id);
    if (notif && !notif.readAt) {
      notif.readAt = new Date().toISOString();
      this.saveState();
    }
  }

  public markAllNotificationsRead(userId: string) {
    const now = new Date().toISOString();
    this.state.notifications.forEach((n) => {
      if (n.userId === userId && !n.readAt) {
        n.readAt = now;
      }
    });
    this.saveState();
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.state.auditLogs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // --- Mutating Business Workflows ---

  /**
   * Safe Transactional Slot Booking
   */
  public bookInterviewSlot(params: {
    studentId: string;
    journeyId: string;
    slotId: string;
    actor: User;
  }): { success: boolean; interview?: Interview; error?: string } {
    const { studentId, journeyId, slotId, actor } = params;

    const journey = this.state.journeys.find((j) => j.id === journeyId);
    if (!journey) return { success: false, error: 'Student badge journey not found.' };

    const slot = this.state.slots.find((s) => s.id === slotId);
    if (!slot) return { success: false, error: 'Interview slot not found.' };

    const studentInterviews = this.state.interviews.filter(
      (i) => i.studentBadgeJourneyId === journey.id
    );
    const allSlotBookings = this.state.interviews.filter((i) => i.slotId === slot.id);

    // Run business validation
    const validation = validateBookingRequest({
      journey,
      slot,
      existingInterviews: studentInterviews,
      allActiveBookingsForSlot: allSlotBookings,
    });

    if (!validation.valid) {
      return { success: false, error: validation.errorMessage };
    }

    // Atomic Booking Execution
    slot.status = 'BOOKED';

    const nowIso = new Date().toISOString();
    const interviewId = `intv-${Date.now()}`;
    const newInterview: Interview = {
      id: interviewId,
      studentBadgeJourneyId: journey.id,
      interviewerId: slot.interviewerId,
      slotId: slot.id,
      attemptNumber: journey.currentAttemptNumber + 1,
      bookingStatus: 'BOOKED',
      interviewStatus: 'SCHEDULED',
      scheduledStart: slot.startAt,
      scheduledEnd: slot.endAt,
      meetingLink: `https://meet.grit.niatindia.com/room/grit-${slot.interviewerId}-${journey.studentId.slice(-4)}`,
      meetingPasscode: `GRIT${new Date(slot.startAt).getFullYear()}`,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    journey.currentAttemptNumber += 1;
    this.state.interviews.push(newInterview);

    // Audit Log
    const student = this.getStudent(studentId);
    const badge = this.getBadge(journey.badgeId);
    const interviewer = this.getInterviewer(slot.interviewerId);

    this.createAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'INTERVIEW_BOOKED',
      entityType: 'INTERVIEW',
      entityId: interviewId,
      previousValue: 'AVAILABLE',
      newValue: 'BOOKED',
      reason: `Slot reserved for ${badge?.name} with ${interviewer?.user.fullName}.`,
    });

    // In-App Notifications
    const formattedDate = new Date(slot.startAt).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const formattedTime = new Date(slot.startAt).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // 1. Student notification (Exact verbatim Message 2 from prompt)
    this.createNotification({
      userId: student!.userId,
      type: 'INTERVIEW_BOOKED',
      title: 'Your interview is confirmed!',
      message: `Your ${badge?.track.name} – ${badge?.name} interview is scheduled for ${formattedDate} at ${formattedTime} (IST). Your interviewer and meeting details are available below. Please join a few minutes early.`,
      relatedEntityType: 'INTERVIEW',
      relatedEntityId: interviewId,
    });

    // 2. Interviewer notification
    this.createNotification({
      userId: interviewer!.userId,
      type: 'INTERVIEW_BOOKED',
      title: `New Interview Scheduled: ${student?.user.fullName}`,
      message: `${student?.user.fullName} has booked an interview for ${badge?.name} on ${formattedDate} at ${formattedTime} IST.`,
      relatedEntityType: 'INTERVIEW',
      relatedEntityId: interviewId,
    });

    this.saveState();
    return { success: true, interview: newInterview };
  }

  /**
   * Safe Rescheduling (Atomic Swap)
   */
  public rescheduleInterview(params: {
    interviewId: string;
    newSlotId: string;
    actor: User;
    reason?: string;
  }): { success: boolean; error?: string } {
    const { interviewId, newSlotId, actor, reason } = params;

    const interview = this.state.interviews.find((i) => i.id === interviewId);
    if (!interview) return { success: false, error: 'Interview not found.' };

    const newSlot = this.state.slots.find((s) => s.id === newSlotId);
    if (!newSlot) return { success: false, error: 'New slot not found.' };

    const oldSlot = this.state.slots.find((s) => s.id === interview.slotId);

    const validation = validateRescheduleRequest({
      currentInterview: interview,
      newSlot,
      actorRole: actor.role,
    });

    if (!validation.valid) {
      return { success: false, error: validation.errorMessage };
    }

    // Atomic Swap
    newSlot.status = 'BOOKED';
    if (oldSlot) {
      oldSlot.status = 'AVAILABLE';
    }

    const previousStart = interview.scheduledStart;
    interview.slotId = newSlot.id;
    interview.interviewerId = newSlot.interviewerId;
    interview.scheduledStart = newSlot.startAt;
    interview.scheduledEnd = newSlot.endAt;
    interview.updatedAt = new Date().toISOString();

    const journey = this.getJourney(interview.studentBadgeJourneyId);
    const newInterviewer = this.getInterviewer(newSlot.interviewerId);

    this.createAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'INTERVIEW_RESCHEDULED',
      entityType: 'INTERVIEW',
      entityId: interview.id,
      previousValue: previousStart,
      newValue: newSlot.startAt,
      reason: reason || 'Candidate rescheduled interview to new slot.',
    });

    // Notify Student & Interviewer
    this.createNotification({
      userId: journey!.student.userId,
      type: 'RESCHEDULE_CONFIRMED',
      title: 'Interview Rescheduled Successfully',
      message: `Your interview for ${journey?.badge.name} has been moved to ${new Date(newSlot.startAt).toLocaleDateString()} at ${new Date(newSlot.startAt).toLocaleTimeString()} with ${newInterviewer?.user.fullName}.`,
      relatedEntityType: 'INTERVIEW',
      relatedEntityId: interview.id,
    });

    this.saveState();
    return { success: true };
  }

  /**
   * Cancel Booking
   */
  public cancelInterview(params: {
    interviewId: string;
    actor: User;
    reason: string;
  }): { success: boolean; error?: string } {
    const { interviewId, actor, reason } = params;

    const interview = this.state.interviews.find((i) => i.id === interviewId);
    if (!interview) return { success: false, error: 'Interview not found.' };

    const transCheck = canTransitionInterview(interview.interviewStatus, 'CANCELLED', actor.role);
    if (!transCheck.allowed) {
      return { success: false, error: transCheck.reason };
    }

    interview.bookingStatus = 'CANCELLED';
    interview.interviewStatus = 'CANCELLED';
    interview.cancelledAt = new Date().toISOString();
    interview.cancellationReason = reason;
    interview.updatedAt = new Date().toISOString();

    // Release slot
    const slot = this.state.slots.find((s) => s.id === interview.slotId);
    if (slot) {
      slot.status = 'AVAILABLE';
    }

    const journey = this.getJourney(interview.studentBadgeJourneyId);

    this.createAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'INTERVIEW_CANCELLED',
      entityType: 'INTERVIEW',
      entityId: interview.id,
      previousValue: 'BOOKED',
      newValue: 'CANCELLED',
      reason,
    });

    this.createNotification({
      userId: journey!.student.userId,
      type: 'BOOKING_CANCELLED',
      title: 'Interview Cancelled',
      message: `Your interview for ${journey?.badge.name} has been cancelled. Reason: ${reason}. You may book another slot when ready.`,
      relatedEntityType: 'INTERVIEW',
      relatedEntityId: interview.id,
    });

    this.saveState();
    return { success: true };
  }

  /**
   * Mark Attendance / Status Update
   */
  public updateInterviewStatus(params: {
    interviewId: string;
    status: InterviewStatus;
    actor: User;
  }): { success: boolean; error?: string } {
    const { interviewId, status, actor } = params;

    const interview = this.state.interviews.find((i) => i.id === interviewId);
    if (!interview) return { success: false, error: 'Interview not found.' };

    const check = canTransitionInterview(interview.interviewStatus, status, actor.role);
    if (!check.allowed) return { success: false, error: check.reason };

    const prev = interview.interviewStatus;
    interview.interviewStatus = status;
    interview.updatedAt = new Date().toISOString();

    if (status === 'COMPLETED' && !interview.completedAt) {
      interview.completedAt = new Date().toISOString();
    }

    this.createAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: `INTERVIEW_STATUS_${status}`,
      entityType: 'INTERVIEW',
      entityId: interview.id,
      previousValue: prev,
      newValue: status,
    });

    this.saveState();
    return { success: true };
  }

  /**
   * Interview Evaluation Submission
   */
  public submitEvaluation(params: {
    evaluationData: Omit<InterviewEvaluation, 'id' | 'submittedAt'>;
    actor: User;
  }): { success: boolean; error?: string; evaluation?: InterviewEvaluation } {
    const { evaluationData, actor } = params;

    const interview = this.state.interviews.find((i) => i.id === evaluationData.interviewId);
    if (!interview) return { success: false, error: 'Interview not found.' };

    if (interview.interviewerId !== actor.id && actor.role !== 'ADMIN' && actor.role !== 'INTERVIEWER') {
      return { success: false, error: 'Unauthorized to submit evaluation for this interview.' };
    }

    // Check if evaluation already exists
    const existing = this.state.evaluations.find((e) => e.interviewId === interview.id);
    if (existing) {
      return { success: false, error: 'Evaluation has already been submitted and is immutable.' };
    }

    const nowIso = new Date().toISOString();
    const newEvaluation: InterviewEvaluation = {
      ...evaluationData,
      id: `eval-${Date.now()}`,
      submittedAt: nowIso,
    };

    this.state.evaluations.push(newEvaluation);

    // Update interview status to COMPLETED if not already
    interview.interviewStatus = 'COMPLETED';
    interview.completedAt = nowIso;
    interview.updatedAt = nowIso;

    // Process outcome on student badge journey
    const journey = this.state.journeys.find((j) => j.id === interview.studentBadgeJourneyId);
    const badge = this.getBadge(journey!.badgeId);
    const student = this.getStudent(journey!.studentId);

    if (journey) {
      if (newEvaluation.outcome === 'PASS') {
        // Business Rule: Passing interview is the evaluation outcome.
        // In this automated policy, pass triggers official badge award
        const prevBadgeStatus = journey.badgeStatus;
        journey.badgeStatus = 'AWARDED';
        journey.awardedAt = nowIso;

        this.state.badgeEvents.push({
          id: `bev-${Date.now()}`,
          studentBadgeJourneyId: journey.id,
          previousStatus: prevBadgeStatus,
          newStatus: 'AWARDED',
          reason: `Interview passed with score ${newEvaluation.scoreData.problemSolvingScore}/5.`,
          actorId: actor.id,
          actorName: actor.fullName,
          createdAt: nowIso,
        });

        // Exact Message 3 from prompt
        this.createNotification({
          userId: student!.userId,
          type: 'PASS_RESULT',
          title: "Congratulations! You've cleared your interview!",
          message: `Your interview for the ${badge?.track.name} – ${badge?.name} badge has been marked as Passed. Your badge has been awarded. Keep progressing towards your next milestone!`,
          relatedEntityType: 'BADGE',
          relatedEntityId: journey.id,
        });
      } else if (newEvaluation.outcome === 'RETAKE_LATER') {
        this.createNotification({
          userId: student!.userId,
          type: 'RETAKE_ELIGIBILITY',
          title: 'Interview Outcome: Retake Later',
          message: `Your interview evaluation for ${badge?.name} has been marked as Retake Later. Review your feedback and re-booking will be available after the preparation cooldown.`,
          relatedEntityType: 'INTERVIEW',
          relatedEntityId: interview.id,
        });
      } else if (newEvaluation.outcome === 'FAIL') {
        this.createNotification({
          userId: student!.userId,
          type: 'FAIL_RESULT',
          title: 'Interview Result: Unsatisfactory',
          message: `Your interview for ${badge?.name} did not meet the required threshold. Please review the detailed feedback and consult your track mentors.`,
          relatedEntityType: 'INTERVIEW',
          relatedEntityId: interview.id,
        });
      }
    }

    this.createAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'EVALUATION_SUBMITTED',
      entityType: 'INTERVIEW_EVALUATION',
      entityId: newEvaluation.id,
      newValue: newEvaluation.outcome,
      reason: `Official assessment submitted: ${newEvaluation.outcome}`,
    });

    this.saveState();
    return { success: true, evaluation: newEvaluation };
  }

  /**
   * Malpractice Case Management
   */
  public reportMalpractice(params: {
    journeyId: string;
    reason: string;
    evidence: string;
    actor: User;
  }): { success: boolean; error?: string; case?: MalpracticeCase } {
    const { journeyId, reason, evidence, actor } = params;

    const journey = this.state.journeys.find((j) => j.id === journeyId);
    if (!journey) return { success: false, error: 'Student journey not found.' };

    const nowIso = new Date().toISOString();
    const caseId = `mal-${Date.now()}`;
    const newCase: MalpracticeCase = {
      id: caseId,
      studentBadgeJourneyId: journey.id,
      reportedBy: actor.id,
      reportedByName: actor.fullName,
      reason,
      evidenceReference: evidence,
      status: 'REPORTED',
      createdAt: nowIso,
    };

    // Move badge status to UNDER_REVIEW
    const prevStatus = journey.badgeStatus;
    journey.badgeStatus = 'UNDER_REVIEW';

    this.state.malpracticeCases.push(newCase);
    this.state.badgeEvents.push({
      id: `bev-${Date.now()}`,
      studentBadgeJourneyId: journey.id,
      previousStatus: prevStatus,
      newStatus: 'UNDER_REVIEW',
      reason: `Malpractice inquiry opened: ${reason}`,
      actorId: actor.id,
      actorName: actor.fullName,
      createdAt: nowIso,
    });

    const student = this.getStudent(journey.studentId);
    const badge = this.getBadge(journey.badgeId);

    // Neutral, respectful notification to student (Part 5.2 Screen 8 requirement)
    this.createNotification({
      userId: student!.userId,
      type: 'MALPRACTICE_REVIEW_OPENED',
      title: 'Badge Status Update: Administrative Review',
      message: `Your ${badge?.name} badge is currently under routine administrative verification. Our review team is verifying submission records and will notify you upon completion.`,
      relatedEntityType: 'MALPRACTICE_CASE',
      relatedEntityId: caseId,
    });

    this.createAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'MALPRACTICE_REPORTED',
      entityType: 'MALPRACTICE_CASE',
      entityId: caseId,
      newValue: 'UNDER_INVESTIGATION',
      reason,
    });

    this.saveState();
    return { success: true, case: newCase };
  }

  public resolveMalpracticeCase(params: {
    caseId: string;
    decision: 'CONFIRMED' | 'REJECTED';
    justification: string;
    actor: User;
  }): { success: boolean; error?: string } {
    const { caseId, decision, justification, actor } = params;

    if (actor.role !== 'ADMIN') {
      return { success: false, error: 'Only administrators are authorized to confirm or reject malpractice cases.' };
    }

    const mCase = this.state.malpracticeCases.find((c) => c.id === caseId);
    if (!mCase) return { success: false, error: 'Case not found.' };

    const check = canTransitionMalpractice(mCase.status, decision, actor.role);
    if (!check.allowed) return { success: false, error: check.reason };

    const nowIso = new Date().toISOString();
    mCase.status = decision;
    mCase.decision = decision;
    mCase.decisionJustification = justification;
    mCase.reviewerId = actor.id;
    mCase.reviewerName = actor.fullName;
    mCase.reviewedAt = nowIso;

    const journey = this.state.journeys.find((j) => j.id === mCase.studentBadgeJourneyId);
    const student = this.getStudent(journey!.studentId);
    const badge = this.getBadge(journey!.badgeId);

    if (journey) {
      const prev = journey.badgeStatus;
      if (decision === 'CONFIRMED') {
        journey.badgeStatus = 'NULLIFIED';
        journey.nullifiedAt = nowIso;
        journey.eligibilityStatus = 'ELIGIBILITY_REVOKED';

        this.state.badgeEvents.push({
          id: `bev-${Date.now()}`,
          studentBadgeJourneyId: journey.id,
          previousStatus: prev,
          newStatus: 'NULLIFIED',
          reason: `Malpractice confirmed: ${justification}`,
          actorId: actor.id,
          actorName: actor.fullName,
          createdAt: nowIso,
        });

        this.createNotification({
          userId: student!.userId,
          type: 'BADGE_NULLIFIED',
          title: 'Official Notice: Badge Revocation',
          message: `Following formal verification, your ${badge?.name} badge has been nullified. Decision reference: Case #${caseId}.`,
          relatedEntityType: 'BADGE',
          relatedEntityId: journey.id,
        });
      } else {
        // Reinstated
        journey.badgeStatus = 'REINSTATED';
        this.state.badgeEvents.push({
          id: `bev-${Date.now()}`,
          studentBadgeJourneyId: journey.id,
          previousStatus: prev,
          newStatus: 'REINSTATED',
          reason: `Malpractice inquiry dismissed: ${justification}`,
          actorId: actor.id,
          actorName: actor.fullName,
          createdAt: nowIso,
        });

        this.createNotification({
          userId: student!.userId,
          type: 'BADGE_REINSTATED',
          title: 'Badge Verification Concluded: Reinstated',
          message: `The review for your ${badge?.name} badge has concluded. Your badge status is fully reinstated.`,
          relatedEntityType: 'BADGE',
          relatedEntityId: journey.id,
        });
      }
    }

    this.createAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: `MALPRACTICE_${decision}`,
      entityType: 'MALPRACTICE_CASE',
      entityId: caseId,
      newValue: decision,
      reason: justification,
    });

    this.saveState();
    return { success: true };
  }

  /**
   * Set Interviewer Availability
   */
  public updateAvailability(params: {
    interviewerId: string;
    schedules: InterviewerAvailability[];
    actor: User;
  }): { success: boolean; error?: string } {
    const { interviewerId, schedules, actor } = params;

    if (actor.role !== 'ADMIN' && actor.id !== interviewerId) {
      return { success: false, error: 'Cannot modify availability of another interviewer.' };
    }

    // Filter out existing and replace
    this.state.availability = this.state.availability.filter((a) => a.interviewerId !== interviewerId);
    this.state.availability.push(...schedules);

    this.createAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'AVAILABILITY_UPDATED',
      entityType: 'INTERVIEWER_AVAILABILITY',
      entityId: interviewerId,
      reason: 'Updated weekly schedule windows.',
    });

    this.saveState();
    return { success: true };
  }

  /**
   * Admin Reassignment
   */
  public reassignInterviewer(params: {
    interviewId: string;
    newInterviewerId: string;
    actor: User;
    reason: string;
  }): { success: boolean; error?: string } {
    const { interviewId, newInterviewerId, actor, reason } = params;

    if (actor.role !== 'ADMIN') {
      return { success: false, error: 'Only administrators can reassign interviewers.' };
    }

    const interview = this.state.interviews.find((i) => i.id === interviewId);
    if (!interview) return { success: false, error: 'Interview not found.' };

    const newInterviewer = this.getInterviewer(newInterviewerId);
    if (!newInterviewer) return { success: false, error: 'Target interviewer not found.' };

    const oldInterviewer = this.getInterviewer(interview.interviewerId);
    interview.interviewerId = newInterviewerId;
    interview.updatedAt = new Date().toISOString();

    const journey = this.getJourney(interview.studentBadgeJourneyId);

    this.createAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'INTERVIEW_REASSIGNED',
      entityType: 'INTERVIEW',
      entityId: interview.id,
      previousValue: oldInterviewer?.user.fullName,
      newValue: newInterviewer.user.fullName,
      reason,
    });

    this.createNotification({
      userId: newInterviewer.userId,
      type: 'INTERVIEW_BOOKED',
      title: 'Interview Reassigned to You',
      message: `Interview for ${journey?.student.user.fullName} (${journey?.badge.name}) has been reassigned to you.`,
      relatedEntityType: 'INTERVIEW',
      relatedEntityId: interview.id,
    });

    this.saveState();
    return { success: true };
  }

  // --- Fast Switch Before-and-After Scenario Helper ---
  public setDemoScenario(scenario: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H') {
    // Modify student 1 (Aarav Sharma, user-stu-1) journey for instant interactive walkthrough
    const j1 = this.state.journeys.find((j) => j.id === 'journey-1');
    if (!j1) return;

    const studentSkills = this.state.studentSkills.filter((s) => s.studentId === 'stu-1');
    const existingIntv = this.state.interviews.find((i) => i.studentBadgeJourneyId === 'journey-1');

    switch (scenario) {
      case 'A': // Before eligibility: incomplete required skills
        j1.eligibilityStatus = 'NOT_ELIGIBLE';
        j1.badgeStatus = 'NOT_EARNED';
        studentSkills[2].completionStatus = 'IN_PROGRESS';
        studentSkills[3].completionStatus = 'NOT_STARTED';
        if (existingIntv) {
          this.state.interviews = this.state.interviews.filter((i) => i.id !== existingIntv.id);
        }
        break;

      case 'B': // Eligible but not booked: all skills complete, ready to book
        j1.eligibilityStatus = 'ELIGIBLE';
        j1.badgeStatus = 'NOT_EARNED';
        studentSkills[2].completionStatus = 'COMPLETED';
        studentSkills[3].completionStatus = 'COMPLETED';
        if (existingIntv) {
          this.state.interviews = this.state.interviews.filter((i) => i.id !== existingIntv.id);
        }
        break;

      case 'C': // Interview booked
        j1.eligibilityStatus = 'ELIGIBLE';
        j1.badgeStatus = 'NOT_EARNED';
        studentSkills.forEach((s) => (s.completionStatus = 'COMPLETED'));
        if (!existingIntv) {
          this.state.interviews.push({
            id: 'intv-demo-1',
            studentBadgeJourneyId: 'journey-1',
            interviewerId: 'int-1',
            slotId: 'slot-8',
            attemptNumber: 1,
            bookingStatus: 'BOOKED',
            interviewStatus: 'SCHEDULED',
            scheduledStart: '2026-11-12T14:00:00Z',
            scheduledEnd: '2026-11-12T14:45:00Z',
            meetingLink: 'https://meet.grit.niatindia.com/room/grit-ai-priya-0101',
            meetingPasscode: 'GRIT2026',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        } else {
          existingIntv.bookingStatus = 'BOOKED';
          existingIntv.interviewStatus = 'SCHEDULED';
        }
        break;

      case 'D': // Interview awaiting result
        j1.eligibilityStatus = 'ELIGIBLE';
        j1.badgeStatus = 'NOT_EARNED';
        if (!existingIntv) {
          this.setDemoScenario('C');
        }
        const intvD = this.state.interviews.find((i) => i.studentBadgeJourneyId === 'journey-1');
        if (intvD) {
          intvD.interviewStatus = 'COMPLETED';
          intvD.completedAt = new Date().toISOString();
        }
        this.state.evaluations = this.state.evaluations.filter((e) => e.interviewId !== intvD?.id);
        break;

      case 'E': // Passed & Badge Awarded
        j1.eligibilityStatus = 'ELIGIBLE';
        j1.badgeStatus = 'AWARDED';
        j1.awardedAt = new Date().toISOString();
        if (!existingIntv) {
          this.setDemoScenario('C');
        }
        const intvE = this.state.interviews.find((i) => i.studentBadgeJourneyId === 'journey-1');
        if (intvE) {
          intvE.interviewStatus = 'COMPLETED';
          if (!this.state.evaluations.find((e) => e.interviewId === intvE.id)) {
            this.state.evaluations.push({
              id: 'eval-demo-pass',
              interviewId: intvE.id,
              interviewerId: 'int-1',
              outcome: 'PASS',
              scoreData: { problemSolvingScore: 5, conceptualUnderstandingScore: 4.8, communicationScore: 5 },
              technicalAssessment: 'Exceptional answers on attention mechanics and prompt caching.',
              communicationAssessment: 'Highly articulate.',
              overallComments: 'Ready for global immersion trip.',
              studentFeedback: 'Fantastic clarity and depth on Transformer architectures. Badge awarded!',
              privateNotes: 'Top bracket candidate.',
              submittedAt: new Date().toISOString(),
            });
          }
        }
        break;

      case 'F': // Retake required
        j1.eligibilityStatus = 'ELIGIBLE';
        j1.badgeStatus = 'NOT_EARNED';
        if (!existingIntv) this.setDemoScenario('C');
        const intvF = this.state.interviews.find((i) => i.studentBadgeJourneyId === 'journey-1');
        if (intvF) {
          intvF.interviewStatus = 'COMPLETED';
          this.state.evaluations = this.state.evaluations.filter((e) => e.interviewId !== intvF.id);
          this.state.evaluations.push({
            id: 'eval-demo-retake',
            interviewId: intvF.id,
            interviewerId: 'int-1',
            outcome: 'RETAKE_LATER',
            scoreData: { problemSolvingScore: 3, conceptualUnderstandingScore: 2.8, communicationScore: 3.5 },
            technicalAssessment: 'Needs improvement on token calculations and attention formulas.',
            communicationAssessment: 'Good communication.',
            overallComments: 'Re-interview in 7 days after study period.',
            studentFeedback: 'Good foundation! Please review multi-head attention matrix projections before re-booking.',
            privateNotes: 'Cooldown applied.',
            submittedAt: new Date().toISOString(),
          });
        }
        break;

      case 'G': // Badge Under Review
        j1.eligibilityStatus = 'REQUIRES_ADMIN_REVIEW';
        j1.badgeStatus = 'UNDER_REVIEW';
        break;

      case 'H': // Badge Nullified
        j1.eligibilityStatus = 'ELIGIBILITY_REVOKED';
        j1.badgeStatus = 'NULLIFIED';
        j1.nullifiedAt = new Date().toISOString();
        break;
    }

    this.saveState();
  }

  // --- Private Helpers ---
  private createAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>) {
    const newLog: AuditLog = {
      ...log,
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    this.state.auditLogs.unshift(newLog);
  }

  private createNotification(notif: Omit<Notification, 'id' | 'createdAt'>) {
    const newNotif: Notification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    this.state.notifications.unshift(newNotif);
  }
}

export const repository = new Repository();
