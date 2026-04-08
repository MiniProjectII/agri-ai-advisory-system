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
        <h3 style={{ margin: 0, color: "var(--accent-color)" }}>🌱 AgriAI</h3>
        
        {user.role === "farmer" && (
          <div style={{ display: "flex", gap: "20px", marginLeft: "20px" }}>
            <Link to="/ai-assistant">AI Assistant</Link>
            <Link to="/crop-recommend">Smart Crop</Link>
            <Link to="/community">Community</Link>
            <Link to="/experts">Find Expert</Link>
            <Link to="/profile">Profile</Link>
          </div>
        )}

        {user.role === "expert" && (
          <div style={{ display: "flex", gap: "20px", marginLeft: "20px" }}>
            <Link to="/expert-dashboard">Dashboard</Link>
            <Link to="/community">Community Forum</Link>
            <Link to="/expert-profile">Profile</Link>
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

        {showSettings && (
          <div className="glass-panel" style={{ 
            position: "absolute", top: "50px", right: "0", 
            padding: "15px", zIndex: 100, minWidth: "200px", 
            display: "flex", flexDirection: "column", gap: "12px",
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
        )}

        <button onClick={handleLogout} className="danger" style={{ padding: "8px 16px" }}>
          Logout
        </button>
      </div>
    </nav>
  );
}
