import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, CAMERA_SHAKE_INTENSITY, CAMERA_SHAKE_DURATION, MAX_WALK_Y, LEVEL_ANNOUNCE_DURATION } from '../config/constants.js';
import { HERO_SPRITES, BACKGROUND_REGIONS } from '../config/spriteData.js';
import { Player, PlayerState } from '../entities/Player.js';
import { Camera } from '../core/Camera.js';
import { EventBus } from '../core/EventBus.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { SpawnSystem } from '../systems/SpawnSystem.js';
import { LevelSystem } from '../systems/LevelSystem.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';

export class GameScene {
  constructor(sceneManager, inputManager, assetLoader, audioManager) {
    this.sceneManager = sceneManager;
    this.input = inputManager;
    this.assets = assetLoader;
    this.audio = audioManager || null;
    this.eventBus = new EventBus();
    this.camera = new Camera();
    this.collision = new CollisionSystem();
    this.combat = new CombatSystem(this.eventBus);
    this.spawner = new SpawnSystem();
    this.levels = new LevelSystem(this.eventBus);
    this.particles = new ParticleSystem();
    this.player = null;
    this.wasPunching = false;
    this.wasOnGround = true;
    this.currentBgKey = 'level1';
    this.hitstopTimer = 0;
    this.levelAnnounce = null; // { name, timer }
  }

