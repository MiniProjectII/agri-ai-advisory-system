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
  const [isMuted, setIsMuted] = useState(false);

  // 🎤 VOICE RECOGNITION
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  let recognition;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
  }

  const startListening = () => {
    if (!recognition) {
      alert("Speech Recognition not supported");
      return;
    }

    recognition.lang =
      language === "Telugu"
        ? "te-IN"
        : language === "Hindi"
        ? "hi-IN"
        : "en-IN";

    recognition.start();

    recognition.onresult = (event) => {
      const speechText = event.results[0][0].transcript;
      setQuestion(speechText);
    };
  };

  // 🔊 VOICE OUTPUT (manual only)
  const speakText = (text) => {
    if (isMuted) return;

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);

    if (language === "Telugu") {
      speech.lang = "te-IN";
    } else if (language === "Hindi") {
      speech.lang = "hi-IN";
    } else {
      speech.lang = "en-IN";
    }

    speech.rate = 0.9;
    speech.pitch = 1;

    window.speechSynthesis.speak(speech);
  };

  // 🔇 Controls
  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // -------------------- INPUT --------------------
  const handleInputChange = (e) => {
    setFarmerDetails({
      ...farmerDetails,
      [e.target.name]: e.target.value
    });
  };

  // -------------------- SAVE --------------------
  const saveFarmerDetails = async () => {
    try {
      await axios.post("http://localhost:5000/memory/save", {
        farmerId: "farmer1",
        ...farmerDetails,
        preferred_language: language
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
      alert("Error saving farmer details");
    }
  };

  // -------------------- SEND --------------------
  const sendQuestion = async () => {
    if (!question.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: question }]);

    try {
      const res = await axios.post("http://localhost:5000/agent/query", {
        farmerId: "farmer1",
        question,
        language
      });

      const botMessage = {
        sender: "bot",
        agent: res.data.response.agent,
        text: res.data.response.answer
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

    } catch (err) {
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
      const res = await axios.post("http://localhost:5000/agent/query", {
        farmerId: "farmer1",
        question: lastQuestion,
        forceAgent: true,
        language
      });

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "🔄 Redirecting to specialist..."
        }
      ]);

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            agent: res.data.response.agent,
            text: res.data.response.answer
          }
        ]);
      }, 800);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendQuestion();
  };

  // -------------------- FORM --------------------
  if (showForm) {
    return (
      <div className="chat-container">
        <h2>🌱 Farmer Registration</h2>

        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option>English</option>
          <option>Telugu</option>
          <option>Hindi</option>
        </select>

        <input name="name" placeholder="Name" onChange={handleInputChange} />
        <input name="location" placeholder="Location" onChange={handleInputChange} />
        <input name="soilType" placeholder="Soil" onChange={handleInputChange} />
        <input name="ph" placeholder="pH" onChange={handleInputChange} />

        <button onClick={saveFarmerDetails}>Start</button>
      </div>
    );
  }

  // -------------------- CHAT --------------------
  return (
    <div className="chat-container">
      <h2>🌾 AI Crop Assistant</h2>

      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        <option>English</option>
        <option>Telugu</option>
        <option>Hindi</option>
      </select>

      {/* 🔇 Controls */}
      <div>
        <button onClick={toggleMute}>
          {isMuted ? "🔈 Unmute" : "🔇 Mute"}
        </button>

        <button onClick={stopSpeaking}>⏹ Stop</button>
      </div>

      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={msg.sender}>
            {msg.agent && <b>{msg.agent}</b>}
            <p>{msg.text}</p>

            {/* 🔊 Speak button */}
            {msg.sender === "bot" && (
              <button onClick={() => speakText(msg.text)}>🔊</button>
            )}

            {msg.type === "feedback" && (
              <>
                <button onClick={() => handleFeedback("yes")}>Yes</button>
                <button onClick={() => handleFeedback("no")}>No</button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="input-area">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <button onClick={sendQuestion}>Send</button>

        {/* 🎤 */}
        <button onClick={startListening}>🎤</button>
      </div>
    </div>
  );
}