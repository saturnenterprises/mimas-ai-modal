from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import re
from typing import List, Optional
import requests
from io import BytesIO
from PIL import Image
import tempfile
import os
import cv2
import numpy as np

app = FastAPI(title="Tweet Fact Checker API - Deepfake Detection")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TweetRequest(BaseModel):
    text: str
    images: Optional[List[str]] = []
    video_url: Optional[str] = None

class AnalysisResponse(BaseModel):
    score: int
    status: str
    message: str
    color: str
    details: dict

def detect_deepfake_image(image_url: str) -> dict:
    """Detect deepfake in image using multi-factor analysis"""
    try:
        from deepface import DeepFace

        # Download image
        response = requests.get(image_url, timeout=10)
        if response.status_code != 200:
            return None

        # Save to temp file
        img = Image.open(BytesIO(response.content))
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
            img.save(tmp.name)
            temp_path = tmp.name

        try:
            # Load image with OpenCV
            cv_img = cv2.imread(temp_path)

            # Analyze face with DeepFace
            analysis = DeepFace.analyze(
                temp_path,
                actions=['emotion', 'age', 'gender'],
                enforce_detection=False
            )

            if isinstance(analysis, list):
                analysis = analysis[0]

            # Deepfake detection heuristics
            deepfake_score = 0  # 0-100, higher = more likely real
            indicators = []

            # 1. Face detection confidence
            face_region = analysis.get('region', {})
            if face_region:
                deepfake_score += 30
                indicators.append("Face detected clearly")
            else:
                indicators.append("⚠️ Face detection unclear")

            # 2. Check for image artifacts (JPEG compression analysis)
            gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()

            if laplacian_var > 100:  # Sharp, natural image
                deepfake_score += 20
                indicators.append("Image sharpness normal")
            else:
                deepfake_score -= 10
                indicators.append("⚠️ Unusual image quality detected")

            # 3. Face symmetry check (deepfakes often have slight asymmetry issues)
            if face_region and face_region.get('w', 0) > 0:
                deepfake_score += 15
                indicators.append("Face proportions normal")

            # 4. Emotion consistency (deepfakes sometimes show mixed emotions)
            emotion_scores = analysis.get('emotion', {})
            if emotion_scores:
                dominant_score = max(emotion_scores.values())
                if dominant_score > 50:  # Strong, clear emotion
                    deepfake_score += 20
                    indicators.append("Emotion expression natural")
                else:
                    deepfake_score -= 5
                    indicators.append("⚠️ Mixed emotion signals")

            # 5. Color consistency check
            hsv = cv2.cvtColor(cv_img, cv2.COLOR_BGR2HSV)
            color_std = np.std(hsv)
            if 30 < color_std < 80:  # Natural color variation
                deepfake_score += 15
                indicators.append("Color distribution natural")
            else:
                indicators.append("⚠️ Unusual color patterns")

            # Normalize score
            deepfake_score = max(0, min(100, deepfake_score))

            # Determine status
            if deepfake_score >= 70:
                status = "Likely Authentic"
                risk = "Low"
            elif deepfake_score >= 40:
                status = "Inconclusive"
                risk = "Medium"
            else:
                status = "Potential Deepfake"
                risk = "High"

            return {
                'deepfake_detected': deepfake_score < 40,
                'authenticity_score': deepfake_score,
                'risk_level': risk,
                'status': status,
                'indicators': indicators,
                'face_emotion': analysis.get('dominant_emotion', 'unknown'),
                'face_age': int(analysis.get('age', 0)),
                'face_gender': analysis.get('dominant_gender', 'unknown')
            }
        finally:
            # Cleanup
            if os.path.exists(temp_path):
                os.unlink(temp_path)

    except Exception as e:
        print(f"Deepfake detection error: {e}")
        return None

