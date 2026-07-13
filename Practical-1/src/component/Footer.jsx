import './Footer.css';

const Footer = ({ themeColor, name, email, github, linkedin }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-section">
      <div className="footer-glow" style={{ background: `radial-gradient(circle, ${themeColor}15 0%, transparent 60%)` }}></div>
      
      <div className="footer-container">
        <div className="footer-content">
          <h2 className="footer-title">
            Let's Work <span style={{ color: themeColor }}>Together</span>
          </h2>
          <p className="footer-subtitle">
            I'm currently seeking internship opportunities and freelance projects. Feel free to reach out!
          </p>

          <a 
            href={`mailto:${email}`} 
            className="email-button"
            style={{ 
              backgroundColor: `${themeColor}15`, 
              color: themeColor,
              borderColor: `${themeColor}44`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = themeColor;
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = `${themeColor}15`;
              e.currentTarget.style.color = themeColor;
            }}
          >
            {email}
          </a>

          <div className="social-links">
            <a 
              href={github} 
              target="_blank" 
              rel="noreferrer" 
              className="social-icon"
              style={{ '--hover-color': themeColor }}
            >
              GitHub
            </a>
            <a 
              href={linkedin} 
              target="_blank" 
              rel="noreferrer" 
              className="social-icon"
              style={{ '--hover-color': themeColor }}
            >
              LinkedIn
            </a>
          </div>
        </div>

        <div className="footer-bottom" style={{ borderTopColor: 'rgba(255, 255, 255, 0.05)' }}>
          <p className="copyright">
            © {currentYear} {name}. All rights reserved.
          </p>
          <p className="built-with">
            Built with <span style={{ color: themeColor }}>React</span> & <span style={{ color: themeColor }}>Vite</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;