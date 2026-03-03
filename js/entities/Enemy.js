import { Entity } from './Entity.js';
import { AnimationController } from '../systems/AnimationSystem.js';
import { ENEMY2_SPRITES, ENEMY3_SPRITES } from '../config/spriteData.js';
import { ENEMY_BASE_SPEED, DEATH_ANIMATION_DURATION, WORLD_WIDTH, MIN_WALK_Y, MAX_WALK_Y, ENEMY_Y_DRIFT_SPEED } from '../config/constants.js';

export const EnemyState = {
  WALKING: 'walking',
  HURT: 'hurt',
  DYING: 'dying',
  DEAD: 'dead',
};

const SPRITE_CONFIGS = {
  enemy2: ENEMY2_SPRITES,
  enemy3: ENEMY3_SPRITES,
};

export class Enemy extends Entity {
  constructor(x, y, hp, speedMultiplier, enemyType = 'enemy2') {
    const drawWidth = 70;
    const drawHeight = 140;
    super(x, y, drawWidth, drawHeight, hp);

    this.enemyType = enemyType;
    const spriteConfig = SPRITE_CONFIGS[enemyType] || ENEMY2_SPRITES;
    this.animation = new AnimationController(spriteConfig);
    this.mirrorLeft = spriteConfig.mirrorLeft || false;
    this.state = EnemyState.WALKING;
    this.speed = ENEMY_BASE_SPEED * speedMultiplier;
    this.facingRight = false; // Enemies spawn from right, face left
    this.deathTimer = 0;
    this.hurtTimer = 0;
    this.flashTimer = 0;
    this.flashWhite = false;
    this.contactCooldown = 0;

    // Y-axis drift
    this.yDriftDir = Math.random() < 0.5 ? 1 : -1;
    this.yDriftTimer = 0;
    this.yDriftInterval = 2000 + Math.random() * 2000; // 2-4 sec before direction change

    this.animation.play('walkLeft');
  }

  update(dt) {
    // Decrease contact cooldown
    if (this.contactCooldown > 0) {
      this.contactCooldown -= dt * 1000;
    }

    // Flash timer (white flash on hit)
    if (this.flashWhite) {
      this.flashTimer -= dt * 1000;
      if (this.flashTimer <= 0) {
        this.flashWhite = false;
      }
    }

    switch (this.state) {
      case EnemyState.WALKING:
        this.updateWalking(dt);
        break;
      case EnemyState.HURT:
        this.hurtTimer -= dt * 1000;
        if (this.hurtTimer <= 0) {
          if (this.isAlive()) {
            this.state = EnemyState.WALKING;
            this.animation.play(this.facingRight ? 'walkRight' : 'walkLeft');
          }
        }
        break;
      case EnemyState.DYING:
        this.deathTimer -= dt * 1000;
        if (this.deathTimer <= 0) {
          this.state = EnemyState.DEAD;
        }
        break;
      case EnemyState.DEAD:
        return;
    }

    this.animation.update(dt);
  }

  updateWalking(dt) {
    // Patrol: walk in current direction, reverse at world boundaries
    this.velocityX = (this.facingRight ? 1 : -1) * this.speed;
    this.x += this.velocityX * dt;

    // Reverse direction at world edges
    const margin = 50;
    if (this.x <= margin && !this.facingRight) {
      this.facingRight = true;
      this.animation.play('walkRight');
    } else if (this.x >= WORLD_WIDTH - this.width - margin && this.facingRight) {
      this.facingRight = false;
      this.animation.play('walkLeft');
    }

    // Y-axis drift
    this.yDriftTimer += dt * 1000;
    if (this.yDriftTimer >= this.yDriftInterval) {
      this.yDriftDir *= -1;
      this.yDriftTimer = 0;
      this.yDriftInterval = 2000 + Math.random() * 2000;
    }

    this.y += this.yDriftDir * ENEMY_Y_DRIFT_SPEED * dt;
    if (this.y < MIN_WALK_Y) { this.y = MIN_WALK_Y; this.yDriftDir = 1; }
    if (this.y > MAX_WALK_Y) { this.y = MAX_WALK_Y; this.yDriftDir = -1; }
  }

  takeDamage(amount) {
    if (this.state === EnemyState.DYING || this.state === EnemyState.DEAD) return;

    super.takeDamage(amount);

    // White flash effect
    this.flashWhite = true;
    this.flashTimer = 100;

    if (!this.isAlive()) {
      this.state = EnemyState.DYING;
      this.velocityX = 0;
      this.deathTimer = DEATH_ANIMATION_DURATION;
      // Play death animation based on facing direction
      this.animation.play(this.facingRight ? 'deathRight' : 'deathLeft');
    } else {
      this.state = EnemyState.HURT;
      this.hurtTimer = 200;
      this.velocityX = 0;
    }
  }

  canDealDamage() {
    return this.state === EnemyState.WALKING && this.contactCooldown <= 0;
  }

  resetContactCooldown(cooldown) {
    this.contactCooldown = cooldown;
  }

  isDead() {
    return this.state === EnemyState.DEAD;
  }

  render(ctx, camera) {
    if (this.state === EnemyState.DEAD) return null;

    const drawX = this.x + camera.getDrawX();
    const drawY = this.y + camera.getDrawY();

    const frameData = this.animation.getCurrentFrameData();
    if (!frameData) return null;

    // Determine if we need horizontal flip (enemy2 with left-facing animations)
    const needsFlip = this.mirrorLeft && !this.facingRight;

    return {
      frameData,
      drawX,
      drawY,
      width: this.width,
      height: this.height,
      flashWhite: this.flashWhite,
      enemyType: this.enemyType,
      needsFlip,
    };
  }
}
