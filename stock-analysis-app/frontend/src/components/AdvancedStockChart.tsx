import React, { useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
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
import 'chartjs-adapter-date-fns';

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

interface StockChartData {
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

interface AdvancedStockChartProps {
  chartData: StockChartData;
  height?: number;
  chartType?: 'line' | 'candlestick';
  showVolume?: boolean;
}

const AdvancedStockChart: React.FC<AdvancedStockChartProps> = ({
  chartData,
  height = 500,
  chartType = 'candlestick',
  showVolume = true,
}) => {
  const [activeIndicators, setActiveIndicators] = useState<Set<string>>(new Set(['sma_20']));
  const [chartLayout, setChartLayout] = useState<'single' | 'multi'>('multi');

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

  // Prepare main chart data
  const prepareMainChartData = () => {
    const labels = chartData.data.map(point => new Date(point.x));
    const datasets: any[] = [];

    if (chartType === 'candlestick') {
      // Simulate candlestick with high-low and open-close bars
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
    } else {
      // Line chart
      datasets.push({
        label: `${chartData.symbol} Price`,
        data: chartData.data.map(point => point.c),
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        pointRadius: 0,
      });
    }

    return { labels, datasets };
  };

  const mainChartData = prepareMainChartData();

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
        text: `${chartData.symbol} - Advanced Chart`,
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
  };

  return (
    <div>
      {/* Chart Controls */}
      <div style={{ marginBottom: '15px', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Chart Type:</span>
          <button
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              border: '1px solid #e0e0e0',
              background: '#667eea',
              color: 'white',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {chartType.charAt(0).toUpperCase() + chartType.slice(1)}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Layout:</span>
          <button
            onClick={() => setChartLayout(chartLayout === 'single' ? 'multi' : 'single')}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              border: '1px solid #e0e0e0',
              background: '#667eea',
              color: 'white',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {chartLayout === 'single' ? 'Multi-Pane' : 'Single Pane'}
          </button>
        </div>
      </div>

      {/* Main Chart */}
      <div style={{ 
        height: chartLayout === 'single' ? `${height}px` : `${Math.floor(height * 0.7)}px`, 
        position: 'relative',
        marginBottom: '10px'
      }}>
        <Line
          data={mainChartData}
          options={chartOptions}
          height={height}
        />
      </div>

      {/* Volume Chart (Multi-pane only) */}
      {chartLayout === 'multi' && showVolume && (
        <div style={{ height: `${Math.floor(height * 0.3)}px`, position: 'relative' }}>
          <Bar 
            data={{
              labels: chartData.data.map(point => new Date(point.x)),
              datasets: [{
                label: 'Volume',
                data: chartData.data.map(point => point.v),
                backgroundColor: chartData.data.map(point => 
                  point.c >= point.o ? 'rgba(76, 175, 80, 0.7)' : 'rgba(244, 67, 54, 0.7)'
                ),
                borderColor: chartData.data.map(point => 
                  point.c >= point.o ? '#4CAF50' : '#f44336'
                ),
                borderWidth: 1,
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                title: {
                  display: true,
                  text: 'Volume',
                  font: { size: 12 },
                },
              },
              scales: {
                x: {
                  type: 'time' as const,
                  grid: { display: true, color: 'rgba(0, 0, 0, 0.1)' },
                  ticks: { font: { size: 10 } },
                },
                y: {
                  beginAtZero: true,
                  grid: { display: true, color: 'rgba(0, 0, 0, 0.1)' },
                  ticks: {
                    font: { size: 10 },
                    callback: function(value: any) {
                      return (value / 1000000).toFixed(1) + 'M';
                    },
                  },
                },
              },
            }}
          />
        </div>
      )}

      {/* Chart Info */}
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
        {chartData.data_points} data points • {chartType.toUpperCase()}
      </div>
    </div>
  );
};

export default AdvancedStockChart; 