import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OutfitScorer from './OutfitScorer';
import '@testing-library/jest-dom';

// Mock the necessary browser APIs
global.URL.createObjectURL = jest.fn();

// Mock TensorFlow.js
jest.mock('@tensorflow/tfjs', () => ({
  ready: jest.fn().mockResolvedValue(undefined),
  loadGraphModel: jest.fn().mockResolvedValue({
    predict: jest.fn().mockReturnValue({
      dataSync: jest.fn().mockReturnValue(new Float32Array([0.8, 0.2])),
      dispose: jest.fn()
    })
  }),
  browser: {
    fromPixels: jest.fn().mockReturnValue({
      expandDims: jest.fn().mockReturnThis(),
      toFloat: jest.fn().mockReturnThis(),
      div: jest.fn().mockReturnThis(),
      reshape: jest.fn().mockReturnThis(),
      dispose: jest.fn()
    })
  },
  dispose: jest.fn()
}));

describe('OutfitScorer End-to-End Tests', () => {
  const createMockFile = (name = 'test.jpg', type = 'image/jpeg') => {
    return new File(['dummy content'], name, { type });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete User Flow', () => {
    it('completes full outfit analysis workflow with high score', async () => {
      const { container } = render(<OutfitScorer />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(/drag and drop your outfit photo here/i)).toBeInTheDocument();
      });

      // Upload a file
      const file = createMockFile();
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      await act(async () => {
        await userEvent.upload(input, file);
      });

      // Check loading state
      expect(screen.getByText(/analyzing your outfit/i)).toBeInTheDocument();

      // Wait for analysis completion
      await waitFor(() => {
        expect(screen.getByText(/style score/i)).toBeInTheDocument();
      }, { timeout: 15000 });

      // Verify high score feedback
      const scoreElement = screen.getByText(/\/100/i);
      const score = parseInt(scoreElement.textContent?.split('/')[0] || '0');
      expect(score).toBeGreaterThan(0);

      // Check style elements detection
      expect(screen.getByText(/detected style elements/i)).toBeInTheDocument();

      // Verify feedback sections
      expect(screen.getByText(/style consistency/i)).toBeInTheDocument();
      expect(screen.getByText(/color harmony/i)).toBeInTheDocument();
      expect(screen.getByText(/formality/i)).toBeInTheDocument();

      // Check suggestions
      const suggestions = screen.getByRole('region', { name: /suggestions/i });
      expect(suggestions).toBeInTheDocument();
    }, 30000);

    it('handles complete workflow with low score', async () => {
      // Mock low confidence predictions
      const mockTf = require('@tensorflow/tfjs');
      mockTf.loadGraphModel.mockResolvedValueOnce({
        predict: jest.fn().mockReturnValue({
          dataSync: jest.fn().mockReturnValue(new Float32Array([0.3, 0.2])),
          dispose: jest.fn()
        })
      });

      const { container } = render(<OutfitScorer />);

      // Upload a file
      const file = createMockFile();
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      await act(async () => {
        await userEvent.upload(input, file);
      });

      // Wait for analysis completion
      await waitFor(() => {
        expect(screen.getByText(/style score/i)).toBeInTheDocument();
      }, { timeout: 15000 });

      // Verify low score feedback
      expect(screen.getByText(/consider revising/i)).toBeInTheDocument();

      // Check improvement suggestions
      const suggestions = screen.getByRole('region', { name: /suggestions/i });
      expect(suggestions).toHaveTextContent(/try to maintain a consistent style/i);
    }, 30000);

    it('completes workflow with multiple model consensus', async () => {
      // Mock multiple model predictions
      const mockTf = require('@tensorflow/tfjs');
      mockTf.loadGraphModel
        .mockResolvedValueOnce({
          predict: jest.fn().mockReturnValue({
            dataSync: jest.fn().mockReturnValue(new Float32Array([0.8, 0.2])),
            dispose: jest.fn()
          })
        })
        .mockResolvedValueOnce({
          detect: jest.fn().mockResolvedValue([
            { class: 'suit', score: 0.9 },
            { class: 'tie', score: 0.85 }
          ])
        })
        .mockResolvedValueOnce({
          estimateFaces: jest.fn().mockResolvedValue([{ probability: 0.95 }])
        });

      const { container } = render(<OutfitScorer />);

      // Upload a file
      const file = createMockFile();
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      await act(async () => {
        await userEvent.upload(input, file);
      });

      // Wait for analysis completion
      await waitFor(() => {
        expect(screen.getByText(/style score/i)).toBeInTheDocument();
      }, { timeout: 15000 });

      // Verify consensus-based results
      expect(screen.getByText(/formal/i)).toBeInTheDocument();
      expect(screen.getByText(/excellent outfit/i)).toBeInTheDocument();
    }, 30000);

    it('handles user interactions during analysis', async () => {
      const { container } = render(<OutfitScorer />);

      // Upload first file
      const file1 = createMockFile('outfit1.jpg');
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      
      await act(async () => {
        await userEvent.upload(input, file1);
      });

      // Try to upload second file during analysis
      const file2 = createMockFile('outfit2.jpg');
      await act(async () => {
        await userEvent.upload(input, file2);
      });

      // Verify proper handling of concurrent uploads
      const analysisMessages = screen.getAllByText(/analyzing your outfit/i);
      expect(analysisMessages.length).toBe(1);

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText(/style score/i)).toBeInTheDocument();
      }, { timeout: 15000 });
    }, 30000);

    it('preserves state during browser navigation', async () => {
      const { container } = render(<OutfitScorer />);

      // Upload a file
      const file = createMockFile();
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      await act(async () => {
        await userEvent.upload(input, file);
      });

      // Wait for analysis completion
      await waitFor(() => {
        expect(screen.getByText(/style score/i)).toBeInTheDocument();
      }, { timeout: 15000 });

      // Simulate browser navigation
      const popStateEvent = new PopStateEvent('popstate', { state: null });
      window.dispatchEvent(popStateEvent);

      // Verify state preservation
      expect(screen.getByText(/style score/i)).toBeInTheDocument();
      expect(screen.getByText(/detected style elements/i)).toBeInTheDocument();
    }, 30000);
  });

  describe('Error Recovery Flow', () => {
    it('recovers from network errors during analysis', async () => {
      // Mock network failure during analysis
      const mockTf = require('@tensorflow/tfjs');
      mockTf.loadGraphModel.mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          predict: jest.fn().mockReturnValue({
            dataSync: jest.fn().mockReturnValue(new Float32Array([0.8, 0.2])),
            dispose: jest.fn()
          })
        });

      const { container } = render(<OutfitScorer />);

      // Upload a file
      const file = createMockFile();
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      await act(async () => {
        await userEvent.upload(input, file);
      });

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/failed to analyze/i)).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByText(/retry/i);
      fireEvent.click(retryButton);

      // Verify recovery
      await waitFor(() => {
        expect(screen.getByText(/style score/i)).toBeInTheDocument();
      }, { timeout: 15000 });
    }, 30000);

    it('handles model initialization failures gracefully', async () => {
      // Mock model initialization failure
      const mockTf = require('@tensorflow/tfjs');
      mockTf.ready.mockRejectedValueOnce(new Error('Initialization failed'));

      render(<OutfitScorer />);

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/failed to initialize/i)).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByText(/retry/i);
      fireEvent.click(retryButton);

      // Verify recovery attempt
      expect(mockTf.ready).toHaveBeenCalledTimes(2);
    }, 20000);
  });

  describe('Performance Flow', () => {
    it('handles rapid file uploads efficiently', async () => {
      const { container } = render(<OutfitScorer />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      // Create multiple files
      const files = [
        createMockFile('outfit1.jpg'),
        createMockFile('outfit2.jpg'),
        createMockFile('outfit3.jpg')
      ];

      // Perform rapid uploads
      for (const file of files) {
        await act(async () => {
          await userEvent.upload(input, file);
        });
      }

      // Verify proper handling
      const analysisMessages = screen.getAllByText(/analyzing your outfit/i);
      expect(analysisMessages.length).toBe(1);

      // Wait for final analysis
      await waitFor(() => {
        expect(screen.getByText(/style score/i)).toBeInTheDocument();
      }, { timeout: 15000 });

      // Verify memory cleanup
      const mockTf = require('@tensorflow/tfjs');
      expect(mockTf.dispose).toHaveBeenCalled();
    }, 30000);

    it('optimizes model loading and caching', async () => {
      const mockTf = require('@tensorflow/tfjs');
      const startTime = performance.now();

      // First render
      const { unmount } = render(<OutfitScorer />);
      
      await waitFor(() => {
        expect(screen.getByText(/drag and drop your outfit photo here/i)).toBeInTheDocument();
      });

      unmount();

      // Second render
      render(<OutfitScorer />);

      await waitFor(() => {
        expect(screen.getByText(/drag and drop your outfit photo here/i)).toBeInTheDocument();
      });

      // Verify model caching
      expect(mockTf.loadGraphModel).toHaveBeenCalledTimes(1);

      const loadTime = performance.now() - startTime;
      expect(loadTime).toBeLessThan(5000);
    }, 20000);
  });
}); 