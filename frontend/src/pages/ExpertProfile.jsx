import { useState, useEffect } from "react";
import axios from "axios";

export default function ExpertProfile() {
  const user = JSON.parse(localStorage.getItem("user"));
  
  const [formData, setFormData] = useState({
    name: user?.name || "",
    specialization: "",
    languages: "",
    location: "",
    about: "",
    experience_years: ""
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [stats, setStats] = useState({ resolved_cases: 0, rating: 0, total_ratings: 0 });

  useEffect(() => {
    if (user && user.role === "expert") {
      axios.get(`http://localhost:5000/expert-profile/${user._id}`)
        .then(res => {
          if (res.data) {
            setFormData({
              name: res.data.name || user.name,
              specialization: res.data.specialization || "",
              languages: res.data.languages ? res.data.languages.join(", ") : "",
              location: res.data.location || "",
              about: res.data.about || "",
              experience_years: res.data.experience_years || ""
            });
            setStats({
              resolved_cases: res.data.resolved_cases || 0,
              rating: res.data.rating || 0,
              total_ratings: res.data.total_ratings || 0
            });
          }
        })
        .catch(err => console.log("No expert profile found yet."));
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    
    const payload = {
      user_id: user._id,
      ...formData,
      languages: formData.languages.split(",").map(s => s.trim()).filter(s => s),
      experience_years: parseInt(formData.experience_years) || 0
    };

    try {
      await axios.put("http://localhost:5000/expert-profile/update", payload);
      setSuccess(true);
    } catch (err) {
      alert("Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== "expert") {
    return <div style={{textAlign: "center", padding: "50px", color: "var(--text-secondary)"}}>Access restricted to Experts.</div>;
  }

  return (
    <div style={{ maxWidth: "550px", margin: "40px auto", padding: "20px" }}>
      <h2 style={{ color: "var(--accent-color)", textAlign: "center" }}>👨‍🔬 Expert Profile</h2>
      <p style={{ textAlign: "center", color: "var(--text-secondary)", marginBottom: "25px" }}>
        Update your professional details. Farmers will see this when browsing experts.
      </p>

      {/* Trust Metrics Banner */}
      <div className="glass-panel" style={{ padding: "20px", marginBottom: "25px", display: "flex", justifyContent: "space-around", textAlign: "center" }}>
        <div>
          <p style={{ fontSize: "2em", margin: "0", color: "var(--accent-color)", fontWeight: "bold" }}>{stats.resolved_cases}</p>
          <p style={{ margin: "5px 0 0 0", fontSize: "0.85em", color: "var(--text-secondary)" }}>Cases Resolved</p>
        </div>
        <div style={{ borderLeft: "1px solid var(--glass-border)", paddingLeft: "20px" }}>
          <p style={{ fontSize: "2em", margin: "0", color: "var(--accent-color)", fontWeight: "bold" }}>⭐ {(stats.rating || 0).toFixed(1)}</p>
          <p style={{ margin: "5px 0 0 0", fontSize: "0.85em", color: "var(--text-secondary)" }}>{stats.total_ratings} Ratings</p>
        </div>
      </div>

      <form className="glass-panel" onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "15px", padding: "30px" }}>
        
        <div>
          <label style={{ display: "block", marginBottom: "5px", color: "var(--text-secondary)", fontSize: "0.9em" }}>Full Name</label>
          <input style={{ width: "100%", boxSizing: "border-box" }} name="name" value={formData.name} onChange={handleChange} required />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "5px", color: "var(--text-secondary)", fontSize: "0.9em" }}>Specialization</label>
          <input style={{ width: "100%", boxSizing: "border-box" }} name="specialization" value={formData.specialization} onChange={handleChange} placeholder="e.g. Soil Science, Fertilizer, Disease, Weather" required />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
          <div style={{ flex: "1 1 200px" }}>
            <label style={{ display: "block", marginBottom: "5px", color: "var(--text-secondary)", fontSize: "0.9em" }}>Location</label>
            <input style={{ width: "100%", boxSizing: "border-box" }} name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Hyderabad, TS" />
          </div>
          <div style={{ flex: "1 1 120px", maxWidth: "150px" }}>
            <label style={{ display: "block", marginBottom: "5px", color: "var(--text-secondary)", fontSize: "0.9em" }}>Experience (yrs)</label>
            <input style={{ width: "100%", boxSizing: "border-box" }} name="experience_years" type="number" value={formData.experience_years} onChange={handleChange} placeholder="5" />
          </div>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "5px", color: "var(--text-secondary)", fontSize: "0.9em" }}>Languages (comma separated)</label>
          <input style={{ width: "100%", boxSizing: "border-box" }} name="languages" value={formData.languages} onChange={handleChange} placeholder="English, Telugu, Hindi" />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "5px", color: "var(--text-secondary)", fontSize: "0.9em" }}>About / Bio</label>
          <textarea style={{ width: "100%", boxSizing: "border-box", minHeight: "80px", resize: "vertical" }} name="about" value={formData.about} onChange={handleChange} placeholder="Brief description about your expertise..." />
        </div>

        <button type="submit" disabled={loading} style={{ marginTop: "15px", opacity: loading ? 0.7 : 1 }}>
          {loading ? "Saving..." : "Save Profile"}
        </button>
        {success && <p style={{ color: "var(--accent-color)", textAlign: "center", margin: "10px 0 0 0" }}>Profile updated successfully!</p>}
      </form>
    </div>
  );
}
