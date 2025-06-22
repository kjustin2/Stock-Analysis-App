import { ChartDataPoint } from './stockDataService';
import { TechnicalData } from './technicalIndicatorService';

// Core interfaces for ML pattern recognition
export interface PatternResult {
  pattern: string;
  confidence: number;
  description: string;
  signals: string[];
  timeframe: string;
  points: Array<{ x: number; y: number; type: string }>;
}

export interface SentimentResult {
  score: number; // -1 to 1 (bearish to bullish)
  strength: 'weak' | 'moderate' | 'strong';
  factors: Array<{ factor: string; impact: number; description: string }>;
  overall: 'bearish' | 'neutral' | 'bullish';
}

export interface EnsemblePrediction {
  direction: 'up' | 'down' | 'sideways';
  confidence: number;
  timeframe: '1d' | '1w' | '1m';
  targetPrice?: number;
  stopLoss?: number;
  signals: Array<{ indicator: string; signal: string; weight: number }>;
}

export interface HistoricalMatch {
  similarity: number;
  period: string;
  outcome: 'bullish' | 'bearish' | 'neutral';
  priceChange: number;
  timeframe: number; // days
  confidence: number;
}

export class PatternRecognitionService {
  private static instance: PatternRecognitionService;

  public static getInstance(): PatternRecognitionService {
    if (!PatternRecognitionService.instance) {
      PatternRecognitionService.instance = new PatternRecognitionService();
    }
    return PatternRecognitionService.instance;
  }

  // Main pattern detection method
  public detectPatterns(chartData: ChartDataPoint[]): PatternResult[] {
    const patterns: PatternResult[] = [];
    
    if (chartData.length < 20) return patterns;

    // Detect various chart patterns
    patterns.push(...this.detectTrianglePattern(chartData));
    patterns.push(...this.detectSupportResistance(chartData));
    patterns.push(...this.detectHeadAndShoulders(chartData));
    patterns.push(...this.detectFlagPattern(chartData));
    patterns.push(...this.detectWedgePattern(chartData));

    return patterns.sort((a, b) => b.confidence - a.confidence);
  }

  // Triangle pattern detection (ascending, descending, symmetrical)
  private detectTrianglePattern(chartData: ChartDataPoint[]): PatternResult[] {
    const patterns: PatternResult[] = [];
    const recentData = chartData.slice(-50); // Last 50 periods
    
    if (recentData.length < 20) return patterns;

    const highs = recentData.map((point, i) => ({ index: i, value: point.h }));
    const lows = recentData.map((point, i) => ({ index: i, value: point.l }));

    // Find peaks and troughs
    const peaks = this.findLocalExtrema(highs, 'peaks');
    const troughs = this.findLocalExtrema(lows, 'troughs');

    if (peaks.length >= 2 && troughs.length >= 2) {
      const highTrend = this.calculateTrendLine(peaks.slice(-3));
      const lowTrend = this.calculateTrendLine(troughs.slice(-3));

      if (highTrend && lowTrend) {
        const convergence = Math.abs(highTrend.slope) + Math.abs(lowTrend.slope);
        
        if (convergence > 0.1) { // Converging lines
          let patternType = 'Symmetrical Triangle';
          let confidence = 0.6;

          if (highTrend.slope < -0.05 && Math.abs(lowTrend.slope) < 0.02) {
            patternType = 'Descending Triangle';
            confidence = 0.75;
          } else if (lowTrend.slope > 0.05 && Math.abs(highTrend.slope) < 0.02) {
            patternType = 'Ascending Triangle';
            confidence = 0.75;
          }

          patterns.push({
            pattern: patternType,
            confidence,
            description: `${patternType} detected with converging trend lines`,
            signals: this.getTriangleSignals(patternType, recentData),
            timeframe: 'medium-term',
            points: this.getTrianglePoints(peaks, troughs)
          });
        }
      }
    }

    return patterns;
  }

