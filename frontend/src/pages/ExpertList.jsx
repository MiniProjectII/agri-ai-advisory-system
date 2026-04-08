import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function ExpertList() {
  const [experts, setExperts] = useState([]);
  const [dailyTip, setDailyTip] = useState("");
  const [showMarketPopup, setShowMarketPopup] = useState(true);
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get("category");

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    async function fetchExperts() {
      try {
        const res = await axios.get(`http://${window.location.hostname}:5000/experts`);
        
        let fetchedExperts = res.data;
        if (categoryFilter) {
          fetchedExperts = fetchedExperts.filter(exp => 
            exp.specialization?.toLowerCase().includes(categoryFilter.toLowerCase())
          );
        }
        
        setExperts(fetchedExperts);
      } catch (err) {
        alert("Error fetching experts");
      }
    }
    fetchExperts();

    async function fetchDailyTip() {
      if (user && user.role === "farmer") {
        try {
          const res = await axios.get(`http://${window.location.hostname}:5000/api/daily-tip/${user._id}`);
          if (res.data.tip) {
            setDailyTip(res.data.tip);
          }
        } catch (err) {
          console.error("Error fetching daily tip", err);
        }
      }
    }
    fetchDailyTip();
  }, []);

  const requestChat = async (expertId) => {
    try {
      await axios.post(`http://${window.location.hostname}:5000/request-chat`, {
        farmer_id: user._id,
        expert_id: expertId
      });
      // Redirect to the chat room instantly so the farmer can wait for the expert
      navigate(`/chat?farmer=${user._id}&expert=${expertId}`);
    } catch (err) {
      alert("Error requesting chat");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "auto", position: "relative" }}>
      
      {showMarketPopup && user?.role === "farmer" && (
        <div style={{
          position: "fixed", bottom: "30px", right: "30px", background: "var(--accent-color)", color: "white", 
          padding: "15px 25px", borderRadius: "12px", boxShadow: "0 6px 16px rgba(0,0,0,0.3)", zIndex: 1000,
          display: "flex", alignItems: "center", gap: "15px", animation: "slideIn 0.5s ease"
        }}>
          <div>
            <h4 style={{ margin: "0 0 5px 0" }}>Check Market Trends!</h4>
            <p style={{ margin: 0, fontSize: "0.9em", opacity: 0.9 }}>Check current market prices 📈</p>
          </div>
          <button onClick={() => navigate("/market")} style={{ background: "white", color: "var(--accent-color)", padding: "8px 12px", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
            View
          </button>
          <button onClick={() => setShowMarketPopup(false)} style={{ background: "transparent", color: "white", border: "1px solid rgba(255,255,255,0.5)", padding: "8px 12px", borderRadius: "6px", cursor: "pointer" }}>
            Close
          </button>
        </div>
      )}

      {dailyTip && (
        <div className="glass-panel" style={{ padding: "20px", marginBottom: "25px", borderLeft: "4px solid var(--accent-color)" }}>
          <h3 style={{ margin: "0 0 10px 0", display: "flex", alignItems: "center", gap: "10px" }}>🌟 Daily Tip for You</h3>
          <p style={{ margin: 0, fontSize: "1.05em", color: "var(--text-primary)", fontStyle: "italic" }}>"{dailyTip}"</p>
        </div>
      )}

      <h2 style={{ color: "var(--accent-color)" }}>👨‍🔬 Available Experts</h2>
      {experts.length === 0 ? <p style={{ color: "var(--text-secondary)" }}>No experts found.</p> : (
        <div style={{ display: "grid", gap: "20px" }}>
          {experts.map(exp => (
            <div key={exp._id} className="glass-panel" style={{ padding: "25px" }}>
              <h3 style={{ margin: "0 0 10px 0" }}>{exp.name}</h3>
              <p style={{ margin: "0 0 5px 0", fontSize: "0.9em", color: "var(--accent-color)" }}>{exp.specialization}</p>
              <p style={{ color: "var(--text-secondary)", margin: "0 0 5px 0" }}>🗣️ Languages: {Array.isArray(exp.languages) ? exp.languages.join(", ") : exp.languages || "English"}</p>
              <div style={{ display: "flex", gap: "20px", margin: "0 0 15px 0" }}>
                <p style={{ color: "var(--accent-color)", margin: 0, fontWeight: "bold" }}>⭐ {(exp.rating || 0).toFixed(1)}</p>
                <p style={{ color: "var(--text-secondary)", margin: 0 }}>✅ {exp.resolved_cases || 0} cases resolved</p>
              </div>
              <button onClick={() => requestChat(exp.user_id?._id || exp.user_id || exp._id)}>
                Request Chat
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
