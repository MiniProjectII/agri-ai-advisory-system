import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import Login from "./pages/Login";
import Home from "./pages/Home";
import CropRecommendation from "./pages/CropRecommendation";
import Chatbot from "./pages/Chatbot";
import Community from "./pages/Community";
import ExpertList from "./pages/ExpertList";
import ExpertDashboard from "./pages/ExpertDashboard";
import LiveChat from "./pages/LiveChat";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import ApplyExpert from "./pages/ApplyExpert";
import ExpertProfile from "./pages/ExpertProfile";
import Market from "./pages/Market";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app-page">
        <NavBar />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/ai-assistant" element={<Chatbot />} />
          <Route path="/crop-recommend" element={<CropRecommendation />} />
          <Route path="/community" element={<Community />} />
          <Route path="/experts" element={<ExpertList />} />
          <Route path="/expert-dashboard" element={<ExpertDashboard />} />
          <Route path="/chat" element={<LiveChat />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/apply-expert" element={<ApplyExpert />} />
          <Route path="/expert-profile" element={<ExpertProfile />} />
          <Route path="/market" element={<Market />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;