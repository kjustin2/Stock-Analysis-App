import { ChartDataPoint } from './stockDataService';

export interface TechnicalData {
  symbol: string;
  period: string;
  dates: string[];
  price: number[];
  indicators: {
    sma_20?: (number | null)[];
    sma_50?: (number | null)[];
    rsi?: (number | null)[];
    ema_12?: (number | null)[];
    ema_26?: (number | null)[];
    macd_line?: (number | null)[];
    macd_signal?: (number | null)[];
    bollinger_upper?: (number | null)[];
    bollinger_middle?: (number | null)[];
    bollinger_lower?: (number | null)[];
  };
}

export class TechnicalIndicatorService {
  private static instance: TechnicalIndicatorService;

  public static getInstance(): TechnicalIndicatorService {
    if (!TechnicalIndicatorService.instance) {
      TechnicalIndicatorService.instance = new TechnicalIndicatorService();
    }
    return TechnicalIndicatorService.instance;
  }

  // Simple Moving Average calculation
  private calculateSMA(prices: number[], period: number): (number | null)[] {
    const sma: (number | null)[] = [];
    
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        sma.push(null);
      } else {
        const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        sma.push(sum / period);
      }
    }
    
    return sma;
  }

  // Exponential Moving Average calculation
  private calculateEMA(prices: number[], period: number): (number | null)[] {
    const ema: (number | null)[] = [];
    const multiplier = 2 / (period + 1);
    
    for (let i = 0; i < prices.length; i++) {
      if (i === 0) {
        ema.push(prices[i]);
      } else {
        const prevEma = ema[i - 1] || prices[i];
        ema.push((prices[i] - prevEma) * multiplier + prevEma);
      }
    }
    
    return ema;
  }

  // RSI calculation
  private calculateRSI(prices: number[], period: number = 14): (number | null)[] {
    const rsi: (number | null)[] = [];
    const gains: number[] = [];
    const losses: number[] = [];
    
    // Calculate price changes
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    // Calculate RSI
    for (let i = 0; i < prices.length; i++) {
      if (i < period) {
        rsi.push(null);
      } else {
        const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
        const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
        
        if (avgLoss === 0) {
          rsi.push(100);
        } else {
          const rs = avgGain / avgLoss;
          rsi.push(100 - (100 / (1 + rs)));
        }
      }
    }
    
    return rsi;
  }

  // MACD calculation
  private calculateMACD(prices: number[]): {
    macd_line: (number | null)[];
    macd_signal: (number | null)[];
  } {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    
    const macdLine: (number | null)[] = [];
    
    for (let i = 0; i < prices.length; i++) {
      if (ema12[i] !== null && ema26[i] !== null) {
        macdLine.push(ema12[i]! - ema26[i]!);
      } else {
        macdLine.push(null);
      }
    }
    
    // Calculate signal line (9-period EMA of MACD line)
    const validMacdValues = macdLine.filter(val => val !== null) as number[];
    const signalLine = this.calculateEMA(validMacdValues, 9);
    
    // Align signal line with macd line
    const macdSignal: (number | null)[] = [];
    let signalIndex = 0;
    
    for (let i = 0; i < macdLine.length; i++) {
      if (macdLine[i] !== null) {
        macdSignal.push(signalLine[signalIndex] || null);
        signalIndex++;
      } else {
        macdSignal.push(null);
      }
    }
    
    return {
      macd_line: macdLine,
      macd_signal: macdSignal
    };
  }

  // Bollinger Bands calculation
  private calculateBollingerBands(prices: number[], period: number = 20, multiplier: number = 2): {
    bollinger_upper: (number | null)[];
    bollinger_middle: (number | null)[];
    bollinger_lower: (number | null)[];
  } {
    const sma = this.calculateSMA(prices, period);
    const upper: (number | null)[] = [];
    const lower: (number | null)[] = [];
    
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        upper.push(null);
        lower.push(null);
      } else {
        const subset = prices.slice(i - period + 1, i + 1);
        const mean = sma[i]!;
        
        // Calculate standard deviation
        const variance = subset.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
        const stdDev = Math.sqrt(variance);
        
        upper.push(mean + (multiplier * stdDev));
        lower.push(mean - (multiplier * stdDev));
      }
    }
    
    return {
      bollinger_upper: upper,
      bollinger_middle: sma,
      bollinger_lower: lower
    };
  }



  // Main function to calculate all technical indicators
  calculateTechnicalIndicators(chartData: ChartDataPoint[], symbol: string, period: string): TechnicalData {
    const prices = chartData.map(point => point.c);
    const dates = chartData.map(point => point.x);
    
    // Calculate all indicators
    const sma20 = this.calculateSMA(prices, 20);
    const sma50 = this.calculateSMA(prices, 50);
    const rsi = this.calculateRSI(prices, 14);
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macd = this.calculateMACD(prices);
    const bollinger = this.calculateBollingerBands(prices, 20, 2);
    
    return {
      symbol: symbol.toUpperCase(),
      period: period,
      dates: dates,
      price: prices,
      indicators: {
        sma_20: sma20,
        sma_50: sma50,
        rsi: rsi,
        ema_12: ema12,
        ema_26: ema26,
        macd_line: macd.macd_line,
        macd_signal: macd.macd_signal,
        bollinger_upper: bollinger.bollinger_upper,
        bollinger_middle: bollinger.bollinger_middle,
        bollinger_lower: bollinger.bollinger_lower
      }
    };
  }

  // Get current indicator values (latest non-null values)
  getCurrentIndicatorValues(technicalData: TechnicalData): Record<string, number | null> {
    const getLatestValue = (array: (number | null)[]): number | null => {
      for (let i = array.length - 1; i >= 0; i--) {
        if (array[i] !== null) {
          return array[i];
        }
      }
      return null;
    };

    return {
      current_price: getLatestValue(technicalData.price),
      sma_20: getLatestValue(technicalData.indicators.sma_20 || []),
      sma_50: getLatestValue(technicalData.indicators.sma_50 || []),
      rsi: getLatestValue(technicalData.indicators.rsi || []),
      ema_12: getLatestValue(technicalData.indicators.ema_12 || []),
      ema_26: getLatestValue(technicalData.indicators.ema_26 || []),
      macd_line: getLatestValue(technicalData.indicators.macd_line || []),
      macd_signal: getLatestValue(technicalData.indicators.macd_signal || []),
      bollinger_upper: getLatestValue(technicalData.indicators.bollinger_upper || []),
      bollinger_middle: getLatestValue(technicalData.indicators.bollinger_middle || []),
      bollinger_lower: getLatestValue(technicalData.indicators.bollinger_lower || [])
    };
  }

  // Get price momentum (percentage change over period)
  getPriceMomentum(prices: number[], days: number = 10): number {
    if (prices.length < days + 1) return 0;
    
    const currentPrice = prices[prices.length - 1];
    const pastPrice = prices[prices.length - 1 - days];
    
    return ((currentPrice - pastPrice) / pastPrice) * 100;
  }

  // Get volume trend
  getVolumeTrend(chartData: ChartDataPoint[], days: number = 10): number {
    if (chartData.length < days + 1) return 0;
    
    const recentVolume = chartData.slice(-days).reduce((sum, point) => sum + point.v, 0) / days;
    const pastVolume = chartData.slice(-days * 2, -days).reduce((sum, point) => sum + point.v, 0) / days;
    
    if (pastVolume === 0) return 0;
    return ((recentVolume - pastVolume) / pastVolume) * 100;
  }

  // Get price position within 52-week range (approximated)
  get52WeekPosition(prices: number[]): number {
    if (prices.length === 0) return 50;
    
    const currentPrice = prices[prices.length - 1];
    const high52Week = Math.max(...prices);
    const low52Week = Math.min(...prices);
    
    if (high52Week === low52Week) return 50;
    
    return ((currentPrice - low52Week) / (high52Week - low52Week)) * 100;
  }
}

export const technicalIndicatorService = TechnicalIndicatorService.getInstance(); 