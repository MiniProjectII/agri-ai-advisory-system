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

  // ================= IMPROVED PROMPT =================
  const prompt = `
${query}

You are a weather expert helping farmers.

Farmer Location: ${location}

${weatherInfo}

Instructions:
- Answer in English only
- Give exactly 4-5 short steps
- Each step should be 1 line only
- Keep answer under 120 words
- Do not give long paragraphs
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