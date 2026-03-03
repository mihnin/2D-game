import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, LEVELS, VICTORY_SCORE,
  PLAYER_MAX_HP, PLAYER_SPEED, PLAYER_PUNCH_DAMAGE, PLAYER_INVULNERABILITY_TIME,
  COMBO_TIMEOUT, COMBO_MULTIPLIERS, COMBO_DAMAGE_SCALE,
  KILL_SCORE, ENEMY_CONTACT_DAMAGE, ENEMY_BASE_SPEED,
  ENEMY_DETECT_RANGE, ENEMY_CHASE_SPEED_MULTIPLIER,
  KNOCKBACK_FORCE, HITSTOP_DURATION,
  BOSS_HP_MULTIPLIER, BOSS_SIZE_MULTIPLIER, BOSS_SPEED_MULTIPLIER,
  ENEMY_MAX_ON_SCREEN,
} from '../config/constants.js';

// Help page sections — each section has a title and content lines
function buildSections() {
  return [
    {
      title: 'УПРАВЛЕНИЕ',
      color: COLORS.accent,
      rows: [
        ['Движение ←/→', 'Стрелки или A / D'],
        ['Движение ↑/↓ (глубина)', 'Стрелки или W / S'],
        ['Прыжок', 'Пробел (Space)'],
        ['Удар', 'Ctrl (любой) или ПКМ'],
        ['Пауза', 'Escape'],
        ['Звук вкл/выкл', 'N'],
        ['Помощь (это меню)', 'H'],
        ['Управление (в меню)', 'C'],
      ],
    },
    {
      title: 'ЦЕЛЬ ИГРЫ',
      color: COLORS.combo,
      lines: [
        'Boxing Liberation — постапокалиптический beat-em-up',
        'в стиле Streets of Rage.',
        '',
        'Набери ' + VICTORY_SCORE + ' очков, чтобы победить!',
        'Убивай врагов, делай комбо — зарабатывай больше.',
        'Пройди все 6 уровней и победи финального БОССА.',
      ],
    },
    {
      title: 'ЗДОРОВЬЕ И ЗАЩИТА',
      color: '#4ecca3',
      lines: [
        'Здоровье игрока: ' + PLAYER_MAX_HP + ' HP',
        'Скорость движения: ' + PLAYER_SPEED + ' px/sec',
        '',
        'После получения урона — ' + (PLAYER_INVULNERABILITY_TIME / 1000) + ' сек неуязвимости',
        '(персонаж мигает, враги не могут навредить).',
        '',
        'Урон от контакта с врагом: ' + ENEMY_CONTACT_DAMAGE + ' HP',
        'Если HP упадёт до 0 — игра окончена.',
      ],
    },
    {
      title: 'БОЕВАЯ СИСТЕМА',
      color: COLORS.accent,
      lines: [
        'Базовый урон удара: ' + PLAYER_PUNCH_DAMAGE,
        'Каждый удар отбрасывает врага на ' + KNOCKBACK_FORCE + ' px.',
        'При попадании — короткая заморозка (' + HITSTOP_DURATION + ' мс)',
        'для ощущения мощного удара.',
        '',
        'Удар блокирует движение на 0.3 сек.',
        'Нельзя бить в прыжке — бей на земле!',
      ],
    },
    {
      title: 'СИСТЕМА КОМБО',
      color: COLORS.combo,
      lines: [
        'Бей врагов подряд, чтобы копить комбо.',
        'Комбо сбрасывается через ' + (COMBO_TIMEOUT / 1000) + ' сек без удара.',
        '',
        ...COMBO_MULTIPLIERS.slice().reverse().map(
          (c) => `  ${c.hits}+ ударов  →  x${c.multiplier} множитель`
        ),
        '',
        'Урон с комбо: ' + PLAYER_PUNCH_DAMAGE + ' × (1 + (множитель−1) × ' + COMBO_DAMAGE_SCALE + ')',
        'Пример:  x5 комбо  →  ' + Math.round(PLAYER_PUNCH_DAMAGE * (1 + (5 - 1) * COMBO_DAMAGE_SCALE)) + ' урона за удар',
        '',
        'Очки за убийство: ' + KILL_SCORE + ' × множитель комбо',
        'Пример:  x3 комбо  →  ' + (KILL_SCORE * 3) + ' очков',
      ],
    },
    {
      title: 'ВРАГИ И ИИ',
      color: '#e94560',
      lines: [
        'Базовая скорость врага: ' + ENEMY_BASE_SPEED + ' px/sec',
        'Макс. врагов на экране: ' + ENEMY_MAX_ON_SCREEN,
        '',
        'Когда ты ближе ' + ENEMY_DETECT_RANGE + ' px — враги начинают',
        'преследовать тебя (скорость ×' + ENEMY_CHASE_SPEED_MULTIPLIER + ').',
        '',
        'Враги двигаются по глубине (ось Y), имитируя',
        '2.5D пространство, как в Streets of Rage.',
      ],
    },
    {
      title: 'УРОВНИ',
      color: COLORS.combo,
      table: {
        header: ['LVL', 'Название', 'Очки', 'HP', 'Скор.', 'Спаун'],
        rows: LEVELS.map((lv) => [
          String(lv.id),
          lv.name,
          String(lv.scoreThreshold),
          String(lv.enemyHP),
          'x' + lv.enemySpeedMultiplier.toFixed(1),
          (lv.spawnInterval / 1000).toFixed(1) + 'с',
        ]),
      },
    },
    {
      title: 'БОСС (УРОВЕНЬ 6)',
      color: '#ff6b6b',
      lines: [
        'На последнем уровне появляется БОСС!',
        '',
        'HP босса: ' + LEVELS[5].enemyHP + ' × ' + BOSS_HP_MULTIPLIER + ' = ' + (LEVELS[5].enemyHP * BOSS_HP_MULTIPLIER),
        'Размер: ×' + BOSS_SIZE_MULTIPLIER + ' (огромный!)',
        'Скорость: ×' + BOSS_SPEED_MULTIPLIER + ' (медленный, но живучий)',
        '',
        'У босса жёлтая шкала HP и метка «BOSS».',
        'Одолей его, чтобы набрать финальные очки!',
      ],
    },
    {
      title: 'СОВЕТЫ',
      color: COLORS.secondary,
      lines: [
        '• Держи комбо — чем выше, тем больше урон и очки.',
        '• Используй глубину (W/S) — уклоняйся от врагов.',
        '• Не стой на месте — враги окружают.',
        '• Отбрасывание помогает контролировать толпу.',
        '• На уровнях 4-6 враги быстрее — будь готов.',
        '• Против босса — бей и уклоняйся, он медленный.',
        '',
        'Удачи, боец!',
      ],
    },
  ];
}

