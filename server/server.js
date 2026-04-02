require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const knowledgeRoutes = require("./routes/knowledgeRoutes");
const cropRoutes = require("./routes/cropRoutes");
const memoryRoutes = require("./routes/memoryRoutes");
const agentRoutes = require("./routes/agentRoutes");

const Post = require("./models/Post");
const Answer = require("./models/Answer");
const Expert = require("./models/Expert");
const Message = require("./models/Message");
const authRoutes = require("./routes/authRoutes");

const app = express();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use("/auth", authRoutes);

app.use("/agent", agentRoutes);
app.use("/memory", memoryRoutes);
app.use("/knowledge", knowledgeRoutes);
app.use("/crop", cropRoutes);

// ================= SERVER =================
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// 🔥 ONLINE USERS TRACKING
let onlineUsers = {};

// ================= SOCKET =================
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ✅ mark user online
  onlineUsers[socket.id] = true;
  io.emit("user_online");

  // ================= JOIN ROOM =================
  socket.on("join_room", (room) => {
    socket.join(room);
    console.log("User joined room:", room);
  });

  // ================= TYPING =================
  socket.on("typing", (room) => {
    socket.to(room).emit("show_typing");
  });

  socket.on("stop_typing", (room) => {
    socket.to(room).emit("hide_typing");
  });

  // ================= SEND MESSAGE =================
  socket.on("send_message", async (data) => {
    console.log("📩 Message received:", data);

    try {
      const msg = new Message({
        room: data.room,
        sender: data.sender,
        message: data.message
      });

      await msg.save(); // ✅ save to DB

      console.log("✅ Saved to DB:", msg);

      socket.to(data.room).emit("receive_message", data);
    } catch (err) {
      console.log("❌ Error saving:", err);
    }
  });

  // ================= DISCONNECT =================
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    delete onlineUsers[socket.id];
    io.emit("user_offline");
  });
});

// ================= APIs =================


app.post("/rate-expert", async (req, res) => {
  try {
    const { expert_id, rating } = req.body;

    const expert = await Expert.findById(expert_id);

    const total = expert.rating * expert.total_ratings;

    expert.total_ratings += 1;
    expert.rating = (total + rating) / expert.total_ratings;

    await expert.save();

    res.send("Rating updated");
  } catch (err) {
    res.status(500).send("Error rating expert");
  }
});

// 👉 Get messages
app.get("/messages/:room", async (req, res) => {
  try {
    const messages = await Message.find({
      room: req.params.room
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).send("Error fetching messages");
  }
});

let chatRequests = [];

// SAVE REQUEST
app.post("/request-chat", (req, res) => {
  const { farmer_id, expert_id } = req.body;

  console.log("Saving request:", farmer_id, expert_id);

  chatRequests.push({
    farmer_id,
    expert_id   // ✅ DO NOT CHANGE THIS
  });

  console.log("All requests:", chatRequests);

  res.send("Request sent");
});

// GET REQUESTS
app.get("/expert-requests/:expert_id", (req, res) => {
  const expertId = req.params.expert_id;

  console.log("Fetching for:", expertId);
  console.log("Stored:", chatRequests);

  const requests = chatRequests.filter(
    r => r.expert_id === expertId   // ✅ EXACT MATCH
  );

  res.json(requests);
});

// get requests
app.get("/expert-requests/:expert_id", (req, res) => {
  const expertId = req.params.expert_id;

  console.log("Requested expert_id:", req.params.expert_id);
console.log("Stored requests:", chatRequests);

  const requests = chatRequests.filter(
    r => r.expert_id === expertId
  );

  res.json(requests);
});

// 👉 Register Expert
app.post("/register-expert", async (req, res) => {
  try {
    const expert = new Expert({
      ...req.body,
      is_approved: true, // ✅ FIX
      rating: 0,
      total_ratings: 0
    });

    await expert.save();

    res.send("Expert registered successfully");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error registering expert");
  }
});

// 👉 Add Answer
app.post("/add-answer", async (req, res) => {
  try {
    const answer = new Answer(req.body);
    await answer.save();
    res.send("Answer added successfully");
  } catch {
    res.status(500).send("Error adding answer");
  }
});

// 👉 Get Experts
// 👉 Get Experts (FIXED)
app.get("/experts", async (req, res) => {
  try {
    const experts = await Expert.find().sort({ rating: -1 });

    console.log("Experts:", experts); // 🔥 debug

    res.json(experts);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching experts");
  }
});

// 👉 Recommend Experts
app.get("/recommend-experts", async (req, res) => {
  try {
    const { category, language } = req.query;

    const experts = await Expert.find({
      specialization: category,
      languages: { $in: [language] },
      is_approved: true
    }).sort({ rating: -1 });

    res.json(experts);
  } catch {
    res.status(500).send("Error recommending experts");
  }
});

// 👉 Get Answers
app.get("/answers/:post_id", async (req, res) => {
  try {
    const answers = await Answer.find({
      post_id: req.params.post_id
    }).sort({ createdAt: -1 });

    res.json(answers);
  } catch {
    res.status(500).send("Error fetching answers");
  }
});

// 👉 Create Post
app.post("/create-post", async (req, res) => {
  try {
    const newPost = new Post(req.body);
    await newPost.save();
    res.send("Post saved successfully");
  } catch {
    res.status(500).send("Error saving post");
  }
});

// 👉 Get Posts
app.get("/posts", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch {
    res.status(500).send("Error fetching posts");
  }
});

// 👉 Root
app.get("/", (req, res) => {
  res.send("Server Running...");
});

// ================= DB =================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log("MongoDB Error ❌", err));

// ================= START =================
const PORT = 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});