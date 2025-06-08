from fastapi import APIRouter, HTTPException, status, Query
from typing import Dict, List, Optional

from ..services.stock_service import StockService
from ..services.recommendation_service import RecommendationService
from ..services.news_service import NewsService

router = APIRouter()
stock_service = StockService()
recommendation_service = RecommendationService()
news_service = NewsService()

@router.get("/{symbol}")
async def get_stock_info(symbol: str) -> Dict:
    """Get basic stock information."""
    try:
        return await stock_service.get_stock_info(symbol)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/{symbol}/history")
async def get_stock_history(
    symbol: str, 
    days: int = Query(30, ge=1, le=365),
    period: str = Query("1m", pattern="^(1d|1w|1m|3m|6m|1y|5y)$"),
    interval: str = Query("1d", pattern="^(1m|5m|15m|1h|1d)$")
) -> List[Dict]:
    """Get historical stock data with flexible time periods."""
    try:
        # Use new flexible method if period is specified, otherwise use legacy days parameter
        if period != "1m" or interval != "1d":
            return await stock_service.get_historical_data_flexible(symbol, period, interval)
        else:
            return await stock_service.get_historical_data(symbol, days)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/{symbol}/chart-data")
async def get_chart_data(
    symbol: str,
    period: str = Query("1m", pattern="^(1d|1w|1m|3m|6m|1y|5y)$"),
    interval: str = Query("1d", pattern="^(1m|5m|15m|1h|1d)$")
) -> Dict:
    """Get chart data optimized for frontend charting."""
    try:
        return await stock_service.get_chart_data(symbol, period, interval)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/{symbol}/news")
async def get_stock_news(symbol: str) -> Dict:
    """Get latest news for a stock."""
    try:
        return await news_service.get_stock_news(symbol)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching news: {str(e)}")

@router.get("/{symbol}/analysis")
async def get_stock_analysis(symbol: str) -> Dict:
    """Get technical analysis for a stock."""
    try:
        return await stock_service.analyze_stock(symbol)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/{symbol}/recommendation")
async def get_stock_recommendation(symbol: str) -> Dict:
    """Get simplified buy/sell recommendation with star rating."""
    try:
        return await recommendation_service.get_recommendation(symbol)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recommendation: {str(e)}")

@router.get("/{symbol}/technical-chart")
async def get_technical_chart_data(
    symbol: str,
    period: str = Query("1m", pattern="^(1d|1w|1m|3m|6m|1y|5y)$")
) -> Dict:
    """Get technical chart data with indicators for secondary chart."""
    try:
        return await stock_service.get_technical_chart_data(symbol, period)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

# Legacy endpoints for backward compatibility
@router.get("/{symbol}/signals")
async def get_trading_signals(symbol: str) -> Dict:
    """Get simplified trading signals (legacy endpoint)."""
    try:
        recommendation = await recommendation_service.get_recommendation(symbol)
        
        # Convert new format to legacy format for compatibility
        return {
            "symbol": symbol.upper(),
            "primary_signal": {
                "action": recommendation["action"],
                "color": recommendation["color"],
                "icon": "🟢" if recommendation["action"] == "BUY" else "🔴"
            },
            "score": recommendation["overall_score"],
            "confidence": recommendation["confidence"],
            "risk_level": recommendation["risk_level"],
            "stars": recommendation["stars"],
            "reasoning": recommendation["reasoning"],
            "timestamp": recommendation["timestamp"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating signals: {str(e)}")

@router.get("/{symbol}/score-breakdown")
async def get_score_breakdown(symbol: str) -> Dict:
    """Get detailed breakdown of recommendation scoring (legacy endpoint)."""
    try:
        recommendation = await recommendation_service.get_recommendation(symbol)
        
        # Convert new simplified format to legacy detailed format for compatibility
        return {
            "symbol": symbol.upper(),
            "overall_score": recommendation["overall_score"],
            "action": recommendation["action"],
            "stars": recommendation["stars"],
            "confidence": recommendation["confidence"],
            "simplified_reasoning": recommendation["reasoning"],
            "price_target": recommendation["price_target"],
            "risk_level": recommendation["risk_level"],
            "methodology": {
                "scoring_scale": "Simplified 1-5 star rating",
                "decision_threshold": "6.0+ = BUY, <6.0 = SELL",
                "confidence_factors": "Signal agreement and data quality"
            },
            "timestamp": recommendation["timestamp"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating score breakdown: {str(e)}") 