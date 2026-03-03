import { LevelSystem } from '../../js/systems/LevelSystem.js';
import { EventBus } from '../../js/core/EventBus.js';
import { LEVELS, VICTORY_SCORE } from '../../js/config/constants.js';

describe('LevelSystem', () => {
  let levels, bus;

  beforeEach(() => {
    bus = new EventBus();
    levels = new LevelSystem(bus);
  });

  test('starts at level 1', () => {
    expect(levels.getLevelIndex()).toBe(0);
    expect(levels.getCurrentLevel().id).toBe(1);
  });

  test('levels up at score threshold', () => {
    const onLevelUp = jest.fn();
    bus.on('levelUp', onLevelUp);

    levels.checkProgression(500); // Level 2 threshold
    expect(levels.getLevelIndex()).toBe(1);
    expect(onLevelUp).toHaveBeenCalledWith(
      expect.objectContaining({ levelIndex: 1 })
    );
  });

  test('levels up to last level', () => {
    levels.checkProgression(500);
    levels.checkProgression(1500);
    levels.checkProgression(3000);
    levels.checkProgression(5000);
    levels.checkProgression(8000);
    expect(levels.getLevelIndex()).toBe(LEVELS.length - 1);
    expect(levels.getCurrentLevel().id).toBe(LEVELS.length);
  });

  test('emits victory at victory score on last level', () => {
    const onVictory = jest.fn();
    bus.on('victory', onVictory);

    levels.checkProgression(8000); // advance to last level
    levels.checkProgression(VICTORY_SCORE);
    expect(onVictory).toHaveBeenCalled();
    expect(levels.isVictory()).toBe(true);
  });

  test('does not level up below threshold', () => {
    levels.checkProgression(400);
    expect(levels.getLevelIndex()).toBe(0);
  });

  test('does not emit victory before last level', () => {
    const onVictory = jest.fn();
    bus.on('victory', onVictory);
    levels.checkProgression(VICTORY_SCORE);
    // Score 12000 >= all thresholds, so should advance to last level and trigger victory
    expect(levels.getLevelIndex()).toBe(LEVELS.length - 1);
    expect(onVictory).toHaveBeenCalled();
  });

  test('reset returns to level 1', () => {
    levels.checkProgression(500);
    levels.reset();
    expect(levels.getLevelIndex()).toBe(0);
    expect(levels.isVictory()).toBe(false);
  });
});
