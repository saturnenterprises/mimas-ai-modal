#!/bin/bash

echo "🚀 Starting Tweet Fact Checker API"

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -q -r requirements-simple.txt

# Start server
echo "✅ Starting server..."
python main-simple.py
