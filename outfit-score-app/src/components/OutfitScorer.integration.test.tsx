import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OutfitScorer, {
  calculateOverallScore,
  calculateStyleConsistency,
  calculateColorHarmony,
  calculateFormality,
  checkComplementaryColors,
  checkLayeringOrder,
  checkRuleOfThirds,
  determineFormalityLevel
} from './OutfitScorer';
import '@testing-library/jest-dom';

// Mock the necessary browser APIs
global.URL.createObjectURL = jest.fn();

describe('OutfitScorer Integration Tests', () => {
  const createMockFile = (name = 'test.jpg', type = 'image/jpeg') => {
    return new File(['dummy content'], name, { type });
  };

  const uploadFile = async (file: File) => {
    const { container } = render(<OutfitScorer />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText(/drag and drop your outfit photo here/i)).toBeInTheDocument();
    }, { timeout: 15000 });

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();

    if (input) {
      await act(async () => {
        await userEvent.upload(input, file);
      });
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('End-to-End Flow', () => {
    it('completes full outfit analysis workflow', async () => {
      const file = createMockFile();
      await uploadFile(file);

      // Check loading states
      expect(screen.getByText(/analyzing your outfit/i)).toBeInTheDocument();

      // Wait for analysis completion
      await waitFor(() => {
        expect(screen.getByText(/style score/i)).toBeInTheDocument();
      }, { timeout: 15000 });

      // Verify results display
      expect(screen.getByText(/\/100/i)).toBeInTheDocument();
      expect(screen.getByText(/detected style elements/i)).toBeInTheDocument();
    }, 20000);

    it('handles multiple file uploads sequentially', async () => {
      const file1 = createMockFile('outfit1.jpg');
      const file2 = createMockFile('outfit2.jpg');

      await uploadFile(file1);
      await waitFor(() => {
        expect(screen.getByText(/style score/i)).toBeInTheDocument();
      }, { timeout: 15000 });

      await uploadFile(file2);
      await waitFor(() => {
        expect(screen.getByText(/analyzing your outfit/i)).toBeInTheDocument();
      }, { timeout: 15000 });
    }, 30000);
  });

  describe('Model Loading and Error Handling', () => {
    it('recovers from model loading failures', async () => {
      // Mock a model loading failure
      const mockTf = require('@tensorflow/tfjs');
      mockTf.ready.mockRejectedValueOnce(new Error('Model load failed'));

      render(<OutfitScorer />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load ai models/i)).toBeInTheDocument();
      }, { timeout: 15000 });

      // Verify retry button presence
      const retryButton = screen.getByText(/retry/i);
      expect(retryButton).toBeInTheDocument();
    }, 20000);

    it('shows proper loading states for each model', async () => {
      render(<OutfitScorer />);

      // Check individual model loading indicators
      await waitFor(() => {
        expect(screen.getByText(/mobileNet/i)).toBeInTheDocument();
        expect(screen.getByText(/objectDetector/i)).toBeInTheDocument();
        expect(screen.getByText(/faceDetector/i)).toBeInTheDocument();
      }, { timeout: 15000 });
    }, 20000);
  });

  describe('UI Interaction Tests', () => {
    it('handles drag and drop interactions', async () => {
      const { container } = render(<OutfitScorer />);
      const dropzone = container.querySelector('[role="presentation"]') as HTMLElement;
      expect(dropzone).toBeInTheDocument();

      if (dropzone) {
        fireEvent.dragEnter(dropzone);
        expect(dropzone).toHaveClass('border-blue-500');

        fireEvent.dragLeave(dropzone);
        expect(dropzone).not.toHaveClass('border-blue-500');
      }
    }, 20000);

    it('displays proper feedback based on score ranges', async () => {
      const file = createMockFile();
      await uploadFile(file);

      await waitFor(() => {
        const scoreElement = screen.getByText(/\/100/i);
        expect(scoreElement).toBeInTheDocument();

        const score = parseInt(scoreElement.textContent?.split('/')[0] || '0');
        
        if (score >= 80) {
          expect(screen.getByText(/excellent outfit/i)).toBeInTheDocument();
        } else if (score >= 60) {
          expect(screen.getByText(/good outfit/i)).toBeInTheDocument();
        } else {
          expect(screen.getByText(/consider revising/i)).toBeInTheDocument();
        }
      }, { timeout: 15000 });
    }, 20000);
  });

  describe('Style Analysis Algorithm Tests', () => {
    const mockDetectedItems = [
      {
        category: 'suit',
        attributes: {
          color: 'navy',
          pattern: 'solid',
          material: 'wool',
          style: 'formal',
          layering: 'outer',
          formalityLevel: 'formal' as const,
          formalityScore: 0.9
        }
      },
      {
        category: 'dress shirt',
        attributes: {
          color: 'white',
          pattern: 'solid',
          material: 'cotton',
          style: 'formal',
          layering: 'base',
          formalityLevel: 'formal' as const,
          formalityScore: 0.8
        }
      }
    ];

    it('calculates overall score correctly', () => {
      const score = calculateOverallScore(mockDetectedItems);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('evaluates style consistency accurately', () => {
      const consistency = calculateStyleConsistency(['formal', 'formal']);
      expect(consistency).toBe(30); // Perfect consistency
    });

    it('analyzes color harmony correctly', () => {
      const harmony = calculateColorHarmony(['navy', 'white']);
      expect(harmony).toBeGreaterThan(0);
      expect(harmony).toBeLessThanOrEqual(20);
    });

    it('assesses formality level appropriately', () => {
      const formality = calculateFormality(mockDetectedItems);
      expect(formality).toBeGreaterThan(0);
      expect(formality).toBeLessThanOrEqual(20);
    });

    it('identifies complementary colors', () => {
      expect(checkComplementaryColors(['red', 'green'])).toBe(true);
      expect(checkComplementaryColors(['blue', 'red'])).toBe(false);
    });

    it('validates layering order', () => {
      expect(checkLayeringOrder(mockDetectedItems)).toBe(true);
    });

    it('checks rule of thirds compliance', () => {
      expect(checkRuleOfThirds(mockDetectedItems)).toBe(true);
    });

    it('determines formality level correctly', () => {
      expect(determineFormalityLevel(19)).toBe('formal');
      expect(determineFormalityLevel(5)).toBe('casual');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('handles invalid file types gracefully', async () => {
      const invalidFile = new File(['dummy content'], 'test.txt', { type: 'text/plain' });
      await uploadFile(invalidFile);
      
      await waitFor(() => {
        expect(screen.getByText(/please upload an image file/i)).toBeInTheDocument();
      });
    });

    it('handles large file sizes appropriately', async () => {
      const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      await uploadFile(largeFile);
      
      await waitFor(() => {
        expect(screen.getByText(/file size should be less than 5MB/i)).toBeInTheDocument();
      });
    });

    it('handles network errors during model loading', async () => {
      // Mock network failure
      const mockTf = require('@tensorflow/tfjs');
      mockTf.loadGraphModel.mockRejectedValueOnce(new Error('Network error'));

      render(<OutfitScorer />);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to load ai models/i)).toBeInTheDocument();
        expect(screen.getByText(/please check your internet connection/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Features', () => {
    it('maintains proper focus management', async () => {
      const { container } = render(<OutfitScorer />);
      
      const dropzone = container.querySelector('[role="presentation"]') as HTMLElement;
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      
      // Test keyboard navigation
      input.focus();
      expect(document.activeElement).toBe(input);
      
      // Test focus trap in modal (if any)
      const file = createMockFile();
      await uploadFile(file);
      
      await waitFor(() => {
        const modal = screen.queryByRole('dialog');
        if (modal) {
          expect(modal).toHaveFocus();
        }
      });
    });

    it('provides proper ARIA labels', () => {
      const { container } = render(<OutfitScorer />);
      
      // Check for proper ARIA labels
      const dropzone = container.querySelector('[role="presentation"]');
      expect(dropzone).toHaveAttribute('aria-label', 'Drop zone for outfit photos');
      
      const input = container.querySelector('input[type="file"]');
      expect(input).toHaveAttribute('aria-label', 'Upload outfit photo');
    });

    it('handles screen reader announcements', async () => {
      const file = createMockFile();
      await uploadFile(file);
      
      await waitFor(() => {
        const results = screen.getByRole('region', { name: /results/i });
        expect(results).toBeInTheDocument();
        expect(results).toHaveAttribute('aria-live', 'polite');
      });
    });
  });

  describe('Performance Optimization', () => {
    it('debounces rapid file uploads', async () => {
      const files = [
        createMockFile('outfit1.jpg'),
        createMockFile('outfit2.jpg'),
        createMockFile('outfit3.jpg')
      ];

      // Attempt rapid uploads
      for (const file of files) {
        await uploadFile(file);
      }

      // Verify only the last upload is processed
      await waitFor(() => {
        const uploadCount = screen.getAllByText(/analyzing your outfit/i).length;
        expect(uploadCount).toBe(1);
      });
    });

    it('handles memory cleanup properly', async () => {
      const mockDispose = jest.fn();
      const mockTf = require('@tensorflow/tfjs');
      mockTf.dispose = mockDispose;

      const file = createMockFile();
      await uploadFile(file);

      // Process another file to trigger cleanup
      const file2 = createMockFile('another.jpg');
      await uploadFile(file2);

      expect(mockDispose).toHaveBeenCalled();
    });

    it('optimizes model loading', async () => {
      const startTime = performance.now();
      
      render(<OutfitScorer />);
      
      await waitFor(() => {
        expect(screen.getByText(/drag and drop your outfit photo here/i)).toBeInTheDocument();
      });

      const loadTime = performance.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    });
  });

  describe('Progressive Enhancement', () => {
    it('works without JavaScript', () => {
      // Simulate JS disabled environment
      const originalCreateElement = document.createElement;
      document.createElement = jest.fn().mockImplementation((tag) => {
        if (tag === 'script') {
          return null;
        }
        return originalCreateElement.call(document, tag);
      });

      render(<OutfitScorer />);
      
      // Verify fallback content is shown
      expect(screen.getByText(/please enable javascript/i)).toBeInTheDocument();

      // Restore original createElement
      document.createElement = originalCreateElement;
    });

    it('provides fallback for unsupported browsers', () => {
      // Mock unsupported browser
      const originalUserAgent = navigator.userAgent;
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Legacy Browser',
        writable: true
      });

      render(<OutfitScorer />);
      
      // Verify compatibility message
      expect(screen.getByText(/browser not supported/i)).toBeInTheDocument();

      // Restore original userAgent
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        writable: true
      });
    });
  });
}); 