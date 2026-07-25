<<<<<<< HEAD
import React, { useState, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MapView } from './components/MapView';
import { calculateFuelMetrics } from './utils/fuel';
import { estimateServiceCost } from './utils/pricing';
import { calculateRecommendationScore } from './utils/recommendation';
import './App.css';

function App() {
  const cities = useMemo(() => ({
=======
import React, { useState, useCallback, useRef } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';
import './App.css';

const LIBRARIES = ['places', 'geometry'];

const MAP_CONTAINER_STYLE = {
  width: '100%',
  height: '100%',
};

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyCXjFIUG326SMRcdNxdHr5VgunInHYRMYc";

function App() {
  const cities = {
>>>>>>> 4392a154899d3cf18255be287fd7dd1833973bad
    Kathmandu: { lat: 27.6966, lng: 85.3591, name: "Tribhuvan International Airport (KTM)" },
    Pokhara: { lat: 28.1887, lng: 84.0134, name: "Pokhara Regional International Airport (PKR)" },
    Chitwan: { lat: 27.6833, lng: 84.3333, name: "Bharatpur Airport (BHR)" },
    Lumbini: { lat: 27.5056, lng: 83.4167, name: "Gautam Buddha International Airport (BWA)" }
<<<<<<< HEAD
  }), []);

  const categories = useMemo(() => ([
    { id: 'lodging', label: '🏨 Stays & Hotels', query: 'hotel' },
    { id: 'gas', label: '⛽ Gas Stations', query: 'petrol pump' },
    { id: 'ev', label: '⚡ EV Chargers', query: 'charging station' },
    { id: 'restaurant', label: '🍽️ Food & Dining', query: 'restaurant' },
    { id: 'attraction', label: '🌄 Attractions', query: 'attraction' }
  ]), []);
=======
  };

  const categories = [
    { id: 'lodging', label: '🏨 Stays & Hotels', query: 'hotel', type: 'lodging' },
    { id: 'gas', label: '⛽ Gas Stations', query: 'petrol pump', type: 'gas_station' },
    { id: 'hospital', label: '🏥 Hospitals & Medical', query: 'hospital', type: 'hospital' },
    { id: 'supermarket', label: '🛒 Supermarkets', query: 'supermarket', type: 'supermarket' },
    { id: 'cafe', label: '☕ Cafes & Bakeries', query: 'cafe', type: 'cafe' },
    { id: 'restaurant', label: '🍽️ Fine Dining', query: 'restaurant', type: 'restaurant' }
  ];
>>>>>>> 4392a154899d3cf18255be287fd7dd1833973bad

  const [selectedCity, setSelectedCity] = useState('Kathmandu');
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [totalBudget, setTotalBudget] = useState(15000);
  
  const [vehicleType, setVehicleType] = useState('Car');
  const [mileage, setMileage] = useState(15);
  const [fuelPrice, setFuelPrice] = useState(105);
  const [travelMode, setTravelMode] = useState('Car');

  const [places, setPlaces] = useState([]);
<<<<<<< HEAD
  const [mapCenter, setMapCenter] = useState([cities.Kathmandu.lat, cities.Kathmandu.lng]);
  const [zoomLevel, setZoomLevel] = useState(13);
=======
  const [activeMarker, setActiveMarker] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: cities.Kathmandu.lat, lng: cities.Kathmandu.lng });
>>>>>>> 4392a154899d3cf18255be287fd7dd1833973bad
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Share My Location');

<<<<<<< HEAD
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [tripPlan, setTripPlan] = useState(null);

  const handleCityChange = useCallback((cityName) => {
=======
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [selectedPlaceName, setSelectedPlaceName] = useState(null);
  const [placeDetailsCache, setPlaceDetailsCache] = useState({});

  const mapRef = useRef(null);

  const onLoad = useCallback(function callback(map) {
    setMapInstance(map);
    mapRef.current = map;
  }, []);

  const handleCityChange = (cityName) => {
>>>>>>> 4392a154899d3cf18255be287fd7dd1833973bad
    setSelectedCity(cityName);
    setUserLocation(null); 
    setLocationStatus('Share My Location');
    
<<<<<<< HEAD
    const newCenter = [cities[cityName].lat, cities[cityName].lng];
    setMapCenter(newCenter);
    setZoomLevel(13);

    setHasSearched(false);
    setPlaces([]);
    setSelectedPlace(null);
    setTripPlan(null);
  }, [cities]);

  const handleShareLocation = useCallback(() => {
=======
    const newCenter = { lat: cities[cityName].lat, lng: cities[cityName].lng };
    setMapCenter(newCenter);
    
    if (mapInstance) {
      mapInstance.panTo(newCenter);
      mapInstance.setZoom(13);
    }

    setHasSearched(false);
    setPlaces([]);
    setActiveMarker(null);
    setDirectionsResponse(null);
    setRouteInfo(null);
    setSelectedPlaceName(null);
  };

  const handleShareLocation = () => {
>>>>>>> 4392a154899d3cf18255be287fd7dd1833973bad
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLocationStatus('Locating...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
<<<<<<< HEAD
        const pos = [position.coords.latitude, position.coords.longitude];
=======
        const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
>>>>>>> 4392a154899d3cf18255be287fd7dd1833973bad
        setUserLocation(pos);
        setMapCenter(pos);
        setZoomLevel(14);
        setLocationStatus('Location Shared ✓');
<<<<<<< HEAD
=======
        if (mapInstance) {
          mapInstance.panTo(pos);
          mapInstance.setZoom(14);
        }
>>>>>>> 4392a154899d3cf18255be287fd7dd1833973bad
      },
      () => {
        setLocationStatus('Permission Denied');
        alert('Unable to retrieve your location.');
      }
    );
  }, []);

