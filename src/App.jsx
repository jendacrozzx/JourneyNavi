import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

// --- Leaflet Icon Fix for React ---
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom Blue Pin for User/City Origin
const originIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2-blue.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// --- Constants & Config ---
const CITIES = {
  Kathmandu: { lat: 27.6966, lng: 85.3591, name: "Kathmandu (Capital)" },
  Pokhara: { lat: 28.2096, lng: 83.9856, name: "Pokhara (Lakeside)" },
  Chitwan: { lat: 27.6833, lng: 84.3333, name: "Chitwan / Bharatpur" },
  Lumbini: { lat: 27.4840, lng: 83.2760, name: "Lumbini" }
};

// Advanced OSM Tags (Catches Bhatbhateni via department_store)
const CATEGORIES = [
  { id: 'lodging', label: '🏨 Stays & Hotels', tags: ['"tourism"="hotel"', '"tourism"="motel"'] },
  { id: 'gas', label: '⛽ Gas Stations', tags: ['"amenity"="fuel"'] },
  { id: 'hospital', label: '🏥 Hospitals', tags: ['"amenity"="hospital"', '"amenity"="clinic"'] },
  { id: 'supermarket', label: '🛒 Supermarkets', tags: ['"shop"="supermarket"', '"shop"="department_store"', '"shop"="mall"'] },
  { id: 'cafe', label: '☕ Cafes', tags: ['"amenity"="cafe"'] },
  { id: 'restaurant', label: '🍽️ Restaurants', tags: ['"amenity"="restaurant"'] }
];

// --- Map Controller Helper ---
function MapViewController({ center, zoom, activePlace }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      // Offset slightly if a place is selected so the popup isn't hidden by the sidebar
      const targetCenter = activePlace ? [center[0], center[1] - 0.01] : center;
      map.flyTo(targetCenter, zoom, { duration: 1.5 });
    }
  }, [center, zoom, activePlace, map]);
  return null;
}

