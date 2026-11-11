import {
  EligibilityStatus,
  BookingStatus,
  InterviewStatus,
  EvaluationOutcome,
  BadgeStatus,
  MalpracticeStatus,
  UserRole,
} from '../../types';

export interface TransitionResult<T> {
  success: boolean;
  previousState: T;
  newState: T;
  error?: string;
  auditAction?: string;
}

// 1. Eligibility Transitions
const ALLOWED_ELIGIBILITY_TRANSITIONS: Record<EligibilityStatus, EligibilityStatus[]> = {
  NOT_ELIGIBLE: ['ELIGIBLE'],
  ELIGIBLE: ['ELIGIBILITY_REVOKED', 'NOT_ELIGIBLE'],
  ELIGIBILITY_REVOKED: ['REQUIRES_ADMIN_REVIEW', 'ELIGIBLE', 'NOT_ELIGIBLE'],
  REQUIRES_ADMIN_REVIEW: ['ELIGIBLE', 'ELIGIBILITY_REVOKED', 'NOT_ELIGIBLE'],
};

export function canTransitionEligibility(
  from: EligibilityStatus,
  to: EligibilityStatus,
  actorRole: UserRole
): { allowed: boolean; reason?: string } {
  // Only system/admin can override if already revoked/in review
  if (from === to) return { allowed: true };
  const allowedNext = ALLOWED_ELIGIBILITY_TRANSITIONS[from];
  if (!allowedNext || !allowedNext.includes(to)) {
    return {
      allowed: false,
      reason: `Invalid eligibility transition from ${from} to ${to}`,
    };
  }

  if (to === 'REQUIRES_ADMIN_REVIEW' || from === 'REQUIRES_ADMIN_REVIEW') {
    if (actorRole !== 'ADMIN') {
      return {
        allowed: false,
        reason: 'Only administrators can manage disputed review states',
      };
    }
  }

  return { allowed: true };
}

// 2. Booking Transitions
const ALLOWED_BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  AVAILABLE: ['BOOKED'],
  BOOKED: ['CANCELLATION_REQUESTED', 'RESCHEDULE_REQUESTED', 'CANCELLED', 'COMPLETED'],
  CANCELLATION_REQUESTED: ['CANCELLED', 'BOOKED'],
  RESCHEDULE_REQUESTED: ['BOOKED', 'CANCELLED'],
  CANCELLED: ['AVAILABLE'], // Slot becomes available again
  EXPIRED: [],
  COMPLETED: [],
};

export function canTransitionBooking(
  from: BookingStatus,
  to: BookingStatus,
  actorRole: UserRole
): { allowed: boolean; reason?: string } {
  if (from === to) return { allowed: true };
  const allowedNext = ALLOWED_BOOKING_TRANSITIONS[from];
  if (!allowedNext || !allowedNext.includes(to)) {
    return {
      allowed: false,
      reason: `Invalid booking transition from ${from} to ${to}`,
    };
  }

  if (to === 'CANCELLED' && from === 'BOOKED' && actorRole === 'STUDENT') {
    // Allowed if within policy
    return { allowed: true };
  }

  return { allowed: true };
}

// 3. Interview Transitions
const ALLOWED_INTERVIEW_TRANSITIONS: Record<InterviewStatus, InterviewStatus[]> = {
  SCHEDULED: ['STUDENT_CHECKED_IN', 'IN_PROGRESS', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'],
  STUDENT_CHECKED_IN: ['IN_PROGRESS', 'NO_SHOW', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'NO_SHOW'],
  COMPLETED: [], // Terminal interview state; evaluation outcome attached
  NO_SHOW: ['SCHEDULED'], // If rescheduled by admin
  CANCELLED: [],
  RESCHEDULED: [],
};

export function canTransitionInterview(
  from: InterviewStatus,
  to: InterviewStatus,
  actorRole: UserRole
): { allowed: boolean; reason?: string } {
  if (from === to) return { allowed: true };
  const allowedNext = ALLOWED_INTERVIEW_TRANSITIONS[from];
  if (!allowedNext || !allowedNext.includes(to)) {
    return {
      allowed: false,
      reason: `Invalid interview transition from ${from} to ${to}`,
    };
  }

  if (to === 'COMPLETED' || to === 'IN_PROGRESS' || to === 'STUDENT_CHECKED_IN') {
    if (actorRole !== 'INTERVIEWER' && actorRole !== 'ADMIN') {
      return {
        allowed: false,
        reason: 'Only the assigned interviewer or admin can progress interview status',
      };
    }
  }

  return { allowed: true };
}

// 4. Badge Transitions
const ALLOWED_BADGE_TRANSITIONS: Record<BadgeStatus, BadgeStatus[]> = {
  NOT_EARNED: ['PENDING_AWARD', 'AWARDED'],
  PENDING_AWARD: ['AWARDED', 'NOT_EARNED'],
  AWARDED: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['NULLIFIED', 'REINSTATED', 'AWARDED'],
  NULLIFIED: ['REINSTATED'], // Can only be reinstated via authorized review
  REINSTATED: ['UNDER_REVIEW'],
};

export function canTransitionBadge(
  from: BadgeStatus,
  to: BadgeStatus,
  actorRole: UserRole
): { allowed: boolean; reason?: string } {
  if (from === to) return { allowed: true };
  const allowedNext = ALLOWED_BADGE_TRANSITIONS[from];
  if (!allowedNext || !allowedNext.includes(to)) {
    return {
      allowed: false,
      reason: `Invalid badge state transition from ${from} to ${to}`,
    };
  }

  // Interviewers cannot directly award or nullify badges
  if (actorRole === 'INTERVIEWER') {
    return {
      allowed: false,
      reason: 'Interviewers cannot modify badge validity directly. Must be handled by admin or policy engine.',
    };
  }

  // Only admin can move to UNDER_REVIEW, NULLIFIED, or REINSTATED
  if ((to === 'NULLIFIED' || to === 'REINSTATED' || to === 'UNDER_REVIEW') && actorRole !== 'ADMIN') {
    return {
      allowed: false,
      reason: 'Administrative privileges required to modify badge review status.',
    };
  }

  return { allowed: true };
}

// 5. Malpractice Case Transitions
const ALLOWED_MALPRACTICE_TRANSITIONS: Record<MalpracticeStatus, MalpracticeStatus[]> = {
  REPORTED: ['UNDER_INVESTIGATION', 'CONFIRMED', 'REJECTED'],
  UNDER_INVESTIGATION: ['CONFIRMED', 'REJECTED'],
  CONFIRMED: [],
  REJECTED: [],
};

export function canTransitionMalpractice(
  from: MalpracticeStatus,
  to: MalpracticeStatus,
  actorRole: UserRole
): { allowed: boolean; reason?: string } {
  if (from === to) return { allowed: true };
  const allowedNext = ALLOWED_MALPRACTICE_TRANSITIONS[from];
  if (!allowedNext || !allowedNext.includes(to)) {
    return {
      allowed: false,
      reason: `Invalid malpractice transition from ${from} to ${to}`,
    };
  }

  if (actorRole !== 'ADMIN') {
    return {
      allowed: false,
      reason: 'Only authorized administrators can resolve malpractice cases.',
    };
  }

  return { allowed: true };
}
