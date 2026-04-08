const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getHFAnswer(prompt) {
  const MAX_RETRIES = 3;
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const finalPrompt = prompt + "\n\nPlease ensure your answer is complete, concise, and does not cut off in the middle of a sentence.";

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent(finalPrompt);
      return result.response.text();
    } catch (error) {
      const is503 = error.message && (error.message.includes("503") || error.message.includes("overloaded") || error.message.includes("high demand"));
      
      if (is503 && attempt < MAX_RETRIES) {
        const delay = attempt * 2000; // 2s, 4s
        console.warn(`Gemini 503 (attempt ${attempt}/${MAX_RETRIES}). Retrying in ${delay/1000}s...`);
        await sleep(delay);
        continue;
      }

      console.error("Gemini ERROR:", error);
      return "The AI service is temporarily busy. Please try again in a few seconds.";
    }
  }
}

module.exports = getHFAnswer;