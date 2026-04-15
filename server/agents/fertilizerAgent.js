const getHFAnswer = require("../services/geminiService");

async function fertilizerAgent(query, farmerMemory) {
  const crop = farmerMemory?.previousCrops?.[0] || "crop";
  const soil = farmerMemory?.soilType || "soil";

  let recommendation = "";

  // 🔥 RULE-BASED LOGIC
  if (crop === "rice") {
    recommendation = "Use more nitrogen (urea) and moderate phosphorus.";
  } else if (crop === "cotton") {
    recommendation = "Use balanced NPK fertilizer (e.g., 20-20-20).";
  } else if (crop === "maize") {
    recommendation = "Use nitrogen-rich fertilizers like urea.";
  } else {
    recommendation = "Use balanced NPK fertilizer based on soil test.";
  }

  // ================= IMPROVED PROMPT =================
  const prompt = `
${query}

You are a fertilizer expert helping farmers.

Farmer Details:
- Crop: ${crop}
- Soil: ${soil}

Base Recommendation:
${recommendation}

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
    agent: "Fertilizer Agent",
    answer
  };
}

module.exports = fertilizerAgent;