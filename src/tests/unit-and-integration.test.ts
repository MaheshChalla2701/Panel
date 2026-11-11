import { describe, it, expect, beforeEach } from 'vitest';
import { repository } from '../services/api/repository';
import { evaluateStudentEligibility } from '../domain/validators/eligibilityValidator';
import {
  canTransitionEligibility,
  canTransitionBooking,
  canTransitionInterview,
  canTransitionBadge,
  canTransitionMalpractice,
} from '../domain/state-machines/transitions';
import { evaluateRetakeEligibility } from '../domain/policies/retakePolicy';
import { validateBookingRequest, validateRescheduleRequest } from '../domain/policies/bookingPolicy';
import { BadgeRequirement, StudentSkillProgress, Interview } from '../types';

describe('GRIT Interview Hub — Unit & Integration Test Suite', () => {
  beforeEach(() => {
    repository.resetDemoData();
  });

  describe('1. Eligibility Calculation Engine', () => {
    const mockRequirements: BadgeRequirement[] = [
      {
        id: 'r1',
        badgeId: 'b1',
        skillId: 's1',
        skillName: 'Skill One',
        description: 'First skill',
        isMandatory: true,
        minimumScore: 80,
      },
      {
        id: 'r2',
        badgeId: 'b1',
        skillId: 's2',
        skillName: 'Skill Two',
        description: 'Second skill',
        isMandatory: true,
        minimumScore: 75,
      },
    ];

    it('determines ELIGIBLE when all mandatory skills are completed with qualifying score', () => {
      const studentProgress: StudentSkillProgress[] = [
        { id: 'p1', studentId: 'stu-1', skillId: 's1', skillName: 'Skill One', completionStatus: 'COMPLETED', score: 85 },
        { id: 'p2', studentId: 'stu-1', skillId: 's2', skillName: 'Skill Two', completionStatus: 'COMPLETED', score: 90 },
      ];

      const result = evaluateStudentEligibility(mockRequirements, studentProgress);
      expect(result.isEligible).toBe(true);
      expect(result.status).toBe('ELIGIBLE');
      expect(result.completedRequirements).toBe(2);
      expect(result.percentageCompleted).toBe(100);
      expect(result.pendingRequirements.length).toBe(0);
    });

    it('determines NOT_ELIGIBLE when any mandatory skill is incomplete', () => {
      const studentProgress: StudentSkillProgress[] = [
        { id: 'p1', studentId: 'stu-1', skillId: 's1', skillName: 'Skill One', completionStatus: 'COMPLETED', score: 85 },
        { id: 'p2', studentId: 'stu-1', skillId: 's2', skillName: 'Skill Two', completionStatus: 'IN_PROGRESS', score: 40 },
      ];

      const result = evaluateStudentEligibility(mockRequirements, studentProgress);
      expect(result.isEligible).toBe(false);
      expect(result.status).toBe('NOT_ELIGIBLE');
      expect(result.completedRequirements).toBe(1);
      expect(result.percentageCompleted).toBe(50);
      expect(result.pendingRequirements[0].skillName).toBe('Skill Two');
    });

    it('determines NOT_ELIGIBLE if score is below minimum threshold', () => {
      const studentProgress: StudentSkillProgress[] = [
        { id: 'p1', studentId: 'stu-1', skillId: 's1', skillName: 'Skill One', completionStatus: 'COMPLETED', score: 70 }, // Min is 80
        { id: 'p2', studentId: 'stu-1', skillId: 's2', skillName: 'Skill Two', completionStatus: 'COMPLETED', score: 90 },
      ];

      const result = evaluateStudentEligibility(mockRequirements, studentProgress);
      expect(result.isEligible).toBe(false);
      expect(result.pendingRequirements.length).toBe(1);
    });
  });

  describe('2. State Machine Transitions & Permission Guard', () => {
    it('allows valid student eligibility transitions and rejects invalid ones', () => {
      expect(canTransitionEligibility('NOT_ELIGIBLE', 'ELIGIBLE', 'ADMIN').allowed).toBe(true);
      expect(canTransitionEligibility('ELIGIBLE', 'ELIGIBILITY_REVOKED', 'ADMIN').allowed).toBe(true);
      expect(canTransitionEligibility('NOT_ELIGIBLE', 'ELIGIBILITY_REVOKED', 'STUDENT').allowed).toBe(false);
    });

    it('prevents students or interviewers from directly awarding or nullifying badges', () => {
      expect(canTransitionBadge('AWARDED', 'NULLIFIED', 'STUDENT').allowed).toBe(false);
      expect(canTransitionBadge('AWARDED', 'NULLIFIED', 'INTERVIEWER').allowed).toBe(false);
      expect(canTransitionBadge('AWARDED', 'UNDER_REVIEW', 'ADMIN').allowed).toBe(true);
      expect(canTransitionBadge('UNDER_REVIEW', 'NULLIFIED', 'ADMIN').allowed).toBe(true);
      expect(canTransitionBadge('UNDER_REVIEW', 'REINSTATED', 'ADMIN').allowed).toBe(true);
    });

    it('enforces authorized admin resolution for malpractice cases', () => {
      expect(canTransitionMalpractice('UNDER_INVESTIGATION', 'CONFIRMED', 'STUDENT').allowed).toBe(false);
      expect(canTransitionMalpractice('UNDER_INVESTIGATION', 'CONFIRMED', 'INTERVIEWER').allowed).toBe(false);
      expect(canTransitionMalpractice('UNDER_INVESTIGATION', 'CONFIRMED', 'ADMIN').allowed).toBe(true);
      expect(canTransitionMalpractice('UNDER_INVESTIGATION', 'REJECTED', 'ADMIN').allowed).toBe(true);
    });
  });

  describe('3. Retake Policy & Attempt Limits', () => {
    const baseInterview: Interview = {
      id: 'i1',
      studentBadgeJourneyId: 'j1',
      interviewerId: 'int-1',
      slotId: 's1',
      attemptNumber: 1,
      bookingStatus: 'BOOKED',
      interviewStatus: 'COMPLETED',
      scheduledStart: '2026-11-01T10:00:00Z',
      scheduledEnd: '2026-11-01T10:45:00Z',
      meetingLink: 'https://meet.test',
      completedAt: '2026-11-01T10:45:00Z',
      createdAt: '2026-10-25T10:00:00Z',
      updatedAt: '2026-11-01T10:45:00Z',
      evaluation: {
        id: 'e1',
        interviewId: 'i1',
        interviewerId: 'int-1',
        outcome: 'RETAKE_LATER',
        scoreData: { problemSolvingScore: 3, conceptualUnderstandingScore: 3, communicationScore: 3 },
        technicalAssessment: 'Needs prep',
        communicationAssessment: 'Good',
        overallComments: 'Retake recommended',
        studentFeedback: 'Review attention heads',
        privateNotes: 'Cooldown applies',
        submittedAt: '2026-11-01T11:00:00Z',
      },
    };

    it('enforces 7-day cooldown period following RETAKE_LATER outcome', () => {
      // 3 days later: still inside cooldown
      const checkDateInsideCooldown = new Date('2026-11-04T12:00:00Z');
      const resultInside = evaluateRetakeEligibility([baseInterview], undefined, checkDateInsideCooldown);
      expect(resultInside.canRetake).toBe(false);
      expect(resultInside.cooldownExpiresAt).toBeDefined();

      // 8 days later: cooldown expired
      const checkDateOutsideCooldown = new Date('2026-11-09T12:00:00Z');
      const resultOutside = evaluateRetakeEligibility([baseInterview], undefined, checkDateOutsideCooldown);
      expect(resultOutside.canRetake).toBe(true);
      expect(resultOutside.attemptNumber).toBe(2);
      expect(resultOutside.remainingAttempts).toBe(2);
    });

    it('rejects retake attempts when maximum attempts (3) have been reached', () => {
      const threeAttempts: Interview[] = [
        { ...baseInterview, id: 'i1', attemptNumber: 1 },
        { ...baseInterview, id: 'i2', attemptNumber: 2 },
        { ...baseInterview, id: 'i3', attemptNumber: 3 },
      ];

      const result = evaluateRetakeEligibility(threeAttempts);
      expect(result.canRetake).toBe(false);
      expect(result.remainingAttempts).toBe(0);
      expect(result.reason).toContain('Maximum attempts limit (3) reached');
    });
  });

  describe('4. Transactional Slot Booking & Concurrency Protection', () => {
    it('prevents booking when candidate is NOT_ELIGIBLE', () => {
      const student = repository.getStudent('stu-3')!; // Ineligible student
      const journey = repository.getJourney('journey-3')!;
      const availableSlot = repository.getSlots().find((s) => s.status === 'AVAILABLE')!;

      const res = repository.bookInterviewSlot({
        studentId: student.id,
        journeyId: journey.id,
        slotId: availableSlot.id,
        actor: student.user,
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('not eligible');
    });

    it('successfully reserves an open slot for an eligible candidate and releases upon cancellation', () => {
      const student = repository.getStudent('stu-1')!; // Eligible student (Aarav Sharma)
      const journey = repository.getJourney('journey-1')!;
      const availableSlot = repository.getSlots().find((s) => s.status === 'AVAILABLE' && new Date(s.startAt).getTime() > Date.now())!;

      // 1. Book Slot
      const res = repository.bookInterviewSlot({
        studentId: student.id,
        journeyId: journey.id,
        slotId: availableSlot.id,
        actor: student.user,
      });

      expect(res.success).toBe(true);
      expect(res.interview).toBeDefined();
      expect(res.interview?.bookingStatus).toBe('BOOKED');

      // Slot is now BOOKED and unavailable
      const updatedSlot = repository.getSlots().find((s) => s.id === availableSlot.id);
      expect(updatedSlot?.status).toBe('BOOKED');

      // 2. Second candidate attempts to book the same slot -> Must FAIL (concurrency protection)
      const student2 = repository.getStudent('stu-12')!; // Tanvi Hegde (also eligible)
      const journey2 = repository.getJourney('journey-12')!;

      const conflictRes = repository.bookInterviewSlot({
        studentId: student2.id,
        journeyId: journey2.id,
        slotId: availableSlot.id,
        actor: student2.user,
      });

      expect(conflictRes.success).toBe(false);
      expect(conflictRes.error).toContain('no longer available');

      // 3. Candidate cancels booking -> slot becomes AVAILABLE again
      const cancelRes = repository.cancelInterview({
        interviewId: res.interview!.id,
        actor: student.user,
        reason: 'Exam conflict',
      });

      expect(cancelRes.success).toBe(true);
      const slotAfterCancel = repository.getSlots().find((s) => s.id === availableSlot.id);
      expect(slotAfterCancel?.status).toBe('AVAILABLE');
    });

    it('executes safe transactional rescheduling (atomic swap)', () => {
      const interview = repository.getInterview('intv-1')!; // Diya Patel scheduled interview
      const student = repository.getStudent('stu-2')!;
      const openSlots = repository.getSlots().filter((s) => s.status === 'AVAILABLE');
      const targetSlot = openSlots[0];

      const res = repository.rescheduleInterview({
        interviewId: interview.id,
        newSlotId: targetSlot.id,
        actor: student.user,
        reason: 'Schedule adjustment',
      });

      expect(res.success).toBe(true);
      const updatedInterview = repository.getInterview('intv-1')!;
      expect(updatedInterview.slotId).toBe(targetSlot.id);
      expect(updatedInterview.scheduledStart).toBe(targetSlot.startAt);

      // Old slot is released, new slot is booked
      const newSlotCheck = repository.getSlots().find((s) => s.id === targetSlot.id);
      expect(newSlotCheck?.status).toBe('BOOKED');
    });
  });

  describe('5. Evaluator Assessment & Badge Awarding', () => {
    it('submitting a PASS evaluation records outcome and awards the Track Badge', () => {
      const interview = repository.getInterview('intv-2')!; // Sneha Kulkarni completed interview
      const interviewer = repository.getInterviewer('int-1')!;

      const res = repository.submitEvaluation({
        evaluationData: {
          interviewId: interview.id,
          interviewerId: interviewer.id,
          outcome: 'PASS',
          scoreData: {
            problemSolvingScore: 5,
            conceptualUnderstandingScore: 4.8,
            communicationScore: 5,
            practicalCodingScore: 4.9,
          },
          technicalAssessment: 'Superb Transformer expertise',
          communicationAssessment: 'Outstanding',
          overallComments: 'Clear pass',
          studentFeedback: 'Great job!',
          privateNotes: 'Exemplary candidate',
        },
        actor: interviewer.user,
      });

      expect(res.success).toBe(true);
      expect(res.evaluation?.outcome).toBe('PASS');

      // Check student journey badge status
      const journey = repository.getJourney(interview.studentBadgeJourneyId)!;
      expect(journey.badgeStatus).toBe('AWARDED');
      expect(journey.awardedAt).toBeDefined();

      // Check student notification generated (Exact Message 3)
      const notifications = repository.getNotifications(journey.student.userId);
      const passNotif = notifications.find((n) => n.type === 'PASS_RESULT');
      expect(passNotif).toBeDefined();
      expect(passNotif?.title).toBe("Congratulations! You've cleared your interview!");
    });
  });

  describe('6. Malpractice Investigation & Badge Nullification Lifecycle', () => {
    it('reporting malpractice moves badge to UNDER_REVIEW and confirming it NULLIFIES badge', () => {
      const admin = repository.getUser('user-adm-1')!;
      const journey = repository.getJourney('journey-5')!; // Vikram Malhotra (Awarded badge)
      expect(journey.badgeStatus).toBe('AWARDED');

      // 1. Report Malpractice
      const reportRes = repository.reportMalpractice({
        journeyId: journey.id,
        reason: 'Third-party code submission flag',
        evidence: 'GitHub commit hash cross-reference',
        actor: admin,
      });

      expect(reportRes.success).toBe(true);
      const underReviewJourney = repository.getJourney('journey-5')!;
      expect(underReviewJourney.badgeStatus).toBe('UNDER_REVIEW');

      // 2. Admin confirms malpractice
      const resolveRes = repository.resolveMalpracticeCase({
        caseId: reportRes.case!.id,
        decision: 'CONFIRMED',
        justification: 'Disciplinary board verified outside collaboration.',
        actor: admin,
      });

      expect(resolveRes.success).toBe(true);
      const nullifiedJourney = repository.getJourney('journey-5')!;
      expect(nullifiedJourney.badgeStatus).toBe('NULLIFIED');
      expect(nullifiedJourney.nullifiedAt).toBeDefined();

      // Historical interview data remains preserved!
      const historicalInterviews = repository
        .getInterviews()
        .filter((i) => i.studentBadgeJourneyId === journey.id);
      expect(historicalInterviews.length).toBeGreaterThan(0);
    });

    it('rejecting malpractice reinstates the badge without data destruction', () => {
      const admin = repository.getUser('user-adm-1')!;
      const existingCase = repository.getMalpracticeCases().find((c) => c.id === 'mal-1')!; // Meera Nair

      const resolveRes = repository.resolveMalpracticeCase({
        caseId: existingCase.id,
        decision: 'REJECTED',
        justification: 'False positive flag caused by campus network route change.',
        actor: admin,
      });

      expect(resolveRes.success).toBe(true);
      const reinstatedJourney = repository.getJourney(existingCase.studentBadgeJourneyId)!;
      expect(reinstatedJourney.badgeStatus).toBe('REINSTATED');
    });
  });
});
