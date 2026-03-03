import { LEVELS, VICTORY_SCORE } from '../config/constants.js';

export class LevelSystem {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.currentLevel = 0; // index into LEVELS array
    this.victory = false;
  }

  getCurrentLevel() {
    return LEVELS[this.currentLevel];
  }

  checkProgression(score) {
    if (this.victory) return;

    // Check for victory
    if (this.currentLevel === LEVELS.length - 1 && score >= VICTORY_SCORE) {
      this.victory = true;
      this.eventBus.emit('victory', { score });
      return;
    }

    // Check for level up (may skip multiple levels)
    while (this.currentLevel + 1 < LEVELS.length &&
           score >= LEVELS[this.currentLevel + 1].scoreThreshold) {
      this.currentLevel++;
      this.eventBus.emit('levelUp', {
        level: LEVELS[this.currentLevel],
        levelIndex: this.currentLevel,
      });
    }

    // Re-check victory after potential level advancement
    if (this.currentLevel === LEVELS.length - 1 && score >= VICTORY_SCORE) {
      this.victory = true;
      this.eventBus.emit('victory', { score });
    }
  }

  getLevelIndex() {
    return this.currentLevel;
  }

  isVictory() {
    return this.victory;
  }

  reset() {
    this.currentLevel = 0;
    this.victory = false;
  }
}
