import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function ApplyExpert() {
  const [proof, setProof] = useState("");
  const [specialization, setSpecialization] = useState("General Agriculture");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!user || user.role !== "farmer") {
      alert("Only farmers can apply to become an expert using this form!");
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!proof.trim()) return alert("Proof of expertise is required.");

    setLoading(true);
    try {
      await axios.post(`http://${window.location.hostname}:5000/auth/apply-expert`, {
        user_id: user._id,
        name: user.name,
        specialization,
        proofOfExpertise: proof
      });
      alert("Application submitted! An admin will review it shortly.");
      navigate("/profile");
    } catch (err) {
      alert("Failed to submit application. You may already have a pending one.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "600px", margin: "0 auto" }}>
      <div className="glass-panel" style={{ padding: "30px" }}>
        <h2 style={{ color: "var(--accent-color)", margin: "0 0 20px 0" }}>Apply to Become an Expert</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "30px", lineHeight: "1.5" }}>
          Share your agricultural success with the community! Submit your application below. Once approved by our administrative team, your account will be upgraded to a hybrid <strong>Farmer-Expert</strong> role allowing you to host live consultations.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Your Specialization</label>
            <input 
              required
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              style={{ width: "100%" }}
              placeholder="e.g. Organic Farming, Soil Management, etc."
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Proof of Expertise & Past Success</label>
            <textarea 
              required
              value={proof}
              onChange={(e) => setProof(e.target.value)}
              style={{ width: "100%", height: "150px", resize: "vertical" }}
              placeholder="Describe your years of experience, crop yields, certifications, or link to a portfolio..."
            />
          </div>

          <button type="submit" disabled={loading} style={{ padding: "12px", fontSize: "1.1rem", marginTop: "10px" }}>
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
}
