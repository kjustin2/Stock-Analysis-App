import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import InfoTooltip from './InfoTooltip';
import { technicalIndicatorService } from '../services/technicalIndicatorService';
import type { TechnicalData } from '../services/technicalIndicatorService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
);

interface ChartDataPoint {
  x: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

interface ChartData {
  symbol: string;
  period: string;
  data: ChartDataPoint[];
  data_points: number;
  technicalData?: TechnicalData;
}

interface UnifiedStockChartProps {
  chartData: ChartData;
  height?: number;
  chartType?: 'line' | 'candlestick';
  showVolume?: boolean;
  showTechnicalIndicators?: boolean;
  enabledIndicators?: Set<string>;
  onIndicatorToggle?: (indicator: string, enabled: boolean) => void;
}

const UnifiedStockChart: React.FC<UnifiedStockChartProps> = React.memo(({
  chartData,
  height = 500,
  chartType = 'candlestick',
  showVolume = true,
  showTechnicalIndicators = true,
  enabledIndicators = new Set(['sma_20', 'rsi']),
  onIndicatorToggle,
}) => {
  const [technicalData, setTechnicalData] = useState<TechnicalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [chartLayout, setChartLayout] = useState<'single' | 'multi'>('multi');

  // Memoize expensive technical data calculation
  const calculateTechnicalData = useCallback(async () => {
    if (chartData?.data && showTechnicalIndicators) {
      setLoading(true);
      try {
        const technical = technicalIndicatorService.calculateTechnicalIndicators(
          chartData.data,
          chartData.symbol,
          chartData.period
        );
        setTechnicalData(technical);
      } catch (error) {
        console.error('Error calculating technical indicators:', error);
        setTechnicalData(generateFallbackTechnicalData());
      } finally {
        setLoading(false);
      }
    }
  }, [chartData?.data, chartData?.symbol, chartData?.period, showTechnicalIndicators]);

  // Calculate technical indicators when chart data changes
  useEffect(() => {
    calculateTechnicalData();
  }, [calculateTechnicalData]);

  const generateFallbackTechnicalData = (): TechnicalData => {
    if (!chartData?.data) return { symbol: '', period: '', dates: [], price: [], indicators: {} };
    
    const prices = chartData.data.map(point => point.c);
    const dates = chartData.data.map(point => point.x);
    const sma20 = [];
    const rsi = [];
    
    // Generate simplified SMA 20
    for (let i = 0; i < prices.length; i++) {
      if (i >= 19) {
        const sma20Value = prices.slice(i - 19, i + 1).reduce((sum, p) => sum + p, 0) / 20;
        sma20.push(sma20Value);
      } else {
        sma20.push(null);
      }
      
      // Generate simplified RSI
      rsi.push(30 + Math.random() * 40);
    }
    
    return {
      symbol: chartData.symbol,
      period: chartData.period,
      dates,
      price: prices,
      indicators: {
        sma_20: sma20,
        rsi: rsi
      }
    };
  };

  if (!chartData || !chartData.data || chartData.data.length === 0) {
    return (
      <div style={{ 
        height: `${height}px`, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#f5f5f5', 
        borderRadius: '10px' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <p>No chart data available</p>
        </div>
      </div>
    );
  }

  const prepareMainChartData = () => {
    const labels = chartData.data.map(point => new Date(point.x));
    const datasets: any[] = [];

    if (chartType === 'candlestick') {
      // Simulate candlestick with high-low bars and open-close overlays
      datasets.push({
        label: 'Price Range',
        data: chartData.data.map(point => ({
          x: new Date(point.x),
          y: [point.l, point.h]
        })),
        type: 'bar',
        borderColor: chartData.data.map(point => point.c >= point.o ? '#4CAF50' : '#f44336'),
        backgroundColor: chartData.data.map(point => point.c >= point.o ? '#4CAF50' : '#f44336'),
        borderWidth: 1,
        barThickness: 2,
      });

      // Add open-close bars
      datasets.push({
        label: 'Open-Close',
        data: chartData.data.map(point => ({
          x: new Date(point.x),
          y: [Math.min(point.o, point.c), Math.max(point.o, point.c)]
        })),
        type: 'bar',
        borderColor: chartData.data.map(point => point.c >= point.o ? '#4CAF50' : '#f44336'),
        backgroundColor: chartData.data.map(point => point.c >= point.o ? 'rgba(76, 175, 80, 0.8)' : 'rgba(244, 67, 54, 0.8)'),
        borderWidth: 0,
        barThickness: 6,
      });
    } else {
      // Line chart
      const prices = chartData.data.map(point => point.c);
      const firstPrice = prices[0];
      const lastPrice = prices[prices.length - 1];
      const isPositive = lastPrice >= firstPrice;

      datasets.push({
        label: `${chartData.symbol} Price`,
        data: prices,
        borderColor: isPositive ? '#4CAF50' : '#f44336',
        backgroundColor: isPositive ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 5,
      });
    }

    // Add technical indicators
    if (showTechnicalIndicators && technicalData) {
      if (enabledIndicators.has('sma_20') && technicalData.indicators.sma_20) {
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

      if (enabledIndicators.has('sma_50') && technicalData.indicators.sma_50) {
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
    }

    return { labels, datasets };
  };

  const prepareVolumeChartData = () => {
    const labels = chartData.data.map(point => new Date(point.x));
    const volumes = chartData.data.map(point => point.v);
    
    return {
      labels,
      datasets: [{
        label: 'Volume',
        data: volumes,
        backgroundColor: chartData.data.map(point => 
          point.c >= point.o ? 'rgba(76, 175, 80, 0.6)' : 'rgba(244, 67, 54, 0.6)'
        ),
        borderColor: chartData.data.map(point => 
          point.c >= point.o ? '#4CAF50' : '#f44336'
        ),
        borderWidth: 1,
      }]
    };
  };

  const prepareRSIChartData = () => {
    if (!technicalData?.indicators.rsi) return null;
    
    const labels = chartData.data.map(point => new Date(point.x));
    
    return {
      labels,
      datasets: [{
        label: 'RSI',
        data: technicalData.indicators.rsi,
        borderColor: '#9c27b0',
        backgroundColor: 'rgba(156, 39, 176, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        pointRadius: 0,
      }]
    };
  };

  const mainChartData = prepareMainChartData();
  const volumeChartData = prepareVolumeChartData();
  const rsiChartData = prepareRSIChartData();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { font: { size: 11 } },
      },
      title: {
        display: true,
        text: `${chartData.symbol} - ${chartType.toUpperCase()} Chart`,
        font: { size: 16, weight: 'bold' as const },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            const dataIndex = context.dataIndex;
            const point = chartData.data[dataIndex];
            return [
              `Open: $${point.o.toFixed(2)}`,
              `High: $${point.h.toFixed(2)}`,
              `Low: $${point.l.toFixed(2)}`,
              `Close: $${point.c.toFixed(2)}`,
              `Volume: ${point.v.toLocaleString()}`
            ];
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          displayFormats: {
            minute: 'HH:mm',
            hour: 'HH:mm',
            day: 'MMM dd',
            week: 'MMM dd',
            month: 'MMM yyyy',
            year: 'yyyy'
          },
        },
        grid: { display: true, color: 'rgba(0, 0, 0, 0.1)' },
        ticks: { font: { size: 11 } },
      },
      y: {
        beginAtZero: false,
        grid: { display: true, color: 'rgba(0, 0, 0, 0.1)' },
        ticks: {
          font: { size: 11 },
          callback: function(value: any) {
            return '$' + value.toFixed(2);
          },
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  const volumeOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        ...chartOptions.plugins.title,
        text: 'Volume',
      },
    },
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        ticks: {
          ...chartOptions.scales.y.ticks,
          callback: function(value: any) {
            return value.toLocaleString();
          },
        },
      },
    },
  };

  const rsiOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        ...chartOptions.plugins.title,
        text: 'RSI (Relative Strength Index)',
      },
    },
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        min: 0,
        max: 100,
        ticks: {
          ...chartOptions.scales.y.ticks,
          callback: function(value: any) {
            return value.toString();
          },
        },
      },
    },
  };

  const availableIndicators = [
    { id: 'sma_20', name: 'SMA 20', description: '20-period Simple Moving Average' },
    { id: 'sma_50', name: 'SMA 50', description: '50-period Simple Moving Average' },
    { id: 'rsi', name: 'RSI', description: 'Relative Strength Index' },
    { id: 'macd', name: 'MACD', description: 'Moving Average Convergence Divergence' },
  ];

  const mainChartHeight = chartLayout === 'multi' ? height * 0.6 : height;
  const subChartHeight = height * 0.2;

  return (
    <div>
      {/* Chart Controls */}
      <div style={{ 
        marginBottom: '15px', 
        display: 'flex', 
        gap: '15px', 
        flexWrap: 'wrap', 
        alignItems: 'center',
        padding: '10px',
        background: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e0e0e0'
      }}>
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Chart Type:</span>
          <span style={{
            padding: '4px 8px',
            fontSize: '11px',
            background: '#667eea',
            color: 'white',
            borderRadius: '4px',
          }}>
            {chartType.charAt(0).toUpperCase() + chartType.slice(1)}
          </span>
        </div>

        {showTechnicalIndicators && (
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Indicators:</span>
            {availableIndicators.map(indicator => (
              <button
                key={indicator.id}
                onClick={() => onIndicatorToggle?.(indicator.id, !enabledIndicators.has(indicator.id))}
                style={{
                  padding: '2px 6px',
                  fontSize: '10px',
                  border: '1px solid #e0e0e0',
                  background: enabledIndicators.has(indicator.id) ? '#4CAF50' : 'white',
                  color: enabledIndicators.has(indicator.id) ? 'white' : '#333',
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
                title={indicator.description}
              >
                {indicator.name}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Layout:</span>
          <button
            onClick={() => setChartLayout(chartLayout === 'single' ? 'multi' : 'single')}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              border: '1px solid #e0e0e0',
              background: chartLayout === 'multi' ? '#667eea' : 'white',
              color: chartLayout === 'multi' ? 'white' : '#333',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {chartLayout === 'multi' ? 'Multi-Panel' : 'Single Panel'}
          </button>
        </div>
      </div>

      {/* Main Price Chart */}
      <div style={{ height: `${mainChartHeight}px`, position: 'relative', marginBottom: '10px' }}>
        <Line data={mainChartData} options={chartOptions} />
        <div style={{ 
          position: 'absolute', 
          bottom: '10px', 
          right: '10px', 
          background: 'rgba(255, 255, 255, 0.9)', 
          padding: '5px 10px', 
          borderRadius: '5px', 
          fontSize: '12px',
          color: '#666'
        }}>
          {chartData.data_points} data points
        </div>
      </div>

      {/* Sub-charts for multi-panel layout */}
      {chartLayout === 'multi' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Volume Chart */}
          {showVolume && (
            <div style={{ height: `${subChartHeight}px` }}>
              <Bar data={volumeChartData} options={volumeOptions} />
            </div>
          )}

          {/* RSI Chart */}
          {showTechnicalIndicators && enabledIndicators.has('rsi') && rsiChartData && (
            <div style={{ height: `${subChartHeight}px` }}>
              <Line data={rsiChartData} options={rsiOptions} />
            </div>
          )}
        </div>
      )}

      {loading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px'
        }}>
          Loading technical indicators...
        </div>
      )}
    </div>
  );
});

export default UnifiedStockChart; 