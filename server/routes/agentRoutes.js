const express = require("express");
const router = express.Router();

const FarmerMemory = require("../models/FarmerMemory");
const routerAgent = require("../agents/routerAgent");
const soilAgent = require("../agents/soilAgent");
const fertilizerAgent = require("../agents/fertilizerAgent");
const diseaseAgent = require("../agents/diseaseAgent");
const weatherAgent = require("../agents/weatherAgent");
const generalAgent = require("../agents/generalAgent");


// ---------------- AUTO MEMORY LEARNING ----------------
async function updateMemoryFromQuery(farmerId, question) {
  const lower = question.toLowerCase();

  const update = {};

  // crops
  if (lower.includes("rice")) update.previousCrops = ["rice"];
  if (lower.includes("cotton")) update.previousCrops = ["cotton"];
  if (lower.includes("maize")) update.previousCrops = ["maize"];

  // soil
  if (lower.includes("black soil")) update.soilType = "black soil";
  if (lower.includes("red soil")) update.soilType = "red soil";

  // fertilizers
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
    const { farmerId, question, forceAgent } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    // 🔥 STEP 1: auto-learn from query
    await updateMemoryFromQuery(farmerId, question);

    // 🔥 STEP 2: get updated memory
    const farmerMemory = await FarmerMemory.findOne({ farmerId });

    let selectedAgent;

    if (forceAgent) {
      const routed = routerAgent(question);
      selectedAgent = routed === "general" ? "soil" : routed;
    } else {
      selectedAgent = "general";
    }

    let response;

    if (selectedAgent === "soil") {
      response = await soilAgent(question, farmerMemory);
    } else if (selectedAgent === "fertilizer") {
      response = await fertilizerAgent(question, farmerMemory);
    } else if (selectedAgent === "disease") {
      response = await diseaseAgent(question, farmerMemory);
    } else if (selectedAgent === "weather") {
      response = await weatherAgent(question, farmerMemory);
    } else {
      response = await generalAgent(question, farmerMemory);
    }

    res.json({
      selectedAgent,
      farmerMemory,
      response
    });

  } catch (error) {
    console.error("Agent Query Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;