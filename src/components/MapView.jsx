import React, { memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet'; // Added Polyline
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapController({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export const MapView = memo(({
  mapCenter,
  zoomLevel,
  userLocation,
  selectedCity,
  cities,
  places,
  selectAndRoutePlace,
  tripPlan // We will use this to calculate the route
}) => {

  // 1. Extract coordinates from the saved trip plan
  const routeCoordinates = (tripPlan || []).map(place => [place.lat, place.lon]);

  // 2. Calculate Total Distance in Kilometers
  let totalDistanceKm = 0;
  if (routeCoordinates.length > 1) {
    for (let i = 0; i < routeCoordinates.length - 1; i++) {
      const p1 = L.latLng(routeCoordinates[i][0], routeCoordinates[i][1]);
      const p2 = L.latLng(routeCoordinates[i + 1][0], routeCoordinates[i + 1][1]);
      totalDistanceKm += (p1.distanceTo(p2) / 1000); // distanceTo returns meters
    }
  }

  // 3. Estimate walking time based on a standard 12 min/km pace
  const walkingPaceMinPerKm = 12; 
  const totalMinutes = Math.round(totalDistanceKm * walkingPaceMinPerKm);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const timeString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <section className="map-container-wrapper" style={{ position: 'relative', width: '100%', height: '100%' }}>
      
      {/* 4. Overlay UI for Route Stats */}
      {routeCoordinates.length > 1 && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000, // Keeps it above the map tiles
          backgroundColor: 'white',
          padding: '10px 15px',
          borderRadius: '8px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          fontFamily: 'sans-serif'
        }}>
          <h4 style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#334155' }}>Route Stats</h4>
          <p style={{ margin: '2px 0', fontSize: '13px', color: '#0f172a' }}>
            <strong>Distance:</strong> {totalDistanceKm.toFixed(2)} km
          </p>
          <p style={{ margin: '2px 0', fontSize: '13px', color: '#0f172a' }}>
            <strong>Est. Walk Time:</strong> {timeString} <span style={{color: '#64748b', fontSize: '11px'}}>({walkingPaceMinPerKm} min/km pace)</span>
          </p>
        </div>
      )}

      <MapContainer 
        center={mapCenter} 
        zoom={zoomLevel} 
        style={{ width: '100%', height: '100%' }}
      >
        <MapController center={mapCenter} zoom={zoomLevel} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 5. Draw the Route Line */}
        {routeCoordinates.length > 1 && (
          <Polyline 
            positions={routeCoordinates} 
            color="#3b82f6" // Nice blue color
            weight={4} 
            opacity={0.7} 
            dashArray="10, 10" // Makes the line dashed
          />
        )}

        {userLocation && (
          <Marker position={userLocation} />
        )}

        {!userLocation && (
          <Marker position={[cities[selectedCity].lat, cities[selectedCity].lng]} />
        )}

        {places.map(place => (
          <Marker 
            key={place.place_id} 
            position={[place.lat, place.lon]} 
            eventHandlers={{
              click: () => selectAndRoutePlace(place),
            }}
          >
            <Popup>
              <div style={{ padding: '6px', maxWidth: '210px' }}>
                <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{place.name}</strong>
                <p style={{ fontSize: '0.8rem', margin: '4px 0', color: '#64748b' }}>{place.distanceText}</p>
                <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 'bold' }}>
                  Est: ₹{place.estimatedCost.toLocaleString()}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </section>
  );
});