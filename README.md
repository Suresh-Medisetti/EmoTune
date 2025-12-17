# EmoTune – Emotion Aware Music Recommender System

EmoTune is an AI powered application that detects a user’s facial emotion in real time and recommends music tracks accordingly using Spotify.

## Features
Real time emotion detection using CNN
Emotion based music recommendation
Spotify API integration
Modern web interface

## Tech Stack
Frontend React
Backend FastAPI
Deep Learning TensorFlow Keras
Computer Vision OpenCV
Dataset RAF DB

## Architecture
React frontend captures user input
FastAPI backend handles emotion prediction
CNN model predicts emotion
Spotify API returns recommended tracks

## Dataset
RAF DB dataset is used for training.
Dataset is not included in this repository due to size constraints.
Download separately and place inside the data folder.

## How to Run Locally
Backend
pip install -r requirements.txt
uvicorn main:app --reload

Frontend
npm install
npm start

## Live Demo
Frontend URL Coming soon
Backend URL Coming soon
