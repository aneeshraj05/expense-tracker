import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { FiUser, FiMail, FiLock, FiArrowRight, FiPieChart } from 'react-icons/fi';
import api from '../utils/api';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      return toast.error('Please fill in all fields');
    }
    if (formData.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    try {
      setLoading(true);
      const res = await api.post('/auth/register', formData);
      if (res.data.success) {
        login(res.data);
        toast.success('Account created!');
        navigate('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div className="card fade-in-up" style={s.card}>
        <div style={s.header}>
          <div style={s.logoWrapper}>
            <FiPieChart size={24} style={{ color: '#fff' }} />
          </div>
          <h1 style={s.title}>Create an account</h1>
          <p className="text-secondary" style={s.subtitle}>
            Start tracking your expenses in seconds
          </p>
        </div>

        <form onSubmit={handleSubmit} style={s.form}>
          {/* Name */}
          <div className="form-group">
            <label className="form-label">Full name</label>
            <div style={s.inputWrap}>
              <FiUser style={s.inputIcon} size={16} />
              <input
                className="form-input"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                required
                style={{ paddingLeft: '2.5rem', width: '100%' }}
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email address</label>
            <div style={s.inputWrap}>
              <FiMail style={s.inputIcon} size={16} />
              <input
                className="form-input"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                style={{ paddingLeft: '2.5rem', width: '100%' }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={s.inputWrap}>
              <FiLock style={s.inputIcon} size={16} />
              <input
                className="form-input"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="min. 6 characters"
                required
                style={{ paddingLeft: '2.5rem', width: '100%' }}
              />
            </div>
          </div>

          {/* Password strength indicator */}
          {formData.password.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', marginTop: '-0.25rem' }}>
              {[1, 2, 3, 4].map((n) => {
                const strength = Math.min(4, Math.floor(formData.password.length / 3));
                const color = strength >= 3 ? 'var(--success)' : strength >= 2 ? 'var(--warning)' : 'var(--danger)';
                return (
                  <div key={n} style={{
                    height: '4px',
                    flex: 1,
                    borderRadius: '99px',
                    background: n <= strength ? color : 'var(--border)',
                    transition: 'all 0.2s ease',
                  }} />
                );
              })}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={s.submitBtn}
          >
            {loading ? 'Creating account…' : <><span>Create account</span><FiArrowRight size={16} /></>}
          </button>
        </form>

        <div style={s.footerContainer}>
          <p style={s.termsText}>
            By creating an account, you agree to our{' '}
            <span style={{ color: 'var(--accent)', fontWeight: 500, cursor: 'pointer' }}>Terms of Service</span> and{' '}
            <span style={{ color: 'var(--accent)', fontWeight: 500, cursor: 'pointer' }}>Privacy Policy</span>.
          </p>

          <p style={s.footerText}>
            Already have an account?{' '}
            <Link to="/login" style={s.link}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem',
    background: 'var(--bg)',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    padding: '2.5rem 2rem',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-lg)',
    background: 'var(--surface)',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: '2rem',
  },
  logoWrapper: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.25rem',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    letterSpacing: '-0.5px',
    marginBottom: '0.4rem',
    color: 'var(--text-primary)',
  },
  subtitle: {
    fontSize: '0.9rem',
    lineHeight: 1.5,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  inputWrap: {
    position: 'relative',
    width: '100%',
  },
  inputIcon: {
    position: 'absolute',
    left: '0.875rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  submitBtn: {
    width: '100%',
    height: '46px',
    fontSize: '0.95rem',
    marginTop: '0.5rem',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  footerContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem',
    marginTop: '2rem',
  },
  termsText: {
    textAlign: 'center',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    lineHeight: 1.6,
  },
  footerText: {
    textAlign: 'center',
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
  link: {
    color: 'var(--accent)',
    fontWeight: 600,
  },
};

export default Register;
