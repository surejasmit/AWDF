import { useState, useEffect } from 'react';
import NavBar from './component/NavBar';
import Header from './component/Header';
import About from './component/About';
import Skills from './component/Skills';
import Footer from './component/Footer';
import './App.css';

function App() {
  const [themeColor, setThemeColor] = useState('#8b5cf6'); // Default Violet
  const [activeSection, setActiveSection] = useState('home');

  const skillsData = [
    { name: 'React.js', level: 90, category: 'Frontend' },
    { name: 'JavaScript (ES6+)', level: 85, category: 'Frontend' },
    { name: 'C++', level: 80, category: 'Languages' },
    { name: 'Python', level: 75, category: 'Languages' },
    { name: 'Java', level: 70, category: 'Languages' },
    { name: 'AWS Cloud', level: 65, category: 'Cloud/DevOps' },
  ];

  const studentInfo = {
    name: 'Smit Sureja',
    title: 'Full Stack Developer & B.Tech Student',
    university: 'Charusat University',
    email: 'smit@gmail.com',
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
    bio: 'I am a passionate B.Tech student pursuing Computer Science. I specialize in building responsive, interactive, and high-performance web applications using modern technologies like React, Node.js, and AWS Cloud.'
  };

  useEffect(() => {
    const sections = ['home', 'about', 'skills', 'contact'];
    
    const handleScroll = () => {
      // Find current section in viewport
      const scrollPosition = window.scrollY + 120; // offset for nav height
      
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Trigger initially
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="portfolio-app">
      <NavBar 
        activeSection={activeSection} 
        themeColor={themeColor} 
        setThemeColor={setThemeColor} 
      />
      <main className="main-content">
        <section id="home">
          <Header 
            themeColor={themeColor} 
            name={studentInfo.name} 
            title={studentInfo.title} 
            university={studentInfo.university}
          />
        </section>
        
        <section id="about">
          <About 
            themeColor={themeColor} 
            bio={studentInfo.bio} 
            university={studentInfo.university}
          />
        </section>
        
        <section id="skills">
          <Skills 
            skillsList={skillsData} 
            themeColor={themeColor} 
          />
        </section>
      </main>
      
      <section id="contact">
        <Footer 
          themeColor={themeColor} 
          name={studentInfo.name} 
          email={studentInfo.email}
          github={studentInfo.github}
          linkedin={studentInfo.linkedin}
        />
      </section>
    </div>
  );
}

export default App;
