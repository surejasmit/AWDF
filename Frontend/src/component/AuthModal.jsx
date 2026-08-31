import { useState } from 'react';
import './AuthModal.css';
import { CONFIG } from '../config/config';

function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  themeColor = '#8b5cf6',
  initialMode = 'login',
}) {
  const [isRegister, setIsRegister] = useState(initialMode === 'register');
  const [prevMode, setPrevMode] = useState(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync mode if initialMode changed from parent
  if (prevMode !== initialMode) {
    setPrevMode(initialMode);
    setIsRegister(initialMode === 'register');
    setError(null);
  }

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (isRegister && !trimmedName) {
      setError('Please enter your full name.');
      return;
    }
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isRegister
        ? CONFIG.AUTH_ENDPOINTS.REGISTER
        : CONFIG.AUTH_ENDPOINTS.LOGIN;

      const payload = isRegister
        ? { name: trimmedName, email: trimmedEmail, password }
        : { email: trimmedEmail, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed. Please try again.');
      }

      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        // Dispatch storage event so other components sync immediately
        window.dispatchEvent(new Event('auth_change'));
      }

      if (onAuthSuccess) {
        onAuthSuccess(data);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="auth-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          className="auth-close-btn"
          onClick={onClose}
          aria-label="Close dialog"
        >
          ✕
        </button>

        {/* Brand Header */}
        <div className="auth-brand">
          <div className="auth-badge-icon" style={{ backgroundColor: `${themeColor}22`, color: themeColor }}>
            ⚡
          </div>
          <h3>Task Management</h3>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${!isRegister ? 'active' : ''}`}
            onClick={() => {
              setIsRegister(false);
              setError(null);
            }}
            style={!isRegister ? { borderColor: themeColor, color: '#fff' } : {}}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${isRegister ? 'active' : ''}`}
            onClick={() => {
              setIsRegister(true);
              setError(null);
            }}
            style={isRegister ? { borderColor: themeColor, color: '#fff' } : {}}
          >
            Sign Up
          </button>
        </div>

        {/* Title and Subtitle */}
        <div className="auth-titles">
          <h4>{isRegister ? 'Create Your Account' : 'Welcome Back'}</h4>
          <p>
            {isRegister
              ? 'Join to organize and track your private tasks in one place'
              : 'Enter your credentials to securely manage your tasks'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="auth-error-box">
            <span className="auth-error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form-body">
          {isRegister && (
            <div className="auth-field">
              <label htmlFor="modal-name">Full Name</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">👤</span>
                <input
                  id="modal-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Smit Sureja"
                  required
                  autoFocus={isRegister}
                />
              </div>
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="modal-email">Email Address</label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">✉️</span>
              <input
                id="modal-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                required
                autoFocus={!isRegister}
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="modal-password">Password</label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">🔒</span>
              <input
                id="modal-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
              />
              <button
                type="button"
                className="auth-show-pass-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {isRegister && (
              <span className="auth-helper-text">Must be at least 6 characters</span>
            )}
          </div>

          <button
            type="submit"
            className="auth-primary-btn"
            style={{ backgroundColor: themeColor }}
            disabled={loading}
          >
            {loading ? (
              <span className="auth-btn-spinner">Processing...</span>
            ) : isRegister ? (
              'Create Account'
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer switch prompt */}
        <div className="auth-switch-footer">
          {isRegister ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                className="auth-link-btn"
                style={{ color: themeColor }}
                onClick={() => {
                  setIsRegister(false);
                  setError(null);
                }}
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                className="auth-link-btn"
                style={{ color: themeColor }}
                onClick={() => {
                  setIsRegister(true);
                  setError(null);
                }}
              >
                Sign Up
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
