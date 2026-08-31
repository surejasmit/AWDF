import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './NavBar.css';

const themes = [
  { name: 'Purple', hex: '#8b5cf6' },
  { name: 'Teal', hex: '#14b8a6' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Rose', hex: '#ec4899' },
  { name: 'Blue', hex: '#3b82f6' }
];

const NavBar = ({ activeSection, themeColor, setThemeColor, onOpenAuth }) => {
  const [scrolled, setScrolled] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  const location = useLocation();
  const isGithubPage = location.pathname.startsWith('/github');
  const isTaskPage = location.pathname.startsWith('/task') || location.pathname.startsWith('/todo');

  // Sync current user state across windows and custom auth events
  useEffect(() => {
    const syncUser = () => {
      const saved = localStorage.getItem('auth_user');
      setCurrentUser(saved ? JSON.parse(saved) : null);
    };

    window.addEventListener('storage', syncUser);
    window.addEventListener('auth_change', syncUser);

    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('auth_change', syncUser);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e, id) => {
    if (location.pathname !== '/') {
      return; // allow normal link navigation if on another route
    }
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setCurrentUser(null);
    window.dispatchEvent(new Event('auth_change'));
  };

  // Get user avatar initial
  const getUserInitial = () => {
    if (!currentUser || !currentUser.name) return 'U';
    return currentUser.name.charAt(0).toUpperCase();
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <a href="#home" onClick={(e) => handleNavClick(e, 'home')} className="nav-logo" style={{ color: themeColor }}>
          Smit<span>.</span>
        </a>

        <ul className="nav-menu">
          <li className="nav-item">
            <a 
              href="#home" 
              onClick={(e) => handleNavClick(e, 'home')}
              className={`nav-link ${activeSection === 'home' ? 'active' : ''}`}
              style={activeSection === 'home' ? { color: themeColor } : {}}
            >
              Home
            </a>
          </li>
          <li className="nav-item">
            <a 
              href="#about" 
              onClick={(e) => handleNavClick(e, 'about')}
              className={`nav-link ${activeSection === 'about' ? 'active' : ''}`}
              style={activeSection === 'about' ? { color: themeColor } : {}}
            >
              About
            </a>
          </li>
          <li className="nav-item">
            <a 
              href="#skills" 
              onClick={(e) => handleNavClick(e, 'skills')}
              className={`nav-link ${activeSection === 'skills' ? 'active' : ''}`}
              style={activeSection === 'skills' ? { color: themeColor } : {}}
            >
              Skills
            </a>
          </li>
          <li className="nav-item">
            <a 
              href="#contact" 
              onClick={(e) => handleNavClick(e, 'contact')}
              className={`nav-link ${activeSection === 'contact' ? 'active' : ''}`}
              style={activeSection === 'contact' ? { color: themeColor } : {}}
            >
              Contact
            </a>
          </li>
          <li className="nav-item">
            <Link
              to="/github/surejasmit"
              className={`nav-link ${isGithubPage ? 'active' : ''}`}
              style={isGithubPage ? { color: themeColor } : {}}
            >
              GitHub
            </Link>
          </li>

          <li className="nav-item">
            <Link
              to="/task"
              className={`nav-link ${isTaskPage ? 'active' : ''}`}
              style={isTaskPage ? { color: themeColor } : {}}
            >
              ToDoapp
            </Link>
          </li>
        </ul>

        {/* Right Corner: Theme selector + Auth Actions */}
        <div className="nav-right-corner">
          <div className="theme-selector-container">
            <span className="theme-label">Accent:</span>
            <div className="theme-dots">
              {themes.map((theme) => (
                <button
                  key={theme.hex}
                  className={`theme-dot ${themeColor === theme.hex ? 'active' : ''}`}
                  style={{ backgroundColor: theme.hex }}
                  onClick={() => setThemeColor(theme.hex)}
                  title={`Switch to ${theme.name}`}
                  aria-label={`Switch theme color to ${theme.name}`}
                />
              ))}
            </div>
          </div>

          <div className="nav-auth-divider" />

          {/* Authentication Actions */}
          <div className="nav-auth-buttons">
            {currentUser ? (
              <div className="nav-user-profile">
                <div 
                  className="nav-user-avatar" 
                  style={{ backgroundColor: themeColor }}
                  title={`Signed in as ${currentUser.name} (${currentUser.email})`}
                >
                  {getUserInitial()}
                </div>
                <span className="nav-user-name" title={currentUser.email}>
                  {currentUser.name.split(' ')[0]}
                </span>
                <button 
                  className="nav-btn-logout" 
                  onClick={handleLogout}
                  title="Sign out of your account"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="nav-guest-actions">
                <button
                  className="nav-btn-signin"
                  onClick={() => onOpenAuth && onOpenAuth('login')}
                >
                  Sign In
                </button>
                <button
                  className="nav-btn-signup"
                  style={{ backgroundColor: themeColor }}
                  onClick={() => onOpenAuth && onOpenAuth('register')}
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
