import React, { useState, useEffect } from 'react';
import { FileText, RefreshCw, Clock, User, Shield } from 'lucide-react';
import { getAuditLogs } from '../../services/firestore';
import { AuditLog } from '../../types';

export const AdminAudit: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getAuditLogs(60);
      setLogs(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
            Administrative Audit Trail
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Cryptographic log of all create, update, and delete actions performed by administrators.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-zinc-300 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-zinc-950 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#090c13] text-zinc-400 uppercase tracking-wider border-b border-white/10">
            <tr>
              <th className="px-4 py-3 font-semibold">Timestamp</th>
              <th className="px-4 py-3 font-semibold">Administrator</th>
              <th className="px-4 py-3 font-semibold">Action</th>
              <th className="px-4 py-3 font-semibold">Entity</th>
              <th className="px-4 py-3 font-semibold">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06] font-mono text-[11px]">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 font-sans">
                  Fetching audit logs from Cloud Firestore...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 font-sans">
                  No administrative actions logged yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-zinc-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-white font-medium">{log.adminEmail}</td>
                  <td className="px-4 py-3 font-bold text-red-400">{log.action}</td>
                  <td className="px-4 py-3 text-zinc-300">{log.entity} / {log.entityId}</td>
                  <td className="px-4 py-3 text-zinc-400 font-sans">{log.details || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
