import React, { memo } from 'react';
import { BudgetPanel } from './BudgetPanel';
import { FuelCalculator } from './FuelCalculator';
import { PlaceCard } from './PlaceCard';
import { TripSummary } from './TripSummary';

export const Sidebar = memo(({
  locationStatus,
  handleShareLocation,
  cities,
  selectedCity,
  handleCityChange,
  categories,
  activeCategory,
  setActiveCategory,
  setHasSearched,
  totalBudget,
  setTotalBudget,
  vehicleType,
  setVehicleType,
  mileage,
  setMileage,
  fuelPrice,
  setFuelPrice,
  travelMode,
  setTravelMode,
  hasSearched,
  places,
  isSearching,
  handleSearch,
  selectAndRoutePlace,
  tripPlan,
  selectedPlace
}) => {
  const topChoice = places.length > 0 ? places[0] : null;
  const alternateChoices = places.length > 1 ? places.slice(1) : [];

  return (
    <aside className="sidebar">
      <div className="sidebar-scroll-content">
        <h2>Trip Planner Studio</h2>

        <div className="control-group">
          <label>1. LOCATION SOURCE</label>
          <button className="location-btn" onClick={handleShareLocation}>
            📍 {locationStatus}
          </button>
        </div>

        <div className="control-group">
          <label>2. TARGET CITY HUB</label>
          <select value={selectedCity} onChange={(e) => handleCityChange(e.target.value)}>
            {Object.keys(cities).map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>3. TRAVEL MODE</label>
          <div className="travel-mode-row">
            {['Car', 'Bike', 'Walking', 'Cycling'].map(mode => (
              <button 
                key={mode}
                className={`mode-chip ${travelMode === mode ? 'active' : ''}`}
                onClick={() => setTravelMode(mode)}
              >
                {mode === 'Car' && '🚗'}
                {mode === 'Bike' && '🏍️'}
                {mode === 'Walking' && '🚶'}
                {mode === 'Cycling' && '🚴'}
                <span>{mode}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <label>4. CATEGORY SELECTOR</label>
          <div className="categories-container">
            {categories.map((cat) => (
              <div 
                key={cat.id} 
                className={`category-chip ${activeCategory.id === cat.id ? 'active' : ''}`}
                onClick={() => { setActiveCategory(cat); setHasSearched(false); }}
              >
                {cat.label}
              </div>
            ))}
          </div>
        </div>

        <BudgetPanel totalBudget={totalBudget} setTotalBudget={setTotalBudget} />

        <FuelCalculator 
          vehicleType={vehicleType} 
          setVehicleType={setVehicleType}
          mileage={mileage}
          setMileage={setMileage}
          fuelPrice={fuelPrice}
          setFuelPrice={setFuelPrice}
        />

        {hasSearched && (
          <div className="places-list">
            {places.length === 0 && !isSearching && (
              <div className="no-results">
                No matching destinations found under ₹{totalBudget.toLocaleString()} budget with current filters. Try expanding your budget range!
              </div>
            )}

            {topChoice && (
              <PlaceCard 
                place={topChoice} 
                isFeatured={true} 
                onSelect={selectAndRoutePlace} 
                activeCategory={activeCategory.id}
              />
            )}

            {alternateChoices.map((place) => (
              <PlaceCard 
                key={place.place_id} 
                place={place} 
                isFeatured={false} 
                onSelect={selectAndRoutePlace} 
                activeCategory={activeCategory.id}
              />
            ))}
          </div>
        )}

        <TripSummary tripPlan={tripPlan} selectedPlace={selectedPlace} />
      </div>

      <div className="sidebar-footer-action">
        <button className="action-button" onClick={handleSearch} disabled={isSearching}>
          {isSearching ? 'Analyzing Recommendations...' : `Run Smart Planner (₹${totalBudget.toLocaleString()})`}
        </button>
      </div>
    </aside>
  );
});