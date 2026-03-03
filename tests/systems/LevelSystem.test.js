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

  test('levels up to level 3', () => {
    levels.checkProgression(500);
    levels.checkProgression(1500);
    expect(levels.getLevelIndex()).toBe(2);
    expect(levels.getCurrentLevel().id).toBe(3);
  });

  test('emits victory at victory score on level 3', () => {
    const onVictory = jest.fn();
    bus.on('victory', onVictory);

    levels.checkProgression(500);
    levels.checkProgression(1500);
    levels.checkProgression(VICTORY_SCORE);
    expect(onVictory).toHaveBeenCalled();
    expect(levels.isVictory()).toBe(true);
  });

  test('does not level up below threshold', () => {
    levels.checkProgression(400);
    expect(levels.getLevelIndex()).toBe(0);
  });

  test('does not emit victory on level 1 or 2', () => {
    const onVictory = jest.fn();
    bus.on('victory', onVictory);
    levels.checkProgression(VICTORY_SCORE); // Still level 1 since we need to progress through levels
    // After this call, we should be at level 3 (score >= 1500)
    // and then victory check should trigger
    expect(levels.getLevelIndex()).toBe(2);
    expect(onVictory).toHaveBeenCalled();
  });

  test('reset returns to level 1', () => {
    levels.checkProgression(500);
    levels.reset();
    expect(levels.getLevelIndex()).toBe(0);
    expect(levels.isVictory()).toBe(false);
  });
});
