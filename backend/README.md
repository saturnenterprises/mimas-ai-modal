# Tweet Fact Checker API

AI-powered backend for the Chrome extension that analyzes tweet credibility using transformers.

## Features

- **AI-Powered Analysis**: Uses Facebook's BART model for zero-shot classification
- **Fallback System**: Keyword-based analysis if AI model fails
- **Fast API**: Built with FastAPI for high performance
- **Docker Ready**: Easy deployment with Docker Compose
- **Health Checks**: Built-in health monitoring

## Quick Start

### Using Docker Compose (Recommended)

1. **Build and start the service:**
   ```bash
   cd backend
   docker-compose up -d --build
   ```

2. **Check logs:**
   ```bash
   docker-compose logs -f
   ```

3. **Test the API:**
   ```bash
   curl http://localhost:8000/health
   ```

### Manual Setup

1. **Create virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the server:**
   ```bash
   python main.py
   ```

## API Endpoints

### POST /analyze
Analyze a tweet for credibility.

**Request:**
```json
{
  "text": "Breaking: Scientists discover new planet!"
}
```

**Response:**
```json
{
  "score": 45,
  "status": "Needs Verification",
  "message": "Mixed signals detected...",
  "color": "#f59e0b",
  "details": {
    "ai_classification": "clickbait or sensationalized content",
    "confidence": 78.5,
    "word_count": 6,
    "has_sources": false,
    "has_clickbait": true
  }
}
```

### GET /health
Health check endpoint.

### GET /
API information.

## Deployment on VPS

### Option 1: Docker Compose (Recommended)

1. **Copy files to VPS:**
   ```bash
   scp -r backend/ user@your-vps-ip:/path/to/app/
   ```

2. **SSH into VPS and start:**
   ```bash
   ssh user@your-vps-ip
   cd /path/to/app/backend
   docker-compose up -d
   ```

3. **Setup reverse proxy (Nginx):**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

### Option 2: PM2

1. **Install PM2:**
   ```bash
   npm install -g pm2
   ```

2. **Create ecosystem file (`ecosystem.config.js`):**
   ```javascript
   module.exports = {
     apps: [{
       name: 'tweet-checker',
       script: 'venv/bin/python',
       args: '-m uvicorn main:app --host 0.0.0.0 --port 8000',
       cwd: '/path/to/backend',
       instances: 1,
       autorestart: true,
       watch: false,
       max_memory_restart: '1G',
       env: {
         NODE_ENV: 'production'
       }
     }]
   }
   ```

3. **Start with PM2:**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

## Model Information

- **Model**: facebook/bart-large-mnli
- **Type**: Zero-shot classification
- **Size**: ~1.6GB
- **First run**: Downloads model automatically (may take a few minutes)

## Performance

- **Cold start**: ~30 seconds (model loading)
- **Analysis time**: ~0.5-2 seconds per tweet
- **Memory usage**: ~2-4GB RAM

## Environment Variables

See `.env.example` for configuration options.

## Updating Chrome Extension

Update the API URL in `content.js`:
```javascript
const API_URL = 'https://your-domain.com/analyze';  // or http://your-vps-ip:8000/analyze
```
