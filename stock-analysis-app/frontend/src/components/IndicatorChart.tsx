import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import InfoTooltip from './InfoTooltip';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
);

interface IndicatorChartProps {
  symbol: string;
  height?: number;
}

interface TechnicalData {
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

const IndicatorChart: React.FC<IndicatorChartProps> = ({ symbol, height = 300 }) => {
  const [technicalData, setTechnicalData] = useState<TechnicalData | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState('1m');
  const [loading, setLoading] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState('sma');

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8004';

  useEffect(() => {
    if (symbol) {
      fetchTechnicalData();
    }
  }, [symbol, currentPeriod]);

  const fetchTechnicalData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/stocks/${symbol}/technical-chart?period=${currentPeriod}`);
      setTechnicalData(response.data);
    } catch (error) {
      console.error('Error fetching technical data:', error);
      // Generate fallback data for demonstration
      setTechnicalData(generateFallbackTechnicalData());
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackTechnicalData = (): TechnicalData => {
    const dataPoints = 30;
    const dates = [];
    const prices = [];
    const sma20 = [];
    const sma50 = [];
    const rsi = [];
    
    let basePrice = 150;
    
    for (let i = 0; i < dataPoints; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (dataPoints - i));
      
      // Generate realistic price movement
      basePrice += (Math.random() - 0.5) * 10;
      dates.push(date.toISOString());
      prices.push(basePrice);
      
      // Generate SMA values (simplified)
      if (i >= 19) {
        const sma20Value = prices.slice(i - 19, i + 1).reduce((sum, p) => sum + p, 0) / 20;
        sma20.push(sma20Value);
      } else {
        sma20.push(null);
      }
      
      if (i >= 49) {
        const sma50Value = prices.slice(i - 49, i + 1).reduce((sum, p) => sum + p, 0) / 50;
        sma50.push(sma50Value);
      } else {
        sma50.push(null);
      }
      
      // Generate RSI values (simplified)
      rsi.push(30 + Math.random() * 40); // RSI between 30-70
    }
    
    return {
      symbol,
      period: currentPeriod,
      dates: dates,
      price: prices,
      indicators: {
        sma_20: sma20,
        sma_50: sma50,
        rsi: rsi
      }
    };
  };

  const changePeriod = (period: string) => {
    setCurrentPeriod(period);
  };

  if (loading) {
    return (
      <div style={{ 
        height: `${height}px`, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#f5f5f5', 
        borderRadius: '10px' 
      }}>
        <div>Loading technical indicators...</div>
      </div>
    );
  }

  if (!technicalData) {
    return (
      <div style={{ 
        height: `${height}px`, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#f5f5f5', 
        borderRadius: '10px' 
      }}>
        <div>No technical data available</div>
      </div>
    );
  }

  const labels = technicalData.dates.map(date => new Date(date));
  const prices = technicalData.price;

  let datasets: any[] = [];

  if (selectedIndicator === 'sma') {
    datasets = [
      {
        label: 'Price',
        data: prices,
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.1,
        pointRadius: 0,
      }
    ];

    if (technicalData.indicators.sma_20) {
      datasets.push({
        label: 'SMA 20',
        data: technicalData.indicators.sma_20.filter((val): val is number => val !== null),
        borderColor: '#4CAF50',
        backgroundColor: 'transparent',
        borderWidth: 1,
        fill: false,
        tension: 0.1,
        pointRadius: 0,
      });
    }

    if (technicalData.indicators.sma_50) {
      datasets.push({
        label: 'SMA 50',
        data: technicalData.indicators.sma_50.filter((val): val is number => val !== null),
        borderColor: '#ff9800',
        backgroundColor: 'transparent',
        borderWidth: 1,
        fill: false,
        tension: 0.1,
        pointRadius: 0,
      });
    }
  } else if (selectedIndicator === 'rsi') {
    datasets = [
      {
        label: 'RSI',
        data: technicalData.indicators.rsi?.filter((val): val is number => val !== null) || [],
        borderColor: '#9c27b0',
        backgroundColor: 'rgba(156, 39, 176, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        pointRadius: 0,
      }
    ];
  } else if (selectedIndicator === 'macd') {
    datasets = [
      {
        label: 'MACD Line',
        data: technicalData.indicators.macd_line?.filter((val): val is number => val !== null) || [],
        borderColor: '#2196F3',
        backgroundColor: 'transparent',
        borderWidth: 2,
        fill: false,
        tension: 0.1,
        pointRadius: 0,
      },
      {
        label: 'Signal Line',
        data: technicalData.indicators.macd_signal?.filter((val): val is number => val !== null) || [],
        borderColor: '#FF5722',
        backgroundColor: 'transparent',
        borderWidth: 2,
        fill: false,
        tension: 0.1,
        pointRadius: 0,
      }
    ];
  } else if (selectedIndicator === 'bollinger') {
    datasets = [
      {
        label: 'Price',
        data: prices,
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.1,
        pointRadius: 0,
      },
      {
        label: 'Upper Band',
        data: technicalData.indicators.bollinger_upper?.filter((val): val is number => val !== null) || [],
        borderColor: '#f44336',
        backgroundColor: 'transparent',
        borderWidth: 1,
        fill: false,
        tension: 0.1,
        pointRadius: 0,
        borderDash: [5, 5],
      },
      {
        label: 'Middle Band (SMA)',
        data: technicalData.indicators.bollinger_middle?.filter((val): val is number => val !== null) || [],
        borderColor: '#4CAF50',
        backgroundColor: 'transparent',
        borderWidth: 1,
        fill: false,
        tension: 0.1,
        pointRadius: 0,
      },
      {
        label: 'Lower Band',
        data: technicalData.indicators.bollinger_lower?.filter((val): val is number => val !== null) || [],
        borderColor: '#f44336',
        backgroundColor: 'transparent',
        borderWidth: 1,
        fill: false,
        tension: 0.1,
        pointRadius: 0,
        borderDash: [5, 5],
      }
    ];
  }

  const data = {
    labels,
    datasets
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 11,
          },
        },
      },
      title: {
        display: true,
        text: `${symbol} - ${selectedIndicator.toUpperCase()} Indicators`,
        font: {
          size: 14,
          weight: 'bold' as const,
        },
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          displayFormats: {
            day: 'MMM dd',
            week: 'MMM dd',
            month: 'MMM yyyy',
          },
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 10,
          },
        },
      },
      y: {
        beginAtZero: selectedIndicator === 'rsi',
        min: selectedIndicator === 'rsi' ? 0 : undefined,
        max: selectedIndicator === 'rsi' ? 100 : undefined,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 10,
          },
          callback: function(value: any) {
            if (selectedIndicator === 'rsi') {
              return value.toFixed(0);
            } else if (selectedIndicator === 'macd') {
              return value.toFixed(3);
            }
            return '$' + value.toFixed(2);
          },
        },
      },
    },
  };

  return (
    <div>
      {/* Controls */}
      <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '5px' }}>
          {['1d', '1w', '1m', '3m', '6m'].map(period => (
            <button
              key={period}
              className={`period-btn-small ${currentPeriod === period ? 'active' : ''}`}
              onClick={() => changePeriod(period)}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
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
        
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {['sma', 'rsi', 'macd', 'bollinger'].map(indicator => {
            const getIndicatorExplanation = (ind: string) => {
              const explanations: Record<string, string> = {
                'sma': 'Simple Moving Average: Shows the average price over a specific period. When current price is above SMA, it suggests upward momentum. SMA 20 and SMA 50 are commonly used.',
                'rsi': 'Relative Strength Index (0-100): Measures if a stock is overbought (>70) or oversold (<30). Values between 30-70 suggest balanced momentum.',
                'macd': 'Moving Average Convergence Divergence: Shows the relationship between two moving averages. When MACD line crosses above signal line, it suggests bullish momentum.',
                'bollinger': 'Bollinger Bands: Price channels based on standard deviation. When price touches upper band, stock may be overbought. When it touches lower band, it may be oversold.'
              };
              return explanations[ind] || 'Technical indicator for stock analysis';
            };

            return (
              <div key={indicator} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <button
                  onClick={() => setSelectedIndicator(indicator)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    border: '1px solid #e0e0e0',
                    background: selectedIndicator === indicator ? '#667eea' : 'white',
                    color: selectedIndicator === indicator ? 'white' : '#333',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                >
                  {indicator.toUpperCase()}
                </button>
                <InfoTooltip 
                  title={indicator.toUpperCase()}
                  content={getIndicatorExplanation(indicator)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: `${height}px`, position: 'relative' }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default IndicatorChart; 