import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Components
import WeatherWidget from './components/WeatherWidget';
import { PackingList } from './components/PackingList';

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

export default function MainPage({ 
  initialRole = 'user', 
  onBackToLanding, 
  onOpenAdminModal, 
  onOpenAuthModal, 
  currentUser, 
  onLogout 
}) {
  const [userRole, setUserRole] = useState(initialRole);
  const [selectedCity, setSelectedCity] = useState('Kathmandu');
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  
  const [places, setPlaces] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [apiError, setApiError] = useState(null); 

  const [mapCenter, setMapCenter] = useState([CITIES.Kathmandu.lat, CITIES.Kathmandu.lng]);
  const [mapZoom, setMapZoom] = useState(13);
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Use Current GPS');
  
  // Budget State
  const [budgets, setBudgets] = useState({ transport: 2000, accommodation: 5000, foodAndActivities: 3000 });
  const [vehicleType, setVehicleType] = useState('bike');
  const [rideService, setRideService] = useState('pathao');
  const [fuelEfficiency, setFuelEfficiency] = useState(35);
  const [fuelPrice, setFuelPrice] = useState(170);

  // Multi-Stop Itinerary State
  const [itinerary, setItinerary] = useState([]);
  const [stopSpend, setStopSpend] = useState({ accommodation: 0, foodAndActivities: 0 });
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);

  const [showTransitModal, setShowTransitModal] = useState(false);
  const [selectedPlaceForTransit, setSelectedPlaceForTransit] = useState(null);
  
  const [customPlaces, setCustomPlaces] = useState(() => {
    try {
      const saved = localStorage.getItem('bca_admin_places');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [savedPlaces, setSavedPlaces] = useState([]);
  const [viewingSaved, setViewingSaved] = useState(false);

  const totalBudget = useMemo(() => 
    budgets.transport + budgets.accommodation + budgets.foodAndActivities, 
  [budgets]);

  // Calculate Running Costs
  const totalSpent = useMemo(() => itinerary.reduce((acc, stop) => ({
    transport: acc.transport + (stop.info?.transitCost || 0),
    accommodation: acc.accommodation + (stop.spend?.accommodation || 0),
    foodAndActivities: acc.foodAndActivities + (stop.spend?.foodAndActivities || 0)
  }), { transport: 0, accommodation: 0, foodAndActivities: 0 }), [itinerary]);

  const listToRender = useMemo(() => 
    viewingSaved ? savedPlaces : places, 
  [viewingSaved, savedPlaces, places]);

  useEffect(() => setUserRole(initialRole), [initialRole]);
  
  useEffect(() => {
    localStorage.setItem('bca_admin_places', JSON.stringify(customPlaces));
  }, [customPlaces]);

  useEffect(() => {
    if (currentUser) {
      const userKey = `journey_saved_${currentUser.email || currentUser.id || 'user'}`;
      try {
        const saved = localStorage.getItem(userKey);
        setSavedPlaces(saved ? JSON.parse(saved) : []);
      } catch (e) {
        setSavedPlaces([]);
      }
    } else {
      setSavedPlaces([]);
      setViewingSaved(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      const userKey = `journey_saved_${currentUser.email || currentUser.id || 'user'}`;
      localStorage.setItem(userKey, JSON.stringify(savedPlaces));
    }
  }, [savedPlaces, currentUser]);

  const handleToggleSavePlace = useCallback((place, e) => {
    if (e) e.stopPropagation(); 
    if (!currentUser) return onOpenAuthModal();
    setSavedPlaces(prev => {
      const isSaved = prev.some(p => p.id === place.id);
      return isSaved ? prev.filter(p => p.id !== place.id) : [...prev, place];
    });
  }, [currentUser, onOpenAuthModal]);

  const resetSearchState = useCallback(() => {
    setHasSearched(false);
    setPlaces([]);
    setViewingSaved(false);
    setApiError(null);
  }, []);

  const fetchPlaces = async () => {
    setIsSearching(true);
    resetSearchState();
    setHasSearched(true);
    setApiError(null);

    const origin = userLocation || [CITIES[selectedCity].lat, CITIES[selectedCity].lng];
    setMapCenter(origin);

    const adminPlaces = customPlaces.filter(p => p.category === activeCategory.id);
    const radius = 10000; 
    const tagQueries = activeCategory.tags.map(tag => `node[${tag}](around:${radius},${origin[0]},${origin[1]});`).join('');
    const overpassQuery = `[out:json][timeout:15];(${tagQueries});out body 30;`; 

    let realPlaces = [];
    const apiEndpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter'
    ];

    let success = false;
    for (const endpoint of apiEndpoints) {
      try {
        const response = await fetch(`${endpoint}?data=${encodeURIComponent(overpassQuery)}`);
        if (!response.ok) continue;

        const data = await response.json();
        if (data?.elements?.length > 0) {
          realPlaces = data.elements.map(el => ({
            id: `osm_${el.id}`,
            name: el.tags?.name || `Local ${activeCategory.label.slice(0, -1)}`,
            address: el.tags?.['addr:street'] || el.tags?.['addr:full'] || `${selectedCity} Regional Area`,
            lat: el.lat,
            lng: el.lon
          }));
          success = true;
          break;
        }
      } catch (err) {
        console.warn(`Overpass mirror offline: ${endpoint}`, err);
      }
    }

    if (!success && realPlaces.length === 0) {
      setApiError("Live data temporarily unavailable. Showing cached fallbacks.");
    }

    let finalResults = [...adminPlaces, ...realPlaces];
    if (finalResults.length === 0) {
      finalResults = [
        { id: 'fallback_1', name: `Central ${selectedCity} ${activeCategory.label}`, address: `${selectedCity} Main Boulevard`, lat: origin[0] + 0.008, lng: origin[1] + 0.008 },
        { id: 'fallback_2', name: `Metro ${activeCategory.label.slice(0, -1)} Hub`, address: `${selectedCity} Downtown Sector`, lat: origin[0] - 0.009, lng: origin[1] + 0.012 },
      ];
    }
    setPlaces(finalResults);
    setIsSearching(false);
  };

  const handleSelectPlace = useCallback((place) => {
    setSelectedPlaceForTransit(place);
    setStopSpend({ accommodation: 0, foodAndActivities: 0 }); // Reset inputs for new modal
    setShowTransitModal(true);
  }, []);

  const handleConfirmTransitRoute = async () => {
    if (!selectedPlaceForTransit) return;
    const place = selectedPlaceForTransit;
    setShowTransitModal(false);

    // Determine the origin of this specific segment
    const lastStop = itinerary.length > 0 ? itinerary[itinerary.length - 1].place : null;
    const origin = lastStop ? [lastStop.lat, lastStop.lng] : (userLocation || [CITIES[selectedCity].lat, CITIES[selectedCity].lng]);
    const destination = [place.lat, place.lng];
    
    setMapCenter(destination);
    setMapZoom(15);

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.routes?.[0]) {
        const route = data.routes[0];
        const routeGeometry = route.geometry.coordinates.map(c => [c[1], c[0]]);
        const distKm = (route.distance / 1000).toFixed(1);
        const durationMins = Math.round(route.duration / 60);
        
        let transitCost = 0, transitLabel = '', extraStats = null; 

        if (vehicleType === 'bike') {
          transitCost = Math.round((distKm / (fuelEfficiency || 35)) * fuelPrice);
          transitLabel = 'Personal Motorcycle Fuel';
        } else if (vehicleType === 'car') {
          transitCost = Math.round((distKm / (fuelEfficiency || 12)) * fuelPrice);
          transitLabel = 'Personal Car Fuel';
        } else if (vehicleType === 'running') {
          transitLabel = 'Running / Walking Route';
          extraStats = `~${Math.round(distKm * 65)} kcal | ${(6.0 * distKm).toFixed(0)} min run time`;
        } else if (vehicleType === 'cycle') {
          transitLabel = 'Bicycle (Zero Fuel)';
        } else if (vehicleType === 'ride_hailing') {
          transitCost = Math.round((rideService === 'pathao' ? 60 : 70) + (distKm * (rideService === 'pathao' ? 35 : 45)));
          transitLabel = rideService === 'pathao' ? 'Pathao Ride' : 'InDrive Ride';
        }

        setItinerary(prev => [...prev, {
          id: `stop_${Date.now()}`,
          place: place,
          geometry: routeGeometry,
          spend: { ...stopSpend },
          info: {
            distance: `${distKm} km`, duration: `${durationMins} min`,
            travelMode: transitLabel, transitCost, extraStats
          }
        }]);
      }
    } catch (err) {
      console.error('OSRM Route Error:', err);
    }
  };

  const removeItineraryStop = (index) => {
    setItinerary(prev => prev.filter((_, i) => i !== index));
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
          
          {currentUser && userRole !== 'admin' && (
            <button 
              className={`nav-ghost-btn ${viewingSaved ? 'active' : ''}`} 
              onClick={() => { setViewingSaved(!viewingSaved); setHasSearched(true); }}
              style={{ fontWeight: viewingSaved ? 'bold' : 'normal', color: viewingSaved ? '#2563eb' : 'inherit' }}
            >
              ★ Saved ({savedPlaces.length})
            </button>
          )}

          {userRole === 'admin' ? (
            <div className="admin-status-pill">
              <span className="pulsing-dot"></span>
              <span>Admin Mode</span>
              <button className="inline-exit-btn" onClick={() => setUserRole('user')}>Exit</button>
            </div>
          ) : currentUser ? (
            <div className="admin-status-pill" style={{ background: '#f1f5f9', borderColor: '#cbd5e1', color: '#334155' }}>
              <span>👤 {currentUser.name || currentUser.email || 'User'}</span>
              <button className="inline-exit-btn" onClick={onLogout}>Log Out</button>
            </div>
          ) : (
            <>
              <button className="nav-ghost-btn" onClick={onOpenAuthModal}>Sign In / Up</button>
              <button className="admin-access-btn" onClick={onOpenAdminModal}>🛡️ Admin</button>
            </>
          )}
        </div>
      </header>

      <main className="main-content">
        <aside className="sidebar">
          <div className="sidebar-scroll-content">
            
            <div className="sidebar-title-block">
              <h2>{userRole === 'admin' ? 'Admin Control Panel' : 'Route Planner'}</h2>
              <p>Configure your entire trip budget and select destinations</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <WeatherWidget 
                latitude={CITIES[selectedCity].lat} 
                longitude={CITIES[selectedCity].lng} 
                locationName={CITIES[selectedCity].name} 
              />
            </div>

            <div className="control-card">
              <label style={{fontWeight: 'bold', marginBottom: '15px', display: 'block', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px'}}>
                1. Allocate Trip Capital (NPR)
              </label>
              
              {['transport', 'accommodation', 'foodAndActivities'].map(cat => (
                <div style={{marginBottom: '12px'}} key={cat}>
                  <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <span className="micro-label">{cat.charAt(0).toUpperCase() + cat.slice(1).replace(/([A-Z])/g, ' $1')}</span>
                    <span style={{fontSize: '0.85rem', fontWeight: 'bold'}}>Rs. {budgets[cat].toLocaleString()}</span>
                  </div>
                  <input type="range" className="editorial-slider" 
                    min={cat === 'transport' ? "500" : "1000"} 
                    max={cat === 'accommodation' ? "30000" : (cat === 'transport' ? "10000" : "20000")} 
                    step="500" value={budgets[cat]} 
                    onChange={(e) => setBudgets(prev => ({ ...prev, [cat]: Number(e.target.value) }))} 
                  />
                </div>
              ))}

              <div className="budget-top-row" style={{background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1'}}>
                <strong style={{color: '#334155'}}>Total Trip Budget:</strong>
                <span className="budget-numeric" style={{color: '#059669'}}>Rs. {totalBudget.toLocaleString()}</span>
              </div>
            </div>

            <div className="control-card">
              <label>2. Starting Location</label>
              <div className="origin-row">
                <button className="gps-sync-btn" onClick={() => {
                  if (!navigator.geolocation) return alert('Geolocation not supported.');
                  setLocationStatus('Locating...');
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      const coords = [pos.coords.latitude, pos.coords.longitude];
                      setUserLocation(coords); setMapCenter(coords); setMapZoom(14); setLocationStatus('GPS Active');
                    },
                    () => setLocationStatus('Permission Denied')
                  );
                }}>📍 {locationStatus}</button>
                <select value={selectedCity} onChange={(e) => {
                  setSelectedCity(e.target.value); setUserLocation(null); setLocationStatus('Use Current GPS');
                  setMapCenter([CITIES[e.target.value].lat, CITIES[e.target.value].lng]); setMapZoom(13); resetSearchState(); setItinerary([]);
                }} className="editorial-select">
                  {Object.keys(CITIES).map(city => <option key={city} value={city}>{CITIES[city].name}</option>)}
                </select>
              </div>
            </div>

            {!viewingSaved && (
              <div className="control-card">
                <label>3. Select Category</label>
                <div className="taxonomy-grid">
                  {CATEGORIES.map(cat => (
                    <div key={cat.id} className={`taxonomy-chip ${activeCategory.id === cat.id ? 'active' : ''}`} 
                      onClick={() => { setActiveCategory(cat); resetSearchState(); }}>
                      <span>{cat.icon}</span><span>{cat.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
               <PackingList />
            </div>

            {itinerary.length > 0 && (
              <div className="control-card" style={{ background: '#f8fafc', borderColor: '#93c5fd' }}>
                <label style={{ color: '#1e40af' }}>Your Itinerary ({itinerary.length} Stops)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                  {itinerary.map((stop, i) => (
                    <div key={stop.id} style={{ background: '#fff', padding: '8px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                        <span>{i + 1}. {stop.place.name}</span>
                        <button onClick={() => removeItineraryStop(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
                      </div>
                      <div style={{ color: '#64748b', marginTop: '4px' }}>
                        Drive: {stop.info.transitCost} Rs | Stay: {stop.spend.accommodation} Rs | Food: {stop.spend.foodAndActivities} Rs
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  className="admin-submit-btn" 
                  style={{ width: '100%', marginTop: '15px', background: '#10b981', color: 'white' }} 
                  onClick={() => setShowFinalizeModal(true)}
                >
                  Finalize Journey & Budget ➔
                </button>
              </div>
            )}

            {hasSearched && (
              <div className="places-stack">
                <span className="micro-label">
                  {viewingSaved ? `Your Saved Places (${savedPlaces.length})` : `Results (${places.length}) - Add to Itinerary`}
                </span>
                
                {apiError && !viewingSaved && (
                   <div style={{ padding: '10px', color: '#b91c1c', background: '#fef2f2', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '10px' }}>
                      ⚠️ {apiError}
                   </div>
                )}

                {listToRender.map((place) => {
                  const isSaved = savedPlaces.some(p => p.id === place.id);
                  return (
                    <div key={place.id} className="place-node-card" onClick={() => handleSelectPlace(place)} style={{ position: 'relative' }}>
                      {place.isCustom && <span className="custom-tag">Custom</span>}
                      <button className="save-star-btn" onClick={(e) => handleToggleSavePlace(place, e)}
                        style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: isSaved ? '#fbbf24' : '#cbd5e1' }}
                        title={isSaved ? "Remove from saved" : "Save place"}>
                        {isSaved ? '★' : '☆'}
                      </button>
                      <div className="node-title" style={{ paddingRight: '25px' }}>{place.name}</div>
                      <div className="node-address">{place.address}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="sidebar-footer">
            {!viewingSaved && (
              <button className="execute-scan-btn" onClick={fetchPlaces} disabled={isSearching}>
                {isSearching ? 'Searching...' : `Search ${activeCategory.label}`}
              </button>
            )}
          </div>
        </aside>

        <section className="map-wrapper">
          <MapContainer center={mapCenter} zoom={mapZoom} zoomControl={false}>
            <MapViewController center={mapCenter} zoom={mapZoom} />
            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={userLocation || [CITIES[selectedCity].lat, CITIES[selectedCity].lng]} icon={originIcon} />
            
            {listToRender.map(place => (
              <Marker key={`search_${place.id}`} position={[place.lat, place.lng]} eventHandlers={{ click: () => handleSelectPlace(place) }}>
                <Popup>
                  <div className="map-popup-card">
                    <strong>{place.name}</strong>
                    <span>{place.address}</span>
                    <button className="popup-route-trigger" onClick={() => handleSelectPlace(place)}>Add to Itinerary</button>
                  </div>
                </Popup>
              </Marker>
            ))}

            {itinerary.map((stop, index) => (
              <React.Fragment key={stop.id}>
                <Marker position={[stop.place.lat, stop.place.lng]}>
                  <Popup>
                    <strong>Stop {index + 1}: {stop.place.name}</strong><br/>
                    {stop.info.distance} • {stop.info.duration}
                  </Popup>
                </Marker>
                {stop.geometry && <Polyline color="#2563eb" opacity={0.85} positions={stop.geometry} weight={5} />}
              </React.Fragment>
            ))}
          </MapContainer>
        </section>
      </main>

      {showTransitModal && (
        <div className="modal-backdrop" onClick={() => setShowTransitModal(false)}>
          <div className="clean-modal-card" onClick={e => e.stopPropagation()}>
            <div className="clean-modal-header">
              <div>
                <span className="clean-modal-tag">ADD TO ITINERARY</span>
                <h3>{selectedPlaceForTransit?.name}</h3>
                <p className="clean-modal-sub">{selectedPlaceForTransit?.address}</p>
              </div>
              <button className="close-x-btn" onClick={() => setShowTransitModal(false)}>&times;</button>
            </div>
            
            <div className="clean-modal-body">
              <label className="micro-label">1. Choose Route Transport</label>
              <div className="clean-tiers-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '15px' }}>
                {['bike', 'car', 'running', 'ride_hailing'].map(type => (
                  <div key={type} className={`clean-tier-card ${vehicleType === type ? 'active-tier' : ''}`} 
                    onClick={() => {
                      setVehicleType(type);
                      if (type === 'bike') setFuelEfficiency(35);
                      else if (type === 'car') setFuelEfficiency(12);
                      else setFuelEfficiency(0);
                    }}>
                    <span className="tier-icon">{type === 'bike' ? '🏍️' : type === 'car' ? '🚗' : type === 'running' ? '👟' : '📱'}</span>
                    <strong>{type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</strong>
                  </div>
                ))}
              </div>

              <label className="micro-label">2. Estimated Spending at Stop (NPR)</label>
              <div className="clean-metrics-row" style={{ marginTop: '5px' }}>
                <div>
                  <label className="micro-label" style={{ color: '#64748b' }}>Accommodation</label>
                  <input type="number" className="editorial-input" value={stopSpend.accommodation} 
                    onChange={e => setStopSpend({...stopSpend, accommodation: Number(e.target.value) || 0})} placeholder="e.g. 1500" />
                </div>
                <div>
                  <label className="micro-label" style={{ color: '#64748b' }}>Food / Entry Fees</label>
                  <input type="number" className="editorial-input" value={stopSpend.foodAndActivities} 
                    onChange={e => setStopSpend({...stopSpend, foodAndActivities: Number(e.target.value) || 0})} placeholder="e.g. 500" />
                </div>
              </div>
            </div>

            <div className="clean-modal-footer">
              <button className="nav-ghost-btn" onClick={() => setShowTransitModal(false)}>Cancel</button>
              <button className="admin-submit-btn" onClick={handleConfirmTransitRoute}>Add to Journey ➔</button>
            </div>
          </div>
        </div>
      )}

      {showFinalizeModal && (
        <div className="modal-backdrop" onClick={() => setShowFinalizeModal(false)}>
          <div className="clean-modal-card" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="clean-modal-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
              <div>
                <span className="clean-modal-tag" style={{ background: '#10b981', color: 'white' }}>CHECKOUT SUMMARY</span>
                <h3 style={{ fontSize: '1.5rem', marginTop: '5px' }}>Journey Financial Report</h3>
              </div>
              <button className="close-x-btn" onClick={() => setShowFinalizeModal(false)}>&times;</button>
            </div>
            
            <div className="clean-modal-body" style={{ padding: '20px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <span className="micro-label">Total Allocated Capital</span>
                  <h2 style={{ color: '#1e293b', margin: '5px 0' }}>Rs. {totalBudget.toLocaleString()}</h2>
                </div>
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <span className="micro-label">Total Estimated Cost</span>
                  <h2 style={{ color: '#b91c1c', margin: '5px 0' }}>Rs. {(totalSpent.transport + totalSpent.accommodation + totalSpent.foodAndActivities).toLocaleString()}</h2>
                </div>
              </div>

              <label className="micro-label" style={{ marginBottom: '10px', display: 'block' }}>Category Breakdown</label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Transport', budget: budgets.transport, spent: totalSpent.transport },
                  { label: 'Accommodation', budget: budgets.accommodation, spent: totalSpent.accommodation },
                  { label: 'Food & Activities', budget: budgets.foodAndActivities, spent: totalSpent.foodAndActivities }
                ].map(cat => {
                  const balance = cat.budget - cat.spent;
                  return (
                    <div key={cat.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                      <strong style={{ width: '120px' }}>{cat.label}</strong>
                      <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>
                        <span style={{ color: '#64748b' }}>Budget: </span>Rs. {cat.budget}<br/>
                        <span style={{ color: '#b91c1c' }}>Spent: </span>Rs. {cat.spent}
                      </div>
                      <div style={{ width: '100px', textAlign: 'right', fontWeight: 'bold', color: balance >= 0 ? '#10b981' : '#ef4444' }}>
                        {balance >= 0 ? 'Left: ' : 'Over: '} Rs. {Math.abs(balance).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="clean-modal-footer" style={{ justifyContent: 'center', paddingTop: '20px' }}>
              <button className="admin-submit-btn" style={{ width: '100%', fontSize: '1.1rem', padding: '12px' }} onClick={() => setShowFinalizeModal(false)}>
                Confirm & Close Itinerary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}