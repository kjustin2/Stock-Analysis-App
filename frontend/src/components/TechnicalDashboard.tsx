import React, { useState } from 'react';
import InfoTooltip from './InfoTooltip';

// Type definitions (matching the main app)
interface RealTimeTechnicalData {
  symbol: string;
  current_price: number;
  technical_indicators: {
    rsi: { value: number; signal: string; strength: string };
    stochastic: { k: number; d: number; signal: string };
    williams_r: { value: number; signal: string };
    atr: { value: number; interpretation: string };
    momentum: { value: number; signal: string };
    price_position: { value: number; interpretation: string };
    volume_ratio: { value: number; interpretation: string };
  };
  moving_averages: {
    sma_20: number;
    sma_50: number;
    ema_12: number;
    ema_26: number;
  };
  bollinger_bands: {
    upper: number;
    middle: number;
    lower: number;
    position: string;
  };
  macd: {
    line: number;
    signal: number;
    histogram: number;
    trend: string;
  };
  last_updated: string;
}

interface VaRResult {
  dailyVaR: number;
  monthlyVaR: number;
  annualVaR: number;
  confidence: number;
  interpretation: {
    risk_level: string;
    recommendation: string;
  };
}

interface RiskMetrics {
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;
  beta: number;
  interpretation: {
    performance: string;
    risk_assessment: string;
  };
}

interface SectorComparison {
  sector: string;
  stockVsSector: {
    performance: number;
    ranking: string;
  };
  correlations: Array<{
    name: string;
    correlation: number;
  }>;
}

interface PatternResult {
  pattern: string;
  confidence: number;
  signal: string;
  description: string;
  timeframe: string;
}

interface SentimentResult {
  overall: string;
  strength: string;
  score: number;
  factors: string[];
}

interface EnsemblePrediction {
  direction: string;
  confidence: number;
  price_target: number;
  timeframe: string;
  contributing_factors: string[];
}

interface TechnicalDashboardProps {
  realTimeTechnical?: RealTimeTechnicalData | null;
  varResult?: VaRResult | null;
  riskMetrics?: RiskMetrics | null;
  sectorComparison?: SectorComparison | null;
  patterns?: PatternResult[];
  sentiment?: SentimentResult | null;
  ensemblePrediction?: EnsemblePrediction | null;
  isRealTimeLive?: boolean;
  lastUpdate?: number | null;
}

