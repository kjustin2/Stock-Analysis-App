import axios from 'axios';
import { getStockNews, getStockHistory } from '../api';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getStockNews', () => {
        it('should successfully fetch news for a stock', async () => {
            const mockNews = [
                {
                    title: 'Test News',
                    url: 'https://example.com',
                    source: 'Test Source',
                    publishedAt: '2024-03-15T12:00:00Z',
                    summary: 'Test Summary'
                }
            ];

            mockedAxios.get.mockResolvedValueOnce({ data: mockNews });

            const result = await getStockNews('AAPL');
            expect(result).toEqual(mockNews);
            expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:8000/api/news/AAPL');
        });

        it('should successfully fetch news for QQQ', async () => {
            const mockNews = [
                {
                    title: 'QQQ News',
                    url: 'https://example.com/qqq',
                    source: 'Nasdaq',
                    publishedAt: '2024-03-15T12:00:00Z',
                    summary: 'QQQ Summary'
                }
            ];

            mockedAxios.get.mockResolvedValueOnce({ data: mockNews });

            const result = await getStockNews('QQQ');
            expect(result).toEqual(mockNews);
            expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:8000/api/news/QQQ');
        });

        it('should handle empty news response', async () => {
            mockedAxios.get.mockResolvedValueOnce({ data: [] });

            const result = await getStockNews('AAPL');
            expect(result).toEqual([]);
        });

        it('should handle network errors', async () => {
            mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));

            await expect(getStockNews('AAPL')).rejects.toThrow('Network Error');
        });

        it('should handle 404 errors', async () => {
            mockedAxios.get.mockRejectedValueOnce({
                response: { status: 404, data: { detail: 'Not Found' } }
            });

            await expect(getStockNews('INVALID')).rejects.toThrow('Not Found');
        });
    });

    describe('getStockHistory', () => {
        it('should successfully fetch stock history', async () => {
            const mockHistory = [
                {
                    date: '2024-03-15T12:00:00Z',
                    open: 100,
                    high: 101,
                    low: 99,
                    close: 100.5,
                    volume: 1000000
                }
            ];

            mockedAxios.get.mockResolvedValueOnce({ data: mockHistory });

            const result = await getStockHistory('AAPL');
            expect(result).toEqual(mockHistory);
            expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:8000/api/history/AAPL');
        });

        it('should handle empty history response', async () => {
            mockedAxios.get.mockResolvedValueOnce({ data: [] });

            const result = await getStockHistory('AAPL');
            expect(result).toEqual([]);
        });

        it('should handle network errors', async () => {
            mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));

            await expect(getStockHistory('AAPL')).rejects.toThrow('Network Error');
        });
    });
}); 