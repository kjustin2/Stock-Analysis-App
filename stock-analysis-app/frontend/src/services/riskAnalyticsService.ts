import { ChartDataPoint } from './stockDataService';
import { standardDeviation, mean } from 'simple-statistics';

// Core interfaces for risk analytics
export interface VaRResult {
  dailyVaR: number;
  weeklyVaR: number;
  monthlyVaR: number;
  confidenceLevel: number;
  method: 'historical' | 'parametric' | 'monte_carlo';
  timeHorizon: number; // days
}

export interface CorrelationAnalysis {
  symbol: string;
  marketIndices: Array<{
    index: string;
    correlation: number;
    strength: 'weak' | 'moderate' | 'strong';
    direction: 'positive' | 'negative';
  }>;
  sectorCorrelation?: {
    sector: string;
    correlation: number;
    relativeStrength: 'underperform' | 'neutral' | 'outperform';
  };
}

export interface BetaAnalysis {
  beta: number;
  alpha: number;
  rSquared: number;
  interpretation: {
    volatility: 'low' | 'moderate' | 'high';
    sensitivity: 'defensive' | 'neutral' | 'aggressive';
    marketRisk: 'below_market' | 'market_level' | 'above_market';
  };
  benchmarkIndex: string;
}

export interface RiskMetrics {
  sharpeRatio: number;
  volatility: number; // annualized
  maxDrawdown: number;
  calmarRatio: number;
  sortinoRatio: number;
  informationRatio?: number;
}

export interface SectorComparison {
  currentSector: string;
  sectorMetrics: {
    avgReturn: number;
    avgVolatility: number;
    sectorBeta: number;
  };
  stockVsSector: {
    returnDifference: number; // percentage points
    volatilityDifference: number;
    betaDifference: number;
    ranking: 'top_quartile' | 'above_average' | 'below_average' | 'bottom_quartile';
  };
}

export interface PortfolioRisk {
  diversificationBenefit: number;
  concentrationRisk: 'low' | 'moderate' | 'high';
  correlationMatrix: number[][];
  portfolioVaR: VaRResult;
  recommendations: string[];
}

export class RiskAnalyticsService {
  private static instance: RiskAnalyticsService;
  
  public static getInstance(): RiskAnalyticsService {
    if (!RiskAnalyticsService.instance) {
      RiskAnalyticsService.instance = new RiskAnalyticsService();
    }
    return RiskAnalyticsService.instance;
  }

  // Calculate Value at Risk using historical simulation method
  public calculateVaR(
    chartData: ChartDataPoint[], 
    confidenceLevel: number = 0.95,
    method: 'historical' | 'parametric' = 'historical'
  ): VaRResult {
    if (chartData.length < 30) {
      throw new Error('Insufficient data for VaR calculation (minimum 30 periods required)');
    }

    const returns = this.calculateReturns(chartData);
    
    if (method === 'historical') {
      return this.calculateHistoricalVaR(returns, confidenceLevel);
    } else {
      return this.calculateParametricVaR(returns, confidenceLevel);
    }
  }

  // Historical VaR calculation
  private calculateHistoricalVaR(returns: number[], confidenceLevel: number): VaRResult {
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const percentileIndex = Math.floor((1 - confidenceLevel) * sortedReturns.length);
    const dailyVaR = Math.abs(sortedReturns[percentileIndex]);

    return {
      dailyVaR,
      weeklyVaR: dailyVaR * Math.sqrt(5),
      monthlyVaR: dailyVaR * Math.sqrt(21),
      confidenceLevel,
      method: 'historical',
      timeHorizon: 1
    };
  }

