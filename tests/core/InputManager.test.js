import { InputManager } from '../../js/core/InputManager.js';

describe('InputManager', () => {
  let input;

  beforeEach(() => {
    input = new InputManager();
    input.init();
  });

  afterEach(() => {
    input.destroy();
  });

  test('should track key down state', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight' }));
    expect(input.isKeyDown('ArrowRight')).toBe(true);
  });

  test('should track key up state', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight' }));
    document.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowRight' }));
    expect(input.isKeyDown('ArrowRight')).toBe(false);
  });

  test('isKeyPressed returns true only once per press', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
    expect(input.isKeyPressed('Space')).toBe(true);
    input.update(); // clear justPressed
    expect(input.isKeyPressed('Space')).toBe(false);
  });

  test('isLeft() detects ArrowLeft and KeyA', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowLeft' }));
    expect(input.isLeft()).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowLeft' }));

    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }));
    expect(input.isLeft()).toBe(true);
  });

  test('isRight() detects ArrowRight and KeyD', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight' }));
    expect(input.isRight()).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowRight' }));

    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD' }));
    expect(input.isRight()).toBe(true);
  });

  test('isJump() detects Space press', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
    expect(input.isJump()).toBe(true);
  });

  test('isPunch() detects ControlLeft', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'ControlLeft' }));
    expect(input.isPunch()).toBe(true);
  });

  test('isPause() detects Escape', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' }));
    expect(input.isPause()).toBe(true);
  });

  test('destroy removes event listeners', () => {
    input.destroy();
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
    expect(input.isKeyDown('Space')).toBeFalsy();
  });
});
