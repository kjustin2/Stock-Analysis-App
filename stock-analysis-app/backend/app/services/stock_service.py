import yfinance as yf
import pandas as pd
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import os
import tempfile

class StockService:
    def __init__(self):
        """Initialize the stock service and clear yfinance cache."""
        self._clear_yfinance_cache()
    
    def _clear_yfinance_cache(self):
        """Clear yfinance cache to avoid datetime issues."""
        try:
            import yfinance.cache as cache
            cache.clear_cache()
        except:
            pass  # Ignore cache clearing errors
    
    def _safe_get_float(self, info: dict, key: str, default: float = 0.0) -> float:
        """Safely get a float value from stock info."""
        value = info.get(key, default)
        if value is None:
            return default
        try:
            return float(value)
        except (ValueError, TypeError):
            return default

    def _safe_get_int(self, info: dict, key: str, default: int = 0) -> int:
        """Safely get an int value from stock info."""
        value = info.get(key, default)
        if value is None:
            return default
        try:
            return int(value)
        except (ValueError, TypeError):
            return default

    def _get_fallback_data(self, symbol: str) -> Dict:
        """Provide fallback data for testing when yfinance fails."""
        # Sample data for common stocks
        fallback_data = {
            "AAPL": {
                "name": "Apple Inc.",
                "current_price": 203.92,
                "previous_close": 200.63,
                "market_cap": 3045708267520,
                "pe_ratio": 25.5,
                "dividend_yield": 0.0065,
                "fifty_two_week_high": 250.0,
                "fifty_two_week_low": 164.0
            },
            "MSFT": {
                "name": "Microsoft Corporation",
                "current_price": 470.38,
                "previous_close": 467.68,
                "market_cap": 3500000000000,
                "pe_ratio": 28.2,
                "dividend_yield": 0.0072,
                "fifty_two_week_high": 490.0,
                "fifty_two_week_low": 362.0
            },
            "GOOGL": {
                "name": "Alphabet Inc.",
                "current_price": 173.68,
                "previous_close": 168.21,
                "market_cap": 2114328199168,
                "pe_ratio": 22.8,
                "dividend_yield": 0.0,
                "fifty_two_week_high": 193.0,
                "fifty_two_week_low": 129.0
            },
            "AMZN": {
                "name": "Amazon.com, Inc.",
                "current_price": 213.57,
                "previous_close": 207.91,
                "market_cap": 2267344535552,
                "pe_ratio": 45.2,
                "dividend_yield": 0.0,
                "fifty_two_week_high": 230.0,
                "fifty_two_week_low": 139.0
            },
            "TSLA": {
                "name": "Tesla, Inc.",
                "current_price": 295.14,
                "previous_close": 284.70,
                "market_cap": 950634151936,
                "pe_ratio": 85.4,
                "dividend_yield": 0.0,
                "fifty_two_week_high": 488.0,
                "fifty_two_week_low": 138.0
            }
        }
        
        if symbol.upper() in fallback_data:
            data = fallback_data[symbol.upper()].copy()
            data["symbol"] = symbol.upper()
            data["currency"] = "USD"
            return data
        else:
            # Generic fallback for unknown symbols
            return {
                "symbol": symbol.upper(),
                "name": f"{symbol.upper()} Corporation",
                "current_price": 100.0,
                "previous_close": 99.5,
                "currency": "USD",
                "market_cap": 1000000000,
                "pe_ratio": 20.0,
                "dividend_yield": 0.02,
                "fifty_two_week_high": 110.0,
                "fifty_two_week_low": 90.0
            }

    def _generate_fallback_history(self, symbol: str, days: int = 30) -> List[Dict]:
        """Generate fallback historical data for testing."""
        import random
        
        base_price = 100.0
        if symbol.upper() == "AAPL":
            base_price = 203.92
        elif symbol.upper() == "MSFT":
            base_price = 470.38
        elif symbol.upper() == "GOOGL":
            base_price = 173.68
        elif symbol.upper() == "AMZN":
            base_price = 213.57
        elif symbol.upper() == "TSLA":
            base_price = 295.14
        
        data = []
        current_date = datetime.now() - timedelta(days=days)
        current_price = base_price
        
        for i in range(days):
            # Simulate price movement
            change = random.uniform(-0.05, 0.05)  # ±5% daily change
            current_price *= (1 + change)
            
            data.append({
                "date": current_date.strftime("%Y-%m-%d"),
                "open": round(current_price * 0.995, 2),
                "high": round(current_price * 1.02, 2),
                "low": round(current_price * 0.98, 2),
                "close": round(current_price, 2),
                "volume": random.randint(1000000, 10000000)
            })
            
            current_date += timedelta(days=1)
        
        return data

    async def get_stock_info(self, symbol: str) -> Dict:
        """Get basic stock information."""
        try:
            # Clear cache before each request
            self._clear_yfinance_cache()
            
            stock = yf.Ticker(symbol)
            info = stock.info
            
            # Validate that we got actual stock data
            if not info or len(info) < 5:
                raise ValueError(f"No data found for symbol {symbol}")
            
            # Get current price and previous close
            current_price = self._safe_get_float(info, "currentPrice")
            previous_close = self._safe_get_float(info, "previousClose")
            
            # If currentPrice is not available, try regularMarketPrice
            if current_price == 0.0:
                current_price = self._safe_get_float(info, "regularMarketPrice")
            
            # If still no current price, use previous close
            if current_price == 0.0:
                current_price = previous_close

            return {
                "symbol": symbol.upper(),
                "name": info.get("longName", info.get("shortName", symbol)),
                "current_price": current_price,
                "previous_close": previous_close,
                "currency": info.get("currency", "USD"),
                "market_cap": self._safe_get_int(info, "marketCap"),
                "pe_ratio": self._safe_get_float(info, "trailingPE"),
                "dividend_yield": self._safe_get_float(info, "dividendYield"),
                "fifty_two_week_high": self._safe_get_float(info, "fiftyTwoWeekHigh"),
                "fifty_two_week_low": self._safe_get_float(info, "fiftyTwoWeekLow")
            }
        except Exception as e:
            # Use fallback data for demo purposes
            print(f"yfinance error for {symbol}: {e}")
            print("Using fallback data for demonstration...")
            return self._get_fallback_data(symbol)

    async def get_historical_data(self, symbol: str, days: int = 30) -> List[Dict]:
        """Get historical price data."""
        try:
            # Clear cache before each request
            self._clear_yfinance_cache()
            
            stock = yf.Ticker(symbol)
            
            # Use period instead of start/end dates to avoid datetime issues
            if days <= 7:
                period = "7d"
            elif days <= 30:
                period = "1mo"
            elif days <= 90:
                period = "3mo"
            else:
                period = "1y"
            
            df = stock.history(period=period)
            
            if df.empty:
                raise ValueError(f"No historical data found for {symbol}")
            
            # Limit to requested number of days
            if len(df) > days:
                df = df.tail(days)
            
            return [{
                "date": index.strftime("%Y-%m-%d"),
                "open": float(row["Open"]),
                "high": float(row["High"]),
                "low": float(row["Low"]),
                "close": float(row["Close"]),
                "volume": int(row["Volume"])
            } for index, row in df.iterrows()]
        except Exception as e:
            # Use fallback data for demo purposes
            print(f"yfinance error for {symbol} history: {e}")
            print("Using fallback historical data for demonstration...")
            return self._generate_fallback_history(symbol, days)

    def calculate_sma(self, prices: List[float], period: int = 20) -> List[Optional[float]]:
        """Calculate Simple Moving Average."""
        if len(prices) < period:
            return [None] * len(prices)
        
        df = pd.Series(prices)
        sma = df.rolling(window=period).mean()
        return [None if pd.isna(x) else float(x) for x in sma.tolist()]

    def calculate_rsi(self, prices: List[float], period: int = 14) -> List[Optional[float]]:
        """Calculate Relative Strength Index."""
        if len(prices) < period + 1:
            return [None] * len(prices)
        
        df = pd.Series(prices)
        delta = df.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return [None if pd.isna(x) else float(x) for x in rsi.tolist()]

    async def analyze_stock(self, symbol: str, indicators: List[str] = ["sma", "rsi"]) -> Dict:
        """Perform basic technical analysis."""
        try:
            # Get historical data
            data = await self.get_historical_data(symbol, days=100)
            
            if not data:
                raise ValueError(f"No data available for analysis of {symbol}")
            
            prices = [d["close"] for d in data]
            dates = [d["date"] for d in data]
            
            # Calculate indicators
            result = {
                "symbol": symbol.upper(),
                "dates": dates,
                "prices": prices,
                "indicators": {}
            }
            
            if "sma" in indicators:
                result["indicators"]["sma"] = {
                    "values": self.calculate_sma(prices),
                    "period": 20
                }
            
            if "rsi" in indicators:
                result["indicators"]["rsi"] = {
                    "values": self.calculate_rsi(prices),
                    "period": 14
                }
            
            return result
        except Exception as e:
            raise ValueError(f"Error analyzing stock: {str(e)}")

    async def get_chart_data(self, symbol: str, period: str = "1m", interval: str = "1d") -> Dict:
        """Get chart data optimized for frontend charting with flexible time periods."""
        try:
            # Clear cache before each request
            self._clear_yfinance_cache()
            
            stock = yf.Ticker(symbol)
            
            # Map period strings to yfinance periods
            period_map = {
                "1d": "1d",
                "1w": "5d", 
                "1m": "1mo",
                "3m": "3mo",
                "6m": "6mo",
                "1y": "1y",
                "5y": "5y"
            }
            
            # Map interval strings to yfinance intervals
            interval_map = {
                "1m": "1m",
                "5m": "5m", 
                "15m": "15m",
                "1h": "1h",
                "1d": "1d"
            }
            
            yf_period = period_map.get(period, "1mo")
            yf_interval = interval_map.get(interval, "1d")
            
            # Adjust interval based on period for optimal data
            if period in ["1d"]:
                yf_interval = "5m"
            elif period in ["1w"]:
                yf_interval = "1h"
            elif period in ["1m", "3m"]:
                yf_interval = "1d"
            elif period in ["6m", "1y", "5y"]:
                yf_interval = "1d"
            else:
                yf_interval = "1d"
            
            df = stock.history(period=yf_period, interval=yf_interval)
            
            if df.empty:
                raise ValueError(f"No chart data found for {symbol}")
            
            # Format data for Chart.js
            chart_data = []
            for index, row in df.iterrows():
                chart_data.append({
                    "x": index.isoformat(),
                    "o": float(row["Open"]),
                    "h": float(row["High"]),
                    "l": float(row["Low"]),
                    "c": float(row["Close"]),
                    "v": int(row["Volume"])
                })
            
            return {
                "symbol": symbol.upper(),
                "period": period,
                "interval": interval,
                "data": chart_data,
                "data_points": len(chart_data),
                "last_updated": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"yfinance error for {symbol} chart data: {e}")
            print("Using fallback chart data for demonstration...")
            return self._generate_fallback_chart_data(symbol, period)
    
    def _generate_fallback_chart_data(self, symbol: str, period: str = "1m") -> Dict:
        """Generate fallback chart data for demonstration."""
        import random
        
        # Determine number of data points based on period
        data_points_map = {
            "1d": 78,    # 5-minute intervals for 1 day (6.5 hours * 12)
            "1w": 35,    # Hourly intervals for 1 week (5 days * 7 hours)
            "1m": 30,    # Daily intervals for 1 month
            "3m": 90,    # Daily intervals for 3 months
            "6m": 180,   # Daily intervals for 6 months
            "1y": 365,   # Daily intervals for 1 year
            "5y": 1825   # Daily intervals for 5 years (365 * 5)
        }
        
        data_points = data_points_map.get(period, 30)
        
        # Base price for different stocks
        base_price = 100.0
        if symbol.upper() == "AAPL":
            base_price = 203.92
        elif symbol.upper() == "MSFT":
            base_price = 470.38
        elif symbol.upper() == "GOOGL":
            base_price = 173.68
        elif symbol.upper() == "AMZN":
            base_price = 213.57
        elif symbol.upper() == "TSLA":
            base_price = 295.14
        
        # Generate time series data
        chart_data = []
        current_price = base_price
        
        # Calculate time delta based on period
        if period == "1d":
            time_delta = timedelta(minutes=5)
            start_time = datetime.now().replace(hour=9, minute=30, second=0, microsecond=0)
        elif period == "1w":
            time_delta = timedelta(hours=1)
            start_time = datetime.now() - timedelta(days=7)
        else:
            time_delta = timedelta(days=1)
            start_time = datetime.now() - timedelta(days=data_points)
        
        current_time = start_time
        
        for i in range(data_points):
            # Simulate realistic price movement
            volatility = 0.02 if period in ["1d", "1w"] else 0.05
            change = random.uniform(-volatility, volatility)
            current_price *= (1 + change)
            
            # Generate OHLC data
            open_price = current_price
            high_price = open_price * (1 + random.uniform(0, volatility/2))
            low_price = open_price * (1 - random.uniform(0, volatility/2))
            close_price = random.uniform(low_price, high_price)
            
            chart_data.append({
                "x": current_time.isoformat(),
                "o": round(open_price, 2),
                "h": round(high_price, 2),
                "l": round(low_price, 2),
                "c": round(close_price, 2),
                "v": random.randint(100000, 5000000)
            })
            
            current_time += time_delta
            current_price = close_price
        
        return {
            "symbol": symbol.upper(),
            "period": period,
            "interval": "auto",
            "data": chart_data,
            "data_points": len(chart_data),
            "last_updated": datetime.now().isoformat(),
            "source": "fallback_data"
        }

    async def get_historical_data_flexible(self, symbol: str, period: str = "1m", interval: str = "1d") -> List[Dict]:
        """Get historical data with flexible period and interval support."""
        try:
            chart_data = await self.get_chart_data(symbol, period, interval)
            
            # Convert chart data format to historical data format
            historical_data = []
            for point in chart_data["data"]:
                historical_data.append({
                    "date": point["x"][:10],  # Extract date part from ISO string
                    "open": point["o"],
                    "high": point["h"],
                    "low": point["l"],
                    "close": point["c"],
                    "volume": point["v"]
                })
            
            return historical_data
            
        except Exception as e:
            print(f"Error getting flexible historical data for {symbol}: {e}")
            # Fallback to original method
            days_map = {"1d": 1, "1w": 7, "1m": 30, "3m": 90, "6m": 180, "1y": 365, "5y": 1825}
            days = days_map.get(period, 30)
            return await self.get_historical_data(symbol, days) 
    
    async def get_technical_chart_data(self, symbol: str, period: str = "1m") -> Dict:
        """Get chart data with technical indicators for secondary chart."""
        try:
            # Get base chart data
            chart_data = await self.get_chart_data(symbol, period, "1d")
            
            # Extract prices for technical calculations
            prices = [point["c"] for point in chart_data["data"]]
            dates = [point["x"] for point in chart_data["data"]]
            
            # Calculate technical indicators
            sma_20 = self.calculate_sma(prices, 20)
            sma_50 = self.calculate_sma(prices, 50)
            sma_200 = self.calculate_sma(prices, 200)
            rsi = self.calculate_rsi(prices, 14)
            
            # Calculate EMA (simplified)
            ema_12 = self.calculate_ema(prices, 12)
            ema_26 = self.calculate_ema(prices, 26)
            
            # Calculate MACD
            macd_line, macd_signal = self.calculate_macd(ema_12, ema_26)
            
            # Calculate Bollinger Bands
            bb_upper, bb_middle, bb_lower = self.calculate_bollinger_bands(prices, 20)
            
            # Format data for Chart.js
            technical_data = {
                "symbol": symbol.upper(),
                "period": period,
                "dates": dates,
                "price": prices,
                "indicators": {
                    "sma_20": sma_20,
                    "sma_50": sma_50,
                    "sma_200": sma_200,
                    "rsi": rsi,
                    "ema_12": ema_12,
                    "ema_26": ema_26,
                    "macd_line": macd_line,
                    "macd_signal": macd_signal,
                    "bollinger_upper": bb_upper,
                    "bollinger_middle": bb_middle,
                    "bollinger_lower": bb_lower
                },
                "last_updated": datetime.now().isoformat()
            }
            
            return technical_data
            
        except Exception as e:
            print(f"Error getting technical chart data for {symbol}: {e}")
            return self._generate_fallback_technical_data(symbol, period)
    
    def calculate_ema(self, prices: List[float], period: int = 12) -> List[Optional[float]]:
        """Calculate Exponential Moving Average."""
        if len(prices) < period:
            return [None] * len(prices)
        
        ema = [None] * len(prices)
        multiplier = 2 / (period + 1)
        
        # Start with SMA for the first value
        ema[period - 1] = sum(prices[:period]) / period
        
        # Calculate EMA for remaining values
        for i in range(period, len(prices)):
            ema[i] = (prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier))
        
        return ema
    
    def calculate_macd(self, ema_12: List[Optional[float]], ema_26: List[Optional[float]]) -> Tuple[List[Optional[float]], List[Optional[float]]]:
        """Calculate MACD line and signal line."""
        macd_line = []
        
        # Calculate MACD line (EMA12 - EMA26)
        for i in range(len(ema_12)):
            if ema_12[i] is not None and ema_26[i] is not None:
                macd_line.append(ema_12[i] - ema_26[i])
            else:
                macd_line.append(None)
        
        # Calculate signal line (9-period EMA of MACD line)
        macd_signal = self.calculate_ema([x for x in macd_line if x is not None], 9)
        
        # Pad signal line to match length
        while len(macd_signal) < len(macd_line):
            macd_signal.insert(0, None)
        
        return macd_line, macd_signal
    
    def calculate_bollinger_bands(self, prices: List[float], period: int = 20, std_dev: float = 2.0) -> Tuple[List[Optional[float]], List[Optional[float]], List[Optional[float]]]:
        """Calculate Bollinger Bands."""
        if len(prices) < period:
            return [None] * len(prices), [None] * len(prices), [None] * len(prices)
        
        upper_band = [None] * len(prices)
        middle_band = [None] * len(prices)
        lower_band = [None] * len(prices)
        
        for i in range(period - 1, len(prices)):
            # Calculate SMA for middle band
            sma = sum(prices[i - period + 1:i + 1]) / period
            middle_band[i] = sma
            
            # Calculate standard deviation
            variance = sum([(price - sma) ** 2 for price in prices[i - period + 1:i + 1]]) / period
            std = variance ** 0.5
            
            # Calculate upper and lower bands
            upper_band[i] = sma + (std_dev * std)
            lower_band[i] = sma - (std_dev * std)
        
        return upper_band, middle_band, lower_band
    
    def _generate_fallback_technical_data(self, symbol: str, period: str = "1m") -> Dict:
        """Generate fallback technical chart data."""
        # Get fallback chart data
        chart_data = self._generate_fallback_chart_data(symbol, period)
        prices = [point["c"] for point in chart_data["data"]]
        dates = [point["x"] for point in chart_data["data"]]
        
        # Generate simple technical indicators
        sma_20 = self.calculate_sma(prices, 20)
        rsi = self.calculate_rsi(prices, 14)
        
        return {
            "symbol": symbol.upper(),
            "period": period,
            "dates": dates,
            "price": prices,
            "indicators": {
                "sma_20": sma_20,
                "sma_50": [None] * len(prices),
                "sma_200": [None] * len(prices),
                "rsi": rsi,
                "ema_12": [None] * len(prices),
                "ema_26": [None] * len(prices),
                "macd_line": [None] * len(prices),
                "macd_signal": [None] * len(prices),
                "bollinger_upper": [None] * len(prices),
                "bollinger_middle": [None] * len(prices),
                "bollinger_lower": [None] * len(prices)
            },
            "last_updated": datetime.now().isoformat(),
            "source": "fallback_data"
        }