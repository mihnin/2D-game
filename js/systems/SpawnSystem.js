import { Enemy } from '../entities/Enemy.js';
import {
  ENEMY_MAX_ON_SCREEN, MIN_WALK_Y, MAX_WALK_Y, CANVAS_WIDTH,
  BOSS_HP_MULTIPLIER, BOSS_SIZE_MULTIPLIER, BOSS_SPEED_MULTIPLIER,
} from '../config/constants.js';

export class SpawnSystem {
  constructor() {
    this.enemies = [];
    this.spawnTimer = 0;
    this.spawnInterval = 3000;
    this.enemyHP = 30;
    this.speedMultiplier = 1.0;
    this.bossSpawned = false;
    this.hasBoss = false;
  }

  configure(levelConfig) {
    this.spawnInterval = levelConfig.spawnInterval;
    this.enemyHP = levelConfig.enemyHP;
    this.speedMultiplier = levelConfig.enemySpeedMultiplier;
    this.hasBoss = levelConfig.boss || false;
  }

  update(dt, cameraX, player) {
    // Remove dead enemies
    this.enemies = this.enemies.filter((e) => !e.isDead());

    // Spawn timer
    this.spawnTimer += dt * 1000;
    if (this.spawnTimer >= this.spawnInterval && this.enemies.length < ENEMY_MAX_ON_SCREEN) {
      this.spawn(cameraX, player);
      this.spawnTimer = 0;
    }

    // Spawn boss once on boss levels
    if (this.hasBoss && !this.bossSpawned) {
      this.spawnBoss(cameraX, player);
      this.bossSpawned = true;
    }

    // Update all enemies
    for (const enemy of this.enemies) {
      enemy.update(dt);
    }
  }

  spawn(cameraX, player) {
    // Spawn enemy off right edge of screen at random Y depth
    const spawnX = cameraX + CANVAS_WIDTH + 50;
    const spawnY = MIN_WALK_Y + Math.random() * (MAX_WALK_Y - MIN_WALK_Y);

    const enemyType = Math.random() < 0.5 ? 'enemy2' : 'enemy3';
    const enemy = new Enemy(spawnX, spawnY, this.enemyHP, this.speedMultiplier, enemyType);
    if (player) enemy.setTarget(player);
    this.enemies.push(enemy);
    return enemy;
  }

  spawnBoss(cameraX, player) {
    const spawnX = cameraX + CANVAS_WIDTH + 100;
    const spawnY = MIN_WALK_Y + (MAX_WALK_Y - MIN_WALK_Y) / 2;

    const bossHP = Math.round(this.enemyHP * BOSS_HP_MULTIPLIER);
    const bossSpeed = this.speedMultiplier * BOSS_SPEED_MULTIPLIER;
    const enemy = new Enemy(spawnX, spawnY, bossHP, bossSpeed, 'enemy3');
    enemy.width = Math.round(enemy.width * BOSS_SIZE_MULTIPLIER);
    enemy.height = Math.round(enemy.height * BOSS_SIZE_MULTIPLIER);
    enemy.isBoss = true;
    if (player) enemy.setTarget(player);
    this.enemies.push(enemy);
    return enemy;
  }

  getEnemies() {
    return this.enemies;
  }

  reset() {
    this.enemies = [];
    this.spawnTimer = 0;
    this.bossSpawned = false;
  }
}
