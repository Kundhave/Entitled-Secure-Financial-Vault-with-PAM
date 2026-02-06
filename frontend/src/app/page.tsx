'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(username, password);
      
      // Store token and user info
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user_id', data.user_id);
      localStorage.setItem('username', data.username);
      localStorage.setItem('role', data.role);

      // Redirect based on role
      if (data.role === 'employee') {
        router.push('/employee');
      } else if (data.role === 'admin') {
        router.push('/admin');
      } else if (data.role === 'auditor') {
        router.push('/auditor');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth: '400px', width: '90%' }}>
        <h1 style={{ marginBottom: '8px', fontSize: '28px', fontWeight: 'bold', color: '#2d3748' }}>
          ENTITLED
        </h1>
        <p style={{ marginBottom: '24px', color: '#718096', fontSize: '14px' }}>
          Secure Financial Vault with Privileged Access Management
        </p>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div>
            <label className="label">Username</label>
            <input
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{ marginTop: '24px', padding: '16px', background: '#f7fafc', borderRadius: '6px' }}>
          <p style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: '#2d3748' }}>
            Demo Credentials:
          </p>
          <p style={{ fontSize: '12px', color: '#4a5568', marginBottom: '4px' }}>
            <strong>Employee:</strong> employee1 / employee123
          </p>
          <p style={{ fontSize: '12px', color: '#4a5568', marginBottom: '4px' }}>
            <strong>Admin:</strong> admin1 / admin123
          </p>
          <p style={{ fontSize: '12px', color: '#4a5568' }}>
            <strong>Auditor:</strong> auditor / auditor123
          </p>
        </div>
      </div>
    </div>
  );
}
