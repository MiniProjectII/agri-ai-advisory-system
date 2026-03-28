import { useState } from "react";
import axios from "axios";
import "../styles/Chatbot.css";

export default function Chatbot() {
  const [question, setQuestion] = useState("");
  const [lastQuestion, setLastQuestion] = useState("");

  const [showForm, setShowForm] = useState(true);
  const [language, setLanguage] = useState("English");

  const [farmerDetails, setFarmerDetails] = useState({
    name: "",
    location: "",
    soilType: "",
    ph: ""
  });

  const [messages, setMessages] = useState([]);

  // -------------------- HANDLE INPUT --------------------
  const handleInputChange = (e) => {
    setFarmerDetails({
      ...farmerDetails,
      [e.target.name]: e.target.value
    });
  };

  // -------------------- SAVE FARMER DETAILS --------------------
  const saveFarmerDetails = async () => {
    try {
      await axios.post("http://localhost:5000/memory/save", {
        farmerId: "farmer1",
        ...farmerDetails,
        preferred_language: language   // ✅ added
      });

      setShowForm(false);

      setMessages([
        {
          sender: "bot",
          agent: "General Agent",
          text: `Hello ${farmerDetails.name || "farmer"}! Ask your farming questions.`
        }
      ]);

    } catch (error) {
      console.error(error);
      alert("Error saving farmer details");
    }
  };

  // -------------------- SEND QUESTION --------------------
  const sendQuestion = async () => {
    if (!question.trim()) return;

    const userMessage = {
      sender: "user",
      text: question
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await axios.post("http://localhost:5000/agent/query", {
        farmerId: "farmer1",
        question: question,
        language: language   // ✅ added
      });

      const botMessage = {
        sender: "bot",
        agent: response.data.response.agent,
        text: response.data.response.answer
      };

      setMessages((prev) => [
        ...prev,
        botMessage,
        {
          sender: "bot",
          type: "feedback",
          text: "Are you satisfied with this answer?"
        }
      ]);

      setLastQuestion(question);
      setQuestion("");

    } catch (error) {
      console.error(error);
      alert("Server error");
    }
  };

  // -------------------- FEEDBACK --------------------
  const handleFeedback = async (type) => {
    if (type === "yes") {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Glad I could help! 😊" }
      ]);
    } else {
      try {
        const response = await axios.post("http://localhost:5000/agent/query", {
          farmerId: "farmer1",
          question: lastQuestion,
          forceAgent: true,
          language: language   // ✅ added
        });

        const agentMap = {
          soil: "Soil Agent",
          fertilizer: "Fertilizer Agent",
          disease: "Crop Disease Agent",
          weather: "Weather Agent"
        };

        const selected = response.data.selectedAgent;

        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: `🔄 Redirecting to ${agentMap[selected] || "Specialist Agent"}...`
          }
        ]);

        setTimeout(() => {
          const botMessage = {
            sender: "bot",
            agent: response.data.response.agent,
            text: response.data.response.answer
          };

          setMessages((prev) => [...prev, botMessage]);
        }, 800);

      } catch (error) {
        console.error(error);
        alert("Error redirecting to agent");
      }
    }
  };

  // -------------------- ENTER KEY --------------------
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      sendQuestion();
    }
  };

  // ==================== UI ====================

  // ----------- FORM UI -----------
  if (showForm) {
    return (
      <div className="chat-container">
        <h2 className="chat-title">Enter Farmer Details</h2>

        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
          
          {/* ✅ Language Selector */}
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="English">English</option>
            <option value="Telugu">Telugu</option>
            <option value="Hindi">Hindi</option>
          </select>

          <input
            type="text"
            name="name"
            placeholder="Enter your name"
            onChange={handleInputChange}
          />

          <input
            type="text"
            name="location"
            placeholder="Enter your location (e.g., Warangal)"
            onChange={handleInputChange}
          />

          <input
            type="text"
            name="soilType"
            placeholder="Enter soil type (e.g., black soil)"
            onChange={handleInputChange}
          />

          <input
            type="number"
            step="0.1"
            name="ph"
            placeholder="Enter soil pH (optional)"
            onChange={handleInputChange}
          />

          <button onClick={saveFarmerDetails}>
            Save & Start Chat
          </button>
        </div>
      </div>
    );
  }

  // ----------- CHAT UI -----------
  return (
    <div className="chat-container">
      <h2 className="chat-title">Farmer Multi-Agent Chatbot</h2>

      {/* ✅ Language Selector */}
      <select 
        value={language} 
        onChange={(e) => setLanguage(e.target.value)}
        style={{ marginBottom: "10px", padding: "5px" }}
      >
        <option value="English">English</option>
        <option value="Telugu">Telugu</option>
        <option value="Hindi">Hindi</option>
      </select>

      <div className="messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.sender === "user" ? "user" : "bot"}`}
          >
            {msg.sender === "bot" && msg.agent && (
              <p><strong>{msg.agent}</strong></p>
            )}

            <p>{msg.text}</p>

            {msg.type === "feedback" && (
              <div style={{ marginTop: "8px" }}>
                <button onClick={() => handleFeedback("yes")}>
                  Yes
                </button>

                <button
                  onClick={() => handleFeedback("no")}
                  style={{ marginLeft: "10px" }}
                >
                  No
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="input-area">
        <input
          type="text"
          placeholder="Ask your farming question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={sendQuestion}>Send</button>
      </div>
    </div>
  );
}