import { ChartDataPoint, StockInfo } from './stockDataService';
import { technicalIndicatorService } from './technicalIndicatorService';

export interface Recommendation {
  action: string;
  stars: number;
  confidence: number;
  price_target: number;
  reasoning: string[];
  indicators: Array<{
    name: string;
    value: string;
    status: string;
    color: string;
  }>;
  risk_level: string;
  sharpe_ratio: number;
  max_drawdown: number;
  market_regime: string;
  sector_momentum: number;
  algorithm_version: string;
}

export class RecommendationService {
  private static instance: RecommendationService;
  private readonly ALGORITHM_VERSION = "v2.0-Enhanced-ML";

  public static getInstance(): RecommendationService {
    if (!RecommendationService.instance) {
      RecommendationService.instance = new RecommendationService();
    }
    return RecommendationService.instance;
  }

  generateRecommendation(
    stockInfo: StockInfo,
    chartData: ChartDataPoint[],
    period: string = '1m'
  ): Recommendation {
    console.log('🚀 ENHANCED ALGORITHM v2.0 - Starting Advanced Multi-Factor Analysis');
    console.log(`📊 Analyzing ${stockInfo.symbol} | Price: $${stockInfo.current_price} | Period: ${period}`);
    
    // Calculate enhanced technical indicators
    const technicalData = technicalIndicatorService.calculateTechnicalIndicators(
      chartData,
      stockInfo.symbol,
      period
    );
    
    const currentValues = technicalIndicatorService.getCurrentIndicatorValues(technicalData);
    
    // Enhanced analysis with market regime detection
    const marketRegime = this.detectMarketRegime(chartData);
    const indicators = this.analyzeIndicators(currentValues, chartData, stockInfo, marketRegime);
    const weightedScore = this.calculateWeightedScore(indicators, marketRegime);
    const confidence = this.calculateConfidence(indicators);
    const riskScore = this.calculateRiskScore(chartData, marketRegime);
    
    console.log(`🎯 Market Regime: ${marketRegime} | Weighted Score: ${weightedScore.toFixed(1)}/100 | Confidence: ${confidence.toFixed(0)}%`);
    
    // Generate enhanced recommendation
    const recommendation = this.generateAdvancedRecommendation(
      weightedScore,
      confidence,
      riskScore,
      stockInfo,
      indicators,
      marketRegime
    );

    console.log(`✅ Final Recommendation: ${recommendation.action} (${recommendation.stars}⭐) | Target: $${recommendation.price_target.toFixed(2)}`);

    return recommendation;
  }

  private detectMarketRegime(chartData: ChartDataPoint[]): string {
    if (chartData.length < 20) return 'SIDEWAYS';
    
    const prices = chartData.map(d => d.c);
    const shortTrend = this.calculateTrend(prices.slice(-10));
    const mediumTrend = this.calculateTrend(prices.slice(-20));
    const volatility = this.calculateVolatility(chartData);
    
    if (volatility > 4) return 'VOLATILE';
    else if (shortTrend > 0.02 && mediumTrend > 0.01) return 'BULL';
    else if (shortTrend < -0.02 && mediumTrend < -0.01) return 'BEAR';
    else return 'SIDEWAYS';
  }

  private calculateTrend(prices: number[]): number {
    if (prices.length < 2) return 0;
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    return (lastPrice - firstPrice) / firstPrice;
  }

