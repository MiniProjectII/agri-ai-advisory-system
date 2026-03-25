const mongoose = require("mongoose");

const farmerMemorySchema = new mongoose.Schema(
  {
    farmerId: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String,
      default: ""
    },
    location: {
      type: String,
      default: ""
    },
    soilType: {
      type: String,
      default: ""
    },
    previousCrops: {
      type: [String],
      default: []
    },
    pastIssues: {
      type: [String],
      default: []
    },
    fertilizerUsage: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("FarmerMemory", farmerMemorySchema);