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
    // Advanced Technical Indicators
    stochastic_k?: (number | null)[];
    stochastic_d?: (number | null)[];
    williams_r?: (number | null)[];
    atr?: (number | null)[];
    adx?: (number | null)[];
    plus_di?: (number | null)[];
    minus_di?: (number | null)[];
    fibonacci_levels?: {
      high: number;
      low: number;
      levels: { level: number; price: number; name: string }[];
    };
    volume_profile?: {
      price_levels: number[];
      volume_at_price: number[];
      poc: number; // Point of Control
      vah: number; // Value Area High
      val: number; // Value Area Low
    };
    ichimoku?: {
      tenkan_sen?: (number | null)[];
      kijun_sen?: (number | null)[];
      senkou_span_a?: (number | null)[];
      senkou_span_b?: (number | null)[];
      chikou_span?: (number | null)[];
    };
  };
}

// Advanced indicator calculation interfaces
export interface StochasticResult {
  stochastic_k: (number | null)[];
  stochastic_d: (number | null)[];
}

export interface ADXResult {
  adx: (number | null)[];
  plus_di: (number | null)[];
  minus_di: (number | null)[];
}

export interface IchimokuResult {
  tenkan_sen: (number | null)[];
  kijun_sen: (number | null)[];
  senkou_span_a: (number | null)[];
  senkou_span_b: (number | null)[];
  chikou_span: (number | null)[];
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

  // ADVANCED INDICATORS START HERE

  // Stochastic Oscillator calculation
  private calculateStochastic(chartData: ChartDataPoint[], kPeriod: number = 14, dPeriod: number = 3): StochasticResult {
    const stochasticK: (number | null)[] = [];
    const highs = chartData.map(point => point.h);
    const lows = chartData.map(point => point.l);
    const closes = chartData.map(point => point.c);

    // Calculate %K
    for (let i = 0; i < chartData.length; i++) {
      if (i < kPeriod - 1) {
        stochasticK.push(null);
      } else {
        const periodHigh = Math.max(...highs.slice(i - kPeriod + 1, i + 1));
        const periodLow = Math.min(...lows.slice(i - kPeriod + 1, i + 1));
        const currentClose = closes[i];
        
        if (periodHigh === periodLow) {
          stochasticK.push(50); // Avoid division by zero
        } else {
          const kValue = ((currentClose - periodLow) / (periodHigh - periodLow)) * 100;
          stochasticK.push(kValue);
        }
      }
    }

    // Calculate %D (SMA of %K)
    const validKValues = stochasticK.filter(val => val !== null) as number[];
    const stochasticD = this.calculateSMA(validKValues, dPeriod);

    // Align %D with %K
    const alignedStochasticD: (number | null)[] = [];
    let dIndex = 0;
    
    for (let i = 0; i < stochasticK.length; i++) {
      if (stochasticK[i] !== null) {
        alignedStochasticD.push(stochasticD[dIndex] || null);
        dIndex++;
      } else {
        alignedStochasticD.push(null);
      }
    }

    return {
      stochastic_k: stochasticK,
      stochastic_d: alignedStochasticD
    };
  }

  // Williams %R calculation
  private calculateWilliamsR(chartData: ChartDataPoint[], period: number = 14): (number | null)[] {
    const williamsR: (number | null)[] = [];
    const highs = chartData.map(point => point.h);
    const lows = chartData.map(point => point.l);
    const closes = chartData.map(point => point.c);

    for (let i = 0; i < chartData.length; i++) {
      if (i < period - 1) {
        williamsR.push(null);
      } else {
        const periodHigh = Math.max(...highs.slice(i - period + 1, i + 1));
        const periodLow = Math.min(...lows.slice(i - period + 1, i + 1));
        const currentClose = closes[i];
        
        if (periodHigh === periodLow) {
          williamsR.push(-50); // Avoid division by zero
        } else {
          const wrValue = ((periodHigh - currentClose) / (periodHigh - periodLow)) * -100;
          williamsR.push(wrValue);
        }
      }
    }

    return williamsR;
  }

  // Average True Range (ATR) calculation
  private calculateATR(chartData: ChartDataPoint[], period: number = 14): (number | null)[] {
    const trueRanges: number[] = [];
    
    // Calculate True Range for each period
    for (let i = 1; i < chartData.length; i++) {
      const high = chartData[i].h;
      const low = chartData[i].l;
      const prevClose = chartData[i - 1].c;
      
      const tr1 = high - low;
      const tr2 = Math.abs(high - prevClose);
      const tr3 = Math.abs(low - prevClose);
      
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }

    // Calculate ATR using SMA of True Range
    const atr: (number | null)[] = [null]; // First value is null since we need previous close
    
    for (let i = 0; i < trueRanges.length; i++) {
      if (i < period - 1) {
        atr.push(null);
      } else {
        const avgTR = trueRanges.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
        atr.push(avgTR);
      }
    }

    return atr;
  }

