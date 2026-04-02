const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  farmer_id: String,
  title: String,
  description: String,
  crop_type: String,
  category: String,
  language: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Post", PostSchema);