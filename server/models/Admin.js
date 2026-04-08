const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true } // Storing plain or hashed, we'll just check straight for simplicity in this demo based on prior code
});

module.exports = mongoose.model("Admin", AdminSchema);
