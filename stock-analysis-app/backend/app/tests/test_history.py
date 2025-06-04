import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import pandas as pd
from datetime import datetime, timedelta
from app.main import app

client = TestClient(app)

def test_history_endpoint_exists():
    """Test that the history endpoint exists"""
    response = client.get("/api/history/AAPL")
    assert response.status_code == 200

def test_get_stock_history_success():
    """Test successful history fetch for a stock"""
    # Create mock historical data
    dates = pd.date_range(start='2024-01-01', end='2024-01-05')
    mock_data = pd.DataFrame({
        'Open': [150.0, 151.0, 152.0, 153.0, 154.0],
        'High': [155.0, 156.0, 157.0, 158.0, 159.0],
        'Low': [149.0, 150.0, 151.0, 152.0, 153.0],
        'Close': [153.0, 154.0, 155.0, 156.0, 157.0],
        'Volume': [1000000, 1100000, 1200000, 1300000, 1400000]
    }, index=dates)
    
    mock_ticker = MagicMock()
    mock_ticker.history.return_value = mock_data
    
    with patch('yfinance.Ticker', return_value=mock_ticker):
        response = client.get('/api/history/AAPL')
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 5
        
        # Check first candle
        first_candle = data[0]
        assert first_candle['open'] == 150.0
        assert first_candle['high'] == 155.0
        assert first_candle['low'] == 149.0
        assert first_candle['close'] == 153.0
        assert first_candle['volume'] == 1000000
        assert first_candle['date'] == '2024-01-01T00:00:00'

def test_get_stock_history_empty():
    """Test handling of empty history response"""
    mock_ticker = MagicMock()
    mock_ticker.history.return_value = pd.DataFrame()
    
    with patch('yfinance.Ticker', return_value=mock_ticker):
        response = client.get('/api/history/AAPL')
        assert response.status_code == 404
        assert response.json()['detail'] == 'No data found for this symbol'

def test_get_stock_history_error():
    """Test handling of history fetch error"""
    mock_ticker = MagicMock()
    mock_ticker.history.side_effect = Exception('Failed to fetch history')
    
    with patch('yfinance.Ticker', return_value=mock_ticker):
        response = client.get('/api/history/AAPL')
        assert response.status_code == 500
        assert 'Failed to fetch history' in response.json()['detail']

def test_get_stock_history_custom_days():
    """Test history fetch with custom number of days"""
    # Create mock historical data
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    dates = pd.date_range(start=start_date, end=end_date)
    mock_data = pd.DataFrame({
        'Open': [100.0] * len(dates),
        'High': [110.0] * len(dates),
        'Low': [90.0] * len(dates),
        'Close': [105.0] * len(dates),
        'Volume': [1000000] * len(dates)
    }, index=dates)
    
    mock_ticker = MagicMock()
    mock_ticker.history.return_value = mock_data
    
    with patch('yfinance.Ticker', return_value=mock_ticker):
        response = client.get('/api/history/AAPL?days=30')
        assert response.status_code == 200
        data = response.json()
        assert len(data) == len(dates)

def test_get_stock_history_data_types():
    """Test that history data types are correct"""
    # Create mock historical data with various numeric types
    dates = pd.date_range(start='2024-01-01', end='2024-01-02')
    mock_data = pd.DataFrame({
        'Open': [150.123456789, 151.123456789],  # Test float precision
        'High': [155.00, 156.00],
        'Low': [149, 150],  # Test integer conversion to float
        'Close': [153.50, 154.50],
        'Volume': [1000000, 1100000]  # Test large integers
    }, index=dates)
    
    mock_ticker = MagicMock()
    mock_ticker.history.return_value = mock_data
    
    with patch('yfinance.Ticker', return_value=mock_ticker):
        response = client.get('/api/history/AAPL')
        assert response.status_code == 200
        data = response.json()
        
        first_candle = data[0]
        assert isinstance(first_candle['open'], float)
        assert isinstance(first_candle['high'], float)
        assert isinstance(first_candle['low'], float)
        assert isinstance(first_candle['close'], float)
        assert isinstance(first_candle['volume'], int)
        assert isinstance(first_candle['date'], str) 