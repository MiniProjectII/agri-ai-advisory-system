import CropRecommendation from "./pages/CropRecommendation";
import Chatbot from "./pages/Chatbot";

export default function App() {
  return (
    <div>
      <h1>Agri AI Advisory System</h1>

      <CropRecommendation />

      <hr />

      <Chatbot />
    </div>
  );
}