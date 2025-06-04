import axios, { AxiosError } from 'axios';

const API_URL = 'http://localhost:8000/api';

interface ErrorResponse {
  detail: string;
}

export interface StockAnalysis {
  symbol: string;
  current_price: number;
  signal: string;
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  sma_50: number;
  sma_200: number;
}

export interface CandleData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NewsArticle {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  summary: string;
}

const handleError = (error: unknown) => {
  console.error('API Error:', error);
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ErrorResponse>;
    if (axiosError.response?.data) {
      console.error('Server Error:', axiosError.response.data);
      throw new Error(axiosError.response.data.detail || 'Server error');
    } else if (axiosError.request) {
      console.error('Network Error:', axiosError.request);
      throw new Error('Cannot connect to server. Please check if the backend is running.');
    }
  }
  throw error;
};

export const api = {
  analyzeStock: async (symbol: string): Promise<StockAnalysis> => {
    try {
      console.log('Fetching analysis for:', symbol);
      const response = await axios.get<StockAnalysis>(`${API_URL}/analyze/${symbol}`);
      console.log('Analysis response:', response.data);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  getStockHistory: async (symbol: string, days: number = 365): Promise<CandleData[]> => {
    try {
      console.log('Fetching history for:', symbol);
      const response = await axios.get<CandleData[]>(`${API_URL}/history/${symbol}`, {
        params: { days }
      });
      console.log('History response:', response.data);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  getStockNews: async (symbol: string): Promise<NewsArticle[]> => {
    try {
      console.log('Fetching news for:', symbol);
      // For now, we'll use a free news API as a placeholder
      // In production, you might want to use a paid service like Alpha Vantage or Financial Modeling Prep
      const response = await axios.get<NewsArticle[]>(`${API_URL}/news/${symbol}`);
      console.log('News response:', response.data);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  }
}; 