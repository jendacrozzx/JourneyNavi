import React, { memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default Leaflet marker icons in React
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
  tripPlan
}) => {
  return (
    <section className="map-container-wrapper">
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