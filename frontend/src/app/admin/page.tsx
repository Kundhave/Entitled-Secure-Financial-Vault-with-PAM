'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  listVaultItems,
  getPendingRequests,
  decideRequest,
  accessVaultItem,
  getQRCode,
} from '@/lib/api';

export default function AdminDashboard() {
  const router = useRouter();
  const [vaultItems, setVaultItems] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // MFA modal
  const [showMFAModal, setShowMFAModal] = useState(false);
  const [totpToken, setTotpToken] = useState('');
  const [vaultForAccess, setVaultForAccess] = useState('');
  
  // Vault data view
  const [showVaultData, setShowVaultData] = useState(false);
  const [vaultData, setVaultData] = useState<any>(null);
  const [sessionExpiry, setSessionExpiry] = useState<Date | null>(null);
  
  // QR Code modal
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCode, setQRCode] = useState('');
  const [totpSecret, setTotpSecret] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'admin') {
      router.push('/');
      return;
    }
    loadData();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (sessionExpiry) {
      timer = setInterval(() => {
        const now = new Date();
        if (now >= sessionExpiry) {
          setShowVaultData(false);
          setVaultData(null);
          setSessionExpiry(null);
          alert('Your privileged session has expired.');
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [sessionExpiry]);

  const loadData = async () => {
    try {
      const [items, requests] = await Promise.all([
        listVaultItems(),
        getPendingRequests(),
      ]);
      setVaultItems(items);
      setPendingRequests(requests);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (requestId: string, decision: string) => {
    try {
      await decideRequest(requestId, decision);
      alert(`Request ${decision}d successfully!`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to process request');
    }
  };

  const initiateAccess = (vaultId: string) => {
    setVaultForAccess(vaultId);
    setShowMFAModal(true);
  };

  const submitMFA = async () => {
    try {
      const data = await accessVaultItem(vaultForAccess, totpToken);
      setVaultData(data);
      setSessionExpiry(new Date(Date.now() + 3 * 60 * 1000)); // 3 minutes from now
      setShowMFAModal(false);
      setShowVaultData(true);
      setTotpToken('');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'MFA verification failed');
    }
  };

  const loadQRCode = async () => {
    try {
      const data = await getQRCode();
      setQRCode(data.qr_code_base64);
      setTotpSecret(data.secret);
      setShowQRModal(true);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to load QR code');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Admin Dashboard</h1>
          <p style={{ color: '#718096', fontSize: '14px' }}>
            Welcome, {localStorage.getItem('username')}
          </p>
        </div>
        <div>
          <button onClick={loadQRCode} className="btn btn-secondary" style={{ marginRight: '10px' }}>
            Setup MFA
          </button>
          <button onClick={handleLogout} className="btn btn-danger">
            Logout
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showVaultData && vaultData && (
        <div className="card">
          {sessionExpiry && (
            <div className="timer-warning">
              Session expires in: {Math.max(0, Math.floor((sessionExpiry.getTime() - Date.now()) / 1000))}s
            </div>
          )}
          <h2 style={{ marginBottom: '16px', fontSize: '20px' }}>
            {vaultData.vault_item.title}
          </h2>
          <table className="table">
            <thead>
              <tr>
                <th>Investment Name</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Instrument Type</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {vaultData.records.map((record: any) => (
                <tr key={record.id}>
                  <td>{record.investment_name}</td>
                  <td>${record.invested_amount.toLocaleString()}</td>
                  <td>{record.investment_date}</td>
                  <td>{record.instrument_type}</td>
                  <td>{record.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={() => {
              setShowVaultData(false);
              setVaultData(null);
              setSessionExpiry(null);
            }}
            className="btn btn-secondary"
            style={{ marginTop: '16px' }}
          >
            Close
          </button>
        </div>
      )}

      <div className="card">
        <h2 style={{ marginBottom: '16px', fontSize: '20px' }}>Vault Access</h2>
        <p style={{ marginBottom: '16px', color: '#718096' }}>
          You can access any vault item with MFA verification. No approval needed.
        </p>
        <table className="table">
          <thead>
            <tr>
              <th>Vault Title</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vaultItems.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>
                  <button
                    onClick={() => initiateAccess(item.id)}
                    className="btn btn-success"
                  >
                    Access
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '16px', fontSize: '20px' }}>Pending Access Requests</h2>
        {pendingRequests.length === 0 ? (
          <p style={{ color: '#718096' }}>No pending requests</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Vault</th>
                <th>Reason</th>
                <th>Requested</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.map((req) => (
                <tr key={req.id}>
                  <td>{req.employee_username}</td>
                  <td>{req.vault_item_title}</td>
                  <td>{req.reason}</td>
                  <td>{new Date(req.created_at).toLocaleString()}</td>
                  <td>
                    <button
                      onClick={() => handleDecision(req.id, 'approve')}
                      className="btn btn-success"
                      style={{ marginRight: '8px' }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleDecision(req.id, 'reject')}
                      className="btn btn-danger"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showMFAModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 style={{ marginBottom: '16px', fontSize: '20px' }}>MFA Verification Required</h2>
            <p style={{ marginBottom: '16px', color: '#718096' }}>
              Enter the 6-digit code from your authenticator app
            </p>
            <label className="label">TOTP Code</label>
            <input
              type="text"
              className="input"
              value={totpToken}
              onChange={(e) => setTotpToken(e.target.value)}
              placeholder="000000"
              maxLength={6}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={submitMFA} className="btn btn-success" disabled={totpToken.length !== 6}>
                Verify & Access
              </button>
              <button onClick={() => setShowMFAModal(false)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showQRModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 style={{ marginBottom: '16px', fontSize: '20px' }}>Setup MFA</h2>
            <p style={{ marginBottom: '16px', color: '#718096' }}>
              Scan this QR code with Microsoft Authenticator
            </p>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <img src={`data:image/png;base64,${qrCode}`} alt="QR Code" style={{ maxWidth: '100%' }} />
            </div>
            <p style={{ fontSize: '12px', color: '#718096', marginBottom: '8px' }}>
              Manual entry code:
            </p>
            <code style={{ display: 'block', padding: '12px', background: '#f7fafc', borderRadius: '6px', marginBottom: '16px', wordBreak: 'break-all' }}>
              {totpSecret}
            </code>
            <button onClick={() => setShowQRModal(false)} className="btn btn-primary" style={{ width: '100%' }}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
