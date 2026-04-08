import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
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
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const user = JSON.parse(localStorage.getItem("user"));

  // 🔥 unlock speech
  useEffect(() => {
    document.addEventListener("click", () => {
      window.speechSynthesis.resume();
    });

    // Check memory on load
    if (user?._id) {
      axios.get(`http://${window.location.hostname}:5000/memory/${user._id}`)
        .then(res => {
          if (res.data && res.data.location) {
            setFarmerDetails({
              ...farmerDetails,
              name: res.data.name || user.name,
              location: res.data.location,
              soilType: res.data.soilType || "",
              ph: res.data.ph || ""
            });
            setShowForm(false);
            setMessages([
              {
                sender: "bot",
                text: `Welcome back ${res.data.name || user.name}! How can I help with your farm today?`
              }
            ]);
          }
        })
        .catch(err => console.log("No existing memory found."));
    }
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

    window.speechSynthesis.cancel();
    
    let voices = window.speechSynthesis.getVoices();
    
    // Check if we intrinsically lack the required voice
    if (language !== "English") {
      const code = language === "Telugu" ? "te" : "hi";
      const hasNativeVoice = voices.some(v => v.lang.includes(code) || v.name.toLowerCase().includes(language.toLowerCase()));
      
      if (!hasNativeVoice && voices.length > 0) {
        console.warn(`Native ${language} voice missing. Using HTTP Audio fallback.`);
        const url = `http://${window.location.hostname}:5000/api/tts?lang=${code}&text=${encodeURIComponent(text)}`;
        const audio = new Audio(url);
        audio.play().catch(e => console.error("Audio playback failed", e));
        return;
      }
    }

    const speech = new SpeechSynthesisUtterance(text);

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
      selectedVoice = voices.find(v => v.lang.includes("te") || v.name.toLowerCase().includes("telugu"));
    } else if (language === "Hindi") {
      selectedVoice = voices.find(v => v.lang.includes("hi") || v.name.toLowerCase().includes("hindi"));
    } else {
      selectedVoice = voices.find(v => v.lang.includes("en-IN") || v.lang.includes("en-US") || v.lang.includes("en"));
    }

    if (!selectedVoice) {
      // Fallback if browser absolutely doesn't have the voice
      selectedVoice = voices.find(v => v.lang.includes("en"));
      if (language !== "English") {
        console.warn(`Native ${language} voice not found on this OS/Browser. Falling back to default.`);
      }
    }

    if (selectedVoice) {
      speech.voice = selectedVoice;
      speech.lang = selectedVoice.lang || (language === "Telugu" ? "te-IN" : language === "Hindi" ? "hi-IN" : "en-IN");
    } else {
      // Hard fallback if no voices loaded
      speech.lang = language === "Telugu" ? "te-IN" : language === "Hindi" ? "hi-IN" : "en-IN";
    }

    speech.rate = 0.9;
    speech.pitch = 1;
  };

  const stopSpeaking = () => window.speechSynthesis.cancel();

  const handleInputChange = (e) => {
    setFarmerDetails({
      ...farmerDetails,
      [e.target.name]: e.target.value
    });
  };


  // ---------------- SAVE ----------------
  const saveFarmerDetails = async () => {
    try {
      await axios.post(`http://${window.location.hostname}:5000/memory/save`, {
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
      const res = await axios.post(`http://${window.location.hostname}:5000/agent/query`, {
        farmerId: user?._id || "farmer1",
        question,
        language
      });

      const answer = res.data.response.answer;
      speakText(answer);
      setLastCategory(res.data.selectedAgent || "virtual");

      setMessages((prev) => {
        notificationSound.play();
        return [
          ...prev,
          { sender: "bot", text: answer },
          { sender: "bot", type: "feedback", text: "Are you satisfied with this answer?" }
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
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: `👨‍🔬 Redirecting to ${lastCategory} expert...` }
      ]);
      
      const res = await axios.post(`http://${window.location.hostname}:5000/agent/query`, {
        farmerId: user?._id || "farmer1",
        question: lastQuestion,
        forceAgent: true,
        language
      });

      const answer = res.data.response.answer;
      speakText(answer);

      setMessages((prev) => {
        return [
          ...prev,
          { sender: "bot", text: answer },
          { sender: "bot", type: "expert", text: "Need further help? Consult a real expert." }
        ];
      });
    }
  };

  const openExperts = () => {
    window.location.href = "/experts";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendQuestion();
  };

  // 🔥 TOP LOGIN BAR REMOVED - Handled by NavBar
  if (showForm) {
    return (
      <>
        <div className="chat-container">
          <h2>🌱 Farmer Registration</h2>

          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option>English</option>
            <option>Telugu</option>
            <option>Hindi</option>
          </select>

          <input name="name" placeholder="Name" value={farmerDetails.name} onChange={handleInputChange} />
          
          <input name="location" placeholder="Location" value={farmerDetails.location} onChange={handleInputChange} />

          <input name="soilType" placeholder="Soil" value={farmerDetails.soilType} onChange={handleInputChange} />
          <input name="ph" placeholder="pH" value={farmerDetails.ph} onChange={handleInputChange} />

          <button onClick={saveFarmerDetails}>Start</button>
        </div>
      </>
    );
  }

  // ---------------- CHAT ----------------
  return (
    <>
      <div className="chat-container">
        <h2>🌾 AI Crop Assistant</h2>

        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option>English</option>
          <option>Telugu</option>
          <option>Hindi</option>
        </select>

        <div>
          <button onClick={stopSpeaking}>⏹ Stop Speaking</button>
        </div>

        <div className="messages">
          {messages.map((msg, i) => (
            <div key={i} className={msg.sender}>
              {msg.sender === "bot" ? (
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              ) : (
                <p>{msg.text}</p>
              )}

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
          <div ref={messagesEndRef} />
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