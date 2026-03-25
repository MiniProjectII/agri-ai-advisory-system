import { useState } from "react";
import axios from "axios";
import "../styles/CropRecommendation.css";

export default function CropRecommendation() {
  const [formData, setFormData] = useState({
    N: "",
    P: "",
    K: "",
    temperature: "",
    humidity: "",
    ph: "",
    rainfall: ""
  });

  const [result, setResult] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: Number(e.target.value)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://127.0.0.1:5001/predict",
        formData
      );

      setResult(response.data.recommended_crop);
    } catch (error) {
      alert("Error connecting to backend");
    }
  };

  return (
    <div className="crop-section">
      <h2>Crop Recommendation</h2>
      <p className="crop-desc">
        Enter soil nutrients and weather values to get the best crop suggestion.
      </p>

      <form className="crop-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nitrogen (N)</label>
          <input type="number" name="N" placeholder="Enter nitrogen value" onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Phosphorus (P)</label>
          <input type="number" name="P" placeholder="Enter phosphorus value" onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Potassium (K)</label>
          <input type="number" name="K" placeholder="Enter potassium value" onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Temperature (°C)</label>
          <input type="number" name="temperature" placeholder="Enter temperature" onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Humidity (%)</label>
          <input type="number" name="humidity" placeholder="Enter humidity" onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Soil pH</label>
          <input type="number" step="0.1" name="ph" placeholder="Enter pH value" onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Rainfall (mm)</label>
          <input type="number" name="rainfall" placeholder="Enter rainfall" onChange={handleChange} required />
        </div>

        <button type="submit">Predict Crop</button>
      </form>

      {result && (
        <div className="crop-result">
          Recommended Crop: {result}
        </div>
      )}
    </div>
  );
}