  // Parametric VaR calculation (assumes normal distribution)
  private calculateParametricVaR(returns: number[], confidenceLevel: number): VaRResult {
    const avgReturn = mean(returns);
    const stdDev = standardDeviation(returns);
    
    // Z-score for confidence level (approximation)
    const zScore = confidenceLevel === 0.95 ? 1.645 : 
                   confidenceLevel === 0.99 ? 2.326 : 1.96;
    
    const dailyVaR = Math.abs(avgReturn - (zScore * stdDev));

    return {
      dailyVaR,
      weeklyVaR: dailyVaR * Math.sqrt(5),
      monthlyVaR: dailyVaR * Math.sqrt(21),
      confidenceLevel,
      method: 'parametric',
      timeHorizon: 1
    };
  }

  // Calculate correlation with market indices
  public calculateCorrelation(
    stockData: ChartDataPoint[],
    symbol: string
  ): CorrelationAnalysis {
    const stockReturns = this.calculateReturns(stockData);
    const marketIndices = ['SPY', 'QQQ', 'IWM', 'VTI']; // Major market indices
    
    const correlations = marketIndices.map(index => {
      // In production, fetch actual index data
      const syntheticIndexData = this.generateSyntheticMarketData(symbol, stockData.length);
      const indexReturns = this.calculateReturns(syntheticIndexData);
      
      const correlation = this.calculatePearsonCorrelation(stockReturns, indexReturns);
      
      return {
        index,
        correlation: Number(correlation.toFixed(3)),
        strength: this.getCorrelationStrength(Math.abs(correlation)),
        direction: correlation >= 0 ? 'positive' as const : 'negative' as const
      };
    });

    return {
      symbol,
      marketIndices: correlations
    };
  }

  // Calculate Beta analysis
  public calculateBeta(
    stockData: ChartDataPoint[],
    benchmarkIndex: string = 'SPY'
  ): BetaAnalysis {
    const stockReturns = this.calculateReturns(stockData);
    
    // In production, fetch actual benchmark data
    const benchmarkData = this.generateSyntheticMarketData(benchmarkIndex, stockData.length);
    const benchmarkReturns = this.calculateReturns(benchmarkData);
    
    const { beta, alpha, rSquared } = this.calculateLinearRegression(stockReturns, benchmarkReturns);
    
    return {
      beta: Number(beta.toFixed(3)),
      alpha: Number(alpha.toFixed(4)),
      rSquared: Number(rSquared.toFixed(3)),
      interpretation: {
        volatility: Math.abs(beta) < 0.8 ? 'low' : Math.abs(beta) > 1.2 ? 'high' : 'moderate',
        sensitivity: beta < 0.8 ? 'defensive' : beta > 1.2 ? 'aggressive' : 'neutral',
        marketRisk: beta < 1 ? 'below_market' : beta > 1 ? 'above_market' : 'market_level'
      },
      benchmarkIndex
    };
  }

  // Calculate comprehensive risk metrics
  public calculateRiskMetrics(chartData: ChartDataPoint[]): RiskMetrics {
    const returns = this.calculateReturns(chartData);
    const prices = chartData.map(point => point.c);
    
    const avgReturn = mean(returns);
    const volatility = standardDeviation(returns) * Math.sqrt(252); // Annualized
    const maxDrawdown = this.calculateMaxDrawdown(prices);
    
    // Risk-free rate assumption (2% annually)
    const riskFreeRate = 0.02 / 252; // Daily risk-free rate
    
    const sharpeRatio = (avgReturn - riskFreeRate) / standardDeviation(returns);
    const calmarRatio = (avgReturn * 252) / Math.abs(maxDrawdown);
    const sortinoRatio = this.calculateSortinoRatio(returns, riskFreeRate);

    return {
      sharpeRatio: Number(sharpeRatio.toFixed(3)),
      volatility: Number(volatility.toFixed(4)),
      maxDrawdown: Number(maxDrawdown.toFixed(4)),
      calmarRatio: Number(calmarRatio.toFixed(3)),
      sortinoRatio: Number(sortinoRatio.toFixed(3))
    };
  }

