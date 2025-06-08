from typing import Dict, List, Optional, Tuple
import statistics
from datetime import datetime, timedelta
from .stock_service import StockService

class RecommendationService:
    def __init__(self):
        self.stock_service = StockService()
        self.indicator_explanations = self._get_indicator_explanations()
    
    async def get_recommendation(self, symbol: str) -> Dict:
        """Get simplified stock recommendation with clear BUY/SELL decision."""
        try:
            # Get stock data
            stock_info = await self.stock_service.get_stock_info(symbol)
            historical_data = await self.stock_service.get_historical_data(symbol, days=50)
            analysis_data = await self.stock_service.analyze_stock(symbol)
            
            # Calculate individual scores
            technical_score = self._calculate_technical_score(stock_info, historical_data, analysis_data)
            fundamental_score = self._calculate_fundamental_score(stock_info, historical_data)
            sentiment_score = self._calculate_sentiment_score(stock_info, historical_data)
            
            # Calculate composite score (weighted average)
            composite_score = (
                technical_score["score"] * 0.40 +
                fundamental_score["score"] * 0.35 +
                sentiment_score["score"] * 0.25
            )
            
            # Generate simplified recommendation
            recommendation = self._get_simplified_recommendation(composite_score, technical_score, fundamental_score, sentiment_score)
            
            # Generate detailed indicators
            indicators = self._generate_detailed_indicators(stock_info, historical_data, analysis_data, technical_score, fundamental_score, sentiment_score)
            
            return {
                "symbol": symbol.upper(),
                "action": recommendation["action"],
                "stars": recommendation["stars"],
                "confidence": recommendation["confidence"],
                "color": recommendation["color"],
                "reasoning": recommendation["reasoning"],
                "indicators": indicators,
                "indicator_explanations": self.indicator_explanations,
                "price_target": self._calculate_price_target(stock_info, composite_score),
                "risk_level": self._assess_risk(stock_info, historical_data),
                "overall_score": round(composite_score, 1),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            # Return neutral recommendation on error
            return self._get_fallback_recommendation(symbol)
    
    def _get_indicator_explanations(self) -> Dict[str, str]:
        """Get explanations for all technical indicators."""
        return {
            "RSI": "Relative Strength Index measures if a stock is overbought (>70) or oversold (<30)",
            "Moving Average": "Compares current price to 20-day average to identify trends",
            "Volume": "Trading volume indicates investor interest and conviction",
            "Price Momentum": "Recent price movement direction shows market sentiment",
            "Volatility": "Price stability assessment helps gauge investment risk",
            "Market Cap": "Company size classification (Large/Mid/Small cap) affects stability",
            "P/E Ratio": "Price-to-Earnings ratio shows if stock is fairly valued",
            "52-Week Position": "Current price vs yearly range shows relative performance",
            "Dividend Yield": "Annual dividend payment as percentage of stock price",
            "Price Target": "Analyst estimate of fair value based on fundamentals"
        }
    
    def _get_simplified_recommendation(self, score: float, technical: Dict, fundamental: Dict, sentiment: Dict) -> Dict:
        """Generate simplified BUY/SELL recommendation with star rating."""
        
        # Determine action based on score
        if score >= 6.0:
            action = "BUY"
            color = "green"
            # Convert score to 1-5 stars (6.0 = 1 star, 10.0 = 5 stars)
            stars = min(5, max(1, int((score - 5.0) * 1.25)))
        else:
            action = "SELL"
            color = "red"
            # Convert score to 1-5 stars (1.0 = 5 stars, 5.9 = 1 star)
            stars = min(5, max(1, int((6.0 - score) * 1.25)))
        
        # Calculate confidence based on signal agreement
        confidence = self._calculate_confidence(technical, fundamental, sentiment)
        
        # Generate top 3 reasons
        reasoning = self._generate_simplified_reasoning(action, technical, fundamental, sentiment)
        
        return {
            "action": action,
            "stars": stars,
            "confidence": confidence,
            "color": color,
            "reasoning": reasoning
        }
    
    def _generate_simplified_reasoning(self, action: str, technical: Dict, fundamental: Dict, sentiment: Dict) -> List[str]:
        """Generate top 3 simplified reasons for the recommendation without duplicates."""
        reasons = []
        used_concepts = set()  # Track used concepts to prevent duplicates
        
        # Collect all potential reasons with scores and categories
        all_reasons = []
        
        # Technical reasons
        for reason in technical.get("reasoning", []):
            category = self._categorize_reason(reason)
            if category not in used_concepts:
                if any(keyword in reason.lower() for keyword in ["strong", "positive", "bullish", "oversold", "above"]):
                    all_reasons.append((reason, "positive", technical["score"], category))
                elif any(keyword in reason.lower() for keyword in ["weak", "negative", "bearish", "overbought", "below"]):
                    all_reasons.append((reason, "negative", technical["score"], category))
        
        # Fundamental reasons
        for reason in fundamental.get("reasoning", []):
            category = self._categorize_reason(reason)
            if category not in used_concepts:
                if any(keyword in reason.lower() for keyword in ["undervaluation", "reasonable", "large cap", "attractive"]):
                    all_reasons.append((reason, "positive", fundamental["score"], category))
                elif any(keyword in reason.lower() for keyword in ["overvaluation", "elevated", "stretched", "risk"]):
                    all_reasons.append((reason, "negative", fundamental["score"], category))
        
        # Sentiment reasons
        for reason in sentiment.get("reasoning", []):
            category = self._categorize_reason(reason)
            if category not in used_concepts:
                if any(keyword in reason.lower() for keyword in ["gain", "positive", "stability", "strong"]):
                    all_reasons.append((reason, "positive", sentiment["score"], category))
                elif any(keyword in reason.lower() for keyword in ["weak", "negative", "uncertainty", "weakness"]):
                    all_reasons.append((reason, "negative", sentiment["score"], category))
        
        # Filter reasons that match the action
        target_sentiment = "positive" if action == "BUY" else "negative"
        matching_reasons = [r for r in all_reasons if r[1] == target_sentiment]
        
        # Sort by score and take unique reasons
        matching_reasons.sort(key=lambda x: x[2], reverse=(action == "BUY"))
        
        # Extract and simplify the reason text, ensuring no duplicates
        for reason, _, _, category in matching_reasons:
            if category not in used_concepts and len(reasons) < 3:
                simplified = self._simplify_reason_text(reason)
                if simplified and simplified not in reasons:
                    reasons.append(simplified)
                    used_concepts.add(category)
        
        # If not enough matching reasons, include neutral/opposite reasons
        if len(reasons) < 3:
            other_reasons = [r for r in all_reasons if r[1] != target_sentiment]
            other_reasons.sort(key=lambda x: x[2], reverse=(action == "SELL"))
            
            for reason, _, _, category in other_reasons:
                if category not in used_concepts and len(reasons) < 3:
                    simplified = self._simplify_reason_text(reason)
                    if simplified and simplified not in reasons:
                        reasons.append(simplified)
                        used_concepts.add(category)
        
        # Ensure we have at least 3 unique reasons
        fallback_reasons = {
            "BUY": [
                "Technical indicators suggest potential upside",
                "Market fundamentals appear favorable", 
                "Recent price action shows strength"
            ],
            "SELL": [
                "Market conditions indicate caution advised",
                "Technical signals suggest downside risk",
                "Valuation metrics appear stretched"
            ]
        }
        
        while len(reasons) < 3:
            for fallback in fallback_reasons.get(action, fallback_reasons["BUY"]):
                if fallback not in reasons and len(reasons) < 3:
                    reasons.append(fallback)
        
        return reasons[:3]
    
    def _categorize_reason(self, reason: str) -> str:
        """Categorize a reason to prevent duplicates."""
        reason_lower = reason.lower()
        
        if any(term in reason_lower for term in ["rsi", "momentum", "oversold", "overbought"]):
            return "momentum"
        elif any(term in reason_lower for term in ["sma", "trend", "price trend", "moving average"]):
            return "trend"
        elif any(term in reason_lower for term in ["p/e", "valuation", "ratio"]):
            return "valuation"
        elif any(term in reason_lower for term in ["market cap", "company", "stability", "size"]):
            return "company_size"
        elif any(term in reason_lower for term in ["performance", "gain", "change", "week"]):
            return "performance"
        elif any(term in reason_lower for term in ["volume", "trading"]):
            return "volume"
        else:
            return "general"
    
    def _simplify_reason_text(self, reason: str) -> str:
        """Simplify technical jargon into plain language."""
        # Remove technical details and make more readable
        simplified = reason
        
        # Replace technical terms
        replacements = {
            "RSI at": "Market momentum shows",
            "P/E ratio of": "Stock valuation at",
            "SMA": "price trend",
            "indicates oversold conditions": "suggests buying opportunity",
            "indicates overbought conditions": "suggests selling opportunity",
            "suggests undervaluation": "appears undervalued",
            "suggests overvaluation": "appears overvalued",
            "bullish trend": "upward trend",
            "bearish trend": "downward trend"
        }
        
        for old, new in replacements.items():
            simplified = simplified.replace(old, new)
        
        # Capitalize first letter
        simplified = simplified[0].upper() + simplified[1:] if simplified else ""
        
        return simplified
    
    def _calculate_price_target(self, stock_info: Dict, score: float) -> float:
        """Calculate a simple price target based on current price and score."""
        current_price = stock_info.get("current_price", 100.0)
        
        # Simple price target calculation
        if score >= 8.0:
            # Strong buy: 10-20% upside
            multiplier = 1.15
        elif score >= 6.0:
            # Buy: 5-10% upside
            multiplier = 1.075
        elif score >= 4.0:
            # Neutral: -5% to +5%
            multiplier = 1.0
        else:
            # Sell: 5-15% downside
            multiplier = 0.925
        
        return round(current_price * multiplier, 2)
    
    def _generate_detailed_indicators(self, stock_info: Dict, historical_data: List[Dict], analysis_data: Dict, technical: Dict, fundamental: Dict, sentiment: Dict) -> List[Dict]:
        """Generate detailed indicators with values and status."""
        indicators = []
        
        # RSI Indicator
        rsi_values = analysis_data.get("indicators", {}).get("rsi", {}).get("values", [])
        current_rsi = None
        if rsi_values:
            for rsi in reversed(rsi_values):
                if rsi is not None:
                    current_rsi = rsi
                    break
        
        if current_rsi is not None:
            rsi_status = "Oversold" if current_rsi < 30 else "Overbought" if current_rsi > 70 else "Neutral"
            rsi_color = "green" if current_rsi < 30 else "red" if current_rsi > 70 else "yellow"
            indicators.append({
                "name": "RSI",
                "value": f"{current_rsi:.1f}",
                "status": rsi_status,
                "color": rsi_color
            })
        
        # Moving Average Trend
        sma_values = analysis_data.get("indicators", {}).get("sma", {}).get("values", [])
        current_price = stock_info.get("current_price", 0)
        
        if sma_values and current_price > 0:
            current_sma = None
            for sma in reversed(sma_values):
                if sma is not None:
                    current_sma = sma
                    break
            
            if current_sma:
                ma_diff = ((current_price - current_sma) / current_sma) * 100
                ma_status = "Above Trend" if ma_diff > 2 else "Below Trend" if ma_diff < -2 else "On Trend"
                ma_color = "green" if ma_diff > 2 else "red" if ma_diff < -2 else "yellow"
                indicators.append({
                    "name": "Moving Average",
                    "value": f"{ma_diff:+.1f}%",
                    "status": ma_status,
                    "color": ma_color
                })
        
        # Price Momentum (7-day change)
        if len(historical_data) >= 7:
            week_ago_price = historical_data[-7]["close"]
            current_price = stock_info.get("current_price", historical_data[-1]["close"])
            momentum = ((current_price - week_ago_price) / week_ago_price) * 100
            momentum_status = "Strong Up" if momentum > 5 else "Strong Down" if momentum < -5 else "Moderate Up" if momentum > 0 else "Moderate Down" if momentum < 0 else "Flat"
            momentum_color = "green" if momentum > 0 else "red" if momentum < 0 else "yellow"
            indicators.append({
                "name": "Price Momentum",
                "value": f"{momentum:+.1f}%",
                "status": momentum_status,
                "color": momentum_color
            })
        
        # Market Cap Category
        market_cap = stock_info.get("market_cap", 0)
        if market_cap > 10_000_000_000:
            cap_category = "Large Cap"
            cap_color = "green"
        elif market_cap > 2_000_000_000:
            cap_category = "Mid Cap"
            cap_color = "yellow"
        else:
            cap_category = "Small Cap"
            cap_color = "red"
        
        indicators.append({
            "name": "Market Cap",
            "value": f"${market_cap/1_000_000_000:.1f}B",
            "status": cap_category,
            "color": cap_color
        })
        
        # P/E Ratio Assessment
        pe_ratio = stock_info.get("pe_ratio", 0)
        if pe_ratio > 0:
            pe_status = "Undervalued" if pe_ratio < 15 else "Overvalued" if pe_ratio > 25 else "Fair Value"
            pe_color = "green" if pe_ratio < 15 else "red" if pe_ratio > 25 else "yellow"
            indicators.append({
                "name": "P/E Ratio",
                "value": f"{pe_ratio:.1f}",
                "status": pe_status,
                "color": pe_color
            })
        
        # 52-Week Position
        current_price = stock_info.get("current_price", 0)
        week_high = stock_info.get("fifty_two_week_high", 0)
        week_low = stock_info.get("fifty_two_week_low", 0)
        
        if current_price > 0 and week_high > 0 and week_low > 0:
            position = ((current_price - week_low) / (week_high - week_low)) * 100
            position_status = "Near High" if position > 80 else "Near Low" if position < 20 else "Mid Range"
            position_color = "green" if 40 <= position <= 80 else "yellow" if position > 80 else "red"
            indicators.append({
                "name": "52-Week Position",
                "value": f"{position:.0f}%",
                "status": position_status,
                "color": position_color
            })
        
        # Volume Analysis (simplified)
        if len(historical_data) >= 10:
            recent_volumes = [d["volume"] for d in historical_data[-5:]]
            avg_volume = sum([d["volume"] for d in historical_data[-10:-5]]) / 5
            current_volume = recent_volumes[-1] if recent_volumes else avg_volume
            
            volume_ratio = current_volume / avg_volume if avg_volume > 0 else 1
            volume_status = "High Volume" if volume_ratio > 1.5 else "Low Volume" if volume_ratio < 0.5 else "Normal Volume"
            volume_color = "green" if volume_ratio > 1.2 else "red" if volume_ratio < 0.8 else "yellow"
            indicators.append({
                "name": "Volume",
                "value": f"{volume_ratio:.1f}x",
                "status": volume_status,
                "color": volume_color
            })
        
        return indicators
    
    def _calculate_technical_score(self, stock_info: Dict, historical_data: List[Dict], analysis_data: Dict) -> Dict:
        """Calculate simplified technical analysis score."""
        scores = {}
        reasoning = []
        
        # RSI Score (simplified)
        rsi_values = analysis_data.get("indicators", {}).get("rsi", {}).get("values", [])
        current_rsi = None
        if rsi_values:
            for rsi in reversed(rsi_values):
                if rsi is not None:
                    current_rsi = rsi
                    break
        
        if current_rsi is not None:
            if current_rsi < 35:
                scores["rsi"] = 8
                reasoning.append("Market momentum shows oversold conditions")
            elif current_rsi > 65:
                scores["rsi"] = 2
                reasoning.append("Market momentum shows overbought conditions")
            else:
                scores["rsi"] = 5
                reasoning.append("Market momentum appears neutral")
        else:
            scores["rsi"] = 5
        
        # Price Trend (simplified)
        sma_values = analysis_data.get("indicators", {}).get("sma", {}).get("values", [])
        current_price = stock_info.get("current_price", 0)
        
        if sma_values and current_price > 0:
            current_sma = None
            for sma in reversed(sma_values):
                if sma is not None:
                    current_sma = sma
                    break
            
            if current_sma and current_price > current_sma * 1.02:
                scores["trend"] = 7
                reasoning.append("Price trend shows strong upward momentum")
            elif current_sma and current_price < current_sma * 0.98:
                scores["trend"] = 3
                reasoning.append("Price trend shows downward pressure")
            else:
                scores["trend"] = 5
                reasoning.append("Price trend appears stable")
        else:
            scores["trend"] = 5
        
        # Calculate average technical score
        technical_score = statistics.mean(scores.values()) if scores else 5.0
        
        return {
            "score": technical_score,
            "reasoning": reasoning[:2],  # Top 2 technical reasons
            "weight": 0.40
        }
    
    def _calculate_fundamental_score(self, stock_info: Dict, historical_data: List[Dict]) -> Dict:
        """Calculate simplified fundamental analysis score."""
        scores = {}
        reasoning = []
        
        # P/E Ratio (simplified)
        pe_ratio = stock_info.get("pe_ratio", 0)
        if pe_ratio > 0:
            if pe_ratio < 18:
                scores["valuation"] = 7
                reasoning.append("Stock valuation appears attractive")
            elif pe_ratio > 30:
                scores["valuation"] = 3
                reasoning.append("Stock valuation appears stretched")
            else:
                scores["valuation"] = 5
                reasoning.append("Stock valuation appears fair")
        else:
            scores["valuation"] = 5
        
        # Market Position (simplified)
        market_cap = stock_info.get("market_cap", 0)
        if market_cap > 10_000_000_000:
            scores["stability"] = 6
            reasoning.append("Large company provides stability")
        elif market_cap > 2_000_000_000:
            scores["stability"] = 5
            reasoning.append("Mid-size company offers balance")
        else:
            scores["stability"] = 4
            reasoning.append("Smaller company carries higher risk")
        
        # Calculate average fundamental score
        fundamental_score = statistics.mean(scores.values()) if scores else 5.0
        
        return {
            "score": fundamental_score,
            "reasoning": reasoning[:2],  # Top 2 fundamental reasons
            "weight": 0.35
        }
    
    def _calculate_sentiment_score(self, stock_info: Dict, historical_data: List[Dict]) -> Dict:
        """Calculate simplified market sentiment score."""
        scores = {}
        reasoning = []
        
        # Recent Performance (simplified)
        if len(historical_data) >= 7:
            week_ago_price = historical_data[-7]["close"]
            current_price = stock_info.get("current_price", historical_data[-1]["close"])
            week_change = ((current_price - week_ago_price) / week_ago_price) * 100
            
            if week_change > 3:
                scores["momentum"] = 7
                reasoning.append("Recent performance shows strong gains")
            elif week_change < -3:
                scores["momentum"] = 3
                reasoning.append("Recent performance shows weakness")
            else:
                scores["momentum"] = 5
                reasoning.append("Recent performance appears stable")
        else:
            scores["momentum"] = 5
        
        # Calculate average sentiment score
        sentiment_score = statistics.mean(scores.values()) if scores else 5.0
        
        return {
            "score": sentiment_score,
            "reasoning": reasoning[:1],  # Top 1 sentiment reason
            "weight": 0.25
        }
    
    def _calculate_confidence(self, technical: Dict, fundamental: Dict, sentiment: Dict) -> int:
        """Calculate confidence level based on signal agreement."""
        scores = [technical["score"], fundamental["score"], sentiment["score"]]
        score_range = max(scores) - min(scores)
        
        # Higher confidence when scores agree
        if score_range < 1.5:
            return 95
        elif score_range < 2.5:
            return 85
        elif score_range < 3.5:
            return 75
        else:
            return 65
    
    def _assess_risk(self, stock_info: Dict, historical_data: List[Dict]) -> str:
        """Simplified risk assessment."""
        risk_factors = 0
        
        # Market cap risk
        market_cap = stock_info.get("market_cap", 0)
        if market_cap < 2_000_000_000:
            risk_factors += 1
        
        # Volatility risk (simplified)
        if len(historical_data) >= 10:
            prices = [d["close"] for d in historical_data[-10:]]
            volatility = (max(prices) - min(prices)) / statistics.mean(prices)
            if volatility > 0.15:  # 15% volatility
                risk_factors += 1
        
        if risk_factors >= 2:
            return "High"
        elif risk_factors == 1:
            return "Medium"
        else:
            return "Low"
    
    def _get_fallback_recommendation(self, symbol: str) -> Dict:
        """Provide fallback recommendation when data is unavailable."""
        return {
            "symbol": symbol.upper(),
            "action": "HOLD",
            "stars": 3,
            "confidence": 60,
            "color": "yellow",
            "reasoning": [
                "Insufficient data for analysis",
                "Market conditions unclear",
                "Consider waiting for more information"
            ],
            "price_target": 100.0,
            "risk_level": "Medium",
            "overall_score": 5.0,
            "timestamp": datetime.now().isoformat()
        } 