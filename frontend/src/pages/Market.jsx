import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Market() {
  const [marketData, setMarketData] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  
  const [calcInput, setCalcInput] = useState({
    crop: "Rice",
    acres: 1
  });

  const [farmerSoil, setFarmerSoil] = useState("black soil");
  
  useEffect(() => {
    // Attempt to load farmer memory to auto-fill their soil type
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.role === "farmer") {
      axios.get(`http://${window.location.hostname}:5000/memory/${user._id}`)
           .then(res => {
             if (res.data && res.data.soilType) {
               setFarmerSoil(res.data.soilType);
             }
           }).catch(() => {});
    }

    axios.get(`http://${window.location.hostname}:5000/api/market/data`)
         .then(res => setMarketData(res.data))
         .catch(() => console.error("Could not fetch market data"));
  }, []);

  useEffect(() => {
    // Fetch recommendations when farmer's soil type is confirmed or changes
    axios.get(`http://${window.location.hostname}:5000/api/market/recommendations?soilType=${farmerSoil}`)
         .then(res => setRecommendations(res.data))
         .catch(() => console.error("Could not fetch recommendations"));
  }, [farmerSoil]);

  const selectedCropData = marketData.find(c => c.name === calcInput.crop);

  let potentialProfit = 0;
  let revenue = 0;
  let cost = 0;

  if (selectedCropData) {
    revenue = (selectedCropData.yieldPerAcre * calcInput.acres) * selectedCropData.currentPrice;
    cost = selectedCropData.costPerAcre * calcInput.acres;
    potentialProfit = revenue - cost;
  }

  const chartData = {
    labels: selectedCropData ? selectedCropData.history.map(h => h.date).reverse() : [],
    datasets: [
      {
        label: `${calcInput.crop} Price (INR / Qtl)`,
        data: selectedCropData ? selectedCropData.history.map(h => h.price).reverse() : [],
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.5)",
      }
    ]
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1100px", margin: "auto", display: "grid", gridTemplateColumns: "2fr 1fr", gap: "25px" }}>
      
      {/* Left Column: Historical Prices and Calculator */}
      <div>
        <h2 style={{ color: "var(--accent-color)", display: "flex", alignItems: "center", gap: "10px" }}>
          <span>📈</span> Market & Yield Profitability
        </h2>
        
        <div className="glass-panel" style={{ padding: "25px", marginBottom: "20px" }}>
          <h3>Profit Calculator</h3>
          <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "5px", color: "var(--text-secondary)" }}>Select Crop</label>
              <select 
                value={calcInput.crop}
                onChange={e => setCalcInput({...calcInput, crop: e.target.value})}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.5)", color: "white" }}
              >
                {marketData.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "5px", color: "var(--text-secondary)" }}>Acreage (Acres)</label>
              <input 
                type="number" 
                min="0.1" step="0.1"
                value={calcInput.acres}
                onChange={e => setCalcInput({...calcInput, acres: Number(e.target.value)})}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.5)", color: "white" }}
              />
            </div>
          </div>
          
          {selectedCropData && (
            <div style={{ background: "rgba(16, 185, 129, 0.1)", padding: "15px", borderRadius: "10px", border: "1px dashed var(--emerald-primary)" }}>
              <p style={{ margin: "0 0 5px 0" }}>Expected Yield: <strong>{(selectedCropData.yieldPerAcre * calcInput.acres).toFixed(2)} Quintals</strong></p>
              <p style={{ margin: "0 0 5px 0" }}>Estimated Cost: <strong>₹{cost.toLocaleString()}</strong></p>
              <p style={{ margin: "0 0 5px 0" }}>Estimated Revenue: <strong>₹{revenue.toLocaleString()}</strong></p>
              <hr style={{ borderColor: "rgba(255,255,255,0.1)", margin: "10px 0" }}/>
              <h4 style={{ margin: 0, color: potentialProfit > 0 ? "var(--emerald-primary)" : "red" }}>
                Potential Profit: ₹{potentialProfit.toLocaleString()}
              </h4>
            </div>
          )}
        </div>

        <div className="glass-panel" style={{ padding: "25px" }}>
          <h3>Historical Price Trend (Last 7 Days)</h3>
          {selectedCropData ? (
            <Line data={chartData} options={{ responsive: true, color: "grey" }} />
          ) : <p>Loading data...</p>}
        </div>

      </div>
      
      {/* Right Column: Recommendations */}
      <div>
        <div className="glass-panel" style={{ padding: "25px" }}>
          <h3 style={{ color: "var(--emerald-primary)" }}>Best Crops for You</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9em", marginBottom: "20px" }}>
            Based on your Auto-detected <strong>{farmerSoil}</strong>. We dynamically match these for maximum profit based on today's simulated market snapshot.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {recommendations.length > 0 ? recommendations.map((rec, idx) => (
              <div key={rec.name} style={{ background: "rgba(0,0,0,0.4)", borderRadius: "10px", padding: "15px", position: "relative" }}>
                 {idx === 0 && <span style={{ position: "absolute", top: -10, right: -10, fontSize: "1.5em" }}>🌟</span>}
                 <h4 style={{ margin: "0 0 5px 0" }}>{rec.name}</h4>
                 <p style={{ margin: "0 0 5px 0", fontSize: "0.85em", color: "var(--text-secondary)" }}>Current Price: ₹{rec.currentPrice}/Qtl</p>
                 <p style={{ margin: 0, fontWeight: "bold", color: "var(--emerald-primary)" }}>Max Profit: ₹{rec.profitPerAcre.toLocaleString()} / Acre</p>
              </div>
            )) : <p>No specific recommendations.</p>}
          </div>
        </div>
      </div>

    </div>
  );
}
