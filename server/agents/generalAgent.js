const getHFAnswer = require("../services/huggingfaceService");

async function generalAgent(query, farmerMemory) {
  const location = farmerMemory?.location || "unknown location";
  const soilType = farmerMemory?.soilType || "unknown soil type";
  const previousCrops = farmerMemory?.previousCrops?.length
    ? farmerMemory.previousCrops.join(", ")
    : "no previous crop history";

  const prompt = `
You are a general agricultural assistant for farmers.

Farmer details:
- Location: ${location}
- Soil Type: ${soilType}
- Previous Crops: ${previousCrops}

Question: ${query}

Answer in simple words.
Give practical farmer-friendly advice.
If the question is broad, give a helpful general agricultural answer.
Keep it short and clear.
Do not use tables.
`;

  const answer = await getHFAnswer(prompt);

  return {
    agent: "General Agent",
    answer: answer
  };
}

module.exports = generalAgent;