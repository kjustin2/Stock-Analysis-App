#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "========================================"
echo "   Outfit Score App - Starting Up..."
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed or not in PATH${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    echo ""
    read -p "Press any key to exit..."
    exit 1
fi

echo -e "${GREEN}✅ Node.js found:${NC} $(node --version)"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found${NC}"
    echo "Please run this script from the outfit-score-app directory"
    echo ""
    read -p "Press any key to exit..."
    exit 1
fi

echo -e "${GREEN}✅ Found package.json${NC}"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    echo "This may take a few minutes on first run..."
    echo ""
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        echo ""
        read -p "Press any key to exit..."
        exit 1
    fi
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

echo ""
echo -e "${BLUE}🚀 Starting the development server...${NC}"
echo ""
echo "The app will open automatically in your browser"
echo "If it doesn't, navigate to: http://localhost:3002"
echo ""
echo "Press Ctrl+C to stop the server"
echo "========================================"
echo ""

# Function to open browser (cross-platform)
open_browser() {
    local url="http://localhost:3002"
    
    # Wait a moment for server to start
    sleep 3
    
    if command -v xdg-open &> /dev/null; then
        # Linux
        xdg-open "$url" &> /dev/null &
    elif command -v open &> /dev/null; then
        # macOS
        open "$url" &> /dev/null &
    elif command -v start &> /dev/null; then
        # Windows (if running in Git Bash or similar)
        start "$url" &> /dev/null &
    fi
}

# Start browser opener in background
open_browser &

# Start the development server
npm run dev

# If we get here, the server stopped
echo ""
echo -e "${YELLOW}🛑 Development server stopped${NC}"
echo ""
read -p "Press any key to exit..." 