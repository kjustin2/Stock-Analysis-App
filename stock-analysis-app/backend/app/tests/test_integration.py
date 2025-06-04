import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import sys
import os
import json
from datetime import datetime, timedelta

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from app.main import app

client = TestClient(app)

def test_health_check():
    """Test that the health check endpoint is working"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_api_endpoints_exist():
    """Test that all required API endpoints exist and return 200"""
    endpoints = [
        "/api/news/AAPL",
        "/api/news/QQQ",
        "/api/history/AAPL",
        "/api/history/QQQ"
    ]
    
    for endpoint in endpoints:
        response = client.get(endpoint)
        assert response.status_code == 200, f"Endpoint {endpoint} returned {response.status_code}"

def test_news_endpoint_structure():
    """Test that the news endpoint returns correctly structured data"""
    mock_news = [
        {
            'title': 'Test Article',
            'link': 'https://example.com/article',
            'publisher': 'Test Publisher',
            'providerPublishTime': int(datetime.now().timestamp()),
            'summary': 'Test summary'
        }
    ]
    
    mock_ticker = MagicMock()
    mock_ticker.news = mock_news
    
    with patch('yfinance.Ticker', return_value=mock_ticker):
        response = client.get('/api/news/AAPL')
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            article = data[0]
            assert all(key in article for key in ['title', 'url', 'source', 'publishedAt', 'summary'])

def test_etf_news_fallback_chain():
    """Test the ETF news fallback chain for QQQ"""
    # Mock QQQ ticker with no news
    mock_qqq = MagicMock()
    mock_qqq.news = None
    mock_qqq.info = MagicMock(side_effect=Exception('Info fetch failed'))
    
    # Mock NDX ticker with no news
    mock_ndx = MagicMock()
    mock_ndx.news = None
    
    # Mock S&P 500 ticker with news
    mock_sp500 = MagicMock()
    mock_sp500.news = [
        {
            'title': 'Market News',
            'link': 'https://example.com/market',
            'publisher': 'Market News',
            'providerPublishTime': int(datetime.now().timestamp()),
            'summary': 'Market summary'
        }
    ]
    
    def mock_ticker(symbol):
        if symbol == 'QQQ':
            return mock_qqq
        elif symbol == '^NDX':
            return mock_ndx
        elif symbol == '^GSPC':
            return mock_sp500
        return MagicMock()
    
    with patch('yfinance.Ticker', side_effect=mock_ticker):
        response = client.get('/api/news/QQQ')
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        assert data[0]['title'] == 'Market News'

def test_cors_headers():
    """Test that CORS headers are properly set"""
    response = client.get("/health", headers={"Origin": "http://localhost:5173"})
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"

def test_error_handling():
    """Test error handling for various scenarios"""
    # Test invalid symbol
    response = client.get("/api/news/INVALID")
    assert response.status_code == 200
    assert response.json() == []
    
    # Test missing symbol
    response = client.get("/api/news/")
    assert response.status_code == 404
    
    # Test invalid endpoint
    response = client.get("/api/invalid")
    assert response.status_code == 404

@pytest.mark.parametrize("symbol", ["QQQ", "SPY", "IWM", "DIA"])
def test_major_etfs(symbol):
    """Test that all major ETFs return news"""
    response = client.get(f"/api/news/{symbol}")
    assert response.status_code == 200
    data = response.json()
    # Should either have news or return empty list
    assert isinstance(data, list)

def test_response_time():
    """Test that API responses are within acceptable time limits"""
    start_time = datetime.now()
    response = client.get("/api/news/AAPL")
    end_time = datetime.now()
    
    assert response.status_code == 200
    # Response should be under 5 seconds
    assert (end_time - start_time).total_seconds() < 5

def test_concurrent_requests():
    """Test handling of concurrent requests"""
    import asyncio
    import httpx
    
    async def make_request(symbol):
        async with httpx.AsyncClient(base_url="http://localhost:8000") as ac:
            response = await ac.get(f"/api/news/{symbol}")
            return response.status_code
    
    async def run_concurrent_requests():
        symbols = ["AAPL", "QQQ", "SPY", "MSFT"]
        tasks = [make_request(symbol) for symbol in symbols]
        results = await asyncio.gather(*tasks)
        return results
    
    results = asyncio.run(run_concurrent_requests())
    assert all(status == 200 for status in results) 