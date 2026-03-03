import { Enemy } from '../entities/Enemy.js';
import { ENEMY_MAX_ON_SCREEN, GROUND_Y, CANVAS_WIDTH } from '../config/constants.js';

export class SpawnSystem {
  constructor() {
    this.enemies = [];
    this.spawnTimer = 0;
    this.spawnInterval = 3000;
    this.enemyHP = 30;
    this.speedMultiplier = 1.0;
  }

  configure(levelConfig) {
    this.spawnInterval = levelConfig.spawnInterval;
    this.enemyHP = levelConfig.enemyHP;
    this.speedMultiplier = levelConfig.enemySpeedMultiplier;
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

    // Update all enemies
    for (const enemy of this.enemies) {
      enemy.update(dt);
    }
  }

  spawn(cameraX, player) {
    // Spawn enemy off right edge of screen
    const spawnX = cameraX + CANVAS_WIDTH + 50;
    const enemyHeight = 120;
    const spawnY = GROUND_Y;

    const enemy = new Enemy(spawnX, spawnY, this.enemyHP, this.speedMultiplier);
    enemy.setTarget(player);
    this.enemies.push(enemy);
    return enemy;
  }

  getEnemies() {
    return this.enemies;
  }

  getAliveEnemies() {
    return this.enemies.filter((e) => e.isAlive() && !e.isDead());
  }

  reset() {
    this.enemies = [];
    this.spawnTimer = 0;
  }
}
