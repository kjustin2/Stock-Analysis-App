import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import UnifiedStockChart from './components/UnifiedStockChart';
import ChartSelector from './components/ChartSelector';
import InfoTooltip from './components/InfoTooltip';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorMessage from './components/ErrorMessage';
import StockSearchBox from './components/StockSearchBox';

// Lazy load heavy components that aren't immediately needed
const TechnicalDashboard = lazy(() => import('./components/TechnicalDashboard'));
const AdvancedStockChart = lazy(() => import('./components/AdvancedStockChart'));

// Import services
import { stockDataService, StockInfo, ChartData } from './services/stockDataService';
import { recommendationService, Recommendation } from './services/recommendationService';
import { newsService, NewsItem } from './services/newsService';
import { realTimeDataService, RealTimeUpdate } from './services/realTimeDataService';
import { PatternRecognitionService, PatternResult, SentimentResult, EnsemblePrediction, HistoricalMatch } from './services/patternRecognitionService';
import { RiskAnalyticsService, VaRResult, CorrelationAnalysis, BetaAnalysis, RiskMetrics, SectorComparison } from './services/riskAnalyticsService';
import RealTimeTechnicalService, { RealTimeTechnicalData, TechnicalAlerts } from './services/realTimeTechnicalService';
import SmartStockSearch from './components/SmartStockSearch';

const popularStocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX'];

// Memoized components for better performance
const StockChip = React.memo(({ stock, onClick }: { stock: string; onClick: (stock: string) => void }) => (
  <button
    className="stock-chip"
    onClick={() => onClick(stock)}
  >
    {stock}
  </button>
));

