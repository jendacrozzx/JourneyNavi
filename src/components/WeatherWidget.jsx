// src/components/WeatherWidget.jsx
import React, { useState, useEffect } from 'react';

const WeatherWidget = ({ latitude = 27.71, longitude = 85.32, locationName = "Kathmandu" }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m&timezone=auto`;
        const response = await fetch(url);
        const data = await response.json();
        setWeather(data.current);
      } catch (error) {
        console.error("Error fetching weather data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [latitude, longitude]);

  if (loading) {
    return <div className="p-4 bg-white rounded-xl shadow animate-pulse">Loading weather...</div>;
  }
  
  if (!weather) {
    return <div className="p-4 bg-white rounded-xl shadow text-red-500">Failed to load weather.</div>;
  }

  return (
    <div className="p-5 bg-blue-50 rounded-xl shadow-sm border border-blue-100">
      <h3 className="text-lg font-bold text-blue-900 mb-2">Current Weather in {locationName}</h3>
      <div className="flex items-center justify-between">
        <div className="text-4xl font-extrabold text-blue-600">
          {weather.temperature_2m}°C
        </div>
        <div className="text-sm text-blue-800 text-right">
          <p className="font-semibold">Wind Speed</p>
          <p>{weather.wind_speed_10m} km/h</p>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;