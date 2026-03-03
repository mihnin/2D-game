import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../config/constants.js';
import { BACKGROUND_REGIONS } from '../config/spriteData.js';

export class MenuScene {
  constructor(sceneManager, inputManager, assetLoader) {
    this.sceneManager = sceneManager;
    this.input = inputManager;
    this.assets = assetLoader;
    this.pulseTimer = 0;
    this.showControls = false;
  }

  enter() {
    this.showControls = false;
    this.pulseTimer = 0;
  }

  exit() {}

  update(dt) {
    this.pulseTimer += dt * 3;

    if (this.showControls) {
      if (this.input.isKeyPressed('Escape') || this.input.isKeyPressed('Space') || this.input.isKeyPressed('Enter') || this.input.isKeyPressed('KeyC')) {
        this.showControls = false;
      }
    } else {
      if (this.input.isKeyPressed('Space') || this.input.isKeyPressed('Enter')) {
        this.sceneManager.switch('game');
      }
      if (this.input.isKeyPressed('KeyC')) {
        this.showControls = true;
      }
      if (this.input.isKeyPressed('KeyH')) {
        this.sceneManager.switch('help');
      }
    }
  }

  render(ctx) {
    // Dark background
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw background image (level 1, dimmed)
    const bgImg = this.assets.get('backgrounds');
    if (bgImg) {
      ctx.globalAlpha = 0.3;
      const r = BACKGROUND_REGIONS.level1;
      ctx.drawImage(bgImg, r.x, r.y, r.w, r.h, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.globalAlpha = 1;
    }

    if (this.showControls) {
      this.renderControls(ctx);
      return;
    }

    // Title
    ctx.save();
    ctx.textAlign = 'center';

    // Title shadow
    ctx.fillStyle = '#000';
    ctx.font = 'bold 52px Arial';
    ctx.fillText('BOXING', CANVAS_WIDTH / 2 + 2, 162);
    ctx.fillText('LIBERATION', CANVAS_WIDTH / 2 + 2, 222);

    // Title text
    ctx.fillStyle = COLORS.accent;
    ctx.font = 'bold 52px Arial';
    ctx.fillText('BOXING', CANVAS_WIDTH / 2, 160);

    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 52px Arial';
    ctx.fillText('LIBERATION', CANVAS_WIDTH / 2, 220);

    // Subtitle
    ctx.fillStyle = COLORS.secondary;
    ctx.font = '16px Arial';
    ctx.fillText('POSTAPOCALYPTIC BEAT-EM-UP', CANVAS_WIDTH / 2, 255);

    // Start button (pulsing)
    const pulse = Math.sin(this.pulseTimer) * 0.15 + 0.85;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = COLORS.accent;
    const btnW = 260;
    const btnH = 50;
    const btnX = (CANVAS_WIDTH - btnW) / 2;
    const btnY = 320;

    // Button background
    ctx.fillRect(btnX, btnY, btnW, btnH);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 22px Arial';
    ctx.fillText('START GAME', CANVAS_WIDTH / 2, btnY + 33);

    ctx.globalAlpha = 1;

    // Controls hint
    ctx.fillStyle = COLORS.secondary;
    ctx.font = '16px Arial';
    ctx.fillText('Press SPACE or ENTER to start', CANVAS_WIDTH / 2, 420);
    ctx.fillText('Press C for controls  |  Press H for help', CANVAS_WIDTH / 2, 450);

    ctx.restore();
  }

  renderControls(ctx) {
    // Overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.accent;
    ctx.font = 'bold 32px Arial';
    ctx.fillText('CONTROLS', CANVAS_WIDTH / 2, 70);

    const controls = [
      ['Move Left / Right', 'Arrow Keys or A / D'],
      ['Move Up / Down', 'Arrow Up/Down or W / S'],
      ['Jump', 'Space'],
      ['Punch', 'Left Ctrl or Right Click'],
      ['Pause', 'Escape'],
      ['Mute / Unmute', 'N'],
    ];

    ctx.font = '18px Arial';
    let y = 140;
    for (const [action, key] of controls) {
      ctx.fillStyle = COLORS.text;
      ctx.textAlign = 'right';
      ctx.fillText(action, CANVAS_WIDTH / 2 - 20, y);

      ctx.fillStyle = COLORS.combo;
      ctx.textAlign = 'left';
      ctx.fillText(key, CANVAS_WIDTH / 2 + 20, y);
      y += 45;
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.secondary;
    ctx.font = '14px Arial';
    ctx.fillText('Press SPACE or ESC to go back', CANVAS_WIDTH / 2, 420);
    ctx.restore();
  }
}
