import '@testing-library/jest-dom';

// Mock canvas
import 'jest-canvas-mock';

// Mock canvas
const mockCanvas = {
  getContext: () => ({
    getImageData: () => ({
      data: new Uint8ClampedArray(100),
      width: 10,
      height: 10
    }),
    drawImage: () => {}
  })
};

// Mock HTMLCanvasElement
global.HTMLCanvasElement.prototype.getContext = () => mockCanvas.getContext();

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockImplementation(() => ({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
}));
window.IntersectionObserver = mockIntersectionObserver;

// Mock ResizeObserver
const mockResizeObserver = jest.fn();
mockResizeObserver.mockImplementation(() => ({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
}));
window.ResizeObserver = mockResizeObserver;

// Mock TensorFlow.js with more realistic behavior
jest.mock('@tensorflow/tfjs', () => ({
  ready: jest.fn().mockResolvedValue(true),
  loadGraphModel: jest.fn().mockResolvedValue({
    predict: jest.fn().mockReturnValue({
      data: jest.fn().mockResolvedValue(new Float32Array(1000).fill(0.1)),
      dispose: jest.fn()
    }),
    dispose: jest.fn()
  }),
  browser: {
    fromPixels: jest.fn().mockReturnValue({
      resizeNearestNeighbor: jest.fn().mockReturnThis(),
      toFloat: jest.fn().mockReturnThis(),
      expandDims: jest.fn().mockReturnThis(),
      div: jest.fn().mockReturnThis(),
      dispose: jest.fn()
    })
  },
  dispose: jest.fn(),
  tensor: jest.fn().mockReturnValue({
    dispose: jest.fn()
  }),
  tidy: jest.fn().mockImplementation((fn) => fn())
}));

// Mock URL.createObjectURL and revokeObjectURL
if (typeof window !== 'undefined') {
  window.URL.createObjectURL = jest.fn().mockReturnValue('mock-url');
  window.URL.revokeObjectURL = jest.fn();
}

// Mock Image
global.Image = class {
  constructor() {
    setTimeout(() => {
      this.onload?.();
    }, 100);
  }
  
  set src(value) {
    // Simulate image load
    setTimeout(() => {
      this.onload?.();
    }, 100);
  }
};

// Mock console.error to keep test output clean
const originalError = console.error;
console.error = (...args) => {
  if (args[0]?.includes?.('Warning:')) return;
  originalError(...args);
};

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    query: {}
  })
}));

// Mock Next.js image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />;
  }
}));

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