import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function NavBar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const [showSettings, setShowSettings] = useState(false);
  const [isLgFont, setIsLgFont] = useState(false);

  useEffect(() => {
    if (isLgFont) document.body.classList.add("lg-font");
    else document.body.classList.remove("lg-font");
  }, [isLgFont]);

  useEffect(() => {
    // Inject Google Translate script when settings are opened
    // Or we can just inject it on mount
    const addScript = document.createElement("script");
    addScript.setAttribute("src", "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit");
    document.body.appendChild(addScript);

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        { pageLanguage: 'en', includedLanguages: 'hi,te,en', layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE },
        'google_translate_element'
      );
    };
  }, []);

  if (!user) return null; // Don't show nav if not logged in

  return (
    <nav className="glass-panel" style={{
      display: "flex",
      gap: "20px",
      padding: "15px 30px",
      margin: "20px",
      borderRadius: "15px",
      justifyContent: "space-between",
      alignItems: "center"
    }}>
      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        <h3 style={{ margin: 0, color: "var(--accent-color)" }}>🌱 HarvestMate</h3>

        {(user.role === "farmer" || user.role === "farmer_expert") && (
          <div style={{ display: "flex", gap: "10px", marginLeft: "20px", alignItems: "center", flexWrap: "wrap", maxWidth: "100%" }}>
            <Link to="/ai-assistant" className="nav-link">Smart Advisor</Link>
            <Link to="/community" className="nav-link">Community</Link>
            <Link to="/experts" className="nav-link">Find Expert</Link>
            <Link to="/market" className="nav-link">Market</Link>
            <Link to="/profile" className="nav-link">Profile</Link>
            {user.role === "farmer" && user.originalRole !== "farmer_expert" && (
              <Link to="/apply-expert" className="nav-link" style={{ background: "var(--harvest-gold)", color: "white", borderColor: "var(--harvest-gold)", marginLeft: "auto" }}>
                ⭐ Apply as Expert
              </Link>
            )}
          </div>
        )}

        {(user.role === "expert" || user.role === "farmer_expert") && (
          <div style={{ display: "flex", gap: "10px", marginLeft: "20px", borderLeft: user.role === "farmer_expert" ? "2px solid var(--glass-border)" : "none", paddingLeft: user.role === "farmer_expert" ? "20px" : "0", flexWrap: "wrap" }}>
            <Link to="/expert-dashboard" className="nav-link">Expert Portal</Link>
            <Link to="/community" className="nav-link">Community</Link>
            <Link to="/expert-profile" className="nav-link">Expert Profile</Link>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "15px", alignItems: "center", position: "relative" }}>
        <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>👤 {user.name}</span>

        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{ padding: "8px 12px", background: "rgba(255,255,255,0.1)", color: "var(--text-primary)" }}>
          ⚙️
        </button>

        <div className="glass-panel" style={{
          position: "absolute", top: "50px", right: "0",
          padding: "15px", zIndex: 99999, minWidth: "200px",
          display: showSettings ? "flex" : "none", flexDirection: "column", gap: "12px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
        }}>
          <h4 style={{ margin: "0 0 5px 0", color: "var(--emerald-primary)", fontSize: "1rem" }}>Accessibility</h4>

          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: "var(--text-primary)" }}>
            <input type="checkbox" checked={isLgFont} onChange={e => setIsLgFont(e.target.checked)} />
            Large Font
          </label>

          <h4 style={{ margin: "10px 0 5px 0", color: "var(--emerald-primary)", fontSize: "1rem" }}>Live Translation</h4>
          <div id="google_translate_element"></div>
        </div>

        <button onClick={handleLogout} className="danger" style={{ padding: "8px 16px" }}>
          Logout
        </button>
      </div>
    </nav >
  );
}
