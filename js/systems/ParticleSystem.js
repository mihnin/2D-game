import { COLORS } from '../config/constants.js';

class Particle {
  constructor(x, y, config) {
    this.x = x;
    this.y = y;
    this.vx = config.vx || 0;
    this.vy = config.vy || 0;
    this.life = config.life || 1000;
    this.maxLife = this.life;
    this.size = config.size || 3;
    this.color = config.color || '#fff';
    this.text = config.text || null;
    this.fontSize = config.fontSize || 16;
    this.gravity = config.gravity || 0;
    this.alive = true;
  }

  update(dt) {
    this.life -= dt * 1000;
    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.life <= 0) {
      this.alive = false;
    }
  }

  getAlpha() {
    return Math.max(0, this.life / this.maxLife);
  }
}

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  // Floating damage numbers
  spawnDamageNumber(x, y, value) {
    const text = `+${value}`;
    this.particles.push(new Particle(x, y, {
      vx: (Math.random() - 0.5) * 30,
      vy: -80,
      life: 1000,
      color: COLORS.combo,
      text,
      fontSize: 20,
      gravity: 0,
    }));
  }

  // Dust particles on landing
  spawnDust(x, y) {
    for (let i = 0; i < 5; i++) {
      this.particles.push(new Particle(x + Math.random() * 40 - 20, y, {
        vx: (Math.random() - 0.5) * 60,
        vy: -(Math.random() * 30 + 10),
        life: 400,
        size: Math.random() * 3 + 1,
        color: COLORS.secondary,
        gravity: 100,
      }));
    }
  }

  // Hit sparks
  spawnHitEffect(x, y) {
    for (let i = 0; i < 3; i++) {
      this.particles.push(new Particle(x, y, {
        vx: (Math.random() - 0.5) * 100,
        vy: (Math.random() - 0.5) * 100,
        life: 200,
        size: Math.random() * 4 + 2,
        color: '#fff',
      }));
    }
  }

  // Victory confetti
  spawnConfetti(canvasWidth, canvasHeight) {
    const confettiColors = ['#e94560', '#ffc107', '#4ecca3', '#f5f5dc', '#d4a574'];
    for (let i = 0; i < 30; i++) {
      this.particles.push(new Particle(Math.random() * canvasWidth, -10, {
        vx: (Math.random() - 0.5) * 100,
        vy: Math.random() * 100 + 50,
        life: 3000,
        size: Math.random() * 5 + 2,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        gravity: 30,
      }));
    }
  }

  update(dt) {
    for (const p of this.particles) {
      p.update(dt);
    }
    this.particles = this.particles.filter((p) => p.alive);
  }

  render(ctx, camera) {
    for (const p of this.particles) {
      const alpha = p.getAlpha();
      ctx.globalAlpha = alpha;

      if (p.text) {
        ctx.font = `bold ${p.fontSize}px Arial`;
        ctx.fillStyle = p.color;
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x + camera.getDrawX(), p.y + camera.getDrawY());
      } else {
        ctx.fillStyle = p.color;
        const x = p.x + camera.getDrawX();
        const y = p.y + camera.getDrawY();
        ctx.fillRect(x - p.size / 2, y - p.size / 2, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;
  }

  // Render without camera offset (for UI particles like confetti)
  renderUI(ctx) {
    for (const p of this.particles) {
      const alpha = p.getAlpha();
      ctx.globalAlpha = alpha;

      if (p.text) {
        ctx.font = `bold ${p.fontSize}px Arial`;
        ctx.fillStyle = p.color;
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y);
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;
  }

  clear() {
    this.particles = [];
  }
}
