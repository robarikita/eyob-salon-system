import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../../components/admin/AdminLayout';

interface AuditLogItem {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: any;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string | null;
    role: string;
  } | null;
}

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('ALL');

  const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('eyob_auth_token');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/admin/audit-logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === 'success') {
        setLogs(data.data);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = filterAction === 'ALL'
    ? logs
    : logs.filter((l) => l.action === filterAction);

  return (
    <AdminLayout activePath="/admin/audit-logs">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E2DD]">
          <div>
            <h1 className="text-2xl font-serif font-bold text-[#1C1C19]">System Audit Logs</h1>
            <p className="text-xs text-stone-500 mt-0.5">Immutable cross-branch compliance and activity trace</p>
          </div>
          <button
            onClick={fetchLogs}
            className="px-3.5 py-2 rounded-lg bg-white border border-[#E5E2DD] text-stone-700 text-xs font-semibold hover:bg-stone-50 transition flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
          >
            <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>sync</span>
            Refresh
          </button>
        </div>

        {/* Action Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['ALL', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'].map((act) => (
            <button
              key={act}
              onClick={() => setFilterAction(act)}
              className={`px-3 py-1 rounded text-xs font-bold transition ${
                filterAction === act
                  ? 'bg-[#181412] text-[#D4AF37]'
                  : 'bg-white text-stone-600 border border-[#E5E2DD] hover:bg-stone-50'
              }`}
            >
              {act}
            </button>
          ))}
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-xl border border-[#E5E2DD] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF7F2] text-stone-500 font-bold border-b border-[#E5E2DD] uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Target ID</th>
                  <th className="py-3 px-4">Operator</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-400">
                      {loading ? 'Loading audit records...' : 'No audit records found.'}
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-3 px-4 text-stone-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.action === 'CREATE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.action === 'DELETE'
                              ? 'bg-red-100 text-red-800'
                              : log.action === 'UPDATE'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-stone-100 text-stone-800'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-stone-900">{log.entity}</td>
                      <td className="py-3 px-4 font-mono text-stone-500 text-[11px]">{log.entityId}</td>
                      <td className="py-3 px-4 text-stone-800">
                        {log.user ? `${log.user.firstName} (${log.user.role})` : 'System'}
                      </td>
                      <td className="py-3 px-4 text-stone-500 font-mono text-[11px] max-w-xs truncate">
                        {log.details ? JSON.stringify(log.details) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AuditLogsPage;

