import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const originIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2-blue.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const CITIES = {
  Kathmandu: { lat: 27.6966, lng: 85.3591, name: "Kathmandu" },
  Pokhara: { lat: 28.2096, lng: 83.9856, name: "Pokhara" },
  Chitwan: { lat: 27.6833, lng: 84.3333, name: "Chitwan" },
  Lumbini: { lat: 27.4840, lng: 83.2760, name: "Lumbini" }
};

const CATEGORIES = [
  { id: 'lodging', label: 'Stays & Hotels', icon: '🏨', tags: ['"tourism"="hotel"', '"tourism"="motel"', '"amenity"="hotel"'] },
  { id: 'gas', label: 'Gas Stations', icon: '⛽', tags: ['"amenity"="fuel"', '"shop"="fuel"'] },
  { id: 'hospital', label: 'Hospitals', icon: '🏥', tags: ['"amenity"="hospital"', '"amenity"="clinic"'] },
  { id: 'supermarket', label: 'Supermarkets', icon: '🛒', tags: ['"shop"="supermarket"', '"shop"="mall"'] },
  { id: 'cafe', label: 'Cafes', icon: '☕', tags: ['"amenity"="cafe"', '"amenity"="coffee_shop"'] },
  { id: 'restaurant', label: 'Restaurants', icon: '🍽️', tags: ['"amenity"="restaurant"', '"amenity"="fast_food"'] }
];

function MapViewController({ center, zoom, activePlace }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      const targetCenter = activePlace ? [center[0], center[1] - 0.01] : center;
      map.flyTo(targetCenter, zoom, { duration: 1.5 });
    }
  }, [center, zoom, activePlace, map]);
  return null;
}

