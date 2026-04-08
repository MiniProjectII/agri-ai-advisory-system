const mongoose = require("mongoose");

const CallRecordSchema = new mongoose.Schema({
  farmer_id: { type: String, required: true },
  expert_id: { type: String, required: true },
  calls_made: { type: Number, default: 0 }
});

module.exports = mongoose.model("CallRecord", CallRecordSchema);