  // Support and Resistance level detection
  private detectSupportResistance(chartData: ChartDataPoint[]): PatternResult[] {
    const patterns: PatternResult[] = [];
    const recentData = chartData.slice(-100); // Last 100 periods
    
    const lows = recentData.map(point => point.l);
    const highs = recentData.map(point => point.h);
    
    // Find support levels
    const supportLevels = this.findSignificantLevels(lows, 'support');
    const resistanceLevels = this.findSignificantLevels(highs, 'resistance');

    // Check for strong support/resistance
    supportLevels.forEach(level => {
      if (level.touches >= 3 && level.strength > 0.7) {
        patterns.push({
          pattern: 'Strong Support',
          confidence: level.strength,
          description: `Strong support level at ${level.price.toFixed(2)} (${level.touches} touches)`,
          signals: [`Price above support: Bullish`, `Breakdown below ${level.price.toFixed(2)}: Bearish signal`],
          timeframe: 'short to medium-term',
          points: [{ x: 0, y: level.price, type: 'support' }]
        });
      }
    });

    resistanceLevels.forEach(level => {
      if (level.touches >= 3 && level.strength > 0.7) {
        patterns.push({
          pattern: 'Strong Resistance',
          confidence: level.strength,
          description: `Strong resistance level at ${level.price.toFixed(2)} (${level.touches} touches)`,
          signals: [`Price below resistance: Bearish`, `Breakout above ${level.price.toFixed(2)}: Bullish signal`],
          timeframe: 'short to medium-term',
          points: [{ x: 0, y: level.price, type: 'resistance' }]
        });
      }
    });

    return patterns;
  }

  // Head and Shoulders pattern detection
  private detectHeadAndShoulders(chartData: ChartDataPoint[]): PatternResult[] {
    const patterns: PatternResult[] = [];
    const recentData = chartData.slice(-60); // Last 60 periods
    
    if (recentData.length < 30) return patterns;

    const highs = recentData.map((point, i) => ({ index: i, value: point.h }));
    const peaks = this.findLocalExtrema(highs, 'peaks');

    if (peaks.length >= 3) {
      // Check for head and shoulders pattern (peak-higher peak-peak)
      for (let i = 0; i < peaks.length - 2; i++) {
        const leftShoulder = peaks[i];
        const head = peaks[i + 1];
        const rightShoulder = peaks[i + 2];

        // Head should be higher than both shoulders
        if (head.value > leftShoulder.value && head.value > rightShoulder.value) {
          // Shoulders should be roughly similar height
          const shoulderDiff = Math.abs(leftShoulder.value - rightShoulder.value);
          const avgShoulder = (leftShoulder.value + rightShoulder.value) / 2;
          
          if (shoulderDiff / avgShoulder < 0.05) { // Within 5%
            const confidence = 0.7 + (0.2 * (1 - shoulderDiff / avgShoulder));
            
            patterns.push({
              pattern: 'Head and Shoulders',
              confidence,
              description: 'Classic reversal pattern with head and two shoulders',
              signals: ['Bearish reversal signal', 'Target: Neckline breakdown', 'Volume confirmation needed'],
              timeframe: 'medium-term',
              points: [
                { x: leftShoulder.index, y: leftShoulder.value, type: 'left_shoulder' },
                { x: head.index, y: head.value, type: 'head' },
                { x: rightShoulder.index, y: rightShoulder.value, type: 'right_shoulder' }
              ]
            });
          }
        }
      }
    }

    return patterns;
  }

  // Flag pattern detection
  private detectFlagPattern(chartData: ChartDataPoint[]): PatternResult[] {
    const patterns: PatternResult[] = [];
    const recentData = chartData.slice(-30); // Last 30 periods
    
    if (recentData.length < 15) return patterns;

    // Look for strong trend followed by consolidation
    const prices = recentData.map(point => point.c);
    const firstHalf = prices.slice(0, Math.floor(prices.length / 2));
    const secondHalf = prices.slice(Math.floor(prices.length / 2));

    const firstTrend = this.calculateLinearRegression(firstHalf);
    const secondTrend = this.calculateLinearRegression(secondHalf);

    if (Math.abs(firstTrend.slope) > 0.1 && Math.abs(secondTrend.slope) < 0.05) {
      const flagType = firstTrend.slope > 0 ? 'Bull Flag' : 'Bear Flag';
      const confidence = 0.6 + (0.3 * (Math.abs(firstTrend.slope) - Math.abs(secondTrend.slope)));

      patterns.push({
        pattern: flagType,
        confidence: Math.min(confidence, 0.9),
        description: `${flagType} pattern: Strong trend followed by consolidation`,
        signals: flagType === 'Bull Flag' 
          ? ['Bullish continuation expected', 'Buy on breakout above flag']
          : ['Bearish continuation expected', 'Sell on breakdown below flag'],
        timeframe: 'short-term',
        points: []
      });
    }

    return patterns;
  }

