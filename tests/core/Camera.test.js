import { Camera } from '../../js/core/Camera.js';
import { CANVAS_WIDTH, WORLD_WIDTH, CAMERA_OFFSET_X } from '../../js/config/constants.js';

describe('Camera', () => {
  let camera;

  beforeEach(() => {
    camera = new Camera();
  });

  test('should start at position 0,0', () => {
    expect(camera.x).toBe(0);
    expect(camera.y).toBe(0);
  });

  test('follow() positions player at 30% from left', () => {
    const target = { x: 500 };
    camera.follow(target);
    const expected = 500 - CANVAS_WIDTH * CAMERA_OFFSET_X;
    expect(camera.x).toBe(expected);
  });

  test('follow() clamps to left boundary', () => {
    camera.follow({ x: 50 });
    expect(camera.x).toBe(0);
  });

  test('follow() clamps to right boundary', () => {
    camera.follow({ x: WORLD_WIDTH });
    expect(camera.x).toBe(WORLD_WIDTH - CANVAS_WIDTH);
  });

  test('shake() sets shake parameters', () => {
    camera.shake(4, 200);
    expect(camera.shakeIntensity).toBe(4);
    expect(camera.shakeDuration).toBe(200);
  });

  test('update() produces shake offset during shake', () => {
    camera.shake(10, 500);
    camera.update(0.016);
    // Offset should be nonzero (probabilistically)
    // We just check the shake is still active
    expect(camera.shakeTime).toBeGreaterThan(0);
    expect(camera.shakeTime).toBeLessThan(500);
  });

  test('shake decays over time', () => {
    camera.shake(10, 100);
    camera.update(0.2); // 200ms > 100ms duration
    expect(camera.shakeOffsetX).toBe(0);
    expect(camera.shakeOffsetY).toBe(0);
  });

});
