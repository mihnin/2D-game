import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../config/constants.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';

export class VictoryScene {
  constructor(sceneManager, inputManager) {
    this.sceneManager = sceneManager;
    this.input = inputManager;
    this.data = {};
    this.particles = new ParticleSystem();
    this.confettiTimer = 0;
  }

  enter(data) {
    this.data = data || { score: 0, kills: 0, maxCombo: 0 };
    this.particles.clear();
    this.confettiTimer = 0;
    // Initial burst
    this.particles.spawnConfetti(CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  exit() {
    this.particles.clear();
  }

  update(dt) {
    this.particles.update(dt);

    // Spawn confetti periodically
    this.confettiTimer += dt * 1000;
    if (this.confettiTimer >= 1500) {
      this.confettiTimer = 0;
      this.particles.spawnConfetti(CANVAS_WIDTH, CANVAS_HEIGHT);
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

    // Golden glow
    const gradient = ctx.createRadialGradient(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 50,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH / 2
    );
    gradient.addColorStop(0, 'rgba(255, 193, 7, 0.15)');
    gradient.addColorStop(1, 'rgba(255, 193, 7, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    ctx.textAlign = 'center';

    // VICTORY title
    ctx.fillStyle = COLORS.combo;
    ctx.font = 'bold 64px Arial';
    ctx.fillText('VICTORY!', CANVAS_WIDTH / 2, 140);

    // Subtitle
    ctx.fillStyle = COLORS.text;
    ctx.font = '20px Arial';
    ctx.fillText('The city is liberated!', CANVAS_WIDTH / 2, 185);

    // Stats box
    const boxX = CANVAS_WIDTH / 2 - 150;
    const boxY = 210;
    const boxW = 300;
    const boxH = 160;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = COLORS.combo;
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = COLORS.combo;
    ctx.font = 'bold 18px Arial';
    ctx.fillText('FINAL STATS', CANVAS_WIDTH / 2, 245);

    ctx.fillStyle = COLORS.text;
    ctx.font = '18px Arial';
    ctx.fillText(`Score: ${this.data.score || 0}`, CANVAS_WIDTH / 2, 285);
    ctx.fillText(`Enemies Defeated: ${this.data.kills || 0}`, CANVAS_WIDTH / 2, 315);
    ctx.fillText(`Max Combo: x${this.data.maxCombo || 0}`, CANVAS_WIDTH / 2, 345);

    // Actions
    ctx.fillStyle = COLORS.text;
    ctx.font = '18px Arial';
    ctx.fillText('Press SPACE to play again', CANVAS_WIDTH / 2, 430);

    ctx.fillStyle = COLORS.secondary;
    ctx.font = '14px Arial';
    ctx.fillText('Press M or ESC for main menu', CANVAS_WIDTH / 2, 460);

    ctx.restore();

    // Render confetti particles (UI space, no camera offset)
    this.particles.renderUI(ctx);
  }
}
