import '@testing-library/jest-dom';
import 'jest-canvas-mock';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock ResizeObserver
const mockResizeObserver = jest.fn();
mockResizeObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.ResizeObserver = mockResizeObserver;

// Mock window.URL.createObjectURL
if (typeof window.URL.createObjectURL === 'undefined') {
  Object.defineProperty(window.URL, 'createObjectURL', {
    value: jest.fn()
  });
}

// Mock window.URL.revokeObjectURL
if (typeof window.URL.revokeObjectURL === 'undefined') {
  Object.defineProperty(window.URL, 'revokeObjectURL', {
    value: jest.fn()
  });
}

// Use jest-canvas-mock for canvas mocking
// This package provides proper TypeScript support and handles all canvas contexts

// Mock performance.now
if (typeof window.performance === 'undefined') {
  Object.defineProperty(window, 'performance', {
    value: {
      now: jest.fn(() => Date.now())
    }
  });
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    text: () => Promise.resolve(''),
    status: 200,
    statusText: 'OK',
    headers: new Headers()
  })
) as jest.Mock;

// Increase Jest timeout for all tests
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

console.error = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning:') || args[0].includes('Error:'))
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};

console.warn = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Warning:')
  ) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

console.log = (...args: any[]) => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }
  originalConsoleLog.apply(console, args);
};

// Mock canvas and its context for TensorFlow.js
const mockContext = {
  drawImage: jest.fn(),
  getImageData: jest.fn(() => ({
    data: new Uint8ClampedArray(100),
    width: 10,
    height: 10,
  })),
  canvas: document.createElement('canvas'),
  getContextAttributes: jest.fn(),
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
} as unknown as CanvasRenderingContext2D;

// Override getContext with proper type handling
const originalGetContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function(contextId: string, options?: any) {
  if (contextId === '2d') return mockContext;
  if (contextId === 'bitmaprenderer') {
    return {
      transferFromImageBitmap: jest.fn(),
      canvas: this
    } as unknown as ImageBitmapRenderingContext;
  }
  if (contextId === 'webgl' || contextId === 'webgl2') {
    return null; // We don't need WebGL for our tests
  }
  return originalGetContext.call(this, contextId, options);
};

// Mock Image for TensorFlow.js
class MockImage implements Partial<HTMLImageElement> {
  onload: () => void = () => {};
  src: string = '';
  width: number = 300;
  height: number = 300;
  
  constructor() {
    setTimeout(() => this.onload(), 100);
  }
}

(global as any).Image = MockImage;

// Mock TensorFlow.js
jest.mock('@tensorflow/tfjs', () => ({
  setBackend: jest.fn(),
  browser: {
    fromPixels: jest.fn()
  },
  ready: jest.fn().mockResolvedValue(true),
  getBackend: jest.fn().mockReturnValue('webgl')
}));

// Mock TensorFlow.js models
jest.mock('@tensorflow-models/mobilenet', () => ({
  load: jest.fn().mockResolvedValue({
    classify: jest.fn().mockResolvedValue([])
  })
}));

jest.mock('@tensorflow-models/coco-ssd', () => ({
  load: jest.fn().mockResolvedValue({
    detect: jest.fn().mockResolvedValue([])
  })
}));

jest.mock('@tensorflow-models/blazeface', () => ({
  load: jest.fn().mockResolvedValue({
    estimateFaces: jest.fn().mockResolvedValue([])
  })
}));

// Add any global test setup here 