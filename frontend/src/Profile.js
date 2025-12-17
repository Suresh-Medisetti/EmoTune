import React, { useEffect, useState } from "react";
import "./Profile.css";
import axios from "axios";

export default function Profile({ onBackHome, onLogout }) {
  const [profile, setProfile] = useState({
    firstname: "",
    lastname: "",
    email: "",
    profile_pic: null,
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [pwd, setPwd] = useState({ old_password: "", new_password: "" });

  const API_BASE = "http://127.0.0.1:8000";
  const email = localStorage.getItem("email");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!email) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${API_BASE}/profile`, { params: { email } });
        setProfile({
          firstname: res.data.firstname || "",
          lastname: res.data.lastname || "",
          email: res.data.email || "",
          profile_pic: res.data.profile_pic || null,
        });
      } catch (err) {
        console.error("Profile fetch error:", err);
        alert(err.response?.data?.detail || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [email]);

  const onFieldChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });

  const saveProfile = async () => {
    try {
      await axios.put(`${API_BASE}/update-profile`, {
        firstname: profile.firstname,
        lastname: profile.lastname,
        email: profile.email,
        password: "", // not changing here
      });
      setEditing(false);
      alert("Profile updated.");
    } catch (err) {
      console.error("Update error:", err);
      alert(err.response?.data?.detail || "Failed to update profile.");
    }
  };

  const onPickImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview immediately
    const previewUrl = URL.createObjectURL(file);
    setProfile({ ...profile, profile_pic: previewUrl });

    // Upload instantly
    const fd = new FormData();
    fd.append("email", profile.email || email);
    fd.append("file", file);
    try {
      const res = await axios.post(`${API_BASE}/upload-profile-pic`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data.url;
      setProfile((p) => ({ ...p, profile_pic: url }));
      alert("Profile picture updated.");
    } catch (err) {
      console.error("Upload error:", err);
      alert(err.response?.data?.detail || "Failed to upload image.");
    }
  };

  const changePassword = async () => {
    if (!pwd.old_password || !pwd.new_password)
      return alert("Fill both password fields.");
    try {
      const form = new FormData();
      form.append("email", profile.email || email);
      form.append("old_password", pwd.old_password);
      form.append("new_password", pwd.new_password);
      await axios.post(`${API_BASE}/change-password`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Password changed.");
      setPwd({ old_password: "", new_password: "" });
    } catch (err) {
      console.error("pwd change error:", err);
      alert(err.response?.data?.detail || "Failed to change password.");
    }
  };

  if (loading) return <div className="profile-loading">Loading profile...</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="left">
          <button className="small-btn" onClick={onBackHome}>
            🏠 Home
          </button>
        </div>
        <h2>My Profile</h2>
        <div className="right">
          <button
            className="small-btn danger"
            onClick={() => {
              if (onLogout) onLogout();
              else {
                localStorage.removeItem("email");
                window.location.reload();
              }
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      <div className="profile-main">
        <div className="profile-left">
          <div className="avatar-wrap">
            <label htmlFor="avatarInput" className="avatar-label">
              <img
                src={
                  profile.profile_pic ||
                  `${API_BASE}/uploads/${(profile.email || email || "").replace("@", "_at_")}.jpg`
                }
                alt="avatar"
                className="avatar-img"
                onError={(e) => {
                  e.target.src =
                    "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                }}
              />
            </label>
            <input
              id="avatarInput"
              type="file"
              accept="image/*"
              onChange={onPickImage}
              style={{ display: "none" }}
            />
            <p style={{ marginTop: 8, fontSize: "0.9rem", opacity: 0.7 }}>
              Click image to change
            </p>
          </div>
        </div>

        <div className="profile-right">
          <div className="field">
            <label>First Name</label>
            <input
              name="firstname"
              value={profile.firstname}
              onChange={onFieldChange}
              disabled={!editing}
            />
          </div>

          <div className="field">
            <label>Last Name</label>
            <input
              name="lastname"
              value={profile.lastname}
              onChange={onFieldChange}
              disabled={!editing}
            />
          </div>

          <div className="field">
            <label>Email</label>
            <input
              name="email"
              value={profile.email}
              onChange={onFieldChange}
              disabled
            />
          </div>

          <div className="actions">
            {editing ? (
              <>
                <button className="btn" onClick={saveProfile}>
                  Save
                </button>
                <button className="btn ghost" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              </>
            ) : (
              <button className="btn" onClick={() => setEditing(true)}>
                Edit Profile
              </button>
            )}
          </div>

          <hr style={{ margin: "18px 0" }} />

          <div className="change-pass">
            <h3>Change Password</h3>
            <input
              type="password"
              placeholder="Current password"
              value={pwd.old_password}
              onChange={(e) =>
                setPwd({ ...pwd, old_password: e.target.value })
              }
            />
            <input
              type="password"
              placeholder="New password"
              value={pwd.new_password}
              onChange={(e) =>
                setPwd({ ...pwd, new_password: e.target.value })
              }
            />
            <div style={{ marginTop: 8 }}>
              <button className="btn" onClick={changePassword}>
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
