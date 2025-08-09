import { React, useState, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './UserProfile.css';

const LocationSection = () => {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [marker, setMarker] = useState(null);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        setShowMap(true);

        try {
          const addressResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const addressData = await addressResponse.json();
          if (addressData.address) {
            const { city, residential, county, state, country } = addressData.address;
            setAddress(`${city || residential || county || ''}, ${state || ''}, ${country || ''}`);
          }

          await fetchWeatherData(latitude, longitude);
        } catch (err) {
          setError("Failed to fetch location details");
        }
      },
      (err) => {
        setError("Unable to retrieve your location");
        console.error(err);
      }
    );
  };

  const fetchWeatherData = async (x, y) => {
    try {
      const API_KEY = process.env.REACT_APP_OpenWeatherMap_Key;
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${x}&lon=${y}&appid=${API_KEY}&units=metric`
      );

      if (!response.ok) throw new Error('Weather data unavailable');
      const data = await response.json();
      setWeather({
        temp: data.main.temp,
        feelsLike: data.main.feels_like,
        humidity: data.main.humidity,
        wind: data.wind.speed,
        condition: data.weather[0].description,
        icon: data.weather[0].icon
      });
    } catch (err) {
      setError("Failed to fetch weather data");
      console.error(err);
    }
  };

  useEffect(() => {
    if (showMap && location) {
      const mapElement = document.getElementById('map');

      if (mapElement && mapElement._leaflet_id) {
        mapElement._leaflet_id = null;
      }

      const mapInstance = L.map('map').setView([location.lat, location.lng], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstance);

      const DefaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        iconSize: [41, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        shadowSize: [41, 41]
      });

      const greenIcon = L.icon({
        iconUrl: '/location.png',
        iconSize: [60, 60],
        iconAnchor: [30, 60],
        popupAnchor: [0, -60]
      });
      
      const markerInstance = L.marker([location.lat, location.lng], { icon: greenIcon || DefaultIcon }).addTo(mapInstance);
      setMarker(markerInstance);
    }
  }, [showMap, location]);

  useEffect(() => {
    if (marker && weather) {
      marker.bindPopup(`
        <div style="text-align:center;">
          <b>Your Location</b><br>
          ${weather.icon ? `<img src="https://openweathermap.org/img/wn/${weather.icon}.png" alt="Weather icon">` : ''}
          <div>${weather.temp ? Math.round(weather.temp) + '°C, ' + weather.condition : ''}</div>
        </div>
      `).openPopup();
    }
  }, [marker, weather]);

  const handleToggleMap = () => {
    setShowMap(false);
    setLocation(null);
    setWeather(null);
    setError(null);
  };

  return (
    <div className="location-section">
      <div className="section-header">
        <h2><i className="fas fa-map-marker-alt"></i> Location Information</h2>
        <button
          className="location-toggle"
          onClick={showMap ? handleToggleMap : getLocation}
        >
          <i className="fas fa-map"></i>
          {showMap ? "Hide Map & Weather" : "Get My Location"}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showMap && location && (
        <>
          <div className="location-text">
            <i className="fas fa-city"></i>
            {address || `Lat: ${location.lat.toFixed(4)}, Lng: ${location.lng.toFixed(4)}`}
          </div>

          <div className="map-container">
            <div id="map" style={{ height: '100%', width: '100%' }}></div>
          </div>

          {weather && (
            <div className="weather-info">
              <div className="weather-main">
                <img
                  src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                  alt="Weather icon"
                  className="weather-icon-large"
                />
                <div>
                  <div className="weather-temp-large">{Math.round(weather.temp)}°C</div>
                  <div className="weather-condition">{weather.condition}</div>
                </div>
              </div>

              <div className="weather-details">
                <div className="weather-detail">
                  <span>Feels Like</span>
                  <span>{Math.round(weather.feelsLike)}°C</span>
                </div>
                <div className="weather-detail">
                  <span>Humidity</span>
                  <span>{weather.humidity}%</span>
                </div>
                <div className="weather-detail">
                  <span>Wind</span>
                  <span>{weather.wind} m/s</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LocationSection;