const { io } = require("socket.io-client");
const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("Connected to server from test script!");
  socket.emit("join_room", "test_room_123");
  
  socket.emit("send_message", {
    room: "test_room_123",
    sender: "test_user_id",
    message: "Test message from script!"
  });

  setTimeout(() => {
    socket.disconnect();
    console.log("Disconnected.");
    process.exit(0);
  }, 2000);
});

socket.on("connect_error", (err) => {
  console.log("Connection Error:", err.message);
  process.exit(1);
});
