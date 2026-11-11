import React, { useState, useEffect } from 'react';
import { useAuth } from '../../app/providers/AuthContext';
import { repository } from '../../services/api/repository';
import { evaluateStudentEligibility } from '../../domain/validators/eligibilityValidator';
import { Link } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const BadgeEligibility: React.FC = () => {
  const { currentUser } = useAuth();
  const [, setTick] = useState(0);

  useEffect(() => {
    return repository.subscribe(() => setTick((t) => t + 1));
  }, []);

  const student = repository.getStudentByUserId(currentUser.id);
  const badges = repository.getBadges();
  const [selectedBadgeId, setSelectedBadgeId] = useState<string>('badge-1');

  const selectedBadge = badges.find((b) => b.id === selectedBadgeId) || badges[0];
  const requirements = repository.getBadgeRequirements(selectedBadge.id);
  const studentSkills = repository.getStudentSkills(student?.id || 'stu-1');

  // Evaluate eligibility dynamically using domain validator
  const evaluation = evaluateStudentEligibility(requirements, studentSkills);

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-zinc-950 tracking-tight">
              Badge Eligibility & Skills Audit
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Interviews unlock after completing all mandatory skill contest milestones.
            </p>
          </div>

          {/* Badge Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {badges.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBadgeId(b.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap border ${
                  selectedBadgeId === b.id
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                    : 'bg-zinc-50 text-zinc-600 border-zinc-200/80 hover:bg-zinc-100'
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Badge Overview */}
      <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 border border-zinc-200/60 flex items-center justify-center shrink-0 text-zinc-800">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">
                  {selectedBadge.level} Tier
                </span>
                <span className="text-xs text-zinc-500">Track: {selectedBadge.track.name}</span>
              </div>
              <h2 className="text-base font-semibold text-zinc-950 mt-1">{selectedBadge.name}</h2>
              <p className="text-xs text-zinc-500 max-w-xl mt-0.5 leading-relaxed">{selectedBadge.description}</p>
            </div>
          </div>

          {/* Status Box */}
          <div className="p-3.5 rounded-lg border border-zinc-200/80 bg-zinc-50/60 shrink-0 text-right">
            <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Eligibility Status</div>
            <div className="text-sm font-semibold mt-0.5 flex items-center justify-end gap-1.5">
              {evaluation.isEligible ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Eligible for Interview
                </span>
              ) : (
                <span className="text-zinc-700 flex items-center gap-1">
                  <Clock className="w-4 h-4 text-zinc-400" />
                  Requirements Incomplete
                </span>
              )}
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">
              {evaluation.completedRequirements} of {evaluation.totalRequirements} verified ({evaluation.percentageCompleted}%)
            </div>
          </div>
        </div>

        {/* Requirements Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
              Mandatory Skill Contests
            </h3>
            <span className="text-[11px] text-zinc-400">Min. passing bar: 80%</span>
          </div>

          <div className="divide-y divide-zinc-100 border border-zinc-200/80 rounded-lg overflow-hidden">
            {requirements.map((req, idx) => {
              const prog = studentSkills.find((s) => s.skillId === req.skillId);
              const isDone = prog?.completionStatus === 'COMPLETED';

              return (
                <div key={req.id} className="p-3.5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-zinc-400">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-zinc-100 text-zinc-400 text-[10px] font-mono flex items-center justify-center font-medium">
                          {idx + 1}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-zinc-900">{req.skillName}</span>
                        {req.isMandatory && (
                          <span className="text-[10px] text-zinc-500 bg-zinc-100 px-1.5 py-0.2 rounded font-medium">
                            Mandatory
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{req.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:shrink-0 text-right">
                    <div>
                      <div className="text-[10px] text-zinc-400">Passing Bar</div>
                      <div className="text-xs font-mono font-medium text-zinc-700">{req.minimumScore || 80}%</div>
                    </div>

                    <div className="min-w-24 text-right">
                      {isDone ? (
                        <div>
                          <span className="text-xs font-mono font-medium text-zinc-900 bg-zinc-100 border border-zinc-200/60 px-2 py-0.5 rounded">
                            {prog.score}%
                          </span>
                          {prog.verifiedAt && (
                            <div className="text-[10px] text-zinc-400 mt-0.5">
                              {new Date(prog.verifiedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400 bg-zinc-50 border border-zinc-200/60 px-2 py-0.5 rounded">
                          {prog?.completionStatus === 'IN_PROGRESS' ? 'In Progress' : 'Pending'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Footer */}
        <div className="pt-3 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-zinc-500">
            {evaluation.summaryMessage}
          </div>

          {evaluation.isEligible ? (
            <Link
              to="/book-interview"
              className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-colors"
            >
              Book Interview Slot <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <div className="inline-flex items-center gap-2 text-xs text-zinc-400 bg-zinc-50 border border-zinc-200/60 px-3 py-1.5 rounded-lg">
              Booking Locked (Incomplete Requirements)
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
