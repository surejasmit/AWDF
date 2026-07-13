import './Header.css';

const Header = ({ themeColor, name, title, university }) => {
  return (
    <header className="hero-header">
      <div className="hero-glow" style={{ background: `radial-gradient(circle, ${themeColor}22 0%, transparent 70%)` }}></div>
      
      <div className="hero-content">
        <div className="profile-container" style={{ borderColor: themeColor }}>
          <div className="profile-image-placeholder" style={{ backgroundColor: `${themeColor}15` }}>
            <span style={{ color: themeColor }}>{name ? name.split(' ').map(n => n[0]).join('') : 'SS'}</span>
          </div>
          <div className="status-badge" style={{ backgroundColor: themeColor }}>
            <span className="pulse-dot"></span> Available for projects
          </div>
        </div>

        <h1 className="hero-name">
          Hi, I'm <span style={{ color: themeColor }}>{name}</span>
        </h1>
        
        <p className="hero-title">{title}</p>
        <p className="hero-school" style={{ color: `${themeColor}ee` }}>{university}</p>
        
        <div className="hero-cta">
          <a 
            href="#contact" 
            className="cta-button primary" 
            style={{ 
              backgroundColor: themeColor,
              boxShadow: `0 4px 20px ${themeColor}44`
            }}
          >
            Get In Touch
          </a>
          <a 
            href="#about" 
            className="cta-button secondary"
            style={{ 
              borderColor: `${themeColor}55`,
              color: '#fff'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${themeColor}15`;
              e.currentTarget.style.borderColor = themeColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = `${themeColor}55`;
            }}
          >
            Learn More
          </a>
        </div>
      </div>
      
      <div className="scroll-indicator">
        <div className="mouse" style={{ borderColor: '#6b7280' }}>
          <div className="wheel" style={{ backgroundColor: themeColor }}></div>
        </div>
      </div>
    </header>
  );
};

export default Header;