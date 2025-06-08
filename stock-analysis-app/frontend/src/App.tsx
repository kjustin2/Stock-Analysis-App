import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StockChart from './components/StockChart';
import IndicatorChart from './components/IndicatorChart';
import InfoTooltip from './components/InfoTooltip';

// Types
interface StockInfo {
  symbol: string;
  name: string;
  current_price: number;
  previous_close: number;
}

interface Recommendation {
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
  }> | Record<string, any>;
  risk_level: string;
}

interface ChartData {
  symbol: string;
  period: string;
  data: Array<{
    x: string;
    o: number;
    h: number;
    l: number;
    c: number;
    v: number;
  }>;
  data_points: number;
}

interface NewsItem {
  headline: string;
  summary: string;
  url: string;
  published: string;
  source: string;
}

// API Configuration - Update this with your deployed backend URL
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8004';

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

    try {
      const [stockInfoRes, recommendationRes, chartDataRes, newsRes] = await Promise.all([
        axios.get(`${API_BASE}/stocks/${targetSymbol}`),
        axios.get(`${API_BASE}/stocks/${targetSymbol}/recommendation`),
        axios.get(`${API_BASE}/stocks/${targetSymbol}/chart-data?period=${currentPeriod}`),
        axios.get(`${API_BASE}/stocks/${targetSymbol}/news`)
      ]);

      setStockInfo(stockInfoRes.data);
      setRecommendation(recommendationRes.data);
      setChartData(chartDataRes.data);
      // Extract news array from the nested response
      setNews(newsRes.data.news || []);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to analyze stock. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      analyzeStock();
    }
  };

  const changePeriod = (period: string) => {
    setCurrentPeriod(period);
    if (currentSymbol) {
      // Re-fetch chart data with new period
      axios.get(`${API_BASE}/stocks/${currentSymbol}/chart-data?period=${period}`)
        .then(response => setChartData(response.data))
        .catch(error => console.error('Error updating chart:', error));
    }
  };

  // Auto-load AAPL on component mount
  useEffect(() => {
    setStockSymbol('AAPL');
    setTimeout(() => {
      analyzeStock('AAPL');
    }, 500);
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
                  {Array.isArray(recommendation.indicators) ? 
                    recommendation.indicators.map((indicator, index) => {
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
                          'Bollinger Bands': 'Price channels based on standard deviation. Shows volatility and potential support/resistance levels.'
                        };
                        
                        return explanations[indicatorName] || 'Technical indicator used in stock analysis to help determine buy/sell signals.';
                      };

                      return (
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
                      );
                    })
                    :
                    // Fallback for old format (if backend returns object instead of array)
                    Object.entries(recommendation.indicators).map(([key, value]) => {
                      const indicatorName = key.replace(/_/g, ' ').toUpperCase();
                      const indicatorValue = typeof value === 'object' && value !== null && 'value' in value 
                        ? value.value 
                        : value;

                      return (
                        <div key={key} className="indicator-item">
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                            <strong>{indicatorName}</strong>
                          </div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#667eea' }}>
                            {indicatorValue}
                          </div>
                        </div>
                      );
                    })
                  }
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
                {news.length > 0 ? (
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
                  <div className="loading">Loading news...</div>
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