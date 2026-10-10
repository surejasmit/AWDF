import { useState } from 'react';
import './AuthModal.css';
import { CONFIG } from '../config/config';

// Gender-based palettes: white + pink for girls, white + blue for boys
const GENDER_THEMES = {
  female: {
    accent: '#ec4899',
    accentHover: '#db2777',
    accentTint: '#fdf2f8',
    accentRing: 'rgba(236, 72, 153, 0.16)',
  },
  male: {
    accent: '#2563eb',
    accentHover: '#1d4ed8',
    accentTint: '#eff6ff',
    accentRing: 'rgba(37, 99, 235, 0.16)',
  },
};

// Restore the signed-in user's gender so returning users keep their theme
const readStoredGender = () => {
  try {
    const saved = localStorage.getItem('auth_user');
    const user = saved ? JSON.parse(saved) : null;
    return user && user.gender === 'male' ? 'male' : 'female';
  } catch {
    return 'female';
  }
};

function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
}) {
  const [isRegister, setIsRegister] = useState(initialMode === 'register');
  const [prevMode, setPrevMode] = useState(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('female');
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

  const activeGender = isRegister ? gender : readStoredGender();
  const theme = GENDER_THEMES[activeGender] || GENDER_THEMES.female;
  const themeStyle = {
    '--auth-accent': theme.accent,
    '--auth-accent-hover': theme.accentHover,
    '--auth-accent-tint': theme.accentTint,
    '--auth-accent-ring': theme.accentRing,
  };

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
        ? { name: trimmedName, email: trimmedEmail, password, gender }
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

  const switchMode = (register) => {
    setIsRegister(register);
    setError(null);
  };

  return (
    <div className="auth-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="auth-card" style={themeStyle} onClick={(e) => e.stopPropagation()}>
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
          <div className="auth-badge-icon">⚡</div>
          <div className="auth-brand-text">
            <h3>Task Management</h3>
            <p>Secure, private and beautifully simple</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${!isRegister ? 'active' : ''}`}
            onClick={() => switchMode(false)}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${isRegister ? 'active' : ''}`}
            onClick={() => switchMode(true)}
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
          <div className="auth-error-box" role="alert">
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

          {isRegister && (
            <div className="auth-field">
              <label id="gender-label">I am a</label>
              <div
                className="auth-gender-options"
                role="radiogroup"
                aria-labelledby="gender-label"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={gender === 'female'}
                  className={`auth-gender-option ${gender === 'female' ? 'selected' : ''}`}
                  onClick={() => setGender('female')}
                >
                  <span className="auth-gender-icon">👧</span>
                  <span className="auth-gender-copy">
                    <strong>Girl</strong>
                    <small>Pink theme</small>
                  </span>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={gender === 'male'}
                  className={`auth-gender-option ${gender === 'male' ? 'selected' : ''}`}
                  onClick={() => setGender('male')}
                >
                  <span className="auth-gender-icon">👦</span>
                  <span className="auth-gender-copy">
                    <strong>Boy</strong>
                    <small>Blue theme</small>
                  </span>
                </button>
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
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {isRegister && (
              <span className="auth-helper-text">Must be at least 6 characters</span>
            )}
          </div>

          <button
            type="submit"
            className="auth-primary-btn"
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
                onClick={() => switchMode(false)}
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
                onClick={() => switchMode(true)}
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
