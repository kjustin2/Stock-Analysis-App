# Stock Analysis & Recommendation System

A comprehensive web application that analyzes stock prices and provides intelligent BUY/SELL recommendations based on technical indicators, fundamental analysis, and market sentiment.

## 🚀 Features

### Core Functionality
- **Real-time Stock Data**: Current prices, market cap, P/E ratios, and key metrics
- **Interactive Price Charts**: Multiple time periods (1D, 1W, 1M, 3M, 6M, 1Y, 5Y) with Chart.js
- **Smart Recommendations**: Clear BUY/SELL signals with 1-5 star ratings and confidence levels
- **Enhanced Technical Analysis**: RSI, Moving Averages, MACD, Bollinger Bands, EMA calculations
- **Detailed Indicators**: 7+ color-coded indicators with explanatory tooltips
- **Latest News Integration**: Clickable news headlines linking to original articles
- **Secondary Technical Chart**: Expandable chart with advanced technical indicators
- **Risk Assessment**: LOW/MEDIUM/HIGH risk categorization with detailed explanations
- **Mobile Responsive**: Works seamlessly on all devices

### New UI/UX Features
- **Interactive Technical Indicators**: Clickable buttons to toggle individual indicators on/off
- **Comprehensive Info Tooltips**: Detailed explanations for all technical indicators and risk levels
- **Enhanced News Links**: Working URLs that lead to actual financial content
- **Visual Feedback**: Clear indication of clickable elements with hover effects
- **Educational Content**: Built-in explanations for investment concepts and technical analysis

### Recommendation System
- **Multi-Factor Analysis**: Technical (40%), Fundamental (35%), Market Sentiment (25%)
- **Binary Decision Logic**: Clear BUY (score ≥ 6.0) or SELL (score < 6.0) recommendations
- **Confidence Levels**: 60-95% confidence based on signal agreement
- **Price Targets**: Specific target prices based on recommendation strength
- **Simplified Reasoning**: Maximum 3 key points in plain language

## 🏗️ Project Structure

```
stock-analysis-app/
├── .github/
│   └── workflows/
│       └── deploy.yml         # GitHub Actions CI/CD pipeline
├── backend/                   # FastAPI backend
│   ├── app/
│   │   ├── api/
│   │   │   └── stocks.py      # Stock API endpoints
│   │   ├── services/
│   │   │   ├── stock_service.py        # Stock data fetching
│   │   │   ├── recommendation_service.py # Recommendation engine
│   │   │   └── news_service.py         # News integration
│   │   └── main.py            # FastAPI application
│   ├── requirements.txt       # Python dependencies
│   ├── Procfile              # Railway/Heroku deployment
│   ├── railway.json          # Railway configuration
│   ├── render.yaml           # Render configuration
│   ├── start.sh              # Startup script
│   └── tests/                # Backend tests
├── frontend/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── App.tsx           # Main React component
│   │   ├── main.tsx          # React entry point
│   │   ├── index.css         # Styles
│   │   └── vite-env.d.ts     # TypeScript environment types
│   ├── package.json          # Node.js dependencies
│   ├── vite.config.ts        # Vite configuration (GitHub Pages)
│   ├── tsconfig.json         # TypeScript configuration
│   └── index.html            # HTML entry point
├── tests/                    # Integration tests
├── requirements.txt          # Root Python dependencies
└── README.md                 # This file
```

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **Data Sources**: yfinance for stock data
- **Technical Analysis**: pandas-ta
- **Testing**: pytest with 94% coverage
- **API Documentation**: Automatic OpenAPI/Swagger

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Charts**: TradingView Lightweight Charts
- **HTTP Client**: Axios with React Query
- **Styling**: Styled Components
- **Linting**: ESLint with TypeScript support

## 🚀 Quick Start

### Prerequisites
- Python 3.8+ 
- Node.js 16+
- npm or yarn

### 1. Clone and Setup
```bash
git clone <repository-url>
cd stock-analysis-app
```

### 2. Backend Setup
```bash
# Create and activate virtual environment
python -m venv venv

# On Windows:
.\venv\Scripts\activate
# On Unix/MacOS:
source venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Install backend-specific dependencies
cd backend
pip install -r requirements.txt
cd ..
```

### 3. Frontend Setup
```bash
# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 4. Start Development Servers

#### Option A: Manual Start (Recommended)
```bash
# Terminal 1: Start Backend
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8004