  // Calculate sector comparison (simplified implementation)
  public calculateSectorComparison(
    stockData: ChartDataPoint[],
    sector: string = 'Technology'
  ): SectorComparison {
    const stockReturns = this.calculateReturns(stockData);
    const stockVolatility = standardDeviation(stockReturns);
    const stockBeta = this.calculateBeta(stockData).beta;
    
    // Synthetic sector data (in production, use real sector indices)
    const sectorMetrics = {
      avgReturn: 0.0008, // 0.08% daily average
      avgVolatility: 0.025, // 2.5% daily volatility
      sectorBeta: 1.1
    };
    
    const returnDifference = (mean(stockReturns) - sectorMetrics.avgReturn) * 252 * 100; // Annualized %
    const volatilityDifference = (stockVolatility - sectorMetrics.avgVolatility) * 100;
    const betaDifference = stockBeta - sectorMetrics.sectorBeta;
    
    // Determine ranking
    let ranking: 'top_quartile' | 'above_average' | 'below_average' | 'bottom_quartile';
    if (returnDifference > 5) ranking = 'top_quartile';
    else if (returnDifference > 0) ranking = 'above_average';
    else if (returnDifference > -5) ranking = 'below_average';
    else ranking = 'bottom_quartile';

    return {
      currentSector: sector,
      sectorMetrics,
      stockVsSector: {
        returnDifference: Number(returnDifference.toFixed(2)),
        volatilityDifference: Number(volatilityDifference.toFixed(2)),
        betaDifference: Number(betaDifference.toFixed(3)),
        ranking
      }
    };
  }

  // Portfolio risk assessment (for multiple stocks)
  public calculatePortfolioRisk(
    stocksData: Array<{ symbol: string; data: ChartDataPoint[]; weight: number }>,
    confidenceLevel: number = 0.95
  ): PortfolioRisk {
    const returns = stocksData.map(stock => this.calculateReturns(stock.data));
    const weights = stocksData.map(stock => stock.weight);
    
    // Calculate correlation matrix
    const correlationMatrix = this.calculateCorrelationMatrix(returns);
    
    // Portfolio returns
    const portfolioReturns = this.calculatePortfolioReturns(returns, weights);
    
    // Portfolio VaR
    const portfolioVaR = this.calculateHistoricalVaR(portfolioReturns, confidenceLevel);
    
    // Diversification benefit
    const individualVaRs = returns.map(ret => this.calculateHistoricalVaR(ret, confidenceLevel).dailyVaR);
    const weightedIndividualVaR = individualVaRs.reduce((sum, var_, i) => sum + var_ * weights[i], 0);
    const diversificationBenefit = (weightedIndividualVaR - portfolioVaR.dailyVaR) / weightedIndividualVaR;
    
    // Concentration risk
    const maxWeight = Math.max(...weights);
    const concentrationRisk = maxWeight > 0.5 ? 'high' : maxWeight > 0.3 ? 'moderate' : 'low';
    
    const recommendations = this.generatePortfolioRecommendations(
      correlationMatrix, 
      weights, 
      concentrationRisk
    );

    return {
      diversificationBenefit: Number(diversificationBenefit.toFixed(3)),
      concentrationRisk,
      correlationMatrix,
      portfolioVaR,
      recommendations
    };
  }

  // Helper methods
  private calculateReturns(chartData: ChartDataPoint[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < chartData.length; i++) {
      const return_ = (chartData[i].c - chartData[i - 1].c) / chartData[i - 1].c;
      returns.push(return_);
    }
    return returns;
  }

  private calculatePearsonCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * y.reduce((sum, val) => sum + val * val, 0) - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  private calculateLinearRegression(y: number[], x: number[]): { beta: number; alpha: number; rSquared: number } {
    if (x.length !== y.length || x.length < 2) {
      return { beta: 0, alpha: 0, rSquared: 0 };
    }

    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);

    const beta = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const alpha = (sumY - beta * sumX) / n;

