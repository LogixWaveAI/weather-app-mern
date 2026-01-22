import React, { useState, useEffect } from "react";
import "../index.css";
import axios from "axios";
import WeatherDetails from "./WeatherDetails";
import ForecastCard from "./ForecastCard";
import toast from "react-hot-toast";
import Loader from "react-js-loader";
import Footer from "./Footer";
import Navbar from "./Navbar";
import Converter from "./Converter";
import Maps from "./Maps";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import micOn from "../assets/micOn.png";
import micOff from "../assets/micOff.png";
import LocationLogger from "./LocationLogger";

const TextSearch = ({ setCity }) => {
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  useEffect(() => {
    setCity(transcript);
  }, [transcript]);

  return (
    <div className="mic-container h-[50px] w-[50px]">
      {!browserSupportsSpeechRecognition ? (
        <img alt="Mic Off" src={micOff} className="p-2" />
      ) : listening ? (
        <img alt="Mic On" src={micOn} className="p-2" onClick={() => SpeechRecognition.stopListening()} />
      ) : (
        <img
          alt="Mic Off"
          src={micOff}
          className="p-2"
          onClick={() => {
            SpeechRecognition.startListening();
            resetTranscript();
          }}
        />
      )}
    </div>
  );
};

export default function Home() {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [units, setUnits] = useState("metric");
  const [showForecast, setShowForecast] = useState(false);
  const [inputType, setInputType] = useState("city");
  const [loading, setLoading] = useState(false);
  const [city, setCity] = useState("");
  const [showMap, setShowMap] = useState(false);

  const apiKey = process.env.REACT_APP_API_KEY;

  const handleInputTypeChange = (e) => {
    setInputType(e.target.value);
    if (e.target.value === "city" && showMap) setShowMap(false);
  };

  const renderTemperature = (value) => (units === "metric" ? `${value}°C` : units === "imperial" ? `${value}°F` : `${value}K`);

  const fetchWeatherData = async (loc, lat, lon) => {
    let url = loc
      ? `https://api.openweathermap.org/data/2.5/weather?q=${loc}&units=${units}&appid=${apiKey}`
      : lat && lon
      ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`
      : null;

    if (!url) throw new Error("Invalid location");

    try {
      const res = await axios.get(url);
      toast.success("Search Successful");
      return {
        descp: res.data.weather[0].description,
        temp: res.data.main.temp,
        city: res.data.name,
        humidity: res.data.main.humidity,
        wind: res.data.wind.speed,
        feel: res.data.main.feels_like,
        condition: res.data.weather[0].main,
      };
    } catch (error) {
      toast.error("Error while fetching data from API");
      console.error(error);
      throw error;
    }
  };

  const fetchForecastData = async (loc, lat, lon) => {
    let forecastURL = loc
      ? `https://api.openweathermap.org/data/2.5/forecast?q=${loc}&units=${units}&appid=${apiKey}`
      : lat && lon
      ? `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`
      : null;

    if (!forecastURL) throw new Error("Invalid location");

    try {
      const forecastRes = await axios.get(forecastURL);
      const forecastData = forecastRes.data.list.map((item) => ({
        date: item.dt,
        temperature: item.main.temp,
        description: item.weather[0].description,
        humidity: item.main.humidity,
        wind: item.wind.speed,
      }));
      return forecastData;
    } catch (error) {
      toast.error("Error while fetching forecast data");
      console.error(error);
      throw error;
    }
  };

  const apiCall = async (e) => {
    e.preventDefault();
    setLoading(true);
    let loc = "";
    let lat = "";
    let lon = "";

    if (inputType === "city") loc = city;
    else if (inputType === "coordinates") {
      lat = e.target.elements.lat.value;
      lon = e.target.elements.lon.value;
      if (!lat || !lon) {
        toast.error("Please enter valid latitude and longitude");
        setLoading(false);
        return;
      }
    }

    try {
      const [newWeatherData, forecastData] = await Promise.all([fetchWeatherData(loc, lat, lon), fetchForecastData(loc, lat, lon)]);
      setWeather(newWeatherData);
      setForecast(forecastData);
    } catch (error) {
      setWeather(null);
      setForecast([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleForecast = () => setShowForecast(!showForecast);

  const updateWeatherData = async (selectedUnit = units) => {
    if (!weather || !weather.city) return;
    try {
      const [newWeatherData, forecastData] = await Promise.all([
        fetchWeatherData(weather.city, null, null),
        fetchForecastData(weather.city, null, null),
      ]);
      setWeather(newWeatherData);
      setForecast(forecastData);
      setUnits(selectedUnit);
    } catch {}
  };

  const handleUnitChange = (selectedUnit) => updateWeatherData(selectedUnit);

  return (
    <div className="app">
      <Navbar />
      <div className="search">
        <LocationLogger />
        <form onSubmit={apiCall} className="flex flex-col md:flex-row items-center md:items-center lg:pl-9">
          <select onChange={handleInputTypeChange} className="dropdown-menu mx-auto sm:mx-0 mt-4" value={inputType}>
            <option value="city">Enter City</option>
            <option value="coordinates">Enter Latitude and Longitude</option>
          </select>

          {inputType === "city" ? (
            <div className="city-input flex flex-col md:flex-row items-center gap-4 justify-between w-full lg:ml-4 flex-1">
              <input
                type="text"
                placeholder="Enter your city"
                name="loc"
                className="border-none outline-none flex-1"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <TextSearch setCity={setCity} />
            </div>
          ) : (
            <>
              <input type="text" placeholder="Enter latitude" name="lat" className="m-2 lg:w-1/4 w-max" />
              <input type="text" placeholder="Enter longitude" name="lon" className="m-2 lg:w-1/4 w-max" />
              <button type="button" className="m-4 px-12 py-2.5 md:py-1.8 mt-4 transition-all ease-in duration-75 bg-gradient-to-r from-purple-950 via-purple-900 to-purple-800 rounded-full hover:scale-105 font-bold" onClick={() => setShowMap(!showMap)}>
                {showMap ? "Hide Map" : "Show Map"}
              </button>
            </>
          )}

          <div>
            <button type="submit" className="m-4 px-12 py-2.5 md:py-1.8 mt-4 transition-all ease-in duration-75 bg-gradient-to-r from-purple-950 via-purple-900 to-purple-800 rounded-full hover:scale-105 font-bold">
              Get Weather
            </button>

            <button type="button" className="m-3 px-11 py-2.5 mt-4 transition-all ease-in duration-75 bg-gradient-to-r from-purple-950 via-purple-900 to-purple-800 rounded-full hover:scale-105 font-bold ml-4" onClick={toggleForecast}>
              {showForecast ? "Hide Forecast" : "Show Forecast"}
            </button>
          </div>
        </form>

        {showMap && <Maps />}

        {loading ? (
          <div className="loader-container">
            <Loader type="bubble-top" bgColor={"#6709AB"} size={80} />
          </div>
        ) : (
          weather && <WeatherDetails units={units} handleUnitChange={handleUnitChange} weather={weather} renderTemperature={renderTemperature} />
        )}

        {showForecast && (
          <div className="forecast-row place-items-center place-self-center">
            {forecast.map((day) => (
              <ForecastCard
                key={day.date}
                date={new Date(day.date * 1000).toDateString()}
                temperature={day.temperature}
                description={day.description}
                humidity={day.humidity}
                wind={day.wind}
                units={units}
              />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
