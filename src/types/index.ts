export type UserRole = 'STUDENT' | 'INTERVIEWER' | 'ADMIN';

export type EligibilityStatus = 
  | 'NOT_ELIGIBLE' 
  | 'ELIGIBLE' 
  | 'ELIGIBILITY_REVOKED' 
  | 'REQUIRES_ADMIN_REVIEW';

export type BookingStatus = 
  | 'AVAILABLE' 
  | 'BOOKED' 
  | 'CANCELLATION_REQUESTED' 
  | 'RESCHEDULE_REQUESTED' 
  | 'CANCELLED' 
  | 'EXPIRED' 
  | 'COMPLETED';

export type InterviewStatus = 
  | 'SCHEDULED' 
  | 'STUDENT_CHECKED_IN' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'NO_SHOW' 
  | 'CANCELLED' 
  | 'RESCHEDULED';

export type EvaluationOutcome = 
  | 'PASS' 
  | 'FAIL' 
  | 'RETAKE_LATER';

export type BadgeStatus = 
  | 'NOT_EARNED' 
  | 'PENDING_AWARD' 
  | 'AWARDED' 
  | 'UNDER_REVIEW' 
  | 'NULLIFIED' 
  | 'REINSTATED';

export type MalpracticeStatus = 
  | 'REPORTED' 
  | 'UNDER_INVESTIGATION' 
  | 'CONFIRMED' 
  | 'REJECTED';

export type NotificationType =
  | 'ELIGIBILITY_ACHIEVED'
  | 'INTERVIEW_BOOKED'
  | 'BOOKING_CANCELLED'
  | 'RESCHEDULE_CONFIRMED'
  | 'INTERVIEW_REMINDER'
  | 'INTERVIEW_COMPLETED'
  | 'EVALUATION_SUBMITTED'
  | 'PASS_RESULT'
  | 'FAIL_RESULT'
  | 'RETAKE_ELIGIBILITY'
  | 'BADGE_AWARDED'
  | 'MALPRACTICE_REVIEW_OPENED'
  | 'MALPRACTICE_CASE_RESOLVED'
  | 'BADGE_NULLIFIED'
  | 'BADGE_REINSTATED';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  userId: string;
  studentCode: string;
  batch: string;
  academicYear: string;
  college: string;
  milesEarned: number;
  qualiflyerRank: number;
  user?: User;
}

export interface Interviewer {
  id: string;
  userId: string;
  active: boolean;
  timezone: string;
  title: string;
  bio: string;
  specialization: string[];
  maxInterviewsPerDay: number;
  user?: User;
}

export interface Track {
  id: string;
  name: string;
  code: string;
  description: string;
  iconName: string;
  color: string;
  isActive: boolean;
}

export interface Badge {
  id: string;
  trackId: string;
  name: string;
  level: 'Novice' | 'Intermediate' | 'Practitioner' | 'Specialist' | 'Mastery';
  displayOrder: number;
  description: string;
  criteriaSummary: string;
  iconUrl?: string;
  isActive: boolean;
  track?: Track;
}

export interface BadgeRequirement {
  id: string;
  badgeId: string;
  skillId: string;
  skillName: string;
  description: string;
  isMandatory: boolean;
  minimumScore?: number;
}

export interface StudentSkillProgress {
  id: string;
  studentId: string;
  skillId: string;
  skillName: string;
  completionStatus: 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED';
  score?: number;
  verifiedAt?: string;
}

export interface StudentBadgeJourney {
  id: string;
  studentId: string;
  badgeId: string;
  eligibilityStatus: EligibilityStatus;
  badgeStatus: BadgeStatus;
  eligibleAt?: string;
  awardedAt?: string;
  nullifiedAt?: string;
  currentAttemptNumber: number;
  ineligibilityReason?: string;
  student?: Student;
  badge?: Badge;
}

export interface InterviewerAvailability {
  id: string;
  interviewerId: string;
  dayOfWeek: number; // 0=Sunday, 1=Monday ... 6=Saturday
  startTime: string; // HH:mm format, e.g. "10:00"
  endTime: string;   // HH:mm format, e.g. "18:00"
  effectiveFrom: string;
  effectiveUntil?: string;
  timezone: string;
  isActive: boolean;
  slotDurationMinutes: number; // default 45
  bufferMinutes: number; // default 15
}

export interface InterviewerUnavailability {
  id: string;
  interviewerId: string;
  startAt: string; // ISO string
  endAt: string;   // ISO string
  reason: string;
  createdAt: string;
}

export interface InterviewSlot {
  id: string;
  interviewerId: string;
  startAt: string; // ISO string
  endAt: string;   // ISO string
  status: 'AVAILABLE' | 'RESERVED' | 'BOOKED' | 'BLOCKED';
  interviewer?: Interviewer;
}

export interface Interview {
  id: string;
  studentBadgeJourneyId: string;
  interviewerId: string;
  slotId: string;
  attemptNumber: number;
  bookingStatus: BookingStatus;
  interviewStatus: InterviewStatus;
  scheduledStart: string;
  scheduledEnd: string;
  meetingLink: string;
  meetingPasscode?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  studentBadgeJourney?: StudentBadgeJourney;
  interviewer?: Interviewer;
  evaluation?: InterviewEvaluation;
}

export interface ScoreData {
  problemSolvingScore: number; // 1-5 or 1-10
  conceptualUnderstandingScore: number;
  communicationScore: number;
  practicalCodingScore?: number;
}

export interface InterviewEvaluation {
  id: string;
  interviewId: string;
  interviewerId: string;
  outcome: EvaluationOutcome;
  scoreData: ScoreData;
  technicalAssessment: string;
  communicationAssessment: string;
  overallComments: string;
  studentFeedback: string; // Student-visible
  privateNotes: string;   // Reviewer-only
  submittedAt: string;
  correctedAt?: string;
  correctionReason?: string;
  correctedBy?: string;
}

export interface MalpracticeCase {
  id: string;
  studentBadgeJourneyId: string;
  reportedBy: string; // user id
  reportedByName?: string;
  reason: string;
  evidenceReference: string;
  status: MalpracticeStatus;
  reviewerId?: string;
  reviewerName?: string;
  decision?: 'CONFIRMED' | 'REJECTED';
  decisionJustification?: string;
  reviewedAt?: string;
  createdAt: string;
  studentBadgeJourney?: StudentBadgeJourney;
}

export interface BadgeEvent {
  id: string;
  studentBadgeJourneyId: string;
  previousStatus: BadgeStatus;
  newStatus: BadgeStatus;
  reason: string;
  actorId: string;
  actorName: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: 'INTERVIEW' | 'BADGE' | 'MALPRACTICE_CASE';
  relatedEntityId?: string;
  readAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  previousValue?: string;
  newValue?: string;
  reason?: string;
  createdAt: string;
}

export interface RetakePolicyConfig {
  cooldownDays: number;
  maxAttempts: number;
  requiresAdminApproval: boolean;
}
