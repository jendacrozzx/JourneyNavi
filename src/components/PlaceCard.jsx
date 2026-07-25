import React, { memo } from 'react';

export const PlaceCard = memo(({ place, isFeatured, onSelect, activeCategory }) => {
  return (
    <div 
      className={`place-item ${isFeatured ? 'featured-card' : ''}`}
      onClick={() => onSelect(place)}
    >
      {isFeatured && <div className="featured-badge">⭐ Top Recommendation</div>}
      <div className="place-name">{place.name}</div>
      <div className="place-details">{place.display_name}</div>
      
      <div className="badges-row">
        <span className="distance-badge">🚗 {place.distanceText}</span>
        <span className="status-badge">★ {place.rating}</span>
        <span className="score-badge">Score: {place.score}</span>
      </div>

      <div className="amenities-row">
        <span className="amenity-tag">📶 WiFi</span>
        <span className="amenity-tag">🅿️ Parking</span>
        {activeCategory === 'ev' && <span className="amenity-tag">⚡ Fast DC</span>}
      </div>

      <div className="price-tag">
        Est. Cost: ₹{place.estimatedCost.toLocaleString()}
      </div>
    </div>
  );
});