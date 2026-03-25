const axios = require("axios");

const API_KEY = process.env.WEATHER_API_KEY;

async function getWeather(location) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${API_KEY}&units=metric`;

    const response = await axios.get(url);

    return {
      temperature: response.data.main.temp,
      humidity: response.data.main.humidity,
      weather: response.data.weather[0].description
    };

  } catch (error) {
    console.error("Weather API error:", error.message);
    return null;
  }
}

module.exports = getWeather;