require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");

async function run() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    await model.generateContent("hello");
    console.log("SUCCESS");
  } catch(err) {
    fs.writeFileSync("gemini_error.txt", err.toString(), "utf8");
    console.log("Wrote error to gemini_error.txt");
  }
}
run();