const TechnicalDashboard: React.FC<TechnicalDashboardProps> = ({
  realTimeTechnical,
  varResult,
  riskMetrics,
  sectorComparison,
  patterns = [],
  sentiment,
  ensemblePrediction,
  isRealTimeLive = false,
  lastUpdate
}) => {
  const [activeTab, setActiveTab] = useState<'indicators' | 'risk' | 'patterns' | 'prediction'>('indicators');

  const getIndicatorColor = (signal: string) => {
    switch (signal?.toLowerCase()) {
      case 'bullish':
      case 'buy':
      case 'strong_buy':
        return '#4CAF50';
      case 'bearish':
      case 'sell':
      case 'strong_sell':
        return '#f44336';
      case 'neutral':
      case 'hold':
        return '#ff9800';
      default:
        return '#757575';
    }
  };

  const getSignalIcon = (signal: string) => {
    switch (signal?.toLowerCase()) {
      case 'bullish':
      case 'buy':
      case 'strong_buy':
        return '📈';
      case 'bearish':
      case 'sell':
      case 'strong_sell':
        return '📉';
      case 'neutral':
      case 'hold':
        return '➡️';
      default:
        return '❓';
    }
  };

  const formatTimestamp = (timestamp: number | string | null) => {
    if (!timestamp) return 'N/A';
    try {
      const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
      return date.toLocaleTimeString();
    } catch {
      return 'N/A';
    }
  };

  const tabs = [
    { id: 'indicators', label: '📊 Technical', icon: '📊' },
    { id: 'risk', label: '⚠️ Risk', icon: '⚠️' },
    { id: 'patterns', label: '🔍 Patterns', icon: '🔍' },
    { id: 'prediction', label: '🎯 AI Forecast', icon: '🎯' }
  ];

  return (
    <div style={{ 
      background: 'white', 
      borderRadius: '12px', 
      padding: '20px', 
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      marginTop: '20px'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        borderBottom: '2px solid #f0f0f0',
        paddingBottom: '15px'
      }}>
        <h3 style={{ margin: 0, color: '#333', fontSize: '18px' }}>
          📊 Advanced Technical Analysis Dashboard
        </h3>
        {isRealTimeLive && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#4CAF50',
              animation: 'pulse 2s infinite'
            }}></div>
            <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>
              LIVE • {formatTimestamp(lastUpdate)}
            </span>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '5px', 
        marginBottom: '20px',
        overflowX: 'auto',
        borderBottom: '1px solid #e0e0e0'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '10px 15px',
              border: 'none',
              background: activeTab === tab.id ? '#667eea' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#666',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              transition: 'all 0.3s',
              whiteSpace: 'nowrap',
              borderBottom: activeTab === tab.id ? '2px solid #667eea' : '2px solid transparent'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ minHeight: '300px' }}>
        {/* Technical Indicators Tab */}
        {activeTab === 'indicators' && realTimeTechnical && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
              {/* RSI Card */}
              <div style={{ 
                background: '#f8f9fa', 
                padding: '15px', 
                borderRadius: '8px',
                border: `3px solid ${getIndicatorColor(realTimeTechnical.technical_indicators.rsi.signal)}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 'bold' }}>RSI</span>
                  <InfoTooltip 
                    title="Relative Strength Index"
                    content="Measures price momentum. Values above 70 suggest overbought conditions, below 30 suggest oversold."
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
                    {realTimeTechnical.technical_indicators.rsi.value.toFixed(1)}
                  </span>
                  <span style={{ 
                    fontSize: '14px', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    background: getIndicatorColor(realTimeTechnical.technical_indicators.rsi.signal),
                    color: 'white'
                  }}>
                    {getSignalIcon(realTimeTechnical.technical_indicators.rsi.signal)} {realTimeTechnical.technical_indicators.rsi.signal}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  Strength: {realTimeTechnical.technical_indicators.rsi.strength}
                </div>
              </div>

              {/* MACD Card */}
              <div style={{ 
                background: '#f8f9fa', 
                padding: '15px', 
                borderRadius: '8px',
                border: `3px solid ${getIndicatorColor(realTimeTechnical.macd.trend)}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 'bold' }}>MACD</span>
                  <InfoTooltip 
                    title="Moving Average Convergence Divergence"
                    content="Shows the relationship between two moving averages. Crossovers indicate potential trend changes."
                  />
                </div>
                <div style={{ fontSize: '12px', marginBottom: '8px' }}>
                  <div>Line: {realTimeTechnical.macd.line.toFixed(3)}</div>
                  <div>Signal: {realTimeTechnical.macd.signal.toFixed(3)}</div>
                  <div>Histogram: {realTimeTechnical.macd.histogram.toFixed(3)}</div>
                </div>
                <span style={{ 
                  fontSize: '14px', 
                  padding: '4px 8px', 
                  borderRadius: '4px',
                  background: getIndicatorColor(realTimeTechnical.macd.trend),
                  color: 'white'
                }}>
                  {getSignalIcon(realTimeTechnical.macd.trend)} {realTimeTechnical.macd.trend}
                </span>
              </div>

              {/* Bollinger Bands Card */}
              <div style={{ 
                background: '#f8f9fa', 
                padding: '15px', 
                borderRadius: '8px',
                border: `3px solid ${getIndicatorColor(realTimeTechnical.bollinger_bands.position)}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Bollinger Bands</span>
                  <InfoTooltip 
                    title="Bollinger Bands"
                    content="Price channels based on volatility. Price touching bands may indicate reversal points."
                  />
                </div>
                <div style={{ fontSize: '12px', marginBottom: '8px' }}>
                  <div>Upper: ${realTimeTechnical.bollinger_bands.upper.toFixed(2)}</div>
                  <div>Middle: ${realTimeTechnical.bollinger_bands.middle.toFixed(2)}</div>
                  <div>Lower: ${realTimeTechnical.bollinger_bands.lower.toFixed(2)}</div>
                </div>
                <span style={{ 
                  fontSize: '14px', 
                  padding: '4px 8px', 
                  borderRadius: '4px',
                  background: getIndicatorColor(realTimeTechnical.bollinger_bands.position),
                  color: 'white'
                }}>
                  {getSignalIcon(realTimeTechnical.bollinger_bands.position)} {realTimeTechnical.bollinger_bands.position}
                </span>
              </div>

              {/* Moving Averages Card */}
              <div style={{ 
                background: '#f8f9fa', 
                padding: '15px', 
                borderRadius: '8px',
                border: '3px solid #9C27B0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Moving Averages</span>
                  <InfoTooltip 
                    title="Moving Averages"
                    content="Trend-following indicators. When price is above MA, it suggests upward momentum."
                  />
                </div>
                <div style={{ fontSize: '12px' }}>
                  <div>SMA 20: ${realTimeTechnical.moving_averages.sma_20.toFixed(2)}</div>
                  <div>SMA 50: ${realTimeTechnical.moving_averages.sma_50.toFixed(2)}</div>
                  <div>EMA 12: ${realTimeTechnical.moving_averages.ema_12.toFixed(2)}</div>
                  <div>EMA 26: ${realTimeTechnical.moving_averages.ema_26.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Risk Analytics Tab */}
        {activeTab === 'risk' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
              {/* VaR Card */}
              {varResult && (
                <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '3px solid #ff5722' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Value at Risk (95%)</span>
                    <InfoTooltip 
                      title="Value at Risk"
                      content="Maximum expected loss over a specific time period at a given confidence level."
                    />
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '8px' }}>
                    <div>Daily: {(varResult.dailyVaR * 100).toFixed(2)}%</div>
                    <div>Monthly: {(varResult.monthlyVaR * 100).toFixed(2)}%</div>
                    <div>Annual: {(varResult.annualVaR * 100).toFixed(2)}%</div>
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    background: '#ff5722',
                    color: 'white'
                  }}>
                    Risk Level: {varResult.interpretation.risk_level}
                  </div>
                </div>
              )}

              {/* Risk Metrics Card */}
              {riskMetrics && (
                <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '3px solid #2196F3' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Risk Metrics</span>
                    <InfoTooltip 
                      title="Risk Metrics"
                      content="Key risk and performance measurements including Sharpe ratio, volatility, and maximum drawdown."
                    />
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '8px' }}>
                    <div>Sharpe Ratio: {riskMetrics.sharpeRatio.toFixed(2)}</div>
                    <div>Max Drawdown: {(riskMetrics.maxDrawdown * 100).toFixed(1)}%</div>
                    <div>Volatility: {(riskMetrics.volatility * 100).toFixed(1)}%</div>
                    <div>Beta: {riskMetrics.beta.toFixed(2)}</div>
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    background: '#2196F3',
                    color: 'white'
                  }}>
                    {riskMetrics.interpretation.performance}
                  </div>
                </div>
              )}

              {/* Sector Comparison Card */}
              {sectorComparison && (
                <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '3px solid #4CAF50' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Sector Analysis</span>
                    <InfoTooltip 
                      title="Sector Comparison"
                      content="How this stock performs relative to its sector and correlations with similar companies."
                    />
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '8px' }}>
                    <div>Sector: {sectorComparison.sector}</div>
                    <div>Performance vs Sector: {(sectorComparison.stockVsSector.performance * 100).toFixed(1)}%</div>
                    <div>Ranking: {sectorComparison.stockVsSector.ranking}</div>
                  </div>
                  {sectorComparison.correlations.length > 0 && (
                    <div style={{ fontSize: '11px', marginTop: '8px' }}>
                      <strong>Top Correlations:</strong>
                      {sectorComparison.correlations.slice(0, 3).map((corr, idx) => (
                        <div key={idx}>{corr.name}: {(corr.correlation * 100).toFixed(0)}%</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pattern Recognition Tab */}
        {activeTab === 'patterns' && (
          <div>
            {patterns.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
                {patterns.map((pattern, index) => (
                  <div key={index} style={{ 
                    background: '#f8f9fa', 
                    padding: '15px', 
                    borderRadius: '8px',
                    border: `3px solid ${getIndicatorColor(pattern.signal)}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{pattern.pattern}</span>
                      <span style={{ fontSize: '14px' }}>
                        {getSignalIcon(pattern.signal)}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', marginBottom: '8px' }}>
                      <div>Confidence: {(pattern.confidence * 100).toFixed(1)}%</div>
                      <div>Timeframe: {pattern.timeframe}</div>
                      <div style={{ marginTop: '5px', fontStyle: 'italic' }}>
                        {pattern.description}
                      </div>
                    </div>
                    <span style={{ 
                      fontSize: '14px', 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      background: getIndicatorColor(pattern.signal),
                      color: 'white'
                    }}>
                      {pattern.signal}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔍</div>
                <div>No patterns detected in current timeframe</div>
                <div style={{ fontSize: '12px', marginTop: '5px' }}>
                  Try switching to a different time period for pattern analysis
                </div>
              </div>
            )}

            {/* Sentiment Analysis */}
            {sentiment && (
              <div style={{ 
                marginTop: '20px', 
                background: '#f0f8ff', 
                padding: '15px', 
                borderRadius: '8px',
                border: `3px solid ${getIndicatorColor(sentiment.overall)}`
              }}>
                <h4 style={{ margin: '0 0 10px 0' }}>📊 Technical Sentiment Analysis</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                  <span style={{ 
                    fontSize: '18px', 
                    fontWeight: 'bold',
                    color: getIndicatorColor(sentiment.overall)
                  }}>
                    {getSignalIcon(sentiment.overall)} {sentiment.overall.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '14px' }}>
                    Strength: {sentiment.strength} ({(sentiment.score * 100).toFixed(0)}%)
                  </span>
                </div>
                <div style={{ fontSize: '12px' }}>
                  <strong>Contributing Factors:</strong>
                  <ul style={{ margin: '5px 0', paddingLeft: '15px' }}>
                    {sentiment.factors.map((factor, idx) => (
                      <li key={idx}>{factor}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Prediction Tab */}
        {activeTab === 'prediction' && (
          <div>
            {ensemblePrediction ? (
              <div style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '20px'
              }}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>🎯 AI Ensemble Prediction</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  <div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>Direction</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                      {getSignalIcon(ensemblePrediction.direction)} {ensemblePrediction.direction.toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>Confidence</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                      {(ensemblePrediction.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>Price Target</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                      ${ensemblePrediction.price_target.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>Timeframe</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                      {ensemblePrediction.timeframe}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '15px', fontSize: '12px' }}>
                  <strong>Key Factors:</strong>
                  <div style={{ marginTop: '5px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {ensemblePrediction.contributing_factors.map((factor, idx) => (
                      <span key={idx} style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '11px'
                      }}>
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>🤖</div>
                <div>AI prediction model loading...</div>
                <div style={{ fontSize: '12px', marginTop: '5px' }}>
                  Ensemble prediction requires technical analysis completion
                </div>
              </div>
            )}

            {/* AI Analysis Summary */}
            <div style={{ 
              background: '#f0f8ff', 
              padding: '15px', 
              borderRadius: '8px',
              border: '1px solid #e6f2ff'
            }}>
              <h5 style={{ margin: '0 0 10px 0', color: '#444' }}>🧠 AI Analysis Summary</h5>
              <div style={{ fontSize: '12px', color: '#666' }}>
                The AI ensemble model combines multiple technical indicators and machine learning algorithms 
                to provide comprehensive stock analysis. Current prediction confidence is based on pattern 
                recognition, momentum analysis, and historical price action correlation.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ 
        marginTop: '20px', 
        paddingTop: '15px', 
        borderTop: '1px solid #e0e0e0',
        fontSize: '11px',
        color: '#666',
        textAlign: 'center'
      }}>
        Real-time technical analysis powered by advanced algorithms • 
        Last updated: {realTimeTechnical ? formatTimestamp(realTimeTechnical.last_updated) : 'N/A'}
      </div>

      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};

export default TechnicalDashboard; 