<<<<<<< HEAD
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  const selectAndRoutePlace = useCallback((place) => {
    if (!place) return;
    
    const targetLocation = [place.lat, place.lon];
    setMapCenter(targetLocation);
    setSelectedPlace(place);

    const origin = userLocation || [cities[selectedCity].lat, cities[selectedCity].lng];
    const distKm = calculateDistance(origin[0], origin[1], place.lat, place.lon);
    
    // Travel mode modifier for speed / duration calculation
    let speedMultiplier = 40; // Car avg km/h
    if (travelMode === 'Bike') speedMultiplier = 45;
    if (travelMode === 'Walking') speedMultiplier = 5;
    if (travelMode === 'Cycling') speedMultiplier = 15;

    const durationMins = Math.round((distKm / speedMultiplier) * 60);

    const fuelMetrics = calculateFuelMetrics(distKm, vehicleType, mileage, fuelPrice);
    const itemCost = place.estimatedCost;
    const foodCost = 800;
    const parkingCost = 150;
    const chargingCost = activeCategory.id === 'ev' ? 300 : 0;
    
    const totalEstimatedSpend = fuelMetrics.fuelCost + itemCost + foodCost + parkingCost + chargingCost;
    const remainingBalance = totalBudget - totalEstimatedSpend;

    setTripPlan({
      distance: `${distKm.toFixed(1)} km`,
      duration: `${durationMins} mins`,
      fuelCost: fuelMetrics.fuelCost,
      itemCost,
      foodCost,
      parkingCost,
      chargingCost,
      totalEstimatedSpend,
      remainingBalance,
      isWithinBudget: remainingBalance >= 0
    });
  }, [userLocation, cities, selectedCity, travelMode, vehicleType, mileage, fuelPrice, activeCategory, totalBudget, calculateDistance]);

  const handleSearch = useCallback(async () => {
    setIsSearching(true);
    setHasSearched(true);
    setPlaces([]);
    setSelectedPlace(null);
    setTripPlan(null);

    const searchCenter = userLocation || [cities[selectedCity].lat, cities[selectedCity].lng];
    setMapCenter(searchCenter);

    try {
      const query = `${activeCategory.query} near ${selectedCity}`;
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=25`);
      const data = await response.json();

      const formattedPlaces = data.map((item, index) => {
        const dist = calculateDistance(searchCenter[0], searchCenter[1], parseFloat(item.lat), parseFloat(item.lon));
        const rating = (3.8 + (index % 1.2)).toFixed(1);
        const estCost = estimateServiceCost(activeCategory.id, index, rating);

        const tempPlace = {
          place_id: item.place_id,
          name: item.display_name.split(',')[0],
          display_name: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          distanceValue: dist,
          distanceText: `${dist.toFixed(1)} km away`,
          rating,
          estimatedCost: estCost
        };

        const score = calculateRecommendationScore(tempPlace, totalBudget, activeCategory.id);
        return { ...tempPlace, score };
      });

      // Filter and sort intelligently by composite score and budget ceiling
      const smartFiltered = formattedPlaces.filter(place => {
        const fuelEst = calculateFuelMetrics(place.distanceValue, vehicleType, mileage, fuelPrice).fuelCost;
        const totalExpense = place.estimatedCost + fuelEst + 800 + 150;
        return totalExpense <= totalBudget;
      });

      smartFiltered.sort((a, b) => b.score - a.score);

      setPlaces(smartFiltered);
    } catch (error) {
      console.error("Error evaluating trip recommendations:", error);
    } finally {
      setIsSearching(false);
    }
  }, [userLocation, cities, selectedCity, activeCategory, totalBudget, vehicleType, mileage, fuelPrice, calculateDistance]);
=======
  const fetchPlaceDetails = (placeId) => {
    if (!mapInstance || !window.google || placeDetailsCache[placeId]) return;

    const service = new window.google.maps.places.PlacesService(mapInstance);
    service.getDetails({
      placeId: placeId,
      fields: ['name', 'formatted_phone_number', 'website', 'price_level', 'rating', 'user_ratings_total']
    }, (place, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
        setPlaceDetailsCache(prev => ({ ...prev, [placeId]: place }));
      }
    });
  };
>>>>>>> 4392a154899d3cf18255be287fd7dd1833973bad

  const getEstimatedPrice = (priceLevel) => {
    switch(priceLevel) {
      case 0: return { min: 500, max: 1500, text: '₹500 – ₹1,500' };
      case 1: return { min: 1500, max: 4000, text: '₹1,500 – ₹4,000' };
      case 2: return { min: 4000, max: 10000, text: '₹4,000 – ₹10,000' };
      case 3: return { min: 10000, max: 25000, text: '₹10,000 – ₹25,000' };
      case 4: return { min: 25000, max: 100000, text: '₹25,000+' };
      default: return { min: 2000, max: 5000, text: '₹2,000 – ₹5,000 (Est)' };
    }
  };

  const selectAndRoutePlace = (place) => {
    if (!place || !place.geometry) return;
    
    const targetLocation = place.geometry.location;
    setMapCenter(targetLocation);
    setActiveMarker(place);
    setSelectedPlaceName(place.name);
    fetchPlaceDetails(place.place_id);

    if (mapInstance) {
      mapInstance.panTo(targetLocation);
    }

    if (!window.google) return;

    setRouteInfo(null);
    const origin = userLocation || { lat: cities[selectedCity].lat, lng: cities[selectedCity].lng };

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route({
      origin: new window.google.maps.LatLng(origin.lat, origin.lng),
      destination: targetLocation,
      travelMode: window.google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      if (status === window.google.maps.DirectionsStatus.OK) {
        setDirectionsResponse(result);
        const leg = result.routes[0].legs[0];
        
        const distanceMeters = leg.distance.value;
        const fuelCostPerKm = 15; 
        const travelCost = Math.round((distanceMeters / 1000) * fuelCostPerKm);
        
        let hotelCost = 0;
        if (activeCategory.id === 'lodging') {
          const level = place.price_level !== undefined ? place.price_level : 1;
          const priceInfo = getEstimatedPrice(level);
          hotelCost = Math.round((priceInfo.min + priceInfo.max) / 2);
        }

        setRouteInfo({ 
          distance: leg.distance.text, 
          duration: leg.duration.text,
          travelCost: travelCost,
          hotelCost: hotelCost,
          totalCost: travelCost + hotelCost
        });
      } else {
        console.error("Directions failed: " + status);
      }
    });
  };

  const handleSearch = () => {
    if (!mapInstance || !window.google) return;

    setIsSearching(true);
    setHasSearched(true);
    setPlaces([]);
    setActiveMarker(null);
    setDirectionsResponse(null);
    setRouteInfo(null);
    setSelectedPlaceName(null);

    const searchCenter = userLocation || { lat: cities[selectedCity].lat, lng: cities[selectedCity].lng };
    setMapCenter(searchCenter);

    const service = new window.google.maps.places.PlacesService(mapInstance);

    const request = {
      location: new window.google.maps.LatLng(searchCenter.lat, searchCenter.lng),
      radius: 8000, 
      type: activeCategory.type || undefined, 
      keyword: activeCategory.query
    };

    service.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
        const uniquePlaces = [];
        const seenIds = new Set();
        
        for (const place of results) {
          if (place.place_id && !seenIds.has(place.place_id) && uniquePlaces.length < 20) {
            seenIds.add(place.place_id);
            uniquePlaces.push(place);
          }
        }

        const distanceService = new window.google.maps.DistanceMatrixService();
        distanceService.getDistanceMatrix({
          origins: [new window.google.maps.LatLng(searchCenter.lat, searchCenter.lng)],
          destinations: uniquePlaces.map(p => p.geometry.location),
          travelMode: window.google.maps.TravelMode.DRIVING,
          unitSystem: window.google.maps.UnitSystem.METRIC,
        }, (distResponse, distStatus) => {
          let sortedPlaces = [...uniquePlaces];

          if (distStatus === 'OK' && distResponse?.rows?.[0]?.elements) {
            const elements = distResponse.rows[0].elements;
            sortedPlaces = sortedPlaces.map((place, index) => {
              const distData = elements[index];
              return {
                ...place,
                distanceValue: distData?.status === 'OK' ? distData.distance.value : 999999,
                distanceText: distData?.status === 'OK' ? distData.distance.text : 'Nearby',
              };
            });
          }

          if (activeCategory.id === 'lodging') {
            sortedPlaces.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          } else {
            sortedPlaces.sort((a, b) => (a.distanceValue || 0) - (b.distanceValue || 0));
          }

          setPlaces(sortedPlaces);
          setIsSearching(false);
        });
      } else {
        setPlaces([]);
        setIsSearching(false);
      }
    });
  };

  const featuredPlace = places.length > 0 ? places[0] : null;
  const remainingPlaces = places.length > 1 ? places.slice(1) : [];

  return (
    <div className="dashboard-container">
<<<<<<< HEAD
      <Header selectedCity={selectedCity} totalBudget={totalBudget} />

      <main className="main-content">
        <Sidebar 
          locationStatus={locationStatus}
          handleShareLocation={handleShareLocation}
          cities={cities}
          selectedCity={selectedCity}
          handleCityChange={handleCityChange}
          categories={categories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          setHasSearched={setHasSearched}
          totalBudget={totalBudget}
          setTotalBudget={setTotalBudget}
          vehicleType={vehicleType}
          setVehicleType={setVehicleType}
          mileage={mileage}
          setMileage={setMileage}
          fuelPrice={fuelPrice}
          setFuelPrice={setFuelPrice}
          travelMode={travelMode}
          setTravelMode={setTravelMode}
          hasSearched={hasSearched}
          places={places}
          isSearching={isSearching}
          handleSearch={handleSearch}
          selectAndRoutePlace={selectAndRoutePlace}
          tripPlan={tripPlan}
          selectedPlace={selectedPlace}
        />

        <MapView 
          mapCenter={mapCenter}
          zoomLevel={zoomLevel}
          userLocation={userLocation}
          selectedCity={selectedCity}
          cities={cities}
          places={places}
          selectAndRoutePlace={selectAndRoutePlace}
          tripPlan={tripPlan}
        />
=======
      <header className="app-header">
        <h1>JourneyNavi</h1>
        <div className="user-profile">Google Maps API Edition</div>
      </header>

      <main className="main-content">
        <aside className="sidebar">
          <h2>Discover Places</h2>

          <div className="control-group">
            <label>1. LOCATION SOURCE</label>
            <button className="location-btn" onClick={handleShareLocation}>
              📍 {locationStatus}
            </button>
          </div>

          <div className="control-group">
            <label>2. CITY HUB</label>
            <select value={selectedCity} onChange={(e) => handleCityChange(e.target.value)}>
              {Object.keys(cities).map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label>3. SELECT CATEGORY</label>
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

          {hasSearched && (
            <div className="places-list">
              {places.length === 0 && !isSearching && (
                <div className="no-results">No places found for {activeCategory.label} in {selectedCity}.</div>
              )}

              {featuredPlace && (
                <div 
                  className="place-item featured-card"
                  onClick={() => selectAndRoutePlace(featuredPlace)}
                >
                  <div className="featured-badge">⭐ Top Recommendation</div>
                  <div className="place-name">{featuredPlace.name}</div>
                  <div className="place-details">{featuredPlace.vicinity || featuredPlace.formatted_address}</div>
                  <div className="badges-row">
                    {featuredPlace.distanceText && <span className="distance-badge">🚗 {featuredPlace.distanceText}</span>}
                    {featuredPlace.rating && <span className="status-badge">★ {featuredPlace.rating}</span>}
                  </div>
                  {activeCategory.id === 'lodging' && (
                    <div className="price-tag">
                      Est: {featuredPlace.price_level !== undefined ? getEstimatedPrice(featuredPlace.price_level).text : '₹2,000 – ₹5,000'}
                    </div>
                  )}
                </div>
              )}

              {remainingPlaces.map((place) => (
                <div 
                  key={place.place_id} 
                  className="place-item"
                  onClick={() => selectAndRoutePlace(place)}
                >
                  <div className="place-name">{place.name}</div>
                  <div className="place-details">{place.vicinity || place.formatted_address}</div>
                  <div className="badges-row">
                    {place.distanceText && <span className="distance-badge">🚗 {place.distanceText}</span>}
                    {place.rating && <span className="status-badge">★ {place.rating}</span>}
                  </div>
                  {activeCategory.id === 'lodging' && (
                    <div className="price-tag-small">
                      {place.price_level !== undefined ? getEstimatedPrice(place.price_level).text : '₹2,000+'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <button className="action-button" onClick={handleSearch} disabled={isSearching}>
            {isSearching ? 'Fetching Real Data...' : `Find ${activeCategory.label.split(' ').slice(1).join(' ')}`}
          </button>

          {/* ROUTE & COST INFO PANEL */}
          {routeInfo && (
            <div className="bottom-route-panel" style={{ marginTop: '15px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <h3 style={{ fontSize: '1em', marginBottom: '6px', color: '#1e293b' }}>📍 Route & Cost Info</h3>
              <div style={{ fontSize: '0.85em', color: '#475569', fontWeight: 'bold', marginBottom: '6px' }}>{selectedPlaceName}</div>
              <div style={{ fontSize: '0.9em', marginBottom: '6px' }}>🚗 {routeInfo.distance} ({routeInfo.duration})</div>
              
              <div style={{ fontSize: '0.85em', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <div>⛽ Fuel Est: ~₹{routeInfo.travelCost.toLocaleString()}</div>
                {activeCategory.id === 'lodging' && routeInfo.hotelCost > 0 && (
                  <div>🏨 Stay Est: ~₹{routeInfo.hotelCost.toLocaleString()}</div>
                )}
                <div style={{ marginTop: '4px', fontWeight: 'bold', color: '#0f172a' }}>
                  Total Est: ₹{routeInfo.totalCost.toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </aside>

        <section className="map-container-wrapper">
          <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={LIBRARIES}>
            <GoogleMap mapContainerStyle={MAP_CONTAINER_STYLE} center={mapCenter} zoom={13} onLoad={onLoad}>
              {userLocation && (
                <Marker 
                  position={userLocation} 
                  icon={{ 
                    path: window.google?.maps?.SymbolPath?.CIRCLE, 
                    scale: 9, 
                    fillColor: '#4f46e5', 
                    fillOpacity: 1, 
                    strokeColor: '#ffffff', 
                    strokeWeight: 2 
                  }} 
                />
              )}

              {!userLocation && (
                <Marker 
                  position={{ lat: cities[selectedCity].lat, lng: cities[selectedCity].lng }} 
                  icon={{ url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" }} 
                />
              )}

              {places.map(place => (
                <Marker 
                  key={place.place_id} 
                  position={place.geometry.location} 
                  onClick={() => selectAndRoutePlace(place)} 
                />
              ))}

              {directionsResponse && (
                <DirectionsRenderer 
                  directions={directionsResponse} 
                  options={{ 
                    suppressMarkers: true, 
                    polylineOptions: { strokeColor: '#4f46e5', strokeWeight: 6, strokeOpacity: 0.8 } 
                  }} 
                />
              )}

              {activeMarker && (
                <InfoWindow position={activeMarker.geometry.location} onCloseClick={() => setActiveMarker(null)}>
                  <div className="custom-infowindow" style={{ padding: '5px', maxWidth: '250px' }}>
                    <strong className="iw-title" style={{ fontSize: '1.1em', display: 'block', marginBottom: '5px' }}>{activeMarker.name}</strong>
                    <span className="iw-address" style={{ fontSize: '0.9em', color: '#555', display: 'block', marginBottom: '10px' }}>{activeMarker.vicinity || activeMarker.formatted_address}</span>
                    
                    {routeInfo && (
                      <div className="iw-route-box" style={{ background: '#f8fafc', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>🚗 {routeInfo.distance} • {routeInfo.duration}</div>
                        <div style={{ fontSize: '0.85em' }}>Total Est: <strong>₹{routeInfo.totalCost.toLocaleString()}</strong></div>
                      </div>
                    )}

                    {placeDetailsCache[activeMarker.place_id] && (
                      <div className="iw-extra-details" style={{ marginTop: '8px', fontSize: '0.9em' }}>
                        {placeDetailsCache[activeMarker.place_id].formatted_phone_number && <div style={{ marginBottom: '4px' }}>📞 {placeDetailsCache[activeMarker.place_id].formatted_phone_number}</div>}
                        {placeDetailsCache[activeMarker.place_id].website && <div><a href={placeDetailsCache[activeMarker.place_id].website} target="_blank" rel="noreferrer" style={{ color: '#4f46e5', textDecoration: 'none' }}>🌐 Visit Website</a></div>}
                      </div>
                    )}
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </LoadScript>
        </section>
>>>>>>> 4392a154899d3cf18255be287fd7dd1833973bad
      </main>
    </div>
  );
}

export default App;