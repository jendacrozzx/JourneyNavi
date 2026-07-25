export const VEHICLE_PROFILES = {
  Bike: { defaultMileage: 40, fuelType: 'Petrol', baseCostPerKm: 2.5 },
  Car: { defaultMileage: 15, fuelType: 'Petrol', baseCostPerKm: 6.5 },
  SUV: { defaultMileage: 10, fuelType: 'Diesel', baseCostPerKm: 9.5 },
  EV: { defaultMileage: 6, fuelType: 'Electricity', baseCostPerKm: 1.8 }
};

export function calculateFuelMetrics(distanceKm, vehicleType, customMileage, fuelPrice) {
  const profile = VEHICLE_PROFILES[vehicleType] || VEHICLE_PROFILES.Car;
  const mileage = customMileage || profile.defaultMileage;
  
  const fuelRequiredLiters = distanceKm / (mileage > 0 ? mileage : 1);
  const fuelCost = Math.round(fuelRequiredLiters * (fuelPrice || 105));
  
  return {
    fuelRequired: fuelRequiredLiters.toFixed(2),
    fuelCost,
    fuelType: profile.fuelType
  };
}