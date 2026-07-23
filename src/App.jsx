import React, { useState, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import './App.css';

// Load the Google Places library
const libraries = ['places', 'geometry'];

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

function App() {
  // Destination Hubs
  const cities = {
    Kathmandu: { lat: 27.7172, lng: 85.3240 },
    Pokhara: { lat: 28.2096, lng: 83.9856 },
    Chitwan: { lat: 27.5291, lng: 84.3542 },
    Lumbini: { lat: 27.4777, lng: 83.2769 }
  };

  const categories = [
    { id: 'lodging', label: '🏨 Stays & Hotels', type: 'lodging', keyword: '' },
    { id: 'ev', label: '⚡ EV Charging Stops', type: 'electric_vehicle_station', keyword: 'electric vehicle charging' },
    { id: 'gas', label: '⛽ Gas Stations', type: 'gas_station', keyword: '' },
    { id: 'hospital', label: '🏥 Hospitals & Medical', type: 'hospital', keyword: '' },
    { id: 'pharmacy', label: '💊 Pharmacies', type: 'pharmacy', keyword: '' },
    { id: 'atm', label: '🏧 ATMs & Banks', type: 'atm', keyword: '' },
    { id: 'supermarket', label: '🛒 Supermarkets', type: 'supermarket', keyword: '' },
    { id: 'cafe', label: '☕ Cafes & Bakeries', type: 'cafe', keyword: '' },
    { id: 'restaurant', label: '🍽️ Fine Dining', type: 'restaurant', keyword: '' },
    { id: 'park', label: '🌳 Parks & Nature', type: 'park', keyword: '' },
    { id: 'museum', label: '🏛️ Cultural Museums', type: 'museum', keyword: '' },
    { id: 'tourist', label: '📸 Landmarks', type: 'tourist_attraction', keyword: '' }
  ];

  const [selectedCity, setSelectedCity] = useState('Kathmandu');
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  
  const [mapInstance, setMapInstance] = useState(null);
  const [places, setPlaces] = useState([]);
  const [activeMarker, setActiveMarker] = useState(null);
  const [mapCenter, setMapCenter] = useState(cities.Kathmandu);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // User Live/Shared Location State
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Share My Location');

  const onLoad = useCallback(function callback(map) {
    setMapInstance(map);
  }, []);

  // Handler to get user's current GPS location via Geolocation API
  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLocationStatus('Locating...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(pos);
        setMapCenter(pos);
        setLocationStatus('Location Shared ✓');
        if (mapInstance) {
          mapInstance.panTo(pos);
          mapInstance.setZoom(15);
        }
      },
      () => {
        setLocationStatus('Permission Denied');
        alert('Unable to retrieve your location.');
      }
    );
  };

  // Helper function to calculate distance in kilometers using Google Maps geometry library
  const calculateDistance = (destLocation) => {
    if (!userLocation || !window.google || !window.google.maps.geometry) return null;
    const from = new window.google.maps.LatLng(userLocation.lat, userLocation.lng);
    const to = new window.google.maps.LatLng(destLocation.lat, destLocation.lng);
    const distanceMeters = window.google.maps.geometry.spherical.computeDistanceBetween(from, to);
    return (distanceMeters / 1000).toFixed(1); // Return distance in km rounded to 1 decimal place
  };

  // Fire the Google Places API Request
  const handleSearch = () => {
    if (!mapInstance || !window.google) return;
    
    setIsSearching(true);
    setHasSearched(true);
    setPlaces([]); 
    setActiveMarker(null);
    
    // If user shared location, search around user location, otherwise search around selected city center
    const searchCenter = userLocation || cities[selectedCity];
    setMapCenter(searchCenter);

    const service = new window.google.maps.places.PlacesService(mapInstance);
    
    const request = {
      location: searchCenter,
      radius: '5000', 
      type: [activeCategory.type],
      keyword: activeCategory.keyword
    };

    service.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        const cleanResults = results.filter(p => p.name && (p.vicinity || p.formatted_address));
        setPlaces(cleanResults);
      }
      setIsSearching(false);
    });
  };

  return (
    <div className="dashboard-container">
      {/* Glassmorphic Header */}
      <header className="app-header">
        <h1>JourneyNavi</h1>
        <div className="user-profile">Travelers</div>
      </header>

      <main className="main-content">
        {/* Floating Sidebar */}
        <aside className="sidebar">
          <h2>Discover Places</h2>
          
          <div className="control-group">
            <label>1. Share Current Location</label>
            <button className="location-btn" onClick={handleShareLocation}>
              📍 {locationStatus}
            </button>
          </div>

          <div className="control-group">
            <label>2. Select Destination Hub</label>
            <select 
              value={selectedCity} 
              onChange={(e) => {
                setSelectedCity(e.target.value);
                setHasSearched(false);
                setPlaces([]);
                if (!userLocation) {
                  setMapCenter(cities[e.target.value]);
                }
              }}
            >
              {Object.keys(cities).map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label>3. Explore Categories</label>
            <div className="categories-container">
              {categories.map((cat) => (
                <div 
                  key={cat.id} 
                  className={`category-chip ${activeCategory.id === cat.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveCategory(cat);
                    setHasSearched(false);
                  }}
                >
                  {cat.label}
                </div>
              ))}
            </div>
          </div>

          {/* Results List */}
          {hasSearched && (
            <div className="places-list">
              {places.length === 0 && !isSearching && (
                <div className="no-results">
                  No matches found nearby for {activeCategory.label}. Try a different category!
                </div>
              )}
              
              {places.map((place) => {
                const dist = calculateDistance(place.geometry.location);
                return (
                  <div 
                    key={place.place_id} 
                    className="place-item"
                    onClick={() => {
                      setMapCenter(place.geometry.location);
                      setActiveMarker(place);
                    }}
                  >
                    <div className="place-name">{place.name}</div>
                    <div className="place-details">{place.vicinity || place.formatted_address}</div>
                    <div>
                      {dist && <span className="distance-badge">📍 {dist} km away</span>}
                      {place.rating && (
                        <span className="status-badge">★ {place.rating} ({place.user_ratings_total || 0})</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button 
            className="action-button" 
            onClick={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? 'Scanning Area...' : `Find ${activeCategory.label.split(' ').slice(1).join(' ')}`}
          </button>
        </aside>

        {/* Elevated Map Container */}
        <section className="map-container-wrapper">
          <LoadScript 
            googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
            libraries={libraries}
          >
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={14}
              onLoad={onLoad}
              options={{
                disableDefaultUI: true, 
                zoomControl: true,
              }}
            >
              {/* User Live Location Marker */}
              {userLocation && (
                <Marker 
                  position={userLocation}
                  icon={{
                    path: window.google?.maps?.SymbolPath?.CIRCLE,
                    scale: 8,
                    fillColor: '#4f46e5',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 2,
                  }}
                  title="Your Current Location"
                />
              )}

              {/* Destination POI Markers */}
              {places.map(place => (
                <Marker 
                  key={place.place_id}
                  position={place.geometry.location}
                  onClick={() => setActiveMarker(place)}
                  animation={window.google.maps.Animation.DROP}
                />
              ))}

              {activeMarker && (
                <InfoWindow
                  position={activeMarker.geometry.location}
                  onCloseClick={() => setActiveMarker(null)}
                >
                  <div style={{ padding: '8px', maxWidth: '220px', fontFamily: 'Plus Jakarta Sans' }}>
                    <strong style={{ color: '#0f172a', display: 'block', marginBottom: '6px', fontSize: '1rem' }}>
                      {activeMarker.name}
                    </strong>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '6px' }}>
                      {activeMarker.vicinity || activeMarker.formatted_address}
                    </span>
                    {userLocation && (
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4f46e5', display: 'block', marginBottom: '4px' }}>
                        🚗 {calculateDistance(activeMarker.geometry.location)} km from your location
                      </span>
                    )}
                    {activeMarker.rating && (
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#10b981' }}>
                        ★ {activeMarker.rating} / 5.0
                      </span>
                    )}
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