import React, { useState, useEffect } from 'react';
import { useAuth } from '../../app/providers/AuthContext';
import { repository } from '../../services/api/repository';
import { evaluateStudentEligibility } from '../../domain/validators/eligibilityValidator';
import { Link } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  BookOpen,
  HelpCircle,
  Sparkles,
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
  const journey = repository.getJourneyForStudentAndBadge(student?.id || 'stu-1', selectedBadge.id);

  // Evaluate eligibility dynamically using domain validator
  const evaluation = evaluateStudentEligibility(requirements, studentSkills);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              Part 5.2 — Screen 2
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Badge Eligibility & Skills Audit</h1>
            <p className="text-sm text-slate-500 mt-1">
              Live online interviews unlock only after every mandatory skill contest requirement has been completed and verified.
            </p>
          </div>

          {/* Badge Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {badges.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBadgeId(b.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
                  selectedBadgeId === b.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Badge Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
              <Award className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  {selectedBadge.level} Level
                </span>
                <span className="text-xs text-slate-500 font-medium">Track: {selectedBadge.track.name}</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 mt-1">{selectedBadge.name}</h2>
              <p className="text-xs text-slate-600 max-w-2xl mt-0.5 leading-relaxed">{selectedBadge.description}</p>
            </div>
          </div>

          {/* Determination Status Card */}
          <div className={`p-4 rounded-xl border shrink-0 text-right ${
            evaluation.isEligible
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}>
            <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">Eligibility Determination</div>
            <div className="text-lg font-black mt-0.5 flex items-center justify-end gap-1.5">
              {evaluation.isEligible ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Eligible for Interview
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  Requirements Incomplete
                </>
              )}
            </div>
            <div className="text-xs mt-1 opacity-90">
              {evaluation.completedRequirements} of {evaluation.totalRequirements} mandatory skills verified ({evaluation.percentageCompleted}%)
            </div>
          </div>
        </div>

        {/* Requirements Table */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Mandatory Skill Contests & Rubric</h3>
            <span className="text-xs text-slate-500">Benchmark: minimum passing contest score required</span>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {requirements.map((req, idx) => {
              const prog = studentSkills.find((s) => s.skillId === req.skillId);
              const isDone = prog?.completionStatus === 'COMPLETED';

              return (
                <div key={req.id} className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5">
                      {isDone ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                          ✓
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs">
                          {idx + 1}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{req.skillName}</span>
                        {req.isMandatory && (
                          <span className="text-[10px] uppercase font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">
                            Mandatory
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{req.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:shrink-0 text-right">
                    <div>
                      <div className="text-[11px] text-slate-400">Min. Passing Bar</div>
                      <div className="text-xs font-bold text-slate-700">{req.minimumScore || 80}%</div>
                    </div>

                    <div className="min-w-28 text-right">
                      {isDone ? (
                        <div>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md inline-block">
                            Verified ({prog.score}%)
                          </span>
                          {prog.verifiedAt && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(prog.verifiedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md inline-block">
                          {prog?.completionStatus === 'IN_PROGRESS' ? 'In Progress' : 'Not Started'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Bar at bottom */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-600">
            <strong>System determination:</strong> {evaluation.summaryMessage}
          </div>

          {evaluation.isEligible ? (
            <Link
              to="/book-interview"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow"
            >
              Book Interview Slot <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100 px-4 py-2 rounded-xl">
              Booking Locked (Incomplete Requirements)
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
