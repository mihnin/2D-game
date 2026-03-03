import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, CAMERA_SHAKE_INTENSITY, CAMERA_SHAKE_DURATION, GROUND_Y } from '../config/constants.js';
import { HERO_SPRITES, ENEMY_SPRITES, BACKGROUND_REGIONS } from '../config/spriteData.js';
import { Player, PlayerState } from '../entities/Player.js';
import { Camera } from '../core/Camera.js';
import { EventBus } from '../core/EventBus.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { SpawnSystem } from '../systems/SpawnSystem.js';
import { LevelSystem } from '../systems/LevelSystem.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { SpriteSystem } from '../systems/SpriteSystem.js';

export class GameScene {
  constructor(sceneManager, inputManager, assetLoader) {
    this.sceneManager = sceneManager;
    this.input = inputManager;
    this.assets = assetLoader;
    this.eventBus = new EventBus();
    this.camera = new Camera();
    this.collision = new CollisionSystem();
    this.combat = new CombatSystem(this.eventBus);
    this.spawner = new SpawnSystem();
    this.levels = new LevelSystem(this.eventBus);
    this.particles = new ParticleSystem();
    this.sprites = new SpriteSystem(assetLoader);
    this.player = null;
    this.wasPunching = false;
    this.currentBgKey = 'level1';
  }

  enter() {
    this.player = new Player();
    this.combat.reset();
    this.spawner.reset();
    this.levels.reset();
    this.particles.clear();
    this.wasPunching = false;

    // Configure initial level
    this.spawner.configure(this.levels.getCurrentLevel());
    this.currentBgKey = 'level1';

    // Listen for events
    this.eventBus.clear();

    this.eventBus.on('enemyKilled', (data) => {
      this.particles.spawnDamageNumber(data.enemy.x + data.enemy.width / 2, data.enemy.y, data.points);
      this.levels.checkProgression(data.totalScore);
    });

    this.eventBus.on('enemyHit', (data) => {
      this.particles.spawnHitEffect(data.x, data.y);
    });

    this.eventBus.on('playerHit', () => {
      this.camera.shake(CAMERA_SHAKE_INTENSITY, CAMERA_SHAKE_DURATION);
    });

    this.eventBus.on('levelUp', (data) => {
      this.currentBgKey = data.level.background;
      this.spawner.configure(data.level);
    });

    this.eventBus.on('gameOver', (data) => {
      this.sceneManager.switch('gameover', data);
    });

    this.eventBus.on('victory', (data) => {
      this.sceneManager.switch('victory', {
        ...data,
        ...this.combat.getStats(),
      });
    });
  }

  exit() {
    this.eventBus.clear();
  }

  update(dt) {
    // Pause
    if (this.input.isPause()) {
      this.sceneManager.switch('pause', { gameScene: this });
      return;
    }

    // Player input and update
    this.player.handleInput(this.input);
    this.player.update(dt);

    // Track punch end for combo hit tracking
    if (this.wasPunching && this.player.state !== PlayerState.PUNCHING) {
      this.combat.onPunchEnd();
    }
    this.wasPunching = this.player.state === PlayerState.PUNCHING;

    // Spawn and update enemies
    this.spawner.update(dt, this.camera.x, this.player);

    // Collision detection
    const enemies = this.spawner.getEnemies();
    const attackHits = this.collision.checkAttackCollisions(this.player, enemies);
    const contactHits = this.collision.checkContactCollisions(this.player, enemies);

    // Combat processing
    if (attackHits.length > 0) {
      this.combat.processAttackHits(this.player, attackHits);
    }
    if (contactHits.length > 0 && this.player.state !== PlayerState.DEAD) {
      this.combat.processContactDamage(this.player, contactHits);
    }

    // Update combat (combo timer)
    this.combat.update(dt);

    // Camera
    this.camera.follow(this.player);
    this.camera.update(dt);

    // Particles
    this.particles.update(dt);
  }

  render(ctx) {
    // Clear
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Background
    this.renderBackground(ctx);

    // Ground line
    ctx.save();
    const groundScreenY = GROUND_Y + this.player.height + this.camera.getDrawY();
    ctx.strokeStyle = 'rgba(212, 165, 116, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, groundScreenY);
    ctx.lineTo(CANVAS_WIDTH, groundScreenY);
    ctx.stroke();
    ctx.restore();

    // Enemies
    const enemies = this.spawner.getEnemies();
    for (const enemy of enemies) {
      this.renderEnemy(ctx, enemy);
    }

    // Player
    this.renderPlayer(ctx);

    // Particles (world space)
    this.particles.render(ctx, this.camera);

    // HUD
    this.renderHUD(ctx);
  }

