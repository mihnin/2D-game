export class Entity {
  constructor(x, y, width, height, maxHp) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.hp = maxHp;
    this.maxHp = maxHp;
    this.velocityX = 0;
    this.velocityY = 0;
    this.alive = true;
    this.facingRight = true;
  }

  update(dt) {
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;
  }

  takeDamage(amount) {
    if (!this.alive) return;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    }
  }

  isAlive() {
    return this.alive;
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  getCenter() {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
    };
  }
}
