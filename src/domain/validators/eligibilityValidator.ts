import { BadgeRequirement, StudentSkillProgress, EligibilityStatus } from '../../types';

export interface EligibilityEvaluation {
  status: EligibilityStatus;
  isEligible: boolean;
  totalRequirements: number;
  completedRequirements: number;
  percentageCompleted: number;
  pendingRequirements: BadgeRequirement[];
  completedList: { requirement: BadgeRequirement; progress?: StudentSkillProgress }[];
  summaryMessage: string;
}

export function evaluateStudentEligibility(
  requirements: BadgeRequirement[],
  studentProgress: StudentSkillProgress[]
): EligibilityEvaluation {
  const progressMap = new Map<string, StudentSkillProgress>();
  for (const prog of studentProgress) {
    progressMap.set(prog.skillId, prog);
  }

  const mandatoryRequirements = requirements.filter((r) => r.isMandatory);
  const pendingRequirements: BadgeRequirement[] = [];
  const completedList: { requirement: BadgeRequirement; progress?: StudentSkillProgress }[] = [];

  for (const req of mandatoryRequirements) {
    const prog = progressMap.get(req.skillId);
    const isCompleted = prog && prog.completionStatus === 'COMPLETED';

    if (isCompleted) {
      // Check minimum score if applicable
      if (req.minimumScore && (prog.score ?? 0) < req.minimumScore) {
        pendingRequirements.push(req);
      } else {
        completedList.push({ requirement: req, progress: prog });
      }
    } else {
      pendingRequirements.push(req);
    }
  }

  const totalMandatory = mandatoryRequirements.length;
  const completedMandatory = completedList.length;
  const isEligible = totalMandatory > 0 && pendingRequirements.length === 0;
  const percentage = totalMandatory > 0 ? Math.round((completedMandatory / totalMandatory) * 100) : 0;

  let summaryMessage = '';
  if (isEligible) {
    summaryMessage = 'All required track skills completed and verified. You are eligible to book your live badge interview.';
  } else {
    const pendingNames = pendingRequirements.map((r) => r.skillName).join(', ');
    summaryMessage = `Incomplete mandatory skills: ${pendingNames}. Complete remaining requirements to unlock booking.`;
  }

  return {
    status: isEligible ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
    isEligible,
    totalRequirements: totalMandatory,
    completedRequirements: completedMandatory,
    percentageCompleted: percentage,
    pendingRequirements,
    completedList,
    summaryMessage,
  };
}

