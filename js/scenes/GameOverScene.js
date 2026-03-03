import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../config/constants.js';

export class GameOverScene {
  constructor(sceneManager, inputManager) {
    this.sceneManager = sceneManager;
    this.input = inputManager;
    this.data = {};
    this.shakeTimer = 0;
    this.shakeOffset = 0;
  }

  enter(data) {
    this.data = data || { score: 0, kills: 0, maxCombo: 0 };
    this.shakeTimer = 500; // 500ms of title shake
  }

  exit() {}

  update(dt) {
    // Title shake effect
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt * 1000;
      this.shakeOffset = (Math.random() - 0.5) * 6;
    } else {
      this.shakeOffset = 0;
    }

    if (this.input.isKeyPressed('Space') || this.input.isKeyPressed('Enter')) {
      this.sceneManager.switch('game');
    }
    if (this.input.isKeyPressed('KeyM') || this.input.isKeyPressed('Escape')) {
      this.sceneManager.switch('menu');
    }
  }

  render(ctx) {
    // Background
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Red vignette
    const gradient = ctx.createRadialGradient(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 100,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH / 2
    );
    gradient.addColorStop(0, 'rgba(233, 69, 96, 0)');
    gradient.addColorStop(1, 'rgba(233, 69, 96, 0.2)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    ctx.textAlign = 'center';

    // DEFEAT title with shake
    ctx.fillStyle = COLORS.accent;
    ctx.font = 'bold 64px Arial';
    ctx.fillText('DEFEAT', CANVAS_WIDTH / 2 + this.shakeOffset, 160);

    // Stats
    ctx.fillStyle = COLORS.text;
    ctx.font = '22px Arial';
    ctx.fillText(`Final Score: ${this.data.score || 0}`, CANVAS_WIDTH / 2, 240);

    ctx.fillStyle = COLORS.secondary;
    ctx.font = '18px Arial';
    ctx.fillText(`Enemies Killed: ${this.data.kills || 0}`, CANVAS_WIDTH / 2, 280);
    ctx.fillText(`Max Combo: ${this.data.maxCombo || 0}`, CANVAS_WIDTH / 2, 310);

    // Buttons
    ctx.fillStyle = COLORS.text;
    ctx.font = '18px Arial';
    ctx.fillText('Press SPACE to try again', CANVAS_WIDTH / 2, 400);

    ctx.fillStyle = COLORS.secondary;
    ctx.font = '14px Arial';
    ctx.fillText('Press M or ESC for main menu', CANVAS_WIDTH / 2, 435);

    ctx.restore();
  }
}