  renderBackground(ctx) {
    const bgImg = this.assets.get('backgrounds');
    if (!bgImg) return;

    const region = BACKGROUND_REGIONS[this.currentBgKey];
    if (!region) return;

    // Parallax scrolling — background moves at 0.5x camera speed
    const parallaxX = -this.camera.x * 0.5 + this.camera.shakeOffsetX;
    const bgWidth = CANVAS_WIDTH;
    const startX = parallaxX % bgWidth;

    // Tile background to fill screen
    for (let x = startX - bgWidth; x < CANVAS_WIDTH; x += bgWidth) {
      ctx.drawImage(bgImg, region.x, region.y, region.w, region.h, x, 0, bgWidth, CANVAS_HEIGHT);
    }
  }

  renderPlayer(ctx) {
    if (this.player.state === PlayerState.DEAD) return;
    if (this.player.invulnerable && !this.player.flashVisible) return;

    const drawX = this.player.x + this.camera.getDrawX();
    const drawY = this.player.y + this.camera.getDrawY();
    const frameData = this.player.animation.getCurrentFrameData();
    if (!frameData || frameData.type !== 'grid') return;

    const heroImg = this.assets.get('hero');
    if (!heroImg) return;

    const fw = HERO_SPRITES.frameWidth;
    const fh = HERO_SPRITES.frameHeight;
    const sx = frameData.col * fw;
    const sy = frameData.row * fh;

    ctx.drawImage(heroImg, sx, sy, fw, fh, drawX, drawY, this.player.width, this.player.height);
  }

  renderEnemy(ctx, enemy) {
    if (enemy.isDead()) return;

    const drawX = enemy.x + this.camera.getDrawX();
    const drawY = enemy.y + this.camera.getDrawY();
    const frameData = enemy.animation.getCurrentFrameData();
    if (!frameData) return;

    const enemyImg = this.assets.get('enemy');
    if (!enemyImg) return;

    ctx.save();

    // White flash on hit
    if (enemy.flashWhite) {
      ctx.globalAlpha = 0.7;
    }

    if (frameData.type === 'rect' && frameData.frame) {
      const f = frameData.frame;
      ctx.drawImage(enemyImg, f.x, f.y, f.w, f.h, drawX, drawY, enemy.width, enemy.height);
    }

    ctx.restore();

    // Enemy HP bar
    if (enemy.isAlive() && enemy.hp < enemy.maxHp) {
      const barWidth = 40;
      const barHeight = 4;
      const barX = drawX + (enemy.width - barWidth) / 2;
      const barY = drawY - 10;
      const hpRatio = enemy.hp / enemy.maxHp;

      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      ctx.fillStyle = COLORS.enemyHP;
      ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
    }
  }

  renderHUD(ctx) {
    ctx.save();

    // HP bar background
    const hpBarX = 20;
    const hpBarY = 20;
    const hpBarW = 200;
    const hpBarH = 20;
    const hpRatio = this.player.hp / this.player.maxHp;

    ctx.fillStyle = '#333';
    ctx.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);

    // HP bar fill with color gradient based on HP
    let hpColor = COLORS.playerHP;
    if (hpRatio < 0.3) hpColor = COLORS.accent;
    else if (hpRatio < 0.6) hpColor = COLORS.combo;

    ctx.fillStyle = hpColor;
    ctx.fillRect(hpBarX, hpBarY, hpBarW * hpRatio, hpBarH);

    // HP bar border
    ctx.strokeStyle = COLORS.text;
    ctx.lineWidth = 1;
    ctx.strokeRect(hpBarX, hpBarY, hpBarW, hpBarH);

    // HP text
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`HP: ${this.player.hp}/${this.player.maxHp}`, hpBarX + 5, hpBarY + 15);

    // Level display
    const level = this.levels.getCurrentLevel();
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`LVL ${level.id} — ${level.name}`, CANVAS_WIDTH / 2, 35);

    // Score
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 18px Arial';
    ctx.fillText(`SCORE: ${this.combat.getScore()}`, CANVAS_WIDTH - 20, 35);

    // Combo display
    const stats = this.combat.getStats();
    if (stats.comboCount >= 3) {
      ctx.fillStyle = COLORS.combo;
      ctx.font = 'bold 22px Arial';
      ctx.fillText(`COMBO x${stats.comboMultiplier}`, CANVAS_WIDTH - 20, 62);

      ctx.font = 'bold 14px Arial';
      ctx.fillText(`${stats.comboCount} HITS`, CANVAS_WIDTH - 20, 80);
    }

    ctx.restore();
  }
}
