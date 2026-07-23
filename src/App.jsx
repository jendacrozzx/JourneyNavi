import React, { useState } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import './App.css';

// Styling configuration for the Google Map container so it fits perfectly in our UI layout
const mapContainerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '600px'
};

function App() {
  // Database of major cities in Nepal connected by road networks
  const cities = {
    Kathmandu: { lat: 27.7172, lng: 85.3240 },
    Pokhara: { lat: 28.2096, lng: 83.9856 },
    Chitwan: { lat: 27.5291, lng: 84.3542 },
    Lumbini: { lat: 27.4777, lng: 83.2769 },
    Biratnagar: { lat: 26.4525, lng: 87.2718 },
    Dharan: { lat: 26.8065, lng: 87.2846 },
    Butwal: { lat: 27.7006, lng: 83.4484 },
    Nepalgunj: { lat: 28.0500, lng: 81.6167 },
    Janakpur: { lat: 26.7288, lng: 85.9259 }
  };

  // Curated, filterable categories for the digital concierge
  const categories = ['All', 'Lodging', 'Adventure', 'Nightlife'];

  // State management for UI interactions
  const [selectedCity, setSelectedCity] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [routeDetails, setRouteDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState(cities.Kathmandu); // Default to Kathmandu coordinates
  
  // State to handle clicking on map markers to show InfoWindows
  const [activeMarker, setActiveMarker] = useState(null);

  // Mock points of interest based on the selected city
  const getPointsOfInterest = (city) => {
    if (!city) return [];
    const baseLat = cities[city].lat;
    const baseLng = cities[city].lng;
    
    // Generating mockup places clustered around the selected city center
    return [
      { id: 1, name: 'Rainbow Guest House', type: 'Lodging', lat: baseLat + 0.01, lng: baseLng - 0.01 },
      { id: 2, name: 'Sunflower Boutique Hotel', type: 'Lodging', lat: baseLat - 0.005, lng: baseLng + 0.015 },
      { id: 3, name: '9km Lakeside Morning Run', type: 'Adventure', lat: baseLat + 0.02, lng: baseLng + 0.005 },
      { id: 4, name: 'Bungee Jump Platform', type: 'Adventure', lat: baseLat - 0.015, lng: baseLng - 0.02 },
      { id: 5, name: 'Neon Bamboo Lounge', type: 'Nightlife', lat: baseLat + 0.005, lng: baseLng + 0.005 },
    ];
  };

  // Filter the available places based on the category the user clicked
  const currentPlaces = getPointsOfInterest(selectedCity).filter(
    place => activeCategory === 'All' || place.type === activeCategory
  );

  // Update map coordinates when user chooses a new city from the dropdown
  const handleCityChange = (e) => {
    const city = e.target.value;
    setSelectedCity(city);
    setRouteDetails(null); 
    setActiveMarker(null); // Close any open info windows
    if (city) {
      setMapCenter(cities[city]);
    }
  };

  // Trigger the programmatic module to calculate budget optimized routes
  const calculateBudgetRoute = () => {
    if (!selectedCity) {
      alert('Please select a destination city to begin.');
      return;
    }

    setIsLoading(true);

    // Simulating API processing time for the pathfinding math
    setTimeout(() => {
      // Localized base-plus-distance algorithm
      const baseFare = 50; // Base flag-drop rate in NPR
      const costPerKm = 65; // Rate per kilometer
      
      const mockDistanceKm = (currentPlaces.length * 2.3).toFixed(1); 
      const totalCost = baseFare + (mockDistanceKm * costPerKm);

      setRouteDetails({
        distance: `${mockDistanceKm} km`,
        time: `${Math.round(mockDistanceKm * 4)} minutes`,
        waypoints: currentPlaces.length,
        cost: `Rs. ${Math.round(totalCost)}`
      });
      
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="dashboard-container">
      {/* Header for the Journey Navigation System */}
      <header className="app-header">
        <h1>Journey Navigation System</h1>
        <div className="user-profile">Travelers: Narith</div>
      </header>

      <main className="main-content">
        <aside className="sidebar">
          <h2>Plan Your Itinerary</h2>
          
          {/* Destination Selection Dropdown */}
          <div className="control-group" style={{ marginTop: '1.5rem' }}>
            <label>Select Destination City</label>
            <select value={selectedCity} onChange={handleCityChange}>
              <option value="">-- Choose a Hub --</option>
              {Object.keys(cities).map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Interactive filter chips for points of interest */}
          <div className="control-group">
            <label>Points of Interest</label>
            <div className="categories-container">
              {categories.map((cat) => (
                <div 
                  key={cat} 
                  className={`category-chip ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </div>
              ))}
            </div>
          </div>

          {/* Display list of localized entertainment and lodging options */}
          {selectedCity && (
            <div className="places-list">
              <label style={{ fontWeight: 600, color: 'var(--deep-slate-blue)' }}>Available Stops:</label>
              {currentPlaces.map(place => (
                <div key={place.id} className="place-item">
                  <span>{place.name}</span>
                  <span style={{ fontSize: '0.8rem', color: '#64748B' }}>{place.type}</span>
                </div>
              ))}
              {currentPlaces.length === 0 && <p style={{fontSize: '0.9rem'}}>No places found for this category.</p>}
            </div>
          )}

          {/* Action button to execute the budget routing engine */}
          <button 
            className="action-button" 
            onClick={calculateBudgetRoute}
            disabled={isLoading || !selectedCity || currentPlaces.length === 0}
          >
            {isLoading ? 'Processing Route Data...' : 'Generate Cost-Optimized Route'}
          </button>

          {/* Output card for transit estimates */}
          {routeDetails && (
            <div className="fare-estimate-card">
              <h3>Trip Logistics</h3>
              <p><strong>Total Distance:</strong> {routeDetails.distance}</p>
              <p><strong>Estimated Travel Time:</strong> {routeDetails.time}</p>
              <p><strong>Integrated Waypoints:</strong> {routeDetails.waypoints} Stops</p>
              <hr style={{ margin: '15px 0', borderColor: '#475569', opacity: 0.5 }} />
              <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                Estimated Transit Fare: {routeDetails.cost}
              </p>
              <p style={{ fontSize: '0.75rem', marginTop: '5px', opacity: 0.8 }}>
                *Calculated using localized base-plus-distance algorithm
              </p>
            </div>
          )}
        </aside>

        {/* Real-time geospatial Google Map wrapper */}
        <section className="map-container-wrapper">
          {/* This wrapper loads the Google Maps script using your .env API Key via Vite */}
          <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={13}
            >
              {/* Loop through places and drop a Google Marker for each one */}
              {currentPlaces.map(place => (
                <Marker 
                  key={place.id} 
                  position={{ lat: place.lat, lng: place.lng }}
                  onClick={() => setActiveMarker(place)}
                />
              ))}

              {/* If a user clicks a marker, open the InfoWindow bubble */}
              {activeMarker && (
                <InfoWindow
                  position={{ lat: activeMarker.lat, lng: activeMarker.lng }}
                  onCloseClick={() => setActiveMarker(null)}
                >
                  <div>
                    <strong style={{ color: '#1E293B' }}>{activeMarker.name}</strong>
                    <br />
                    <span style={{ color: '#64748B', fontSize: '0.85rem' }}>{activeMarker.type}</span>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </LoadScript>
        </section>
      </main>
    </div>
  );
}

export default App;