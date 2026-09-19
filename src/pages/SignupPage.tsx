import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi, academicApi } from '../services/api';
import { GraduationCap, ArrowRight, UserPlus, AlertCircle } from 'lucide-react';
import { Department, Batch } from '../types';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    enrollmentNo: '',
    departmentId: '',
    batchId: '',
  });

  useEffect(() => {
    const fetchSelectOptions = async () => {
      try {
        const [depRes, batchRes] = await Promise.all([
          academicApi.getDepartments(),
          academicApi.getBatches(),
        ]);
        if (depRes.data?.data) {
          setDepartments(depRes.data.data);
          if (depRes.data.data.length > 0) {
            setForm((f) => ({ ...f, departmentId: depRes.data.data[0].id }));
          }
        }
        if (batchRes.data?.data) {
          setBatches(batchRes.data.data);
          if (batchRes.data.data.length > 0) {
            setForm((f) => ({ ...f, batchId: batchRes.data.data[0].id }));
          }
        }
      } catch (err) {
        console.error('Failed to load departments and batches', err);
      }
    };
    fetchSelectOptions();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.register(form);
      if (res.data?.data?.accessToken) {
        // Automatically login on client side as well
        localStorage.setItem('accessToken', res.data.data.accessToken);
        localStorage.setItem('refreshToken', res.data.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(res.data.data.user));
        // Force a page reload to initialize the AuthContext
        window.location.href = '/dashboard';
      } else {
        navigate('/login');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.15), transparent 40%), radial-gradient(circle at bottom left, rgba(16, 185, 129, 0.1), transparent 40%)',
    }}>
      <div className="glass-card" style={{ maxWidth: '500px', width: '100%', padding: '40px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0) 100%)',
            border: '1px solid rgba(99,102,241,0.3)',
            marginBottom: '16px',
          }}>
            <UserPlus size={32} color="var(--primary)" />
          </div>
          <h1 className="brand-title" style={{ fontSize: '1.8rem', marginBottom: '8px' }}>
            Student Registration
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Create an account to join the INTER Portal
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                type="text"
                name="firstName"
                required
                value={form.firstName}
                onChange={handleChange}
                className="form-input"
                placeholder="John"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                name="lastName"
                required
                value={form.lastName}
                onChange={handleChange}
                className="form-input"
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className="form-input"
              placeholder="student@inter.edu"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              value={form.password}
              onChange={handleChange}
              className="form-input"
              placeholder="••••••••"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Enrollment No.</label>
            <input
              type="text"
              name="enrollmentNo"
              required
              value={form.enrollmentNo}
              onChange={handleChange}
              className="form-input"
              placeholder="STU-2026-001"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div className="form-group">
              <label className="form-label">Department</label>
              <select
                name="departmentId"
                required
                value={form.departmentId}
                onChange={handleChange}
                className="form-input"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Batch</label>
              <select
                name="batchId"
                required
                value={form.batchId}
                onChange={handleChange}
                className="form-input"
              >
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.year})</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginBottom: '16px' }}
          >
            {loading ? 'Creating Account...' : (
              <>
                <span>Sign Up</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
          
          <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Already have an account? </span>
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Sign in here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
