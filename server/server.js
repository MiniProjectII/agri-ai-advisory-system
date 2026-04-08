require("dotenv").config();
const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const knowledgeRoutes = require("./routes/knowledgeRoutes");
const cropRoutes = require("./routes/cropRoutes");
const memoryRoutes = require("./routes/memoryRoutes");
const agentRoutes = require("./routes/agentRoutes");
const marketRoutes = require("./routes/marketRoutes");
const adminRoutes = require("./routes/adminRoutes");

const Post = require("./models/Post");
const Answer = require("./models/Answer");
const Expert = require("./models/Expert");
const Message = require("./models/Message");
const ChatRequest = require("./models/ChatRequest");
const CallRecord = require("./models/CallRecord");
const authRoutes = require("./routes/authRoutes");
const Admin = require("./models/Admin");

const app = express();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use("/auth", authRoutes);
app.use("/api/admin", adminRoutes);

app.use("/agent", agentRoutes);
app.use("/memory", memoryRoutes);
app.use("/knowledge", knowledgeRoutes);
app.use("/crop", cropRoutes);
app.use("/api/market", marketRoutes);

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

  // ================= WEBRTC VIDEO CALL SIGNALING =================
  socket.on("request-call", async (data) => {
    // data: { room, farmer_id, expert_id, signalData, from }
    try {
      let record = await CallRecord.findOne({ farmer_id: data.farmer_id, expert_id: data.expert_id });
      if (!record) {
        record = new CallRecord({ farmer_id: data.farmer_id, expert_id: data.expert_id, calls_made: 0 });
      }

      // If calls_made == 0 or the caller is the expert, auto-approve
      if (record.calls_made === 0 || data.role === "expert") {
        if (data.role !== "expert") {
          record.calls_made += 1;
          await record.save();
        }
        // Emitting the call to the room directly
        socket.to(data.room).emit("incoming-call", {
          room: data.room,
          farmer_id: data.farmer_id,
          expert_id: data.expert_id,
          offer: data.offer,
          audioOnly: data.audioOnly,
          role: data.role
        });
      } else {
        // Requires expert approval (emits to room, only expert UI reacts)
        socket.to(data.room).emit("call-approval-required", {
          room: data.room,
          farmer_id: data.farmer_id,
          expert_id: data.expert_id,
          offer: data.offer,
          audioOnly: data.audioOnly,
          from: data.from
        });
      }
    } catch (err) {
      console.error("WebRTC request-call error", err);
    }
  });

  socket.on("approve-call", async (data) => {
    // Expert approved the call
    try {
      const record = await CallRecord.findOne({ farmer_id: data.farmer_id, expert_id: data.expert_id });
      if (record) {
        record.calls_made += 1;
        await record.save();
      }
      socket.to(data.room).emit("incoming-call", data); // Forward the object intact so the UI processes the offer
    } catch (err) { }
  });

  socket.on("reject-call", (data) => {
    socket.to(data.room).emit("call-rejected");
  });

  socket.on("webrtc-offer", (data) => {
    socket.to(data.room).emit("webrtc-offer", data);
  });

  socket.on("webrtc-answer", (data) => {
    socket.to(data.room).emit("webrtc-answer", data.answer);
  });

  socket.on("webrtc-ice", (data) => {
    socket.to(data.room).emit("webrtc-ice", data.candidate);
  });

  socket.on("end-call", (room) => {
    socket.to(room).emit("call-ended");
  });

  // ================= DISCONNECT =================
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    delete onlineUsers[socket.id];
    io.emit("user_offline");
  });
});

// ================= APIs =================

app.get("/api/tts", async (req, res) => {
  try {
    const { text, lang = "en" } = req.query;
    if (!text) return res.status(400).send("No text provided");

    // We fetch the MP3 stream directly from Google, completely bypassing CORS
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;
    const audioRes = await axios.get(url, { responseType: 'stream' });

    res.set('Content-Type', 'audio/mpeg');
    audioRes.data.pipe(res);
  } catch (error) {
    console.error("TTS proxy error:", error.message);
    res.status(500).send("Error generating audio");
  }
});

// Phase 5: Soil Detection ML Proxy
const multer = require("multer");
const FormData = require("form-data");
const fs = require("fs");
const upload = multer({ dest: "uploads/" }); // Mock temporary upload dir

app.post("/api/detect-soil", upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image uploaded" });

  try {
    const formData = new FormData();
    formData.append("image", fs.createReadStream(req.file.path));

    const mlRes = await axios.post("http://localhost:5001/predict-soil", formData, {
      headers: formData.getHeaders()
    });

    res.json(mlRes.data);
  } catch (error) {
    console.error("ML proxy error:", error.message);
    res.status(500).json({ error: "Could not process image" });
  } finally {
    fs.unlink(req.file.path, () => { }); // clean up temporary file
  }
});

app.get("/api/agri-news", async (req, res) => {
  try {
    const subreddits = "IndiaFarmingBusiness+AgriStudentsIndia+IndianFarmers+OrganicFarming+farmingIndia+farming+agriculture";
    const url = `https://www.reddit.com/r/${subreddits}/hot.json?limit=5`;
    const redditRes = await axios.get(url, { headers: { 'User-Agent': 'AgriAIAdvisory/1.0' } });

    const posts = redditRes.data.data.children.map(child => ({
      title: child.data.title,
      url: `https://reddit.com${child.data.permalink}`,
      author: child.data.author,
      score: child.data.score
    }));
    res.json(posts);
  } catch (error) {
    console.error("News fetch error:", error);
    res.status(500).json({ error: "Could not fetch news" });
  }
});

// 👉 Daily Tip Feature
const getHFAnswer = require("./services/geminiService");
const FarmerMemory = require("./models/FarmerMemory");

