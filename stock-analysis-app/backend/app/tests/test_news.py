from fastapi.testclient import TestClient
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from app.main import app
import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime

@pytest.fixture
def test_client():
    with TestClient(app) as client:
        yield client

def test_health_check(test_client):
    response = test_client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_news_endpoint_exists(test_client):
    """Test that the news endpoint exists and returns 200 even with no data"""
    response = test_client.get("/api/news/AAPL")
    assert response.status_code == 200

def test_get_stock_news_success(test_client):
    """Test successful news fetch for a regular stock"""
    mock_news = [{
        'title': 'Test Article',
        'link': 'https://example.com/article',
        'publisher': 'Test Publisher',
        'providerPublishTime': int(datetime.now().timestamp()),
        'summary': 'Test summary'
    }]
    
    mock_ticker = MagicMock()
    mock_ticker.news = mock_news
    
    with patch('yfinance.Ticker', return_value=mock_ticker):
        response = test_client.get('/api/news/AAPL')
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        article = data[0]
        assert article['title'] == 'Test Article'
        assert article['url'] == 'https://example.com/article'
        assert article['source'] == 'Test Publisher'
        assert article['summary'] == 'Test summary'

def test_get_etf_news_qqq(test_client):
    """Test news fetch for QQQ with NDX fallback"""
    # Mock QQQ ticker with no news
    mock_qqq = MagicMock()
    mock_qqq.news = None
    
    # Mock NDX ticker with news
    mock_ndx = MagicMock()
    mock_ndx.news = [{
        'title': 'Nasdaq News',
        'link': 'https://example.com/nasdaq',
        'publisher': 'Nasdaq',
        'providerPublishTime': int(datetime.now().timestamp()),
        'summary': 'Nasdaq summary'
    }]
    
    def mock_ticker(symbol):
        if symbol == 'QQQ':
            return mock_qqq
        elif symbol == '^NDX':
            return mock_ndx
        return MagicMock()
    
    with patch('yfinance.Ticker', side_effect=mock_ticker):
        response = test_client.get('/api/news/QQQ')
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]['title'] == 'Nasdaq News'

def test_get_etf_news_all_fallbacks(test_client):
    """Test complete ETF fallback chain"""
    # Mock QQQ ticker with no news
    mock_qqq = MagicMock()
    mock_qqq.news = None
    mock_qqq.info = MagicMock(side_effect=Exception('Info fetch failed'))
    
    # Mock NDX ticker with no news
    mock_ndx = MagicMock()
    mock_ndx.news = None
    
    # Mock S&P 500 ticker with news
    mock_sp500 = MagicMock()
    mock_sp500.news = [{
        'title': 'Market News',
        'link': 'https://example.com/market',
        'publisher': 'Market News',
        'providerPublishTime': int(datetime.now().timestamp()),
        'summary': 'Market summary'
    }]
    
    def mock_ticker(symbol):
        if symbol == 'QQQ':
            return mock_qqq
        elif symbol == '^NDX':
            return mock_ndx
        elif symbol == '^GSPC':
            return mock_sp500
        return MagicMock()
    
    with patch('yfinance.Ticker', side_effect=mock_ticker):
        response = test_client.get('/api/news/QQQ')
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]['title'] == 'Market News'

def test_get_stock_news_empty(test_client):
    """Test handling of empty news response"""
    mock_ticker = MagicMock()
    mock_ticker.news = None
    
    with patch('yfinance.Ticker', return_value=mock_ticker):
        response = test_client.get('/api/news/AAPL')
        assert response.status_code == 200
        assert response.json() == []

def test_get_stock_news_fallback(test_client):
    """Test fallback to market news when stock news fails"""
    mock_stock = MagicMock()
    mock_stock.news = None
    mock_stock.info = MagicMock(side_effect=Exception('Info fetch failed'))
    
    mock_market = MagicMock()
    mock_market.news = [{
        'title': 'Market News',
        'link': 'https://example.com/market',
        'publisher': 'Market News',
        'providerPublishTime': int(datetime.now().timestamp()),
        'summary': 'Market summary'
    }]
    
    def mock_ticker(symbol):
        if symbol == 'AAPL':
            return mock_stock
        elif symbol == '^GSPC':
            return mock_market
        return MagicMock()
    
    with patch('yfinance.Ticker', side_effect=mock_ticker):
        response = test_client.get('/api/news/AAPL')
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]['title'] == 'Market News'

def test_get_stock_news_extract_publisher(test_client):
    """Test publisher extraction from URL when not provided"""
    mock_news = [{
        'title': 'Test Article',
        'link': 'https://finance.yahoo.com/article',
        'providerPublishTime': int(datetime.now().timestamp()),
        'summary': 'Test summary'
    }]
    
    mock_ticker = MagicMock()
    mock_ticker.news = mock_news
    
    with patch('yfinance.Ticker', return_value=mock_ticker):
        response = test_client.get('/api/news/AAPL')
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]['source'] == 'Finance'

def test_invalid_symbol(test_client):
    """Test handling of invalid stock symbols"""
    mock_ticker = MagicMock()
    mock_ticker.news = MagicMock(side_effect=Exception('Invalid symbol'))
    
    with patch('yfinance.Ticker', return_value=mock_ticker):
        response = test_client.get('/api/news/INVALID')
        assert response.status_code == 200
        assert response.json() == [] 