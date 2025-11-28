from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import re
from typing import Optional

app = FastAPI(title="Tweet Fact Checker API")

# Configure CORS to allow Chrome extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your extension ID
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# AI model is optional - will load on demand
classifier = None

def load_model_if_needed():
    """Lazy load AI model only when needed"""
    global classifier
    if classifier is None:
        try:
            print("Loading lightweight AI model...")
            from transformers import pipeline
            # Using smaller, faster model
            classifier = pipeline(
                "sentiment-analysis",
                model="distilbert-base-uncased-finetuned-sst-2-english"
            )
            print("Model loaded successfully!")
        except Exception as e:
            print(f"AI model unavailable, using keyword analysis: {e}")
            classifier = False  # Mark as attempted but failed
    return classifier if classifier else None


class TweetRequest(BaseModel):
    text: str


class AnalysisResponse(BaseModel):
    score: int
    status: str
    message: str
    color: str
    details: dict


def analyze_with_ai(text: str) -> AnalysisResponse:
    """Analyze tweet using AI model or enhanced keyword analysis"""

    # Try to load model (lazy loading)
    model = load_model_if_needed()

    # Enhanced keyword analysis (always run)
    word_count = len(text.split())
    text_lower = text.lower()

    # Check for various signals
    has_sources = bool(re.search(r'(source:|according to|study|research|report|data shows)', text_lower))
    has_urls = bool(re.search(r'http[s]?://|www\.', text))
    has_clickbait = bool(re.search(r'(shocking|unbelievable|you won\'?t believe|must see|breaking:|click here)', text_lower))
    has_all_caps = bool(re.search(r'\b[A-Z]{4,}\b', text))
    question_marks = text.count('?')
    exclamation_marks = text.count('!')

    # Suspicious patterns
    suspicious_words = ['miracle', 'secret', 'they don\'t want you to know', 'doctors hate', 'one weird trick']
    suspicious_count = sum(1 for word in suspicious_words if word in text_lower)

    # Reliable indicators
    reliable_words = ['study', 'research', 'university', 'professor', 'journal', 'official', 'confirmed']
    reliable_count = sum(1 for word in reliable_words if word in text_lower)

    # Calculate base score
    score = 60  # Neutral start

    # Positive adjustments
    if has_sources: score += 15
    if has_urls: score += 5
    score += reliable_count * 8

    # Negative adjustments
    if has_clickbait: score -= 20
    if has_all_caps: score -= 10
    if exclamation_marks > 2: score -= 10
    if question_marks > 2: score -= 5
    score -= suspicious_count * 15
    if word_count < 10: score -= 10

    # Use AI if available for refinement
    ai_sentiment = None
    if model:
        try:
            result = model(text[:512])  # Limit text length
            ai_sentiment = result[0]['label']
            confidence = result[0]['score']

            # Adjust score based on sentiment
            if ai_sentiment == 'POSITIVE':
                score += int(confidence * 10)
            else:
                score -= int(confidence * 5)

        except Exception as e:
            print(f"AI analysis error: {e}")
            ai_sentiment = None

    # Clamp score
    score = max(0, min(100, score))

    # Determine status
    if score >= 70:
        status = "Likely Reliable"
        message = "This content appears credible based on language and structural analysis."
        color = "#00ba7c"
    elif score >= 40:
        status = "Needs Verification"
        message = "Mixed signals detected. Verify with multiple trusted sources before sharing."
        color = "#f59e0b"
    else:
        status = "Potentially Misleading"
        message = "Potential misinformation detected. Please verify carefully before believing or sharing."
        color = "#ef4444"

    details = {
        "word_count": word_count,
        "has_sources": has_sources,
        "has_clickbait": has_clickbait,
        "suspicious_words": suspicious_count,
        "reliable_indicators": reliable_count,
        "tweet_preview": text[:100] + ("..." if len(text) > 100 else "")
    }

    if ai_sentiment:
        details["ai_sentiment"] = ai_sentiment
        details["ai_classification"] = f"sentiment: {ai_sentiment.lower()}"

    return AnalysisResponse(
        score=score,
        status=status,
        message=message,
        color=color,
        details=details
    )


def fallback_analysis(text: str) -> AnalysisResponse:
    """Fallback keyword-based analysis"""

    text_lower = text.lower()

    # Keyword analysis
    suspicious_words = ['breaking:', 'shocking', 'unbelievable', 'miracle', 'secret']
    reliable_indicators = ['source:', 'according to', 'study shows', 'research', 'data']
    clickbait = ['click here', 'link in bio', 'you won\'t believe']

    suspicious_count = sum(1 for word in suspicious_words if word in text_lower)
    reliable_count = sum(1 for word in reliable_indicators if word in text_lower)
    clickbait_count = sum(1 for phrase in clickbait if phrase in text_lower)

    word_count = len(text.split())

    # Calculate score
    score = 60
    score += reliable_count * 8
    score -= suspicious_count * 12
    score -= clickbait_count * 10

    if word_count < 10:
        score -= 10

    score = max(0, min(100, score))

    if score >= 70:
        status = "Likely Reliable"
        message = "This tweet appears to contain credible information based on language analysis."
        color = "#00ba7c"
    elif score >= 40:
        status = "Needs Verification"
        message = "This tweet has mixed signals. Consider checking multiple sources."
        color = "#f59e0b"
    else:
        status = "Potentially Misleading"
        message = "This tweet may contain misleading information. Please verify carefully."
        color = "#ef4444"

    return AnalysisResponse(
        score=score,
        status=status,
        message=message,
        color=color,
        details={
            "analysis_method": "keyword-based",
            "suspicious_words": suspicious_count,
            "reliable_indicators": reliable_count,
            "clickbait_phrases": clickbait_count,
            "word_count": word_count,
            "tweet_preview": text[:100] + ("..." if len(text) > 100 else "")
        }
    )


@app.get("/")
def read_root():
    return {
        "message": "Tweet Fact Checker API",
        "status": "running",
        "model_status": "loaded" if classifier else "not loaded (will load on first use)"
    }


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_tweet(request: TweetRequest):
    """Analyze a tweet for credibility"""

    if not request.text or len(request.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Tweet text is required")

    if len(request.text) > 5000:
        raise HTTPException(status_code=400, detail="Tweet text too long")

    result = analyze_with_ai(request.text)
    return result


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "model_status": "loaded" if classifier else "not loaded"
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
