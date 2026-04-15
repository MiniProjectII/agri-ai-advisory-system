const express = require("express");
const router = express.Router();

const FarmerMemory = require("../models/FarmerMemory");
const ChatbotHistory = require("../models/ChatbotHistory");
const routerAgent = require("../agents/routerAgent");
const soilAgent = require("../agents/soilAgent");
const fertilizerAgent = require("../agents/fertilizerAgent");
const diseaseAgent = require("../agents/diseaseAgent");
const weatherAgent = require("../agents/weatherAgent");
const generalAgent = require("../agents/generalAgent");

// ✅ translation service
const translateText = require("../services/translateService");
const searchReddit = require("../services/redditService");
const getWeather = require("../services/weatherService");


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

    // 🔥 STEP 2: memory and history
    const farmerMemory = await FarmerMemory.findOne({ farmerId });
    
    // Load and format history
    let historyDoc = await ChatbotHistory.findOne({ farmerId });
    let historyContext = "";
    if (historyDoc && historyDoc.messages && historyDoc.messages.length > 0) {
      const recentHistory = historyDoc.messages.slice(-2); // Keep last 2 messages for smaller token footprint
      historyContext = "\n\nPast Conversation History:\n" + recentHistory.map(m => `${m.role === 'user' ? 'Farmer' : 'AI'}: ${m.content}`).join("\n");
    }

    // ✅ ALWAYS use English internally
    const finalQuestion = `Farmer Question: ${question}${historyContext}`;

    let selectedAgent;
    let augmentedQuestion = finalQuestion;
    
    // 🔥 STEP 3: Get weather for all queries
    let weatherInfo = "Weather unknown.";
    if (farmerMemory?.location) {
      const wData = await getWeather(farmerMemory.location);
      if (wData) {
        weatherInfo = `Temperature: ${wData.temperature}°C, ${wData.weather}`;
      }
    }

    if (forceAgent) {
      const routed = routerAgent(question);
      selectedAgent = routed === "general" ? "soil" : routed;
      
      // Aggregating Expert Context
      console.log(`Virtual Expert Engaged: Fetching Reddit & Weather for ${selectedAgent}...`);
      const redditData = await searchReddit(question);

      augmentedQuestion = `
      ${finalQuestion}
      
      INSTRUCTIONS FOR YOU:
      You are now acting as a specialized ${selectedAgent} Expert answering a dissatisfied farmer. 
      Use the following real-world data derived from Reddit and Weather APIs to give a human-like, highly personalized suggestion. YOU MUST explicitly mention the current weather conditions (${weatherInfo}) in your reasoning so the farmer knows you are considering their local climate! Do not hallucinate data.

      Current Weather at Location: ${weatherInfo}
      
      ${redditData}
      `;
    } else {
      // Determine which expert this query maps to (for frontend display), but respond generally
      selectedAgent = routerAgent(question);
      if (selectedAgent === "general") selectedAgent = "soil";

      augmentedQuestion = `
      ${finalQuestion}
      
      Provide a general, helpful response as an AI advisor. Consider the current weather in your advice if relevant: ${weatherInfo}. Keep it brief.
      `;
    }

    let response;
    if (!forceAgent) {
      response = await generalAgent(augmentedQuestion, farmerMemory);
    } else {
      if (selectedAgent === "soil") {
        response = await soilAgent(augmentedQuestion, farmerMemory);
      } 
      else if (selectedAgent === "fertilizer") {
        response = await fertilizerAgent(augmentedQuestion, farmerMemory);
      } 
      else if (selectedAgent === "disease") {
        response = await diseaseAgent(augmentedQuestion, farmerMemory);
      } 
      else if (selectedAgent === "weather") {
        response = await weatherAgent(augmentedQuestion, farmerMemory);
      } 
      else {
        response = await generalAgent(augmentedQuestion, farmerMemory);
      }
    }

    // Routing logic is complete
    // ================= CLEAN + TRANSLATE =================
    let finalAnswer = response.answer || "";

    // 🔥 CLEAN LONG / CUT TEXT
    // 🔥 Step 1: limit length slightly bigger
if (finalAnswer.length > 2000) {
  finalAnswer = finalAnswer.substring(0, 2000);
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

    // Save to History
    if (!historyDoc) {
      historyDoc = new ChatbotHistory({ farmerId, messages: [] });
    }
    historyDoc.messages.push({ role: "user", content: question });
    historyDoc.messages.push({ role: "model", content: finalAnswer });
    await historyDoc.save();

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