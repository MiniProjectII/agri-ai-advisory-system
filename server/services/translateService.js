const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function translateText(text, targetLang) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Translate the following text into ${targetLang}. Preserve the original meaning exactly. Do not include any extra conversational text or markdown formatting. 
    
Text to translate:
${text}`;

    const result = await model.generateContent(prompt);
    let translated = result.response.text();
    return translated.trim();

  } catch (error) {
    console.error("Translation error:", error);
    return text + " [Translation Error: " + error.message + "]";
  }
}

module.exports = translateText;