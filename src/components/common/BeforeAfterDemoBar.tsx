import React, { useState } from 'react';
import { repository } from '../../services/api/repository';
import { useAuth } from '../../app/providers/AuthContext';
import { useToast } from '../../app/providers/ToastContext';
import { RotateCcw, ChevronDown, ChevronUp, Layers, Check } from 'lucide-react';

export const BeforeAfterDemoBar: React.FC = () => {
  const { currentUser, switchUser, switchRole } = useAuth();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string>('B');

  const handleScenarioChange = (scenario: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H') => {
    setActiveScenario(scenario);
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
      title: 'Scenario Loaded',
      message: `${labels[scenario]} active for student Aarav Sharma.`,
    });
  };

  const handleResetData = () => {
    repository.resetDemoData();
    switchUser('user-stu-1');
    setActiveScenario('B');
    toast({
      type: 'success',
      title: 'Data Reset',
      message: 'Demo state restored to default seed cohort.',
    });
  };

  const scenarios: Array<{
    id: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';
    label: string;
    description: string;
  }> = [
    { id: 'A', label: 'A: Incomplete Skills', description: 'Pending contest tests' },
    { id: 'B', label: 'B: Eligible & Unbooked', description: 'Ready to book' },
    { id: 'C', label: 'C: Confirmed Booking', description: 'Upcoming slot reserved' },
    { id: 'D', label: 'D: Evaluation Pending', description: 'Interview concluded' },
    { id: 'E', label: 'E: Passed & Awarded', description: 'Official badge credential' },
    { id: 'F', label: 'F: Retake Cooldown', description: '7-day preparation hold' },
    { id: 'G', label: 'G: Under Review', description: 'Integrity inquiry' },
    { id: 'H', label: 'H: Nullified Badge', description: 'Disciplinary sanction' },
  ];

  return (
    <div className="bg-zinc-950 text-zinc-300 border-b border-zinc-800 text-[11px] selection:bg-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Role Switcher & Status Dot */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-zinc-400 font-medium tracking-tight">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="text-zinc-200 font-medium">Demo Mode</span>
          </div>

          <div className="h-3 w-px bg-zinc-800 hidden sm:block"></div>

          <div className="flex items-center bg-zinc-900 rounded-md p-0.5 border border-zinc-800">
            <span className="text-zinc-500 px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold">
              Role
            </span>
            <button
              onClick={() => switchRole('STUDENT')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                currentUser.role === 'STUDENT'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Student
            </button>
            <button
              onClick={() => switchRole('INTERVIEWER')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                currentUser.role === 'INTERVIEWER'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Interviewer
            </button>
            <button
              onClick={() => switchRole('ADMIN')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                currentUser.role === 'ADMIN'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Admin
            </button>
          </div>
        </div>

        {/* Right: Scenarios Dropdown & Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 px-2.5 py-1 rounded-md border border-zinc-800 transition-colors font-medium"
          >
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            <span>Scenario: <strong className="text-white font-semibold">Scenario {activeScenario}</strong></span>
            {isExpanded ? <ChevronUp className="w-3 h-3 text-zinc-400" /> : <ChevronDown className="w-3 h-3 text-zinc-400" />}
          </button>

          <button
            onClick={handleResetData}
            title="Reset to default seed state"
            className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded-md hover:bg-zinc-900 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Expanded Scenario Drawer */}
      {isExpanded && (
        <div className="border-t border-zinc-800/80 bg-zinc-900/90 px-4 sm:px-6 py-3 transition-all">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400">
                Candidate Lifecycle Presets
              </span>
              <span className="text-[10px] text-zinc-400">
                Updates student <strong>Aarav Sharma</strong>
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5">
              {scenarios.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    handleScenarioChange(s.id);
                    setIsExpanded(false);
                  }}
                  className={`text-left p-2 rounded-md border transition-all ${
                    activeScenario === s.id
                      ? 'bg-zinc-800 border-zinc-600 text-white'
                      : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-medium text-[11px] mb-0.5">
                    <span>{s.id}</span>
                    {activeScenario === s.id && <Check className="w-3 h-3 text-emerald-400" />}
                  </div>
                  <div className="text-[10px] text-zinc-400 leading-tight truncate">
                    {s.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
