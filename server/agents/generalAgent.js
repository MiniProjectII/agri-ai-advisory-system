const getHFAnswer = require("../services/huggingfaceService");

async function generalAgent(query, farmerMemory) {
  const location = farmerMemory?.location || "unknown location";
  const soilType = farmerMemory?.soilType || "unknown soil type";
  const previousCrops = farmerMemory?.previousCrops?.length
    ? farmerMemory.previousCrops.join(", ")
    : "no previous crop history";

  // ================= IMPROVED PROMPT =================
  const prompt = `
${query}

You are a helpful agricultural assistant for farmers.

Farmer Details:
- Location: ${location}
- Soil Type: ${soilType}
- Previous Crops: ${previousCrops}

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
    agent: "General Agent",
    answer: answer
  };
}

module.exports = generalAgent;