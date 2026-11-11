import { Interview, RetakePolicyConfig } from '../../types';

export const DEFAULT_RETAKE_POLICY: RetakePolicyConfig = {
  cooldownDays: 7,
  maxAttempts: 3,
  requiresAdminApproval: false,
};

export interface RetakeEligibilityResult {
  canRetake: boolean;
  attemptNumber: number;
  remainingAttempts: number;
  cooldownExpiresAt?: string;
  reason?: string;
}

export function evaluateRetakeEligibility(
  previousInterviews: Interview[],
  config: RetakePolicyConfig = DEFAULT_RETAKE_POLICY,
  now: Date = new Date()
): RetakeEligibilityResult {
  const completedAttempts = previousInterviews.filter(
    (i) => i.interviewStatus === 'COMPLETED' || i.evaluation !== undefined
  );

  const attemptCount = completedAttempts.length;
  const nextAttemptNumber = attemptCount + 1;
  const remainingAttempts = Math.max(0, config.maxAttempts - attemptCount);

  if (attemptCount >= config.maxAttempts) {
    return {
      canRetake: false,
      attemptNumber: nextAttemptNumber,
      remainingAttempts: 0,
      reason: `Maximum attempts limit (${config.maxAttempts}) reached. Contact program administrators.`,
    };
  }

  // Find the most recent failed or retake evaluation
  const lastInterview = [...completedAttempts].sort(
    (a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime()
  )[0];

  if (lastInterview && lastInterview.evaluation?.outcome === 'RETAKE_LATER') {
    const evaluatedAt = new Date(lastInterview.evaluation.submittedAt || lastInterview.completedAt || lastInterview.createdAt);
    const cooldownExpires = new Date(evaluatedAt.getTime() + config.cooldownDays * 24 * 60 * 60 * 1000);

    if (now.getTime() < cooldownExpires.getTime()) {
      return {
        canRetake: false,
        attemptNumber: nextAttemptNumber,
        remainingAttempts,
        cooldownExpiresAt: cooldownExpires.toISOString(),
        reason: `Cool-down active until ${cooldownExpires.toLocaleDateString()}. Preparation period required before re-booking.`,
      };
    }
  }

  return {
    canRetake: true,
    attemptNumber: nextAttemptNumber,
    remainingAttempts,
  };
}

