const { InferenceClient } = require("@huggingface/inference");

const client = new InferenceClient(process.env.HF_TOKEN);

async function translateText(text, targetLang) {
  try {
    // 🔥 Split into lines/steps
    const lines = text.split("\n").filter(line => line.trim() !== "");

    let translatedLines = [];

    for (let line of lines) {
      const response = await client.chatCompletion({
        model: "meta-llama/Llama-3.1-8B-Instruct",
        messages: [
          {
            role: "system",
            content: `Translate this sentence into ${targetLang}. Keep meaning same.`
          },
          {
            role: "user",
            content: line
          }
        ],
        max_tokens: 150
      });

      let translated =
        response?.choices?.[0]?.message?.content || line;

      translatedLines.push(translated.trim());
    }

    // 🔥 Join back
    return translatedLines.join("\n");

  } catch (error) {
    console.error("Translation error:", error.message);
    return text;
  }
}

module.exports = translateText;