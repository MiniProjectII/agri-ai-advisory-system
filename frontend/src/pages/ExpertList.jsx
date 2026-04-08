import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function ExpertList() {
  const [experts, setExperts] = useState([]);
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get("category");

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    async function fetchExperts() {
      try {
        const res = await axios.get("http://localhost:5000/experts");
        
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
  }, []);

  const requestChat = async (expertId) => {
    try {
      await axios.post("http://localhost:5000/request-chat", {
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
    <div style={{ padding: "20px", maxWidth: "800px", margin: "auto" }}>
      <h2 style={{ color: "var(--accent-color)" }}>👨‍🔬 Available Experts</h2>
      {experts.length === 0 ? <p style={{ color: "var(--text-secondary)" }}>No experts found.</p> : (
        <div style={{ display: "grid", gap: "20px" }}>
          {experts.map(exp => (
            <div key={exp._id} className="glass-panel" style={{ padding: "25px" }}>
              <h3 style={{ margin: "0 0 10px 0" }}>{exp.name}</h3>
              <p style={{ margin: "0 0 5px 0", fontSize: "0.9em", color: "var(--accent-color)" }}>{exp.specialization}</p>
              <p style={{ color: "var(--text-secondary)", margin: "0 0 5px 0" }}>🗣️ Languages: {exp.languages?.join(", ")}</p>
              <div style={{ display: "flex", gap: "20px", margin: "0 0 15px 0" }}>
                <p style={{ color: "var(--accent-color)", margin: 0, fontWeight: "bold" }}>⭐ {(exp.rating || 0).toFixed(1)}</p>
                <p style={{ color: "var(--text-secondary)", margin: 0 }}>✅ {exp.resolved_cases || 0} cases resolved</p>
              </div>
              <button onClick={() => requestChat(exp.user_id || exp._id)}>
                Request Chat
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
