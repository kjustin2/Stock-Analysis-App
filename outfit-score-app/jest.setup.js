import '@testing-library/jest-dom';

// Mock the TensorFlow.js and model imports
jest.mock('@tensorflow/tfjs', () => ({
  setBackend: jest.fn(),
  browser: {
    fromPixels: jest.fn()
  },
  ready: jest.fn().mockResolvedValue(true),
  getBackend: jest.fn().mockReturnValue('webgl')
}));

jest.mock('@tensorflow-models/mobilenet', () => ({
  load: jest.fn().mockResolvedValue({
    classify: jest.fn().mockResolvedValue([
      { className: 'suit', probability: 0.8 },
      { className: 'dress shirt', probability: 0.7 }
    ])
  })
}));

jest.mock('@tensorflow-models/coco-ssd', () => ({
  load: jest.fn().mockResolvedValue({
    detect: jest.fn().mockResolvedValue([
      { class: 'person', score: 0.9 },
      { class: 'tie', score: 0.85 }
    ])
  })
}));

jest.mock('@tensorflow-models/blazeface', () => ({
  load: jest.fn().mockResolvedValue({
    estimateFaces: jest.fn().mockResolvedValue([{ probability: 0.95 }])
  })
})); 