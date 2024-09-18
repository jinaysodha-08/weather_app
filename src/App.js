import React, { useState, useEffect } from 'react';
import moment from 'moment-timezone';
import Image1 from './Mode.svg';
import Image2 from './current location icon.png';
import Image3 from './sunrise-white 1sunrise.png';
import Image4 from './sunset-white 1sunset.png';
import Image5 from './pressure-white 1.svg';
import Image6 from './uv-white 1.svg';
import Image7 from './wind 1.svg';
import Image8 from './humidity 1.svg';
import axios from 'axios';
import { Helmet } from "react-helmet";

function App() {
  const [dailyForecast, setDailyForecast] = useState([]);
  const [city, setCity] = useState("New York");
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(null);
  const [location, setLocation] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [hourlyForecast, setHourlyForecast] = useState(null);
  const [darkMode, setDarkMode] = useState(true);

  const API_KEY = "2f87a722bba41ea4cf992518fd495cbe";

  const currentDate = new Date();
  const monthsOfTheYear = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const month = monthsOfTheYear[currentDate.getMonth()];
  const day = currentDate.getDate();
  const year = currentDate.getFullYear();
  const final = `${month} ${day}, ${year}`;

  const getWeatherIconUrl = (main) => {
    switch (main) {
      case "Clouds":
        return "https://cdn2.iconfinder.com/data/icons/weather-filled-outline-3/64/weather03-1024.png";
      case "Rain":
        return "https://webstockreview.net/images/flood-clipart-heavy-rain-7.png";
      case "Mist":
        return "https://cdn0.iconfinder.com/data/icons/weather-346/64/fog-weather-mist-1024.png";
      case "Haze":
        return "https://cdn1.iconfinder.com/data/icons/weather-471/128/HAZE-1024.png";
      case "Clear":
        return "https://www.iconattitude.com/icons/open_icon_library/status/png/256/weather-clear-3.png";
      case "Smoke":
        return "https://cdn3.iconfinder.com/data/icons/weather-ios-11-1/50/Smoke_Smog_Low_visibility_Apple_Flat_iOS_Weather-512.png";
      case "Fog":
        return "https://cdn3.iconfinder.com/data/icons/flat-main-weather-conditions-2/842/fog-512.png";
      case "Drizzle":
        return "https://static.vecteezy.com/system/resources/thumbnails/012/066/505/small_2x/sunny-and-rainy-day-weather-forecast-icon-meteorological-sign-3d-render-png.png";
      default:
        return null;
    }
  };

  const getRotationStyle = (degree) => ({
    transform: `rotate(${degree}deg)`,
    transformOrigin: 'center',
  });

  const fetchWeatherData = async (cityName) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric`);
      const data = await response.json();
      setWeatherData(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHourlyForecast = async (lat, lon) => {
    try {
      const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Hourly Forecast API Response:', data);

      if (data.list && Array.isArray(data.list)) {
        setHourlyForecast(data.list.slice(0, 5));
      } else {
        console.error('Invalid data format:', data);
        setHourlyForecast([]);
      }
    } catch (error) {
      console.error('Error fetching hourly forecast:', error);
      setHourlyForecast([]);
    }
  };

  const fetchDailyForecast = async (lat, lon) => {
    try {
      const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast/daily?lat=${lat}&lon=${lon}&cnt=5&appid=${API_KEY}&units=metric`);
      const data = await response.json();
      console.log('Daily Forecast API Response:', data);
      setDailyForecast(data.list);
    } catch (error) {
      console.error('Error fetching daily forecast:', error);
    }
  };

  useEffect(() => {
    if (weatherData?.coord?.lat && weatherData?.coord?.lon) {
      fetchHourlyForecast(weatherData.coord.lat, weatherData.coord.lon);
    }
  }, [weatherData]);

  useEffect(() => {
    const [navigationEntry] = performance.getEntriesByType('navigation');
    if (navigationEntry && (navigationEntry.type === 'navigate' || navigationEntry.type === 'reload')) {
      fetchWeatherData(city);
    }
  }, []);

  useEffect(() => {
    const updateTime = () => {
      if (weatherData && weatherData?.timezone) {
        const cityTimezoneOffset = weatherData?.timezone / 3600;
        const localTime = moment().utcOffset(cityTimezoneOffset).format('HH:mm');
        setCurrentTime(localTime);
      }
    };

    const intervalId = setInterval(updateTime, 1000);
    updateTime();

    return () => clearInterval(intervalId);
  }, [weatherData]);

  const handleInputChange = (event) => {
    setCity(event.target.value);
  };


  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`);
      const data = await response.json();
      setWeatherData(data);
    } catch (error) {
      setError(error.message);
    }
  };



  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
          getPlaceName(latitude, longitude);
        },
        (error) => {
          setErrorMessage('Unable to retrieve your location');
          console.error(error);
        }
      );
    } else {
      setErrorMessage('Geolocation is not supported by your browser');
    }
  };

  const getPlaceName = async (latitude, longitude) => {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;

    try {
      const response = await axios.get(url);
      console.log('Nominatim API response:', response.data);

      if (response.data && response.data.address) {
        const address = response.data.address;
        const city = address.city || address.town || address.village || address.locality || address.state;

        if (city) {
          setLocation(city);
          setCity(city);
          fetchWeatherData(city);
        } else {
          setErrorMessage('City name not found for your location');
        }
      } else {
        setErrorMessage('No place found for your location');
      }
    } catch (error) {
      console.error('Error fetching place name:', error);
      setErrorMessage('Failed to fetch place name');
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return moment(date).format('ddd, MMM D');
  };

  const formatTime = (dateText) => {
    const date = new Date(dateText);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleToggle = () => {
    setDarkMode((prevMode) => !prevMode);
  };

  const appStyles = {
    backgroundColor: darkMode ? '#1e1e1e' : '#f0f0f0',
    color: darkMode ? '#ffffff' : '#000000',
    minHeight: '100vh',
    transition: 'background-color 0.3s ease, color 0.3s ease',
  };
  return (
    <div className={`App ${darkMode ? 'dark-mode' : 'light-mode'}`} style={appStyles}>
      <div className="container">
        <Helmet>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </Helmet>
        <div className="container-zero">
          <form className='form' onSubmit={handleSubmit}>
            <div className="switch-container">
              <div className="toggle-container">
                <label className="switch">
                  <input type="checkbox" checked={darkMode} onChange={handleToggle} />
                  <span className="slider"></span>
                </label>
                <span className="label-text">{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
              </div>
            </div>
            <div className="search-container">
              <input
                type="text"
                className={`search-input ${darkMode ? 'search-input-dark' : 'search-input-light'}`}
                placeholder="Search for your preferred city"
                onChange={(event) => setCity(event.target.value)}

              />
              {/* <button type='submit'>Search</button> */}
            </div>
          </form>
          <div>
            <button className="location-button" onClick={handleGetLocation}>
              <span className="iicon"><img src={Image2} alt="Location Icon" /></span>
              Current Location
            </button>
            {errorMessage && <p>{errorMessage}</p>}
          </div>
        </div>
        {weatherData && (
          <>
            <div className="container-main1">
              <div className="container-one">
                <h1 className='city-name'>{location || weatherData?.name}</h1>
                <h2 className='cti'>{currentTime}</h2>
                <h4 className='container-date'>{final}</h4>
              </div>
              <div className="container-two">
                <div className="weater-data">
                  <div className="onef">
                    <h2 className="temp">{weatherData?.main?.temp}°C</h2>
                    <h2 className="temp-feel">Feels like: {weatherData.main?.feels_like}°C</h2>
                  </div>
                  <div className="sun">
                    <img
                      className="container-img"
                      src={getWeatherIconUrl(weatherData.weather?.[0]?.main)}
                      width="200px"
                      alt="Weather Icon"
                    />
                    <div className="description">{weatherData.weather?.[0]?.main}</div>
                  </div>
                  <div className="sunrise-sunset">
                    <div className="sunrise">
                      <img className="bicons" src={Image3} alt="Sunrise" />
                      <div className='sun2'>
                        <span className='ginfoo' id='sp'>Sunrise</span>
                        <span className='ginfo'>{formatTime(weatherData.sys?.sunrise)}</span>
                      </div>
                    </div>
                    <div className="sunset">
                      <img className="bicons" src={Image4} alt="Sunset" />
                      <div className='sun2'>
                        <span className='ginfoo' id='sp'>Sunset</span>
                        <span className='ginfo'>{formatTime(weatherData.sys?.sunset)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="extra-data">
                  <div className="humidity">
                    <img className="bicons" src={Image8} alt="Humidity Icon" />
                    <span>{weatherData.main?.humidity}</span>
                    <span>Humidity</span>
                  </div>
                  <div className="wind">
                    <img className="bicons" src={Image7} alt="Wind Icon" />
                    <span>{weatherData?.wind?.speed}km/h</span>
                    <span>Wind Speed</span>
                  </div>
                  <div className="row2">
                    <div className="pressure">
                      <img className="bicons" src={Image5} alt="Pressure Icon" />
                      <span>{weatherData.main?.pressure}</span>
                      <span>Pressure</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className='container-main2'>
              <div className='container-four'>
                <h1>Hourly Forecast</h1>
                <div className='fours'>
                  {hourlyForecast && hourlyForecast.length > 0 ? (
                    hourlyForecast.map((forecast, index) => (
                      <div className="weather-card" key={index}>
                        <div className="time">{formatTime(forecast.dt_txt)}</div>
                        <div className="icon">

                          {forecast.dt_txt.includes('06:00') ? (
                            <span>🌅</span>
                          ) : forecast.dt_txt.includes('09:00') || forecast.dt_txt.includes('12:00') ? (
                            <span>☀️</span>
                          ) : forecast.dt_txt.includes('15:00') ? (
                            <span>🌞</span>
                          ) : forecast.dt_txt.includes('18:00') ? (
                            <span>🌤️</span>
                          ) : (forecast.dt_txt.includes('21:00') || forecast.dt_txt.includes('00:00')) ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="12" r="10" fill="#0000FF" />
                              <circle className='back' cx="15" cy="9" r="7" fill="#333" />
                            </svg>
                          ) : null}
                        </div>
                        <div className="temperature">{Math.round(forecast.main.temp)}°C</div>
                        <div className='swind'>
                          <div className="wind">
                            <svg className='svgs' width="48" height="48" style={getRotationStyle(forecast.wind.deg)} viewBox="0 0 48 48">
                              <polygon points="24,8 36,32 12,32" fill="#5ac8fa" />
                            </svg>
                          </div>
                          <div className="wind-speed">{Math.round(forecast.wind.speed)} km/h</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>No hourly forecast data available</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div >
  );
}

export default App;
