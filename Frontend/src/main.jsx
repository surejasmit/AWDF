import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Header from './component/Header.jsx';
import About from './component/About.jsx';
import Skills from './component/Skill.jsx';
import Footer from './component/Footer.jsx';

// import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Header/>
    <About/>
    <Skills/>
    <Footer/>

  </StrictMode>,
)
