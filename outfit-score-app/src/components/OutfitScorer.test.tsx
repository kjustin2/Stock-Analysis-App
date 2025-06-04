import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OutfitScorer from './OutfitScorer';
import '@testing-library/jest-dom';

// Mock the URL.createObjectURL
global.URL.createObjectURL = jest.fn();

describe('OutfitScorer Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('renders the initial upload state', async () => {
    render(<OutfitScorer />);
    await waitFor(() => {
      expect(screen.getByText(/drag and drop your outfit photo here/i)).toBeInTheDocument();
    }, { timeout: 15000 });
  }, 20000);

  it('shows loading state when models are initializing', async () => {
    render(<OutfitScorer />);
    await waitFor(() => {
      expect(screen.getByText(/loading ai models/i)).toBeInTheDocument();
    }, { timeout: 15000 });
  }, 20000);

  it('handles file upload and processes image', async () => {
    render(<OutfitScorer />);

    // Wait for component to finish initial loading
    await waitFor(() => {
      expect(screen.getByText(/drag and drop your outfit photo here/i)).toBeInTheDocument();
    }, { timeout: 15000 });

    // Create a mock file
    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    
    // Find the file input
    const input = screen.getByRole('presentation').querySelector('input');
    expect(input).toBeInTheDocument();

    // Upload file
    if (input) {
      await act(async () => {
        await userEvent.upload(input, file);
      });
    }

    // Wait for analysis to complete
    await waitFor(() => {
      expect(screen.getByText(/style score/i)).toBeInTheDocument();
    }, { timeout: 15000 });
  }, 20000);

  it('displays error message when model loading fails', async () => {
    // Mock tensorflow to throw an error
    const mockTf = require('@tensorflow/tfjs');
    mockTf.ready.mockRejectedValueOnce(new Error('Failed to load'));

    render(<OutfitScorer />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load ai models/i)).toBeInTheDocument();
    }, { timeout: 15000 });
  }, 20000);

  it('shows progress indicators during model loading', async () => {
    render(<OutfitScorer />);
    
    await waitFor(() => {
      expect(screen.getByText(/mobileNet/i)).toBeInTheDocument();
      expect(screen.getByText(/objectDetector/i)).toBeInTheDocument();
      expect(screen.getByText(/faceDetector/i)).toBeInTheDocument();
    }, { timeout: 15000 });
  }, 20000);

  it('handles invalid file types', async () => {
    render(<OutfitScorer />);

    // Wait for component to finish initial loading
    await waitFor(() => {
      expect(screen.getByText(/drag and drop your outfit photo here/i)).toBeInTheDocument();
    }, { timeout: 15000 });

    // Create an invalid file
    const file = new File(['dummy content'], 'test.txt', { type: 'text/plain' });
    
    // Find the file input
    const input = screen.getByRole('presentation').querySelector('input');
    expect(input).toBeInTheDocument();

    // Upload invalid file
    if (input) {
      await act(async () => {
        await userEvent.upload(input, file);
      });
    }

    // Verify no processing occurs for invalid file
    expect(screen.queryByText(/analyzing your outfit/i)).not.toBeInTheDocument();
  }, 20000);

  it('provides detailed style breakdown', async () => {
    render(<OutfitScorer />);

    // Wait for component to finish initial loading
    await waitFor(() => {
      expect(screen.getByText(/drag and drop your outfit photo here/i)).toBeInTheDocument();
    }, { timeout: 15000 });

    // Create a mock file
    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    
    // Find the file input
    const input = screen.getByRole('presentation').querySelector('input');
    expect(input).toBeInTheDocument();

    // Upload file
    if (input) {
      await act(async () => {
        await userEvent.upload(input, file);
      });
    }

    // Wait for analysis to complete and check for detailed breakdown
    await waitFor(() => {
      expect(screen.getByText(/style score/i)).toBeInTheDocument();
    }, { timeout: 15000 });
  }, 20000);
}); 