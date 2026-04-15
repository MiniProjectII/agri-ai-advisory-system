const getHFAnswer = require("../services/geminiService");
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

  // ================= IMPROVED PROMPT =================
  const prompt = `
${query}

You are a weather expert helping farmers.

Farmer Location: ${location}

${weatherInfo}

Instructions:
- Answer in English only
- Provide a detailed and elaborate paragraph explaining the solution thoroughly
- Be conversational and highly personalized to the farmer's situation
- Complete all sentences properly

Answer:
`;
  // ===================================================

  const answer = await getHFAnswer(prompt);

  return {
    agent: "Weather Agent",
    answer
  };
}

module.exports = weatherAgent;