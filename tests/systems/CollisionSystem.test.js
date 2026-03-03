import { CollisionSystem } from '../../js/systems/CollisionSystem.js';

describe('CollisionSystem', () => {
  let collision;

  beforeEach(() => {
    collision = new CollisionSystem();
  });

  function makePlayer(x, y, attackBox) {
    return {
      attackBox,
      getBounds: () => ({ x, y, width: 80, height: 130 }),
    };
  }

  function makeEnemy(x, y, alive = true, canDealDmg = true) {
    return {
      x, y, width: 50, height: 120,
      state: alive ? 'walking' : 'dead',
      isAlive: () => alive,
      getBounds: () => ({ x, y, width: 50, height: 120 }),
      canDealDamage: () => canDealDmg,
    };
  }

  test('detects attack collision when attack box overlaps enemy', () => {
    const player = makePlayer(100, 300, { x: 180, y: 310, width: 50, height: 40 });
    const enemy = makeEnemy(190, 300);
    const hits = collision.checkAttackCollisions(player, [enemy]);
    expect(hits).toHaveLength(1);
    expect(hits[0]).toBe(enemy);
  });

  test('no attack hits when no attack box', () => {
    const player = makePlayer(100, 300, null);
    const enemy = makeEnemy(190, 300);
    const hits = collision.checkAttackCollisions(player, [enemy]);
    expect(hits).toHaveLength(0);
  });

  test('no attack hits on dead enemies', () => {
    const player = makePlayer(100, 300, { x: 180, y: 310, width: 50, height: 40 });
    const enemy = makeEnemy(190, 300, false);
    const hits = collision.checkAttackCollisions(player, [enemy]);
    expect(hits).toHaveLength(0);
  });

  test('detects contact collision between enemy and player', () => {
    const player = makePlayer(100, 300, null);
    const enemy = makeEnemy(120, 300, true, true);
    const contacts = collision.checkContactCollisions(player, [enemy]);
    expect(contacts).toHaveLength(1);
  });

  test('no contact when enemy on cooldown', () => {
    const player = makePlayer(100, 300, null);
    const enemy = makeEnemy(120, 300, true, false);
    const contacts = collision.checkContactCollisions(player, [enemy]);
    expect(contacts).toHaveLength(0);
  });

  test('no contact when entities are far apart', () => {
    const player = makePlayer(100, 300, null);
    const enemy = makeEnemy(500, 300, true, true);
    const contacts = collision.checkContactCollisions(player, [enemy]);
    expect(contacts).toHaveLength(0);
  });
});
