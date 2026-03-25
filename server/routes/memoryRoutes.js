const express = require("express");
const router = express.Router();
const FarmerMemory = require("../models/FarmerMemory");

// Save or update farmer memory
router.post("/save", async (req, res) => {
  try {
    const { farmerId, name, location, soilType, previousCrops, pastIssues, fertilizerUsage } = req.body;

    const memory = await FarmerMemory.findOneAndUpdate(
      { farmerId },
      {
        farmerId,
        name,
        location,
        soilType,
        previousCrops,
        pastIssues,
        fertilizerUsage
      },
      { new: true, upsert: true }
    );

    res.json({
      message: "Farmer memory saved successfully",
      memory
    });
  } catch (error) {
    console.error("Memory Save Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get farmer memory by farmerId
router.get("/:farmerId", async (req, res) => {
  try {
    const memory = await FarmerMemory.findOne({ farmerId: req.params.farmerId });

    if (!memory) {
      return res.status(404).json({ error: "Farmer memory not found" });
    }

    res.json(memory);
  } catch (error) {
    console.error("Memory Fetch Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;