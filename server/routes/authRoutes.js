const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Expert = require("../models/Expert");

router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

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
      location: "India",
      rating: 0,
      total_ratings: 0,
      is_approved: true
    });

    await expert.save();

    console.log("✅ Expert created:", expert);
  }

  res.send("User registered");
});
// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login request:", email, password); // debug

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

    res.json({ token, user });

  } catch (err) {
    console.log("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;