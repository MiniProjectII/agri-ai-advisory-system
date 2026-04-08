const express = require("express");
const router = express.Router();
const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

router.post("/predict", async (req, res) => {
    try {
        const response = await axios.post(
            "http://127.0.0.1:5001/predict",
            req.body
        );

        res.json(response.data);

    } catch (error) {
        res.status(500).json({
            error: "ML Service not responding"
        });
    }
});

router.post("/friendly", async (req, res) => {
  try {
    const { location, season, soilType, waterDistance, cropHistory } = req.body;
    
    const prompt = `You are an expert Indian agriculturist and data scientist.
A farmer has provided the following simple details about their land instead of precise NPK and pH values.
- Location: ${location}
- Upcoming Season: ${season}
- Soil Type Observed: ${soilType}
- Water Source Distance: ${waterDistance}
- Crop History (Last year): ${cropHistory}

Based on typical weather for that location, standard NPK properties of that soil type, the water availability, and crop rotation best practices (considering what they grew last year), tell me the SINGLE BEST crop to grow next.

Respond ONLY with the name of the crop (e.g., "Cotton" or "Rice" or "Chickpea"). No extra text, no markdown.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const MAX_RETRIES = 3;
    let recommended_crop = "Unknown";

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        recommended_crop = result.response.text().trim();
        // Clean up punctuation if any
        recommended_crop = recommended_crop.replace(/[^a-zA-Z\s]/g, "");
        break;
      } catch (error) {
        const is503 = error.message && (error.message.includes("503") || error.message.includes("overloaded") || error.message.includes("high demand"));
        if (is503 && attempt < MAX_RETRIES) {
          const delay = attempt * 2000;
          await sleep(delay);
          continue;
        }
        res.status(500).json({ error: "Failed to generate crop recommendation" });
        return;
      }
    }

    res.json({ recommended_crop });
  } catch (error) {
    console.error("Friendly Crop AI Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;