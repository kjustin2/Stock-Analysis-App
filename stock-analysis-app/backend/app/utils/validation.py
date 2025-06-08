import re
from typing import Dict, Any, Union, List
from datetime import datetime

def validate_symbol(symbol: str) -> bool:
    """Validate stock symbol format."""
    if not symbol:
        return False
    # Basic symbol validation (letters, numbers, dots, hyphens)
    pattern = r'^[A-Za-z0-9.-]+$'
    return bool(re.match(pattern, symbol))

def validate_timeframe(timeframe: str) -> bool:
    """Validate timeframe format (e.g., 1d, 1wk, 1mo, 1y)."""
    if not timeframe:
        return False

    # Valid timeframe patterns
    patterns = {
        r'^\d+d$': 365,  # days (max 365)
        r'^\d+w$': 52,   # weeks (max 52)
        r'^\d+m$': 12,   # months (max 12)
        r'^\d+y$': 10    # years (max 10)
    }

    for pattern, max_value in patterns.items():
        if match := re.match(pattern, timeframe):
            value = int(match.group()[:-1])
            return value <= max_value
    return False

def validate_date_range(start_date: Union[str, datetime], end_date: Union[str, datetime]) -> bool:
    """Validate date range."""
    try:
        if isinstance(start_date, str):
            start = datetime.strptime(start_date, "%Y-%m-%d")
        else:
            start = start_date

        if isinstance(end_date, str):
            end = datetime.strptime(end_date, "%Y-%m-%d")
        else:
            end = end_date

        # Check if end date is after start date and not in future
        return start <= end <= datetime.now()
    except (ValueError, TypeError):
        return False

def validate_indicators(indicators: List[str]) -> bool:
    """Validate technical indicator names."""
    valid_indicators = {'sma', 'ema', 'rsi', 'macd', 'bollinger'}
    return all(indicator.lower() in valid_indicators for indicator in indicators)

def validate_indicator_params(params: Dict[str, Any]) -> bool:
    """Validate technical indicator parameters."""
    # Required parameters
    if not all(key in params for key in ['period', 'type']):
        return False
    
    # Validate period
    if not isinstance(params['period'], int) or params['period'] <= 0:
        return False
    
    # Validate indicator type
    valid_types = ['sma', 'ema', 'rsi', 'macd', 'bollinger']
    if params['type'] not in valid_types:
        return False
    
    # Validate price type if provided
    if 'price' in params:
        valid_prices = ['open', 'high', 'low', 'close', 'volume']
        if params['price'] not in valid_prices:
            return False
    
    return True 