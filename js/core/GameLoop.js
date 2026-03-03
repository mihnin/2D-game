export class GameLoop {
  constructor(updateFn, renderFn) {
    this.updateFn = updateFn;
    this.renderFn = renderFn;
    this.running = false;
    this.rafId = null;
    this.lastTime = 0;
    this.maxDeltaTime = 1 / 30; // cap at 30fps min to prevent spiral
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this._loop(this.lastTime);
  }

  stop() {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  _loop(currentTime) {
    if (!this.running) return;

    let dt = (currentTime - this.lastTime) / 1000; // seconds
    this.lastTime = currentTime;

    // Clamp delta time
    if (dt > this.maxDeltaTime) {
      dt = this.maxDeltaTime;
    }

    this.updateFn(dt);
    this.renderFn();

    this.rafId = requestAnimationFrame((t) => this._loop(t));
  }
}
