from datetime import datetime

def format_price(price: float) -> str:
    """Format price value with currency symbol and 2 decimal places."""
    if price < 0:
        return f"-${abs(price):,.2f}"
    return f"${price:,.2f}"

def format_percentage(value: float) -> str:
    """Format value as percentage with 2 decimal places."""
    return f"{value * 100:.2f}%"

def format_date(date: datetime, format_type: str = "iso") -> str:
    """Format date according to specified type."""
    if format_type == "iso":
        return date.strftime("%Y-%m-%dT%H:%M:%S")
    elif format_type == "date":
        return date.strftime("%Y-%m-%d")
    elif format_type == "readable":
        return date.strftime("%B %-d, %Y")
    else:
        raise ValueError(f"Unsupported date format type: {format_type}")

def format_volume(volume: int) -> str:
    """Format volume with K/M/B suffixes."""
    if volume >= 1_000_000_000:
        return f"{volume/1_000_000_000:.0f}B"
    elif volume >= 1_000_000:
        return f"{volume/1_000_000:.0f}M"
    elif volume >= 1_000:
        return f"{volume/1_000:.0f}K"
    return str(volume)

def format_market_cap(market_cap: int) -> str:
    """Format market cap with K/M/B suffixes."""
    if market_cap >= 1_000_000_000:
        return f"${market_cap/1_000_000_000:.0f}B"
    elif market_cap >= 1_000_000:
        return f"${market_cap/1_000_000:.0f}M"
    elif market_cap >= 1_000:
        return f"${market_cap/1_000:.0f}K"
    return f"${market_cap}" 