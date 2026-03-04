const mongoose = require("mongoose");

const knowledgeSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    keywords: {
        type: [String],   // array of keywords
        required: true
    },
    answer: {
        type: String,
        required: true
    },
    source: {
        type: String,
        default: "manual"   // manual or AI
    }
}, { timestamps: true });

module.exports = mongoose.model("Knowledge", knowledgeSchema);