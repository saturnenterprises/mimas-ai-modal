#!/bin/bash

# Tweet Fact Checker API - Deployment Script
# This script helps deploy the API to your VPS

set -e

echo "🚀 Tweet Fact Checker API Deployment"
echo "===================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose are installed${NC}"

# Stop existing containers
echo -e "${YELLOW}Stopping existing containers...${NC}"
docker-compose down || true

# Build and start the service
echo -e "${YELLOW}Building and starting the API...${NC}"
docker-compose up -d --build

# Wait for service to be healthy
echo -e "${YELLOW}Waiting for service to start...${NC}"
sleep 10

# Check if service is running
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ API is running successfully!${NC}"
    echo ""
    echo "📊 Service Information:"
    echo "  - API URL: http://localhost:8000"
    echo "  - Health Check: http://localhost:8000/health"
    echo "  - API Docs: http://localhost:8000/docs"
    echo ""
    echo "📝 Next Steps:"
    echo "  1. Update content.js with your VPS URL"
    echo "  2. Set up Nginx reverse proxy (optional)"
    echo "  3. Configure SSL with Let's Encrypt (recommended)"
    echo ""
    echo "🔍 View logs:"
    echo "  docker-compose logs -f"
else
    echo -e "${RED}❌ API failed to start. Check logs:${NC}"
    echo "  docker-compose logs"
    exit 1
fi
