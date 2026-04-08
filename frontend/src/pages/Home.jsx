import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Navbar strictly for Landing Page */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", background: "var(--bg-glass)", borderBottom: "1px solid var(--glass-border)", backdropFilter: "blur(10px)" }}>
        <h1 style={{ margin: 0, color: "var(--accent-color)", display: "flex", alignItems: "center", gap: "10px", fontSize: "1.8rem" }}>
          🌱 HarvestMate
        </h1>
        <div style={{ display: "flex", gap: "15px" }}>
          <button onClick={() => navigate("/login")} style={{ background: "transparent", border: "1px solid var(--accent-color)", color: "var(--accent-color)" }}>Login</button>
          <button onClick={() => navigate("/login")} style={{ background: "var(--accent-color)", color: "white" }}>Get Started</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ 
          flex: 1, 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center", 
          textAlign: "center", 
          padding: "60px 20px",
          background: "linear-gradient(rgba(4, 16, 12, 0.8), rgba(4, 16, 12, 0.9)), url('https://images.unsplash.com/photo-1628183204780-4963e6ef6107?q=80&w=1920&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}>
        <h2 style={{ fontSize: "4rem", margin: "0 0 20px 0", color: "white", textShadow: "0 4px 10px rgba(0,0,0,0.5)" }}>
          Empowering Agriculture with <span style={{ color: "var(--accent-color)" }}>Smart Guidance</span>
        </h2>
        <p style={{ fontSize: "1.3rem", color: "var(--text-secondary)", maxWidth: "800px", lineHeight: "1.6", marginBottom: "40px" }}>
          HarvestMate connects hardworking farmers directly to specialized agricultural experts. Together, we can optimize yields, diagnose soil distress, and accurately track live market trends for maximum profitability.
        </p>
        <div style={{ display: "flex", gap: "20px" }}>
          <button onClick={() => navigate("/login")} style={{ fontSize: "1.2rem", padding: "15px 30px" }}>Join the Community</button>
          <button onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} style={{ fontSize: "1.2rem", padding: "15px 30px", background: "rgba(255,255,255,0.1)", border: "1px solid var(--glass-border)" }}>Learn More</button>
        </div>
      </section>

      {/* About & Mission */}
      <section id="mission" style={{ padding: "80px 40px", background: "var(--bg-primary)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "40px" }}>
          
          <div className="glass-panel" style={{ padding: "40px", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "20px" }}>🌾</div>
            <h3 style={{ fontSize: "1.5rem", color: "var(--accent-color)", marginBottom: "15px" }}>Our Mission</h3>
            <p style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>
              Our mission is to establish a unified ecosystem that democratizes access to professional agricultural advising. We believe every farmer deserves real-time, accurate forecasting to drive their success.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: "40px", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "20px" }}>📈</div>
            <h3 style={{ fontSize: "1.5rem", color: "var(--accent-color)", marginBottom: "15px" }}>Market Intelligence</h3>
            <p style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>
              Eliminate the guesswork in pricing. HarvestMate offers sophisticated market simulators and robust tracking dashboards so you can forecast the maximum return margin on your seasonal harvests.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: "40px", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "20px" }}>🧑‍🤝‍🧑</div>
            <h3 style={{ fontSize: "1.5rem", color: "var(--accent-color)", marginBottom: "15px" }}>Expert Network</h3>
            <p style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>
               Are you an experienced farmer? Apply to become a recognized Expert and share your lifetime of knowledge via Live Video & Audio sessions with younger growers seeking specialized tutelage.
            </p>
          </div>

        </div>
      </section>

      <footer style={{ background: "var(--bg-secondary)", padding: "30px", textAlign: "center", borderTop: "1px solid var(--glass-border)", color: "var(--text-secondary)" }}>
        <p>&copy; 2026 HarvestMate Platform. Promoting Sustainable Agriculture.</p>
      </footer>
    </div>
  );
}
