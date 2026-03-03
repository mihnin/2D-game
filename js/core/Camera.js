import { CANVAS_WIDTH, CANVAS_HEIGHT, WORLD_WIDTH, CAMERA_OFFSET_X } from '../config/constants.js';

export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.width = CANVAS_WIDTH;
    this.height = CANVAS_HEIGHT;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
    this.shakeTime = 0;
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
  }

  follow(target) {
    // Player at ~30% from left edge
    const targetX = target.x - this.width * CAMERA_OFFSET_X;
    this.x = Math.max(0, Math.min(targetX, WORLD_WIDTH - this.width));
  }

  shake(intensity, duration) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTime = 0;
  }

  update(dt) {
    if (this.shakeTime < this.shakeDuration) {
      this.shakeTime += dt * 1000;
      if (this.shakeTime >= this.shakeDuration) {
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
      } else {
        const progress = this.shakeTime / this.shakeDuration;
        const decay = 1 - progress;
        this.shakeOffsetX = (Math.random() * 2 - 1) * this.shakeIntensity * decay;
        this.shakeOffsetY = (Math.random() * 2 - 1) * this.shakeIntensity * decay;
      }
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
  }

  getDrawX() {
    return -this.x + this.shakeOffsetX;
  }

  getDrawY() {
    return -this.y + this.shakeOffsetY;
  }

}
