import React, { useState, useEffect } from 'react';
import { systemApi } from '../services/api';
import { ShieldCheck, Clock, RefreshCw } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await systemApi.getAuditLogs({ limit: 50 });
      if (res.data?.data?.logs) {
        setLogs(res.data.data.logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (act: string) => {
    if (act.includes('LOGIN') || act.includes('AUTH')) {
      return <span className="badge badge-info">{act}</span>;
    }
    if (act.includes('DELETE')) {
      return <span className="badge badge-danger">{act}</span>;
    }
    if (act.includes('SUBMIT') || act.includes('EVALUATE')) {
      return <span className="badge badge-success">{act}</span>;
    }
    return <span className="badge badge-primary">{act}</span>;
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>System Audit Trail</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Cryptographically timestamped telemetry of all critical user actions and assessment events.
          </p>
        </div>
        <button onClick={loadAuditLogs} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} /> Refresh Logs
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Entity</th>
              <th>User</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '30px' }}>Loading audit logs...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '30px' }}>No audit records found.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td>{getActionBadge(log.action)}</td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{log.entity}</span>
                    {log.entityId && <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: '6px' }}>({log.entityId.slice(0, 8)}...)</span>}
                  </td>
                  <td>
                    {log.user ? `${log.user.firstName} ${log.user.lastName} (${log.user.role})` : 'System / Anonymous'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {log.ipAddress || '127.0.0.1'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
