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
    Kathmandu: { lat: 27.6966, lng: 85.3591, name: "Tribhuvan International Airport (KTM)" },
    Pokhara: { lat: 28.1887, lng: 84.0134, name: "Pokhara Regional International Airport (PKR)" },
    Chitwan: { lat: 27.6833, lng: 84.3333, name: "Bharatpur Airport (BHR)" },
    Lumbini: { lat: 27.5056, lng: 83.4167, name: "Gautam Buddha International Airport (BWA)" }
  }), []);

  const categories = useMemo(() => ([
    { id: 'lodging', label: '🏨 Stays & Hotels', query: 'hotel' },
    { id: 'gas', label: '⛽ Gas Stations', query: 'petrol pump' },
    { id: 'ev', label: '⚡ EV Chargers', query: 'charging station' },
    { id: 'restaurant', label: '🍽️ Food & Dining', query: 'restaurant' },
    { id: 'attraction', label: '🌄 Attractions', query: 'attraction' }
  ]), []);

  const [selectedCity, setSelectedCity] = useState('Kathmandu');
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [totalBudget, setTotalBudget] = useState(15000);
  
  const [vehicleType, setVehicleType] = useState('Car');
  const [mileage, setMileage] = useState(15);
  const [fuelPrice, setFuelPrice] = useState(105);
  const [travelMode, setTravelMode] = useState('Car');

  const [places, setPlaces] = useState([]);
  const [mapCenter, setMapCenter] = useState([cities.Kathmandu.lat, cities.Kathmandu.lng]);
  const [zoomLevel, setZoomLevel] = useState(13);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Share My Location');

  const [selectedPlace, setSelectedPlace] = useState(null);
  const [tripPlan, setTripPlan] = useState(null);

  const handleCityChange = useCallback((cityName) => {
    setSelectedCity(cityName);
    setUserLocation(null); 
    setLocationStatus('Share My Location');
    
    const newCenter = [cities[cityName].lat, cities[cityName].lng];
    setMapCenter(newCenter);
    setZoomLevel(13);

    setHasSearched(false);
    setPlaces([]);
    setSelectedPlace(null);
    setTripPlan(null);
  }, [cities]);

  const handleShareLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLocationStatus('Locating...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = [position.coords.latitude, position.coords.longitude];
        setUserLocation(pos);
        setMapCenter(pos);
        setZoomLevel(14);
        setLocationStatus('Location Shared ✓');
      },
      () => {
        setLocationStatus('Permission Denied');
        alert('Unable to retrieve your location.');
      }
    );
  }, []);

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

  return (
    <div className="dashboard-container">
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
      </main>
    </div>
  );
}

export default App;