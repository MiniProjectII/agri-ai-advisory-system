const mongoose = require("mongoose");

const ExpertSchema = new mongoose.Schema({
  name: String,
  specialization: String,
  experience_years: Number,
  languages: [String],
  location: String,
  rating: {
  type: Number,
  default: 0
},
total_ratings: {
  type: Number,
  default: 0
},
  availability: {
    type: Boolean,
    default: true
  },
  profile_photo: String,
  about: String,
  is_approved: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model("Expert", ExpertSchema);