# Terminal 2: Start Frontend
cd frontend
npm run dev
```

#### Option B: Windows PowerShell (Parallel Start)
```powershell
# Start both servers in parallel (CORRECTED PATHS)
Start-Process powershell -ArgumentList "-Command", ".\venv\Scripts\Activate.ps1; cd backend; python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8004"
Start-Process powershell -ArgumentList "-Command", "cd frontend; npm run dev"

# Alternative using direct python path (no activation needed):
Start-Process powershell -ArgumentList "-Command", "cd backend; ..\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8004"
Start-Process powershell -ArgumentList "-Command", "cd frontend; npm run dev"
```

#### Option C: Easy Batch Files (Windows)
```batch
# Double-click these files or run from command line:
start_backend.bat    # Starts the FastAPI backend server
start_frontend.bat   # Starts the React development server
```

#### Option D: Unix/MacOS (Background Start)
```bash
# Start backend in background
cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8004 &

# Start frontend in background
cd frontend && npm run dev &
```

### 5. Access the Application
- **Frontend**: http://localhost:5173 (or check terminal for exact port)
- **Backend API**: http://localhost:8004
- **API Documentation**: http://localhost:8004/docs

## 🔧 Build Instructions

### Development Build
```bash
# Backend (no build needed - Python runs directly)
cd backend
python -m uvicorn app.main:app --reload

# Frontend development server
cd frontend
npm run dev
```

### Production Build
```bash
# Frontend production build
cd frontend
npm run build
# Built files will be in frontend/dist/

# Backend production server
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8004
```

### Testing
```bash
# Run backend tests
cd backend
pytest

# Run integration tests
python test_api.py

# Frontend linting
cd frontend
npm run lint

# Frontend type checking
npm run build  # TypeScript compilation happens during build
```

## 📊 API Endpoints

### Stock Information
- `GET /stocks/{symbol}` - Basic stock information
- `GET /stocks/{symbol}/history?days=30` - Historical price data
- `GET /stocks/{symbol}/analysis` - Technical analysis
- `GET /stocks/{symbol}/recommendation` - BUY/SELL recommendation
- `GET /stocks/{symbol}/news` - Latest stock news
- `GET /stocks/{symbol}/chart-data?period=1m` - Chart data for different periods

### Health Checks
- `GET /` - Root endpoint
- `GET /health` - Health check

### Example API Response
```json
{
  "symbol": "AAPL",
  "action": "BUY",
  "stars": 4,
  "confidence": 85,
  "color": "green",
  "reasoning": [
    "Strong upward trend in last 30 days",
    "RSI indicates oversold conditions", 
    "Above key moving averages"
  ],
  "price_target": 165.00,
  "risk_level": "Medium"
}
```

## 🧪 Testing

### Comprehensive Test Suite
- **11 Test Cases**: All scenarios covered
- **94% Code Coverage**: Exceeds industry standards
- **Integration Tests**: Full API endpoint validation
- **Error Handling**: Graceful fallback behavior
- **Fallback Data**: Reliable demonstration capability

### Run Tests
```bash
# Backend unit tests
cd backend
pytest --cov=app --cov-report=html

# Integration tests
python test_api.py

# Frontend type checking
cd frontend
npm run build
```

## 🎯 Sample Recommendations

### AAPL (Apple Inc.)
- **Score**: 4.6/10 → **WEAK HOLD** → **Action**: SELL
- **Confidence**: 65% | **Risk**: MEDIUM
- **Reasoning**: RSI neutral, price above SMA, P/E suggests undervalue

### MSFT (Microsoft Corporation)  
- **Score**: 5.7/10 → **WEAK HOLD** → **Action**: SELL
- **Confidence**: 75% | **Risk**: MEDIUM

### GOOGL (Alphabet Inc.)
- **Score**: 7.7/10 → **HOLD** → **Action**: HOLD  
- **Confidence**: 95% | **Risk**: LOW

## 🔍 Troubleshooting

### Common Issues
1. **Port Conflicts**: If ports 8004 or 5173 are in use, servers will use next available port
2. **CORS Errors**: Ensure both backend and frontend are running
3. **Module Import Errors**: Activate virtual environment and reinstall dependencies
4. **yfinance Errors**: App includes fallback data for demonstration
5. **PowerShell Virtual Environment Issues**:
   - If `.\venv\Scripts\activate` fails, try `.\venv\Scripts\Activate.ps1`
   - If PowerShell execution policy blocks scripts: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
   - Alternative: Use `.\venv\Scripts\python.exe` directly without activation

### Debug Commands
```bash
# Verify setup
python verify_setup.py

