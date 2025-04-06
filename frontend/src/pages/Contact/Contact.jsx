import React from 'react';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import { FaUser, FaEnvelope, FaComment, FaPaperPlane, FaMapMarkerAlt, FaPhoneAlt } from 'react-icons/fa';
import './Contact.css';

function Contact() {
  return (
    <div className="page-wrapper">
      <Navbar />
      
      <div className="hero-section">
        <div className="hero-content">
          <h1>Get In Touch</h1>
          <p className="subtitle">We'd love to hear from you!</p>
        </div>
      </div>
      
      <div className="contact-container">
        <div className="contact-info">
          <h2>Contact Information</h2>
          <p>Have questions or feedback? Our team is ready to assist you.</p>
          
          <div className="info-box">
            <div className="info-item">
              <div className="info-icon">
                <FaMapMarkerAlt className="icon" />
              </div>
              <div>
                <h3>Our Location</h3>
                <p>123 Business Avenue, Suite 500</p>
                <p>San Francisco, CA 94107</p>
              </div>
            </div>
            
            <div className="info-item">
              <div className="info-icon">
                <FaPhoneAlt className="icon" />
              </div>
              <div>
                <h3>Call Us</h3>
                <p>(555) 123-4567</p>
              </div>
            </div>
            
            <div className="info-item">
              <div className="info-icon">
                <FaEnvelope className="icon" />
              </div>
              <div>
                <h3>Email Us</h3>
                <p>support@yourcompany.com</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="contact-form-container">
          <h2>Send a Message</h2>
          
          <form className="contact-form">
            <div className="form-group">
              <div className="input-icon">
                <FaUser className="icon" />
              </div>
              <input type="text" id="name" name="name" placeholder="Your Name" required />
            </div>
            
            <div className="form-group">
              <div className="input-icon">
                <FaEnvelope className="icon" />
              </div>
              <input type="email" id="email" name="email" placeholder="Your Email" required />
            </div>
            
            <div className="form-group">
              <div className="input-icon">
                <FaComment className="icon" />
              </div>
              <textarea id="message" name="message" placeholder="Your Message" required></textarea>
            </div>
            
            <button type="submit" className="submit-btn">
              <span>Send Message</span>
              <FaPaperPlane className="btn-icon" />
            </button>
          </form>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

export default Contact;