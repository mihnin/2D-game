import { SpawnSystem } from '../../js/systems/SpawnSystem.js';
import { ENEMY_MAX_ON_SCREEN } from '../../js/config/constants.js';

describe('SpawnSystem', () => {
  let spawner;

  beforeEach(() => {
    spawner = new SpawnSystem();
  });

  test('spawns enemy when timer expires', () => {
    const player = { x: 100, y: 420, isAlive: () => true };
    spawner.update(4.0, 0, player); // 4 seconds > default 3s interval
    expect(spawner.getEnemies().length).toBeGreaterThanOrEqual(1);
  });

  test('does not exceed max enemies on screen', () => {
    const player = { x: 100, y: 420, isAlive: () => true };
    spawner.spawnInterval = 100; // Very fast spawn
    for (let i = 0; i < 10; i++) {
      spawner.update(1.0, 0, player);
    }
    expect(spawner.getEnemies().length).toBeLessThanOrEqual(ENEMY_MAX_ON_SCREEN);
  });

  test('configure updates spawn parameters', () => {
    spawner.configure({
      spawnInterval: 2000,
      enemyHP: 50,
      enemySpeedMultiplier: 1.5,
    });
    expect(spawner.spawnInterval).toBe(2000);
    expect(spawner.enemyHP).toBe(50);
    expect(spawner.speedMultiplier).toBe(1.5);
  });

  test('removes dead enemies', () => {
    const player = { x: 100, y: 420, isAlive: () => true };
    const enemy = spawner.spawn(0, player);
    // Simulate death
    enemy.takeDamage(999);
    enemy.state = 'dead'; // Force dead state
    // Use Object.defineProperty to mock isDead
    const origIsDead = enemy.isDead.bind(enemy);
    enemy.isDead = () => true;

    spawner.update(0.016, 0, player);
    expect(spawner.getEnemies().length).toBe(0);
  });

  test('reset clears all enemies', () => {
    const player = { x: 100, y: 420, isAlive: () => true };
    spawner.spawn(0, player);
    spawner.spawn(0, player);
    spawner.reset();
    expect(spawner.getEnemies().length).toBe(0);
  });

  test('spawns enemy off right edge of screen', () => {
    const player = { x: 100, y: 420, isAlive: () => true };
    const enemy = spawner.spawn(200, player);
    expect(enemy.x).toBeGreaterThan(200 + 900); // camera + canvas width
  });
});
