const getHFAnswer = require("../services/huggingfaceService");
const getWeather = require("../services/weatherService");

async function weatherAgent(query, farmerMemory) {
  const location = farmerMemory?.location || "India";

  const weatherData = await getWeather(location);

  let weatherInfo = "";

  if (weatherData) {
    weatherInfo = `
Current Weather:
- Temperature: ${weatherData.temperature}°C
- Humidity: ${weatherData.humidity}%
- Condition: ${weatherData.weather}
`;
  } else {
    weatherInfo = "Weather data not available.";
  }

  const prompt = `
You are a weather expert for farmers.

Farmer Location: ${location}

${weatherInfo}

Question: ${query}

Give practical farming advice based on current weather.
Keep answer simple and clear.
`;

  const answer = await getHFAnswer(prompt);

  return {
    agent: "Weather Agent",
    answer
  };
}

module.exports = weatherAgent;