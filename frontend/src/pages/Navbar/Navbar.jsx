import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css'; 

function Navbar() {
  return (
    <nav className="sb-navbar">
      <div className="sb-logo">SmartBrief</div>
      <ul className="sb-nav-links">
        <li><Link to="/" className="sb-active">Home</Link></li>
        <li><Link to="/documentation">Documentation</Link></li>
        <li><Link to="/contact">Contact</Link></li>
      </ul>
    </nav>
  );
}

export default Navbar;
