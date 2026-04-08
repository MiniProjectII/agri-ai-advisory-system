import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("farmer");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const res = await axios.post("http://localhost:5000/auth/login", { email, password });
        localStorage.setItem("user", JSON.stringify(res.data.user));
        localStorage.setItem("token", res.data.token);
        
        if (res.data.user.role === "expert") {
          navigate("/expert-dashboard");
        } else {
          navigate("/ai-assistant");
        }
      } else {
        await axios.post("http://localhost:5000/auth/register", { name, email, password, role });
        alert("Registered successfully! Please login.");
        setIsLogin(true);
      }
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100%", alignItems: "center", justifyContent: "center" }}>
      <div className="glass-panel" style={{ display: "flex", width: "1000px", maxWidth: "95%", height: "650px", overflow: "hidden", padding: 0 }}>
        {/* Left side */}
        <div style={{ 
          flex: 1, 
          backgroundImage: "url('https://images.unsplash.com/photo-1628183204780-4963e6ef6107?q=80&w=1000&auto=format&fit=crop')", 
          backgroundSize: "cover", 
          backgroundPosition: "center", 
          padding: "40px", 
          display: "flex", 
          flexDirection: "column", 
          justifyContent: "flex-end", 
          color: "white" 
        }}>
          <div style={{ background: "rgba(0,0,0,0.6)", padding: "25px", borderRadius: "16px", backdropFilter: "blur(10px)" }}>
            <h2 style={{ color: "#10b981", margin: "0 0 10px 0", fontSize: "2rem" }}>🌱 AgriAI 2.0</h2>
            <p style={{ fontSize: "1.1rem", lineHeight: "1.5", margin: 0 }}>
              Predict crops, detect diseases using AI, and talk to specialized experts. Empowering modern farming.
            </p>
          </div>
        </div>
        {/* Right side form */}
        <div style={{ flex: 1, padding: "50px", display: "flex", flexDirection: "column", justifyContent: "center", background: "var(--bg-glass)" }}>
          <h2 style={{ marginBottom: "25px", color: "var(--emerald-primary)", textAlign: "center", fontSize: "2rem" }}>
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {!isLogin && (
              <>
                <input required type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
                <select value={role} onChange={e => setRole(e.target.value)} style={{ appearance: "none" }}>
                  <option value="farmer" style={{ background: "var(--bg-secondary)" }}>Farmer</option>
                  <option value="expert" style={{ background: "var(--bg-secondary)" }}>Expert</option>
                </select>
              </>
            )}
            <input required type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <input required type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            <button type="submit" style={{ marginTop: "15px", padding: "12px", fontSize: "1.1rem" }}>
              {isLogin ? "Login" : "Register"}
            </button>
          </form>
          <p style={{ marginTop: "25px", cursor: "pointer", color: "var(--text-secondary)", fontSize: "0.95em", textAlign: "center", transition: "color 0.2s" }} 
             onClick={() => setIsLogin(!isLogin)}
             onMouseOver={(e) => e.target.style.color = "var(--text-primary)"}
             onMouseOut={(e) => e.target.style.color = "var(--text-secondary)"}>
            {isLogin ? "Need an account? Register here." : "Already have an account? Login here."}
          </p>
        </div>
      </div>
    </div>
  );
}