  enter() {
    this.player = new Player();
    this.combat.reset();
    this.spawner.reset();
    this.levels.reset();
    this.particles.clear();
    this.wasPunching = false;
    this.wasOnGround = true;
    this.screenFlash = 0;
    this.hitstopTimer = 0;
    this.levelAnnounce = null;

    // Configure initial level
    this.spawner.configure(this.levels.getCurrentLevel());
    this.currentBgKey = 'level1';

    // Start audio
    if (this.audio) {
      this.audio.resume();
      this.audio.startMusic();
    }

    // Listen for events
    this.eventBus.clear();

    this.eventBus.on('enemyKilled', (data) => {
      this.particles.spawnDamageNumber(data.enemy.x + data.enemy.width / 2, data.enemy.y, data.points);
      // Small camera shake on kill
      this.camera.shake(2, 100);
      this.levels.checkProgression(data.totalScore);
    });

    this.eventBus.on('enemyHit', (data) => {
      this.particles.spawnHitEffect(data.x, data.y);
      if (this.audio) this.audio.playHitSound();
      // Hitstop — brief freeze for punch impact feel
      if (data.hitstopMs) this.hitstopTimer = data.hitstopMs;
    });

    this.eventBus.on('playerHit', () => {
      this.camera.shake(CAMERA_SHAKE_INTENSITY, CAMERA_SHAKE_DURATION);
      if (this.audio) this.audio.playPlayerHurtSound();
    });

    this.eventBus.on('comboUpdate', (data) => {
      if (data.count >= 3) {
        this.screenFlash = 150; // ms
        // Spawn sparks at player's attack position
        if (this.player && this.player.attackBox) {
          const ab = this.player.attackBox;
          this.particles.spawnComboSparks(
            ab.x + ab.width / 2,
            ab.y + ab.height / 2,
            data.multiplier || 2
          );
        }
      }
    });

    this.eventBus.on('levelUp', (data) => {
      this.currentBgKey = data.level.background;
      this.spawner.configure(data.level);
      // Level-up announcement
      this.levelAnnounce = {
        name: `LVL ${data.level.id} — ${data.level.name}`,
        timer: LEVEL_ANNOUNCE_DURATION,
      };
      // Switch music style when entering a new world
      if (this.audio && data.level.musicStyle) {
        this.audio.setMusicStyle(data.level.musicStyle);
      }
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
    if (this.audio) this.audio.stopMusic();
  }

  update(dt) {
    // Mute toggle
    if (this.input.isMute()) {
      if (this.audio) this.audio.toggleMute();
    }

    // Pause
    if (this.input.isPause()) {
      if (this.audio) this.audio.stopMusic();
      this.sceneManager.switch('pause', { gameScene: this, audio: this.audio });
      return;
    }

    // Hitstop — freeze gameplay for impact feel (particles/camera still update)
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt * 1000;
      this.camera.update(dt);
      this.particles.update(dt);
      if (this.screenFlash > 0) {
        this.screenFlash -= dt * 1000;
        if (this.screenFlash < 0) this.screenFlash = 0;
      }
      if (this.levelAnnounce) {
        this.levelAnnounce.timer -= dt * 1000;
        if (this.levelAnnounce.timer <= 0) this.levelAnnounce = null;
      }
      return;
    }

    // Player input and update
    this.player.handleInput(this.input);
    this.player.update(dt);

    // Landing dust particles
    if (!this.wasOnGround && this.player.isOnGround) {
      this.particles.spawnDust(
        this.player.x + this.player.width / 2,
        this.player.y + this.player.height
      );
    }
    this.wasOnGround = this.player.isOnGround;

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

    // Screen flash decay
    if (this.screenFlash > 0) {
      this.screenFlash -= dt * 1000;
      if (this.screenFlash < 0) this.screenFlash = 0;
    }

    // Level announce timer
    if (this.levelAnnounce) {
      this.levelAnnounce.timer -= dt * 1000;
      if (this.levelAnnounce.timer <= 0) this.levelAnnounce = null;
    }
  }

  render(ctx) {
    // Clear
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Background
    this.renderBackground(ctx);

    // Ground line
    ctx.save();
    const groundScreenY = MAX_WALK_Y + this.player.height + this.camera.getDrawY();
    ctx.strokeStyle = 'rgba(212, 165, 116, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, groundScreenY);
    ctx.lineTo(CANVAS_WIDTH, groundScreenY);
    ctx.stroke();
    ctx.restore();

    // Depth-sorted rendering: entities with higher Y are drawn on top
    const enemies = this.spawner.getEnemies();
    const renderables = [];
    for (const enemy of enemies) {
      if (!enemy.isDead()) {
        renderables.push({ type: 'enemy', entity: enemy, y: enemy.y });
      }
    }
    if (this.player.state !== PlayerState.DEAD) {
      renderables.push({ type: 'player', entity: this.player, y: this.player.y });
    }
    renderables.sort((a, b) => a.y - b.y);

    for (const r of renderables) {
      if (r.type === 'enemy') {
        this.renderEnemy(ctx, r.entity);
      } else {
        this.renderPlayer(ctx);
      }
    }

    // Particles (world space)
    this.particles.render(ctx, this.camera);

    // Screen flash overlay (combo effect)
    if (this.screenFlash > 0) {
      const alpha = Math.min(0.3, this.screenFlash / 150 * 0.3);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // Level-up announcement overlay
    if (this.levelAnnounce) {
      const progress = this.levelAnnounce.timer / LEVEL_ANNOUNCE_DURATION;
      const alpha = progress > 0.8 ? (1 - progress) / 0.2 : progress > 0.2 ? 1 : progress / 0.2;
      ctx.save();
      ctx.globalAlpha = alpha * 0.6;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, CANVAS_HEIGHT / 2 - 40, CANVAS_WIDTH, 80);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = COLORS.combo;
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(this.levelAnnounce.name, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 12);
      ctx.restore();
    }

    // HUD
    this.renderHUD(ctx);
  }

  renderBackground(ctx) {
    const region = BACKGROUND_REGIONS[this.currentBgKey];
    if (!region) return;

    const bgImg = this.assets.get(region.sheet || 'backgrounds');
    if (!bgImg) return;

    // Parallax scrolling — background moves at 0.5x camera speed
    const parallaxX = -this.camera.x * 0.5 + this.camera.shakeOffsetX;
    const bgWidth = CANVAS_WIDTH;
    const startX = ((parallaxX % bgWidth) + bgWidth) % bgWidth - bgWidth;

    // Tile background to fill screen
    for (let x = startX; x < CANVAS_WIDTH; x += bgWidth) {
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

    const renderData = enemy.render(ctx, this.camera);
    if (!renderData) return;

    const { frameData, drawX, drawY, flashWhite, enemyType, needsFlip } = renderData;

    const imgKey = enemyType;
    const enemyImg = this.assets.get(imgKey);
    if (!enemyImg) return;

    ctx.save();

    // White flash on hit
    if (flashWhite) {
      ctx.globalAlpha = 0.7;
    }

    if (frameData.type === 'rect' && frameData.frame) {
      const f = frameData.frame;
      let dstW = enemy.width;
      let dstH = enemy.height;
      let offsetX = 0;
      let offsetY = 0;

      // Normalize walk frames: scale proportionally to the widest frame
      // so variable-width source frames don't cause visual jitter
      const animName = enemy.animation.getCurrentAnimationName();
      if (animName && animName.startsWith('walk')) {
        const anim = enemy.animation.getAnimation();
        if (anim && Array.isArray(anim.frames)) {
          let maxW = 0, maxH = 0;
          for (const fr of anim.frames) {
            if (fr.w > maxW) maxW = fr.w;
            if (fr.h > maxH) maxH = fr.h;
          }
          dstW = enemy.width * (f.w / maxW);
          dstH = enemy.height * (f.h / maxH);
          offsetX = (enemy.width - dstW) / 2;
          offsetY = enemy.height - dstH;
        }
      }

      if (needsFlip) {
        ctx.translate(drawX + enemy.width, drawY);
        ctx.scale(-1, 1);
        ctx.drawImage(enemyImg, f.x, f.y, f.w, f.h, offsetX, offsetY, dstW, dstH);
      } else {
        ctx.drawImage(enemyImg, f.x, f.y, f.w, f.h, drawX + offsetX, drawY + offsetY, dstW, dstH);
      }
    }

    ctx.restore();

    // Enemy HP bar (larger for boss)
    if (enemy.isAlive() && enemy.hp < enemy.maxHp) {
      const isBoss = enemy.isBoss;
      const barWidth = isBoss ? 80 : 40;
      const barHeight = isBoss ? 6 : 4;
      const barX = drawX + (enemy.width - barWidth) / 2;
      const barY = drawY - (isBoss ? 16 : 10);
      const hpRatio = enemy.hp / enemy.maxHp;

      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      ctx.fillStyle = isBoss ? COLORS.combo : COLORS.enemyHP;
      ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

      if (isBoss) {
        ctx.fillStyle = COLORS.accent;
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BOSS', drawX + enemy.width / 2, barY - 3);
      }
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
