const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const express = require("express");
const router = express.Router();
const Knowledge = require("../models/Knowledge");

// Add new knowledge manually
router.post("/add", async (req, res) => {
    try {
        const { question, keywords, answer } = req.body;

        const newEntry = new Knowledge({
            question,
            keywords,
            answer
        });

        await newEntry.save();
        res.json({ message: "Knowledge added successfully" });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Search knowledge base
router.post("/search", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    console.log("User question:", question);

    // Try database search
    const result = await Knowledge.findOne({
      question: { $regex: question, $options: "i" }
    });

    if (result) {
      console.log("Answer found in DB");

      return res.json({
        found: true,
        answer: result.answer,
        source: "database"
      });
    }

    console.log("Not found in DB → calling Gemini");

    // Gemini fallback
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash-latest"   // or "gemini-1.5-pro"
    });

    const aiResponse = await model.generateContent(question);
    const aiText = aiResponse.response.text();

    console.log("Gemini response:", aiText);

    // Save AI answer
    const newEntry = new Knowledge({
      question,
      keywords: question.toLowerCase().split(" "),
      answer: aiText,
      source: "AI"
    });

    await newEntry.save();

    res.json({
      found: false,
      answer: aiText,
      source: "AI"
    });

  } catch (error) {
    console.error("❌ SEARCH ERROR:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
});

module.exports = router;   // VERY IMPORTANT