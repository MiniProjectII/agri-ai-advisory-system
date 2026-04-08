import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function ExpertDashboard() {
  const [requests, setRequests] = useState([]);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!user || (user.role !== "expert" && user.role !== "farmer_expert")) {
      navigate("/");
      return;
    }

    async function fetchRequests() {
      try {
        const res = await axios.get(`http://${window.location.hostname}:5000/expert-requests/${user._id}`);
        setRequests(res.data);
      } catch (err) {
        console.error("Error fetching requests:", err);
      }
    }

    fetchRequests();
    const interval = setInterval(fetchRequests, 3000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  const acceptChat = (farmerId) => {
    navigate(`/chat?farmer=${farmerId}&expert=${user._id}`);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "auto" }}>
      <h2 style={{ color: "var(--accent-color)" }}>👨‍🔬 Expert Dashboard</h2>
      
      <h3 style={{ marginTop: "30px", borderBottom: "1px solid var(--glass-border)", paddingBottom: "10px" }}>📩 Incoming Chat Requests</h3>
      {requests.length === 0 ? <p style={{ color: "var(--text-secondary)" }}>No new requests.</p> : (
        <div style={{ display: "grid", gap: "15px", marginTop: "20px" }}>
          {requests.map((req, idx) => (
            <div key={idx} className="glass-panel" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ margin: "0 0 5px 0" }}><strong>Request from:</strong> {req.farmer_id?.name || 'Unknown Farmer'}</p>
                {req.memory && (
                  <p style={{ margin: "0 0 5px 0", fontSize: "0.9em", color: "var(--text-primary)" }}>
                    <strong>Details:</strong> {req.memory.location || "No Location"} | {req.memory.soilType || "No Soil"}
                  </p>
                )}
                <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.85em" }}>Date: {new Date(req.createdAt).toLocaleString()}</p>
              </div>
              <button onClick={() => acceptChat(req.farmer_id?._id || req.farmer_id)}>
                Open Chat Room
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