  // Wedge pattern detection
  private detectWedgePattern(chartData: ChartDataPoint[]): PatternResult[] {
    const patterns: PatternResult[] = [];
    const recentData = chartData.slice(-40); // Last 40 periods
    
    if (recentData.length < 20) return patterns;

    const highs = recentData.map((point, i) => ({ index: i, value: point.h }));
    const lows = recentData.map((point, i) => ({ index: i, value: point.l }));

    const peaks = this.findLocalExtrema(highs, 'peaks');
    const troughs = this.findLocalExtrema(lows, 'troughs');

    if (peaks.length >= 2 && troughs.length >= 2) {
      const highTrend = this.calculateTrendLine(peaks);
      const lowTrend = this.calculateTrendLine(troughs);

      if (highTrend && lowTrend) {
        // Both lines should be sloping in same direction (wedge)
        if ((highTrend.slope > 0 && lowTrend.slope > 0) || 
            (highTrend.slope < 0 && lowTrend.slope < 0)) {
          
          const wedgeType = highTrend.slope > 0 ? 'Rising Wedge' : 'Falling Wedge';
          const confidence = 0.65 + (0.25 * Math.min(Math.abs(highTrend.slope), Math.abs(lowTrend.slope)));

          patterns.push({
            pattern: wedgeType,
            confidence: Math.min(confidence, 0.9),
            description: `${wedgeType}: Converging trend lines with ${wedgeType.toLowerCase()} bias`,
            signals: wedgeType === 'Rising Wedge'
              ? ['Bearish reversal pattern', 'Look for breakdown']
              : ['Bullish reversal pattern', 'Look for breakout'],
            timeframe: 'medium-term',
            points: []
          });
        }
      }
    }

    return patterns;
  }

  // Helper method: Find local extrema (peaks or troughs)
  private findLocalExtrema(data: Array<{ index: number; value: number }>, type: 'peaks' | 'troughs'): Array<{ index: number; value: number }> {
    const extrema: Array<{ index: number; value: number }> = [];
    const lookback = 3; // Look 3 periods back and forward

    for (let i = lookback; i < data.length - lookback; i++) {
      const current = data[i];
      const isExtremum = type === 'peaks' 
        ? data.slice(i - lookback, i + lookback + 1).every(point => point.value <= current.value)
        : data.slice(i - lookback, i + lookback + 1).every(point => point.value >= current.value);

      if (isExtremum) {
        extrema.push(current);
      }
    }

    return extrema;
  }

