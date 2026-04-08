const getHFAnswer = require("../services/geminiService");

async function diseaseAgent(query, farmerMemory) {
  const pastIssues = farmerMemory?.pastIssues?.length
    ? farmerMemory.pastIssues.join(", ")
    : "no previous crop issues";

  const previousCrops = farmerMemory?.previousCrops?.length
    ? farmerMemory.previousCrops.join(", ")
    : "no previous crop history";

  // ================= IMPROVED PROMPT =================
  const prompt = `
${query}

You are a crop disease expert helping farmers.

Farmer Details:
- Previous Crops: ${previousCrops}
- Past Crop Issues: ${pastIssues}

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
    agent: "Crop Disease Agent",
    answer: answer
  };
}

module.exports = diseaseAgent;