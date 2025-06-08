from datetime import datetime, timedelta
from typing import Tuple, Optional, List

def parse_date(date_str: str) -> datetime:
    """Parse a date string into a datetime object."""
    formats = [
        "%Y-%m-%d",
        "%m/%d/%Y",
        "%b %d, %Y",
        "%Y-%m-%dT%H:%M:%S",
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    raise ValueError(f"Unable to parse date: {date_str}")

def parse_date_range(start_date: str, end_date: Optional[str] = None) -> Tuple[datetime, datetime]:
    """Parse date strings into datetime objects."""
    try:
        start = parse_date(start_date)
        if end_date:
            end = parse_date(end_date)
        else:
            end = datetime.now()
        return start, end
    except ValueError as e:
        raise ValueError("Invalid date format. Use YYYY-MM-DD") from e

def get_date_range(start_date: datetime, end_date: datetime, include_weekends: bool = True) -> List[datetime]:
    """Get a list of dates between start_date and end_date."""
    dates = []
    current = start_date
    
    while current <= end_date:
        if include_weekends or current.weekday() < 5:
            dates.append(current)
        current += timedelta(days=1)
    
    return dates

def format_date(date: datetime, format_type: str = "iso") -> str:
    """Format datetime object to string."""
    formats = {
        "iso": "%Y-%m-%dT%H:%M:%S",
        "date": "%Y-%m-%d",
        "readable": "%B %d, %Y",
        "time": "%H:%M:%S"
    }
    return date.strftime(formats.get(format_type, formats["iso"]))

def is_market_open(current_time: Optional[datetime] = None) -> bool:
    """Check if the market is currently open."""
    if current_time is None:
        current_time = datetime.now()
    
    # Check if it's weekend
    if current_time.weekday() >= 5:
        return False
    
    # Market hours are 9:30 AM to 4:00 PM EST
    market_open = current_time.replace(hour=9, minute=30, second=0, microsecond=0)
    market_close = current_time.replace(hour=16, minute=0, second=0, microsecond=0)
    
    return market_open <= current_time <= market_close

def get_next_market_day(from_date: datetime = None) -> datetime:
    """Get the next market day."""
    if from_date is None:
        from_date = datetime.now()
    
    next_day = from_date + timedelta(days=1)
    
    # Skip weekends
    while next_day.weekday() >= 5:
        next_day += timedelta(days=1)
    
    # TODO: Add holiday checking
    return next_day

def get_last_market_day() -> datetime:
    """Get the last market day."""
    today = datetime.now()
    
    # If it's Monday, return Friday
    if today.weekday() == 0:
        return today - timedelta(days=3)
    # If it's Sunday, return Friday
    elif today.weekday() == 6:
        return today - timedelta(days=2)
    # Otherwise return yesterday
    else:
        return today - timedelta(days=1) 