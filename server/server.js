require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const knowledgeRoutes = require("./routes/knowledgeRoutes");
const cropRoutes = require("./routes/cropRoutes");
const memoryRoutes = require("./routes/memoryRoutes");
const agentRoutes = require("./routes/agentRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/agent", agentRoutes);
app.use("/memory", memoryRoutes);
app.use("/knowledge", knowledgeRoutes);
app.use("/crop", cropRoutes);

app.get("/", (req, res) => {
    res.send("Server Running...");
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log("MongoDB Error ❌", err));

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});