export default function MainPage({ initialRole = 'user', onBackToLanding, onOpenAdminModal, onOpenAuthModal }) {
  const [userRole, setUserRole] = useState(initialRole);
  const [selectedCity, setSelectedCity] = useState('Kathmandu');
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [places, setPlaces] = useState([]);
  const [activeMarker, setActiveMarker] = useState(null);
  const [mapCenter, setMapCenter] = useState([CITIES.Kathmandu.lat, CITIES.Kathmandu.lng]);
  const [mapZoom, setMapZoom] = useState(13);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Use Current GPS');
  const [budget, setBudget] = useState(5000);

  const [vehicleType, setVehicleType] = useState('bike');
  const [rideService, setRideService] = useState('pathao');
  const [fuelEfficiency, setFuelEfficiency] = useState(35);
  const [fuelPrice, setFuelPrice] = useState(170);

  const [routeGeometry, setRouteGeometry] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);

  const [showTransitModal, setShowTransitModal] = useState(false);
  const [showAiFunModal, setShowAiFunModal] = useState(false);
  const [selectedPlaceForTransit, setSelectedPlaceForTransit] = useState(null);

  const [customPlaces, setCustomPlaces] = useState(() => {
    const saved = localStorage.getItem('bca_admin_places');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [newPlaceName, setNewPlaceName] = useState('');
  const [newPlaceAddr, setNewPlaceAddr] = useState('');

  useEffect(() => {
    localStorage.setItem('bca_admin_places', JSON.stringify(customPlaces));
  }, [customPlaces]);

  const handleVehicleChange = (type) => {
    setVehicleType(type);
    if (type === 'bike') setFuelEfficiency(35);
    else if (type === 'car') setFuelEfficiency(12);
    else if (type === 'cycle') setFuelEfficiency(0);
    else if (type === 'ride_hailing') setFuelEfficiency(0);
  };

  const handleLogout = () => setUserRole('user');

  const handleAddCustomPlace = (e) => {
    e.preventDefault();
    if (!newPlaceName || !newPlaceAddr) return alert('Please enter both Name and Address.');
    const cityCoords = CITIES[selectedCity];
    const newEntry = {
      id: `admin_custom_${Date.now()}`,
      name: newPlaceName,
      address: newPlaceAddr,
      lat: cityCoords.lat + (Math.random() - 0.5) * 0.04,
      lng: cityCoords.lng + (Math.random() - 0.5) * 0.04,
      category: activeCategory.id,
      isCustom: true
    };
    setCustomPlaces([...customPlaces, newEntry]);
    setNewPlaceName('');
    setNewPlaceAddr('');
  };

  const handleDeleteCustomPlace = (id) => {
    setCustomPlaces(customPlaces.filter(p => p.id !== id));
    setPlaces(places.filter(p => p.id !== id));
  };

  const handleCityChange = (e) => {
    const cityName = e.target.value;
    setSelectedCity(cityName);
    setUserLocation(null); 
    setLocationStatus('Use Current GPS');
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
        setLocationStatus('GPS Active');
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

  const fetchPlaces = async () => {
    setIsSearching(true);
    resetSearchState();
    setHasSearched(true);
    const origin = userLocation || [CITIES[selectedCity].lat, CITIES[selectedCity].lng];
    setMapCenter(origin);

    try {
      const adminPlaces = customPlaces.filter(p => p.category === activeCategory.id);
      const radius = 10000; 
      const tagQueries = activeCategory.tags.map(tag => `node[${tag}](around:${radius},${origin[0]},${origin[1]});`).join('');
      const overpassQuery = `[out:json][timeout:20];(${tagQueries});out 30;`; 

      const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`);
      const data = await response.json();

      let realPlaces = [];
      if (data && data.elements) {
        realPlaces = data.elements.map(el => ({
          id: `osm_${el.id}`,
          name: el.tags?.name || `Local ${activeCategory.label.slice(0, -1)}`,
          address: el.tags?.['addr:street'] || el.tags?.['addr:full'] || `${selectedCity} Regional Area`,
          lat: el.lat,
          lng: el.lon
        }));
      }

      let finalResults = [...adminPlaces, ...realPlaces];
      
      if (finalResults.length === 0) {
        finalResults = [
          { 
            id: 'fallback_1', 
            name: `Central ${selectedCity} ${activeCategory.label}`, 
            address: `${selectedCity} Main Boulevard`, 
            lat: origin[0] + 0.008, 
            lng: origin[1] + 0.008 
          },
          { 
            id: 'fallback_2', 
            name: `Metro ${activeCategory.label.slice(0, -1)} Hub`, 
            address: `${selectedCity} Downtown Sector`, 
            lat: origin[0] - 0.009, 
            lng: origin[1] + 0.012 
          },
          { 
            id: 'fallback_3', 
            name: `Express ${activeCategory.label.slice(0, -1)} Station`, 
            address: `${selectedCity} Ring Road`, 
            lat: origin[0] + 0.015, 
            lng: origin[1] - 0.005 
          }
        ];
      }

      setPlaces(finalResults);
    } catch (error) {
      console.error('API Error:', error);
      setPlaces([
        { id: 'err_1', name: `Primary ${activeCategory.label}`, address: `${selectedCity} Sector A`, lat: origin[0] + 0.005, lng: origin[1] + 0.005 },
        { id: 'err_2', name: `Secondary ${activeCategory.label}`, address: `${selectedCity} Sector B`, lat: origin[0] - 0.005, lng: origin[1] - 0.005 }
      ]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPlace = (place) => {
    setSelectedPlaceForTransit(place);
    setShowTransitModal(true);
  };

  const handleConfirmTransitRoute = async () => {
    if (!selectedPlaceForTransit) return;
    const place = selectedPlaceForTransit;
    setActiveMarker(place);
    setShowTransitModal(false);

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
        
        let transitCost = 0;
        let transitLabel = '';

        if (vehicleType === 'bike') {
          const liters = distKm / (fuelEfficiency || 35);
          transitCost = Math.round(liters * fuelPrice);
          transitLabel = 'Personal Motorcycle Fuel';
        } else if (vehicleType === 'car') {
          const liters = distKm / (fuelEfficiency || 12);
          transitCost = Math.round(liters * fuelPrice);
          transitLabel = 'Personal Car Fuel';
        } else if (vehicleType === 'cycle') {
          transitCost = 0;
          transitLabel = 'Bicycle (Zero Fuel)';
        } else if (vehicleType === 'ride_hailing') {
          const baseRate = rideService === 'pathao' ? 60 : 70;
          const perKmRate = rideService === 'pathao' ? 35 : 45;
          transitCost = Math.round(baseRate + (distKm * perKmRate));
          transitLabel = `${rideService === 'pathao' ? 'Pathao Ride' : 'InDrive Ride'}`;
        }

        setRouteInfo({
          distance: `${distKm} km`,
          duration: `${durationMins} min`,
          travelMode: transitLabel,
          transitCost: transitCost,
          balance: budget - transitCost
        });
      }
    } catch (err) {
      console.error('OSRM Route Error:', err);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="app-header">
        <div className="brand-container" onClick={onBackToLanding} style={{ cursor: 'pointer' }}>
          <span className="brand-dot"></span>
          <h1>JourneyNavi</h1>
          <span className="badge-pro">BCA IV</span>
        </div>
        
        <div className="header-meta">
          <button className="nav-ghost-btn" onClick={onBackToLanding}>Home</button>
          <button className="nav-ghost-btn" onClick={onOpenAuthModal}>Sign In / Up</button>
          {userRole === 'admin' ? (
            <div className="admin-status-pill">
              <span className="pulsing-dot"></span>
              <span>Admin Mode</span>
              <button className="inline-exit-btn" onClick={handleLogout}>Exit</button>
            </div>
          ) : (
            <button className="admin-access-btn" onClick={onOpenAdminModal}>🛡️ Admin</button>
          )}
        </div>
      </header>

      <main className="main-content">
        <aside className="sidebar">
          <div className="sidebar-scroll-content">
            <div className="sidebar-title-block">
              <h2>{userRole === 'admin' ? 'Admin Control Panel' : 'Route Planner'}</h2>
              <p>Select location categories & compute budget-optimized trips</p>
            </div>

            {userRole === 'admin' && (
              <div className="admin-control-cluster">
                <span className="micro-label">Add Custom Location</span>
                <form onSubmit={handleAddCustomPlace} className="admin-stack">
                  <input type="text" placeholder="Location Name" className="editorial-input" value={newPlaceName} onChange={e => setNewPlaceName(e.target.value)} />
                  <input type="text" placeholder="Address / Area" className="editorial-input" value={newPlaceAddr} onChange={e => setNewPlaceAddr(e.target.value)} />
                  <button type="submit" className="admin-action-btn">Add Location</button>
                </form>
                {customPlaces.length > 0 && (
                  <div className="admin-records-list">
                    {customPlaces.map(cp => (
                      <div key={cp.id} className="record-row">
                        <span>{cp.name}</span>
                        <button type="button" onClick={() => handleDeleteCustomPlace(cp.id)}>Delete</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="control-card">
              <label>1. Starting Location</label>
              <div className="origin-row">
                <button className="gps-sync-btn" onClick={handleShareLocation}>📍 {locationStatus}</button>
                <select value={selectedCity} onChange={handleCityChange} className="editorial-select">
                  {Object.keys(CITIES).map(city => <option key={city} value={city}>{CITIES[city].name}</option>)}
                </select>
              </div>
            </div>

            <div className="control-card">
              <label>2. Select Category</label>
              <div className="taxonomy-grid">
                {CATEGORIES.map(cat => (
                  <div key={cat.id} className={`taxonomy-chip ${activeCategory.id === cat.id ? 'active' : ''}`} onClick={() => { setActiveCategory(cat); resetSearchState(); }}>
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="control-card">
              <div className="budget-top-row">
                <label>3. Total Budget (NPR)</label>
                <span className="budget-numeric">Rs. {budget.toLocaleString()}</span>
              </div>
              <input type="range" className="editorial-slider" min="500" max="20000" step="500" value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
            </div>

            {hasSearched && (
              <div className="places-stack">
                <span className="micro-label">Results ({places.length}) - Click to configure transport</span>
                {places.map((place) => (
                  <div key={place.id} className={`place-node-card ${activeMarker?.id === place.id ? 'active-node' : ''}`} onClick={() => handleSelectPlace(place)}>
                    {place.isCustom && <span className="custom-tag">Custom</span>}
                    <div className="node-title">{place.name}</div>
                    <div className="node-address">{place.address}</div>
                  </div>
                ))}
              </div>
            )}
            
            {routeInfo && activeMarker && (
              <div className="matrix-analysis-panel">
                <span className="micro-label">Active Transit Summary</span>
                <div className="matrix-title">{activeMarker.name}</div>
                <div className="matrix-mode-badge" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Mode: {routeInfo.travelMode}</div>
                <div className="matrix-metrics-row">
                  <div><span>Distance</span><strong>{routeInfo.distance}</strong></div>
                  <div><span>Duration</span><strong>{routeInfo.duration}</strong></div>
                  <div><span>Cost</span><strong>Rs. {routeInfo.transitCost.toLocaleString()}</strong></div>
                </div>
                <div className="fiscal-balance-row">
                  <span>Remaining Budget:</span>
                  <strong className={routeInfo.balance >= 0 ? 'text-positive' : 'text-negative'}>
                    Rs. {routeInfo.balance.toLocaleString()}
                  </strong>
                </div>

                <div className="ride-hailing-actions">
                  <a href="https://pathao.com" target="_blank" rel="noopener noreferrer" className="ride-btn pathao-btn">
                    🟡 Pathao
                  </a>
                  <a href="https://indrive.com" target="_blank" rel="noopener noreferrer" className="ride-btn indrive-btn">
                    🟢 InDrive
                  </a>
                </div>

                <button className="ai-trigger-sub-btn" onClick={() => setShowAiFunModal(true)}>
                  ✨ Explore Nearby Spots
                </button>
              </div>
            )}
          </div>

          <div className="sidebar-footer">
            <button className="execute-scan-btn" onClick={fetchPlaces} disabled={isSearching}>
              {isSearching ? 'Searching...' : `Search ${activeCategory.label}`}
            </button>
          </div>
        </aside>

        <section className="map-wrapper">
          <MapContainer center={mapCenter} zoom={mapZoom} zoomControl={false}>
            <MapViewController center={mapCenter} zoom={mapZoom} activePlace={activeMarker} />
            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={userLocation || [CITIES[selectedCity].lat, CITIES[selectedCity].lng]} icon={originIcon} />
            {places.map(place => (
              <Marker key={place.id} position={[place.lat, place.lng]} eventHandlers={{ click: () => handleSelectPlace(place) }}>
                <Popup>
                  <div className="map-popup-card">
                    <strong>{place.name}</strong>
                    <span>{place.address}</span>
                    <button className="popup-route-trigger" onClick={() => handleSelectPlace(place)}>Select Transit & Budget</button>
                  </div>
                </Popup>
              </Marker>
            ))}
            {routeGeometry && <Polyline positions={routeGeometry} color="#2563eb" weight={5} opacity={0.85} />}
          </MapContainer>
        </section>
      </main>

      {showTransitModal && (
        <div className="modal-backdrop" onClick={() => setShowTransitModal(false)}>
          <div className="clean-modal-card" onClick={e => e.stopPropagation()}>
            <div className="clean-modal-header">
              <div>
                <span className="clean-modal-tag">DESTINATION SELECTED</span>
                <h3>{selectedPlaceForTransit?.name}</h3>
                <p className="clean-modal-sub">{selectedPlaceForTransit?.address}</p>
              </div>
              <button className="close-x-btn" onClick={() => setShowTransitModal(false)}>&times;</button>
            </div>

            <div className="clean-modal-body">
              <label className="micro-label">Choose Transportation / Ride Hailing Service</label>
              <div className="clean-tiers-grid">
                <div className={`clean-tier-card ${vehicleType === 'bike' ? 'active-tier' : ''}`} onClick={() => handleVehicleChange('bike')}>
                  <span className="tier-icon">🏍️</span>
                  <strong>Motorbike</strong>
                  <span>Fuel Calculation</span>
                </div>
                <div className={`clean-tier-card ${vehicleType === 'car' ? 'active-tier' : ''}`} onClick={() => handleVehicleChange('car')}>
                  <span className="tier-icon">🚗</span>
                  <strong>Car</strong>
                  <span>Standard Fuel</span>
                </div>
                <div className={`clean-tier-card ${vehicleType === 'ride_hailing' ? 'active-tier' : ''}`} onClick={() => handleVehicleChange('ride_hailing')}>
                  <span className="tier-icon">📱</span>
                  <strong>Ride App</strong>
                  <span>Pathao / InDrive</span>
                </div>
              </div>

              {vehicleType === 'ride_hailing' && (
                <div className="ride-hailing-actions" style={{ marginTop: '0.75rem' }}>
                  <button type="button" className={`ride-btn pathao-btn`} style={{ opacity: rideService === 'pathao' ? 1 : 0.6 }} onClick={() => setRideService('pathao')}>🟡 Pathao</button>
                  <button type="button" className={`ride-btn indrive-btn`} style={{ opacity: rideService === 'indrive' ? 1 : 0.6 }} onClick={() => setRideService('indrive')}>🟢 InDrive</button>
                </div>
              )}

              {(vehicleType === 'bike' || vehicleType === 'car') && (
                <div className="clean-metrics-row">
                  <div>
                    <label className="micro-label">Efficiency (km/L)</label>
                    <input type="number" className="editorial-input" value={fuelEfficiency} onChange={e => setFuelEfficiency(Number(e.target.value) || 1)} />
                  </div>
                  <div>
                    <label className="micro-label">Fuel Price (NPR/L)</label>
                    <input type="number" className="editorial-input" value={fuelPrice} onChange={e => setFuelPrice(Number(e.target.value) || 170)} />
                  </div>
                </div>
              )}

              <div className="clean-summary-box">
                <div>
                  <span className="micro-label">Allocated Capital</span>
                  <h2>Rs. {budget.toLocaleString()}</h2>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="micro-label">Mode</span>
                  <strong style={{ display: 'block', color: '#2563eb', fontSize: '0.9rem' }}>{vehicleType.toUpperCase()}</strong>
                </div>
              </div>
            </div>

            <div className="clean-modal-footer">
              <button className="nav-ghost-btn" onClick={() => setShowTransitModal(false)}>Cancel</button>
              <button className="admin-submit-btn" onClick={handleConfirmTransitRoute}>Calculate Route & Budget ➔</button>
            </div>
          </div>
        </div>
      )}

      {showAiFunModal && (
        <div className="modal-backdrop" onClick={() => setShowAiFunModal(false)}>
          <div className="ai-fun-modal-container" onClick={e => e.stopPropagation()}>
            <div className="ai-modal-header">
              <div className="ai-badge-head">
                <span className="ai-sparkle-pill">Travel Recommendations</span>
                <h3>Fun Activities Near {activeMarker?.name || selectedCity}</h3>
              </div>
              <button className="close-x-btn" onClick={() => setShowAiFunModal(false)}>&times;</button>
            </div>
            <div className="ai-modal-body">
              <p className="ai-subtitle-text">Curated mini-adventures near your destination:</p>
              <div className="ai-activities-grid">
                <div className="ai-activity-card">
                  <span className="act-emoji">📸</span>
                  <div className="act-content">
                    <h4>Golden Hour Photography Walk</h4>
                    <p>Explore surrounding streets within a 500m radius.</p>
                    <span className="act-meta">⏱️ 30-45 mins • Free</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="ai-modal-footer">
              <button className="admin-submit-btn" onClick={() => setShowAiFunModal(false)}>Awesome, Let's Go!</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 