import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./App.css";
import Login from "./Login";
import Profile from "./Profile";

const App = () => {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  // --- AUTH STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [showProfile, setShowProfile] = useState(false);

  // --- CORE APP STATE ---
  const [activeTab, setActiveTab] = useState("camera");
  const [image, setImage] = useState(null);
  const [emotion, setEmotion] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [songs, setSongs] = useState([]);
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const emotionIconMap = {
    happy: "fa-smile",
    sad: "fa-sad-tear",
    angry: "fa-angry",
    surprise: "fa-surprise",
    neutral: "fa-meh",
    fear: "fa-flushed",
    disgust: "fa-grimace",
  };

  // --- AUTH FUNCTIONS ---
  const handleLoginSuccess = (user) => {
    setUserName(user);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName("");
    localStorage.removeItem("email");
    setImage(null);
    setEmotion(null);
    setConfidence(null);
    setSongs([]);
    setCurrentTrack(null);
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
    setShowProfile(false);
  };

  // --- CORE HELPERS ---
  const dataURLtoFile = (dataurl, filename) => {
    if (!dataurl) return null;
    let arr = dataurl.split(","),
      mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    let mime = mimeMatch[1],
      bstr = atob(arr[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (error) {
      console.error("Camera access error:", error);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current && videoRef.current.srcObject) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageDataUrl = canvas.toDataURL("image/jpeg");
      setImage(imageDataUrl);
      const stream = video.srcObject;
      stream.getTracks().forEach((track) => track.stop());
      processImage(imageDataUrl);
    } else alert("Please start the camera first.");
  };

  const handleFile = (file) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target.result);
        processImage(e.target.result);
      };
      reader.readAsDataURL(file);
    } else alert("Please upload a valid image file (JPG, PNG).");
  };

  const handleImageUpload = (e) => handleFile(e.target.files[0]);
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const processImage = async (imageDataUrl) => {
    if (!imageDataUrl) return;
    setLoading(true);
    setEmotion(null);
    setConfidence(null);
    setSongs([]);
    setCurrentTrack(null);

    try {
      const imageFile = dataURLtoFile(imageDataUrl, "capture.jpeg");
      const formData = new FormData();
      formData.append("file", imageFile);
      const res = await axios.post("http://127.0.0.1:8000/detect-emotion", formData);
      const { emotion, confidence } = res.data;
      setEmotion(emotion);
      setConfidence(confidence);
      if (emotion) getMusicRecommendations(emotion);
      else setLoading(false);
    } catch (err) {
      console.error("Emotion detection error:", err);
      alert("Error detecting emotion. Please try again.");
      setLoading(false);
    }
  };

  const getMusicRecommendations = async (emotion) => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/recommendations", {
        params: { emotion, language },
      });
      setSongs(res.data);
      if (res.data.length > 0) setCurrentTrack(res.data[0]);
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      alert("Could not fetch songs. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const playTrack = (song) => {
    if (song && song.embed_url) setCurrentTrack(song);
    else alert("Preview unavailable for this song.");
  };

  const resetApp = () => {
    setImage(null);
    setEmotion(null);
    setConfidence(null);
    setSongs([]);
    setCurrentTrack(null);
  };

  const handleUploadNew = () => fileInputRef.current && fileInputRef.current.click();

  if (!isLoggedIn)
    return <Login onLoginSuccess={(u) => handleLoginSuccess(u)} />;

  if (showProfile)
    return (
      <Profile onBackHome={() => setShowProfile(false)} onLogout={handleLogout} />
    );

  return (
    <div className="app">
      <header className="app-header">
  <h1><i className="fas fa-smile"></i> EmoTune</h1>
  <div className="header-right">
    <p className="subtitle">Welcome, {userName.length > 15 ? userName.substring(0, 15) + '...' : userName}!</p>
    <button className="action-button profile-btn" onClick={() => setShowProfile(true)}>
      <i className="fas fa-user"></i> Profile
    </button>
    <button className="action-button logout-btn" onClick={handleLogout}>
      <i className="fas fa-sign-out-alt"></i> Logout
    </button>
    <button className="action-button theme-btn" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
    </button>
  </div>
</header>

<p className="subtitle">
  Detect your emotion and get music recommendations in your chosen language
</p>


      <div className="app-container">
        <div className="input-section">
          <div className="tab-buttons">
            <button
              className={`tab-button ${activeTab === "camera" ? "active" : ""}`}
              onClick={() => {
                resetApp();
                setActiveTab("camera");
              }}
            >
              <i className="fas fa-camera"></i> Camera
            </button>
            <button
              className={`tab-button ${activeTab === "upload" ? "active" : ""}`}
              onClick={() => {
                resetApp();
                setActiveTab("upload");
              }}
            >
              <i className="fas fa-upload"></i> Upload
            </button>
          </div>

          <div className="input-content">
            {activeTab === "camera" ? (
              !image ? (
                <>
                  <button className="action-button" onClick={startCamera}>
                    <i className="fas fa-camera"></i> Start Camera
                  </button>
                  <div className="camera-feed">
                    <video ref={videoRef} autoPlay playsInline></video>
                    <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
                  </div>
                  <button className="action-button capture" onClick={captureImage}>
                    <i className="fas fa-camera"></i> Capture Image
                  </button>
                </>
              ) : (
                <div className="image-preview">
                  <img src={image} alt="Captured" />
                  <button className="action-button" onClick={resetApp}>
                    <i className="fas fa-redo"></i> Capture New Image
                  </button>
                </div>
              )
            ) : (
              <div
                className={`upload-tab ${isDragging ? "dragging" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  id="fileInput"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                />
                {!image ? (
                  <>
                    <label htmlFor="fileInput" className="file-upload-label">
                      <i className="fas fa-cloud-upload-alt"></i> Choose Image or Drag Here
                    </label>
                    <p className="upload-hint">Supported formats: JPG, PNG, JPEG</p>
                  </>
                ) : (
                  <div className="image-preview">
                    <img src={image} alt="Uploaded" />
                    <button className="action-button" onClick={handleUploadNew}>
                      <i className="fas fa-redo"></i> Upload New Image
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="output-section">
          <div className="language-section">
            <label htmlFor="language-select" className="language-label">
              🌐 Select Language:
            </label>
            <select
              id="language-select"
              className="language-dropdown"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option>English</option>
              <option>Hindi</option>
              <option>Telugu</option>
              <option>Tamil</option>
              <option>Kannada</option>
              <option>Malayalam</option>
              <option>Punjabi</option>
              <option>Gujarati</option>
              <option>Bengali</option>
            </select>
          </div>

          <div className="emotion-section">
            <h2>
              <i className="fas fa-brain"></i> Emotion Detection
            </h2>
            {loading ? (
              <p>Analyzing emotion...</p>
            ) : emotion ? (
              <div className="emotion-result">
                <div className={`emotion-icon ${emotion}`}>
                  <i className={`fas ${emotionIconMap[emotion]}`}></i>
                </div>
                <div>
                  <div className={`emotion-text ${emotion}`}>
                    {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                  </div>
                  {confidence && (
                    <p className="confidence-text">
                      Confidence: <strong>{(confidence * 100).toFixed(2)}%</strong>
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p>Emotion will be displayed here after analysis</p>
            )}
          </div>

          <div className="music-section">
            <h2>
              <i className="fas fa-music"></i> Recommended Songs
            </h2>

            {currentTrack && (
              <iframe
                key={currentTrack.embed_url}
                title="Spotify Player"
                src={`${currentTrack.embed_url}?utm_source=generator`}
                width="100%"
                height="152"
                style={{ borderRadius: "12px", border: "none" }}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              ></iframe>
            )}

            {loading && songs.length === 0 ? (
              <p>Fetching recommendations...</p>
            ) : songs.length > 0 ? (
              <div className="song-list">
                {songs.map((song, index) => (
                  <div key={index} className="song-item">
                    <div className="album-art">
                      <img src={song.album_art} alt={song.title} />
                    </div>
                    <div>
                      <div>{song.title}</div>
                      <div>{song.artist}</div>
                    </div>
                    <button className="play-btn" onClick={() => playTrack(song)}>
                      <i className="fas fa-play"></i>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              !loading && emotion && <p>No songs found for this emotion/language.</p>
            )}
          </div>
        </div>
      </div>

      <footer className="app-footer">
        <p>EmoTune © 2025 | Powered by Infosys Springboard & Spotify API</p>
      </footer>
    </div>
  );
};

export default App;