// --- Main Application ---
function App() {
  // App State
  const [selectedCity, setSelectedCity] = useState('Kathmandu');
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[3]); // Default to Supermarket
  const [places, setPlaces] = useState([]);
  const [activeMarker, setActiveMarker] = useState(null);
  const [mapCenter, setMapCenter] = useState([CITIES.Kathmandu.lat, CITIES.Kathmandu.lng]);
  const [mapZoom, setMapZoom] = useState(13);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // User Data & Filters
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Use My Current GPS');
  const [budget, setBudget] = useState(5000);
  const [fuelEfficiency, setFuelEfficiency] = useState(15); // km per liter
  const [fuelPrice] = useState(170); // NPR per liter

  // Route State
  const [routeGeometry, setRouteGeometry] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);

  // --- Handlers ---
  const handleCityChange = (e) => {
    const cityName = e.target.value;
    setSelectedCity(cityName);
    setUserLocation(null); 
    setLocationStatus('Use My Current GPS');
    
    setMapCenter([CITIES[cityName].lat, CITIES[cityName].lng]);
    setMapZoom(13);
    resetSearchState();
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation is not supported.');
    setLocationStatus('Locating...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = [position.coords.latitude, position.coords.longitude];
        setUserLocation(pos);
        setMapCenter(pos);
        setMapZoom(14);
        setLocationStatus('📍 Location Active');
      },
      () => setLocationStatus('Permission Denied')
    );
  };

  const resetSearchState = () => {
    setHasSearched(false);
    setPlaces([]);
    setActiveMarker(null);
    setRouteGeometry(null);
    setRouteInfo(null);
  };

  // --- Core API Integration ---
  const fetchPlaces = async () => {
    setIsSearching(true);
    resetSearchState();
    setHasSearched(true);

    const origin = userLocation || [CITIES[selectedCity].lat, CITIES[selectedCity].lng];
    setMapCenter(origin);
    
    // Build query for multiple tags (e.g. supermarket + department_store)
    const radius = 6000;
    const tagQueries = activeCategory.tags.map(tag => `
      node[${tag}](around:${radius},${origin[0]},${origin[1]});
      way[${tag}](around:${radius},${origin[0]},${origin[1]});
    `).join('');

    const query = `[out:json][timeout:25];(${tagQueries});out center 30;`;

    try {
      const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      const data = await response.json();

      const fetchedPlaces = data.elements
        .filter(item => item.lat || item.center?.lat)
        .map((item) => ({
          id: item.id,
          name: item.tags?.name || `${activeCategory.label.split(' ')[1]} (Unnamed)`,
          brand: item.tags?.brand || null,
          address: item.tags?.['addr:street'] || item.tags?.['addr:suburb'] || 'Local Area',
          lat: item.lat || item.center?.lat,
          lng: item.lon || item.center?.lon,
          phone: item.tags?.phone || null,
          website: item.tags?.website || null,
        }));

      // Sort by Name to push named entities (like Bhatbhateni) up
      fetchedPlaces.sort((a, b) => a.name.localeCompare(b.name));
      setPlaces(fetchedPlaces);
    } catch (err) {
      console.error('OSM Fetch Error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const calculateRoute = async (place) => {
    setActiveMarker(place);
    const origin = userLocation || [CITIES[selectedCity].lat, CITIES[selectedCity].lng];
    const destination = [place.lat, place.lng];
    setMapCenter(destination);
    setMapZoom(15);

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.routes?.[0]) {
        const route = data.routes[0];
        setRouteGeometry(route.geometry.coordinates.map(c => [c[1], c[0]]));

        const distKm = (route.distance / 1000).toFixed(1);
        const durationMins = Math.round(route.duration / 60);
        
        // Dynamic Cost Calculation
        const litersNeeded = distKm / fuelEfficiency;
        const fuelCost = Math.round(litersNeeded * fuelPrice);

        setRouteInfo({
          distance: `${distKm} km`,
          duration: `${durationMins} min`,
          fuelCost: fuelCost,
          balance: budget - fuelCost
        });
      }
    } catch (err) {
      console.error('OSRM Route Error:', err);
    }
  };

  // --- Render ---
  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <header className="app-header">
        <div className="brand-container">
          <h1>JourneyNavi</h1>
          <span className="badge-pro">PRO EDITION</span>
        </div>
        <div className="header-meta">
          <span className="meta-pill">OSM Engine</span>
          <span className="meta-pill date-pill">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>
      </header>

      <main className="main-content">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-scroll-content">
            <h2>Discover Places</h2>

            {/* Core Controls */}
            <div className="control-group">
              <label>1. Origin Point</label>
              <button className="location-btn" onClick={handleShareLocation}>
                {locationStatus}
              </button>
              <select value={selectedCity} onChange={handleCityChange} style={{ marginTop: '8px' }}>
                {Object.keys(CITIES).map(city => (
                  <option key={city} value={city}>{CITIES[city].name}</option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <label>2. Category</label>
              <div className="categories-container">
                {CATEGORIES.map(cat => (
                  <div 
                    key={cat.id} 
                    className={`category-chip ${activeCategory.id === cat.id ? 'active' : ''}`}
                    onClick={() => { setActiveCategory(cat); resetSearchState(); }}
                  >
                    {cat.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Pro Filters: Matches CSS exactly */}
            <div className="budget-filter-group">
              <div className="cost-row">
                <span className="sub-label">TRIP BUDGET LIMIT</span>
                <span className="budget-value-text">NPR {budget.toLocaleString()}</span>
              </div>
              <input 
                type="range" 
                className="budget-slider" 
                min="500" max="20000" step="500"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
              />
            </div>

            <div className="fuel-calculator-card">
              <span className="sub-label">VEHICLE SPECS</span>
              <div className="fuel-grid">
                <div>
                  <span className="sub-label" style={{fontSize: '0.6rem'}}>Mileage (km/L)</span>
                  <input 
                    type="number" 
                    value={fuelEfficiency} 
                    onChange={e => setFuelEfficiency(Number(e.target.value) || 1)} 
                  />
                </div>
                <div>
                  <span className="sub-label" style={{fontSize: '0.6rem'}}>Fuel Price (Rs)</span>
                  <input type="number" value={fuelPrice} disabled />
                </div>
              </div>
            </div>

            {/* Results List */}
            {hasSearched && (
              <div className="places-list">
                {places.length === 0 && !isSearching && (
                  <div className="no-results">No {activeCategory.label.toLowerCase()} found nearby.</div>
                )}
                
                {places.map((place) => (
                  <div 
                    key={place.id} 
                    className={`place-item ${activeMarker?.id === place.id ? 'selected' : ''} ${place.name.toLowerCase().includes('bhat') ? 'featured-card' : ''}`}
                    onClick={() => calculateRoute(place)}
                  >
                    {place.name.toLowerCase().includes('bhat') && (
                      <div className="featured-badge">⭐ Top Match</div>
                    )}
                    <div className="place-name">{place.name}</div>
                    <div className="place-details">{place.address}</div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Route Summary Box */}
            {routeInfo && activeMarker && (
              <div className="bottom-route-panel">
                <h3>📍 Route Analysis</h3>
                <div className="summary-destination-title">{activeMarker.name}</div>
                <div className="summary-meta-row">
                  <span>🚗 {routeInfo.distance}</span>
                  <span>⏱️ {routeInfo.duration} drive</span>
                </div>
                
                <div className="summary-cost-breakdown">
                  <div className="cost-row">
                    <span>Est. Fuel Cost</span>
                    <span>Rs. {routeInfo.fuelCost.toLocaleString()}</span>
                  </div>
                  <div className="cost-row total-row">
                    <span>Budget Balance</span>
                    <span className={`balance-row ${routeInfo.balance >= 0 ? 'positive' : 'negative'}`}>
                      {routeInfo.balance >= 0 ? '+' : ''}Rs. {routeInfo.balance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="sidebar-footer-action">
            <button className="action-button" onClick={fetchPlaces} disabled={isSearching}>
              {isSearching ? 'Scanning Area...' : `Scan for ${activeCategory.label.split(' ')[1]}`}
            </button>
          </div>
        </aside>

        {/* MAP VIEW */}
        <section className="map-container-wrapper">
          <MapContainer center={mapCenter} zoom={mapZoom} zoomControl={false}>
            <MapViewController center={mapCenter} zoom={mapZoom} activePlace={activeMarker} />
            
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Origin Pin */}
            <Marker position={userLocation || [CITIES[selectedCity].lat, CITIES[selectedCity].lng]} icon={originIcon}>
              <Popup>
                <div className="custom-infowindow">
                  <span className="iw-title">Origin Point</span>
                  <span className="iw-address">{userLocation ? 'Your Device GPS' : CITIES[selectedCity].name}</span>
                </div>
              </Popup>
            </Marker>

            {/* Result Pins */}
            {places.map(place => (
              <Marker 
                key={place.id} 
                position={[place.lat, place.lng]}
                eventHandlers={{ click: () => calculateRoute(place) }}
              >
                <Popup>
                  <div className="custom-infowindow">
                    <span className="iw-title">{place.name}</span>
                    <span className="iw-address">{place.address}</span>
                    
                    {routeInfo && activeMarker?.id === place.id && (
                      <div className="iw-route-box">
                        🚗 {routeInfo.distance} • {routeInfo.duration}
                      </div>
                    )}
                    
                    {(place.phone || place.website) && (
                      <div className="iw-extra-details">
                        {place.phone && <span>📞 {place.phone}</span>}
                        {place.website && <a href={place.website} target="_blank" rel="noreferrer">🌐 Visit Website</a>}
                      </div>
                    )}
                    
                    <button className="iw-navigate-btn" onClick={() => calculateRoute(place)}>
                      Generate Route
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Route Line */}
            {routeGeometry && (
              <Polyline positions={routeGeometry} color="#4f46e5" weight={5} opacity={0.8} />
            )}
          </MapContainer>
        </section>
      </main>
    </div>
  );
}

export default App;