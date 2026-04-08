import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const [pendingExperts, setPendingExperts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Basic Auth Check
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "admin") {
      navigate("/");
      return;
    }

    fetchPending();
  }, [navigate]);

  const fetchPending = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/pending-experts");
      setPendingExperts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.patch(`http://localhost:5000/api/admin/approve/${id}`);
      alert("Expert Approved!");
      fetchPending();
    } catch (err) {
      alert("Failed to approve");
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Are you sure you want to reject this application?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/reject/${id}`);
      fetchPending();
    } catch (err) {
      alert("Failed to reject");
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "1000px", margin: "0 auto" }}>
      <h2 style={{ color: "var(--accent-color)", borderBottom: "2px solid var(--glass-border)", paddingBottom: "10px" }}>
        🛡️ Admin Dashboard: Verification Center
      </h2>
      
      <div style={{ marginTop: "30px" }}>
        <h3 style={{ marginBottom: "20px" }}>Pending Expert Applications ({pendingExperts.length})</h3>
        
        {pendingExperts.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>No pending applications right now.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {pendingExperts.map(exp => (
              <div key={exp._id} className="glass-panel" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "1.2rem", color: "white" }}>{exp.name}</h4>
                  <p style={{ margin: "5px 0", color: "var(--text-secondary)" }}><strong>Email:</strong> {exp.user_id?.email}</p>
                  <p style={{ margin: "5px 0", color: "var(--text-secondary)" }}><strong>Base Role:</strong> <span style={{ background: "rgba(0,0,0,0.5)", padding: "2px 8px", borderRadius: "10px" }}>{exp.user_id?.role}</span></p>
                  <p style={{ margin: "15px 0 5px 0", color: "white" }}><strong>Proof of Expertise:</strong></p>
                  <div style={{ background: "rgba(0,0,0,0.3)", padding: "15px", borderRadius: "8px", fontStyle: "italic", whiteSpace: "pre-wrap" }}>
                    {exp.proof_of_expertise || "No proof provided."}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginLeft: "30px" }}>
                  <button onClick={() => handleApprove(exp._id)} style={{ padding: "10px 25px" }}>Approve & Activate</button>
                  <button onClick={() => handleReject(exp._id)} className="danger">Reject Request</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
