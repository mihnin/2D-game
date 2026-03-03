import { Entity } from './Entity.js';
import { AnimationController } from '../systems/AnimationSystem.js';
import { HERO_SPRITES } from '../config/spriteData.js';
import {
  PLAYER_MAX_HP, PLAYER_SPEED, PLAYER_START_X, PLAYER_START_Y,
  JUMP_VELOCITY, PLAYER_INVULNERABILITY_TIME,
  PUNCH_DURATION, HURT_DURATION, WORLD_WIDTH,
  MIN_WALK_Y, MAX_WALK_Y, PLAYER_SPEED_Y, GRAVITY,
} from '../config/constants.js';

// Player states
export const PlayerState = {
  IDLE: 'idle',
  WALKING: 'walking',
  JUMPING: 'jumping',
  PUNCHING: 'punching',
  HURT: 'hurt',
  DEAD: 'dead',
};

export class Player extends Entity {
  constructor() {
    // Draw size for the player on screen
    const drawWidth = 80;
    const drawHeight = 130;
    super(PLAYER_START_X, PLAYER_START_Y, drawWidth, drawHeight, PLAYER_MAX_HP);

    this.animation = new AnimationController(HERO_SPRITES);
    this.state = PlayerState.IDLE;
    this.groundY = PLAYER_START_Y;
    this.invulnerable = false;
    this.invulnerableTimer = 0;
    this.punchTimer = 0;
    this.hurtTimer = 0;
    this.isOnGround = true;
    this.flashVisible = true;
    this.flashTimer = 0;
    this.walkDirY = 0;

    // Hitbox for punch attacks (relative to player position)
    this.attackBox = null;

    this.animation.play('idle');
  }

  handleInput(input) {
    if (this.state === PlayerState.DEAD) return;
    if (this.state === PlayerState.HURT) return;

    // Punch
    if (input.isPunch() && this.state !== PlayerState.JUMPING && this.state !== PlayerState.PUNCHING) {
      this.startPunch();
      return;
    }

    // Jump
    if (input.isJump() && this.isOnGround && this.state !== PlayerState.PUNCHING) {
      this.startJump();
      return;
    }

    // Movement (can move while jumping)
    if (this.state !== PlayerState.PUNCHING) {
      if (input.isRight()) {
        this.velocityX = PLAYER_SPEED;
        this.facingRight = true;
        if (this.isOnGround) {
          this.state = PlayerState.WALKING;
          this.animation.play('walkForward');
        }
      } else if (input.isLeft()) {
        this.velocityX = -PLAYER_SPEED;
        this.facingRight = false;
        if (this.isOnGround) {
          this.state = PlayerState.WALKING;
          this.animation.play('walkBack');
        }
      } else {
        this.velocityX = 0;
        if (this.isOnGround && this.state === PlayerState.WALKING) {
          this.state = PlayerState.IDLE;
          this.animation.play('idle');
        }
      }

      // Y-axis depth movement — store direction, apply in update()
      if (this.isOnGround) {
        if (input.isUp()) {
          this.walkDirY = -1;
        } else if (input.isDown()) {
          this.walkDirY = 1;
        } else {
          this.walkDirY = 0;
        }
      }
    }
  }

  startPunch() {
    this.state = PlayerState.PUNCHING;
    this.punchTimer = PUNCH_DURATION;
    this.velocityX = 0;
    this.animation.play(this.facingRight ? 'punchLeft' : 'punchRight');
    this.updateAttackBox();
  }

  startJump() {
    this.state = PlayerState.JUMPING;
    this.isOnGround = false;
    this.velocityY = JUMP_VELOCITY;
    this.animation.play('jumpUp');
  }

  onLand() {
    this.isOnGround = true;
    if (this.state === PlayerState.JUMPING) {
      this.state = PlayerState.IDLE;
      this.animation.play('idle');
    }
  }

  takeDamage(amount) {
    if (this.invulnerable || this.state === PlayerState.DEAD) return;

    super.takeDamage(amount);

    if (!this.isAlive()) {
      this.state = PlayerState.DEAD;
      this.velocityX = 0;
      return;
    }

    this.state = PlayerState.HURT;
    this.hurtTimer = HURT_DURATION;
    this.velocityX = 0;
    this.invulnerable = true;
    this.invulnerableTimer = PLAYER_INVULNERABILITY_TIME;
  }

  updateAttackBox() {
    if (this.state === PlayerState.PUNCHING) {
      const attackWidth = 50;
      const attackHeight = 40;
      this.attackBox = {
        x: this.facingRight ? this.x + this.width : this.x - attackWidth,
        y: this.y + 20,
        width: attackWidth,
        height: attackHeight,
      };
    } else {
      this.attackBox = null;
    }
  }

  update(dt) {
    // Update timers
    if (this.invulnerable) {
      this.invulnerableTimer -= dt * 1000;
      this.flashTimer += dt * 1000;
      // Blink effect every 100ms
      if (this.flashTimer >= 100) {
        this.flashVisible = !this.flashVisible;
        this.flashTimer = 0;
      }
      if (this.invulnerableTimer <= 0) {
        this.invulnerable = false;
        this.flashVisible = true;
      }
    }

    // Hurt recovery
    if (this.state === PlayerState.HURT) {
      this.hurtTimer -= dt * 1000;
      if (this.hurtTimer <= 0) {
        this.state = PlayerState.IDLE;
        this.animation.play('idle');
      }
    }

    // Punch duration
    if (this.state === PlayerState.PUNCHING) {
      this.punchTimer -= dt * 1000;
      if (this.punchTimer <= 0) {
        this.state = PlayerState.IDLE;
        this.attackBox = null;
        this.animation.play('idle');
      }
    }

    // Jump animation states
    if (this.state === PlayerState.JUMPING) {
      if (this.velocityY < -100) {
        this.animation.play('jumpUp');
      } else if (this.velocityY < 100) {
        this.animation.play('jumpAir');
      } else {
        this.animation.play('jumpLand');
      }
    }

    // Apply gravity for jumping
    if (!this.isOnGround) {
      this.velocityY += GRAVITY * dt;
      this.y += this.velocityY * dt;

      // Ground check — land at current groundY
      if (this.y >= this.groundY) {
        this.y = this.groundY;
        this.velocityY = 0;
        this.onLand();
      }
    }

    // Y-axis depth movement (when on ground)
    if (this.isOnGround && this.walkDirY !== 0) {
      this.groundY += this.walkDirY * PLAYER_SPEED_Y * dt;
      if (this.groundY < MIN_WALK_Y) this.groundY = MIN_WALK_Y;
      if (this.groundY > MAX_WALK_Y) this.groundY = MAX_WALK_Y;
      this.y = this.groundY;
    }

    // Horizontal movement
    this.x += this.velocityX * dt;

    // Clamp position to world bounds
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > WORLD_WIDTH) this.x = WORLD_WIDTH - this.width;

    // Update attack box position
    this.updateAttackBox();

    // Update animation
    this.animation.update(dt);
  }

  reset() {
    this.x = PLAYER_START_X;
    this.y = PLAYER_START_Y;
    this.hp = PLAYER_MAX_HP;
    this.alive = true;
    this.state = PlayerState.IDLE;
    this.velocityX = 0;
    this.velocityY = 0;
    this.invulnerable = false;
    this.isOnGround = true;
    this.flashVisible = true;
    this.attackBox = null;
    this.groundY = PLAYER_START_Y;
    this.walkDirY = 0;
    this.animation.play('idle');
  }
}
