import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Community() {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [activePost, setActivePost] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [newAnswer, setNewAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasAnswersMap, setHasAnswersMap] = useState({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`http://${window.location.hostname}:5000/posts`);
      setPosts(res.data);
      res.data.forEach(async (post) => {
         const ansReq = await axios.get(`http://${window.location.hostname}:5000/answers/${post._id}`);
         if (ansReq.data.length > 0) {
            setHasAnswersMap(prev => ({...prev, [post._id]: true}));
         }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const [news, setNews] = useState([]);

  useEffect(() => {
    fetchPosts();
    // Fetch News
    axios.get(`http://${window.location.hostname}:5000/api/agri-news`)
      .then(res => setNews(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await axios.post(`http://${window.location.hostname}:5000/create-post`, {
        farmer_id: user._id,
        title,
        description
      });
      setTitle("");
      setDescription("");
      setIsFormOpen(false);
      fetchPosts();
    } catch (err) {
      alert("Error sharing post");
    } finally {
      setLoading(false);
    }
  };

  const loadAnswers = async (postId) => {
    if (activePost === postId) {
      setActivePost(null);
      return;
    }
    try {
      const res = await axios.get(`http://${window.location.hostname}:5000/answers/${postId}`);
      setAnswers(res.data);
      setActivePost(postId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddAnswer = async (postId) => {
    if (!newAnswer.trim()) return;
    try {
      await axios.post(`http://${window.location.hostname}:5000/add-answer`, {
        post_id: postId,
        expert_id: user._id,
        answer_text: newAnswer
      });
      setNewAnswer("");
      loadAnswers(postId); // re-fetch answers
    } catch (err) {
      alert("Error adding comment");
    }
  };

  const handleReplyPrivately = (farmerId) => {
    if (user.role === "farmer") {
      alert("Only an expert can initiate a private reply from the forum.");
      return;
    }
    navigate(`/chat?farmer=${farmerId}&expert=${user._id}`);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "7fr 3fr", gap: "20px", maxWidth: "1200px", margin: "20px auto", padding: "20px" }}>
      {/* LEFT SIDE: Community Forum */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ color: "var(--accent-color)", margin: 0 }}>🌍 Community Forum</h2>
          {user?.role === "farmer" && (
            <button onClick={() => setIsFormOpen(!isFormOpen)} style={{ padding: "8px 16px", borderRadius: "20px" }}>
              {isFormOpen ? "Cancel" : "✏️ Ask Question"}
            </button>
          )}
        </div>
        
        {user?.role === "farmer" && isFormOpen && (
          <form className="glass-panel" onSubmit={handleCreatePost} style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "30px", padding: "20px" }}>
            <h4 style={{ margin: "0 0 10px 0" }}>Create a New Post</h4>
            <input required placeholder="Question Title" value={title} onChange={e => setTitle(e.target.value)} />
            <textarea required placeholder="Describe your issue..." value={description} onChange={e => setDescription(e.target.value)} style={{ minHeight: "80px", resize: "vertical" }} />
            <button type="submit" style={{ marginTop: "10px", alignSelf: "flex-end", opacity: loading ? 0.7 : 1 }} disabled={loading}>
              {loading ? "Posting..." : "Post Question"}
            </button>
          </form>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {posts.map(post => (
            <div key={post._id} className="glass-panel" style={{ padding: "20px" }}>
              <h3 style={{ margin: "0 0 10px 0", color: "var(--text-primary)" }}>{post.title}</h3>
              <p style={{ margin: "0 0 15px 0", color: "var(--text-secondary)", lineHeight: 1.6 }}>{post.description}</p>
              <div style={{ fontSize: "0.85em", color: "var(--accent-color)", marginBottom: "15px" }}>
                Posted by: {post.farmer_id?.name || "Unknown"} on {new Date(post.createdAt).toLocaleDateString()}
              </div>
              
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button 
                  onClick={() => loadAnswers(post._id)}
                  style={{ background: "transparent", border: "1px solid var(--accent-color)", color: "var(--accent-color)" }}
                >
                  {hasAnswersMap[post._id] && activePost !== post._id && <span style={{marginRight: "6px"}}>🔴</span>}
                  {activePost === post._id ? "Hide Comments" : "View Comments"}
                </button>

                {user?.role === "expert" && (
                  <button 
                    onClick={() => handleReplyPrivately(post.farmer_id?._id || post.farmer_id)}
                  >
                    Reply Privately
                  </button>
                )}
              </div>

              {activePost === post._id && (
                <div style={{ marginTop: "15px", padding: "15px", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}>
                  <h4 style={{ margin: "0 0 10px 0" }}>Comments</h4>
                  {answers.length === 0 ? <p style={{ color: "var(--text-secondary)" }}>No comments yet.</p> : (
                    <ul style={{ paddingLeft: "0", listStyle: "none", margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                      {answers.map(ans => (
                        <li key={ans._id} style={{ background: "var(--bg-secondary)", padding: "10px 15px", borderRadius: "6px" }}>
                          <strong style={{ color: "var(--accent-color)" }}>{ans.expert_id?.name || "Expert"}:</strong> 
                          <span style={{ marginLeft: "8px" }}>{ans.answer_text}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  {user?.role === "expert" && (
                    <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                      <input 
                        style={{ flex: 1 }} 
                        placeholder="Write a comment..." 
                        value={newAnswer} 
                        onChange={e => setNewAnswer(e.target.value)} 
                      />
                      <button onClick={() => handleAddAnswer(post._id)}>Send</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE: Farming Newsfeed */}
      <div>
        <h3 style={{ color: "var(--accent-color)", marginBottom: "20px" }}>📰 Live Farming News</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {news.length === 0 ? <p>Loading news...</p> : news.map((item, idx) => (
            <a key={idx} href={item.url} target="_blank" rel="noopener noreferrer" className="glass-panel" style={{ padding: "15px", display: "block", textDecoration: "none" }}>
              <h4 style={{ margin: "0 0 8px 0", color: "var(--text-primary)", fontSize: "1rem" }}>{item.title}</h4>
              <p style={{ margin: 0, fontSize: "0.85em", color: "var(--text-secondary)" }}>
                👍 {item.score} • by u/{item.author}
              </p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
