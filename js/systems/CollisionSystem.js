import { aabbCollision } from '../utils/helpers.js';
import { EnemyState } from '../entities/Enemy.js';

export class CollisionSystem {
  // Check player's attack box against enemy bodies
  checkAttackCollisions(player, enemies) {
    const hits = [];
    if (!player.attackBox) return hits;

    for (const enemy of enemies) {
      if (!enemy.isAlive() || enemy.state === EnemyState.DYING || enemy.state === EnemyState.DEAD) continue;

      if (aabbCollision(player.attackBox, enemy.getBounds())) {
        hits.push(enemy);
      }
    }
    return hits;
  }

  // Check enemy bodies against player body for contact damage
  checkContactCollisions(player, enemies) {
    const contacts = [];
    const playerBounds = player.getBounds();

    for (const enemy of enemies) {
      if (!enemy.canDealDamage()) continue;

      if (aabbCollision(playerBounds, enemy.getBounds())) {
        contacts.push(enemy);
      }
    }
    return contacts;
  }
}
