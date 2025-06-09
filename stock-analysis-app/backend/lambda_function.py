import json
import requests
from typing import Dict, Any
from mangum import Mangum
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
import hashlib
import datetime

# Create FastAPI app
app = FastAPI(title="Stock Analysis API", version="1.0.0")

# CORS will be handled manually via middleware to avoid duplicate headers

# Simple stock data service using Alpha Vantage free API
class SimpleStockService:
    def __init__(self):
        # Using demo API key - in production, use environment variable
        self.api_key = "demo"
        self.base_url = "https://www.alphavantage.co/query"
        
        # Base prices for different stocks to make them unique
        self.base_prices = {
            "AAPL": 175.50,
            "GOOGL": 2850.75,
            "MSFT": 415.25,
            "AMZN": 3200.80,
            "TSLA": 245.60,
            "NVDA": 875.30,
            "META": 485.90,
            "NFLX": 425.15,
            "ORCL": 115.45,
            "CRM": 265.80,
            "ADBE": 625.40,
            "INTC": 45.75
        }
    
    def _get_symbol_price(self, symbol: str) -> float:
        """Generate a consistent price for a symbol based on hash"""
        if symbol.upper() in self.base_prices:
            base = self.base_prices[symbol.upper()]
        else:
            # Generate a price based on symbol hash for consistency
            hash_val = int(hashlib.md5(symbol.encode()).hexdigest()[:8], 16)
            base = 50 + (hash_val % 500)  # Price between $50-$550
        
        # Add some daily variation based on current date
        today_hash = int(hashlib.md5(f"{symbol}{datetime.date.today()}".encode()).hexdigest()[:4], 16)
        variation = (today_hash % 20 - 10) / 10  # ±10% variation
        
        return round(base * (1 + variation / 100), 2)
    
    def get_stock_quote(self, symbol: str) -> Dict[str, Any]:
        """Get basic stock quote data"""
        try:
            # Generate symbol-specific prices
            current_price = self._get_symbol_price(symbol)
            previous_close = round(current_price * (0.98 + (hash(symbol) % 40) / 1000), 2)  # Slight variation
            
            # Get company name based on symbol
            company_names = {
                "AAPL": "Apple Inc.",
                "GOOGL": "Alphabet Inc.",
                "MSFT": "Microsoft Corporation",
                "AMZN": "Amazon.com Inc.",
                "TSLA": "Tesla Inc.",
                "NVDA": "NVIDIA Corporation",
                "META": "Meta Platforms Inc.",
                "NFLX": "Netflix Inc.",
                "ORCL": "Oracle Corporation",
                "CRM": "Salesforce Inc.",
                "ADBE": "Adobe Inc.",
                "INTC": "Intel Corporation"
            }
            
            # Generate symbol-specific volume and market cap
            volume_hash = hash(f"{symbol}volume") % 10000000
            volume = 1000000 + abs(volume_hash)
            
            mock_data = {
                "symbol": symbol.upper(),
                "name": company_names.get(symbol.upper(), f"{symbol.upper()} Corporation"),
                "current_price": current_price,
                "previous_close": previous_close,
                "change": round(current_price - previous_close, 2),
                "change_percent": f"{((current_price - previous_close) / previous_close * 100):.2f}%",
                "volume": volume,
                "market_cap": f"{round(current_price * 1000000000 / 1000000000, 1)}B",
                "pe_ratio": round(15 + (hash(symbol) % 20), 1),
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
            
            # Enhanced recommendation logic based on price ranges
            if price > 500:
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
            elif price > 200:
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
            
            # Generate symbol-specific indicators
            rsi_val = 30 + (hash(f"{symbol}rsi") % 40)  # RSI between 30-70
            
            indicators = [
                {
                    "name": "RSI",
                    "value": f"{rsi_val}.2",
                    "status": "Bullish" if rsi_val < 50 else "Bearish",
                    "color": "#4CAF50" if rsi_val < 50 else "#f44336"
                },
                {
                    "name": "Moving Average",
                    "value": "Bullish" if price > quote["previous_close"] else "Bearish",
                    "status": "Above SMA-50" if price > quote["previous_close"] else "Below SMA-50",
                    "color": "#4CAF50" if price > quote["previous_close"] else "#f44336"
                },
                {
                    "name": "Price Momentum",
                    "value": "Positive" if quote["change"] > 0 else "Negative",
                    "status": "Upward trend" if quote["change"] > 0 else "Downward trend",
                    "color": "#4CAF50" if quote["change"] > 0 else "#f44336"
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
            "/stocks/{symbol}/recommendation",
            "/stocks/{symbol}/chart-data",
            "/stocks/{symbol}/technical-chart",
            "/stocks/{symbol}/news"
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
    # Generate realistic mock data based on symbol
    data_points = []
    base_price = stock_service._get_symbol_price(symbol)
    
    # Generate 30 data points
    for i in range(30):
        date = datetime.datetime.now() - datetime.timedelta(days=29-i)
        
        # Generate realistic OHLCV data with symbol-specific variation
        symbol_hash = hash(f"{symbol}{i}")
        open_price = base_price + (i * 0.5) + ((symbol_hash % 10 - 5) * 2)
        high_price = open_price + abs(symbol_hash % 5)
        low_price = open_price - abs((symbol_hash + 1) % 3)
        close_price = low_price + (high_price - low_price) * 0.7
        volume = 1000000 + abs(symbol_hash % 500000)
        
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

@app.get("/stocks/{symbol}/technical-chart")
async def get_technical_chart(symbol: str, period: str = "1m"):
    """Get technical chart data in the format expected by IndicatorChart component"""
    # Get the OHLCV data first
    chart_data = await get_chart_data(symbol, period)
    
    # Transform to the format expected by IndicatorChart
    dates = [point["x"] for point in chart_data["data"]]
    prices = [point["c"] for point in chart_data["data"]]  # Use closing prices
    
    # Generate mock technical indicators
    sma_20 = []
    sma_50 = []
    rsi = []
    ema_12 = []
    ema_26 = []
    macd_line = []
    macd_signal = []
    bollinger_upper = []
    bollinger_middle = []
    bollinger_lower = []
    
    for i, price in enumerate(prices):
        # SMA 20
        if i >= 19:
            sma_20_val = sum(prices[i-19:i+1]) / 20
            sma_20.append(round(sma_20_val, 2))
        else:
            sma_20.append(None)
        
        # SMA 50
        if i >= 49:
            sma_50_val = sum(prices[i-49:i+1]) / 50
            sma_50.append(round(sma_50_val, 2))
        else:
            sma_50.append(None)
        
        # RSI (simplified mock)
        rsi_val = 30 + (hash(f"{symbol}{i}rsi") % 40)  # RSI between 30-70
        rsi.append(round(rsi_val, 1))
        
        # EMA 12 (simplified)
        if i == 0:
            ema_12.append(price)
        else:
            ema_12_val = (price * (2/13)) + (ema_12[-1] * (11/13))
            ema_12.append(round(ema_12_val, 2))
        
        # EMA 26 (simplified)
        if i == 0:
            ema_26.append(price)
        else:
            ema_26_val = (price * (2/27)) + (ema_26[-1] * (25/27))
            ema_26.append(round(ema_26_val, 2))
        
        # MACD
        if len(ema_12) > 0 and len(ema_26) > 0:
            macd_val = ema_12[-1] - ema_26[-1]
            macd_line.append(round(macd_val, 3))
            
            # MACD Signal (9-period EMA of MACD)
            if len(macd_line) >= 9:
                signal_val = sum(macd_line[-9:]) / 9
                macd_signal.append(round(signal_val, 3))
            else:
                macd_signal.append(None)
        else:
            macd_line.append(None)
            macd_signal.append(None)
        
        # Bollinger Bands
        if i >= 19:
            sma_val = sum(prices[i-19:i+1]) / 20
            variance = sum([(p - sma_val) ** 2 for p in prices[i-19:i+1]]) / 20
            std_dev = variance ** 0.5
            
            bollinger_middle.append(round(sma_val, 2))
            bollinger_upper.append(round(sma_val + (2 * std_dev), 2))
            bollinger_lower.append(round(sma_val - (2 * std_dev), 2))
        else:
            bollinger_middle.append(None)
            bollinger_upper.append(None)
            bollinger_lower.append(None)
    
    return {
        "symbol": symbol.upper(),
        "period": period,
        "dates": dates,
        "price": prices,
        "indicators": {
            "sma_20": sma_20,
            "sma_50": sma_50,
            "rsi": rsi,
            "ema_12": ema_12,
            "ema_26": ema_26,
            "macd_line": macd_line,
            "macd_signal": macd_signal,
            "bollinger_upper": bollinger_upper,
            "bollinger_middle": bollinger_middle,
            "bollinger_lower": bollinger_lower
        },
        "status": "success"
    }

@app.get("/stocks/{symbol}/news")
async def get_news(symbol: str):
    """Get mock news data"""
    
    # Generate symbol-specific news items
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