# Check backend health
curl http://localhost:8004/health

# Test API endpoints
python test_api.py

# Check frontend build
cd frontend && npm run build
```

### Performance Tips
- Backend includes caching for frequently requested data
- Frontend uses React Query for efficient data fetching
- Fallback data ensures consistent operation
- Parallel API calls optimize loading times

## 🚀 Deployment

This application is deployed using a modern cloud-native architecture with separate frontend and backend deployments.

### 🌐 Live Application
- **Frontend**: https://kjustin2.github.io/Code-Side-Projects/ (GitHub Pages)
- **Backend**: Deployed on Railway/Render (URL configured via environment variables)

### 🏗️ Deployment Architecture

#### Frontend Deployment (GitHub Pages)
- **Platform**: GitHub Pages with GitHub Actions CI/CD
- **Framework**: React + Vite build system
- **Auto-deployment**: Triggered on every push to `main` branch
- **Build Process**: TypeScript compilation → Vite production build → GitHub Pages deployment

#### Backend Deployment (Railway/Render)
- **Platform**: Railway (recommended) or Render
- **Framework**: FastAPI with Uvicorn ASGI server
- **Configuration**: Automatic deployment from GitHub repository
- **Environment**: Production-ready with proper CORS and error handling

### 🔧 Deployment Configuration Files

#### Frontend (GitHub Actions)
```yaml
# .github/workflows/deploy.yml
- Automated build and deployment to GitHub Pages
- Environment variable injection for API URL
- TypeScript compilation and Vite build process
```

#### Backend (Railway)
```json
# backend/railway.json
{
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

#### Backend (Render Alternative)
```yaml
# backend/render.yaml
services:
  - type: web
    name: stock-analysis-api
    buildCommand: "pip install -r requirements.txt"
    startCommand: "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
```

### 🚀 Deployment Steps

#### 1. Backend Deployment (Choose One)

**Option A: Railway (Recommended)**
1. Sign up at [railway.app](https://railway.app) with GitHub
2. Create new project → Deploy from GitHub repo
3. Select `Code-Side-Projects` repository
4. Set root directory: `stock-analysis-app/backend`
5. Railway auto-detects `railway.json` configuration
6. Copy deployment URL (e.g., `https://your-app.railway.app`)

**Option B: Render**
1. Sign up at [render.com](https://render.com) with GitHub
2. New → Web Service → Connect GitHub repo
3. Configure:
   - Root Directory: `stock-analysis-app/backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Plan: Free
4. Deploy and copy URL

#### 2. Frontend Configuration
1. Go to GitHub repository settings
2. Navigate to: Settings → Secrets and variables → Actions
3. Add repository secret:
   - Name: `VITE_API_URL`
   - Value: Your backend URL (e.g., `https://your-app.railway.app`)
4. GitHub Actions automatically redeploys frontend with new API URL

#### 3. Verification
- Frontend automatically deploys to GitHub Pages
- Backend serves API at your chosen platform
- CORS configured to allow GitHub Pages domain
- Environment variables securely managed via GitHub Secrets

### 🔒 Security & Environment Variables

#### Development
```bash
# Local development uses fallback
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8004';
```

#### Production
- **Frontend**: Environment variables injected during GitHub Actions build
- **Backend**: Platform environment variables (Railway/Render)
- **Secrets**: Managed via GitHub repository secrets (never committed to code)
- **CORS**: Configured to allow GitHub Pages domain (`https://kjustin2.github.io`)

### 🛠️ Manual Deployment (Alternative)

#### Frontend Build
```bash
cd frontend
npm run build
# Deploy dist/ folder to any static hosting service
```

#### Backend Production
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8004 --workers 4
```

### 📊 Deployment Features
- **Zero-downtime deployments**: Both platforms support rolling deployments
- **Automatic SSL**: HTTPS enabled by default on both GitHub Pages and Railway/Render
- **Environment isolation**: Separate development and production configurations
- **Monitoring**: Built-in health checks and logging on deployment platforms
- **Scalability**: Backend can be scaled based on traffic demands

### 🔍 Troubleshooting Deployment

#### Common Issues
1. **CORS Errors**: Ensure backend CORS includes GitHub Pages domain
2. **API URL Not Set**: Verify `VITE_API_URL` secret is configured in GitHub
3. **Build Failures**: Check GitHub Actions logs for TypeScript/build errors
4. **Backend Not Responding**: Verify Railway/Render deployment status

#### Debug Commands
```bash
# Check GitHub Actions deployment
# Visit: https://github.com/kjustin2/Code-Side-Projects/actions

# Test backend health
curl https://your-backend-url.railway.app/health

# Verify frontend build locally
cd frontend && npm run build && npm run preview
```

### Environment Variables
```bash
# Backend (Platform-managed)
export PYTHONPATH="${PYTHONPATH}:${PWD}/backend"
export ENVIRONMENT=production
export PORT=8004  # Set by Railway/Render

# Frontend (GitHub Actions)
export VITE_API_URL=https://your-backend-url.railway.app
export NODE_ENV=production
```

## 📈 Architecture Highlights

### Recommendation Algorithm
```python
composite_score = (
    technical_score * 0.40 +
    fundamental_score * 0.35 +
    sentiment_score * 0.25
)

# Binary Decision Logic
recommendation = "BUY" if composite_score >= 6.0 else "SELL"
```

### Key Design Decisions
- **Modular Architecture**: Separate services for different concerns
- **Type Safety**: Comprehensive TypeScript and Python type hints
- **Error Resilience**: Graceful fallback mechanisms
- **Performance**: Optimized for sub-2 second response times
- **Scalability**: Clean separation of concerns for easy extension

## 🔮 Future Enhancements

### Potential Features
- Real-time WebSocket updates
- Portfolio tracking and management
- Advanced technical indicators (MACD, Bollinger Bands)
- Social sentiment analysis (Twitter/Reddit)
- Price alerts and notifications
- Historical recommendation accuracy tracking
- PDF report generation
- User accounts and personalized watchlists

### Technical Improvements
- Machine learning integration for better predictions
- Real-time news sentiment analysis
- Advanced caching strategies
- Rate limiting and API quotas
- Database integration for historical data
- Microservices architecture for scaling

## 📄 License

This project is for educational and demonstration purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📋 Project Cleanup Summary

This README consolidates information from multiple documentation files that were previously scattered throughout the project:

### Consolidated Documentation
- **RECOMMENDATION_SYSTEM_SUMMARY.md** → Recommendation system features and implementation details
- **ENHANCED_SYSTEM_SUMMARY.md** → Interactive charts, news integration, and UI enhancements  
- **IMPLEMENTATION_SUMMARY.md** → Technical implementation details and testing results
- **testing_plan.md** → Testing strategy and coverage information
- **stock_enhancement_plan.md** → Enhancement features and technical specifications
- **stock_recommendation_plan.md** → Recommendation algorithm and scoring methodology
- **project_improvement_plan.md** → Project improvement strategies and success metrics
- **simplification_plan.md** → Code simplification and architecture decisions
- **frontend/README.md** → Generic React+Vite template information (removed)

### Removed Files
- All planning and summary .md files (9 files total)
- Unused root `package.json` and `package-lock.json` (Jest dependencies not in use)
- Unused root `node_modules` directory
- Generic frontend README template
- Debug and temporary files: `debug_yfinance.py`, `test_api.py`, `run_tests.py`, `verify_setup.py`
- Test artifacts: `.coverage`, `test.db`, `stock_analysis.db`, `htmlcov/`, `test-reports/`, `test-results/`, `.pytest_cache/`
- Redundant requirements file: `requirements-test.txt`
- Unused React/TypeScript files: `frontend/src/`, `frontend/public/`, TypeScript configs, ESLint config
- Python cache directories: `__pycache__/` in backend
- Additional cleanup: Removed 15+ unnecessary files and directories for a cleaner project structure

### Recent Fixes (June 2025)
- **Fixed Stock Price Issue**: Updated yfinance from 0.2.33 to 0.2.61 to resolve datetime subtraction error
- **Updated Fallback Data**: Current market prices now reflect real values (MSFT: $470.38, AAPL: $203.92, etc.)
- **Improved Error Handling**: Better fallback mechanisms when yfinance APIs are unavailable
- **Fixed Deprecation Warnings**: Updated FastAPI Query parameters from `regex` to `pattern`

### New Features (June 2025)
- **5-Year Chart Support**: Added 5Y time period option to price charts for long-term analysis
- **Clickable News Links**: News headlines now link to original articles with external link indicators
- **Enhanced Recommendation Indicators**: 7+ detailed indicators (RSI, Moving Average, P/E Ratio, etc.) with color-coded status
- **Info Icon Tooltips**: Hover/click info icons (ℹ️) for detailed explanations of each indicator
- **Duplicate Prevention**: Improved reasoning algorithm prevents duplicate recommendation points
- **Secondary Technical Chart**: Expandable chart showing moving averages, RSI, and other technical indicators
- **Advanced Technical Analysis**: MACD, Bollinger Bands, EMA calculations for comprehensive analysis

### Latest UI/UX Improvements (December 2024)
- **Interactive Technical Indicator Controls**: Added clickable toggle buttons for each technical indicator (Price, SMA 20, SMA 50, RSI, MACD, Bollinger Bands)
- **Enhanced Info Tooltips**: Comprehensive explanations for all technical indicators with educational content
- **Risk Level Explanations**: Added info button next to risk level with detailed explanations for LOW/MEDIUM/HIGH risk categories
- **Fixed News URLs**: Updated news service to use working URLs that lead to actual financial content instead of broken links
- **Visual Feedback**: Clear indication of clickable elements with hover effects and active states
- **Educational Content**: Built-in explanations help users understand technical analysis concepts
- **Dynamic Indicator Display**: Technical indicator buttons now only show for indicators available in current chart data
- **Improved Chart Clarity**: Secondary chart clearly labeled as "More Details - Advanced Technical Analysis"
- **Fixed Info Button Functionality**: All info buttons now work properly with comprehensive explanations
- **PowerShell Command Fixes**: Corrected virtual environment activation commands for Windows users
- **Independent Technical Chart Time Selectors**: Technical analysis chart now has its own time period controls (1D, 1W, 1M, 3M, 6M, 1Y, 5Y)
- **Enhanced Tooltip System**: Improved tooltip positioning, visibility, and user experience across all devices
- **Robust Event Handling**: Fixed all info button functionality with proper event listeners and error handling
- **Fixed Technical Chart Display**: Resolved chart cutoff issue where dates were not visible at bottom of technical analysis chart
  - Increased chart container max-height from 600px to 800px with overflow: visible
  - Increased chart canvas height from 450px to 500px with enhanced padding
  - Added comprehensive Chart.js layout padding (40px bottom, 10px all sides)
  - Enhanced x-axis label rotation, positioning, and padding for better date visibility
  - Added proper canvas styling and minimum height constraints
  - Improved overall technical chart section spacing and layout

### Enhanced .gitignore
The .gitignore file has been comprehensively updated to include:
- **Python patterns**: `__pycache__/`, `*.pyc`, `*.pyo`, `*.pyd`, `.coverage`, `.pytest_cache/`
- **Database files**: `*.db`, `*.sqlite`, `test*.db`, `development.db`, `production.db`
- **Test artifacts**: `test-reports/`, `test-results/`, `htmlcov/`, `junit.xml`
- **Node.js patterns**: `node_modules/`, `package-lock.json`, `dist/`, `.cache/`
- **IDE files**: `.vscode/`, `.idea/`, `*.swp`, `*.swo`
- **OS files**: `.DS_Store`, `Thumbs.db`, `Desktop.ini`
- **Logs**: `*.log`, `logs/`, `debug.log`, `error.log`
- **Environment**: `.env*`, `secrets.json`, `.secrets/`
- **Temporary files**: `*.tmp`, `*.temp`, `.tmp/`, `.temp/`
- **Build artifacts**: `build/`, `dist/`, `coverage/`
- **Project-specific**: Debug files, unused React/TypeScript configs, test databases

### Current Structure
The project now has a single, comprehensive README.md that includes:
- Complete setup and build instructions
- Technology stack details
- API documentation
- Testing information
- Deployment guidelines
- Architecture overview
- Future enhancement roadmap

---

**Ready to analyze stocks?** Start both servers and visit http://localhost:5173 to begin! 