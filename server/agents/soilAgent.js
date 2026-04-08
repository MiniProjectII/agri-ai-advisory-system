const getHFAnswer = require("../services/geminiService");

async function soilAgent(query, farmerMemory) {
  const location = farmerMemory?.location || "unknown location";
  const soilType = farmerMemory?.soilType || "unknown soil type";
  const previousCrops = farmerMemory?.previousCrops?.length
    ? farmerMemory.previousCrops.join(", ")
    : "no previous crop history";

  // 🔥 RULE-BASED LOGIC
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

  // ================= IMPROVED PROMPT =================
  const prompt = `
${query}

You are a Soil Expert helping farmers.

Farmer Details:
- Location: ${location}
- Soil Type: ${soilType}
- Previous Crops: ${previousCrops}

Base Advice:
${soilAdvice}

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
    agent: "Soil Agent",
    answer: answer
  };
}

module.exports = soilAgent;