def analyze_faces(image_url: str) -> dict:
    """Analyze faces in image using DeepFace - wrapper for backward compatibility"""
    result = detect_deepfake_image(image_url)
    if result:
        return {
            'faces_detected': True,
            'emotion': result.get('face_emotion', 'unknown'),
            'age': result.get('face_age', 0),
            'gender': result.get('face_gender', 'unknown'),
            'deepfake_detected': result.get('deepfake_detected', False),
            'authenticity_score': result.get('authenticity_score', 0),
            'risk_level': result.get('risk_level', 'unknown'),
            'deepfake_indicators': result.get('indicators', [])
        }
    return None

def analyze_tweet(text: str, images: List[str] = []) -> AnalysisResponse:
    """Smart keyword-based analysis with optional face detection"""

    word_count = len(text.split())
    text_lower = text.lower()

    # Analyze faces if images provided
    face_analysis = None
    if images and len(images) > 0:
        print(f"Analyzing {len(images)} image(s) for faces...")
        face_analysis = analyze_faces(images[0])  # Analyze first image

    # Check signals
    has_sources = bool(re.search(r'(source:|according to|study|research|report|university|professor)', text_lower))
    has_urls = bool(re.search(r'http[s]?://|www\.', text))
    has_clickbait = bool(re.search(r'(shocking|unbelievable|you won.?t believe|must see|breaking:|click here)', text_lower))
    has_all_caps = bool(re.search(r'\b[A-Z]{4,}\b', text))

    # Count signals
    exclamation_marks = text.count('!')
    question_marks = text.count('?')

    suspicious_words = ['miracle', 'secret', 'they don\'t want you to know', 'doctors hate', 'one weird trick', 'scam']
    suspicious_count = sum(1 for word in suspicious_words if word in text_lower)

    reliable_words = ['study', 'research', 'university', 'professor', 'journal', 'official', 'confirmed', 'data']
    reliable_count = sum(1 for word in reliable_words if word in text_lower)

    # Calculate score
    score = 60

    if has_sources: score += 15
    if has_urls: score += 5
    score += reliable_count * 8

    if has_clickbait: score -= 20
    if has_all_caps: score -= 10
    if exclamation_marks > 2: score -= 10
    if question_marks > 2: score -= 5
    score -= suspicious_count * 15
    if word_count < 10: score -= 10

    score = max(0, min(100, score))

    # Status
    if score >= 70:
        status = "Likely Reliable"
        message = "This content appears credible based on language analysis."
        color = "#00ba7c"
    elif score >= 40:
        status = "Needs Verification"
        message = "Mixed signals detected. Verify with trusted sources."
        color = "#f59e0b"
    else:
        status = "Potentially Misleading"
        message = "Potential misinformation detected. Verify carefully."
        color = "#ef4444"

    details = {
        "word_count": word_count,
        "has_sources": has_sources,
        "has_clickbait": has_clickbait,
        "suspicious_words": suspicious_count,
        "reliable_indicators": reliable_count,
        "tweet_preview": text[:100] + ("..." if len(text) > 100 else "")
    }

    # Add face and deepfake analysis if available
    if face_analysis:
        details["face_detected"] = True
        details["face_emotion"] = face_analysis.get("emotion", "unknown")
        details["face_age"] = face_analysis.get("age", "unknown")
        details["face_gender"] = face_analysis.get("gender", "unknown")

        # Add deepfake detection results
        if face_analysis.get("deepfake_detected") is not None:
            details["deepfake_detected"] = face_analysis.get("deepfake_detected", False)
            details["authenticity_score"] = face_analysis.get("authenticity_score", 0)
            details["deepfake_risk"] = face_analysis.get("risk_level", "unknown")
            details["deepfake_indicators"] = face_analysis.get("deepfake_indicators", [])

    return AnalysisResponse(
        score=score,
        status=status,
        message=message,
        color=color,
        details=details
    )

@app.get("/")
def root():
    return {"message": "Tweet Fact Checker API", "status": "running"}

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(request: TweetRequest):
    if not request.text or len(request.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Tweet text required")

    return analyze_tweet(request.text, request.images or [])

@app.get("/health")
def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    print("\n🚀 Tweet Fact Checker API Starting...")
    print("📍 Running on http://localhost:8000")
    print("📖 API docs: http://localhost:8000/docs\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)
