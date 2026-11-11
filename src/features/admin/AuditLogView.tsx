import React, { useState, useEffect } from 'react';
import { repository } from '../../services/api/repository';
import { Search } from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const [, setTick] = useState(0);

  useEffect(() => {
    return repository.subscribe(() => setTick((t) => t + 1));
  }, []);

  const logs = repository.getAuditLogs();
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');

  const filteredLogs = logs.filter((l) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchActor = l.actorName.toLowerCase().includes(q);
      const matchAction = l.action.toLowerCase().includes(q);
      const matchReason = (l.reason || '').toLowerCase().includes(q);
      if (!matchActor && !matchAction && !matchReason) return false;
    }

    if (entityFilter !== 'ALL' && l.entityType !== entityFilter) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-zinc-950 tracking-tight">
              System Audit Log
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Append-only immutable record of all state transitions, reviews, overrides, and scores.
            </p>
          </div>

          <div className="text-xs font-mono text-zinc-500 bg-zinc-50 px-2.5 py-1 rounded-md border border-zinc-200/80">
            {logs.length} logged events
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-zinc-200/80 p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search action, actor, reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="text-xs font-medium border border-zinc-200 rounded-md px-2.5 py-1 bg-white text-zinc-700"
          >
            <option value="ALL">All Entity Types</option>
            <option value="INTERVIEW">Interview Bookings</option>
            <option value="INTERVIEW_EVALUATION">Evaluations</option>
            <option value="STUDENT_BADGE_JOURNEY">Badge Journeys</option>
            <option value="MALPRACTICE_CASE">Malpractice Cases</option>
            <option value="INTERVIEWER_AVAILABILITY">Availability</option>
          </select>
        </div>
      </div>

      {/* Log Feed Table */}
      <div className="bg-white rounded-xl border border-zinc-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/70 border-b border-zinc-200/80 text-zinc-500 font-medium uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Transition</th>
                <th className="py-3 px-4">Reason</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-zinc-400">
                    No audit records match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50/50 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-4 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                      {new Date(log.createdAt).toISOString().replace('T', ' ').slice(0, 19)}
                    </td>

                    {/* Actor */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-zinc-950">{log.actorName}</div>
                      <div className="text-[10px] uppercase font-medium text-zinc-400">{log.actorRole}</div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] bg-zinc-100 text-zinc-800 border border-zinc-200/60 px-1.5 py-0.2 rounded font-medium">
                        {log.action}
                      </span>
                    </td>

                    {/* Entity */}
                    <td className="py-3 px-4">
                      <div className="text-[11px] text-zinc-700">{log.entityType}</div>
                      <div className="font-mono text-[10px] text-zinc-400">{log.entityId}</div>
                    </td>

                    {/* State Transition */}
                    <td className="py-3 px-4">
                      {log.previousValue || log.newValue ? (
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          {log.previousValue && (
                            <span className="text-zinc-400 line-through">{String(log.previousValue)}</span>
                          )}
                          {log.previousValue && <span className="text-zinc-300">→</span>}
                          <span className="font-medium text-zinc-950">{String(log.newValue)}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>

                    {/* Reason */}
                    <td className="py-3 px-4 text-zinc-500 text-[11px] max-w-xs truncate">
                      {log.reason || 'Transactional event'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
