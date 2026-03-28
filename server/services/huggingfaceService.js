const { InferenceClient } = require("@huggingface/inference");

const client = new InferenceClient(process.env.HF_TOKEN);

async function getHFAnswer(prompt) {
  try {
    let finalAnswer = "";

    // 🔥 First response
    let response = await client.chatCompletion({
      model: "meta-llama/Llama-3.1-8B-Instruct",
      messages: [
        {
          role: "system",
          content:
            "You are an agricultural expert. Always give full answers with steps. Do not stop in the middle."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 350,
      temperature: 0.5
    });

    let text = response?.choices?.[0]?.message?.content?.trim() || "";
    finalAnswer += text;

    // 🔥 LOOP to continue if answer is incomplete
    let attempts = 0;

    while (
      text &&
      !text.endsWith(".") &&
      !text.endsWith("।") &&
      attempts < 2
    ) {
      const continueRes = await client.chatCompletion({
        model: "meta-llama/Llama-3.1-8B-Instruct",
        messages: [
          {
            role: "system",
            content: "Continue the answer fully. Complete all steps."
          },
          {
            role: "user",
            content: finalAnswer
          }
        ],
        max_tokens: 200
      });

      const moreText =
        continueRes?.choices?.[0]?.message?.content?.trim() || "";

      finalAnswer += " " + moreText;
      text = moreText;
      attempts++;
    }

    return finalAnswer;

  } catch (error) {
    console.error("HF ERROR:", error.response?.data || error.message);
    return "Error generating response";
  }
}

module.exports = getHFAnswer;