import React, { memo } from 'react';

export const Header = memo(({ selectedCity, totalBudget }) => {
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="app-header">
      <div className="brand-container">
        <h1>JourneyNavi</h1>
        <span className="badge-pro">Pro Travel Planner</span>
      </div>
      
      <div className="header-meta">
        <div className="meta-pill">
          <span>📍 {selectedCity}</span>
        </div>
        <div className="meta-pill">
          <span>💰 ₹{totalBudget.toLocaleString()} Budget</span>
        </div>
        <div className="meta-pill date-pill">
          <span>📅 {todayFormatted}</span>
        </div>
      </div>
    </header>
  );
});