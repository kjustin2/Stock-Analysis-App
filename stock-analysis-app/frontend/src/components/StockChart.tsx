import React from 'react';
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
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

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

interface StockChartProps {
  chartData: ChartData;
  height?: number;
}

const StockChart: React.FC<StockChartProps> = ({ chartData, height = 400 }) => {
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

  // Prepare data for Chart.js
  const labels = chartData.data.map(point => new Date(point.x));
  const prices = chartData.data.map(point => point.c);
  const volumes = chartData.data.map(point => point.v);

  // Calculate price change for color coding
  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];
  const isPositive = lastPrice >= firstPrice;

  const data = {
    labels,
    datasets: [
      {
        label: `${chartData.symbol} Price`,
        data: prices,
        borderColor: isPositive ? '#4CAF50' : '#f44336',
        backgroundColor: isPositive ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: isPositive ? '#4CAF50' : '#f44336',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: `${chartData.symbol} - ${chartData.period.toUpperCase()} Chart`,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            const dataIndex = context.dataIndex;
            const point = chartData.data[dataIndex];
            return [
              `Close: $${point.c.toFixed(2)}`,
              `Open: $${point.o.toFixed(2)}`,
              `High: $${point.h.toFixed(2)}`,
              `Low: $${point.l.toFixed(2)}`,
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
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: false,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 11,
          },
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

  return (
    <div style={{ height: `${height}px`, position: 'relative' }}>
      <Line data={data} options={options} />
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
  );
};

export default StockChart; 