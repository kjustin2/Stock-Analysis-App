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
  Filler,
  ArcElement,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

// Export Chart.js for use in components
export { ChartJS };

// Default chart options
export const defaultChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: false,
    },
  },
  scales: {
    x: {
      type: 'category' as const,
    },
    y: {
      type: 'linear' as const,
      beginAtZero: true,
    },
  },
};

// Chart color palette
export const chartColors = {
  primary: 'rgb(59, 130, 246)',
  secondary: 'rgb(16, 185, 129)',
  accent: 'rgb(245, 158, 11)',
  danger: 'rgb(239, 68, 68)',
  warning: 'rgb(251, 191, 36)',
  info: 'rgb(14, 165, 233)',
  success: 'rgb(34, 197, 94)',
  gray: 'rgb(107, 114, 128)',
}; 