  // Average Directional Index (ADX) calculation
  private calculateADX(chartData: ChartDataPoint[], period: number = 14): ADXResult {
    const plusDM: number[] = [];
    const minusDM: number[] = [];
    const trueRanges: number[] = [];

    // Calculate Directional Movement and True Range
    for (let i = 1; i < chartData.length; i++) {
      const high = chartData[i].h;
      const low = chartData[i].l;
      const prevHigh = chartData[i - 1].h;
      const prevLow = chartData[i - 1].l;
      const prevClose = chartData[i - 1].c;

      const upMove = high - prevHigh;
      const downMove = prevLow - low;

      plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
      minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);

      const tr1 = high - low;
      const tr2 = Math.abs(high - prevClose);
      const tr3 = Math.abs(low - prevClose);
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }

    // Calculate smoothed values
    const smoothedPlusDM = this.calculateEMA(plusDM, period);
    const smoothedMinusDM = this.calculateEMA(minusDM, period);
    const smoothedTR = this.calculateEMA(trueRanges, period);

    const plusDI: (number | null)[] = [null];
    const minusDI: (number | null)[] = [null];
    const dx: (number | null)[] = [null];

    for (let i = 0; i < smoothedTR.length; i++) {
      if (smoothedTR[i] !== null && smoothedTR[i] !== 0) {
        const plusDIValue = (smoothedPlusDM[i]! / smoothedTR[i]!) * 100;
        const minusDIValue = (smoothedMinusDM[i]! / smoothedTR[i]!) * 100;
        
        plusDI.push(plusDIValue);
        minusDI.push(minusDIValue);

        const diSum = plusDIValue + minusDIValue;
        if (diSum !== 0) {
          const dxValue = (Math.abs(plusDIValue - minusDIValue) / diSum) * 100;
          dx.push(dxValue);
        } else {
          dx.push(null);
        }
      } else {
        plusDI.push(null);
        minusDI.push(null);
        dx.push(null);
      }
    }

    // Calculate ADX (smoothed DX)
    const validDxValues = dx.filter(val => val !== null) as number[];
    const adxValues = this.calculateEMA(validDxValues, period);

    // Align ADX with original data
    const adx: (number | null)[] = [null];
    let adxIndex = 0;
    
    for (let i = 1; i < dx.length; i++) {
      if (dx[i] !== null) {
        adx.push(adxValues[adxIndex] || null);
        adxIndex++;
      } else {
        adx.push(null);
      }
    }

