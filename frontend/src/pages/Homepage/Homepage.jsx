import React from 'react';
import { Link } from 'react-router-dom';
import './Homepage.css';  // Updated CSS file name
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';

function Home() {
  return (
    <>
      <Navbar />    
    
  
    <div className="sh-home-container">
      {/* <Navbar /> */}

      <section className="sh-hero">
        <div className="sh-hero-content">
          <h1>Transform Your Documents Into Summaries</h1>
          <p>Upload any document and get a concise, intelligent summary in seconds.</p>
          <div className="sh-cta-buttons">
            <Link to="/documentation" className="sh-btn sh-primary-btn">Try Now</Link>
            <a href="#features" className="sh-btn sh-secondary-btn">Learn More</a>
          </div>
        </div>
        <div className="sh-hero-image">
          <img 
            src="/pic1.jpg" 
            alt="Document Conversion Illustration" 
            className="sh-placeholder-image"
          />
        </div>
      </section>

      <section id="features" className="sh-features">
        <h2>How It Works</h2>
        <div className="sh-feature-cards">
          <div className="sh-feature-card">
            <div className="sh-feature-icon">📄</div>
            <h3>Upload</h3>
            <p>Select and upload any document format from your device.</p>
          </div>
          <div className="sh-feature-card">
            <div className="sh-feature-icon">⚙️</div>
            <h3>Process</h3>
            <p>Our advanced AI analyzes and extracts the key information.</p>
          </div>
          <div className="sh-feature-card">
            <div className="sh-feature-icon">📝</div>
            <h3>Summarize</h3>
            <p>Get a concise summary highlighting the important points.</p>
          </div>
          <div className="sh-feature-card">
            <div className="sh-feature-icon">💾</div>
            <h3>Export</h3>
            <p>Save or share your summary in various formats.</p>
          </div>
        </div>
      </section>

      <section className="sh-call-to-action">
        <h2>Ready to Convert Your Documents?</h2>
        <p>Join thousands of users who save time with our document summarization tool.</p>
        <Link to="/documentation" className="sh-btn sh-primary-btn">Get Started</Link>
      </section>

      <Footer />
    </div>
    </>
  );
}

export default Home;
