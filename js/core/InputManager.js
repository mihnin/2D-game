export class InputManager {
  constructor() {
    this.keys = {};
    this.justPressed = {};
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onContextMenu = this._onContextMenu.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
  }

  init() {
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);
    document.addEventListener('contextmenu', this._onContextMenu);
    document.addEventListener('mousedown', this._onMouseDown);
    document.addEventListener('mouseup', this._onMouseUp);
  }

  destroy() {
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup', this._onKeyUp);
    document.removeEventListener('contextmenu', this._onContextMenu);
    document.removeEventListener('mousedown', this._onMouseDown);
    document.removeEventListener('mouseup', this._onMouseUp);
  }

  _onKeyDown(e) {
    if (!this.keys[e.code]) {
      this.justPressed[e.code] = true;
    }
    this.keys[e.code] = true;
    // Prevent default for game keys
    if (['Space', 'ControlLeft', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Escape'].includes(e.code)) {
      e.preventDefault();
    }
  }

  _onKeyUp(e) {
    this.keys[e.code] = false;
  }

  _onContextMenu(e) {
    e.preventDefault();
  }

  _onMouseDown(e) {
    if (e.button === 2) { // Right mouse button
      this.keys['RightClick'] = true;
      this.justPressed['RightClick'] = true;
    }
  }

  _onMouseUp(e) {
    if (e.button === 2) {
      this.keys['RightClick'] = false;
    }
  }

  isKeyDown(code) {
    return !!this.keys[code];
  }

  isKeyPressed(code) {
    return !!this.justPressed[code];
  }

  // Call at the end of each frame to clear one-shot presses
  update() {
    this.justPressed = {};
  }

  // Helper: is move left pressed
  isLeft() {
    return this.isKeyDown('ArrowLeft') || this.isKeyDown('KeyA');
  }

  isRight() {
    return this.isKeyDown('ArrowRight') || this.isKeyDown('KeyD');
  }

  isJump() {
    return this.isKeyPressed('Space');
  }

  isPunch() {
    return this.isKeyPressed('ControlLeft') || this.isKeyPressed('ControlRight') || this.isKeyPressed('RightClick');
  }

  isPause() {
    return this.isKeyPressed('Escape');
  }
}
