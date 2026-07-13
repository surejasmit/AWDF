import './about.css';

const About = ({ themeColor, bio, university }) => {
  return (
    <section className="about-section">
      <div className="section-header">
        <h2 className="section-title">
          About <span style={{ color: themeColor }}>Me</span>
        </h2>
        <div className="title-underline" style={{ backgroundColor: themeColor }}></div>
      </div>

      <div className="about-grid">
        <div className="about-card main-bio" style={{ borderLeftColor: themeColor }}>
          <h3>My Story</h3>
          <p>{bio}</p>
        </div>

        <div className="about-card education-card">
          <div className="card-icon" style={{ color: themeColor, backgroundColor: `${themeColor}15` }}>
            🎓
          </div>
          <h3>Education</h3>
          <p className="school-name">{university}</p>
          <p className="degree">B.Tech in Computer Science & Engineering</p>
          <span className="timeline-tag" style={{ backgroundColor: `${themeColor}15`, color: themeColor }}>
            2023 - Present
          </span>
        </div>

        <div className="about-card focus-card">
          <div className="card-icon" style={{ color: themeColor, backgroundColor: `${themeColor}15` }}>
            🚀
          </div>
          <h3>Core Focus</h3>
          <ul className="focus-list">
            <li>
              <span className="bullet" style={{ backgroundColor: themeColor }}></span>
              Frontend Architectures
            </li>
            <li>
              <span className="bullet" style={{ backgroundColor: themeColor }}></span>
              Cloud Integration (AWS)
            </li>
            <li>
              <span className="bullet" style={{ backgroundColor: themeColor }}></span>
              Algorithm Analysis
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default About;