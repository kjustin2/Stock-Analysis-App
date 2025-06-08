import React from 'react';
import { render } from '@testing-library/react';
import OutfitScorer from '../components/OutfitScorer';

describe('Hydration Tests', () => {
  it('renders OutfitScorer without crashing', () => {
    const { container } = render(<OutfitScorer />);
    expect(container).toBeTruthy();
    expect(container.querySelector('.max-w-4xl')).toBeTruthy();
  });
}); 