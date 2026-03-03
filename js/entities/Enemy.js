import { Entity } from './Entity.js';
import { AnimationController } from '../systems/AnimationSystem.js';
import { ENEMY_SPRITES } from '../config/spriteData.js';
import { ENEMY_BASE_SPEED, DEATH_ANIMATION_DURATION } from '../config/constants.js';

export const EnemyState = {
  WALKING: 'walking',
  HURT: 'hurt',
  DYING: 'dying',
  DEAD: 'dead',
};

export class Enemy extends Entity {
  constructor(x, y, hp, speedMultiplier) {
    const drawWidth = 70;
    const drawHeight = 140;
    super(x, y, drawWidth, drawHeight, hp);

    this.animation = new AnimationController(ENEMY_SPRITES);
    this.state = EnemyState.WALKING;
    this.speed = ENEMY_BASE_SPEED * speedMultiplier;
    this.facingRight = false; // Enemies spawn from right, face left
    this.deathTimer = 0;
    this.hurtTimer = 0;
    this.flashTimer = 0;
    this.flashWhite = false;
    this.contactCooldown = 0;

    this.animation.play('walkLeft');
  }

  setTarget(player) {
    this.target = player;
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
        this.animation.update(dt);
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
    if (!this.target) return;

    // Move toward player
    const dx = this.target.x - this.x;
    if (Math.abs(dx) > 5) {
      const direction = dx > 0 ? 1 : -1;
      this.velocityX = direction * this.speed;
      this.facingRight = direction > 0;

      // Update walk animation direction
      if (this.facingRight && this.animation.getCurrentAnimationName() !== 'walkRight') {
        this.animation.play('walkRight');
      } else if (!this.facingRight && this.animation.getCurrentAnimationName() !== 'walkLeft') {
        this.animation.play('walkLeft');
      }
    } else {
      this.velocityX = 0;
    }

    this.x += this.velocityX * dt;
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

    return {
      frameData,
      drawX,
      drawY,
      width: this.width,
      height: this.height,
      flashWhite: this.flashWhite,
    };
  }
}