    // Calculate R-squared
    const yMean = sumY / n;
    const totalSumSquares = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    const residualSumSquares = y.reduce((sum, val, i) => {
      const predicted = alpha + beta * x[i];
      return sum + Math.pow(val - predicted, 2);
    }, 0);
    
    const rSquared = totalSumSquares === 0 ? 0 : 1 - (residualSumSquares / totalSumSquares);

    return { beta, alpha, rSquared };
  }

  private calculateMaxDrawdown(prices: number[]): number {
    let maxDrawdown = 0;
    let peak = prices[0];

    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > peak) {
        peak = prices[i];
      }
      const drawdown = (peak - prices[i]) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }

  private calculateSortinoRatio(returns: number[], riskFreeRate: number): number {
    const excessReturns = returns.map(r => r - riskFreeRate);
    const avgExcessReturn = mean(excessReturns);
    
    const downside = returns.filter(r => r < riskFreeRate);
    if (downside.length === 0) return Infinity;
    
    const downsideDeviation = Math.sqrt(
      downside.reduce((sum, r) => sum + Math.pow(r - riskFreeRate, 2), 0) / downside.length
    );

    return downsideDeviation === 0 ? Infinity : avgExcessReturn / downsideDeviation;
  }

  private getCorrelationStrength(correlation: number): 'weak' | 'moderate' | 'strong' {
    if (correlation < 0.3) return 'weak';
    if (correlation < 0.7) return 'moderate';
    return 'strong';
  }

  private generateSyntheticMarketData(_symbol: string, length: number): ChartDataPoint[] {
    return Array.from({ length }, (_, i) => {
      const basePrice = 100 + (Math.random() - 0.5) * 40;
      const variation = basePrice * 0.02; // 2% variation
      return {
        x: new Date(Date.now() - (length - i) * 86400000).toISOString().split('T')[0], // Date string
        o: basePrice + (Math.random() - 0.5) * variation, // Open
        h: basePrice + Math.random() * variation, // High
        l: basePrice - Math.random() * variation, // Low
        c: basePrice + (Math.random() - 0.5) * variation, // Close
        v: Math.floor(Math.random() * 1000000) + 100000 // Volume
      };
    });
  }

  private calculateCorrelationMatrix(returns: number[][]): number[][] {
    const n = returns.length;
    const matrix: number[][] = [];
    
    for (let i = 0; i < n; i++) {
      matrix[i] = [];
      for (let j = 0; j < n; j++) {
        matrix[i][j] = i === j ? 1 : this.calculatePearsonCorrelation(returns[i], returns[j]);
      }
    }
    
    return matrix;
  }

  private calculatePortfolioReturns(returns: number[][], weights: number[]): number[] {
    const portfolioReturns: number[] = [];
    const periods = returns[0].length;
    
    for (let i = 0; i < periods; i++) {
      let portfolioReturn = 0;
      for (let j = 0; j < returns.length; j++) {
        portfolioReturn += returns[j][i] * weights[j];
      }
      portfolioReturns.push(portfolioReturn);
    }
    
    return portfolioReturns;
  }

  private generatePortfolioRecommendations(
    correlationMatrix: number[][],
    weights: number[],
    concentrationRisk: 'low' | 'moderate' | 'high'
  ): string[] {
    const recommendations: string[] = [];
    
    if (concentrationRisk === 'high') {
      recommendations.push('Consider reducing concentration in top holdings');
    }
    
    // Check for high correlations
    const highCorrelations = correlationMatrix.some((row, i) =>
      row.some((correlation, j) => i !== j && Math.abs(correlation) > 0.8)
    );
    
    if (highCorrelations) {
      recommendations.push('Some holdings are highly correlated - consider diversifying across sectors');
    }
    
    if (weights.length < 5) {
      recommendations.push('Consider adding more holdings to improve diversification');
    }
    
    return recommendations;
  }
} 