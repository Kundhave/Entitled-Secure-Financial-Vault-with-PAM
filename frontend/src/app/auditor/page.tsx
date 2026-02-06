'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuditLogs } from '@/lib/api';

export default function AuditorDashboard() {
  const router = useRouter();
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'auditor') {
      router.push('/');
      return;
    }
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const logs = await getAuditLogs();
      setAuditLogs(logs);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  const filteredLogs = auditLogs.filter(log => {
    if (!filter) return true;
    const searchStr = filter.toLowerCase();
    return (
      log.action.toLowerCase().includes(searchStr) ||
      log.actor_username.toLowerCase().includes(searchStr) ||
      (log.vault_item_title && log.vault_item_title.toLowerCase().includes(searchStr)) ||
      (log.target_username && log.target_username.toLowerCase().includes(searchStr))
    );
  });

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Auditor Dashboard</h1>
          <p style={{ color: '#718096', fontSize: '14px' }}>
            Welcome, {localStorage.getItem('username')}
          </p>
        </div>
        <button onClick={handleLogout} className="btn btn-danger">
          Logout
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px' }}>Audit Logs</h2>
          <input
            type="text"
            className="input"
            style={{ width: '300px', marginBottom: 0 }}
            placeholder="Filter logs..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        
        <div className="alert alert-info" style={{ marginBottom: '16px' }}>
          <strong>Total Logs:</strong> {filteredLogs.length} of {auditLogs.length}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Vault Item</th>
                <th>Target User</th>
                <th>Metadata</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td>{log.actor_username}</td>
                  <td>
                    <code style={{ 
                      background: '#f7fafc', 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {log.action}
                    </code>
                  </td>
                  <td>{log.vault_item_title || '-'}</td>
                  <td>{log.target_username || '-'}</td>
                  <td>
                    {log.metadata ? (
                      <details>
                        <summary style={{ cursor: 'pointer', color: '#667eea' }}>
                          View
                        </summary>
                        <pre style={{ 
                          fontSize: '11px', 
                          background: '#f7fafc', 
                          padding: '8px', 
                          borderRadius: '4px',
                          marginTop: '4px',
                          overflow: 'auto'
                        }}>
                          {JSON.stringify(JSON.parse(log.metadata), null, 2)}
                        </pre>
                      </details>
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <p style={{ textAlign: 'center', color: '#718096', padding: '20px' }}>
            No logs found matching your filter
          </p>
        )}
      </div>

      <div className="card">
        <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Action Statistics</h2>
        <div className="grid grid-2">
          {Object.entries(
            auditLogs.reduce((acc: any, log) => {
              acc[log.action] = (acc[log.action] || 0) + 1;
              return acc;
            }, {})
          )
            .sort((a, b) => b[1] - a[1])
            .map(([action, count]) => (
              <div key={action} style={{ 
                padding: '16px', 
                background: '#f7fafc', 
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea' }}>
                  {count as number}
                </div>
                <div style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
                  {action}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
