from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import cv2
from tensorflow.keras.models import load_model
import os
from dotenv import load_dotenv
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import sqlite3
from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Body
from fastapi.staticfiles import StaticFiles
import shutil
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart



# --- SETUP ---
load_dotenv()
app = FastAPI()

origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# ====================== DATABASE SETUP ======================
conn = sqlite3.connect("emotune_users.db", check_same_thread=False)
cursor = conn.cursor()
cursor.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstname TEXT,
    lastname TEXT,
    email TEXT UNIQUE,
    password TEXT
)
""")
conn.commit()

def insert_user(firstname, lastname, email, password):
    cursor.execute("INSERT INTO users (firstname, lastname, email, password) VALUES (?, ?, ?, ?)",
                   (firstname, lastname, email, password))
    conn.commit()

def get_user_by_email(email):
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    return cursor.fetchone()

# ====================== MODEL & SPOTIFY SETUP ======================
try:
    model = load_model('emotion_model.h5')
    face_cascade = cv2.CascadeClassifier('haarcascade_frontalface_default.xml')
    if face_cascade.empty():
        raise IOError("Could not load haarcascade file.")
    print("✅ Model and face cascade loaded successfully.")
except Exception as e:
    model, face_cascade = None, None
    print(f"❌ CRITICAL ERROR: Could not load model or cascade file. {e}")

SPOTIPY_CLIENT_ID = os.getenv("SPOTIPY_CLIENT_ID")
SPOTIPY_CLIENT_SECRET = os.getenv("SPOTIPY_CLIENT_SECRET")
sp = None
if SPOTIPY_CLIENT_ID and SPOTIPY_CLIENT_SECRET:
    try:
        client_credentials_manager = SpotifyClientCredentials(
            client_id=SPOTIPY_CLIENT_ID,
            client_secret=SPOTIPY_CLIENT_SECRET
        )
        sp = spotipy.Spotify(client_credentials_manager=client_credentials_manager)
    except:
        sp = None

EMOTION_LABELS = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
MODEL_INPUT_SIZE = (75, 75)
EMOTION_TO_GENRE = {
    'happy': 'pop',
    'sad': 'acoustic',
    'angry': 'rock',
    'neutral': 'chill',
    'surprise': 'electronic',
    'fear': 'ambient',
    'disgust': 'metal'
}

# ====================== AUTH ROUTES ======================
class RegisterModel(BaseModel):
    firstname: str
    lastname: str
    email: str
    password: str

class LoginModel(BaseModel):
    email: str
    password: str
class ForgotPasswordModel(BaseModel):
    email: str
    new_password: str

@app.post("/register")
async def register_user(user: RegisterModel):
    existing = get_user_by_email(user.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists.")
    insert_user(user.firstname, user.lastname, user.email, user.password)
    return {"message": "User registered successfully"}

@app.post("/login")
async def login_user(user: LoginModel):
    db_user = get_user_by_email(user.email)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found.")
    if db_user[4] != user.password:
        raise HTTPException(status_code=401, detail="Incorrect password.")
    return {"message": "Login successful", "username": db_user[1]}  # firstname
@app.post("/check-user")
async def check_user(data: dict):
    email = data.get("email", "").strip().lower()
    cursor.execute("SELECT * FROM users WHERE email=?", (email,))
    user = cursor.fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return {"message": "User exists"}


@app.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordModel):
    """
    Simple 'forgot password' handler (no OTP).
    Expects JSON: { "email": "...", "new_password": "..." }
    """
    email = payload.email.strip().lower()
    new_password = payload.new_password

    # Basic validation
    if not email or not new_password:
        raise HTTPException(status_code=400, detail="Email and new password are required.")

    # Check user exists
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with that email.")

    # Update password in DB
    try:
        cursor.execute("UPDATE users SET password = ? WHERE email = ?", (new_password, email))
        conn.commit()
        return {"message": "Password updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
@app.post("/send-reset-link")
async def send_reset_link(email: str = Form(...)):
    """Send a real password reset link to the registered email."""
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="Email not registered.")

    reset_link = f"{os.getenv('FRONTEND_URL')}/reset-password?email={email}"

    sender_email = os.getenv("EMAIL_USER")
    sender_pass = os.getenv("EMAIL_PASS")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "EmoTune - Password Reset Request"
    msg["From"] = sender_email
    msg["To"] = email

    html_content = f"""
    <html>
      <body style="font-family: Arial; color: #333;">
        <h2>EmoTune Password Reset</h2>
        <p>Hi {user[1]},</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="{reset_link}" style="background: #4A00E0; color: white; padding: 10px 15px; border-radius: 5px; text-decoration: none;">Reset Password</a></p>
        <br>
        <p>If you didn’t request this, please ignore this email.</p>
        <p>🎵 EmoTune Support Team</p>
      </body>
    </html>
    """

    msg.attach(MIMEText(html_content, "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_pass)
            server.sendmail(sender_email, email, msg.as_string())
        return {"message": f"Reset link sent successfully to {email}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {e}")


# ====================== PROFILE ROUTES ======================

# ====================== PROFILE ROUTES ======================

@app.get("/profile")
async def get_profile(email: str):
    """Fetch user details by email."""
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    # user columns: id, firstname, lastname, email, password, profile_pic (maybe)
    profile_pic = None
    try:
        profile_pic_val = user[5] if len(user) > 5 else None
        if profile_pic_val:
            # if stored value already looks like URL, use it, otherwise build URL
            if profile_pic_val.startswith("http"):
                profile_pic = profile_pic_val
            else:
                # profile_pic_val may be stored as path like 'uploads/<file>'
                filename = os.path.basename(profile_pic_val)
                profile_pic = f"http://127.0.0.1:8000/uploads/{filename}"
    except Exception:
        profile_pic = None

    return {
        "firstname": user[1],
        "lastname": user[2],
        "email": user[3],
        "profile_pic": profile_pic
    }


@app.post("/upload-profile-pic")
async def upload_profile_pic(email: str = Form(...), file: UploadFile = File(...)):
    """Save user's profile picture locally and store public URL in DB."""
    # sanitize filename: use email-based name to avoid collisions
    filename = f"{email.replace('@', '_at_')}.jpg"
    file_path = os.path.join("uploads", filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # store URL (not absolute filesystem path) so frontend can use it directly
    url = f"http://127.0.0.1:8000/uploads/{filename}"
    cursor.execute("UPDATE users SET profile_pic=? WHERE email=?", (url, email))
    conn.commit()
    return {"message": "Profile picture uploaded", "url": url}


@app.post("/change-password")
async def change_password(email: str = Form(...), old_password: str = Form(...), new_password: str = Form(...)):
    """Change user password after verifying old password."""
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user[4] != old_password:
        raise HTTPException(status_code=401, detail="Old password is incorrect.")

    cursor.execute("UPDATE users SET password=? WHERE email=?", (new_password, email))
    conn.commit()
    return {"message": "Password changed successfully"}

# --- Serve uploaded images ---
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# --- Upload profile picture ---
@app.post("/upload-profile-pic")
async def upload_profile_pic(email: str = Form(...), file: UploadFile = File(...)):
    """Save user's profile picture locally."""
    filename = f"{email.replace('@', '_at_')}.jpg"
    file_path = os.path.join("uploads", filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    cursor.execute("UPDATE users SET profile_pic=? WHERE email=?", (file_path, email))
    conn.commit()
    return {"message": "Profile picture uploaded", "url": f"http://127.0.0.1:8000/uploads/{filename}"}

# --- Add a column if not existing ---
try:
    cursor.execute("ALTER TABLE users ADD COLUMN profile_pic TEXT")
except:
    pass

# ====================== CORE ROUTES ======================

@app.get("/")
def read_root():
    return {"message": "EmoTune Backend is running!"}

@app.post("/detect-emotion")
async def detect_emotion(file: UploadFile = File(...)):
    if not model or not face_cascade:
        raise HTTPException(status_code=500, detail="Model or face detector not loaded")

    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image file")

    gray_frame = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(
        gray_frame,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(60, 60)   # 🔸 slightly higher minimum size = fewer false positives
    )

    if len(faces) == 0:
        # 🚨 Stop right here — don't predict anything
        raise HTTPException(status_code=400, detail="No face detected. Please face the camera clearly.")

    # If multiple faces are found, pick the largest one (main subject)
    faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
    (x, y, w, h) = faces[0]
    face_roi = img[y:y + h, x:x + w]

    # Preprocess and predict
    rgb_face = cv2.cvtColor(face_roi, cv2.COLOR_BGR2RGB)
    resized_face = cv2.resize(rgb_face, MODEL_INPUT_SIZE)
    normalized_face = resized_face / 255.0
    input_face = np.expand_dims(normalized_face, axis=0)

    predictions = model.predict(input_face, verbose=0)
    predicted_emotion_index = np.argmax(predictions)
    predicted_emotion = EMOTION_LABELS[predicted_emotion_index]
    confidence = float(np.max(predictions))

    return {"emotion": predicted_emotion, "confidence": confidence}

@app.get("/recommendations")
def get_recommendations(emotion: str, language: str = "English"):
    if not sp:
        raise HTTPException(status_code=500, detail="Spotify client not configured")

    # Map emotion → mood keyword instead of just genre
    EMOTION_KEYWORDS = {
        "happy": ["happy", "joyful", "party", "feel good"],
        "sad": ["sad", "melancholy", "emotional", "slow"],
        "angry": ["rock", "aggressive", "power", "metal"],
        "neutral": ["chill", "lofi", "calm", "relax"],
        "surprise": ["upbeat", "electronic", "excited", "fun"],
        "fear": ["ambient", "dark", "cinematic"],
        "disgust": ["metal", "hard rock"]
    }

    LANGUAGE_KEYWORDS = {
        "English": "",
        "Hindi": "Bollywood OR Hindi OR Indian pop",
        "Telugu": "Telugu OR Tollywood",
        "Tamil": "Tamil OR Kollywood",
        "Kannada": "Kannada OR Sandalwood",
        "Malayalam": "Malayalam",
        "Punjabi": "Punjabi OR Bhangra",
        "Gujarati": "Gujarati",
        "Bengali": "Bengali OR Bangla"
    }

    emotion_terms = EMOTION_KEYWORDS.get(emotion.lower(), ["pop"])
    lang_terms = LANGUAGE_KEYWORDS.get(language, "")

    all_tracks = []

    try:
        # Try multiple emotion-related queries until we find songs
        for term in emotion_terms:
            query = f"{term} {lang_terms}".strip()
            results = sp.search(q=query, type='track', limit=30)
            tracks = results.get('tracks', {}).get('items', [])
            for track in tracks:
                if track and track.get('id'):
                    all_tracks.append({
                        "title": track['name'],
                        "artist": track['artists'][0]['name'],
                        "album_art": track['album']['images'][0]['url'] if track['album']['images'] else None,
                        "preview_url": track['preview_url'],
                        "embed_url": f"https://open.spotify.com/embed/track/{track['id']}"
                    })

            if len(all_tracks) >= 10:
                break  # stop once we have enough songs

        # Fallback if nothing found at all
        if not all_tracks:
            fallback_query = f"{language} {emotion} songs"
            results = sp.search(q=fallback_query, type='track', limit=30)
            tracks = results.get('tracks', {}).get('items', [])
            all_tracks = [{
                "title": t['name'],
                "artist": t['artists'][0]['name'],
                "album_art": t['album']['images'][0]['url'] if t['album']['images'] else None,
                "preview_url": t['preview_url'],
                "embed_url": f"https://open.spotify.com/embed/track/{t['id']}"
            } for t in tracks if t.get('id')]

        if not all_tracks:
            raise HTTPException(status_code=404, detail="No tracks found for the given emotion and language.")

        return all_tracks[:10]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Spotify API error: {e}")
