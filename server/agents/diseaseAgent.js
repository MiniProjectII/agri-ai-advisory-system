const getHFAnswer = require("../services/huggingfaceService");

async function diseaseAgent(query, farmerMemory) {
  const pastIssues = farmerMemory?.pastIssues?.length
    ? farmerMemory.pastIssues.join(", ")
    : "no previous crop issues";

  const previousCrops = farmerMemory?.previousCrops?.length
    ? farmerMemory.previousCrops.join(", ")
    : "no previous crop history";

  const prompt = `
You are a crop disease expert for farmers.

Previous crops: ${previousCrops}
Past crop issues: ${pastIssues}

Question: ${query}

Answer in simple words.
Explain possible disease or issue, basic treatment, and prevention.
Keep the answer short and practical.
Do not use tables.
`;

  const answer = await getHFAnswer(prompt);

  return {
    agent: "Crop Disease Agent",
    answer: answer
  };
}

module.exports = diseaseAgent;