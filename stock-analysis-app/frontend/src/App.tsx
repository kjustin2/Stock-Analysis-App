import React, { useState, useEffect } from 'react';
import StockChart from './components/StockChart';
import IndicatorChart from './components/IndicatorChart';
import InfoTooltip from './components/InfoTooltip';

// Import services
import { stockDataService, StockInfo, ChartData } from './services/stockDataService';
import { recommendationService, Recommendation } from './services/recommendationService';
import { newsService, NewsItem } from './services/newsService';

const popularStocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX'];

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

  const searchStock = (symbol: string) => {
    setStockSymbol(symbol);
    analyzeStock(symbol);
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

    try {
      // Get stock data and chart data with improved error handling
      console.log(`🔄 Fetching real-time data for ${targetSymbol}...`);
      
      const [stockInfoData, chartDataData] = await Promise.all([
        stockDataService.getStockInfo(targetSymbol),
        stockDataService.getChartData(targetSymbol, currentPeriod)
      ]);

      // Validate that we received real data
      if (!stockInfoData || !chartDataData || chartDataData.data.length === 0) {
        throw new Error('No real-time data available for this symbol');
      }

      console.log(`✅ Successfully fetched data: Price $${stockInfoData.current_price}, ${chartDataData.data.length} chart points`);

      setStockInfo(stockInfoData);
      setChartData(chartDataData);

      // Generate recommendation based on real stock data and chart data
      const recommendationData = recommendationService.generateRecommendation(
        stockInfoData,
        chartDataData.data,
        currentPeriod
      );
      setRecommendation(recommendationData);

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

  // Async news loading function (non-blocking)
  const loadNewsAsync = async (symbol: string) => {
    try {
      console.log(`📰 Loading news for ${symbol} in background...`);
      const newsData = await newsService.getStockNews(symbol);
      setNews(newsData.news || []);
      
      if (newsData.news.length === 0) {
        console.log('ℹ️ No news available for this symbol');
      } else {
        console.log(`✅ Background news loaded: ${newsData.news.length} articles`);
      }
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
        console.log(`Updating chart to ${period} period...`);
        
        // Re-fetch chart data with new period
        const chartDataData = await stockDataService.getChartData(currentSymbol, period);
        
        if (!chartDataData || chartDataData.data.length === 0) {
          throw new Error('No chart data available for this period');
        }
        
        setChartData(chartDataData);
        console.log(`Chart updated: ${chartDataData.data.length} data points for ${period}`);
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
        console.log('🚀 Starting stock analysis application...');
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
    <div className="container">
      <div className="header">
        <h1>Stock Analysis & Recommendation System</h1>
        <p>Get AI-powered insights and recommendations for your investment decisions</p>
      </div>

      <div className="search-section">
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Enter stock symbol (e.g., AAPL, GOOGL, MSFT)"
            value={stockSymbol}
            onChange={(e) => setStockSymbol(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button className="search-btn" onClick={() => analyzeStock()}>
            Analyze Stock
          </button>
        </div>
        <div className="popular-stocks">
          <span style={{ marginRight: '10px', fontWeight: 'bold' }}>Popular:</span>
          {popularStocks.map(stock => (
            <button
              key={stock}
              className="stock-chip"
              onClick={() => searchStock(stock)}
            >
              {stock}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="loading">
          <div>Loading stock analysis...</div>
        </div>
      )}

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {stockInfo && recommendation && !loading && (
        <div className="main-content">
          <div className="left-panel">
            {/* Stock Header */}
            <div className="card">
              <div className="stock-header">
                <div className="stock-info">
                  <h2>{stockInfo.symbol} - {stockInfo.name}</h2>
                  <div className="stock-price">
                    ${stockInfo.current_price.toFixed(2)}
                    <span className={`price-change ${change >= 0 ? 'positive' : 'negative'}`}>
                      {change >= 0 ? '+' : ''}{change.toFixed(2)} ({change >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Chart Section */}
              <div className="chart-section">
                <div className="chart-controls">
                  {['1d', '1w', '1m', '3m', '6m', '1y', '5y'].map(period => (
                    <button
                      key={period}
                      className={`period-btn ${currentPeriod === period ? 'active' : ''}`}
                      onClick={() => changePeriod(period)}
                    >
                      {period.toUpperCase()}
                    </button>
                  ))}
                </div>
                {chartData ? (
                  <StockChart chartData={chartData} height={400} />
                ) : (
                  <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderRadius: '10px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <p>Loading chart data...</p>
                    </div>
                  </div>
                )}
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
                <IndicatorChart symbol={stockInfo.symbol} height={300} />
              </div>
            </div>
          </div>

          <div className="right-panel">
            {/* Recommendation Card */}
            <div className={`recommendation-card ${recommendation.action.toLowerCase()}`}>
              <div className="action-text">{recommendation.action}</div>
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
  );
}

export default App; 