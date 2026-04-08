import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";

export default function LiveChat() {
  const [searchParams] = useSearchParams();
  const farmerId = searchParams.get("farmer");
  const expertId = searchParams.get("expert");
  
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [farmerProfile, setFarmerProfile] = useState(null);
  
  // WebRTC States
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const [callApprovalRequired, setCallApprovalRequired] = useState(false);
  const [incomingOffer, setIncomingOffer] = useState(null);

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?._id;
  const userRole = user?.role;
  const chatRef = useRef(null);
  
  const room = [farmerId, expertId].sort().join("_");

  const stopMediaTracks = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }
  };

  useEffect(() => {
    if (!userId) {
      navigate("/");
      return;
    }

    const newSocket = io(`http://${window.location.hostname}:5000`);
    setSocket(newSocket);

    newSocket.emit("join_room", room);

    // Fetch old history
    axios.get(`http://${window.location.hostname}:5000/messages/${room}`)
      .then(res => setMessages(res.data))
      .catch(err => console.error("Could not fetch messages:", err));

    // Fetch Farmer Profile if expert
    if (userRole === "expert" && farmerId) {
      axios.get(`http://${window.location.hostname}:5000/memory/${farmerId}`)
        .then(res => setFarmerProfile(res.data))
        .catch(err => console.error("Could not fetch farmer profile:", err));
    }

    newSocket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    // WEBRTC SIGNALING
    newSocket.on("call-approval-required", (data) => {
      if (userRole === "expert") {
        setCallApprovalRequired(true);
        setIncomingOffer(data.offer);
        setIsAudioOnly(data.audioOnly);
      }
    });

    newSocket.on("incoming-call", (data) => {
      setIncomingOffer(data.offer);
      setIsAudioOnly(data.audioOnly);
    });

    newSocket.on("webrtc-answer", async (answer) => {
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(answer);
      }
    });

    newSocket.on("webrtc-ice", async (candidate) => {
      if (peerRef.current) {
        try {
          await peerRef.current.addIceCandidate(candidate);
        } catch (e) {}
      }
    });

    newSocket.on("call-ended", () => {
      endCallUI();
    });

    newSocket.on("call-rejected", () => {
      alert("Call was declined.");
      endCallUI();
    });

    return () => {
      stopMediaTracks();
      if (peerRef.current) peerRef.current.close();
      newSocket.close();
    };
  }, [room, userId, userRole, farmerId, navigate]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim() || !socket) return;
    
    const msgData = {
      room,
      sender: user._id,
      message
    };
    
    socket.emit("send_message", msgData);
    setMessages(prev => [...prev, msgData]);
    setMessage("");
  };

  const startLocalVideo = async (withVideo = true) => {
    setIsVideoActive(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: withVideo, audio: true });
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
  };

  const createPeer = () => {
    const peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peer.addTrack(track, localStreamRef.current);
      });
    }

    peer.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc-ice", { room, candidate: event.candidate });
      }
    };

    peerRef.current = peer;
    return peer;
  };

  const initiateCall = async (audioOnly) => {
    setIsAudioOnly(audioOnly);
    await startLocalVideo(!audioOnly); // Caller starts their stream immediately
    const peer = createPeer();
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    
    socket.emit("request-call", { room, farmer_id: farmerId, expert_id: expertId, role: userRole, audioOnly, offer });
  };

  const approveCall = () => {
    setCallApprovalRequired(false);
    socket.emit("approve-call", { room, farmer_id: farmerId, expert_id: expertId, audioOnly: isAudioOnly, offer: incomingOffer });
  };

  const rejectCall = () => {
    setCallApprovalRequired(false);
    socket.emit("reject-call", { room });
  };

  const acceptIncomingVideo = async () => {
    await startLocalVideo(!isAudioOnly);
    const peer = createPeer();
    await peer.setRemoteDescription(incomingOffer);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    socket.emit("webrtc-answer", { room, answer });
    setIncomingOffer(null);
  };

  const endCall = () => {
    socket.emit("end-call", room);
    endCallUI();
  };

  const endCallUI = () => {
    setIsVideoActive(false);
    setIncomingOffer(null);
    setCallApprovalRequired(false);
    stopMediaTracks();
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
  };

  return (
    <div style={{ display: "flex", gap: "20px", maxWidth: "900px", margin: "20px auto", padding: "0 20px" }}>
      <div className="glass-panel" style={{ flex: 1, display: "flex", flexDirection: "column", height: "70vh", overflow: "hidden" }}>
        
        <div style={{ padding: "15px", background: "rgba(0,0,0,0.2)", borderBottom: "1px solid var(--glass-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: "bold", color: "var(--accent-color)" }}>Live Discussion Room</span>
          {!isVideoActive && (
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => initiateCall(true)} style={{ background: "var(--accent-color)", padding: "5px 15px", fontSize: "0.9em" }}>📞 Audio Call</button>
              <button onClick={() => initiateCall(false)} style={{ background: "var(--emerald-primary)", padding: "5px 15px", fontSize: "0.9em" }}>📹 Video Call</button>
            </div>
          )}
          {isVideoActive && <button onClick={endCall} className="danger" style={{ padding: "5px 15px", fontSize: "0.9em" }}>End Call ❌</button>}
        </div>

        {/* Video Area (Only visible when active or waiting) */}
        {callApprovalRequired && (
          <div style={{ padding: "15px", background: "rgba(255,165,0,0.2)", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <p style={{ margin: "0 0 10px 0" }}>Farmer wants to start a video call.</p>
            <button onClick={approveCall} style={{ marginRight: "10px", background: "var(--emerald-primary)" }}>Accept</button>
            <button onClick={rejectCall} className="danger">Deny</button>
          </div>
        )}

        {incomingOffer && !isVideoActive && (
          <div style={{ padding: "15px", background: "rgba(0,165,255,0.2)", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
             <p style={{ margin: "0 0 10px 0" }}>Incoming {isAudioOnly ? "Audio" : "Video"} Call...</p>
             <button onClick={acceptIncomingVideo} style={{ background: "var(--emerald-primary)" }}>Join Call</button>
          </div>
        )}

        {isVideoActive && !isAudioOnly && (
          <div style={{ display: "flex", gap: "10px", padding: "15px", background: "#000", borderBottom: "1px solid var(--glass-border)", height: "200px" }}>
             <div style={{ flex: 1, background: "#222", borderRadius: "8px", overflow: "hidden", position: "relative" }}>
               <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
               <span style={{ position: "absolute", bottom: 5, left: 10, background: "rgba(0,0,0,0.5)", padding: "2px 5px", borderRadius: "4px", fontSize: "0.8em" }}>Remote</span>
             </div>
             <div style={{ width: "150px", background: "#222", borderRadius: "8px", overflow: "hidden", position: "relative" }}>
               <video ref={localVideoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
               <span style={{ position: "absolute", bottom: 5, left: 10, background: "rgba(0,0,0,0.5)", padding: "2px 5px", borderRadius: "4px", fontSize: "0.8em" }}>You</span>
             </div>
          </div>
        )}

        {isVideoActive && isAudioOnly && (
           <div style={{ padding: "15px", background: "var(--accent-color)", color: "white", textAlign: "center", borderBottom: "1px solid var(--glass-border)" }}>
             <p style={{ margin: 0, fontWeight: "bold" }}>📞 Audio Call in Progress</p>
             <audio ref={remoteVideoRef} autoPlay playsInline style={{ display: "none" }} />
           </div>
        )}

        <div ref={chatRef} style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "15px" }}>
          {messages.map((msg, i) => {
            const isMe = msg.sender === userId;
            return (
              <div key={i} style={{ 
                alignSelf: isMe ? "flex-end" : "flex-start", 
                background: isMe ? "var(--accent-color)" : "var(--bg-secondary)", 
                color: isMe ? "white" : "var(--text-primary)",
                border: isMe ? "none" : "1px solid var(--glass-border)", 
                padding: "12px 18px", 
                borderRadius: isMe ? "20px 20px 0 20px" : "20px 20px 20px 0", 
                maxWidth: "75%",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
              }}>
                {msg.message}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", padding: "15px", borderTop: "1px solid var(--glass-border)", background: "rgba(0,0,0,0.1)" }}>
          <input 
            style={{ flex: 1 }} 
            value={message} 
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
          />
          <button onClick={sendMessage} style={{ marginLeft: "15px" }}>Send</button>
        </div>
      </div>

      {userRole === "expert" && (
        <div className="glass-panel" style={{ width: "280px", padding: "20px", height: "fit-content" }}>
          <h3 style={{ margin: "0 0 15px 0", color: "var(--accent-color)", borderBottom: "1px solid var(--glass-border)", paddingBottom: "10px" }}>
            🧑‍🌾 Farmer Profile
          </h3>
          {farmerProfile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.95em" }}>
              <p style={{ margin: 0 }}><strong>Name:</strong> {farmerProfile.name || "Unknown"}</p>
              <p style={{ margin: 0 }}><strong>Location:</strong> {farmerProfile.location || "Not set"}</p>
              <p style={{ margin: 0 }}><strong>Soil Type:</strong> {farmerProfile.soilType || "Not set"}</p>
              <p style={{ margin: 0 }}><strong>History:</strong> {farmerProfile.previousCrops?.join(", ") || "None"}</p>
            </div>
          ) : (
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9em" }}>Farmer hasn't filled profile details yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
