import { useState } from "react";
import axios from "axios";

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
        "http://localhost:5000/crop/predict",
        formData
      );

      setResult(response.data.recommended_crop);
    } catch (error) {
      alert("Error connecting to backend");
    }
  };

  return (
    <div>
      <h2>Crop Recommendation</h2>

      <form onSubmit={handleSubmit}>
        {Object.keys(formData).map((key) => (
          <div key={key}>
            <input
              type="number"
              name={key}
              placeholder={key}
              onChange={handleChange}
              required
            />
          </div>
        ))}

        <button type="submit">Predict Crop</button>
      </form>

      {result && (
        <h3>Recommended Crop: {result}</h3>
      )}
    </div>
  );
}