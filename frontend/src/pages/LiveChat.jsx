import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";

export default function LiveChat() {
  const [searchParams] = useSearchParams();
  const farmerId = searchParams.get("farmer");
  const expertId = searchParams.get("expert");
  
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [farmerProfile, setFarmerProfile] = useState(null);
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?._id;
  const userRole = user?.role;
  const chatRef = useRef(null);
  
  const room = [farmerId, expertId].sort().join("_");

  useEffect(() => {
    if (!userId) {
      navigate("/");
      return;
    }

    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    newSocket.emit("join_room", room);

    // Fetch old history
    axios.get(`http://localhost:5000/messages/${room}`)
      .then(res => setMessages(res.data))
      .catch(err => console.error("Could not fetch messages:", err));

    // Fetch Farmer Profile if expert
    if (userRole === "expert" && farmerId) {
      axios.get(`http://localhost:5000/memory/${farmerId}`)
        .then(res => setFarmerProfile(res.data))
        .catch(err => console.error("Could not fetch farmer profile:", err));
    }

    newSocket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => newSocket.close();
  }, [room, userId, userRole, farmerId, navigate]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim() || !socket) return;
    
    const msgData = {
      room,
      sender: user._id,
      message
    };
    
    socket.emit("send_message", msgData);
    setMessages(prev => [...prev, msgData]);
    setMessage("");
  };

  return (
    <div style={{ display: "flex", gap: "20px", maxWidth: "900px", margin: "20px auto", padding: "0 20px" }}>
      <div className="glass-panel" style={{ flex: 1, display: "flex", flexDirection: "column", height: "70vh", overflow: "hidden" }}>
        <div style={{ padding: "20px", background: "rgba(0,0,0,0.2)", borderBottom: "1px solid var(--glass-border)", textAlign: "center", fontWeight: "bold", color: "var(--accent-color)" }}>
          Live Discussion Room
        </div>
        
        <div ref={chatRef} style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "15px" }}>
          {messages.map((msg, i) => {
            const isMe = msg.sender === userId;
            return (
              <div key={i} style={{ 
                alignSelf: isMe ? "flex-end" : "flex-start", 
                background: isMe ? "var(--accent-color)" : "var(--bg-secondary)", 
                color: isMe ? "white" : "var(--text-primary)",
                border: isMe ? "none" : "1px solid var(--glass-border)", 
                padding: "12px 18px", 
                borderRadius: isMe ? "20px 20px 0 20px" : "20px 20px 20px 0", 
                maxWidth: "75%",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
              }}>
                {msg.message}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", padding: "15px", borderTop: "1px solid var(--glass-border)", background: "rgba(0,0,0,0.1)" }}>
          <input 
            style={{ flex: 1 }} 
            value={message} 
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
          />
          <button onClick={sendMessage} style={{ marginLeft: "15px" }}>Send</button>
        </div>
      </div>

      {userRole === "expert" && (
        <div className="glass-panel" style={{ width: "280px", padding: "20px", height: "fit-content" }}>
          <h3 style={{ margin: "0 0 15px 0", color: "var(--accent-color)", borderBottom: "1px solid var(--glass-border)", paddingBottom: "10px" }}>
            🧑‍🌾 Farmer Profile
          </h3>
          {farmerProfile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.95em" }}>
              <p style={{ margin: 0 }}><strong>Name:</strong> {farmerProfile.name || "Unknown"}</p>
              <p style={{ margin: 0 }}><strong>Location:</strong> {farmerProfile.location || "Not set"}</p>
              <p style={{ margin: 0 }}><strong>Soil Type:</strong> {farmerProfile.soilType || "Not set"}</p>
              <p style={{ margin: 0 }}><strong>History:</strong> {farmerProfile.previousCrops?.join(", ") || "None"}</p>
            </div>
          ) : (
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9em" }}>Farmer hasn't filled profile details yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
