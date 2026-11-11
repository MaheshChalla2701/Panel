import React, { useState, useEffect } from 'react';
import { repository } from '../../services/api/repository';
import { History, Search, Filter, ShieldCheck, Clock, User } from 'lucide-react';

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
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              Part 5.4 — Screen 19 &bull; Compliance & Transparency
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Audit Log (Append-Only)</h1>
            <p className="text-sm text-slate-500 mt-1">
              Immutable ledger of all administrative overrides, booking creations, score submissions, and badge state transitions.
            </p>
          </div>

          <div className="text-xs font-mono font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            Total Logged Events: {logs.length}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search action, actor, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">Filter Entity:</label>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-700"
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
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Actor & Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity Reference</th>
                <th className="py-3 px-4">State Transition</th>
                <th className="py-3 px-4">Reason / Notes</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No audit records match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    {/* Timestamp */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toISOString().replace('T', ' ').slice(0, 19)}
                    </td>

                    {/* Actor */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{log.actorName}</div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">{log.actorRole}</div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[10px]">
                        {log.action}
                      </span>
                    </td>

                    {/* Entity */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 text-[11px]">{log.entityType}</div>
                      <div className="font-mono text-[10px] text-slate-400">{log.entityId}</div>
                    </td>

                    {/* State Transition */}
                    <td className="py-3 px-4">
                      {log.previousValue || log.newValue ? (
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          {log.previousValue && (
                            <span className="text-slate-400 line-through">{String(log.previousValue)}</span>
                          )}
                          {log.previousValue && <span className="text-slate-400">&rarr;</span>}
                          <span className="font-bold text-emerald-700">{String(log.newValue)}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">&mdash;</span>
                      )}
                    </td>

                    {/* Reason */}
                    <td className="py-3 px-4 text-slate-600 text-[11px] max-w-xs truncate">
                      {log.reason || 'Standard transactional event.'}
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
