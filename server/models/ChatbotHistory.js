const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "model"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const ChatbotHistorySchema = new mongoose.Schema({
  farmerId: { type: String, required: true, unique: true },
  messages: { type: [MessageSchema], default: [] }
});

module.exports = mongoose.model("ChatbotHistory", ChatbotHistorySchema);
