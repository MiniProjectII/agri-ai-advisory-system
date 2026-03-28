const express = require("express");
const router = express.Router();

const FarmerMemory = require("../models/FarmerMemory");
const routerAgent = require("../agents/routerAgent");
const soilAgent = require("../agents/soilAgent");
const fertilizerAgent = require("../agents/fertilizerAgent");
const diseaseAgent = require("../agents/diseaseAgent");
const weatherAgent = require("../agents/weatherAgent");
const generalAgent = require("../agents/generalAgent");

// ✅ translation service
const translateText = require("../services/translateService");


// ---------------- AUTO MEMORY LEARNING ----------------
async function updateMemoryFromQuery(farmerId, question) {
  const lower = question.toLowerCase();

  const update = {};

  if (lower.includes("rice")) update.previousCrops = ["rice"];
  if (lower.includes("cotton")) update.previousCrops = ["cotton"];
  if (lower.includes("maize")) update.previousCrops = ["maize"];

  if (lower.includes("black soil")) update.soilType = "black soil";
  if (lower.includes("red soil")) update.soilType = "red soil";

  if (lower.includes("urea")) update.fertilizerUsage = ["urea"];
  if (lower.includes("dap")) update.fertilizerUsage = ["DAP"];

  if (Object.keys(update).length > 0) {
    await FarmerMemory.findOneAndUpdate(
      { farmerId },
      { $set: update },
      { upsert: true }
    );
  }
}

// ---------------- TEST ROUTE ----------------
router.get("/test", (req, res) => {
  res.send("Agent route working");
});

// ---------------- MAIN ROUTE ----------------
router.post("/query", async (req, res) => {
  try {
    const { farmerId, question, forceAgent, language } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    // 🔥 STEP 1: auto-learn
    await updateMemoryFromQuery(farmerId, question);

    // 🔥 STEP 2: memory
    const farmerMemory = await FarmerMemory.findOne({ farmerId });

    // ✅ ALWAYS use English internally
    const finalQuestion = `Farmer Question: ${question}`;

    let selectedAgent;

    if (forceAgent) {
      const routed = routerAgent(question);
      selectedAgent = routed === "general" ? "soil" : routed;
    } else {
      selectedAgent = "general";
    }

    let response;

    if (selectedAgent === "soil") {
      response = await soilAgent(finalQuestion, farmerMemory);
    } 
    else if (selectedAgent === "fertilizer") {
      response = await fertilizerAgent(finalQuestion, farmerMemory);
    } 
    else if (selectedAgent === "disease") {
      response = await diseaseAgent(finalQuestion, farmerMemory);
    } 
    else if (selectedAgent === "weather") {
      response = await weatherAgent(finalQuestion, farmerMemory);
    } 
    else {
      response = await generalAgent(finalQuestion, farmerMemory);
    }

    // ================= CLEAN + TRANSLATE =================
    let finalAnswer = response.answer || "";

    // 🔥 CLEAN LONG / CUT TEXT
    // 🔥 Step 1: limit length slightly bigger
if (finalAnswer.length > 600) {
  finalAnswer = finalAnswer.substring(0, 600);
}

// 🔥 Step 2: split into sentences
let sentences = finalAnswer.split(".");

// 🔥 Step 3: remove last incomplete sentence
if (sentences.length > 1) {
  sentences.pop();
}

// 🔥 Step 4: join back properly
finalAnswer = sentences.join(".").trim();

// 🔥 Step 5: ensure proper ending
if (!finalAnswer.endsWith(".")) {
  finalAnswer += ".";
}

// 🔥 Step 6: remove broken numbering like "4."
finalAnswer = finalAnswer.replace(/\n?\d+\.$/, "").trim();
    // 🧪 DEBUG LOG
    console.log("Final cleaned:", finalAnswer);

    // 🌐 Translate
    if (language && language !== "English") {
      finalAnswer = await translateText(finalAnswer, language);
    }
    // =====================================================

    res.json({
      selectedAgent,
      farmerMemory,
      response: {
        ...response,
        answer: finalAnswer
      }
    });

  } catch (error) {
    console.error("Agent Query Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;