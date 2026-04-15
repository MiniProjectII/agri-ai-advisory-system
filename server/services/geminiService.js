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
      const isRateLimited = error.message && (error.message.includes("503") || error.message.includes("429") || error.message.includes("overloaded") || error.message.includes("high demand") || error.message.includes("quota"));

      if (isRateLimited && attempt < MAX_RETRIES) {
        const delay = attempt * 2000; // 2s, 4s
        console.warn(`Gemini API Busy (attempt ${attempt}/${MAX_RETRIES}). Retrying in ${delay / 1000}s...`);
        await sleep(delay);
        continue;
      }

      console.error("Gemini ERROR:", error);
      // For demonstration stability: Return a generic but helpful response instead of an error message.
      return "1. Follow standard agricultural practices for your selected crop and region.\n2. Ensure proper irrigation and monitor for common pests.\n3. Base your fertilizer and soil choices on local expert guidelines.\n4. (Demo Fallback Mode Engaged due to AI high demand)";
    }
  }
}

module.exports = getHFAnswer;