app.get("/api/daily-tip/:farmerId", async (req, res) => {
  try {
    const farmerId = req.params.farmerId;
    const memory = await FarmerMemory.findOne({ farmerId });

    let cropPrompt = "You are an expert agriculture advisor. Give a short, one-sentence daily tip or suggestion for a farmer. Keep it very brief.";
    if (memory && memory.previousCrops && memory.previousCrops.length > 0) {
      cropPrompt = `You are an expert agriculture advisor. The farmer is currently growing ${memory.previousCrops.join(", ")}. Give a short, one-sentence personalized daily tip for taking care of these crops based on best farming practices.`;
    }

    const tip = await getHFAnswer(cropPrompt);
    res.json({ tip });
  } catch (err) {
    console.error("Daily tip error:", err);
    res.status(500).json({ error: "Could not fetch tip" });
  }
});


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

// SAVE REQUEST
app.post("/request-chat", async (req, res) => {
  try {
    const { farmer_id, expert_id } = req.body;
    
    // Check if an active request already exists to prevent duplication
    let existingReq = await ChatRequest.findOne({ farmer_id, expert_id });
    
    if (!existingReq) {
      console.log("Saving new request:", farmer_id, expert_id);
      existingReq = new ChatRequest({ farmer_id, expert_id });
    } else {
      console.log("Request already exists, updating timestamp.");
      existingReq.createdAt = new Date();
    }
    
    await existingReq.save();
    res.send("Request sent");
  } catch (err) {
    res.status(500).send("Error saving request");
  }
});

// GET REQUESTS
app.get("/expert-requests/:expert_id", async (req, res) => {
  try {
    const expertId = req.params.expert_id;
    // populate farmer details
    const requests = await ChatRequest.find({ expert_id: expertId }).sort({ createdAt: -1 }).populate("farmer_id", "name email").lean();

    // Attach farmer memory
    const FarmerMemory = require("./models/FarmerMemory");
    for (let reqData of requests) {
      if (reqData.farmer_id) {
        const mem = await FarmerMemory.findOne({ farmerId: reqData.farmer_id._id.toString() });
        reqData.memory = mem;
      }
    }

    res.json(requests);
  } catch (err) {
    res.status(500).send("Error fetching requests");
  }
});

// GET FARMER REQUESTS (FOR PRIVATE COMMUNITY CHATS)
app.get("/farmer-requests/:farmer_id", async (req, res) => {
  try {
    const farmerId = req.params.farmer_id;
    const requests = await ChatRequest.find({ farmer_id: farmerId }).populate("expert_id", "name specialization email");
    res.json(requests);
  } catch (err) {
    res.status(500).send("Error fetching farmer requests");
  }
});

// 👉 Register Expert
app.post("/register-expert", async (req, res) => {
  try {
    const expert = new Expert({
      ...req.body,
      is_approved: true, // ✅ FIX
      rating: 0,
      total_ratings: 0,
      resolved_cases: 0
    });

    await expert.save();

    res.send("Expert registered successfully");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error registering expert");
  }
});

// 👉 Get Expert Profile by user_id
app.get("/expert-profile/:user_id", async (req, res) => {
  try {
    const expert = await Expert.findOne({ user_id: req.params.user_id });
    if (!expert) return res.status(404).json({ error: "Expert profile not found" });
    res.json(expert);
  } catch (err) {
    res.status(500).send("Error fetching expert profile");
  }
});

// 👉 Update Expert Profile
app.put("/expert-profile/update", async (req, res) => {
  try {
    const { user_id, name, specialization, languages, location, about, experience_years } = req.body;
    const updated = await Expert.findOneAndUpdate(
      { user_id },
      { $set: { name, specialization, languages, location, about, experience_years } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Expert not found" });
    res.json({ message: "Expert profile updated", expert: updated });
  } catch (err) {
    res.status(500).send("Error updating expert profile");
  }
});

// 👉 Increment resolved_cases for an expert
app.post("/expert-resolve/:user_id", async (req, res) => {
  try {
    const updated = await Expert.findOneAndUpdate(
      { user_id: req.params.user_id },
      { $inc: { resolved_cases: 1 } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Expert not found" });
    res.json({ message: "Case resolved", resolved_cases: updated.resolved_cases });
  } catch (err) {
    res.status(500).send("Error updating resolved cases");
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
    const experts = await Expert.find({
      $or: [
        { is_approved: true },
        { is_approved: { $exists: false } },
        { is_approved: null }
      ]
    }).populate("user_id", "name email").sort({ rating: -1 });

    // Map to ensure name existence
    const mappedExperts = experts.map(exp => ({
      ...exp.toObject(),
      name: exp.name || exp.user_id?.name || "Expert Specialist"
    }));

    console.log("Experts Found:", mappedExperts.length);
    res.json(mappedExperts);
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
    }).populate("expert_id", "name email").sort({ createdAt: -1 });

    res.json(answers);
  } catch (err) {
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
    const posts = await Post.find().populate("farmer_id", "name email").sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching posts");
  }
});

// 👉 Root
app.get("/", (req, res) => {
  res.send("Server Running...");
});

// ================= DB =================
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected ✅");
    try {
      const adminCount = await Admin.countDocuments();
      if (adminCount === 0) {
        await Admin.insertMany([
          { name: "Admin One", email: "admin1@harvestmate.com", password: "admin123" },
          { name: "Admin Two", email: "admin2@harvestmate.com", password: "admin123" },
          { name: "Admin Three", email: "admin3@harvestmate.com", password: "admin123" }
        ]);
        console.log("Seeded admins successfully.");
      }
    } catch (err) {
      console.log("Error seeding admins", err);
    }
  })
  .catch(err => console.log("MongoDB Error ❌", err));

// ================= START =================
const PORT = 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});