const mongoose = require("mongoose");

const ExpertSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
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
  resolved_cases: {
    type: Number,
    default: 0
  },
  is_approved: {
    type: Boolean,
    default: false
  },
  proof_of_expertise: String
});

module.exports = mongoose.model("Expert", ExpertSchema);