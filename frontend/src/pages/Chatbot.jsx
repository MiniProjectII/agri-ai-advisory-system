import { useState } from "react";
import "../styles/Chatbot.css";
import axios from "axios";

export default function Chatbot() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);

  const sendQuestion = async () => {
    if (!question) return;

    const userMessage = { sender: "user", text: question };
    setMessages([...messages, userMessage]);

    try {
      const response = await axios.post(
        "http://localhost:5000/knowledge/search",
        { question }
      );

      const botMessage = {
        sender: "bot",
        text: response.data.answer
      };

      setMessages((prev) => [...prev, botMessage]);
      setQuestion("");

    } catch (error) {
      alert("Server error");
    }
  };

  return (
    <div>
      <h2>Farmer Chatbot</h2>

      <div style={{ border: "1px solid black", height: "300px", overflowY: "scroll", padding: "10px" }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ textAlign: msg.sender === "user" ? "right" : "left" }}>
            <p><b>{msg.sender}:</b> {msg.text}</p>
          </div>
        ))}
      </div>

      <input
        type="text"
        placeholder="Ask your farming question..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
      <button onClick={sendQuestion}>Send</button>
    </div>
  );
}