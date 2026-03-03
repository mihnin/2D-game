// Mock canvas for jsdom
HTMLCanvasElement.prototype.getContext = function (type) {
  if (type === '2d') {
    return {
      canvas: this,
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: '',
      textAlign: '',
      textBaseline: '',
      globalAlpha: 1,
      imageSmoothingEnabled: true,
      save: jest.fn(),
      restore: jest.fn(),
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      strokeRect: jest.fn(),
      beginPath: jest.fn(),
      closePath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      drawImage: jest.fn(),
      fillText: jest.fn(),
      strokeText: jest.fn(),
      measureText: jest.fn(() => ({ width: 0 })),
      translate: jest.fn(),
      scale: jest.fn(),
      rotate: jest.fn(),
      setTransform: jest.fn(),
      resetTransform: jest.fn(),
      createLinearGradient: jest.fn(() => ({
        addColorStop: jest.fn(),
      })),
      createRadialGradient: jest.fn(() => ({
        addColorStop: jest.fn(),
      })),
      clip: jest.fn(),
      rect: jest.fn(),
      roundRect: jest.fn(),
    };
  }
  return null;
};

// Mock requestAnimationFrame
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

// Mock performance.now
if (!global.performance) {
  global.performance = {};
}
global.performance.now = Date.now;

// Mock Image
class MockImage {
  constructor() {
    this.src = '';
    this.width = 0;
    this.height = 0;
    this.onload = null;
    this.onerror = null;
  }
  set src(val) {
    this._src = val;
    if (val && this.onload) {
      setTimeout(() => this.onload(), 0);
    }
  }
  get src() {
    return this._src || '';
  }
}
global.Image = MockImage;
