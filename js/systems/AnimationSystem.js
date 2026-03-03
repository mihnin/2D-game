// Manages animation state for entities
export class AnimationController {
  constructor(spriteConfig) {
    this.config = spriteConfig;
    this.currentAnimation = null;
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.finished = false;
  }

  play(animationName) {
    if (this.currentAnimation === animationName) return;
    this.currentAnimation = animationName;
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.finished = false;
  }

  update(dt) {
    const anim = this.getAnimation();
    if (!anim || this.finished) return;

    const fps = anim.fps || 8;
    const frameDuration = 1 / fps;
    this.frameTimer += dt;

    if (this.frameTimer >= frameDuration) {
      this.frameTimer -= frameDuration;
      const totalFrames = this._getTotalFrames(anim);
      this.currentFrame++;

      if (this.currentFrame >= totalFrames) {
        if (anim.loop) {
          this.currentFrame = 0;
        } else {
          this.currentFrame = totalFrames - 1;
          this.finished = true;
        }
      }
    }
  }

  getAnimation() {
    if (!this.currentAnimation) return null;
    const anims = this.config.animations;
    return anims[this.currentAnimation] || null;
  }

  _getTotalFrames(anim) {
    // Grid-based animation (hero) has a 'frames' number
    if (typeof anim.frames === 'number') return anim.frames;
    // Array-based animation (enemy) has frames array
    if (Array.isArray(anim.frames)) return anim.frames.length;
    return 1;
  }

  // Get current frame data for rendering
  getCurrentFrameData() {
    const anim = this.getAnimation();
    if (!anim) return null;

    // Grid-based (hero): return row, col
    if (typeof anim.frames === 'number') {
      return {
        type: 'grid',
        row: anim.row,
        col: (anim.col || 0) + this.currentFrame,
      };
    }

    // Array-based (enemy): return frame rect
    if (Array.isArray(anim.frames)) {
      return {
        type: 'rect',
        frame: anim.frames[this.currentFrame],
      };
    }

    return null;
  }

  isFinished() {
    return this.finished;
  }

  getCurrentAnimationName() {
    return this.currentAnimation;
  }
}