const PriceDisplay = React.memo(({ stockInfo, change, changePercent }: { 
  stockInfo: StockInfo; 
  change: number; 
  changePercent: number; 
}) => (
  <div className="stock-price">
    ${stockInfo.current_price.toFixed(2)}
    <span className={`price-change ${change >= 0 ? 'positive' : 'negative'}`}>
      {change >= 0 ? '+' : ''}{change.toFixed(2)} ({change >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
    </span>
  </div>
));

// Loading component for Suspense
const LoadingSpinner = () => (
  <div className="loading">
    <div>Loading component...</div>
  </div>
);

function App() {
  const [stockSymbol, setStockSymbol] = useState('');
  const [currentSymbol, setCurrentSymbol] = useState('');
  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPeriod, setCurrentPeriod] = useState('1m');
  const [isRealTimeLive, setIsRealTimeLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [updateSource, setUpdateSource] = useState<string>('');
  
  // ML Pattern Recognition state
  const [patterns, setPatterns] = useState<PatternResult[]>([]);
  const [sentiment, setSentiment] = useState<SentimentResult | null>(null);
  const [ensemblePrediction, setEnsemblePrediction] = useState<EnsemblePrediction | null>(null);
  const [historicalMatches, setHistoricalMatches] = useState<HistoricalMatch[]>([]);
  
  // Risk Analytics state
  const [varResult, setVarResult] = useState<VaRResult | null>(null);
  const [correlationAnalysis, setCorrelationAnalysis] = useState<CorrelationAnalysis | null>(null);
  const [betaAnalysis, setBetaAnalysis] = useState<BetaAnalysis | null>(null);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  const [sectorComparison, setSectorComparison] = useState<SectorComparison | null>(null);
  
  // Real-Time Technical Indicators state
  const [realTimeTechnical, setRealTimeTechnical] = useState<RealTimeTechnicalData | null>(null);
  const [technicalAlerts, setTechnicalAlerts] = useState<TechnicalAlerts | null>(null);
  const [realTimeTechnicalService] = useState(() => RealTimeTechnicalService.getInstance());
  
  // Advanced Chart state
  const [useAdvancedChart, setUseAdvancedChart] = useState(true);
  
  // Enhanced Visualization state for Task 2.5
  const [chartType, setChartType] = useState<'basic' | 'advanced' | 'interactive'>('interactive');
  const [dashboardLayout, setDashboardLayout] = useState<'single' | 'grid' | 'tabs'>('single');
  const [enabledIndicators, setEnabledIndicators] = useState<Set<string>>(new Set(['sma_20', 'rsi']));
  const [isMobileView, setIsMobileView] = useState(false);
  
  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const searchStock = (symbol: string) => {
    setStockSymbol(symbol);
    analyzeStock(symbol);
  };

  // Enhanced Chart Configuration Handlers for Task 2.5
  const handleChartTypeChange = (type: 'basic' | 'advanced' | 'interactive') => {
    setChartType(type);
  };

  const handleLayoutChange = (layout: 'single' | 'grid' | 'tabs') => {
    setDashboardLayout(layout);
  };

  const handleIndicatorToggle = (indicator: string, enabled: boolean) => {
    const newIndicators = new Set(enabledIndicators);
    if (enabled) {
      newIndicators.add(indicator);
    } else {
      newIndicators.delete(indicator);
    }
    setEnabledIndicators(newIndicators);
  };

  const analyzeStock = async (symbol?: string) => {
    const targetSymbol = (symbol || stockSymbol).trim().toUpperCase();
    
    if (!targetSymbol) {
      setError('Please enter a stock symbol');
      return;
    }

    setCurrentSymbol(targetSymbol);
    setLoading(true);
    setError('');
    
    // Clear previous data
    setStockInfo(null);
    setChartData(null);
    setRecommendation(null);
    setNews([]);
    
    // Clear ML analysis data
    setPatterns([]);
    setSentiment(null);
    setEnsemblePrediction(null);
    setHistoricalMatches([]);
    
    // Clear risk analytics data
    setVarResult(null);
    setCorrelationAnalysis(null);
    setBetaAnalysis(null);
    setRiskMetrics(null);
    setSectorComparison(null);
    
    // Clear real-time technical data
    setRealTimeTechnical(null);
    setTechnicalAlerts(null);

    try {
      // Get stock data and chart data with improved error handling
      const [stockInfoData, chartDataData] = await Promise.all([
        stockDataService.getStockInfo(targetSymbol),
        stockDataService.getChartDataWithTechnicals(targetSymbol, currentPeriod)
      ]);

      // Validate that we received real data
      if (!stockInfoData || !chartDataData || chartDataData.data.length === 0) {
        throw new Error('No real-time data available for this symbol');
      }

      setStockInfo(stockInfoData);
      setChartData(chartDataData);

      // Generate recommendation based on real stock data and chart data
      const recommendationData = recommendationService.generateRecommendation(
        stockInfoData,
        chartDataData.data,
        currentPeriod
      );
      setRecommendation(recommendationData);

      // Perform ML Pattern Recognition Analysis
      try {
        const patternService = PatternRecognitionService.getInstance();
        
        // Detect chart patterns
        const detectedPatterns = patternService.detectPatterns(chartDataData.data);
        setPatterns(detectedPatterns);

        // Analyze sentiment (requires technical indicators)
        if (chartDataData.technicalData) {
          const sentimentAnalysis = patternService.analyzeSentiment(chartDataData.data, chartDataData.technicalData);
          setSentiment(sentimentAnalysis);

          // Generate ensemble prediction
          const prediction = patternService.generateEnsemblePrediction(chartDataData.data, chartDataData.technicalData);
          setEnsemblePrediction(prediction);
        }

        // Find historical pattern matches
        const matches = patternService.findHistoricalMatches(chartDataData.data);
        setHistoricalMatches(matches);
        
      } catch (mlError) {
        // console.warn('ML analysis failed (non-critical):', mlError);
        // ML analysis failure should not block the main functionality
      }

      // Perform Risk Analytics Analysis
      try {
        const riskService = RiskAnalyticsService.getInstance();
        
        // Calculate Value at Risk
        const var95 = riskService.calculateVaR(chartDataData.data, 0.95);
        setVarResult(var95);

        // Correlation analysis
        const correlation = riskService.calculateCorrelation(chartDataData.data, targetSymbol);
        setCorrelationAnalysis(correlation);

        // Beta analysis
        const beta = riskService.calculateBeta(chartDataData.data);
        setBetaAnalysis(beta);

        // Risk metrics
        const metrics = riskService.calculateRiskMetrics(chartDataData.data);
        setRiskMetrics(metrics);

        // Sector comparison
        const sector = riskService.calculateSectorComparison(chartDataData.data);
        setSectorComparison(sector);
        
      } catch (riskError) {
        // console.warn('Risk analytics failed (non-critical):', riskError);
        // Risk analysis failure should not block the main functionality
      }

      // Set up real-time updates for this symbol
      await setupRealTimeUpdates(targetSymbol);

      // Load news asynchronously (non-blocking) to improve performance
      // This allows the UI to show stock data immediately while news loads in background
      loadNewsAsync(targetSymbol);
    } catch (error) {
      console.error('Stock analysis failed:', error);
      setError(
        `Unable to fetch real-time data for ${targetSymbol}. ` +
        'Please verify the symbol is correct and try again. ' +
        'Data sources: Finnhub (primary) → Yahoo Finance (backup).'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      analyzeStock();
    }
  };

  // Set up real-time data updates for the current symbol
  const setupRealTimeUpdates = async (symbol: string) => {
    // Start the real-time service if not already running
    if (!realTimeDataService.getStats().isActive) {
      realTimeDataService.start();
    }

    if (currentSymbol) {
      try {
        // Attempting to unsubscribe from old symbol
        realTimeDataService.unsubscribeFromSymbol(currentSymbol);
        realTimeTechnicalService.unsubscribeFromSymbol(currentSymbol, currentSymbol);
      } catch (e) {
        console.warn(`Could not unsubscribe from ${currentSymbol}. It might have already been cleaned up.`);
      }
    }
  
    // Subscribe to new symbol
    const unsubscribe = realTimeDataService.subscribe(symbol, (update: RealTimeUpdate) => {
      // Update the stock info with new real-time data
      setStockInfo(prevInfo => ({
        ...prevInfo!,
        current_price: update.data.current_price,
        // Keep other info unchanged
      }));
      
      // Update real-time status indicators
      setIsRealTimeLive(true);
      setLastUpdate(update.timestamp);
      setUpdateSource(update.source);
      
      // Add visual feedback for data update
      const stockPriceElement = document.querySelector('.stock-price');
      if (stockPriceElement) {
        stockPriceElement.classList.add('data-updated');
        setTimeout(() => {
          stockPriceElement.classList.remove('data-updated');
        }, 1000);
      }
    });

    // Subscribe to real-time technical indicators (OPTIMIZED: reuses data, minimal API calls)
    try {
      const unsubscribeTechnical = await realTimeTechnicalService.subscribeToTechnicalUpdates(
        symbol, 
        (technicalData: RealTimeTechnicalData, alerts: TechnicalAlerts) => {
          // Update technical data state
          setRealTimeTechnical(technicalData);
          setTechnicalAlerts(alerts);
        }
      );
      
      // Return combined unsubscribe function
      return () => {
        unsubscribe();
        unsubscribeTechnical();
      };
    } catch (error) {
      console.warn('Failed to subscribe to real-time updates (non-critical)', error);
      setIsRealTimeLive(false);
      return unsubscribe; // Return basic unsubscribe if technical fails
    }
  };

  // Async news loading function (non-blocking)
  const loadNewsAsync = async (symbol: string) => {
    try {
      const newsData = await newsService.getStockNews(symbol);
      setNews(newsData.news || []);
    } catch (newsError) {
      console.warn('Background news fetch failed:', newsError);
      setNews([]);
    }
  };

  const changePeriod = async (period: string) => {
    setCurrentPeriod(period);
    if (currentSymbol) {
      try {
        setLoading(true);
        
        // Re-fetch chart data with new period
        const chartDataData = await stockDataService.getChartData(currentSymbol, period);
        
        if (!chartDataData || chartDataData.data.length === 0) {
          throw new Error('No chart data available for this period');
        }
        
        setChartData(chartDataData);
      } catch (error) {
        console.error('Error updating chart:', error);
        setError(`Unable to fetch chart data for ${period} period. Please try a different timeframe.`);
      } finally {
        setLoading(false);
      }
    }
  };

  // Auto-load QQQ on component mount
  useEffect(() => {
    setStockSymbol('QQQ');
    
    // Add a slight delay and better error handling for startup
    const autoLoad = async () => {
      try {
        setLoading(true);
        await analyzeStock('QQQ');
      } catch (error) {
        console.warn('Auto-load failed, continuing with empty state:', error);
        setError('');
        setLoading(false);
        // Don't show error on startup - let users manually trigger analysis
      }
    };

    const timer = setTimeout(autoLoad, 1000); // Increased delay for better reliability
    
    return () => clearTimeout(timer);
  }, []);

  const calculatePriceChange = () => {
    if (!stockInfo) return { change: 0, changePercent: 0 };
    const change = stockInfo.current_price - stockInfo.previous_close;
    const changePercent = (change / stockInfo.previous_close) * 100;
    return { change, changePercent };
  };

  const { change, changePercent } = calculatePriceChange();

  return (
    <ErrorBoundary>
      <div className="container">
      <div className="header">
        <h1>Stock Analysis & Recommendation System</h1>
        <p>Get AI-powered insights and recommendations for your investment decisions</p>
      </div>

      <div className="search-section">
        <SmartStockSearch 
          onSearch={searchStock}
          currentSymbol={currentSymbol}
          loading={loading}
        />
        <div className="popular-stocks" style={{ marginTop: '15px' }}>
          <span style={{ marginRight: '10px', fontWeight: 'bold' }}>Popular:</span>
          {popularStocks.map(stock => (
            <StockChip key={stock} stock={stock} onClick={searchStock} />
          ))}
        </div>
      </div>

      {loading && (
        <div className="loading">
          <div>Loading stock analysis...</div>
        </div>
      )}

      <ErrorMessage 
        error={error}
        symbol={currentSymbol}
        onRetry={() => analyzeStock(currentSymbol)}
        onClear={() => setError('')}
      />

      {stockInfo && recommendation && !loading && (
        <div className="main-content">
          <div className="left-panel">
            {/* Stock Header */}
            <div className="card">
              <div className="stock-header">
                <div className="stock-info">
                  <h2>{stockInfo.symbol} - {stockInfo.name}</h2>
                  <PriceDisplay stockInfo={stockInfo} change={change} changePercent={changePercent} />
                  {/* Real-time indicator */}
                  {isRealTimeLive && (
                    <div className="realtime-indicator">
                      <div className="realtime-dot"></div>
                      <span className="realtime-status live">
                        Live • <span className={`data-source-badge ${updateSource?.toLowerCase() || 'websocket'}`}>
                          {updateSource || 'WebSocket'}
                        </span> • {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Chart Section */}
              <div className="card">
                <h3>📊 Stock Chart</h3>
                <div className="chart-container">
                  <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {['1d', '5d', '1m', '3m', '6m', '1y', '2y', '5y', '10y', 'ytd', 'max'].map((period) => (
                        <button
                          key={period}
                          onClick={() => changePeriod(period)}
                          className="period-button"
                          style={{
                            padding: '8px 12px',
                            fontSize: '12px',
                            border: '1px solid #e0e0e0',
                            background: currentPeriod === period ? '#667eea' : 'white',
                            color: currentPeriod === period ? 'white' : '#333',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                          }}
                        >
                          {period.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Chart Mode:</span>
                      <button
                        onClick={() => setUseAdvancedChart(!useAdvancedChart)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          border: '1px solid #e0e0e0',
                          background: useAdvancedChart ? '#667eea' : 'white',
                          color: useAdvancedChart ? 'white' : '#333',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.3s'
                        }}
                      >
                        {useAdvancedChart ? '📊 Advanced' : '📈 Basic'}
                      </button>
                    </div>
                  </div>
                  
                  {/* Enhanced Chart Configuration - Task 2.5 Implementation */}
                  <ChartSelector
                    onChartTypeChange={handleChartTypeChange}
                    onLayoutChange={handleLayoutChange}
                    onIndicatorToggle={handleIndicatorToggle}
                    currentChartType={chartType}
                    currentLayout={dashboardLayout}
                    enabledIndicators={enabledIndicators}
                    isMobile={isMobileView}
                  />
                  
                  {/* Enhanced Chart Rendering - Task 2.5 Implementation */}
                  {chartData ? (
                    <div style={{ marginTop: '16px' }}>
                      <UnifiedStockChart 
                        chartData={chartData} 
                        height={isMobileView ? 400 : 500} 
                        chartType={chartType === 'basic' ? 'line' : 'candlestick'}
                        showVolume={true}
                        showTechnicalIndicators={true}
                        enabledIndicators={enabledIndicators}
                        onIndicatorToggle={handleIndicatorToggle}
                      />
                    </div>
                  ) : (
                    <div style={{ 
                      height: isMobileView ? '300px' : '400px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      background: '#f5f5f5', 
                      borderRadius: '10px',
                      marginTop: '16px'
                    }}>
                      <div style={{ textAlign: 'center', color: '#666' }}>
                        <p>📊 {chartType === 'interactive' ? 'Interactive chart with drawing tools' : 
                            chartType === 'advanced' ? 'Advanced candlestick chart' : 
                            'Basic line chart'} will appear here</p>
                        <small>Chart data loading...</small>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Analysis Section */}
            <div className="card">
              <h3>💡 Why This Recommendation?</h3>
              <ul className="reasoning-list">
                {recommendation.reasoning.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}
              </ul>
              
              <div className="indicators-section">
                <h4>📊 Key Indicators</h4>
                <div className="indicators-grid">
                  {(() => {
                    // Get explanation for each indicator
                    const getIndicatorExplanation = (indicatorName: string) => {
                      const explanations: Record<string, string> = {
                        'RSI': 'Relative Strength Index (0-100): Measures if a stock is overbought (>70) or oversold (<30). Values between 30-70 suggest balanced momentum.',
                        'Moving Average': 'Simple Moving Average: The average price over a specific period. When current price is above SMA, it suggests upward momentum.',
                        'Price Momentum': 'Rate of price change over time. Positive momentum suggests continued upward movement.',
                        'Market Cap': 'Company size classification (Large/Mid/Small cap) affects stability and risk profile.',
                        'P/E Ratio': 'Price-to-Earnings ratio shows if stock is fairly valued compared to earnings.',
                        '52-Week Position': 'Current price position within the 52-week trading range.',
                        'Volume': 'Trading Volume: Number of shares traded. High volume with price movement confirms the trend strength.',
                        'MACD': 'Moving Average Convergence Divergence: Shows the relationship between two moving averages.',
                        'Bollinger Bands': 'Price channels based on standard deviation. Shows volatility and potential support/resistance levels.',
                        'Market Regime': 'Current market classification based on trend analysis and volatility. BULL (strong uptrend), BEAR (strong downtrend), SIDEWAYS (consolidation), VOLATILE (high uncertainty).',
                        'Sharpe Ratio': 'Risk-adjusted return measure. Values >1 indicate good risk-adjusted performance, >2 excellent, <0 poor. Measures excess return per unit of risk.',
                        'Max Drawdown': 'Maximum potential loss from peak to trough. Lower values indicate better downside protection. Represents worst-case scenario risk.',
                        'Sector Momentum': 'Overall momentum strength across related indicators. Higher percentages indicate stronger directional momentum in the stock.'
                      };
                      
                      return explanations[indicatorName] || 'Technical indicator used in stock analysis to help determine buy/sell signals.';
                    };

                    const allIndicators = [];

                    // Add existing technical indicators
                    if (Array.isArray(recommendation.indicators)) {
                      allIndicators.push(...recommendation.indicators.map((indicator, index) => (
                        <div key={index} className="indicator-item" style={{ borderLeft: `4px solid ${indicator.color === 'green' ? '#4CAF50' : indicator.color === 'red' ? '#f44336' : '#ff9800'}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                            <strong>{indicator.name}</strong>
                            <InfoTooltip 
                              title={indicator.name}
                              content={getIndicatorExplanation(indicator.name)}
                            />
                          </div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#667eea', marginBottom: '3px' }}>
                            {indicator.value}
                          </div>
                          <div style={{ 
                            fontSize: '0.9rem', 
                            color: indicator.color === 'green' ? '#4CAF50' : indicator.color === 'red' ? '#f44336' : '#ff9800',
                            fontWeight: '500'
                          }}>
                            {indicator.status}
                          </div>
                        </div>
                      )));
                    }

                    // Add enhanced metrics as additional indicators
                    const enhancedMetrics = [
                      // Market Regime
                      {
                        name: 'Market Regime',
                        value: recommendation.market_regime,
                        status: recommendation.market_regime === 'BULL' ? 'Strong Uptrend Market' :
                               recommendation.market_regime === 'BEAR' ? 'Strong Downtrend Market' :
                               recommendation.market_regime === 'VOLATILE' ? 'High Volatility Market' : 'Sideways Market',
                        color: recommendation.market_regime === 'BULL' ? 'green' :
                              recommendation.market_regime === 'BEAR' ? 'red' :
                              recommendation.market_regime === 'VOLATILE' ? 'orange' : 'blue'
                      },
                      // Sharpe Ratio
                      {
                        name: 'Sharpe Ratio',
                        value: recommendation.sharpe_ratio.toFixed(2),
                        status: recommendation.sharpe_ratio > 1 ? 'Excellent Risk-Adjusted Returns' :
                               recommendation.sharpe_ratio > 0 ? 'Good Risk-Adjusted Performance' : 'Poor Risk-Adjusted Returns',
                        color: recommendation.sharpe_ratio > 1 ? 'green' :
                              recommendation.sharpe_ratio > 0 ? 'orange' : 'red'
                      },
                      // Max Drawdown
                      {
                        name: 'Max Drawdown',
                        value: `${recommendation.max_drawdown.toFixed(1)}%`,
                        status: recommendation.max_drawdown < 10 ? 'Low Downside Risk' :
                               recommendation.max_drawdown < 20 ? 'Moderate Downside Risk' : 'High Downside Risk',
                        color: recommendation.max_drawdown < 10 ? 'green' :
                              recommendation.max_drawdown < 20 ? 'orange' : 'red'
                      },
                      // Sector Momentum
                      {
                        name: 'Sector Momentum',
                        value: `${(recommendation.sector_momentum * 100).toFixed(0)}%`,
                        status: recommendation.sector_momentum > 0.6 ? 'Strong Directional Momentum' :
                               recommendation.sector_momentum > 0.4 ? 'Moderate Momentum' : 'Weak Momentum',
                        color: recommendation.sector_momentum > 0.6 ? 'green' :
                              recommendation.sector_momentum > 0.4 ? 'orange' : 'red'
                      }
                    ];

                    allIndicators.push(...enhancedMetrics.map((indicator, index) => (
                      <div key={`enhanced-${index}`} className="indicator-item" style={{ borderLeft: `4px solid ${indicator.color === 'green' ? '#4CAF50' : indicator.color === 'red' ? '#f44336' : indicator.color === 'blue' ? '#2196F3' : '#ff9800'}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                          <strong>{indicator.name}</strong>
                          <InfoTooltip 
                            title={indicator.name}
                            content={getIndicatorExplanation(indicator.name)}
                          />
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#667eea', marginBottom: '3px' }}>
                          {indicator.value}
                        </div>
                        <div style={{ 
                          fontSize: '0.9rem', 
                          color: indicator.color === 'green' ? '#4CAF50' : indicator.color === 'red' ? '#f44336' : indicator.color === 'blue' ? '#2196F3' : '#ff9800',
                          fontWeight: '500'
                        }}>
                          {indicator.status}
                        </div>
                      </div>
                    )));

                    return allIndicators;
                  })()}
                </div>
              </div>
              
              <div className="risk-assessment">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                  <strong>⚠️ Risk Level:</strong>
                  <span className={`risk-level ${recommendation.risk_level.toLowerCase()}`}>
                    {recommendation.risk_level.toUpperCase()}
                  </span>
                  <InfoTooltip 
                    title="Risk Level Explanation"
                    content={`${recommendation.risk_level.toUpperCase()} RISK: ${
                      recommendation.risk_level.toLowerCase() === 'low' 
                        ? 'Conservative investment with stable returns and minimal volatility. Suitable for risk-averse investors.'
                        : recommendation.risk_level.toLowerCase() === 'medium'
                        ? 'Moderate risk with balanced potential for returns and volatility. Good for investors with moderate risk tolerance.'
                        : 'High volatility and potential for significant gains or losses. Only suitable for risk-tolerant investors.'
                    }`}
                  />
                </div>
                <div>
                  <small>Consider your risk tolerance before investing</small>
                </div>
              </div>


            </div>

            {/* Mobile News Section - appears after analysis on mobile */}
            <div className="card mobile-news-section">
              <h3>📰 Latest News</h3>
              <div>
                {loading ? (
                  <div className="loading">Loading real financial news...</div>
                ) : news.length > 0 ? (
                  news.slice(0, 5).map((item, index) => (
                    <div key={index} className="news-item" style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                      <h4 style={{ fontSize: '14px', marginBottom: '5px' }}>
                        <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: '#333', textDecoration: 'none' }}>
                          {item.headline}
                        </a>
                      </h4>
                      <p style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>{item.summary}</p>
                      <small style={{ color: '#999' }}>
                        {item.source} - {new Date(item.published).toLocaleDateString()}
                      </small>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    <p>📊 Real-time financial news unavailable</p>
                    <small>News feeds may be temporarily unavailable</small>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Stock Details */}
            <div className="card">
              <h3>📈 Stock Details</h3>
              <div className="stock-details-grid">
                <div className="detail-item">
                  <strong>Previous Close:</strong> ${stockInfo.previous_close.toFixed(2)}
                </div>
                <div className="detail-item">
                  <strong>Day Change:</strong> 
                  <span className={change >= 0 ? 'positive' : 'negative'}>
                    {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
              
              {/* Technical Indicators Chart */}
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
                  📊 Technical Indicators Chart
                  <InfoTooltip 
                    title="Technical Indicators"
                    content="Interactive charts showing key technical indicators like Simple Moving Averages (SMA) and Relative Strength Index (RSI). Use the controls to switch between different indicators and time periods."
                  />
                </h4>
                <UnifiedStockChart 
                  chartData={chartData} 
                  height={300} 
                  chartType="line"
                  showVolume={false}
                  showTechnicalIndicators={true}
                  enabledIndicators={new Set(['sma_20', 'sma_50', 'rsi'])}
                />
              </div>
            </div>

            {/* ML Pattern Recognition Analysis */}
            <div className="card">
              <h3 style={{ display: 'flex', alignItems: 'center' }}>
                🤖 AI Pattern Analysis
                <InfoTooltip 
                  title="Machine Learning Pattern Recognition"
                  content="Advanced AI-powered analysis including chart pattern detection, market sentiment scoring, ensemble predictions from multiple indicators, and historical pattern matching."
                />
              </h3>

              {/* Chart Patterns Detected */}
              {patterns && patterns.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4>📊 Detected Chart Patterns</h4>
                  <div className="patterns-grid" style={{ display: 'grid', gap: '10px' }}>
                    {patterns.map((pattern, index) => (
                      <div key={index} className="pattern-item" style={{ 
                        padding: '12px', 
                        border: '1px solid #e0e0e0', 
                        borderRadius: '8px',
                        borderLeft: `4px solid ${pattern.confidence > 0.7 ? '#4CAF50' : pattern.confidence > 0.5 ? '#ff9800' : '#f44336'}`
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <strong>{pattern.pattern}</strong>
                          <span style={{ 
                            padding: '2px 8px', 
                            borderRadius: '12px', 
                            fontSize: '12px', 
                            backgroundColor: pattern.confidence > 0.7 ? '#e8f5e8' : pattern.confidence > 0.5 ? '#fff3e0' : '#ffebee',
                            color: pattern.confidence > 0.7 ? '#2e7d32' : pattern.confidence > 0.5 ? '#f57c00' : '#c62828'
                          }}>
                            {(pattern.confidence * 100).toFixed(0)}% confidence
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                          {pattern.description}
                        </div>
                        <div style={{ fontSize: '12px' }}>
                          <strong>Signals:</strong> {pattern.signals.join(', ')}
                        </div>
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          Timeframe: {pattern.timeframe}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Market Sentiment Analysis */}
              {sentiment && (
                <div style={{ marginBottom: '20px' }}>
                  <h4>💭 Market Sentiment Analysis</h4>
                  <div style={{ 
                    padding: '15px', 
                    border: '1px solid #e0e0e0', 
                    borderRadius: '8px',
                    borderLeft: `4px solid ${sentiment.score > 0.2 ? '#4CAF50' : sentiment.score < -0.2 ? '#f44336' : '#ff9800'}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <strong>Overall Sentiment: {sentiment.overall.charAt(0).toUpperCase() + sentiment.overall.slice(1)}</strong>
                      <span style={{ 
                        padding: '4px 12px', 
                        borderRadius: '16px', 
                        fontSize: '14px', 
                        fontWeight: 'bold',
                        backgroundColor: sentiment.score > 0.2 ? '#e8f5e8' : sentiment.score < -0.2 ? '#ffebee' : '#fff3e0',
                        color: sentiment.score > 0.2 ? '#2e7d32' : sentiment.score < -0.2 ? '#c62828' : '#f57c00'
                      }}>
                        {sentiment.score > 0 ? '+' : ''}{(sentiment.score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                      <strong>Strength:</strong> {sentiment.strength} • <strong>Factors:</strong> {sentiment.factors.map(f => f.factor).join(', ')}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px', fontSize: '12px' }}>
                      {sentiment.factors.slice(0, 4).map((factor, index) => (
                        <div key={index}>
                          <strong>{factor.factor}:</strong> {(factor.impact * 100).toFixed(1)}%
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Ensemble Prediction */}
              {ensemblePrediction && (
                <div style={{ marginBottom: '20px' }}>
                  <h4>🎯 AI Ensemble Prediction</h4>
                  <div style={{ 
                    padding: '15px', 
                    border: '1px solid #e0e0e0', 
                    borderRadius: '8px',
                    borderLeft: `4px solid ${ensemblePrediction.direction === 'up' ? '#4CAF50' : ensemblePrediction.direction === 'down' ? '#f44336' : '#ff9800'}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <strong>Prediction: {ensemblePrediction.direction.charAt(0).toUpperCase() + ensemblePrediction.direction.slice(1)}</strong>
                      <span style={{ 
                        padding: '4px 12px', 
                        borderRadius: '16px', 
                        fontSize: '14px', 
                        fontWeight: 'bold',
                        backgroundColor: ensemblePrediction.direction === 'up' ? '#e8f5e8' : ensemblePrediction.direction === 'down' ? '#ffebee' : '#fff3e0',
                        color: ensemblePrediction.direction === 'up' ? '#2e7d32' : ensemblePrediction.direction === 'down' ? '#c62828' : '#f57c00'
                      }}>
                        {(ensemblePrediction.confidence * 100).toFixed(1)}% confidence
                      </span>
                    </div>
                    {ensemblePrediction.targetPrice && (
                      <div style={{ fontSize: '13px', marginBottom: '8px' }}>
                        <strong>Target Price:</strong> ${ensemblePrediction.targetPrice.toFixed(2)}
                        {ensemblePrediction.stopLoss && (
                          <span> • <strong>Stop Loss:</strong> ${ensemblePrediction.stopLoss.toFixed(2)}</span>
                        )}
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      <strong>Based on:</strong> {ensemblePrediction.signals.map(s => s.signal).join(', ')}
                    </div>
                  </div>
                </div>
              )}

              {/* Historical Pattern Matches */}
              {historicalMatches && historicalMatches.length > 0 && (
                <div>
                  <h4>🔍 Historical Pattern Matches</h4>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>
                    Similar patterns found in historical data with their outcomes:
                  </div>
                  <div className="historical-matches" style={{ display: 'grid', gap: '8px' }}>
                    {historicalMatches.slice(0, 3).map((match, index) => (
                      <div key={index} style={{ 
                        padding: '10px', 
                        border: '1px solid #e0e0e0', 
                        borderRadius: '6px',
                        fontSize: '12px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <strong>Similarity: {(match.similarity * 100).toFixed(1)}%</strong>
                          <span style={{ 
                            color: match.outcome === 'bullish' ? '#4CAF50' : match.outcome === 'bearish' ? '#f44336' : '#ff9800',
                            fontWeight: 'bold'
                          }}>
                            {match.outcome === 'bullish' ? '↗' : match.outcome === 'bearish' ? '↘' : '→'} {Math.abs(match.priceChange).toFixed(1)}%
                          </span>
                        </div>
                        <div style={{ color: '#666' }}>
                          Period: {match.period} • Confidence: {(match.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No ML Data Available */}
              {(!patterns || patterns.length === 0) && !sentiment && !ensemblePrediction && (!historicalMatches || historicalMatches.length === 0) && (
                <div style={{ 
                  padding: '20px', 
                  textAlign: 'center', 
                  color: '#666',
                  border: '1px dashed #ccc',
                  borderRadius: '8px'
                }}>
                  <p>🤖 ML analysis will appear here</p>
                  <small>AI pattern recognition requires sufficient historical data</small>
                </div>
              )}
            </div>

            {/* Risk Analytics Framework */}
            <div className="card">
              <h3 style={{ display: 'flex', alignItems: 'center' }}>
                ⚠️ Risk Analytics
                <InfoTooltip 
                  title="Risk Analytics Framework"
                  content="Comprehensive risk assessment including Value at Risk (VaR), market correlations, beta analysis, risk metrics, and sector comparisons to help evaluate investment risk profile."
                />
              </h3>

              {/* Value at Risk Analysis */}
              {varResult && (
                <div style={{ marginBottom: '20px' }}>
                  <h4>📊 Value at Risk (VaR)</h4>
                  <div style={{ 
                    padding: '15px', 
                    border: '1px solid #e0e0e0', 
                    borderRadius: '8px',
                    borderLeft: `4px solid ${(varResult.dailyVaR * 100) > 5 ? '#f44336' : (varResult.dailyVaR * 100) > 2 ? '#ff9800' : '#4CAF50'}`
                  }}>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>
                      Maximum potential loss at {(varResult.confidenceLevel * 100).toFixed(0)}% confidence level:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: (varResult.dailyVaR * 100) > 5 ? '#f44336' : (varResult.dailyVaR * 100) > 2 ? '#ff9800' : '#4CAF50' }}>
                          {(varResult.dailyVaR * 100).toFixed(2)}%
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Daily VaR</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: (varResult.weeklyVaR * 100) > 12 ? '#f44336' : (varResult.weeklyVaR * 100) > 7 ? '#ff9800' : '#4CAF50' }}>
                          {(varResult.weeklyVaR * 100).toFixed(2)}%
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Weekly VaR</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: (varResult.monthlyVaR * 100) > 20 ? '#f44336' : (varResult.monthlyVaR * 100) > 15 ? '#ff9800' : '#4CAF50' }}>
                          {(varResult.monthlyVaR * 100).toFixed(2)}%
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Monthly VaR</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}>
                      <strong>Risk Level:</strong> {(varResult.dailyVaR * 100) > 5 ? 'High Risk' : (varResult.dailyVaR * 100) > 2 ? 'Moderate Risk' : 'Low Risk'}
                    </div>
                  </div>
                </div>
              )}

              {/* Market Correlation Analysis */}
              {correlationAnalysis && (
                <div style={{ marginBottom: '20px' }}>
                  <h4>🔗 Market Correlation Analysis</h4>
                  <div style={{ 
                    padding: '15px', 
                    border: '1px solid #e0e0e0', 
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>
                      Correlation with major market indices:
                    </div>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {correlationAnalysis.marketIndices.map((indexData, idx) => (
                        <div key={idx} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: '8px',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '4px'
                        }}>
                          <span style={{ fontWeight: '500' }}>{indexData.index}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ 
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              backgroundColor: indexData.strength === 'strong' ? '#e3f2fd' : indexData.strength === 'moderate' ? '#fff3e0' : '#f3e5f5',
                              color: indexData.strength === 'strong' ? '#1976d2' : indexData.strength === 'moderate' ? '#f57c00' : '#7b1fa2'
                            }}>
                              {indexData.strength}
                            </span>
                            <span style={{ 
                              fontSize: '14px',
                              fontWeight: 'bold',
                              color: indexData.correlation > 0.5 ? '#4CAF50' : indexData.correlation < -0.5 ? '#f44336' : '#ff9800'
                            }}>
                              {indexData.correlation > 0 ? '+' : ''}{(indexData.correlation * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Beta Analysis */}
              {betaAnalysis && (
                <div style={{ marginBottom: '20px' }}>
                  <h4>📈 Beta Analysis</h4>
                  <div style={{ 
                    padding: '15px', 
                    border: '1px solid #e0e0e0', 
                    borderRadius: '8px',
                    borderLeft: `4px solid ${betaAnalysis.beta > 1.5 ? '#f44336' : betaAnalysis.beta < 0.5 ? '#2196F3' : '#4CAF50'}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <strong>Beta Coefficient</strong>
                      <span style={{ 
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: betaAnalysis.beta > 1.5 ? '#f44336' : betaAnalysis.beta < 0.5 ? '#2196F3' : '#4CAF50'
                      }}>
                        {betaAnalysis.beta.toFixed(2)}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                      <strong>Volatility:</strong> {betaAnalysis.interpretation.volatility} • 
                      <strong> Sensitivity:</strong> {betaAnalysis.interpretation.sensitivity} • 
                      <strong> Market Risk:</strong> {betaAnalysis.interpretation.marketRisk}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', fontSize: '12px' }}>
                      <div>
                        <strong>Alpha:</strong> {betaAnalysis.alpha.toFixed(3)}
                      </div>
                      <div>
                        <strong>R-Squared:</strong> {(betaAnalysis.rSquared * 100).toFixed(1)}%
                      </div>
                      <div>
                        <strong>Benchmark:</strong> {betaAnalysis.benchmarkIndex}
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}>
                      Beta measures systematic risk - how much the stock moves relative to the market
                    </div>
                  </div>
                </div>
              )}

              {/* Risk Metrics */}
              {riskMetrics && (
                <div style={{ marginBottom: '20px' }}>
                  <h4>📋 Risk Metrics Dashboard</h4>
                  <div style={{ 
                    padding: '15px', 
                    border: '1px solid #e0e0e0', 
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                      <div style={{ textAlign: 'center', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: riskMetrics.sharpeRatio > 1 ? '#4CAF50' : riskMetrics.sharpeRatio > 0 ? '#ff9800' : '#f44336' }}>
                          {riskMetrics.sharpeRatio.toFixed(2)}
                        </div>
                        <div style={{ fontSize: '11px', color: '#666' }}>Sharpe Ratio</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#667eea' }}>
                          {(riskMetrics.volatility * 100).toFixed(1)}%
                        </div>
                        <div style={{ fontSize: '11px', color: '#666' }}>Volatility</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: riskMetrics.maxDrawdown < 10 ? '#4CAF50' : riskMetrics.maxDrawdown < 20 ? '#ff9800' : '#f44336' }}>
                          {riskMetrics.maxDrawdown.toFixed(1)}%
                        </div>
                        <div style={{ fontSize: '11px', color: '#666' }}>Max Drawdown</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: riskMetrics.calmarRatio > 1 ? '#4CAF50' : riskMetrics.calmarRatio > 0.5 ? '#ff9800' : '#f44336' }}>
                          {riskMetrics.calmarRatio.toFixed(2)}
                        </div>
                        <div style={{ fontSize: '11px', color: '#666' }}>Calmar Ratio</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: riskMetrics.sortinoRatio > 1 ? '#4CAF50' : riskMetrics.sortinoRatio > 0 ? '#ff9800' : '#f44336' }}>
                          {riskMetrics.sortinoRatio.toFixed(2)}
                        </div>
                        <div style={{ fontSize: '11px', color: '#666' }}>Sortino Ratio</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}>
                      <strong>Risk Assessment:</strong> {
                        riskMetrics.sharpeRatio > 1 && riskMetrics.maxDrawdown < 15 ? 'Low Risk Profile' :
                        riskMetrics.sharpeRatio > 0.5 && riskMetrics.maxDrawdown < 25 ? 'Moderate Risk Profile' : 'High Risk Profile'
                      }
                    </div>
                  </div>
                </div>
              )}

              {/* Sector Comparison */}
              {sectorComparison && (
                <div style={{ marginBottom: '20px' }}>
                  <h4>🏭 Sector Comparison</h4>
                  <div style={{ 
                    padding: '15px', 
                    border: '1px solid #e0e0e0', 
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>
                      Performance vs sector averages:
                    </div>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '8px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '4px'
                      }}>
                        <span style={{ fontWeight: '500' }}>Sector</span>
                        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                          {sectorComparison.currentSector}
                        </span>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '8px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '4px'
                      }}>
                        <span style={{ fontWeight: '500' }}>Ranking</span>
                        <span style={{ 
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          backgroundColor: sectorComparison.stockVsSector.ranking === 'top_quartile' ? '#e8f5e8' : 
                                          sectorComparison.stockVsSector.ranking === 'above_average' ? '#e3f2fd' : 
                                          sectorComparison.stockVsSector.ranking === 'below_average' ? '#fff3e0' : '#ffebee',
                          color: sectorComparison.stockVsSector.ranking === 'top_quartile' ? '#2e7d32' : 
                                 sectorComparison.stockVsSector.ranking === 'above_average' ? '#1976d2' : 
                                 sectorComparison.stockVsSector.ranking === 'below_average' ? '#f57c00' : '#c62828'
                        }}>
                          {sectorComparison.stockVsSector.ranking.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* No Risk Data Available */}
              {!varResult && !correlationAnalysis && !betaAnalysis && !riskMetrics && !sectorComparison && (
                <div style={{ 
                  padding: '20px', 
                  textAlign: 'center', 
                  color: '#666',
                  border: '1px dashed #ccc',
                  borderRadius: '8px'
                }}>
                  <p>⚠️ Risk analytics will appear here</p>
                  <small>Risk analysis requires sufficient historical data and market comparisons</small>
                </div>
              )}
            </div>

            {/* Real-Time Technical Indicators */}
            <div className="card">
              <h3 style={{ display: 'flex', alignItems: 'center' }}>
                📊 Real-Time Technical Indicators
                <InfoTooltip 
                  title="Real-Time Technical Analysis"
                  content="Live technical indicator updates that automatically refresh with new price data. Optimized for minimal API usage through smart caching and batch processing. Shows current values and alerts for RSI, MACD, Bollinger Bands, and Stochastic indicators."
                />
              </h3>

              {realTimeTechnical ? (
                <div style={{ padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                  {/* Real-Time Price Info */}
                  <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold' }}>Live Price:</span>
                      <span style={{ 
                        fontSize: '16px', 
                        fontWeight: 'bold',
                        color: realTimeTechnical.realtimeValues.priceChange >= 0 ? '#4CAF50' : '#f44336'
                      }}>
                        ${realTimeTechnical.realtimeValues.currentPrice.toFixed(2)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      <span>Change:</span>
                      <span style={{ 
                        color: realTimeTechnical.realtimeValues.priceChange >= 0 ? '#4CAF50' : '#f44336'
                      }}>
                        {realTimeTechnical.realtimeValues.priceChange >= 0 ? '+' : ''}
                        {realTimeTechnical.realtimeValues.priceChange.toFixed(2)} 
                        ({realTimeTechnical.realtimeValues.priceChangePercent >= 0 ? '+' : ''}
                        {realTimeTechnical.realtimeValues.priceChangePercent.toFixed(2)}%)
                      </span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
                      Last update: {new Date(realTimeTechnical.lastUpdate).toLocaleTimeString()}
                    </div>
                  </div>

                  {/* Live Technical Indicators Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '15px' }}>
                    {/* RSI */}
                    <div style={{ 
                      padding: '8px', 
                      backgroundColor: realTimeTechnical.indicatorUpdates.rsi !== null ? '#f8f9fa' : '#f5f5f5', 
                      borderRadius: '4px',
                      border: technicalAlerts?.rsi_oversold || technicalAlerts?.rsi_overbought ? '2px solid #ff9800' : '1px solid #e0e0e0'
                    }}>
                      <div style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>RSI</div>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: 'bold',
                        color: realTimeTechnical.indicatorUpdates.rsi !== null ? 
                          (realTimeTechnical.indicatorUpdates.rsi! > 70 ? '#f44336' : 
                           realTimeTechnical.indicatorUpdates.rsi! < 30 ? '#4CAF50' : '#667eea') : '#999'
                      }}>
                        {realTimeTechnical.indicatorUpdates.rsi?.toFixed(1) || 'N/A'}
                      </div>
                      {(technicalAlerts?.rsi_oversold || technicalAlerts?.rsi_overbought) && (
                        <div style={{ fontSize: '9px', color: '#ff9800', fontWeight: 'bold' }}>
                          {technicalAlerts.rsi_oversold ? 'OVERSOLD' : 'OVERBOUGHT'}
                        </div>
                      )}
                    </div>

                    {/* MACD */}
                    <div style={{ 
                      padding: '8px', 
                      backgroundColor: realTimeTechnical.indicatorUpdates.macd_line !== null ? '#f8f9fa' : '#f5f5f5', 
                      borderRadius: '4px',
                      border: technicalAlerts?.macd_bullish_crossover || technicalAlerts?.macd_bearish_crossover ? '2px solid #4CAF50' : '1px solid #e0e0e0'
                    }}>
                      <div style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>MACD</div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#667eea' }}>
                        {realTimeTechnical.indicatorUpdates.macd_line?.toFixed(3) || 'N/A'}
                      </div>
                      {(technicalAlerts?.macd_bullish_crossover || technicalAlerts?.macd_bearish_crossover) && (
                        <div style={{ fontSize: '9px', color: '#4CAF50', fontWeight: 'bold' }}>
                          {technicalAlerts.macd_bullish_crossover ? 'BULLISH' : 'BEARISH'}
                        </div>
                      )}
                    </div>

                    {/* Bollinger Bands */}
                    <div style={{ 
                      padding: '8px', 
                      backgroundColor: realTimeTechnical.indicatorUpdates.bollinger_middle !== null ? '#f8f9fa' : '#f5f5f5', 
                      borderRadius: '4px',
                      border: technicalAlerts?.bollinger_breakout_upper || technicalAlerts?.bollinger_breakout_lower ? '2px solid #f44336' : '1px solid #e0e0e0'
                    }}>
                      <div style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>Bollinger</div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#667eea' }}>
                        {realTimeTechnical.indicatorUpdates.bollinger_middle?.toFixed(2) || 'N/A'}
                      </div>
                      {(technicalAlerts?.bollinger_breakout_upper || technicalAlerts?.bollinger_breakout_lower) && (
                        <div style={{ fontSize: '9px', color: '#f44336', fontWeight: 'bold' }}>
                          {technicalAlerts.bollinger_breakout_upper ? 'BREAKOUT UP' : 'BREAKOUT DOWN'}
                        </div>
                      )}
                    </div>

                    {/* Stochastic */}
                    <div style={{ 
                      padding: '8px', 
                      backgroundColor: realTimeTechnical.indicatorUpdates.stochastic_k !== null ? '#f8f9fa' : '#f5f5f5', 
                      borderRadius: '4px',
                      border: technicalAlerts?.stochastic_oversold || technicalAlerts?.stochastic_overbought ? '2px solid #ff9800' : '1px solid #e0e0e0'
                    }}>
                      <div style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>Stochastic</div>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: 'bold',
                        color: realTimeTechnical.indicatorUpdates.stochastic_k !== null ? 
                          (realTimeTechnical.indicatorUpdates.stochastic_k! > 80 ? '#f44336' : 
                           realTimeTechnical.indicatorUpdates.stochastic_k! < 20 ? '#4CAF50' : '#667eea') : '#999'
                      }}>
                        {realTimeTechnical.indicatorUpdates.stochastic_k?.toFixed(1) || 'N/A'}
                      </div>
                      {(technicalAlerts?.stochastic_oversold || technicalAlerts?.stochastic_overbought) && (
                        <div style={{ fontSize: '9px', color: '#ff9800', fontWeight: 'bold' }}>
                          {technicalAlerts.stochastic_oversold ? 'OVERSOLD' : 'OVERBOUGHT'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Active Alerts Summary */}
                  {technicalAlerts && Object.values(technicalAlerts).some(Boolean) && (
                    <div style={{ 
                      padding: '10px', 
                      backgroundColor: '#fff3e0', 
                      border: '1px solid #ff9800', 
                      borderRadius: '6px',
                      marginBottom: '10px'
                    }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#f57c00', marginBottom: '5px' }}>
                        🚨 Active Technical Alerts
                      </div>
                      <div style={{ fontSize: '11px', color: '#e65100' }}>
                        {Object.entries(technicalAlerts)
                          .filter(([_, active]) => active)
                          .map(([alert, _]) => alert.replace('_', ' ').toUpperCase())
                          .join(' • ')}
                      </div>
                    </div>
                  )}

                  {/* Performance Stats */}
                  <div style={{ fontSize: '10px', color: '#999', textAlign: 'center', paddingTop: '8px', borderTop: '1px solid #eee' }}>
                    📊 Optimized for minimal API usage • Live updates • Smart caching enabled
                  </div>
                </div>
              ) : (
                <div style={{ 
                  padding: '20px', 
                  textAlign: 'center', 
                  color: '#666',
                  border: '1px dashed #ccc',
                  borderRadius: '8px'
                }}>
                  <p>📊 Real-time technical indicators will appear here</p>
                  <small>Live technical analysis requires active real-time data connection</small>
                </div>
              )}
            </div>
          </div>
          <div className="right-panel">
            {/* Recommendation Card */}
            <div className={`recommendation-card ${recommendation.action.toLowerCase()}`}>
              <div className="action-text">{recommendation.action}</div>
              {recommendation.action_detail && (
                <div className="action-detail" style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  {recommendation.action_detail}
                </div>
              )}
              <div className="stars">{'⭐'.repeat(recommendation.stars)}</div>
              <div className="confidence">
                Confidence: {recommendation.confidence}%
              </div>
              <div className="price-target">
                Target: ${recommendation.price_target.toFixed(2)}
              </div>
            </div>

            {/* Latest News */}
            <div className="card">
              <h3>📰 Latest News</h3>
              <div>
                {loading ? (
                  <div className="loading">Loading real financial news...</div>
                ) : news.length > 0 ? (
                  news.slice(0, 5).map((item, index) => (
                    <div key={index} className="news-item" style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                      <h4 style={{ fontSize: '14px', marginBottom: '5px' }}>
                        <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: '#333', textDecoration: 'none' }}>
                          {item.headline}
                        </a>
                      </h4>
                      <p style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>{item.summary}</p>
                      <small style={{ color: '#999' }}>
                        {item.source} - {new Date(item.published).toLocaleDateString()}
                      </small>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    <p>📊 Real-time financial news unavailable</p>
                    <small>News feeds may be temporarily unavailable</small>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
}

export default App; 