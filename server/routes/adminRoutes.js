const express = require("express");
const router = express.Router();
const Expert = require("../models/Expert");
const User = require("../models/User");

// Get all pending applications
router.get("/pending-experts", async (req, res) => {
  try {
    const pending = await Expert.find({ is_approved: false }).populate("user_id", "email role");
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve application
router.patch("/approve/:id", async (req, res) => {
  try {
    const expert = await Expert.findById(req.params.id);
    if (!expert) return res.status(404).json({ error: "Expert not found" });

    expert.is_approved = true;
    await expert.save();

    // If farmer, upgrade role to farmer_expert
    const user = await User.findById(expert.user_id);
    if (user && user.role === "farmer") {
      user.role = "farmer_expert";
      await user.save();
    }

    res.json({ message: "Expert approved successfully", expert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reject application
router.delete("/reject/:id", async (req, res) => {
  try {
    const expert = await Expert.findById(req.params.id);
    if (!expert) return res.status(404).json({ error: "Expert not found" });

    // Optional: if the user was ONLY an expert and not a farmer, we might want to delete the user too. 
    // But for safety, just delete the expert application.
    await Expert.findByIdAndDelete(req.params.id);
    
    res.json({ message: "Expert application rejected" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
