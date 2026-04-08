const mongoose = require("mongoose");

const ChatRequestSchema = new mongoose.Schema({
  farmer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  expert_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ChatRequest", ChatRequestSchema);
