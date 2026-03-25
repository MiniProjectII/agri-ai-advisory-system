import CropRecommendation from "./pages/CropRecommendation";
import Chatbot from "./pages/Chatbot";
import "./App.css";

function App() {
  return (
    <div className="app-page">
      <header className="app-header">
        <h1>Agri AI Advisory System</h1>
        <p>Smart crop guidance and farmer support using multi-agent AI</p>
      </header>

      <CropRecommendation />
      <Chatbot />
    </div>
  );
}

export default App;