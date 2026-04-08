require("dotenv").config();
const fs = require("fs");

async function run() {
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=" + process.env.GEMINI_API_KEY);
    const data = await response.json();
    fs.writeFileSync("models.txt", JSON.stringify(data.models.map(m => m.name), null, 2), "utf8");
    console.log("Wrote models to models.txt");
  } catch(err) {
    console.log("Error:", err.message);
  }
}
run();
