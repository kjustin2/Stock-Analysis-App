from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd
import pandas_ta as ta
from datetime import datetime, timedelta
import requests
from typing import List, Dict, Optional
from pydantic import BaseModel
import traceback

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"\n--- Request: {request.method} {request.url.path}")
    try:
        response = await call_next(request)
        print(f"--- Response: {response.status_code}")
        return response
    except Exception as e:
        print(f"--- Error in request: {str(e)}")
        print(f"--- Traceback: {traceback.format_exc()}")
        raise

class CandleData(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int

class StockAnalysis(BaseModel):
    symbol: str
    current_price: float
    signal: str
    rsi: float
    macd: Dict[str, float]
    sma_50: float
    sma_200: float

class NewsArticle(BaseModel):
    title: str
    url: str
    source: str
    publishedAt: str
    summary: str

@app.get("/api/news/{symbol}", response_model=List[NewsArticle])
async def get_stock_news(symbol: str):
    try:
        print(f"Fetching news for symbol: {symbol}")
        stock = yf.Ticker(symbol)
        
        # Initialize news_data
        news_data = None
        
        # Try multiple approaches to get news
        try:
            # First attempt: direct news fetch
            news_data = stock.news
            print(f"Direct news fetch result: {bool(news_data)}")
            
            # Second attempt: if no news, try getting info first
            if not news_data:
                print("No direct news, trying info fetch first")
                try:
                    _ = stock.info
                    news_data = stock.news
                    print(f"News after info fetch: {bool(news_data)}")
                except Exception as e:
                    print(f"Info fetch failed: {str(e)}")
            
            # Third attempt: if still no news, try market news
            if not news_data:
                print("No stock news, falling back to market news")
                try:
                    # Try sector ETF news first if it's an ETF
                    if symbol.upper() in ['QQQ', 'SPY', 'IWM', 'DIA']:
                        etf_map = {
                            'QQQ': '^NDX',  # Nasdaq 100
                            'SPY': '^GSPC', # S&P 500
                            'IWM': '^RUT',  # Russell 2000
                            'DIA': '^DJI'   # Dow Jones
                        }
                        index_symbol = etf_map.get(symbol.upper(), '^GSPC')
                        market = yf.Ticker(index_symbol)
                        news_data = market.news
                        print(f"ETF index news fetch result: {bool(news_data)}")
                    
                    # If still no news, fall back to S&P 500 news
                    if not news_data:
                        market = yf.Ticker("^GSPC")
                        news_data = market.news
                        print(f"Market news fetch result: {bool(news_data)}")
                except Exception as e:
                    print(f"Market news fetch failed: {str(e)}")

        except Exception as e:
            print(f"Error in news fetch sequence: {str(e)}")
            # Final attempt: market news as fallback
            try:
                market = yf.Ticker("^GSPC")
                news_data = market.news
                print(f"Final fallback news fetch result: {bool(news_data)}")
            except Exception as e:
                print(f"Final fallback failed: {str(e)}")
                return []

        if not news_data:
            print("No news data found after all attempts")
            return []

        # Process news data
        articles = []
        for item in news_data[:5]:  # Limit to 5 most recent articles
            try:
                # Get publisher from item or extract from URL
                publisher = item.get('publisher', '')
                if not publisher and 'link' in item:
                    try:
                        from urllib.parse import urlparse
                        domain = urlparse(item['link']).netloc
                        publisher = domain.replace('www.', '').split('.')[0].title()
                    except:
                        publisher = 'Yahoo Finance'

                article = NewsArticle(
                    title=item['title'],
                    url=item['link'],
                    source=publisher or 'Yahoo Finance',
                    publishedAt=datetime.fromtimestamp(item['providerPublishTime']).isoformat(),
                    summary=item.get('summary', '')
                )
                articles.append(article)
                print(f"Processed article: {article.title}")
            except Exception as e:
                print(f"Error processing article: {str(e)}")
                continue

        print(f"Successfully processed {len(articles)} articles")
        return articles

    except Exception as e:
        print(f"Unexpected error in news fetch: {str(e)}")
        return []  # Return empty list instead of 404 to prevent frontend errors

@app.get("/api/history/{symbol}")
async def get_stock_history(symbol: str, days: int = 365) -> List[CandleData]:
    try:
        stock = yf.Ticker(symbol)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Get historical data
        df = stock.history(start=start_date, end=end_date)
        
        if df.empty:
            raise HTTPException(status_code=404, detail="No data found for this symbol")
        
        # Convert the data to our CandleData format
        candles = []
        for index, row in df.iterrows():
            candle = CandleData(
                date=index.isoformat(),
                open=float(row['Open']),
                high=float(row['High']),
                low=float(row['Low']),
                close=float(row['Close']),
                volume=int(row['Volume'])
            )
            candles.append(candle)
        
        return candles
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e)) 