  // Helper method: Calculate trend line through points
  private calculateTrendLine(points: Array<{ index: number; value: number }>): { slope: number; intercept: number } | null {
    if (points.length < 2) return null;

    const n = points.length;
    const sumX = points.reduce((sum, point) => sum + point.index, 0);
    const sumY = points.reduce((sum, point) => sum + point.value, 0);
    const sumXY = points.reduce((sum, point) => sum + (point.index * point.value), 0);
    const sumXX = points.reduce((sum, point) => sum + (point.index * point.index), 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  // Helper method: Find significant support/resistance levels
  private findSignificantLevels(prices: number[], type: 'support' | 'resistance'): Array<{ price: number; touches: number; strength: number }> {
    const levels: Array<{ price: number; touches: number; strength: number }> = [];
    const tolerance = 0.02; // 2% tolerance for level matching

    const sortedPrices = type === 'support' 
      ? [...prices].sort((a, b) => a - b)
      : [...prices].sort((a, b) => b - a);

    const significantPrices = type === 'support'
      ? sortedPrices.slice(0, Math.floor(sortedPrices.length * 0.3)) // Bottom 30%
      : sortedPrices.slice(0, Math.floor(sortedPrices.length * 0.3)); // Top 30%

    // Group similar price levels
    significantPrices.forEach(price => {
      const existingLevel = levels.find(level => 
        Math.abs(level.price - price) / price < tolerance
      );

      if (existingLevel) {
        existingLevel.touches++;
        existingLevel.price = (existingLevel.price + price) / 2; // Average the prices
      } else {
        levels.push({ price, touches: 1, strength: 0 });
      }
    });

    // Calculate strength based on touches and price action around level
    levels.forEach(level => {
      level.strength = Math.min(level.touches / 5, 1); // Max strength at 5 touches
    });

    return levels.filter(level => level.touches >= 2);
  }

  // Helper method: Linear regression for trend analysis
  private calculateLinearRegression(values: number[]): { slope: number; intercept: number; r2: number } {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const yMean = sumY / n;
    const ssTotal = values.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const ssRes = values.reduce((sum, yi, i) => sum + Math.pow(yi - (slope * i + intercept), 2), 0);
    const r2 = 1 - (ssRes / ssTotal);

    return { slope, intercept, r2 };
  }

  // Helper method: Get triangle pattern signals
  private getTriangleSignals(patternType: string, _data: ChartDataPoint[]): string[] {
    const signals: string[] = [];

    switch (patternType) {
      case 'Ascending Triangle':
        signals.push('Bullish bias - buyers at support');
        signals.push('Breakout above resistance: Strong buy signal');
        signals.push('Volume should increase on breakout');
        break;
      case 'Descending Triangle':
        signals.push('Bearish bias - sellers at resistance');
        signals.push('Breakdown below support: Strong sell signal');
        signals.push('Volume should increase on breakdown');
        break;
      case 'Symmetrical Triangle':
        signals.push('Neutral bias - direction uncertain');
        signals.push('Trade the breakout direction');
        signals.push('Wait for volume confirmation');
        break;
    }

    return signals;
  }

  // Helper method: Get triangle pattern points for visualization
  private getTrianglePoints(peaks: Array<{ index: number; value: number }>, 
                           troughs: Array<{ index: number; value: number }>): Array<{ x: number; y: number; type: string }> {
    const points: Array<{ x: number; y: number; type: string }> = [];
    
    // Add recent peaks and troughs
    peaks.slice(-2).forEach(peak => {
      points.push({ x: peak.index, y: peak.value, type: 'peak' });
    });
    
    troughs.slice(-2).forEach(trough => {
      points.push({ x: trough.index, y: trough.value, type: 'trough' });
    });

    return points;
  }

  // SENTIMENT ANALYSIS METHODS

  // Analyze market sentiment based on technical indicators and price action
  public analyzeSentiment(chartData: ChartDataPoint[], technicalData: TechnicalData): SentimentResult {
    const factors: Array<{ factor: string; impact: number; description: string }> = [];
    let totalScore = 0;
    let weightSum = 0;

    // Price momentum analysis
    const priceMomentum = this.analyzePriceMomentum(chartData);
    factors.push(priceMomentum);
    totalScore += priceMomentum.impact * 0.25;
    weightSum += 0.25;

    // Technical indicator sentiment
    const technicalSentiment = this.analyzeTechnicalSentiment(technicalData);
    factors.push(...technicalSentiment);
    technicalSentiment.forEach(factor => {
      totalScore += factor.impact * 0.15;
      weightSum += 0.15;
    });

    // Volume analysis
    const volumeSentiment = this.analyzeVolumeSentiment(chartData);
    factors.push(volumeSentiment);
    totalScore += volumeSentiment.impact * 0.2;
    weightSum += 0.2;

    // Volatility analysis
    const volatilitySentiment = this.analyzeVolatilitySentiment(chartData);
    factors.push(volatilitySentiment);
    totalScore += volatilitySentiment.impact * 0.15;
    weightSum += 0.15;

    const normalizedScore = totalScore / weightSum;
    const strength = Math.abs(normalizedScore) > 0.6 ? 'strong' : 
                     Math.abs(normalizedScore) > 0.3 ? 'moderate' : 'weak';
    
    const overall = normalizedScore > 0.2 ? 'bullish' : 
                    normalizedScore < -0.2 ? 'bearish' : 'neutral';

    return {
      score: normalizedScore,
      strength,
      factors,
      overall
    };
  }

  // ENSEMBLE PREDICTION METHODS

  // Generate ensemble predictions combining multiple indicators
  public generateEnsemblePrediction(chartData: ChartDataPoint[], technicalData: TechnicalData): EnsemblePrediction {
    const signals: Array<{ indicator: string; signal: string; weight: number }> = [];
    let bullishVotes = 0;
    let bearishVotes = 0;
    let totalWeight = 0;

    // RSI signal
    const rsiSignal = this.getRSISignal(technicalData);
    signals.push(rsiSignal);
    if (rsiSignal.signal === 'bullish') bullishVotes += rsiSignal.weight;
    else if (rsiSignal.signal === 'bearish') bearishVotes += rsiSignal.weight;
    totalWeight += rsiSignal.weight;

    // MACD signal
    const macdSignal = this.getMACDSignal(technicalData);
    signals.push(macdSignal);
    if (macdSignal.signal === 'bullish') bullishVotes += macdSignal.weight;
    else if (macdSignal.signal === 'bearish') bearishVotes += macdSignal.weight;
    totalWeight += macdSignal.weight;

    // Bollinger Bands signal
    const bollingerSignal = this.getBollingerSignal(technicalData);
    signals.push(bollingerSignal);
    if (bollingerSignal.signal === 'bullish') bullishVotes += bollingerSignal.weight;
    else if (bollingerSignal.signal === 'bearish') bearishVotes += bollingerSignal.weight;
    totalWeight += bollingerSignal.weight;

    // Stochastic signal
    const stochasticSignal = this.getStochasticSignal(technicalData);
    signals.push(stochasticSignal);
    if (stochasticSignal.signal === 'bullish') bullishVotes += stochasticSignal.weight;
    else if (stochasticSignal.signal === 'bearish') bearishVotes += stochasticSignal.weight;
    totalWeight += stochasticSignal.weight;

    // Volume trend signal
    const volumeSignal = this.getVolumeSignal(chartData);
    signals.push(volumeSignal);
    if (volumeSignal.signal === 'bullish') bullishVotes += volumeSignal.weight;
    else if (volumeSignal.signal === 'bearish') bearishVotes += volumeSignal.weight;
    totalWeight += volumeSignal.weight;

    // Determine direction and confidence
    const direction = bullishVotes > bearishVotes ? 'up' : 
                     bearishVotes > bullishVotes ? 'down' : 'sideways';
    
    const confidence = Math.abs(bullishVotes - bearishVotes) / totalWeight;
    
    // Calculate target price and stop loss
    const currentPrice = chartData[chartData.length - 1].c;
    const volatility = this.calculateVolatility(chartData.slice(-20));
    
    let targetPrice: number | undefined;
    let stopLoss: number | undefined;
    
    if (direction === 'up') {
      targetPrice = currentPrice * (1 + volatility * 2);
      stopLoss = currentPrice * (1 - volatility);
    } else if (direction === 'down') {
      targetPrice = currentPrice * (1 - volatility * 2);
      stopLoss = currentPrice * (1 + volatility);
    }

    return {
      direction,
      confidence,
      timeframe: confidence > 0.7 ? '1w' : confidence > 0.4 ? '1d' : '1m',
      targetPrice,
      stopLoss,
      signals
    };
  }

  // HISTORICAL PATTERN MATCHING

  // Find similar historical patterns
  public findHistoricalMatches(chartData: ChartDataPoint[], lookbackPeriods: number = 50): HistoricalMatch[] {
    const matches: HistoricalMatch[] = [];
    const currentPattern = chartData.slice(-lookbackPeriods);
    
    if (chartData.length < lookbackPeriods * 3) return matches;

    // Normalize current pattern
    const normalizedCurrent = this.normalizePattern(currentPattern);

    // Search through historical data
    for (let i = lookbackPeriods; i < chartData.length - lookbackPeriods * 2; i++) {
      const historicalPattern = chartData.slice(i, i + lookbackPeriods);
      const normalizedHistorical = this.normalizePattern(historicalPattern);

      // Calculate similarity
      const similarity = this.calculatePatternSimilarity(normalizedCurrent, normalizedHistorical);
      
      if (similarity > 0.75) { // Only include high-similarity matches
        // Analyze what happened after the historical pattern
        const futureData = chartData.slice(i + lookbackPeriods, i + lookbackPeriods + 10);
        const outcome = this.analyzeOutcome(historicalPattern, futureData);

        matches.push({
          similarity,
          period: this.formatPeriod(i),
          outcome: outcome.direction,
          priceChange: outcome.priceChange,
          timeframe: futureData.length,
          confidence: similarity * outcome.reliability
        });
      }
    }

    return matches.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
  }

  // HELPER METHODS FOR SENTIMENT ANALYSIS

  private analyzePriceMomentum(chartData: ChartDataPoint[]): { factor: string; impact: number; description: string } {
    const recentData = chartData.slice(-10);
    const prices = recentData.map(point => point.c);
    
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const momentum = (lastPrice - firstPrice) / firstPrice;

    return {
      factor: 'Price Momentum',
      impact: Math.tanh(momentum * 10), // Normalize to [-1, 1]
      description: `${(momentum * 100).toFixed(1)}% price change over 10 periods`
    };
  }

  private analyzeTechnicalSentiment(technicalData: TechnicalData): Array<{ factor: string; impact: number; description: string }> {
    const factors: Array<{ factor: string; impact: number; description: string }> = [];

    // RSI sentiment
    const rsi = technicalData.indicators.rsi;
    if (rsi && rsi.length > 0) {
      const currentRSI = rsi[rsi.length - 1];
      if (currentRSI !== null) {
        const rsiImpact = currentRSI > 70 ? -0.8 : currentRSI < 30 ? 0.8 : (50 - currentRSI) / 25;
        factors.push({
          factor: 'RSI',
          impact: rsiImpact,
          description: `RSI at ${currentRSI.toFixed(1)} - ${currentRSI > 70 ? 'Overbought' : currentRSI < 30 ? 'Oversold' : 'Neutral'}`
        });
      }
    }

    // MACD sentiment
    const macd = technicalData.indicators.macd_line;
    const signal = technicalData.indicators.macd_signal;
    if (macd && signal && macd.length > 1 && signal.length > 1) {
      const currentMACD = macd[macd.length - 1];
      const currentSignal = signal[signal.length - 1];
      
      if (currentMACD !== null && currentSignal !== null) {
        const macdDiff = currentMACD - currentSignal;
        const macdImpact = Math.tanh(macdDiff * 5);
        factors.push({
          factor: 'MACD',
          impact: macdImpact,
          description: `MACD ${macdDiff > 0 ? 'above' : 'below'} signal line`
        });
      }
    }

    return factors;
  }

  private analyzeVolumeSentiment(chartData: ChartDataPoint[]): { factor: string; impact: number; description: string } {
    const recentData = chartData.slice(-10);
    const volumes = recentData.map(point => point.v);
    const prices = recentData.map(point => point.c);
    
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const currentVolume = volumes[volumes.length - 1];
    const priceChange = (prices[prices.length - 1] - prices[0]) / prices[0];
    
    // High volume with price increase = bullish, high volume with price decrease = bearish
    const volumeRatio = currentVolume / avgVolume;
    const impact = (volumeRatio - 1) * Math.sign(priceChange) * 0.5;

    return {
      factor: 'Volume',
      impact: Math.tanh(impact),
      description: `Volume ${volumeRatio > 1.2 ? 'above' : volumeRatio < 0.8 ? 'below' : 'near'} average`
    };
  }

  private analyzeVolatilitySentiment(chartData: ChartDataPoint[]): { factor: string; impact: number; description: string } {
    const volatility = this.calculateVolatility(chartData.slice(-20));
    const normalVolatility = 0.02; // Assume 2% daily volatility as normal
    
    const volatilityRatio = volatility / normalVolatility;
    const impact = volatilityRatio > 1.5 ? -0.3 : volatilityRatio < 0.7 ? 0.2 : 0; // High volatility slightly bearish

    return {
      factor: 'Volatility',
      impact,
      description: `${volatilityRatio > 1.5 ? 'High' : volatilityRatio < 0.7 ? 'Low' : 'Normal'} volatility (${(volatility * 100).toFixed(1)}%)`
    };
  }

  // HELPER METHODS FOR ENSEMBLE PREDICTIONS

  private getRSISignal(technicalData: TechnicalData): { indicator: string; signal: string; weight: number } {
    const rsi = technicalData.indicators.rsi;
    if (!rsi || rsi.length === 0) {
      return { indicator: 'RSI', signal: 'neutral', weight: 0.2 };
    }

    const currentRSI = rsi[rsi.length - 1];
    if (currentRSI === null) {
      return { indicator: 'RSI', signal: 'neutral', weight: 0.2 };
    }

    if (currentRSI > 70) {
      return { indicator: 'RSI', signal: 'bearish', weight: 0.25 };
    } else if (currentRSI < 30) {
      return { indicator: 'RSI', signal: 'bullish', weight: 0.25 };
    } else {
      return { indicator: 'RSI', signal: 'neutral', weight: 0.15 };
    }
  }

  private getMACDSignal(technicalData: TechnicalData): { indicator: string; signal: string; weight: number } {
    const macd = technicalData.indicators.macd_line;
    const signal = technicalData.indicators.macd_signal;
    
    if (!macd || !signal || macd.length < 2 || signal.length < 2) {
      return { indicator: 'MACD', signal: 'neutral', weight: 0.2 };
    }

    const currentMACD = macd[macd.length - 1];
    const currentSignal = signal[signal.length - 1];
    const prevMACD = macd[macd.length - 2];
    const prevSignal = signal[signal.length - 2];

    if (currentMACD === null || currentSignal === null || prevMACD === null || prevSignal === null) {
      return { indicator: 'MACD', signal: 'neutral', weight: 0.2 };
    }

    // Check for crossover
    if (prevMACD <= prevSignal && currentMACD > currentSignal) {
      return { indicator: 'MACD', signal: 'bullish', weight: 0.3 };
    } else if (prevMACD >= prevSignal && currentMACD < currentSignal) {
      return { indicator: 'MACD', signal: 'bearish', weight: 0.3 };
    } else if (currentMACD > currentSignal) {
      return { indicator: 'MACD', signal: 'bullish', weight: 0.2 };
    } else {
      return { indicator: 'MACD', signal: 'bearish', weight: 0.2 };
    }
  }

  private getBollingerSignal(technicalData: TechnicalData): { indicator: string; signal: string; weight: number } {
    const upper = technicalData.indicators.bollinger_upper;
    const lower = technicalData.indicators.bollinger_lower;
    const currentPrice = technicalData.price[technicalData.price.length - 1];

    if (!upper || !lower || upper.length === 0 || lower.length === 0) {
      return { indicator: 'Bollinger', signal: 'neutral', weight: 0.2 };
    }

    const currentUpper = upper[upper.length - 1];
    const currentLower = lower[lower.length - 1];

    if (currentUpper === null || currentLower === null) {
      return { indicator: 'Bollinger', signal: 'neutral', weight: 0.2 };
    }

    if (currentPrice <= currentLower) {
      return { indicator: 'Bollinger', signal: 'bullish', weight: 0.25 }; // Oversold
    } else if (currentPrice >= currentUpper) {
      return { indicator: 'Bollinger', signal: 'bearish', weight: 0.25 }; // Overbought
    } else {
      return { indicator: 'Bollinger', signal: 'neutral', weight: 0.15 };
    }
  }

  private getStochasticSignal(technicalData: TechnicalData): { indicator: string; signal: string; weight: number } {
    const stochK = technicalData.indicators.stochastic_k;
    const stochD = technicalData.indicators.stochastic_d;

    if (!stochK || !stochD || stochK.length === 0 || stochD.length === 0) {
      return { indicator: 'Stochastic', signal: 'neutral', weight: 0.2 };
    }

    const currentK = stochK[stochK.length - 1];
    const currentD = stochD[stochD.length - 1];

    if (currentK === null || currentD === null) {
      return { indicator: 'Stochastic', signal: 'neutral', weight: 0.2 };
    }

    if (currentK < 20 && currentD < 20) {
      return { indicator: 'Stochastic', signal: 'bullish', weight: 0.25 }; // Oversold
    } else if (currentK > 80 && currentD > 80) {
      return { indicator: 'Stochastic', signal: 'bearish', weight: 0.25 }; // Overbought
    } else {
      return { indicator: 'Stochastic', signal: 'neutral', weight: 0.15 };
    }
  }

  private getVolumeSignal(chartData: ChartDataPoint[]): { indicator: string; signal: string; weight: number } {
    if (chartData.length < 10) {
      return { indicator: 'Volume', signal: 'neutral', weight: 0.15 };
    }

    const recentData = chartData.slice(-10);
    const volumes = recentData.map(point => point.v);
    const prices = recentData.map(point => point.c);

    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const currentVolume = volumes[volumes.length - 1];
    const priceChange = (prices[prices.length - 1] - prices[0]) / prices[0];

    const volumeRatio = currentVolume / avgVolume;

    if (volumeRatio > 1.5 && priceChange > 0.02) {
      return { indicator: 'Volume', signal: 'bullish', weight: 0.2 };
    } else if (volumeRatio > 1.5 && priceChange < -0.02) {
      return { indicator: 'Volume', signal: 'bearish', weight: 0.2 };
    } else {
      return { indicator: 'Volume', signal: 'neutral', weight: 0.1 };
    }
  }

  private calculateVolatility(chartData: ChartDataPoint[]): number {
    if (chartData.length < 2) return 0;

    const returns = [];
    for (let i = 1; i < chartData.length; i++) {
      const returnValue = Math.log(chartData[i].c / chartData[i - 1].c);
      returns.push(returnValue);
    }

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  // HELPER METHODS FOR HISTORICAL PATTERN MATCHING

  private normalizePattern(chartData: ChartDataPoint[]): number[] {
    const prices = chartData.map(point => point.c);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    if (priceRange === 0) return prices.map(() => 0);

    return prices.map(price => (price - minPrice) / priceRange);
  }

  private calculatePatternSimilarity(pattern1: number[], pattern2: number[]): number {
    if (pattern1.length !== pattern2.length) return 0;

    let sumSquaredDiff = 0;
    for (let i = 0; i < pattern1.length; i++) {
      sumSquaredDiff += Math.pow(pattern1[i] - pattern2[i], 2);
    }

    const mse = sumSquaredDiff / pattern1.length;
    return Math.max(0, 1 - mse); // Convert MSE to similarity score
  }

  private analyzeOutcome(historicalPattern: ChartDataPoint[], futureData: ChartDataPoint[]): { 
    direction: 'bullish' | 'bearish' | 'neutral'; 
    priceChange: number; 
    reliability: number 
  } {
    if (futureData.length === 0) {
      return { direction: 'neutral', priceChange: 0, reliability: 0 };
    }

    const startPrice = historicalPattern[historicalPattern.length - 1].c;
    const endPrice = futureData[futureData.length - 1].c;
    const priceChange = (endPrice - startPrice) / startPrice;

    const direction = priceChange > 0.02 ? 'bullish' : 
                     priceChange < -0.02 ? 'bearish' : 'neutral';

    // Reliability based on consistency of direction
    const consistency = this.calculateConsistency(futureData);
    const reliability = Math.min(Math.abs(priceChange) * 10, 1) * consistency;

    return { direction, priceChange, reliability };
  }

  private calculateConsistency(data: ChartDataPoint[]): number {
    if (data.length < 2) return 0;

    let positiveChanges = 0;
    let totalChanges = 0;

    for (let i = 1; i < data.length; i++) {
      const change = data[i].c - data[i - 1].c;
      if (change > 0) positiveChanges++;
      totalChanges++;
    }

    const ratio = positiveChanges / totalChanges;
    return Math.abs(ratio - 0.5) * 2; // 0 = random, 1 = perfectly consistent
  }

  private formatPeriod(index: number): string {
    // Simple period formatting - could be enhanced with actual dates
    const daysAgo = Math.floor(index / 7) * 7;
    return `${daysAgo} periods ago`;
  }
} 