import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';  // Use the new file name

function Footer() {
  return (
    <footer className="dc-footer">
      <div className="dc-footer-content">
        <div className="dc-footer-section">
          <h3>DocConvert</h3>
          <p>Making PDF analysis simple and efficient.</p>
        </div>
        <div className="dc-footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/documentation">Documentation</Link></li>
            
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>
        <div className="dc-footer-section">
          <h3>Contact</h3>
          <p>Email: info@docconvert.com</p>
          <p>Phone: (123) 456-7890</p>
        </div>
      </div>
      <div className="dc-copyright">
        <p>&copy; 2025 DocConvert. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
