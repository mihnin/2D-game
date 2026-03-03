import { CombatSystem } from '../../js/systems/CombatSystem.js';
import { EventBus } from '../../js/core/EventBus.js';
import { KILL_SCORE, PLAYER_PUNCH_DAMAGE } from '../../js/config/constants.js';

describe('CombatSystem', () => {
  let combat, bus;

  beforeEach(() => {
    bus = new EventBus();
    combat = new CombatSystem(bus);
  });

  function makeMockEnemy(hp = 30) {
    return {
      hp,
      x: 200, y: 300, width: 50, height: 120,
      alive: true,
      isAlive() { return this.alive; },
      takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) { this.hp = 0; this.alive = false; }
      },
      resetContactCooldown: jest.fn(),
    };
  }

  function makeMockPlayer(hp = 100) {
    return {
      hp,
      alive: true,
      isAlive() { return this.alive; },
      takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) { this.hp = 0; this.alive = false; }
      },
    };
  }

  test('processAttackHits deals damage to enemy', () => {
    const enemy = makeMockEnemy(30);
    combat.processAttackHits(makeMockPlayer(), [enemy]);
    expect(enemy.hp).toBe(30 - PLAYER_PUNCH_DAMAGE);
  });

  test('processAttackHits increments combo', () => {
    const enemy = makeMockEnemy(100);
    combat.processAttackHits(makeMockPlayer(), [enemy]);
    expect(combat.comboCount).toBe(1);
  });

  test('killing enemy awards score', () => {
    const enemy = makeMockEnemy(PLAYER_PUNCH_DAMAGE);
    const onKill = jest.fn();
    bus.on('enemyKilled', onKill);
    combat.processAttackHits(makeMockPlayer(), [enemy]);
    expect(onKill).toHaveBeenCalled();
    expect(combat.score).toBe(KILL_SCORE);
  });

  test('combo multiplier increases with hits', () => {
    const player = makeMockPlayer();
    for (let i = 0; i < 3; i++) {
      combat.hitEnemiesThisPunch.clear();
      const enemy = makeMockEnemy(100);
      combat.processAttackHits(player, [enemy]);
    }
    expect(combat.comboMultiplier).toBe(2); // 3+ hits = x2
  });

  test('combo resets after timeout', () => {
    const enemy = makeMockEnemy(100);
    combat.processAttackHits(makeMockPlayer(), [enemy]);
    expect(combat.comboCount).toBe(1);

    combat.update(3.0); // 3 seconds > COMBO_TIMEOUT
    expect(combat.comboCount).toBe(0);
    expect(combat.comboMultiplier).toBe(1);
  });

  test('processContactDamage deals damage to player', () => {
    const player = makeMockPlayer();
    const enemy = makeMockEnemy();
    combat.processContactDamage(player, [enemy]);
    expect(player.hp).toBe(90); // 100 - 10 contact damage
    expect(enemy.resetContactCooldown).toHaveBeenCalled();
  });

  test('emits gameOver when player dies from contact', () => {
    const player = makeMockPlayer(10);
    const enemy = makeMockEnemy();
    const onGameOver = jest.fn();
    bus.on('gameOver', onGameOver);
    combat.processContactDamage(player, [enemy]);
    expect(onGameOver).toHaveBeenCalled();
  });

  test('prevents double-hitting same enemy in one punch', () => {
    const enemy = makeMockEnemy(100);
    combat.processAttackHits(makeMockPlayer(), [enemy]);
    combat.processAttackHits(makeMockPlayer(), [enemy]);
    expect(enemy.hp).toBe(100 - PLAYER_PUNCH_DAMAGE); // only hit once
  });

  test('onPunchEnd clears hit tracking', () => {
    const enemy = makeMockEnemy(100);
    combat.processAttackHits(makeMockPlayer(), [enemy]);
    combat.onPunchEnd();
    combat.processAttackHits(makeMockPlayer(), [enemy]);
    expect(enemy.hp).toBe(100 - PLAYER_PUNCH_DAMAGE * 2);
  });

  test('reset clears all state', () => {
    combat.score = 500;
    combat.comboCount = 5;
    combat.totalKills = 3;
    combat.reset();
    expect(combat.score).toBe(0);
    expect(combat.comboCount).toBe(0);
    expect(combat.totalKills).toBe(0);
  });
});
