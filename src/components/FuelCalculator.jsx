import React, { memo } from 'react';
import { VEHICLE_PROFILES } from '../utils/fuel';

export const FuelCalculator = memo(({ vehicleType, setVehicleType, mileage, setMileage, fuelPrice, setFuelPrice }) => {
  return (
    <div className="control-group fuel-calculator-card">
      <label>🚗 Vehicle & Fuel Profile</label>
      <div className="fuel-grid">
        <div>
          <span className="sub-label">Type</span>
          <select 
            value={vehicleType} 
            onChange={(e) => {
              const vt = e.target.value;
              setVehicleType(vt);
              setMileage(VEHICLE_PROFILES[vt].defaultMileage);
            }}
          >
            {Object.keys(VEHICLE_PROFILES).map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <span className="sub-label">Mileage (km/L or km/kWh)</span>
          <input 
            type="number" 
            value={mileage} 
            onChange={(e) => setMileage(Number(e.target.value))}
            min="1"
            max="100"
          />
        </div>
        <div className="full-width">
          <span className="sub-label">Fuel/Power Rate (₹ per unit)</span>
          <input 
            type="number" 
            value={fuelPrice} 
            onChange={(e) => setFuelPrice(Number(e.target.value))}
            min="10"
            max="300"
          />
        </div>
      </div>
    </div>
  );
});