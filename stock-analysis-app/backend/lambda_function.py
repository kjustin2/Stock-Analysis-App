import json
import requests
from typing import Dict, Any
from mangum import Mangum
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware

# Create FastAPI app
app = FastAPI(title="Stock Analysis API", version="1.0.0")

# Add CORS middleware with specific origins for security
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://*.github.io",  # GitHub Pages
        "http://localhost:3000",  # Local development
        "http://localhost:5173",  # Vite dev server
        "*"  # Temporary - will restrict later
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Simple stock data service using Alpha Vantage free API
class SimpleStockService:
    def __init__(self):
        # Using demo API key - in production, use environment variable
        self.api_key = "demo"
        self.base_url = "https://www.alphavantage.co/query"
    
    def get_stock_quote(self, symbol: str) -> Dict[str, Any]:
        """Get basic stock quote data"""
        try:
            # For demo purposes, return mock data
            # In production, you'd use: 
            # url = f"{self.base_url}?function=GLOBAL_QUOTE&symbol={symbol}&apikey={self.api_key}"
            # response = requests.get(url)
            # data = response.json()
            
            # Mock data for demonstration
            mock_data = {
                "symbol": symbol.upper(),
                "price": 150.25,
                "change": 2.15,
                "change_percent": "1.45%",
                "volume": 1234567,
                "market_cap": "2.5T",
                "pe_ratio": 25.4,
                "status": "success"
            }
            return mock_data
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching stock data: {str(e)}")
    
    def get_recommendation(self, symbol: str) -> Dict[str, Any]:
        """Get simple stock recommendation"""
        try:
            quote = self.get_stock_quote(symbol)
            price = quote["price"]
            
            # Simple recommendation logic
            if price > 100:
                recommendation = "HOLD"
                confidence = 75
                reasoning = "Stock price is above $100, suggesting stability"
            else:
                recommendation = "BUY"
                confidence = 80
                reasoning = "Stock price is below $100, potential upside"
            
            return {
                "symbol": symbol.upper(),
                "recommendation": recommendation,
                "confidence": confidence,
                "reasoning": reasoning,
                "current_price": price,
                "status": "success"
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error generating recommendation: {str(e)}")

# Initialize service
stock_service = SimpleStockService()

@app.get("/")
async def root():
    return {
        "message": "Stock Analysis API is running!",
        "status": "ok",
        "version": "1.0.0",
        "endpoints": [
            "/health",
            "/stocks/{symbol}",
            "/stocks/{symbol}/recommendation"
        ]
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "message": "API is working", "service": "lambda"}

@app.options("/{path:path}")
async def options_handler(path: str):
    """Handle preflight OPTIONS requests"""
    return {"message": "OK"}

@app.get("/stocks/{symbol}")
async def get_stock(symbol: str):
    """Get stock information"""
    if not symbol or len(symbol) > 10:
        raise HTTPException(status_code=400, detail="Invalid symbol")
    
    try:
        data = stock_service.get_stock_quote(symbol)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stocks/{symbol}/recommendation")
async def get_recommendation(symbol: str):
    """Get stock recommendation"""
    if not symbol or len(symbol) > 10:
        raise HTTPException(status_code=400, detail="Invalid symbol")
    
    try:
        data = stock_service.get_recommendation(symbol)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stocks/{symbol}/chart-data")
async def get_chart_data(symbol: str, period: str = "1m"):
    """Get mock chart data"""
    return {
        "symbol": symbol.upper(),
        "period": period,
        "data": [
            {"date": "2025-06-09", "open": 148.0, "high": 152.0, "low": 147.5, "close": 150.25, "volume": 1000000},
            {"date": "2025-06-08", "open": 146.0, "high": 149.0, "low": 145.5, "close": 148.1, "volume": 950000},
            {"date": "2025-06-07", "open": 144.0, "high": 147.0, "low": 143.5, "close": 146.0, "volume": 1100000}
        ],
        "status": "success"
    }

@app.get("/stocks/{symbol}/news")
async def get_news(symbol: str):
    """Get mock news data"""
    return {
        "symbol": symbol.upper(),
        "news": [
            {
                "title": f"{symbol.upper()} Reports Strong Quarterly Earnings",
                "summary": "Company beats analyst expectations with strong revenue growth.",
                "url": "https://example.com/news1",
                "date": "2025-06-09"
            },
            {
                "title": f"Analysts Upgrade {symbol.upper()} Price Target",
                "summary": "Multiple analysts raise price targets following positive outlook.",
                "url": "https://example.com/news2", 
                "date": "2025-06-08"
            }
        ],
        "status": "success"
    }

# Add a middleware to ensure CORS headers are always present
@app.middleware("http")
async def add_cors_headers(request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Expose-Headers"] = "*"
    return response

# Create the Lambda handler
handler = Mangum(app, lifespan="off")

def lambda_handler(event, context):
    """
    AWS Lambda handler function.
    """
    return handler(event, context) 