import React from 'react';
import './App.css';

export default function LandingPage({ onEnterApp, onOpenAdminModal }) {
  return (
    <div className="landing-page-wrapper">
      <nav className="landing-top-nav">
        <div className="landing-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className="brand-dot"></span>
          <span className="brand-title">JourneyNavi</span>
        </div>
        <div className="landing-nav-right">
          <button className="nav-ghost-btn" onClick={() => onEnterApp('user')}>
            Sign in
          </button>
          <button className="nav-solid-btn" onClick={() => onEnterApp('user')}>
            Get Started
          </button>
          <div className="nav-divider"></div>
          <button className="admin-access-btn" onClick={onOpenAdminModal}>
            <span>🛡️</span> Admin Console
          </button>
        </div>
      </nav>

      <section className="landing-hero-container">
        <span className="metadata-tag">BCA 4TH SEMESTER PROJECT</span>

        <h1 className="hero-main-title">
          Smart Geospatial Routing <br />
          <span className="hero-highlight">Made Simple & Fast.</span>
        </h1>

        <p className="hero-subtitle">
          An intuitive routing and spatial discovery platform built on OpenStreetMap networks 
          and OSRM matrices. Plan trips, calculate expenses, and explore locations effortlessly.
        </p>

        <div className="hero-cta-group">
          <button className="hero-primary-btn" onClick={() => onEnterApp('user')}>
            Launch Application
          </button>
        </div>

        <div className="architectural-grid">
          <div className="grid-item">
            <h3>Live OSM Nodes</h3>
            <p>Instantly search hotels, gas stations, hospitals, and cafes within your target radius.</p>
          </div>
          <div className="grid-item">
            <h3>OSRM Routing</h3>
            <p>Get precise turn-by-turn driving polylines, exact travel distances, and durations.</p>
          </div>
          <div className="grid-item">
            <h3>Trip Budgeting</h3>
            <p>Calculate estimated fuel consumption and expenses dynamically against your budget.</p>
          </div>
        </div>
      </section>
    </div>
  );
}