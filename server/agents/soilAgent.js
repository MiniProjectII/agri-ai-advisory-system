const getHFAnswer = require("../services/huggingfaceService");

async function soilAgent(query, farmerMemory) {
  const location = farmerMemory?.location || "unknown location";
  const soilType = farmerMemory?.soilType || "unknown soil type";
  const previousCrops = farmerMemory?.previousCrops?.length
    ? farmerMemory.previousCrops.join(", ")
    : "no previous crop history";

  // 🔥 RULE-BASED LOGIC (tool-based intelligence)
  let soilAdvice = "";

  if (soilType.toLowerCase().includes("black")) {
    soilAdvice = "Black soil retains moisture well and is ideal for crops like cotton and maize.";
  } 
  else if (soilType.toLowerCase().includes("red")) {
    soilAdvice = "Red soil has low nutrients and needs fertilizers and proper irrigation.";
  } 
  else if (soilType.toLowerCase().includes("sandy")) {
    soilAdvice = "Sandy soil drains quickly, so frequent irrigation and organic matter are needed.";
  } 
  else if (soilType.toLowerCase().includes("clay")) {
    soilAdvice = "Clay soil holds water well but needs proper drainage to avoid waterlogging.";
  } 
  else {
    soilAdvice = "Maintain soil health using organic manure and proper nutrient management.";
  }

  // 🔥 AI explanation (human-friendly output)
  const prompt = `
You are a Soil Expert Agent for farmers.

Farmer details:
- Location: ${location}
- Soil Type: ${soilType}
- Previous Crops: ${previousCrops}

Base soil advice:
${soilAdvice}

Farmer question:
${query}

Explain this in simple farmer-friendly language.
Give practical steps.
Keep it short and clear.
`;

  const answer = await getHFAnswer(prompt);

  return {
    agent: "Soil Agent",
    answer: answer
  };
}

module.exports = soilAgent;