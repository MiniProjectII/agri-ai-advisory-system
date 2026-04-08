const mongoose = require("mongoose");

const AnswerSchema = new mongoose.Schema({
  post_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  expert_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  answer_text: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Answer", AnswerSchema);