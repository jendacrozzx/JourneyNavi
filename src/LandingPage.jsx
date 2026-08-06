// LandingPage.jsx
import React from 'react';
import './Landingpage.css';

/* --- SVG Icon Set --- */
const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

export default function LandingPage({ onEnterApp, onOpenAdminModal, onOpenAuthModal }) {
  return (
    <div className="landing-page-wrapper">
      <nav className="landing-top-nav">
        <div className="landing-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className="brand-dot"></span>
          <span className="brand-title">JourneyNavi</span>
        </div>

        <div className="landing-nav-right">
          <button className="nav-ghost-btn" onClick={onOpenAuthModal}>
            Sign In
          </button>
          <button className="nav-solid-btn" onClick={() => onEnterApp('user')}>
            Get Started
          </button>
          <div className="nav-divider"></div>
          <button className="admin-access-btn" onClick={onOpenAdminModal}>
            <span className="admin-icon">🛡️</span> Admin Console
          </button>
        </div>
      </nav>

      <main className="landing-hero-container">
        <div className="hero-badge-wrapper">
          <span className="metadata-tag">BCA 4TH SEMESTER PROJECT</span>
        </div>

        <h1 className="hero-main-title">
          Smart geospatial routing <br />
          <span className="hero-highlight">made simple &amp; fast.</span>
        </h1>

        <p className="hero-subtitle">
          An intuitive routing and spatial discovery platform built on OpenStreetMap networks
          and OSRM matrices. Plan trips, calculate expenses, and explore locations effortlessly.
        </p>

        {/* Hero Actions */}
        <div className="hero-cta-group">
          <button className="hero-primary-btn" onClick={() => onEnterApp('user')}>
            <span>Launch Workspace</span>
            <ArrowRightIcon />
          </button>
        </div>

        <div className="architectural-grid">
          <div className="grid-item">
            <div className="grid-item-icon">🌍</div>
            <h3>Live OSM Nodes</h3>
            <p>Instantly search hotels, gas stations, hospitals, and cafes within your target radius.</p>
          </div>
          <div className="grid-item">
            <div className="grid-item-icon">🗺️</div>
            <h3>OSRM Routing</h3>
            <p>Get precise turn-by-turn driving polylines, exact travel distances, and durations.</p>
          </div>
          <div className="grid-item">
            <div className="grid-item-icon">💰</div>
            <h3>Trip Budgeting</h3>
            <p>Calculate estimated fuel consumption and expenses dynamically against your budget.</p>
          </div>
        </div>
      </main>
    </div>
  );
}