export class HelpScene {
  constructor(sceneManager, inputManager, assetLoader) {
    this.sceneManager = sceneManager;
    this.input = inputManager;
    this.assets = assetLoader;
    this.scrollY = 0;
    this.maxScroll = 0;
    this.sections = [];
    this._onWheel = this._onWheel.bind(this);
  }

  enter() {
    this.scrollY = 0;
    this.sections = buildSections();
    // Pre-calculate total content height
    this.maxScroll = this._calculateContentHeight() - CANVAS_HEIGHT + 80;
    if (this.maxScroll < 0) this.maxScroll = 0;
    document.addEventListener('wheel', this._onWheel, { passive: false });
  }

  exit() {
    document.removeEventListener('wheel', this._onWheel);
  }

  _onWheel(e) {
    e.preventDefault();
    this.scrollY += e.deltaY * 0.5;
    this._clampScroll();
  }

  _clampScroll() {
    if (this.scrollY < 0) this.scrollY = 0;
    if (this.scrollY > this.maxScroll) this.scrollY = this.maxScroll;
  }

  _calculateContentHeight() {
    let y = 80; // top padding
    for (const section of this.sections) {
      y += 50; // title
      if (section.rows) {
        y += section.rows.length * 32 + 16;
      } else if (section.table) {
        y += 32 + section.table.rows.length * 26 + 16;
      } else if (section.lines) {
        y += section.lines.length * 24 + 16;
      }
      y += 20; // gap between sections
    }
    return y + 60; // bottom padding
  }

  update(dt) {
    // Scroll with arrow keys / W,S
    const scrollSpeed = 400;
    if (this.input.isKeyDown('ArrowUp') || this.input.isKeyDown('KeyW')) {
      this.scrollY -= scrollSpeed * dt;
    }
    if (this.input.isKeyDown('ArrowDown') || this.input.isKeyDown('KeyS')) {
      this.scrollY += scrollSpeed * dt;
    }
    this._clampScroll();

    // Exit help
    if (this.input.isKeyPressed('Escape') || this.input.isKeyPressed('KeyH')
      || this.input.isKeyPressed('Space') || this.input.isKeyPressed('Enter')) {
      this.sceneManager.switch('menu');
    }
  }

