import { Enemy, EnemyState } from '../../js/entities/Enemy.js';

describe('Enemy', () => {
  let enemy;

  beforeEach(() => {
    enemy = new Enemy(800, 420, 30, 1.0);
  });

  test('initializes with correct state', () => {
    expect(enemy.hp).toBe(30);
    expect(enemy.state).toBe(EnemyState.WALKING);
    expect(enemy.facingRight).toBe(false);
  });

  test('moves toward target player', () => {
    const mockPlayer = { x: 100, y: 420 };
    enemy.setTarget(mockPlayer);
    enemy.update(0.016);
    expect(enemy.velocityX).toBeLessThan(0); // Moving left toward player
  });

  test('faces right when target is to the right', () => {
    enemy.x = 50;
    const mockPlayer = { x: 800, y: 420 };
    enemy.setTarget(mockPlayer);
    enemy.update(0.016);
    expect(enemy.facingRight).toBe(true);
  });

  test('takes damage and flashes white', () => {
    enemy.takeDamage(15);
    expect(enemy.hp).toBe(15);
    expect(enemy.flashWhite).toBe(true);
    expect(enemy.state).toBe(EnemyState.HURT);
  });

  test('dies when hp reaches 0', () => {
    enemy.takeDamage(30);
    expect(enemy.hp).toBe(0);
    expect(enemy.isAlive()).toBe(false);
    expect(enemy.state).toBe(EnemyState.DYING);
  });

  test('transitions from dying to dead after timer', () => {
    enemy.takeDamage(30);
    expect(enemy.state).toBe(EnemyState.DYING);

    // Simulate death animation time passing
    enemy.update(2.0); // 2 seconds > DEATH_ANIMATION_DURATION
    expect(enemy.state).toBe(EnemyState.DEAD);
  });

  test('canDealDamage returns true when walking with no cooldown', () => {
    expect(enemy.canDealDamage()).toBe(true);
  });

  test('canDealDamage returns false after contact cooldown', () => {
    enemy.resetContactCooldown(1000);
    expect(enemy.canDealDamage()).toBe(false);
  });

  test('contact cooldown decreases over time', () => {
    enemy.resetContactCooldown(1000);
    enemy.update(0.5); // 500ms
    expect(enemy.contactCooldown).toBeLessThanOrEqual(500);
  });

  test('isDead returns true only in DEAD state', () => {
    expect(enemy.isDead()).toBe(false);
    enemy.takeDamage(30);
    expect(enemy.isDead()).toBe(false); // DYING, not DEAD
    enemy.update(2.0);
    expect(enemy.isDead()).toBe(true);
  });

  test('does not take damage when dying', () => {
    enemy.takeDamage(30);
    expect(enemy.state).toBe(EnemyState.DYING);
    enemy.takeDamage(10); // Should be ignored
    expect(enemy.hp).toBe(0);
  });
});
