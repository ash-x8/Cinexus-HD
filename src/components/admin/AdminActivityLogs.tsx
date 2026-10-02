import React, { useState, useEffect } from 'react';
import {
  Activity,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  User,
  Shield,
  Trash2,
  Edit3,
  Layers,
  Film,
  Settings,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { COLLECTIONS } from '../../services/firestore';
import { AuditLog } from '../../types';

export const AdminActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'rails' | 'deletions' | 'movies' | 'settings'>('all');
  const [limitCount, setLimitCount] = useState<number>(50);

  // Subscribe to real-time audit logs in Cloud Firestore
  useEffect(() => {
    setLoading(true);
    try {
      const q = query(
        collection(db, COLLECTIONS.AUDIT_LOGS),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const unsubscribe = onSnapshot(
        q,
        (snap) => {
          const items = snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          })) as AuditLog[];
          setLogs(items);
          setLoading(false);
        },
        (error) => {
          console.warn('[AdminActivityLogs Snapshot Error]', error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('[AdminActivityLogs Setup Error]', err);
      setLoading(false);
    }
  }, [limitCount]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      const q = query(
        collection(db, COLLECTIONS.AUDIT_LOGS),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      const snap = await getDocs(q);
      const items = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as AuditLog[];
      setLogs(items);
    } catch (err) {
      console.error('[AdminActivityLogs Refresh Error]', err);
    } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  };

  // Helper for human-readable relative time
  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDays = Math.floor(diffHour / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Filter logs by search and category
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.adminEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.action || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.details || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.entity || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.entityId || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'rails') {
      return (
        (log.entity || '').toLowerCase().includes('homepage') ||
        (log.action || '').toLowerCase().includes('rail')
      );
    }
    if (filterType === 'deletions') {
      return (log.action || '').toLowerCase().includes('delete');
    }
    if (filterType === 'movies') {
      return (
        (log.entity || '').toLowerCase().includes('movie') ||
        (log.action || '').toLowerCase().includes('movie')
      );
    }
    if (filterType === 'settings') {
      return (
        (log.entity || '').toLowerCase().includes('setting') ||
        (log.action || '').toLowerCase().includes('setting')
      );
    }

    return true;
  });

  // Action badge visual styling helper
  const getActionBadge = (action: string) => {
    const lower = (action || '').toLowerCase();
    if (lower.includes('delete')) {
      return {
        bg: 'bg-red-500/10 text-red-400 border-red-500/20',
        icon: <Trash2 className="w-3.5 h-3.5 text-red-400 shrink-0" />
      };
    }
    if (lower.includes('reorder') || lower.includes('dnd')) {
      return {
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        icon: <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      };
    }
    if (lower.includes('toggle') || lower.includes('visibility')) {
      return {
        bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        icon: <Edit3 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
      };
    }
    if (lower.includes('movie') || lower.includes('film')) {
      return {
        bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        icon: <Film className="w-3.5 h-3.5 text-blue-400 shrink-0" />
      };
    }
    if (lower.includes('setting')) {
      return {
        bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        icon: <Settings className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
      };
    }
    return {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
    };
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-amber-400" />
            <span>Admin Activity Logs</span>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Realtime Audit Trail</span>
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Immutable Firestore record of all administrative modifications, deletions, rail reorderings, and content updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={limitCount}
            onChange={(e) => setLimitCount(Number(e.target.value))}
            className="px-3 py-2 rounded-xl bg-[#12151E] border border-white/10 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
          >
            <option value={25}>Show 25 records</option>
            <option value={50}>Show 50 records</option>
            <option value={100}>Show 100 records</option>
          </select>

          <button
            onClick={handleManualRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-zinc-300 transition-colors border border-white/10 cursor-pointer disabled:opacity-50"
            title="Refresh Activity Log"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#12151E] border border-white/10">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by administrator email, action, entity, or keyword..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterType === 'all'
                ? 'bg-amber-500 text-black font-bold'
                : 'bg-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            All Activity
          </button>
          <button
            onClick={() => setFilterType('rails')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterType === 'rails'
                ? 'bg-amber-500 text-black font-bold'
                : 'bg-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            Rails & Homepage
          </button>
          <button
            onClick={() => setFilterType('movies')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterType === 'movies'
                ? 'bg-amber-500 text-black font-bold'
                : 'bg-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            Movies & Titles
          </button>
          <button
            onClick={() => setFilterType('deletions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterType === 'deletions'
                ? 'bg-red-500 text-white font-bold'
                : 'bg-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            Deletions Only
          </button>
          <button
            onClick={() => setFilterType('settings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterType === 'settings'
                ? 'bg-amber-500 text-black font-bold'
                : 'bg-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            Settings
          </button>
        </div>
      </div>

      {/* Activity Logs Stream Table / Cards */}
      <div className="rounded-2xl border border-white/10 bg-[#0E1017] overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 text-xs flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
            <span>Fetching administrative activity from Cloud Firestore...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-2 text-zinc-500">
            <Activity className="w-8 h-8 mx-auto text-zinc-600" />
            <p className="text-sm font-semibold text-zinc-400">No activity logs found</p>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              {searchQuery || filterType !== 'all'
                ? 'No actions match the active query or filter criteria.'
                : 'Administrative modifications such as saving movies, modifying rails, or reordering layout will appear here in real time.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#12151E] text-zinc-400 uppercase tracking-wider text-[11px] border-b border-white/10">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Action / Event</th>
                  <th className="px-5 py-3.5 font-semibold">Administrator</th>
                  <th className="px-5 py-3.5 font-semibold">Entity Target</th>
                  <th className="px-5 py-3.5 font-semibold">Details & Scope</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filteredLogs.map((log) => {
                  const badge = getActionBadge(log.action);
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Action */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${badge.bg}`}
                          >
                            {badge.icon}
                            <span>{log.action}</span>
                          </span>
                        </div>
                      </td>

                      {/* Administrator User */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[10px] font-bold text-amber-400">
                            {log.adminEmail ? log.adminEmail.charAt(0).toUpperCase() : 'A'}
                          </div>
                          <div>
                            <span className="text-white font-medium text-xs block">
                              {log.adminEmail || 'Unknown Admin'}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              Verified Clearance
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Entity Target */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-[11px]">
                            {log.entity || 'general'}
                          </span>
                          {log.entityId && log.entityId !== 'all' && (
                            <span className="text-[10px] text-zinc-500 font-mono">
                              #{log.entityId.slice(0, 12)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Details */}
                      <td className="px-5 py-4">
                        <p className="text-zinc-300 text-xs line-clamp-2">
                          {log.details || '—'}
                        </p>
                      </td>

                      {/* Timestamp */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-white font-mono text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3 text-zinc-500" />
                            <span>{formatRelativeTime(log.timestamp)}</span>
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {log.timestamp
                              ? new Date(log.timestamp).toLocaleString(undefined, {
                                  dateStyle: 'short',
                                  timeStyle: 'short'
                                })
                              : '—'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Summary */}
        <div className="p-3.5 bg-[#12151E] border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400">
          <div>
            Showing <span className="font-bold text-white">{filteredLogs.length}</span> recorded actions in Cloud Firestore.
          </div>
          <div className="flex items-center gap-1 text-zinc-500 text-[10px]">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>Audit log protection: Firestore Append-Only</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminActivityLogs;
