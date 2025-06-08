# Stock Analysis & Recommendation System

A modern web application that provides AI-powered stock analysis and investment recommendations with real-time data, technical indicators, and market news.

## 🌐 Live Demo
- **Frontend**: https://kjustin2.github.io/Code-Side-Projects/
- **Backend API**: Deployed on Railway/Render

## ✨ Features

- **Real-time Stock Analysis**: Current prices, technical indicators, and market data
- **AI Recommendations**: BUY/SELL signals with confidence levels and price targets
- **Interactive Charts**: Multiple timeframes with technical analysis
- **Latest News**: Curated financial news for each stock
- **Risk Assessment**: Comprehensive risk analysis and explanations
- **Mobile Responsive**: Works on all devices

## 🛠️ Tech Stack

**Frontend**: React + TypeScript + Vite  
**Backend**: FastAPI + Python  
**Data**: yfinance, pandas-ta  
**Deployment**: GitHub Pages + Railway/Render  

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/kjustin2/Code-Side-Projects.git
cd Code-Side-Projects/stock-analysis-app
```

2. **Setup Backend**
```bash
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

3. **Setup Frontend**
```bash
cd frontend
npm install
cd ..
```

4. **Start Development Servers**

**Easy Way (Windows):**
```bash
# Double-click these files:
start_backend.bat
start_frontend.bat
```

**Manual Way:**
```bash
# Terminal 1: Backend
.\venv\Scripts\activate
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8004

# Terminal 2: Frontend
cd frontend
npm run dev
```

5. **Access the Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8004
- API Docs: http://localhost:8004/docs

## 📊 API Endpoints

- `GET /stocks/{symbol}` - Stock information
- `GET /stocks/{symbol}/recommendation` - BUY/SELL recommendation
- `GET /stocks/{symbol}/chart-data?period=1m` - Chart data
- `GET /stocks/{symbol}/news` - Latest news
- `GET /health` - Health check

## 🚀 Deployment

### Frontend (GitHub Pages)
- Automatically deploys on push to `main` branch
- Uses GitHub Actions for CI/CD
- Environment variables managed via GitHub Secrets

### Backend (Railway/Render)
1. Sign up at [railway.app](https://railway.app) or [render.com](https://render.com)
2. Connect your GitHub repository
3. Set root directory to `stock-analysis-app/backend`
4. Deploy automatically detects configuration files

### Environment Configuration
Add `VITE_API_URL` secret in GitHub repository settings pointing to your deployed backend URL.

## 🔧 Project Structure

```
stock-analysis-app/
├── backend/                 # FastAPI backend
│   ├── app/                # Application code
│   ├── requirements.txt    # Python dependencies
│   └── railway.json       # Deployment config
├── frontend/               # React frontend
│   ├── src/               # Source code
│   ├── package.json       # Node dependencies
│   └── vite.config.ts     # Build configuration
├── .github/workflows/     # CI/CD pipeline
├── start_backend.bat      # Easy backend startup
└── start_frontend.bat     # Easy frontend startup
```

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend build test
cd frontend
npm run build
```

## 🔍 Troubleshooting

**Common Issues:**
- **Port conflicts**: Backend uses 8004, frontend uses 5173
- **CORS errors**: Ensure both servers are running
- **Virtual environment**: Make sure it's activated before running backend

**Debug Commands:**
```bash
# Check backend health
curl http://localhost:8004/health

# Verify frontend build
cd frontend && npm run build
```

## 📈 Sample Analysis

The system analyzes stocks like AAPL, MSFT, GOOGL with:
- **Technical indicators**: RSI, Moving Averages, MACD
- **Fundamental metrics**: P/E ratio, market cap, volume
- **Market sentiment**: News analysis and trend detection
- **Risk assessment**: LOW/MEDIUM/HIGH with explanations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if needed
5. Submit a pull request

## 📄 License

This project is for educational and demonstration purposes.

---

**Ready to analyze stocks?** Start both servers and visit http://localhost:5173! 📈 