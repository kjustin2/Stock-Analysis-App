import '@testing-library/jest-dom';
import { server } from './__mocks__/server';

class ResizeObserverMock {
  private callback: ResizeObserverCallback;
  private elements: Set<Element>;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    this.elements = new Set();
  }

  observe(target: Element) {
    this.elements.add(target);
    // Trigger callback asynchronously to simulate real ResizeObserver behavior
    queueMicrotask(() => {
      this.callback(
        [{
          target,
          contentRect: {
            width: 800,
            height: 600,
            top: 0,
            left: 0,
            bottom: 600,
            right: 800,
            x: 0,
            y: 0,
            toJSON() {
              return {
                width: this.width,
                height: this.height,
                top: this.top,
                left: this.left,
                bottom: this.bottom,
                right: this.right,
                x: this.x,
                y: this.y,
              };
            }
          },
          borderBoxSize: [{
            blockSize: 600,
            inlineSize: 800,
          }],
          contentBoxSize: [{
            blockSize: 600,
            inlineSize: 800,
          }],
          devicePixelContentBoxSize: [{
            blockSize: 600,
            inlineSize: 800,
          }],
        }],
        this
      );
    });
  }

  unobserve(target: Element) {
    this.elements.delete(target);
  }

  disconnect() {
    this.elements.clear();
  }
}

// @ts-ignore - Overriding the ResizeObserver
window.ResizeObserver = ResizeObserverMock;

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close()); 