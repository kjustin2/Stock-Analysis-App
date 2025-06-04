# Stock Analysis Application

A web application that analyzes stock prices and provides buy/sell signals based on technical indicators.

## Features
- Real-time stock data fetching
- Technical analysis indicators
- Buy/sell signal generation
- Interactive charts
- Historical price analysis

## Setup Instructions

### Backend Setup
1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the backend server:
```bash
uvicorn backend.main:app --reload
```

### Frontend Setup
1. Install dependencies:
```bash
cd frontend
npm install
```

2. Run the development server:
```bash
npm run dev
```

## Technology Stack
- Frontend: React, TypeScript, Vite
- Backend: Python, FastAPI
- Data: yfinance, pandas-ta
- Charts: TradingView Lightweight Charts 