  private calculateVolatility(chartData: ChartDataPoint[]): number {
    if (chartData.length < 2) return 2;
    const returns = [];
    for (let i = 1; i < chartData.length; i++) {
      returns.push(Math.log(chartData[i].c / chartData[i - 1].c));
    }
    const avg = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + (ret - avg) ** 2, 0) / returns.length;
    return Math.sqrt(variance * 252) * 100;
  }

  private analyzeIndicators(
    currentValues: Record<string, number | null>,
    chartData: ChartDataPoint[],
    stockInfo: StockInfo,
    marketRegime: string
  ): Array<{ name: string; value: string; status: string; color: string; score: number; weight: number; confidence: number }> {
    const indicators = [];

    // Enhanced RSI Analysis
    if (currentValues.rsi !== null) {
      const rsi = currentValues.rsi;
      let score = 0, status = '', color = '';
      
      if (rsi > 80) {
        score = -85; status = 'Extremely Overbought - High Reversal Risk'; color = 'red';
      } else if (rsi > 70) {
        score = -60; status = 'Overbought - Caution Advised'; color = 'red';
      } else if (rsi < 20) {
        score = 85; status = 'Extremely Oversold - Strong Buy Signal'; color = 'green';
      } else if (rsi < 30) {
        score = 60; status = 'Oversold - Recovery Expected'; color = 'green';
      } else if (rsi > 55 && rsi < 70) {
        score = 35; status = 'Bullish Momentum Zone'; color = 'green';
      } else if (rsi < 45 && rsi > 30) {
        score = -35; status = 'Bearish Momentum Zone'; color = 'red';
      } else {
        score = 0; status = 'Neutral Zone'; color = 'orange';
      }

      indicators.push({
        name: 'Enhanced RSI',
        value: rsi.toFixed(1),
        status,
        color,
        score,
        weight: this.getAdaptiveWeight('RSI', marketRegime),
        confidence: Math.abs(score) > 60 ? 90 : Math.abs(score) > 30 ? 75 : 50
      });
    }

    // Enhanced MACD Analysis
    if (currentValues.macd_line !== null && currentValues.macd_signal !== null) {
      const histogram = currentValues.macd_line - currentValues.macd_signal;
      let score = 0, status = '', color = '';

      if (histogram > 1) {
        score = 80; status = 'Strong Bullish Momentum'; color = 'green';
      } else if (histogram > 0) {
        score = 50; status = 'Bullish Signal'; color = 'green';
      } else if (histogram < -1) {
        score = -80; status = 'Strong Bearish Momentum'; color = 'red';
      } else if (histogram < 0) {
        score = -50; status = 'Bearish Signal'; color = 'red';
      } else {
        score = 0; status = 'Neutral'; color = 'orange';
      }

      indicators.push({
        name: 'Enhanced MACD',
        value: histogram.toFixed(3),
        status,
        color,
        score,
        weight: this.getAdaptiveWeight('MACD', marketRegime),
        confidence: Math.abs(score) > 60 ? 85 : 70
      });
    }

    // Moving Average Convergence Analysis
    if (currentValues.sma_20 !== null && currentValues.sma_50 !== null) {
      const price = stockInfo.current_price;
      const sma20 = currentValues.sma_20;
      const sma50 = currentValues.sma_50;
      let score = 0, status = '', color = '';

      if (price > sma20 && sma20 > sma50) {
        score = 75; status = 'Perfect Bullish Alignment'; color = 'green';
      } else if (price > sma20) {
        score = 40; status = 'Above Short-term MA'; color = 'green';
      } else if (price < sma20 && sma20 < sma50) {
        score = -75; status = 'Perfect Bearish Alignment'; color = 'red';
      } else if (price < sma20) {
        score = -40; status = 'Below Short-term MA'; color = 'red';
      } else {
        score = 0; status = 'Consolidation'; color = 'orange';
      }

      indicators.push({
        name: 'MA Convergence',
        value: `${(price/sma20*100).toFixed(1)}%`,
        status,
        color,
        score,
        weight: this.getAdaptiveWeight('MA', marketRegime),
        confidence: Math.abs(score) > 60 ? 85 : 70
      });
    }

    // Volume Analysis with Pattern Recognition
    if (chartData.length >= 10) {
      const volumeTrend = this.calculateVolumeTrend(chartData);
      const momentum = this.calculateMomentum(chartData);
      let score = 0, status = '', color = '';

      if (volumeTrend > 0.3 && momentum > 0) {
        score = 65; status = 'Strong Volume Confirmation'; color = 'green';
      } else if (volumeTrend < -0.3 && momentum < 0) {
        score = -65; status = 'Bearish Volume Pattern'; color = 'red';
      } else if (Math.abs(volumeTrend) < 0.1) {
        score = -20; status = 'Low Volume - Weak Signal'; color = 'orange';
      } else {
        score = 0; status = 'Normal Volume'; color = 'blue';
      }

      indicators.push({
        name: 'Volume Analysis',
        value: `${(volumeTrend * 100).toFixed(1)}%`,
        status,
        color,
        score,
        weight: this.getAdaptiveWeight('Volume', marketRegime),
        confidence: Math.abs(volumeTrend) > 0.2 ? 75 : 50
      });
    }

    // Price Momentum Analysis
    if (chartData.length >= 5) {
      const momentum = this.calculateMomentum(chartData);
      let score = 0, status = '', color = '';

      if (momentum > 0.05) {
        score = 70; status = 'Strong Bullish Momentum'; color = 'green';
      } else if (momentum > 0.02) {
        score = 40; status = 'Positive Momentum'; color = 'green';
      } else if (momentum < -0.05) {
        score = -70; status = 'Strong Bearish Momentum'; color = 'red';
      } else if (momentum < -0.02) {
        score = -40; status = 'Negative Momentum'; color = 'red';
      } else {
        score = 0; status = 'Neutral Momentum'; color = 'orange';
      }

      indicators.push({
        name: 'Price Momentum',
        value: `${(momentum * 100).toFixed(2)}%`,
        status,
        color,
        score,
        weight: this.getAdaptiveWeight('Momentum', marketRegime),
        confidence: Math.abs(momentum) > 0.03 ? 80 : 60
      });
    }

    return indicators;
  }

  private getAdaptiveWeight(indicator: string, regime: string): number {
    const baseWeights: Record<string, number> = {
      'RSI': 20,
      'MACD': 25,
      'MA': 25,
      'Volume': 15,
      'Momentum': 15
    };

    // Adjust weights based on market regime
    const adjustments: Record<string, Record<string, number>> = {
      'BULL': { 'RSI': 0.8, 'MACD': 1.2, 'MA': 1.3, 'Momentum': 1.2 },
      'BEAR': { 'RSI': 1.2, 'MACD': 1.1, 'MA': 1.2, 'Volume': 1.3 },
      'VOLATILE': { 'RSI': 1.4, 'Volume': 0.8, 'Momentum': 0.8 },
      'SIDEWAYS': { 'RSI': 1.1, 'Volume': 0.9, 'Momentum': 0.7 }
    };

    const baseWeight = baseWeights[indicator] || 15;
    const adjustment = adjustments[regime]?.[indicator] || 1;
    
    return Math.round(baseWeight * adjustment);
  }

  private calculateWeightedScore(indicators: any[], marketRegime: string): number {
    if (indicators.length === 0) return 0;
    
    let totalScore = 0;
    let totalWeight = 0;
    
    indicators.forEach(indicator => {
      totalScore += indicator.score * indicator.weight;
      totalWeight += indicator.weight;
    });
    
    const baseScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    
    // Apply regime-specific adjustments
    const regimeMultiplier = marketRegime === 'VOLATILE' ? 0.8 : 1.0;
    
    return Math.max(-100, Math.min(100, baseScore * regimeMultiplier));
  }

  private calculateConfidence(indicators: any[]): number {
    if (indicators.length === 0) return 50;
    
    const avgConfidence = indicators.reduce((sum, ind) => sum + ind.confidence, 0) / indicators.length;
    const agreement = this.calculateAgreement(indicators);
    
    return Math.min(95, avgConfidence * agreement);
  }

  private calculateAgreement(indicators: any[]): number {
    if (indicators.length === 0) return 0.5;
    
    const bullish = indicators.filter(ind => ind.score > 0).length;
    const bearish = indicators.filter(ind => ind.score < 0).length;
    const neutral = indicators.filter(ind => ind.score === 0).length;
    
    const total = indicators.length;
    const maxDirection = Math.max(bullish, bearish, neutral);
    
    return maxDirection / total;
  }

  private calculateRiskScore(chartData: ChartDataPoint[], marketRegime: string): number {
    const volatility = this.calculateVolatility(chartData);
    const baseRisk = Math.min(100, volatility * 5);
    
    const regimeRisk = marketRegime === 'VOLATILE' ? 20 : 
                      marketRegime === 'BEAR' ? 15 : 5;
    
    return Math.min(100, baseRisk + regimeRisk);
  }

  private calculateVolumeTrend(chartData: ChartDataPoint[]): number {
    if (chartData.length < 10) return 0;
    
    const volumes = chartData.map(d => d.v);
    const recent = volumes.slice(-5);
    const previous = volumes.slice(-10, -5);
    
    const recentAvg = recent.reduce((sum, v) => sum + v, 0) / recent.length;
    const previousAvg = previous.reduce((sum, v) => sum + v, 0) / previous.length;
    
    return previousAvg > 0 ? (recentAvg - previousAvg) / previousAvg : 0;
  }

  private calculateMomentum(chartData: ChartDataPoint[]): number {
    if (chartData.length < 5) return 0;
    
    const prices = chartData.map(d => d.c);
    const recent = prices.slice(-2);
    const previous = prices.slice(-5, -3);
    
    const recentAvg = recent.reduce((sum, p) => sum + p, 0) / recent.length;
    const previousAvg = previous.reduce((sum, p) => sum + p, 0) / previous.length;
    
    return previousAvg > 0 ? (recentAvg - previousAvg) / previousAvg : 0;
  }

  private generateAdvancedRecommendation(
    weightedScore: number,
    confidence: number,
    riskScore: number,
    stockInfo: StockInfo,
    indicators: any[],
    marketRegime: string
  ): Recommendation {
    const currentPrice = stockInfo.current_price;
    
    // Enhanced recommendation logic with market regime consideration
    let action = 'HOLD';
    let stars = 3;
    let priceTarget = currentPrice;
    let riskLevel = 'MEDIUM';

    if (weightedScore >= 60) {
      action = 'STRONG BUY';
      stars = 5;
      priceTarget = currentPrice * (1 + Math.min(0.30, weightedScore / 100 * 0.35));
      riskLevel = riskScore > 60 ? 'HIGH' : 'MEDIUM';
    } else if (weightedScore >= 35) {
      action = 'BUY';
      stars = 4;
      priceTarget = currentPrice * (1 + Math.min(0.20, weightedScore / 100 * 0.25));
      riskLevel = riskScore > 60 ? 'HIGH' : 'MEDIUM';
    } else if (weightedScore >= 15) {
      action = 'WEAK BUY';
      stars = 3;
      priceTarget = currentPrice * (1 + Math.min(0.10, weightedScore / 100 * 0.15));
      riskLevel = 'LOW';
    } else if (weightedScore <= -60) {
      action = 'STRONG SELL';
      stars = 1;
      priceTarget = currentPrice * (1 + Math.max(-0.25, weightedScore / 100 * 0.25));
      riskLevel = riskScore > 60 ? 'HIGH' : 'MEDIUM';
    } else if (weightedScore <= -35) {
      action = 'SELL';
      stars = 2;
      priceTarget = currentPrice * (1 + Math.max(-0.15, weightedScore / 100 * 0.18));
      riskLevel = riskScore > 60 ? 'HIGH' : 'MEDIUM';
    } else if (weightedScore <= -15) {
      action = 'WEAK SELL';
      stars = 2;
      priceTarget = currentPrice * (1 + Math.max(-0.08, weightedScore / 100 * 0.10));
      riskLevel = 'LOW';
    } else {
      action = 'HOLD';
      stars = 3;
      priceTarget = currentPrice * (1 + (weightedScore / 100 * 0.05));
      riskLevel = riskScore > 70 ? 'HIGH' : riskScore > 40 ? 'MEDIUM' : 'LOW';
    }

    // Generate detailed reasoning
    const reasoning = this.generateDetailedReasoning(indicators, marketRegime);

    return {
      action,
      stars,
      confidence: Math.round(confidence),
      price_target: priceTarget,
      reasoning,
      indicators: indicators.map(ind => ({
        name: ind.name,
        value: ind.value,
        status: ind.status,
        color: ind.color
      })),
      risk_level: riskLevel,
      sharpe_ratio: this.calculateSharpeRatio(weightedScore, riskScore),
      max_drawdown: this.calculateMaxDrawdown(riskScore),
      market_regime: marketRegime,
      sector_momentum: this.calculateSectorMomentum(indicators),
      algorithm_version: this.ALGORITHM_VERSION
    };
  }

  private generateDetailedReasoning(indicators: any[], marketRegime: string): string[] {
    const reasoning = [
      `🧠 Enhanced Algorithm v2.0: Advanced multi-factor analysis with ${indicators.length} indicators`,
      `📊 Market Regime: ${marketRegime} - weights adjusted for current market conditions`,
    ];

    // Add top 3 strongest signals
    const sortedIndicators = indicators.sort((a, b) => Math.abs(b.score) - Math.abs(a.score));
    const topIndicators = sortedIndicators.slice(0, 3);
    
    topIndicators.forEach(ind => {
      if (Math.abs(ind.score) > 30) {
        reasoning.push(`${ind.score > 0 ? '📈' : '📉'} ${ind.name}: ${ind.status} (${ind.confidence}% confidence)`);
      }
    });

    // Market regime specific insights
    if (marketRegime === 'VOLATILE') {
      reasoning.push('⚡ Volatile market detected - signals weighted for stability and risk management');
    } else if (marketRegime === 'BULL') {
      reasoning.push('🚀 Bull market regime - momentum indicators weighted higher');
    } else if (marketRegime === 'BEAR') {
      reasoning.push('🐻 Bear market regime - mean reversion signals emphasized');
    } else {
      reasoning.push('➡️ Sideways market - range-bound trading patterns detected');
    }

    reasoning.push('⚠️ Professional Disclaimer: Enhanced algorithm for educational purposes - combine with fundamental analysis');

    return reasoning;
  }

  private calculateSharpeRatio(score: number, riskScore: number): number {
    // Simplified Sharpe ratio calculation
    const expectedReturn = (score / 100) * 0.12; // Annualized expected return
    const riskFreeRate = 0.02; // 2% risk-free rate
    const volatility = Math.max(0.1, riskScore / 100 * 0.5);
    
    return (expectedReturn - riskFreeRate) / volatility;
  }

  private calculateMaxDrawdown(riskScore: number): number {
    // Estimate maximum drawdown based on risk score
    return Math.min(50, riskScore * 0.4);
  }

  private calculateSectorMomentum(indicators: any[]): number {
    // Calculate average momentum across indicators
    const momentumIndicators = indicators.filter(ind => 
      ind.name.includes('Momentum') || ind.name.includes('MACD') || ind.name.includes('MA')
    );
    
    if (momentumIndicators.length === 0) return 0.5;
    
    const avgScore = momentumIndicators.reduce((sum, ind) => sum + ind.score, 0) / momentumIndicators.length;
    return Math.max(0, Math.min(1, (avgScore + 100) / 200));
  }
}

export const recommendationService = RecommendationService.getInstance(); 