  render(ctx) {
    // Background
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Dimmed bg image
    const bgImg = this.assets ? this.assets.get('backgrounds') : null;
    if (bgImg) {
      ctx.globalAlpha = 0.1;
      ctx.drawImage(bgImg, 0, 0, bgImg.width, bgImg.height, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.globalAlpha = 1;
    }

    ctx.save();
    ctx.translate(0, -this.scrollY);

    let y = 50;

    // Page title
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.accent;
    ctx.font = 'bold 36px Arial';
    ctx.fillText('ПОМОЩЬ', CANVAS_WIDTH / 2, y);
    y += 40;

    // Render sections
    for (const section of this.sections) {
      y = this._renderSection(ctx, section, y);
      y += 20;
    }

    // Footer
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.secondary;
    ctx.font = '14px Arial';
    ctx.fillText('Прокрутка: ↑/↓ или колёсико мыши', CANVAS_WIDTH / 2, y + 10);
    ctx.fillText('Назад: ESC / H / Space', CANVAS_WIDTH / 2, y + 30);

    ctx.restore();

    // Scrollbar (fixed on screen)
    this._renderScrollbar(ctx);

    // Fixed header hint
    ctx.fillStyle = 'rgba(26, 26, 46, 0.9)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 18);
    ctx.fillStyle = COLORS.secondary;
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ESC / H / Space — назад в меню  |  ↑↓ / колёсико — прокрутка', CANVAS_WIDTH / 2, 13);
  }

  _renderSection(ctx, section, y) {
    // Section title with underline
    ctx.textAlign = 'left';
    const leftMargin = 60;
    ctx.fillStyle = section.color || COLORS.accent;
    ctx.font = 'bold 22px Arial';
    ctx.fillText(section.title, leftMargin, y);

    // Underline
    const titleWidth = ctx.measureText(section.title).width;
    ctx.strokeStyle = section.color || COLORS.accent;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(leftMargin, y + 5);
    ctx.lineTo(leftMargin + titleWidth + 20, y + 5);
    ctx.stroke();
    ctx.globalAlpha = 1;

    y += 30;

    if (section.rows) {
      // Key-value pairs (controls)
      for (const [action, key] of section.rows) {
        ctx.fillStyle = COLORS.text;
        ctx.font = '16px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(action, CANVAS_WIDTH / 2 - 20, y);

        ctx.fillStyle = COLORS.combo;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(key, CANVAS_WIDTH / 2 + 20, y);
        y += 32;
      }
    } else if (section.table) {
      y = this._renderTable(ctx, section.table, y);
    } else if (section.lines) {
      ctx.textAlign = 'left';
      ctx.font = '15px Arial';
      for (const line of section.lines) {
        if (line === '') {
          y += 10;
          continue;
        }
        ctx.fillStyle = COLORS.text;
        ctx.fillText(line, leftMargin + 10, y);
        y += 24;
      }
    }

    return y;
  }

  _renderTable(ctx, table, y) {
    const leftMargin = 60;
    const colWidths = [40, 200, 60, 50, 60, 60];
    const totalWidth = colWidths.reduce((a, b) => a + b, 0);
    const tableX = (CANVAS_WIDTH - totalWidth) / 2;

    // Header background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.fillRect(tableX - 5, y - 16, totalWidth + 10, 24);

    // Header text
    ctx.font = 'bold 13px Arial';
    ctx.fillStyle = COLORS.combo;
    let x = tableX;
    for (let i = 0; i < table.header.length; i++) {
      ctx.textAlign = i === 1 ? 'left' : 'center';
      const cx = i === 1 ? x + 5 : x + colWidths[i] / 2;
      ctx.fillText(table.header[i], cx, y);
      x += colWidths[i];
    }
    y += 26;

    // Rows
    ctx.font = '13px Arial';
    for (let r = 0; r < table.rows.length; r++) {
      const row = table.rows[r];

      // Alternating row background
      if (r % 2 === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.fillRect(tableX - 5, y - 14, totalWidth + 10, 24);
      }

      // Boss level highlight
      if (LEVELS[r] && LEVELS[r].boss) {
        ctx.fillStyle = 'rgba(233, 69, 96, 0.12)';
        ctx.fillRect(tableX - 5, y - 14, totalWidth + 10, 24);
      }

      x = tableX;
      for (let i = 0; i < row.length; i++) {
        ctx.fillStyle = COLORS.text;
        ctx.textAlign = i === 1 ? 'left' : 'center';
        const cx = i === 1 ? x + 5 : x + colWidths[i] / 2;
        ctx.fillText(row[i], cx, y);
        x += colWidths[i];
      }
      y += 26;
    }

    return y;
  }

  _renderScrollbar(ctx) {
    if (this.maxScroll <= 0) return;

    const trackH = CANVAS_HEIGHT - 40;
    const trackX = CANVAS_WIDTH - 12;
    const trackY = 20;

    // Track
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(trackX, trackY, 6, trackH);

    // Thumb
    const ratio = CANVAS_HEIGHT / (this.maxScroll + CANVAS_HEIGHT);
    const thumbH = Math.max(30, trackH * ratio);
    const thumbY = trackY + (this.scrollY / this.maxScroll) * (trackH - thumbH);

    ctx.fillStyle = 'rgba(233, 69, 96, 0.5)';
    ctx.fillRect(trackX, thumbY, 6, thumbH);
  }
}
