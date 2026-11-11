import React, { useState } from 'react';
import { repository } from '../../services/api/repository';
import { useAuth } from '../../app/providers/AuthContext';
import { useToast } from '../../app/providers/ToastContext';
import { PlayCircle, RotateCcw, ChevronDown, ChevronUp, Sparkles, UserCheck, ShieldAlert, Award } from 'lucide-react';

export const BeforeAfterDemoBar: React.FC = () => {
  const { currentUser, switchUser, switchRole } = useAuth();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string>('B');

  const handleScenarioChange = (scenario: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H') => {
    setActiveScenario(scenario);
    // Switch to Student 1 if not already
    switchUser('user-stu-1');
    repository.setDemoScenario(scenario);

    const labels: Record<string, string> = {
      A: 'Scenario A: Incomplete Skills (Not Eligible)',
      B: 'Scenario B: All Skills Complete (Eligible, Unbooked)',
      C: 'Scenario C: Interview Confirmed & Booked',
      D: 'Scenario D: Interview Completed (Evaluation Pending)',
      E: 'Scenario E: Passed & Badge Awarded',
      F: 'Scenario F: Retake Required (Cooldown Active)',
      G: 'Scenario G: Badge Under Malpractice Review',
      H: 'Scenario H: Badge Nullified (Integrity Sanction)',
    };

    toast({
      type: 'info',
      title: 'Demo Scenario Activated',
      message: `${labels[scenario]} loaded for student Aarav Sharma.`,
    });
  };

  const handleResetData = () => {
    repository.resetDemoData();
    switchUser('user-stu-1');
    setActiveScenario('B');
    toast({
      type: 'success',
      title: 'Demo Environment Reset',
      message: 'All seed data, interviews, logs, and badge journeys have been restored to initial state.',
    });
  };

  return (
    <div className="bg-slate-900 text-white border-b border-slate-800 text-xs transition-all shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Role Switcher & Environment Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-blue-900/60 text-blue-300 px-2.5 py-1 rounded-full border border-blue-700/50 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Simulated Prototype Environment
          </div>

          <div className="hidden sm:flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
            <span className="text-slate-400 px-2 py-0.5 text-[11px] font-medium">View As:</span>
            <button
              onClick={() => switchRole('STUDENT')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                currentUser.role === 'STUDENT'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Student (Aarav)
            </button>
            <button
              onClick={() => switchRole('INTERVIEWER')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                currentUser.role === 'INTERVIEWER'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Interviewer (Dr. Priya)
            </button>
            <button
              onClick={() => switchRole('ADMIN')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                currentUser.role === 'ADMIN'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Admin / Team
            </button>
          </div>
        </div>

        {/* Right: Quick Scenario Toggles & Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded-md border border-slate-700 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold">Before/After Scenarios</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleResetData}
            title="Reset repository to initial demo state"
            className="flex items-center gap-1 text-slate-400 hover:text-rose-300 px-2.5 py-1 rounded hover:bg-slate-800/80 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Expanded Scenario Bar (Part 6 Requirement: Scenarios A to H) */}
      {isExpanded && (
        <div className="bg-slate-950 border-t border-slate-800/80 px-4 py-3 animate-in slide-in-from-top-2">
          <div className="max-w-7xl mx-auto">
            <div className="text-[11px] text-slate-400 mb-2 font-medium flex items-center justify-between">
              <span>PART 6 INTERACTIVE LIFECYCLE WALKTHROUGH — Select a scenario to immediately preview student dashboard transformation:</span>
              <span className="text-amber-400/90 font-mono">Current: Scenario {activeScenario}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5">
              {[
                { id: 'A', name: 'A: Incomplete', desc: 'No booking CTA', color: 'hover:border-slate-500' },
                { id: 'B', name: 'B: Eligible', desc: 'Book interview CTA', color: 'hover:border-blue-500' },
                { id: 'C', name: 'C: Booked', desc: 'Upcoming schedule', color: 'hover:border-indigo-500' },
                { id: 'D', name: 'D: In Review', desc: 'Evaluation pending', color: 'hover:border-amber-500' },
                { id: 'E', name: 'E: Passed', desc: 'Badge awarded', color: 'hover:border-emerald-500' },
                { id: 'F', name: 'F: Retake', desc: 'Cooldown active', color: 'hover:border-orange-500' },
                { id: 'G', name: 'G: Under Review', desc: 'Malpractice inquiry', color: 'hover:border-yellow-500' },
                { id: 'H', name: 'H: Nullified', desc: 'Badge revoked', color: 'hover:border-rose-500' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleScenarioChange(s.id as any)}
                  className={`p-2 rounded text-left border transition ${
                    activeScenario === s.id
                      ? 'bg-blue-950/80 border-blue-500 text-white shadow-sm ring-1 ring-blue-500'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-bold text-[11px] flex items-center justify-between">
                    <span>{s.name}</span>
                    {activeScenario === s.id && <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
