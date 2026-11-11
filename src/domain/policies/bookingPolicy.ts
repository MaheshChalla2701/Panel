import { InterviewSlot, StudentBadgeJourney, Interview, UserRole } from '../../types';

export interface BookingValidationResult {
  valid: boolean;
  errorCode?: string;
  errorMessage?: string;
}

export function validateBookingRequest(params: {
  journey: StudentBadgeJourney;
  slot: InterviewSlot;
  existingInterviews: Interview[];
  allActiveBookingsForSlot: Interview[];
  requestTime?: Date;
}): BookingValidationResult {
  const { journey, slot, existingInterviews, allActiveBookingsForSlot, requestTime = new Date() } = params;

  // 1. Eligibility Check
  if (journey.eligibilityStatus !== 'ELIGIBLE') {
    return {
      valid: false,
      errorCode: 'NOT_ELIGIBLE',
      errorMessage: `Student is not eligible for interview (Current status: ${journey.eligibilityStatus}).`,
    };
  }

  // 2. Badge Awarded Check
  if (journey.badgeStatus === 'AWARDED') {
    return {
      valid: false,
      errorCode: 'BADGE_ALREADY_AWARDED',
      errorMessage: 'This badge has already been awarded to the student.',
    };
  }

  // 3. Slot Availability Check
  if (slot.status !== 'AVAILABLE') {
    return {
      valid: false,
      errorCode: 'SLOT_NOT_AVAILABLE',
      errorMessage: 'The selected slot is no longer available. Please select another slot.',
    };
  }

  // Check if slot start time is in the past
  if (new Date(slot.startAt).getTime() <= requestTime.getTime()) {
    return {
      valid: false,
      errorCode: 'SLOT_EXPIRED',
      errorMessage: 'The selected slot time has already passed. Please choose a future slot.',
    };
  }

  // 4. Concurrency / Double Booking check on the slot
  const isSlotOccupied = allActiveBookingsForSlot.some(
    (b) => b.slotId === slot.id && b.bookingStatus === 'BOOKED' && b.interviewStatus !== 'CANCELLED'
  );
  if (isSlotOccupied) {
    return {
      valid: false,
      errorCode: 'SLOT_ALREADY_RESERVED',
      errorMessage: 'This slot has just been reserved by another candidate. Please select another time.',
    };
  }

  // 5. Existing Active Booking for this Journey
  const hasActiveBooking = existingInterviews.some(
    (i) =>
      i.studentBadgeJourneyId === journey.id &&
      i.bookingStatus === 'BOOKED' &&
      (i.interviewStatus === 'SCHEDULED' || i.interviewStatus === 'IN_PROGRESS' || i.interviewStatus === 'STUDENT_CHECKED_IN')
  );
  if (hasActiveBooking) {
    return {
      valid: false,
      errorCode: 'EXISTING_ACTIVE_BOOKING',
      errorMessage: 'You already have an active interview booked for this badge. You may reschedule or cancel your current booking.',
    };
  }

  // 6. Overlapping Booking across any track for the student
  const slotStart = new Date(slot.startAt).getTime();
  const slotEnd = new Date(slot.endAt).getTime();
  const hasOverlappingTime = existingInterviews.some((i) => {
    if (i.bookingStatus !== 'BOOKED' || i.interviewStatus === 'CANCELLED') return false;
    const bStart = new Date(i.scheduledStart).getTime();
    const bEnd = new Date(i.scheduledEnd).getTime();
    return slotStart < bEnd && slotEnd > bStart;
  });

  if (hasOverlappingTime) {
    return {
      valid: false,
      errorCode: 'TIME_CONFLICT',
      errorMessage: 'You already have another interview scheduled during this time window.',
    };
  }

  return { valid: true };
}

export function validateRescheduleRequest(params: {
  currentInterview: Interview;
  newSlot: InterviewSlot;
  actorRole: UserRole;
  requestTime?: Date;
}): BookingValidationResult {
  const { currentInterview, newSlot, actorRole, requestTime = new Date() } = params;

  if (currentInterview.bookingStatus !== 'BOOKED') {
    return {
      valid: false,
      errorCode: 'CANNOT_RESCHEDULE',
      errorMessage: `Cannot reschedule an interview with status: ${currentInterview.bookingStatus}`,
    };
  }

  if (currentInterview.interviewStatus !== 'SCHEDULED') {
    return {
      valid: false,
      errorCode: 'INTERVIEW_ALREADY_STARTED',
      errorMessage: `Cannot reschedule an interview that has status: ${currentInterview.interviewStatus}`,
    };
  }

  // Policy: student cannot reschedule less than 2 hours before the interview without admin
  const currentStart = new Date(currentInterview.scheduledStart).getTime();
  const diffHours = (currentStart - requestTime.getTime()) / (1000 * 60 * 60);
  if (diffHours < 2 && actorRole === 'STUDENT') {
    return {
      valid: false,
      errorCode: 'LATE_RESCHEDULE_WINDOW',
      errorMessage: 'Rescheduling within 2 hours of the scheduled time requires administrative approval.',
    };
  }

  if (newSlot.status !== 'AVAILABLE') {
    return {
      valid: false,
      errorCode: 'NEW_SLOT_UNAVAILABLE',
      errorMessage: 'The new slot is not available.',
    };
  }

  return { valid: true };
}
