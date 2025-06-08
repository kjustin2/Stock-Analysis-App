/// <reference types="jest" />
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OutfitScorer from './OutfitScorer';
import '@testing-library/jest-dom';

// Mock the necessary modules
let dropCallback: (files: File[]) => void;
jest.mock('react-dropzone', () => ({
  useDropzone: ({ onDrop }: { onDrop: (files: File[]) => void }) => {
    dropCallback = onDrop;
    return {
      getRootProps: () => ({
        onClick: () => {
          const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
          onDrop([file]);
        }
      }),
      getInputProps: () => ({
        'data-testid': 'file-input'
      }),
      isDragActive: false
    };
  }
}));

// Mock the image processing module
const mockProcessImage = jest.fn();
jest.mock('../utils/imageProcessing', () => {
  let modelLoaded = false;
  return {
    loadModel: async () => {
      modelLoaded = true;
      return Promise.resolve();
    },
    processImage: async (...args) => {
      if (!modelLoaded) {
        throw new Error('Model not loaded');
      }
      return mockProcessImage(...args);
    }
  };
});

describe('OutfitScorer', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Set up default mock implementation
    mockProcessImage.mockResolvedValue({
      items: [
        {
          label: 'suit',
          confidence: 0.9,
          category: 'formal'
        }
      ]
    });

    // Mock URL.createObjectURL
    URL.createObjectURL = jest.fn().mockReturnValue('mock-image-url');
  });

  afterEach(() => {
    // Clean up
    jest.resetAllMocks();
  });

  it('renders without crashing', () => {
    render(<OutfitScorer />);
    expect(screen.getByTestId('file-input')).toBeInTheDocument();
  });

  it('shows loading state when processing image', async () => {
    // Set up a delayed mock to ensure loading state is visible
    let resolvePromise: (value: any) => void;
    mockProcessImage.mockImplementation(() => new Promise(resolve => {
      resolvePromise = resolve;
    }));

    render(<OutfitScorer />);
    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    dropCallback([file]);

    // Wait for loading state
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    });

    // Resolve the promise to complete the test
    resolvePromise!({
      items: [{ label: 'suit', confidence: 0.9, category: 'formal' }]
    });
  });

  it('displays results after processing', async () => {
    render(<OutfitScorer />);
    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    dropCallback([file]);

    // Wait for results
    await waitFor(() => {
      expect(screen.getByTestId('score-display')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('handles errors gracefully', async () => {
    // Mock an error response
    mockProcessImage.mockRejectedValue(new Error('Failed to process image'));

    render(<OutfitScorer />);
    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    dropCallback([file]);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toBeInTheDocument();
    });
  });
}); 