const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Expert = require("../models/Expert");
const Admin = require("../models/Admin");

router.post("/register", async (req, res) => {
  const { name, email, password, role, proofOfExpertise, location, soilType } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  const user = new User({
    name,
    email,
    password: hashed,
    role
  });

  await user.save();

  // 🔥 LINK USER → EXPERT
  if (role === "expert") {
    const expert = new Expert({
      user_id: user._id,   // 🔥 MUST MATCH
      name: name,
      specialization: "General",
      experience_years: 1,
      languages: ["English"],
      location: location || "India",
      rating: 0,
      total_ratings: 0,
      is_approved: false,
      proof_of_expertise: proofOfExpertise || ""
    });

    await expert.save();

    console.log("✅ Expert created:", expert);
  }

  // 🔥 LINK USER → FARMER MEMORY
  if (role === "farmer") {
    const FarmerMemory = require("../models/FarmerMemory");
    const mem = new FarmerMemory({
      farmerId: user._id,
      name: name,
      location: location || "",
      soilType: soilType || "",
      previousCrops: [],
      pastIssues: [],
      fertilizerUsage: []
    });
    await mem.save();
    console.log("✅ FarmerMemory created");
  }

  res.send("User registered");
});
// FARMER -> EXPERT APPLICATION
router.post("/apply-expert", async (req, res) => {
  try {
    const { user_id, name, specialization, proofOfExpertise } = req.body;
    
    // Check if already applied
    const existing = await Expert.findOne({ user_id });
    if (existing) {
      return res.status(400).json({ message: "You already have an expert profile or pending application." });
    }

    const expert = new Expert({
      user_id,
      name,
      specialization: specialization || "General",
      experience_years: 1,
      languages: ["English"],
      location: "India",
      rating: 0,
      total_ratings: 0,
      is_approved: false,
      proof_of_expertise: proofOfExpertise || ""
    });

    await expert.save();
    res.json({ message: "Application submitted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login request:", email, password); // debug

    // 👉 DATABASE ADMIN LOGIC
    const adminUser = await Admin.findOne({ email });
    if (adminUser) {
      if (adminUser.password === password) {
        const token = jwt.sign({ id: adminUser._id, role: "admin" }, "secretkey");
        return res.json({ token, user: { name: adminUser.name, email: adminUser.email, role: "admin" } });
      } else {
        return res.status(400).json({ message: "Wrong admin password" });
      }
    }

    const user = await User.findOne({ email });

    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User found:", user.email);

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log("Wrong password");
      return res.status(400).json({ message: "Wrong password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      "secretkey"
    );

    console.log("Login success");

    let expertData = null;
    if (user.role === "expert" || user.role === "farmer_expert") {
      expertData = await Expert.findOne({ user_id: user._id });
    }

    res.json({ token, user, expertData });

  } catch (err) {
    console.log("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;