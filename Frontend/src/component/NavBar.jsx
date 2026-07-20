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

const NavBar = ({ activeSection, themeColor, setThemeColor }) => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isGithubPage = location.pathname.startsWith('/github');

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
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // height of fixed navbar
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
        </ul>

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
      </div>
    </nav>
  );
};

export default NavBar;
