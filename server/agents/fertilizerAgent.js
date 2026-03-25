const getHFAnswer = require("../services/huggingfaceService");

async function fertilizerAgent(query, farmerMemory) {
  const crop = farmerMemory?.previousCrops?.[0] || "crop";
  const soil = farmerMemory?.soilType || "soil";

  let recommendation = "";

  // 🔥 RULE-BASED LOGIC (tool)
  if (crop === "rice") {
    recommendation = "Use more nitrogen (urea) and moderate phosphorus.";
  } else if (crop === "cotton") {
    recommendation = "Use balanced NPK fertilizer (e.g., 20-20-20).";
  } else if (crop === "maize") {
    recommendation = "Use nitrogen-rich fertilizers like urea.";
  } else {
    recommendation = "Use balanced NPK fertilizer based on soil test.";
  }

  const prompt = `
You are a fertilizer expert.

Farmer crop: ${crop}
Soil: ${soil}

Base recommendation:
${recommendation}

Question: ${query}

Explain this in simple farmer-friendly way.
Keep it short.
`;

  const answer = await getHFAnswer(prompt);

  return {
    agent: "Fertilizer Agent",
    answer
  };
}

module.exports = fertilizerAgent;