    return {
      adx: adx,
      plus_di: plusDI,
      minus_di: minusDI
    };
  }

  // Fibonacci Retracement calculation
  private calculateFibonacci(chartData: ChartDataPoint[]): {
    high: number;
    low: number;
    levels: { level: number; price: number; name: string }[];
  } {
    const prices = chartData.map(point => point.c);
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const diff = high - low;

    const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
    const levelNames = ['0%', '23.6%', '38.2%', '50%', '61.8%', '78.6%', '100%'];

    const levels = fibLevels.map((level, index) => ({
      level: level,
      price: high - (diff * level),
      name: levelNames[index]
    }));

    return {
      high: high,
      low: low,
      levels: levels
    };
  }

  // Volume Profile calculation
  private calculateVolumeProfile(chartData: ChartDataPoint[], bins: number = 20): {
    price_levels: number[];
    volume_at_price: number[];
    poc: number;
    vah: number;
    val: number;
  } {
    const prices = chartData.map(point => point.c);
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const priceRange = high - low;
    const binSize = priceRange / bins;

    const volumeProfile: { price: number; volume: number }[] = [];

    // Create price levels
    for (let i = 0; i < bins; i++) {
      const priceLevel = low + (i * binSize) + (binSize / 2);
      let totalVolume = 0;

      // Sum volume for this price level
      chartData.forEach((point) => {
        const binStart = low + (i * binSize);
        const binEnd = binStart + binSize;
        
        if (point.c >= binStart && point.c < binEnd) {
          totalVolume += point.v;
        }
      });

      volumeProfile.push({ price: priceLevel, volume: totalVolume });
    }

    // Find Point of Control (highest volume)
    const poc = volumeProfile.reduce((max, current) => 
      current.volume > max.volume ? current : max
    ).price;

    // Calculate Value Area (70% of total volume)
    const totalVolume = volumeProfile.reduce((sum, level) => sum + level.volume, 0);
    const valueAreaThreshold = totalVolume * 0.7;

    // Sort by volume to find value area
    const sortedByVolume = [...volumeProfile].sort((a, b) => b.volume - a.volume);
    let valueAreaVolume = 0;
    const valueAreaLevels: number[] = [];

    for (const level of sortedByVolume) {
      if (valueAreaVolume < valueAreaThreshold) {
        valueAreaVolume += level.volume;
        valueAreaLevels.push(level.price);
      }
    }

    const vah = Math.max(...valueAreaLevels);
    const val = Math.min(...valueAreaLevels);

    return {
      price_levels: volumeProfile.map(level => level.price),
      volume_at_price: volumeProfile.map(level => level.volume),
      poc: poc,
      vah: vah,
      val: val
    };
  }

  // Ichimoku Cloud calculation
  private calculateIchimoku(chartData: ChartDataPoint[]): IchimokuResult {
    const highs = chartData.map(point => point.h);
    const lows = chartData.map(point => point.l);
    const closes = chartData.map(point => point.c);

    // Tenkan-sen (Conversion Line): (9-period high + 9-period low) / 2
    const tenkanSen: (number | null)[] = [];
    for (let i = 0; i < chartData.length; i++) {
      if (i < 8) {
        tenkanSen.push(null);
      } else {
        const periodHigh = Math.max(...highs.slice(i - 8, i + 1));
        const periodLow = Math.min(...lows.slice(i - 8, i + 1));
        tenkanSen.push((periodHigh + periodLow) / 2);
      }
    }

    // Kijun-sen (Base Line): (26-period high + 26-period low) / 2
    const kijunSen: (number | null)[] = [];
    for (let i = 0; i < chartData.length; i++) {
      if (i < 25) {
        kijunSen.push(null);
      } else {
        const periodHigh = Math.max(...highs.slice(i - 25, i + 1));
        const periodLow = Math.min(...lows.slice(i - 25, i + 1));
        kijunSen.push((periodHigh + periodLow) / 2);
      }
    }

    // Senkou Span A (Leading Span A): (Tenkan-sen + Kijun-sen) / 2, plotted 26 periods ahead
    const senkouSpanA: (number | null)[] = [];
    for (let i = 0; i < chartData.length; i++) {
      if (tenkanSen[i] !== null && kijunSen[i] !== null) {
        senkouSpanA.push((tenkanSen[i]! + kijunSen[i]!) / 2);
      } else {
        senkouSpanA.push(null);
      }
    }

    // Senkou Span B (Leading Span B): (52-period high + 52-period low) / 2, plotted 26 periods ahead
    const senkouSpanB: (number | null)[] = [];
    for (let i = 0; i < chartData.length; i++) {
      if (i < 51) {
        senkouSpanB.push(null);
      } else {
        const periodHigh = Math.max(...highs.slice(i - 51, i + 1));
        const periodLow = Math.min(...lows.slice(i - 51, i + 1));
        senkouSpanB.push((periodHigh + periodLow) / 2);
      }
    }

    // Chikou Span (Lagging Span): Current closing price plotted 26 periods back
    const chikouSpan: (number | null)[] = [];
    for (let i = 0; i < chartData.length; i++) {
      if (i >= 26) {
        chikouSpan.push(closes[i - 26]);
      } else {
        chikouSpan.push(null);
      }
    }

    return {
      tenkan_sen: tenkanSen,
      kijun_sen: kijunSen,
      senkou_span_a: senkouSpanA,
      senkou_span_b: senkouSpanB,
      chikou_span: chikouSpan
    };
  }

  // Main function to calculate all technical indicators
  calculateTechnicalIndicators(chartData: ChartDataPoint[], symbol: string, period: string): TechnicalData {
    const prices = chartData.map(point => point.c);
    const dates = chartData.map(point => point.x);
    
    // Calculate existing indicators
    const sma20 = this.calculateSMA(prices, 20);
    const sma50 = this.calculateSMA(prices, 50);
    const rsi = this.calculateRSI(prices, 14);
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macd = this.calculateMACD(prices);
    const bollinger = this.calculateBollingerBands(prices, 20, 2);
    
    // Calculate new advanced indicators
    const stochastic = this.calculateStochastic(chartData, 14, 3);
    const williamsR = this.calculateWilliamsR(chartData, 14);
    const atr = this.calculateATR(chartData, 14);
    const adx = this.calculateADX(chartData, 14);
    const fibonacci = this.calculateFibonacci(chartData);
    const volumeProfile = this.calculateVolumeProfile(chartData, 20);
    const ichimoku = this.calculateIchimoku(chartData);
    
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
        bollinger_lower: bollinger.bollinger_lower,
        // Advanced indicators
        stochastic_k: stochastic.stochastic_k,
        stochastic_d: stochastic.stochastic_d,
        williams_r: williamsR,
        atr: atr,
        adx: adx.adx,
        plus_di: adx.plus_di,
        minus_di: adx.minus_di,
        fibonacci_levels: fibonacci,
        volume_profile: volumeProfile,
        ichimoku: ichimoku
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
      bollinger_lower: getLatestValue(technicalData.indicators.bollinger_lower || []),
      // Advanced indicators
      stochastic_k: getLatestValue(technicalData.indicators.stochastic_k || []),
      stochastic_d: getLatestValue(technicalData.indicators.stochastic_d || []),
      williams_r: getLatestValue(technicalData.indicators.williams_r || []),
      atr: getLatestValue(technicalData.indicators.atr || []),
      adx: getLatestValue(technicalData.indicators.adx || []),
      plus_di: getLatestValue(technicalData.indicators.plus_di || []),
      minus_di: getLatestValue(technicalData.indicators.minus_di || []),
      // Ichimoku current values
      tenkan_sen: getLatestValue(technicalData.indicators.ichimoku?.tenkan_sen || []),
      kijun_sen: getLatestValue(technicalData.indicators.ichimoku?.kijun_sen || []),
      senkou_span_a: getLatestValue(technicalData.indicators.ichimoku?.senkou_span_a || []),
      senkou_span_b: getLatestValue(technicalData.indicators.ichimoku?.senkou_span_b || []),
      chikou_span: getLatestValue(technicalData.indicators.ichimoku?.chikou_span || [])
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

  // Helper method to get specific advanced indicator analysis
  getAdvancedIndicatorAnalysis(technicalData: TechnicalData): {
    stochastic: { signal: string; strength: string };
    williamsR: { signal: string; strength: string };
    adx: { trend: string; strength: string };
    ichimoku: { signal: string; cloud: string };
    volumeProfile: { position: string; significance: string };
  } {
    const current = this.getCurrentIndicatorValues(technicalData);
    
    // Stochastic analysis
    const stochasticK = current.stochastic_k || 0;
    const stochasticSignal = stochasticK > 80 ? 'Overbought' : stochasticK < 20 ? 'Oversold' : 'Neutral';
    const stochasticStrength = Math.abs(stochasticK - 50) > 30 ? 'Strong' : 'Weak';
    
    // Williams %R analysis
    const williamsR = current.williams_r || 0;
    const williamsSignal = williamsR > -20 ? 'Overbought' : williamsR < -80 ? 'Oversold' : 'Neutral';
    const williamsStrength = Math.abs(williamsR + 50) > 30 ? 'Strong' : 'Weak';
    
    // ADX analysis
    const adx = current.adx || 0;
    const plusDI = current.plus_di || 0;
    const minusDI = current.minus_di || 0;
    const adxTrend = plusDI > minusDI ? 'Bullish' : 'Bearish';
    const adxStrength = adx > 25 ? 'Strong' : adx > 15 ? 'Moderate' : 'Weak';
    
    // Ichimoku analysis
    const currentPrice = current.current_price || 0;
    const senkouA = current.senkou_span_a || 0;
    const senkouB = current.senkou_span_b || 0;
    const ichimokuSignal = currentPrice > Math.max(senkouA, senkouB) ? 'Bullish' : 
                          currentPrice < Math.min(senkouA, senkouB) ? 'Bearish' : 'Neutral';
    const ichimokuCloud = senkouA > senkouB ? 'Bullish Cloud' : 'Bearish Cloud';
    
    // Volume Profile analysis
    const volumeProfile = technicalData.indicators.volume_profile;
    let volumePosition = 'Unknown';
    let volumeSignificance = 'Low';
    
    if (volumeProfile) {
      const vah = volumeProfile.vah;
      const val = volumeProfile.val;
      
      if (currentPrice >= vah) {
        volumePosition = 'Above Value Area';
        volumeSignificance = 'High';
      } else if (currentPrice <= val) {
        volumePosition = 'Below Value Area';
        volumeSignificance = 'High';
      } else {
        volumePosition = 'Within Value Area';
        volumeSignificance = 'Medium';
      }
    }
    
    return {
      stochastic: { signal: stochasticSignal, strength: stochasticStrength },
      williamsR: { signal: williamsSignal, strength: williamsStrength },
      adx: { trend: adxTrend, strength: adxStrength },
      ichimoku: { signal: ichimokuSignal, cloud: ichimokuCloud },
      volumeProfile: { position: volumePosition, significance: volumeSignificance }
    };
  }
}

export const technicalIndicatorService = TechnicalIndicatorService.getInstance(); 