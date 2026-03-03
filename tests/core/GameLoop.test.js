import { GameLoop } from '../../js/core/GameLoop.js';

describe('GameLoop', () => {
  let updateFn, renderFn, loop;

  beforeEach(() => {
    updateFn = jest.fn();
    renderFn = jest.fn();
    loop = new GameLoop(updateFn, renderFn);
  });

  afterEach(() => {
    loop.stop();
  });

  test('should not be running initially', () => {
    expect(loop.running).toBe(false);
  });

  test('start() sets running to true', () => {
    loop.start();
    expect(loop.running).toBe(true);
  });

  test('stop() sets running to false', () => {
    loop.start();
    loop.stop();
    expect(loop.running).toBe(false);
  });

  test('start() does nothing if already running', () => {
    loop.start();
    const rafId = loop.rafId;
    loop.start();
    expect(loop.rafId).toBe(rafId);
  });

  test('_loop calls update and render', () => {
    loop.lastTime = 1000;
    loop.running = true;
    loop._loop(1016); // ~16ms = 1 frame
    expect(updateFn).toHaveBeenCalled();
    expect(renderFn).toHaveBeenCalled();
  });

  test('delta time is clamped to maxDeltaTime', () => {
    loop.lastTime = 0;
    loop.running = true;
    loop._loop(1000); // 1 second gap
    const dt = updateFn.mock.calls[0][0];
    expect(dt).toBeLessThanOrEqual(loop.maxDeltaTime);
  });

  test('_loop does nothing when not running', () => {
    loop.running = false;
    loop._loop(1000);
    expect(updateFn).not.toHaveBeenCalled();
  });
});
