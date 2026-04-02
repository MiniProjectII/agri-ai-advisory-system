const mongoose = require("mongoose");

const AnswerSchema = new mongoose.Schema({
  post_id: String,
  expert_id: String,
  answer_text: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Answer", AnswerSchema);