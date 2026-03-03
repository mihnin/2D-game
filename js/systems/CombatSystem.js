import {
  PLAYER_PUNCH_DAMAGE, ENEMY_CONTACT_DAMAGE, ENEMY_CONTACT_COOLDOWN,
  KILL_SCORE, COMBO_TIMEOUT, COMBO_MULTIPLIERS,
} from '../config/constants.js';

export class CombatSystem {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.comboMultiplier = 1;
    this.score = 0;
    this.totalKills = 0;
    this.maxCombo = 0;
    this.hitEnemiesThisPunch = new Set();
  }

  // Process attack hits from collision system
  processAttackHits(player, hitEnemies) {
    for (const enemy of hitEnemies) {
      // Prevent hitting same enemy multiple times per punch
      if (this.hitEnemiesThisPunch.has(enemy)) continue;
      this.hitEnemiesThisPunch.add(enemy);

      enemy.takeDamage(PLAYER_PUNCH_DAMAGE);

      // Update combo
      this.comboCount++;
      this.comboTimer = COMBO_TIMEOUT;
      this.updateComboMultiplier();

      if (this.comboCount > this.maxCombo) {
        this.maxCombo = this.comboCount;
      }

      this.eventBus.emit('comboUpdate', {
        count: this.comboCount,
        multiplier: this.comboMultiplier,
      });

      if (!enemy.isAlive()) {
        const points = KILL_SCORE * this.comboMultiplier;
        this.score += points;
        this.totalKills++;
        this.eventBus.emit('enemyKilled', {
          enemy,
          points,
          totalScore: this.score,
        });
      }

      // Emit hit event for particles
      this.eventBus.emit('enemyHit', {
        x: enemy.x + enemy.width / 2,
        y: enemy.y + 20,
        damage: PLAYER_PUNCH_DAMAGE,
      });
    }
  }

  // Process contact damage from enemies to player
  processContactDamage(player, contactEnemies) {
    for (const enemy of contactEnemies) {
      player.takeDamage(ENEMY_CONTACT_DAMAGE);
      enemy.resetContactCooldown(ENEMY_CONTACT_COOLDOWN);

      this.eventBus.emit('playerHit', {
        damage: ENEMY_CONTACT_DAMAGE,
        playerHP: player.hp,
      });

      if (!player.isAlive()) {
        this.eventBus.emit('gameOver', {
          score: this.score,
          kills: this.totalKills,
          maxCombo: this.maxCombo,
        });
      }
      break; // Only take damage from one enemy per frame
    }
  }

  // Called when player punch ends to reset hit tracking
  onPunchEnd() {
    this.hitEnemiesThisPunch.clear();
  }

  update(dt) {
    // Update combo timer
    if (this.comboCount > 0) {
      this.comboTimer -= dt * 1000;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
        this.comboMultiplier = 1;
        this.eventBus.emit('comboUpdate', { count: 0, multiplier: 1 });
      }
    }
  }

  updateComboMultiplier() {
    this.comboMultiplier = 1;
    for (const { hits, multiplier } of COMBO_MULTIPLIERS) {
      if (this.comboCount >= hits) {
        this.comboMultiplier = multiplier;
        break;
      }
    }
  }

  getScore() {
    return this.score;
  }

  getStats() {
    return {
      score: this.score,
      kills: this.totalKills,
      maxCombo: this.maxCombo,
      comboCount: this.comboCount,
      comboMultiplier: this.comboMultiplier,
    };
  }

  reset() {
    this.comboCount = 0;
    this.comboTimer = 0;
    this.comboMultiplier = 1;
    this.score = 0;
    this.totalKills = 0;
    this.maxCombo = 0;
    this.hitEnemiesThisPunch.clear();
  }
}
