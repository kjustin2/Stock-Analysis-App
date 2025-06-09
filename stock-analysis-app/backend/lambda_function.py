import json
import requests
from typing import Dict, Any
from mangum import Mangum
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware

# Create FastAPI app
app = FastAPI(title="Stock Analysis API", version="1.0.0")

# CORS will be handled manually via middleware to avoid duplicate headers

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
            
            # Mock data matching frontend expectations
            current_price = 150.25
            previous_close = 148.10
            
            # Get company name based on symbol
            company_names = {
                "AAPL": "Apple Inc.",
                "GOOGL": "Alphabet Inc.",
                "MSFT": "Microsoft Corporation",
                "AMZN": "Amazon.com Inc.",
                "TSLA": "Tesla Inc.",
                "NVDA": "NVIDIA Corporation",
                "META": "Meta Platforms Inc.",
                "NFLX": "Netflix Inc."
            }
            
            mock_data = {
                "symbol": symbol.upper(),
                "name": company_names.get(symbol.upper(), f"{symbol.upper()} Corporation"),
                "current_price": current_price,
                "previous_close": previous_close,
                "change": current_price - previous_close,
                "change_percent": f"{((current_price - previous_close) / previous_close * 100):.2f}%",
                "volume": 1234567,
                "market_cap": "2.5T",
                "pe_ratio": 25.4,
                "status": "success"
            }
            return mock_data
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching stock data: {str(e)}")
    
    def get_recommendation(self, symbol: str) -> Dict[str, Any]:
        """Get comprehensive stock recommendation"""
        try:
            quote = self.get_stock_quote(symbol)
            price = quote["current_price"]
            
            # Enhanced recommendation logic
            if price > 150:
                action = "HOLD"
                stars = 3
                confidence = 75
                price_target = price * 1.05
                reasoning = [
                    "Stock is trading at high levels, suggesting limited upside potential",
                    "Current valuation appears fairly priced based on market conditions",
                    "Recommend holding position and monitoring for better entry points"
                ]
                risk_level = "Medium"
            elif price > 100:
                action = "BUY"
                stars = 4
                confidence = 85
                price_target = price * 1.15
                reasoning = [
                    "Stock shows strong fundamentals with room for growth",
                    "Technical indicators suggest positive momentum",
                    "Market position and competitive advantages support upside potential"
                ]
                risk_level = "Low"
            else:
                action = "STRONG BUY"
                stars = 5
                confidence = 90
                price_target = price * 1.25
                reasoning = [
                    "Stock is significantly undervalued at current levels",
                    "Strong growth potential with favorable risk-reward ratio",
                    "Excellent entry point for long-term investors"
                ]
                risk_level = "Low"
            
            # Generate mock indicators
            indicators = [
                {
                    "name": "RSI",
                    "value": "45.2",
                    "status": "Neutral",
                    "color": "#ff9800"
                },
                {
                    "name": "Moving Average",
                    "value": "Bullish",
                    "status": "Above SMA-50",
                    "color": "#4CAF50"
                },
                {
                    "name": "Price Momentum",
                    "value": "Positive",
                    "status": "Upward trend",
                    "color": "#4CAF50"
                },
                {
                    "name": "Volume",
                    "value": "High",
                    "status": "Above average",
                    "color": "#4CAF50"
                }
            ]
            
            return {
                "symbol": symbol.upper(),
                "action": action,
                "stars": stars,
                "confidence": confidence,
                "price_target": round(price_target, 2),
                "reasoning": reasoning,
                "indicators": indicators,
                "risk_level": risk_level,
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
    """Get mock chart data in OHLCV format"""
    # Generate realistic mock data
    import datetime
    
    data_points = []
    base_price = 150.0
    
    # Generate 30 data points
    for i in range(30):
        date = datetime.datetime.now() - datetime.timedelta(days=29-i)
        
        # Generate realistic OHLCV data
        open_price = base_price + (i * 0.5) + ((-1)**i * 2)
        high_price = open_price + abs(hash(str(i)) % 5)
        low_price = open_price - abs(hash(str(i+1)) % 3)
        close_price = low_price + (high_price - low_price) * 0.7
        volume = 1000000 + (hash(str(i)) % 500000)
        
        data_points.append({
            "x": date.isoformat(),
            "o": round(open_price, 2),
            "h": round(high_price, 2),
            "l": round(low_price, 2),
            "c": round(close_price, 2),
            "v": abs(volume)
        })
        
        base_price = close_price
    
    return {
        "symbol": symbol.upper(),
        "period": period,
        "data": data_points,
        "data_points": len(data_points),
        "status": "success"
    }

@app.get("/stocks/{symbol}/news")
async def get_news(symbol: str):
    """Get mock news data"""
    import datetime
    
    # Generate realistic news items
    news_items = [
        {
            "headline": f"{symbol.upper()} Reports Strong Quarterly Earnings",
            "summary": "Company beats analyst expectations with strong revenue growth and positive guidance for next quarter.",
            "url": "https://example.com/news1",
            "published": (datetime.datetime.now() - datetime.timedelta(hours=2)).isoformat(),
            "source": "Financial Times"
        },
        {
            "headline": f"Analysts Upgrade {symbol.upper()} Price Target",
            "summary": "Multiple analysts raise price targets following positive outlook and strong market position.",
            "url": "https://example.com/news2",
            "published": (datetime.datetime.now() - datetime.timedelta(hours=6)).isoformat(),
            "source": "Reuters"
        },
        {
            "headline": f"{symbol.upper()} Announces New Product Launch",
            "summary": "Company unveils innovative product line expected to drive significant revenue growth.",
            "url": "https://example.com/news3",
            "published": (datetime.datetime.now() - datetime.timedelta(days=1)).isoformat(),
            "source": "Bloomberg"
        },
        {
            "headline": f"Market Outlook: {symbol.upper()} Shows Resilience",
            "summary": "Despite market volatility, the company demonstrates strong fundamentals and growth potential.",
            "url": "https://example.com/news4",
            "published": (datetime.datetime.now() - datetime.timedelta(days=2)).isoformat(),
            "source": "CNBC"
        }
    ]
    
    return {
        "symbol": symbol.upper(),
        "news": news_items,
        "status": "success"
    }

# Add manual CORS middleware to avoid duplicate headers
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