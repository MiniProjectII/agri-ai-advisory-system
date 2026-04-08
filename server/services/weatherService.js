const axios = require("axios");

const weatherDesc = {
  0: "Clear sky",
  1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Depositing rime fog",
  51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
  61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
  71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
  95: "Thunderstorm"
};

async function getWeather(location) {
  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`;
    const geoRes = await axios.get(geoUrl);
    
    if (!geoRes.data.results || geoRes.data.results.length === 0) {
      return null;
    }

    const { latitude, longitude } = geoRes.data.results[0];

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code`;
    const weatherRes = await axios.get(weatherUrl);

    const current = weatherRes.data.current;
    return {
      temperature: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      weather: weatherDesc[current.weather_code] || "Variable"
    };

  } catch (error) {
    console.error("Weather API error:", error.message);
    return null;
  }
}

module.exports = getWeather;