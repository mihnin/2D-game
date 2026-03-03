import { GRAVITY, GROUND_Y } from '../config/constants.js';

export class PhysicsSystem {
  update(entities, dt) {
    for (const entity of entities) {
      // Apply gravity if above ground
      if (entity.y + entity.height < GROUND_Y + entity.height) {
        entity.velocityY += GRAVITY * dt;
      }

      // Update position
      entity.y += entity.velocityY * dt;

      // Ground collision
      const groundLevel = GROUND_Y;
      if (entity.y + entity.height >= groundLevel + entity.height) {
        entity.y = groundLevel;
        if (entity.velocityY > 0) {
          entity.velocityY = 0;
          if (entity.onLand) {
            entity.onLand();
          }
        }
      }
    }
  }

  isOnGround(entity) {
    return entity.y >= GROUND_Y;
  }
}
