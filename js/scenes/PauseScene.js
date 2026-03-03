import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../config/constants.js';

export class PauseScene {
  constructor(sceneManager, inputManager) {
    this.sceneManager = sceneManager;
    this.input = inputManager;
    this.gameScene = null;
    this.audio = null;
  }

  enter(data) {
    this.gameScene = data?.gameScene || null;
    this.audio = data?.audio || null;
  }

  exit() {}

  update(dt) {
    if (this.input.isKeyPressed('Escape') || this.input.isKeyPressed('Space')) {
      // Resume game
      if (this.gameScene) {
        if (this.audio) {
          this.audio.resume();
          this.audio.startMusic();
        }
        this.sceneManager.resumeTo('game');
      }
    }
    if (this.input.isKeyPressed('KeyM')) {
      if (this.audio) this.audio.stopMusic();
      this.sceneManager.switch('menu');
    }
  }

  render(ctx) {
    // Render the game scene behind the pause overlay
    if (this.gameScene) {
      this.gameScene.render(ctx);
    }

    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    ctx.textAlign = 'center';

    // PAUSE title
    ctx.fillStyle = COLORS.accent;
    ctx.font = 'bold 56px Arial';
    ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);

    // Instructions
    ctx.fillStyle = COLORS.text;
    ctx.font = '18px Arial';
    ctx.fillText('Press SPACE or ESC to continue', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);

    ctx.fillStyle = COLORS.secondary;
    ctx.font = '16px Arial';
    ctx.fillText('Press M for main menu', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 65);

    ctx.restore();
  }
}
