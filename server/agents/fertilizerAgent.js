const getHFAnswer = require("../services/huggingfaceService");

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
    agent: "Fertilizer Agent",
    answer
  };
}

module.exports = fertilizerAgent;