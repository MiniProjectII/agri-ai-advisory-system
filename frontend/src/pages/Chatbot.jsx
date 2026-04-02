import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Chatbot.css";

// 🔊 Notification Sound
const notificationSound = new Audio("https://www.soundjay.com/buttons/sounds/button-3.mp3");

export default function Chatbot() {
  const [question, setQuestion] = useState("");
  const [lastQuestion, setLastQuestion] = useState("");
  const [lastCategory, setLastCategory] = useState("Crop Specialist");

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

  const user = JSON.parse(localStorage.getItem("user"));

  // 🔥 unlock speech
  useEffect(() => {
    document.addEventListener("click", () => {
      window.speechSynthesis.resume();
    });
  }, []);

  // 🎤 Voice Input
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  let recognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
  }

  const startListening = () => {
    if (!recognition) {
      alert("Speech not supported");
      return;
    }

    recognition.lang =
      language === "Telugu"
        ? "te-IN"
        : language === "Hindi"
        ? "hi-IN"
        : "en-IN";

    recognition.start();

    recognition.onresult = (e) => {
      setQuestion(e.results[0][0].transcript);
    };
  };

  // 🔊 Speak
  const speakText = (text) => {
    if (isMuted) return;

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);

    let voices = window.speechSynthesis.getVoices();

    if (!voices.length) {
      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
        applyVoice(speech, voices);
        window.speechSynthesis.speak(speech);
      };
    } else {
      applyVoice(speech, voices);
      window.speechSynthesis.speak(speech);
    }
  };

  const applyVoice = (speech, voices) => {
    let selectedVoice;

    if (language === "Telugu") {
      selectedVoice = voices.find(v => v.lang.includes("te"));
    } else if (language === "Hindi") {
      selectedVoice = voices.find(v => v.lang.includes("hi"));
    } else {
      selectedVoice = voices.find(v => v.lang.includes("en"));
    }

    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.includes("en"));
    }

    if (selectedVoice) {
      speech.voice = selectedVoice;
      speech.lang = selectedVoice.lang;
    }

    speech.rate = 0.9;
    speech.pitch = 1;
  };

  const stopSpeaking = () => window.speechSynthesis.cancel();
  const toggleMute = () => setIsMuted(!isMuted);

  const handleInputChange = (e) => {
    setFarmerDetails({
      ...farmerDetails,
      [e.target.name]: e.target.value
    });
  };

  // ---------------- SAVE ----------------
  const saveFarmerDetails = async () => {
    try {
      await axios.post("http://localhost:5000/memory/save", {
        farmerId: user?._id || "farmer1",
        ...farmerDetails,
        preferred_language: language
      });

      setShowForm(false);
      notificationSound.play();

      setMessages([
        {
          sender: "bot",
          text: `Hello ${farmerDetails.name || "farmer"}! Ask your farming questions.`
        }
      ]);
    } catch {
      alert("Error saving farmer details");
    }
  };

  // ---------------- SEND ----------------
  const sendQuestion = async () => {
    if (!question.trim()) return;

    setMessages((prev) => {
      notificationSound.play();
      return [...prev, { sender: "user", text: question }];
    });

    try {
      const res = await axios.post("http://localhost:5000/agent/query", {
        farmerId: user?._id || "farmer1",
        question,
        language
      });

      const answer = res.data.response.answer;
      speakText(answer);

      setMessages((prev) => {
        notificationSound.play();
        return [
          ...prev,
          { sender: "bot", text: answer },
          { sender: "bot", type: "feedback", text: "Are you satisfied with this answer?" },
          { sender: "bot", type: "expert", text: "Do you want to consult an expert?" }
        ];
      });

      setLastQuestion(question);
      setQuestion("");

    } catch {
      alert("Server error");
    }
  };

  const handleFeedback = async (type) => {
    if (type === "yes") {
      setMessages((prev) => [...prev, { sender: "bot", text: "Glad I could help! 😊" }]);
    } else {
      const res = await axios.post("http://localhost:5000/agent/query", {
        farmerId: user?._id || "farmer1",
        question: lastQuestion,
        forceAgent: true,
        language
      });

      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "🔄 Getting expert answer..." },
        { sender: "bot", text: res.data.response.answer }
      ]);
    }
  };

  const openExperts = () => {
    window.location.href = `http://localhost:5000/experts.html`;
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendQuestion();
  };

  // 🔥 TOP LOGIN BAR
  const TopBar = () => (
    <div style={{
      width: "100%",
      padding: "10px",
      display: "flex",
      justifyContent: "flex-end",
      gap: "10px",
      background: "#eee"
    }}>
      {!user ? (
        <>
          <button onClick={() => window.location.href = "http://localhost:5000/login.html?role=farmer"}>
  Farmer Login
</button>

<button onClick={() => window.location.href = "http://localhost:5000/login.html?role=expert"}>
  Expert Login
</button>
        </>
      ) : (
        <>
          <span>{user.name}</span>
          <button onClick={() => {
            localStorage.removeItem("user");
            window.location.reload();
          }}>
            Logout
          </button>
        </>
      )}
    </div>
  );

  // ---------------- FORM ----------------
  if (showForm) {
    return (
      <>
        <TopBar />
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
      </>
    );
  }

  // ---------------- CHAT ----------------
  return (
    <>
      <TopBar />
      <div className="chat-container">
        <h2>🌾 AI Crop Assistant</h2>

        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option>English</option>
          <option>Telugu</option>
          <option>Hindi</option>
        </select>

        <div>
          <button onClick={toggleMute}>
            {isMuted ? "🔈 Unmute" : "🔇 Mute"}
          </button>
          <button onClick={stopSpeaking}>⏹ Stop</button>
        </div>

        <div className="messages">
          {messages.map((msg, i) => (
            <div key={i} className={msg.sender}>
              <p>{msg.text}</p>

              {msg.sender === "bot" && (
                <button onClick={() => speakText(msg.text)}>🔊</button>
              )}

              {msg.type === "feedback" && (
                <>
                  <button onClick={() => handleFeedback("yes")}>Yes</button>
                  <button onClick={() => handleFeedback("no")}>No</button>
                </>
              )}

              {msg.type === "expert" && (
                <button onClick={openExperts}>Consult Expert 👨‍🌾</button>
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
          <button onClick={startListening}>🎤</button>
        </div>
      </div>
    </>
  );
}