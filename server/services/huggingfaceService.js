const { InferenceClient } = require("@huggingface/inference");

const client = new InferenceClient(process.env.HF_TOKEN);

async function getHFAnswer(prompt) {
  try {
    const response = await client.chatCompletion({
      provider: "auto",
      model: "meta-llama/Llama-3.1-8B-Instruct",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful agricultural assistant. Reply in simple plain text for farmers. Keep answers short. Do not use tables."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 180,
      temperature: 0.3
    });

    console.log("HF RAW RESPONSE:", JSON.stringify(response, null, 2));

    const text = response?.choices?.[0]?.message?.content?.trim();

    if (!text) {
      return "Sorry, I could not generate a clear answer right now. Please try asking in a simpler way.";
    }

    return text;
  } catch (error) {
    console.error("Hugging Face Error:", error);
    return "Sorry, I could not generate an AI response right now.";
  }
}

module.exports = getHFAnswer;