import './Skills.css';

const Skills = ({ skillsList, themeColor }) => {
  // Group skills by category
  const categories = skillsList.reduce((acc, skill) => {
    const cat = skill.category || 'Other';
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(skill);
    return acc;
  }, {});

  return (
    <section className="skills-section">
      <div className="section-header">
        <h2 className="section-title">
          My <span style={{ color: themeColor }}>Skills</span>
        </h2>
        <div className="title-underline" style={{ backgroundColor: themeColor }}></div>
      </div>

      <div className="skills-container">
        {Object.entries(categories).map(([category, skills]) => (
          <div key={category} className="skills-category-card">
            <h3 className="category-title" style={{ borderBottomColor: `${themeColor}22` }}>
              <span className="category-marker" style={{ backgroundColor: themeColor }}></span>
              {category}
            </h3>
            
            <div className="skills-grid">
              {skills.map((skill) => (
                <div key={skill.name} className="skill-item">
                  <div className="skill-info">
                    <span className="skill-name">{skill.name}</span>
                    <span className="skill-percentage" style={{ color: themeColor }}>
                      {skill.level}%
                    </span>
                  </div>
                  <div className="skill-track">
                    <div 
                      className="skill-bar" 
                      style={{ 
                        width: `${skill.level}%`,
                        backgroundColor: themeColor,
                        boxShadow: `0 0 10px ${themeColor}66`
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Skills;
