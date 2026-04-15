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
- Provide a detailed and elaborate paragraph explaining the solution thoroughly
- Be conversational and highly personalized to the farmer's situation
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