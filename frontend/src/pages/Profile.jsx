import { useState, useEffect } from "react";
import axios from "axios";

export default function Profile() {
  const user = JSON.parse(localStorage.getItem("user"));
  
  const [formData, setFormData] = useState({
    name: user?.name || "",
    location: "",
    soilType: "",
    ph: "",
    previousCrops: "",
    fertilizerUsage: ""
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const handleLocationDetect = () => {
    if ("geolocation" in navigator) {
      setDetectingLocation(true);
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Free Nominatim reverse geocoding API
          const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18`);
          const addr = res.data.address || {};
          
          // Deep Locality mapping
          const preciseLocality = addr.suburb || addr.neighbourhood || addr.city_district || addr.town || addr.village || addr.city || addr.county;
          const state = addr.state || addr.region || "Unknown State";
          const locationString = preciseLocality ? `${preciseLocality}, ${state}` : state;
          
          // Simple mocked soil mapping by region
          let mockSoilType = "Alluvial Soil";
          const lowerState = state.toLowerCase();
          if (lowerState.includes("telangana") || lowerState.includes("andhra") || lowerState.includes("maharashtra")) mockSoilType = "Black Soil";
          else if (lowerState.includes("tamil nadu") || lowerState.includes("karnataka") || lowerState.includes("odisha")) mockSoilType = "Red Soil";
          else if (lowerState.includes("rajasthan") || lowerState.includes("gujarat")) mockSoilType = "Desert Soil";
          else if (lowerState.includes("kerala") || lowerState.includes("assam")) mockSoilType = "Laterite Soil";
          
          setFormData(prev => ({
            ...prev,
            location: locationString,
            soilType: prev.soilType || mockSoilType
          }));
        } catch(err) {
          alert("Failed to fetch location details.");
        } finally {
          setDetectingLocation(false);
        }
      }, (error) => {
        setDetectingLocation(false);
        alert("Geolocation error: " + error.message);
      });
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleSoilDetect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setDetecting(true);
    const fd = new FormData();
    fd.append("image", file);

    try {
      const res = await axios.post(`http://${window.location.hostname}:5000/api/detect-soil`, fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data.success) {
        setFormData(prev => ({ ...prev, soilType: res.data.soilType, ph: res.data.ph }));
        alert(`${res.data.message}`);
      }
    } catch (err) {
      alert("Failed to detect soil from image.");
    } finally {
      setDetecting(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === "farmer" || user.role === "farmer_expert")) {
      axios.get(`http://${window.location.hostname}:5000/memory/${user._id}`)
        .then(res => {
          if (res.data) {
            setFormData({
              name: res.data.name || user.name,
              location: res.data.location || "",
              soilType: res.data.soilType || "",
              ph: res.data.ph || "",
              previousCrops: res.data.previousCrops ? res.data.previousCrops.join(", ") : "",
              fertilizerUsage: res.data.fertilizerUsage ? res.data.fertilizerUsage.join(", ") : ""
            });
          }
        })
        .catch(err => console.error("No memory found or error", err));
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    
    // Convert comma separated strings to arrays
    const formattedData = {
      farmerId: user._id,
      ...formData,
      previousCrops: formData.previousCrops.split(",").map(s => s.trim()).filter(s => s),
      fertilizerUsage: formData.fertilizerUsage.split(",").map(s => s.trim()).filter(s => s)
    };

    try {
      await axios.post(`http://${window.location.hostname}:5000/memory/save`, formattedData);
      setSuccess(true);
    } catch (err) {
      alert("Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div style={{textAlign: "center", padding: "50px", color: "var(--text-secondary)"}}>Please login to view profile.</div>;
  }

  return (
    <div style={{ maxWidth: "500px", margin: "40px auto", padding: "20px" }}>
      <h2 style={{ color: "var(--accent-color)", textAlign: "center" }}>🌾 Farmer Profile</h2>
      <p style={{ textAlign: "center", color: "var(--text-secondary)", marginBottom: "20px" }}>
        Update your farm details. These details assist experts and the AI in giving accurate advice.
        You can also upload a soil image below to auto-detect your soil type and pH using our AI model.
      </p>

      <form className="glass-panel" onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "15px", padding: "30px" }}>
        
        <div>
          <label style={{ display: "block", marginBottom: "5px", color: "var(--text-secondary)", fontSize: "0.9em" }}>Full Name</label>
          <input name="name" value={formData.name} onChange={handleChange} required />
        </div>

        <div>
           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
             <label style={{ display: "block", marginBottom: "5px", color: "var(--text-secondary)", fontSize: "0.9em" }}>Location (City, State)</label>
             <button type="button" onClick={handleLocationDetect} disabled={detectingLocation} style={{ background: "none", border: "none", color: "var(--emerald-primary)", cursor: "pointer", fontSize: "0.85em", textDecoration: "underline", padding: 0 }}>
               {detectingLocation ? "Detecting..." : "📍 Auto-Detect Location"}
             </button>
           </div>
           <input name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Hyderabad, TS" required />
        </div>

        <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
          <div style={{ flex: 2, minWidth: "200px" }}>
            <label style={{ display: "block", marginBottom: "5px", color: "var(--text-secondary)", fontSize: "0.9em", fontWeight: "600" }}>Soil Type</label>
            <input name="soilType" value={formData.soilType} onChange={handleChange} placeholder="e.g. Red Soil, Black Soil" />
          </div>
          <div style={{ flex: 1, minWidth: "120px" }}>
            <label style={{ display: "block", marginBottom: "5px", color: "var(--text-secondary)", fontSize: "0.9em", fontWeight: "600" }}>Soil pH</label>
            <input name="ph" type="number" step="0.1" value={formData.ph} onChange={handleChange} placeholder="6.5" />
          </div>
        </div>

        {/* Phase 5 additions */}
        <div style={{ background: "rgba(16, 185, 129, 0.1)", padding: "15px", borderRadius: "8px", border: "1px dashed var(--emerald-primary)", textAlign: "center" }}>
          <p style={{ margin: "0 0 10px 0", color: "var(--text-primary)", fontWeight: "bold" }}>Don't know your soil? 📸 Upload Image</p>
          <input type="file" accept="image/*" onChange={handleSoilDetect} id="soilUpload" style={{ display: "none" }} />
          <label htmlFor="soilUpload" style={{ 
            background: "var(--emerald-primary)", color: "white", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", display: "inline-block", fontSize: "0.9em", fontWeight: "bold" 
          }}>
            {detecting ? "Analyzing..." : "Choose Image"}
          </label>
          <span style={{ fontSize: "0.8em", color: "var(--text-secondary)", display: "block", marginTop: "10px" }}>AI will analyze your soil artificially using our integration logic.</span>
        </div>

        <div>
           <label style={{ display: "block", marginBottom: "5px", color: "var(--text-secondary)", fontSize: "0.9em" }}>Previous Crops (comma separated)</label>
           <input name="previousCrops" value={formData.previousCrops} onChange={handleChange} placeholder="Rice, Cotton" />
        </div>

        <div>
           <label style={{ display: "block", marginBottom: "5px", color: "var(--text-secondary)", fontSize: "0.9em" }}>Fertilizer Usage (comma separated)</label>
           <input name="fertilizerUsage" value={formData.fertilizerUsage} onChange={handleChange} placeholder="Urea, DAP" />
        </div>

        <button type="submit" disabled={loading} style={{ marginTop: "15px", opacity: loading ? 0.7 : 1 }}>
          {loading ? "Saving..." : "Save Profile"}
        </button>
        {success && <p style={{ color: "var(--accent-color)", textAlign: "center", margin: "10px 0 0 0" }}>Profile updated successfully!</p>}
      </form>
    </div>
  );
}
