# Руководство по созданию 2D Beat-em-up на Canvas

> Живой документ. Обновляется по мере обнаружения новых проблем и паттернов.
> Основан на опыте разработки **Boxing Liberation** — 2D side-scrolling beat-em-up на HTML5 Canvas + vanilla ES6.

---

## Оглавление

1. [Архитектура проекта](#1-архитектура-проекта)
2. [Game Loop и время](#2-game-loop-и-время)
3. [Спрайт-шиты и анимация](#3-спрайт-шиты-и-анимация)
4. [Удаление фона со спрайтов](#4-удаление-фона-со-спрайтов)
5. [Множественные типы врагов](#5-множественные-типы-врагов)
6. [Entity State Machine](#6-entity-state-machine)
7. [Система перемещения и глубина (Y-axis)](#7-система-перемещения-и-глубина-y-axis)
8. [Прыжки и гравитация](#8-прыжки-и-гравитация)
9. [Камера и мир](#9-камера-и-мир)
10. [Коллизии и хитбоксы](#10-коллизии-и-хитбоксы)
11. [Боевая система и комбо](#11-боевая-система-и-комбо)
12. [Система уровней и прогрессия](#12-система-уровней-и-прогрессия)
13. [Система сцен](#13-система-сцен)
14. [Аудио (Web Audio API)](#14-аудио-web-audio-api)
15. [Партикл-система](#15-партикл-система)
16. [Ввод (Input)](#16-ввод-input)
17. [Тестирование](#17-тестирование)
18. [Частые ошибки и грабли](#18-частые-ошибки-и-грабли)
19. [Чеклист нового проекта](#19-чеклист-нового-проекта)

---

## 1. Архитектура проекта

### Рекомендуемая структура
```
js/
  config/       — константы, spriteData (НЕ логика)
  core/         — Game, GameLoop, Camera, EventBus, InputManager, SceneManager, AssetLoader, AudioManager
  entities/     — Entity (база), Player, Enemy
  scenes/       — MenuScene, GameScene, PauseScene, GameOverScene, VictoryScene
  systems/      — AnimationSystem, CollisionSystem, CombatSystem, LevelSystem, ParticleSystem, SpawnSystem, SpriteSystem
  utils/        — вспомогательные функции (AABB, math)
tests/          — зеркальная структура js/
```

### Принцип разделения ответственности
- **Config** — только данные, ноль логики. Все числа баланса в одном `constants.js`.
- **Core** — инфраструктура, не знает про игровые сущности.
- **Entities** — стейт-машины, каждая сущность управляет своим состоянием.
- **Systems** — обработка: коллизии, боёвка, спавн. Не хранят состояние сущностей.
- **Scenes** — оркестрация. `GameScene` связывает всё: создаёт игрока, вызывает системы, подписывается на события.

### КРИТИЧНО: EventBus — пуповина всей игры
```
CollisionSystem → CombatSystem → EventBus → { LevelSystem, ParticleSystem, AudioManager, Camera }
```
Событийная архитектура спасает от циклических зависимостей. Combat не знает про частицы, частицы не знают про комбо.

**Грабля**: при `GameScene.enter()` обязательно вызывать `eventBus.clear()` перед новыми подписками. Иначе при рестарте игры подписки задвоятся и каждое событие сработает N раз.

---

## 2. Game Loop и время

### Формула
```js
let dt = (currentTime - lastTime) / 1000; // секунды!
if (dt > 1/30) dt = 1/30; // clamp — защита от спирали смерти
```

### Грабли dt
| Ошибка | Последствие | Как избежать |
|--------|-------------|-------------|
| `dt` в миллисекундах вместо секунд | Всё летает со скоростью x1000 | Всегда делить на 1000 при конвертации |
| Нет clamp на max dt | При переключении вкладки dt=5сек → телепортация | `maxDeltaTime = 1/30` |
| Таймеры в ms, а dt в секундах | Таймеры отсчитывают неправильно | Конвенция: `timer -= dt * 1000` для ms-таймеров |
| `handleInput()` использует dt | Input захватывает направление — dt не нужен | В `handleInput` только **направление**, движение в `update(dt)` |

### Правило: handleInput() vs update(dt)
- `handleInput(input)` — читает клавиши, устанавливает **направление/намерение** (`walkDirY = -1`, `velocityX = SPEED`).
- `update(dt)` — применяет движение (`this.x += this.velocityX * dt`), таймеры, гравитацию.
- **Никогда** не двигайте объект в `handleInput` напрямую — получите frame-rate-dependent движение.

---

## 3. Спрайт-шиты и анимация

### Два типа анимаций

**Grid-based** (герой): равномерная сетка.
```js
{ row: 0, col: 0, frames: 4, fps: 8, loop: true }
// frameWidth/frameHeight одинаковые для всех кадров
```

**Rect-based** (враги): явные координаты каждого кадра.
```js
{ frames: [{ x: 3, y: 53, w: 61, h: 136 }, ...], fps: 8, loop: true }
```

### Грабли со спрайтами

**Неравномерная ширина кадров вызывает "вращение":**
Если кадры walk-анимации имеют разную ширину (45px, 65px, 52px), при масштабировании до одного `drawWidth` спрайт будет дёргаться горизонтально, создавая эффект вращения. **Решение**: привести все кадры walk-анимации к единой ширине (uniform column width).

**Текстовые метки на спрайт-шитах:**
Художники часто добавляют подписи ("ROW 1:", "1.1") прямо на PNG. Координаты кадров нужно выбирать так, чтобы метки НЕ попали в вырезаемую область. Проверять через `debug-sprites.html` или pixel analysis.

**Pixel analysis для поиска кадров:**
При автоматическом разборе нового спрайт-шита сканировать столбцы на наличие непрозрачных пикселей. `maxRun >= 15` — реальный спрайт. Мелкие вкрапления — текстовые метки.

### Mirror-флип для экономии спрайтов
Если на спрайт-шите есть только `walkRight`, используй:
```js
{ mirrorLeft: true } // в конфиге спрайтов
```
В рендере:
```js
if (needsFlip) {
  ctx.translate(drawX + width, drawY);
  ctx.scale(-1, 1);
  ctx.drawImage(img, f.x, f.y, f.w, f.h, 0, 0, width, height);
}
```
**Грабля**: после `ctx.scale(-1,1)` рисовать нужно в `(0, 0)`, а не в `(drawX, drawY)`. Translate уже сдвинул начало координат.

### AnimationController
- `play(name)` — если уже играет эта анимация, не сбрасывает кадр (ранний return).
- `update(dt)` — продвигает кадр по fps. `loop: false` замирает на последнем кадре.
- `getCurrentFrameData()` — возвращает `{type: 'grid', row, col}` или `{type: 'rect', frame}`.
- **Грабля**: вызов `play()` каждый кадр на зацикленной анимации — OK (no-op), но если забыть `loop: true`, анимация застрянет на последнем кадре.

---

## 4. Удаление фона со спрайтов

### Проблема
Художественные спрайт-шиты часто приходят с белым/шахматным фоном вместо прозрачности.

### Решение: Flood fill от краёв
```js
function isBgLike(pos) {
  const saturation = max - min;
  return saturation < 30 && min > 155; // нейтральный + яркий
}
```
1. Сеять flood fill со всех пикселей по краям изображения.
2. Если пиксель `isBgLike` — сделать прозрачным, добавить соседей в стек.
3. **Pass 2 — Fringe cleanup**: пиксели, граничащие с удалёнными и имеющие brightness > 200 + saturation < 40 → уменьшить alpha. Убирает белый "ореол" антиалиасинга.

### Критические правила
- **НЕ** применять к фоновым изображениям (backgrounds) — они должны оставаться с белыми элементами.
- Flood fill **от краёв** гарантирует, что белые участки *внутри* спрайта (футболка, зубы) останутся нетронутыми.
- `removeBackground()` вызывается **один раз** при загрузке, результат кэшируется как Canvas-элемент.

---

## 5. Множественные типы врагов

### Архитектура: один класс Enemy + конфиг-маршрутизация
Не создавать отдельный класс на каждого врага. Один `Enemy` принимает `enemyType` и выбирает спрайт-конфиг:
```js
const SPRITE_CONFIGS = {
  enemy2: ENEMY2_SPRITES,
  enemy3: ENEMY3_SPRITES,
};

constructor(x, y, hp, speedMultiplier, enemyType = 'enemy2') {
  const spriteConfig = SPRITE_CONFIGS[enemyType] || ENEMY2_SPRITES;
  this.animation = new AnimationController(spriteConfig);
  this.mirrorLeft = spriteConfig.mirrorLeft || false;
  this.enemyType = enemyType;
}
```

### Render data — Enemy передаёт всё что нужно
`render()` возвращает объект с `enemyType` и `needsFlip`, GameScene выбирает правильное изображение:
```js
// Enemy.render():
return { frameData, drawX, drawY, width, height, flashWhite, enemyType, needsFlip };

// GameScene.renderEnemy():
const imgKey = enemyType || 'enemy2';
const enemyImg = this.assets.get(imgKey);
if (needsFlip) { ctx.translate(...); ctx.scale(-1, 1); ... }
```

### SpawnSystem — случайный выбор типа
```js
const enemyType = Math.random() < 0.5 ? 'enemy2' : 'enemy3';
```

### Чеклист добавления нового типа врага
1. Добавить PNG файл в корень проекта
2. `spriteData.js` — добавить `ENEMY_NEW_SPRITES` с координатами кадров + `mirrorLeft` если нужен флип
3. `Enemy.js` — импорт + запись в `SPRITE_CONFIGS`
4. `main.js` — добавить в manifest + `removeBackground('enemyNew')`
5. `SpawnSystem.js` — добавить в рандом при спавне
6. `GameScene.js` — импорт (если нужен для чего-то кроме рендера)
7. `tools/cut-sprites.js` — добавить нарезку для reference-кадров
8. Запустить `node tools/cut-sprites.js` и `npx jest`

### Удаление типа врага — тоже чеклист
1. `SpawnSystem.js` — убрать из спавна
2. `Enemy.js` — убрать из `SPRITE_CONFIGS`, из импорта, сменить дефолтный тип
3. `main.js` — убрать из manifest и `removeBackground()`
4. `GameScene.js` — убрать из импорта
5. Можно оставить конфиг в `spriteData.js` и PNG — они станут мёртвым кодом, но ничего не сломают. Или почистить полностью.

---

## 6. Entity State Machine

### Паттерн
```js
const PlayerState = {
  IDLE: 'idle', WALKING: 'walking', JUMPING: 'jumping',
  PUNCHING: 'punching', HURT: 'hurt', DEAD: 'dead',
};
```

### Правила переходов
```
idle ←→ walking (по input)
idle/walking → jumping (Space, когда isOnGround)
idle/walking → punching (Ctrl, не в прыжке)
any → hurt (при получении урона, если не invulnerable)
any → dead (hp <= 0)
```

### Грабли стейт-машины

**Блокировка ввода в определённых состояниях:**
```js
if (state === DEAD) return;   // мёртвый — ничего
if (state === HURT) return;   // stunlock — нельзя двигаться
if (state === PUNCHING) { ... } // нельзя ходить, но удар уже идёт
```
Если не блокировать, игрок будет ходить во время анимации удара.

**Переход из PUNCHING обратно:**
Punch имеет таймер (`punchTimer`). Когда он истекает → принудительно `state = IDLE`. Если забыть сбросить `attackBox = null`, хитбокс удара останется навсегда.

**Invulnerability после урона:**
Без неуязвимости после попадания враг наносит damage каждый кадр (60 fps → 600 damage/sec). Нужен `invulnerableTimer` + визуальный мигание (`flashVisible` toggle каждые 100ms).

---

## 7. Система перемещения и глубина (Y-axis)

### Beat-em-up глубина (Streets of Rage стиль)
Определить зону перемещения:
```js
MIN_WALK_Y = 300;  // верхняя граница (дальше от камеры)
MAX_WALK_Y = 430;  // нижняя граница (ближе к камере)
```

### Игрок
- `groundY` — текущая "плоскость земли" игрока. Меняется стрелками вверх/вниз.
- При прыжке `y` улетает вверх, при приземлении возвращается к `groundY` (не к фиксированному `GROUND_Y`).
- Clamp: `groundY` всегда в `[MIN_WALK_Y, MAX_WALK_Y]`.

```js
// handleInput — только направление
if (input.isUp()) this.walkDirY = -1;
else if (input.isDown()) this.walkDirY = 1;
else this.walkDirY = 0;

// update(dt) — реальное перемещение
if (this.isOnGround && this.walkDirY !== 0) {
  this.groundY += this.walkDirY * PLAYER_SPEED_Y * dt;
  this.groundY = clamp(this.groundY, MIN_WALK_Y, MAX_WALK_Y);
  this.y = this.groundY;
}
```

### Враги — Y-drift
Враги дрейфуют по Y самостоятельно:
```js
this.yDriftDir = Math.random() < 0.5 ? 1 : -1;
this.yDriftInterval = 2000 + Math.random() * 2000; // менять направление каждые 2-4 сек
```
При достижении границы — отскок (`yDriftDir *= -1`).

### Depth sorting (критично!)
Рендерить сущности в порядке возрастания Y:
```js
renderables.sort((a, b) => a.y - b.y);
```
Кто ниже на экране (больший Y = ближе к камере) — рисуется **поверх**. Без этого враг на переднем плане может оказаться за игроком.

### Спавн на случайном Y
```js
const spawnY = MIN_WALK_Y + Math.random() * (MAX_WALK_Y - MIN_WALK_Y);
```
Больше не на фиксированном GROUND_Y.

---

## 8. Прыжки и гравитация

```js
const JUMP_VELOCITY = -500;  // отрицательный = вверх
const GRAVITY = 1200;        // px/sec^2

// В update():
if (!this.isOnGround) {
  this.velocityY += GRAVITY * dt;
  this.y += this.velocityY * dt;
  if (this.y >= this.groundY) {  // приземление
    this.y = this.groundY;
    this.velocityY = 0;
    this.onLand();
  }
}
```

### Грабли прыжков
| Проблема | Причина | Решение |
|----------|---------|---------|
| Бесконечный прыжок | Нет проверки `isOnGround` | `if (isOnGround && input.isJump())` |
| Прыжок не с той Y | Приземление на фиксированный `GROUND_Y` | Приземлять на `this.groundY` |
| Залипание в воздухе | `velocityY` не сбрасывается | `this.velocityY = 0` при приземлении |
| Прыжок во время удара | Нет guard'а | `state !== PUNCHING` перед прыжком |

### Анимация прыжка по фазам
```js
if (velocityY < -100)  → jumpUp
if (velocityY < 100)   → jumpAir
else                    → jumpLand
```

---

## 9. Камера и мир

### Следование за игроком
```js
targetX = player.x - canvas.width * 0.3; // игрок на 30% от левого края
this.x = clamp(targetX, 0, WORLD_WIDTH - canvas.width);
```

### Camera shake
```js
shake(intensity, duration) → random offset с decay за duration ms
getDrawX() → -this.x + shakeOffsetX
```
Все объекты мира рендерятся с `+ camera.getDrawX()`.

### Параллакс фона
```js
const parallaxX = -camera.x * 0.5; // фон двигается в 2 раза медленнее
```
Тайлить фон так, чтобы не было щелей: рисовать от `startX - bgWidth` до `CANVAS_WIDTH`.

### Грабля: мировые vs экранные координаты
- **Мировые** — `entity.x`, `entity.y`. Коллизии проверяются в мировых.
- **Экранные** — `entity.x + camera.getDrawX()`. Только для рендера.
- **HUD** — рисуется в экранных координатах без камеры.

---

## 10. Коллизии и хитбоксы

### AABB (Axis-Aligned Bounding Box)
```js
function aabbCollision(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x &&
         a.y < b.y + b.height && a.y + a.height > b.y;
}
```

### Два типа коллизий в beat-em-up

**Attack collisions** — хитбокс удара игрока vs тело врага:
```js
this.attackBox = {
  x: this.facingRight ? this.x + this.width : this.x - attackWidth,
  y: this.y + 20,
  width: 50, height: 40,
};
```
- `attackBox` существует только во время `PUNCHING` state. Обнуляется при выходе.
- **Грабля**: `attackBox` должен обновляться каждый кадр (`updateAttackBox()`), потому что игрок может двигаться во время удара.

**Contact collisions** — тело врага vs тело игрока (контактный урон):
- Нужен `contactCooldown` на враге (1000ms), иначе урон наносится 60 раз в секунду.
- `break` после первого контактного попадания за кадр — не суммировать урон от всех врагов сразу.

### Грабля: дублирование попаданий за один удар
Один удар длится 300ms, за это время коллизия срабатывает ~18 раз. Решение:
```js
this.hitEnemiesThisPunch = new Set();
// При попадании:
if (this.hitEnemiesThisPunch.has(enemy)) continue;
this.hitEnemiesThisPunch.add(enemy);
// При завершении удара:
this.hitEnemiesThisPunch.clear();
```

---

## 11. Боевая система и комбо

### Combo механика
```js
comboCount++; при каждом попадании
comboTimer = COMBO_TIMEOUT (2000ms); // таймер сброса
// Если таймер истёк:
comboCount = 0; comboMultiplier = 1;
```

### Множители комбо (считать от большего к меньшему!)
```js
COMBO_MULTIPLIERS = [
  { hits: 10, multiplier: 5 },
  { hits: 6,  multiplier: 3 },
  { hits: 3,  multiplier: 2 },
];
// Первое совпадение — берём и break
```
**Грабля**: если проверять от меньшего к большему, всегда сработает `hits: 3` и multiplier никогда не вырастет выше x2.

### Kill score
```js
points = KILL_SCORE * comboMultiplier;
```

### Отслеживание конца удара в GameScene
```js
if (this.wasPunching && player.state !== PUNCHING) {
  combat.onPunchEnd(); // очистить hitEnemiesThisPunch
}
this.wasPunching = player.state === PUNCHING;
```
**Грабля**: если вызвать `onPunchEnd()` слишком рано (в том же кадре, когда удар ещё идёт), Set очистится, и враг получит двойной урон.

---

## 12. Система уровней и прогрессия

### Структура уровня
```js
{
  id: 1, name: 'Окраина', scoreThreshold: 0,
  enemyHP: 30, enemySpeedMultiplier: 1.0,
  spawnInterval: 3000, background: 'level1',
  musicStyle: 1,
}
```
Каждый уровень настраивает: HP врагов, скорость, частоту спавна, фон и стиль музыки.

### Масштабирование на много уровней
При 6 уровнях (очки: 0 → 500 → 1500 → 3000 → 5000 → 8000, победа при 12000):
- Рост HP: 30 → 50 → 70 → 90 → 110 → 140
- Рост скорости: 1.0 → 1.3 → 1.6 → 1.8 → 2.0 → 2.3
- Уменьшение интервала спавна: 3000 → 2500 → 2000 → 1800 → 1500 → 1200
- Смена `musicStyle` на поздних уровнях для нарастания напряжения

### Множественные фоновые изображения
Фоны могут приходить из разных файлов. `BACKGROUND_REGIONS` теперь содержит `sheet` — ключ ассета:
```js
export const BACKGROUND_REGIONS = {
  level1: { sheet: 'backgrounds',  x: 0, y: 0,   w: 617, h: 341 },
  level4: { sheet: 'backgrounds2', x: 0, y: 0,   w: 610, h: 341 },
};
```
В рендере фона:
```js
const region = BACKGROUND_REGIONS[this.currentBgKey];
const bgImg = this.assets.get(region.sheet || 'backgrounds');
```
**Грабля**: если добавить `sheet` в BACKGROUND_REGIONS, но рендер читает хардкод `this.assets.get('backgrounds')` — новые фоны не покажутся. Всегда брать sheet из region.

### Проверка прогрессии — WHILE, не IF
```js
while (currentLevel < levels.length - 1 && score >= levels[currentLevel + 1].scoreThreshold) {
  currentLevel++;
  emit('levelUp', { level: levels[currentLevel] });
}
```
**Грабля**: с `if` вместо `while` при одном убийстве с большим комбо-множителем можно набрать очки сразу на 2 уровня, но повысится только на 1.

### При levelUp
1. `SpawnSystem.configure(newLevel)` — обновить HP/скорость/интервал врагов.
2. Сменить фон (`currentBgKey = level.background`).
3. Сменить стиль музыки (`audio.setMusicStyle(level.musicStyle)`).
4. Уже заспавненные враги остаются со старыми параметрами — это нормально.

---

## 13. Система сцен

### Жизненный цикл
```
enter(data) → [update(dt) + render(ctx)] loop → exit()
```

### Паттерн "пауза поверх игры"
PauseScene хранит ссылку на GameScene и рендерит его как фон:
```js
enter(data) { this.gameScene = data.gameScene; this.audio = data.audio; }
render(ctx) {
  this.gameScene.render(ctx);  // фон
  // затем тёмный overlay + текст
}
```
При resume — не делать `switch('game')`, а напрямую восстановить + возобновить музыку:
```js
if (this.audio) { this.audio.resume(); this.audio.startMusic(); }
this.sceneManager.currentScene = this.gameScene;
this.sceneManager.currentSceneName = 'game';
```
**Грабля**: если сделать обычный `switch('game')`, вызовется `enter()` и вся игра перезапустится.

### Передача данных между сценами
```js
sceneManager.switch('gameover', { score, kills, maxCombo });
sceneManager.switch('pause', { gameScene: this, audio: this.audio });
```

---

## 14. Аудио (Web Audio API)

### Процедурная генерация (без файлов!)
Для прототипа/инди звуки можно синтезировать:

| Звук | Рецепт |
|------|--------|
| **Kick** | `sine` 150Hz → 50Hz за 0.1s, gain decay 0.15s |
| **Snare** | Noise burst (random buffer) + highpass 1000Hz, 0.1s |
| **Hi-hat** | Noise burst + highpass 5000Hz, 0.05s, тихий |
| **Bass (style 1)** | `sawtooth` ~55-65Hz + lowpass 300Hz, 0.4s |
| **Bass (style 2, intense)** | `square` 55-87Hz + lowpass 250Hz, pitch drop ×0.5 за 0.3s |
| **Hit sound** | Noise 0.08s + `square` 800→200Hz за 0.06s |
| **Hurt sound** | `sine` 200→60Hz за 0.2s + noise 0.15s |

### Стили музыки (musicStyle)
Музыка поддерживает несколько стилей, переключаемых по уровням:

**Style 1** (BPM 120) — стандартный 4-beat loop: kick → hat → snare → hat + bass на beat 1.

**Style 2** (BPM 140) — intense 8-step pattern: double-time, синкопа, двойной kick, агрессивный square-wave bass.

```js
audio.setMusicStyle(2); // переключает стиль, перезапускает loop если играет
```

Паттерн для добавления нового стиля:
1. Добавить `_scheduleDrumLoopNewStyle()` в AudioManager
2. В `_scheduleDrumLoop()` добавить `if (this.musicStyle === N) { this._scheduleDrumLoopNewStyle(); return; }`
3. В `constants.js` → `LEVELS` → `musicStyle: N`

### AudioContext — autoplay policy
Браузеры блокируют AudioContext до первого пользовательского действия:
```js
const unlock = () => {
  audio._ensureContext();
  audio.resume();
  document.removeEventListener('keydown', unlock);
  document.removeEventListener('mousedown', unlock);
};
document.addEventListener('keydown', unlock);
document.addEventListener('mousedown', unlock);
```

### Грабли аудио
| Проблема | Причина | Решение |
|----------|---------|---------|
| Звук не играет | AudioContext suspended | `ctx.resume()` после user gesture |
| Ошибка "cannot call start on ended node" | OscillatorNode одноразовый | Создавать новый node каждый раз |
| Музыка не останавливается | setTimeout продолжает | Хранить timer IDs, `clearTimeout` при stop |
| Тесты падают | Нет AudioContext в jsdom | Mock в setup.js |
| Мут не работает | Мутить каждый node отдельно | Один `masterGain` node → destination |
| setMusicStyle не меняет звук | Нет перезапуска loop | `stopMusic()` + `startMusic()` внутри |
| Музыка не возобновляется после паузы | `startMusic()` видит `musicPlaying=true` | `stopMusic()` перед паузой, `startMusic()` при resume |

### Lazy AudioContext
```js
_ensureContext() {
  if (this.ctx) return;
  this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  this.masterGain = this.ctx.createGain();
  this.masterGain.connect(this.ctx.destination);
}
```
Все публичные методы — guard `if (!this.ctx) return;`.

---

## 15. Партикл-система

### Базовая частица
```js
{ x, y, vx, vy, life, maxLife, size, color, gravity, text, fontSize }
```

### Типы эффектов
- **Damage numbers**: текстовые, летят вверх (`vy: -80`), без gravity.
- **Hit sparks**: 8-10 штук, радиальное распределение, white/yellow/orange, gravity.
- **Combo sparks**: масштаб по множителю, больше частиц, ярче цвета.
- **Dust**: при приземлении, мелкие, разлетаются в стороны.
- **Confetti**: победа, сверху вниз, разноцветные.
- **Screen flash**: не частица, а overlay: `rgba(255,255,255, alpha)` поверх всей сцены, decay по таймеру.

### Грабля: мировые vs UI частицы
Hit sparks и damage numbers живут в **мировых координатах** → `render(ctx, camera)` со смещением.
Confetti и HUD-эффекты — в **экранных** → `renderUI(ctx)` без камеры.

---

## 16. Ввод (Input)

### Два типа: isKeyDown vs isKeyPressed
- `isKeyDown(code)` — зажата прямо сейчас (для ходьбы, движения).
- `isKeyPressed(code)` — нажата впервые в этом кадре (для прыжка, удара, паузы, мут).

```js
_onKeyDown(e) {
  if (!this.keys[e.code]) this.justPressed[e.code] = true;
  this.keys[e.code] = true;
}
update() { this.justPressed = {}; } // вызывать в конце кадра!
```

### Грабля: justPressed не очищается
Если забыть вызвать `input.update()` в конце game loop, `isKeyPressed` будет возвращать true вечно. Один нажатие паузы → бесконечная пауза/снятие паузы.

### Грабля: добавление новых input-методов ломает старый код
При добавлении `isUp()`/`isDown()`/`isMute()` — старый код (тесты, мок-объекты) не имеет этих методов. Защита:
```js
if (input.isUp && input.isUp()) { ... }
```
Проверка существования метода перед вызовом.

### preventDefault для игровых клавиш
```js
if (['Space', 'ArrowUp', 'ArrowDown', ...].includes(e.code)) {
  e.preventDefault();
}
```
Без этого стрелки будут скроллить страницу, Space — прокручивать вниз.

---

## 17. Тестирование

### Стек: Jest + jsdom + Babel
- `jest-environment-jsdom` — имитация DOM.
- `babel-jest` + `@babel/preset-env` — трансформация ESM → CJS (только для тестов).
- `tests/setup.js` — моки Canvas, requestAnimationFrame, Image, AudioContext.

### Что мокать
```js
// Canvas 2D context — все методы jest.fn()
HTMLCanvasElement.prototype.getContext = function(type) {
  if (type === '2d') return { fillRect: jest.fn(), drawImage: jest.fn(), ... };
};

// AudioContext
class MockAudioContext {
  createGain() { return { gain: { value: 1, setValueAtTime: jest.fn(), ... }, connect() { return this; } }; }
  createOscillator() { return { frequency: { ... }, connect() { return this; }, start() {}, stop() {} }; }
  createBuffer(ch, len, sr) { return { getChannelData: () => new Float32Array(len) }; }
  createBiquadFilter() { return { type: 'lowpass', frequency: { value: 350, ... }, connect() { return this; } }; }
}
```

### Паттерн тестов
```js
// Создать объект
const player = new Player();
// Подготовить мок input
const input = { isRight: () => true, isLeft: () => false, isPunch: () => false, ... };
// Вызвать логику
player.handleInput(input);
player.update(1/60);
// Проверить состояние
expect(player.x).toBeGreaterThan(startX);
```

### Грабля: тесты не видят изменений AnimationController
`play('idle')` в конструкторе устанавливает начальное состояние. Если тест проверяет анимацию после действия, нужно убедиться что `play()` вызван с правильным именем, а не что кадр уже обновился (кадр обновляется в `animation.update(dt)`).

---

## 18. Частые ошибки и грабли

### Спрайты

1. **"Враг вращается"** — неравномерная ширина кадров walk-анимации. Привести к uniform width.
2. **"Враг осциллирует у игрока"** — враг доходит до игрока, разворачивается (face left), через 1 кадр снова face right. Решение: зона остановки (`if (dist < 30) return;`), чтобы не менять направление вплотную.
3. **"Белый квадрат вместо спрайта"** — `removeBackground()` не вызван или спрайт-шит не загрузился. Проверить `AssetLoader.get(key)`.
4. **"Спрайт обрезан"** — неправильные координаты в `spriteData.js`. Использовать `debug-sprites.html`.
5. **"Новый враг — невидимка"** — добавлен в spriteData и SpawnSystem, но забыли добавить в manifest `main.js` и `removeBackground()`.
6. **"Зеркальный враг рисуется со сдвигом"** — после `ctx.scale(-1,1)` рисовать в `(0,0)`, а не в `(drawX, drawY)`. Translate уже сдвинул.

### Физика

7. **"Игрок проваливается сквозь землю"** — `GROUND_Y` не совпадает с `groundY`. После добавления Y-axis movement использовать `this.groundY`, а не константу.
8. **"Прыжок не возвращает на ту же Y"** — приземление на `GROUND_Y` вместо `this.groundY`.
9. **"Игрок ходит за пределы мира"** — нет clamp: `if (x < 0) x = 0; if (x + width > WORLD_WIDTH) x = WORLD_WIDTH - width;`

### Боёвка

10. **"Один удар убивает"** — `hitEnemiesThisPunch` не используется, урон наносится каждый кадр удара.
11. **"Combo multiplier не растёт"** — `COMBO_MULTIPLIERS` проверяются от маленького к большому. Проверять от большего к меньшему.
12. **"Игрок мгновенно умирает при касании врага"** — нет `contactCooldown` на враге. Один кадр контакта = один хит.

### Уровни и фоны

13. **"Фон не меняется на уровне 4+"** — рендер хардкодит `this.assets.get('backgrounds')` вместо `region.sheet`. Всегда брать sheet из `BACKGROUND_REGIONS[key]`.
14. **"Игра падает при levelUp"** — `BACKGROUND_REGIONS` не содержит ключа `level4`. Добавить регионы для всех уровней.
15. **"Прогрессия перескакивает уровни"** — `if` вместо `while` в `checkProgression`. Использовать `while`.

### Сцены

16. **"При рестарте события дублируются"** — `eventBus.clear()` не вызван в `enter()`.
17. **"Пауза перезапускает игру"** — `switch('game')` вместо прямого восстановления `currentScene`.
18. **"Звук продолжает играть после паузы"** — не вызван `audio.stopMusic()` при переходе на паузу.

### Аудио

19. **"Звук не играет"** — AudioContext suspended, нужен user gesture для `resume()`.
20. **"Cannot start stopped OscillatorNode"** — OscillatorNode одноразовый, создавать новый каждый раз.
21. **"Таймеры музыки протекают"** — `setTimeout` ID не сохраняются → `clearTimeout` невозможен.
22. **"Музыка не меняется при смене уровня"** — `setMusicStyle()` не вызывается в обработчике `levelUp`. Подписаться на EventBus.
23. **"Музыка не возобновляется из паузы"** — `startMusic()` видит `musicPlaying=true`. Нужен `stopMusic()` при входе в паузу.

### Тесты

24. **"ReferenceError: AudioContext is not defined"** — нет мока в `setup.js`.
25. **"Test passes locally but fails in CI"** — `Date.now` vs `performance.now` расхождения. Мокать `performance.now`.
26. **"Cannot use import statement outside a module"** — Babel не настроен или `babel.config.json` не подхватывается.

---

## 19. Чеклист нового проекта

### Минимальный каркас
- [ ] `index.html` с `<canvas>` + loading screen
- [ ] `js/main.js` — Game class, asset loading, scene wiring, AudioContext unlock
- [ ] `js/core/GameLoop.js` — requestAnimationFrame + dt clamp
- [ ] `js/core/InputManager.js` — keydown/keyup + justPressed + update() + isUp/isDown/isMute
- [ ] `js/core/Camera.js` — follow + shake + getDrawX/Y
- [ ] `js/core/EventBus.js` — on/emit/clear
- [ ] `js/core/SceneManager.js` — add/switch/update/render
- [ ] `js/core/AssetLoader.js` — loadImage + loadAll + removeBackground
- [ ] `js/core/AudioManager.js` — Web Audio procedural sounds + music + musicStyle
- [ ] `js/config/constants.js` — ВСЕ числа в одном месте, включая LEVELS с musicStyle
- [ ] `js/config/spriteData.js` — координаты кадров + BACKGROUND_REGIONS с `sheet`
- [ ] `js/entities/Entity.js` — базовый класс (x, y, hp, bounds)
- [ ] `tests/setup.js` — моки Canvas, Image, AudioContext

### Перед "первым играбельным"
- [ ] Player state machine (idle/walk/jump/punch/hurt/dead) + groundY + walkDirY
- [ ] Enemy class с SPRITE_CONFIGS routing по enemyType + mirrorLeft + Y-drift
- [ ] CollisionSystem (attack + contact)
- [ ] CombatSystem (damage + combo + score + events)
- [ ] SpawnSystem (timer + max count + random Y + random enemyType)
- [ ] Depth sorting (sort by Y before render)
- [ ] HUD (HP bar, score, combo display)
- [ ] Pause scene (overlay + resume without restart + audio stop/resume)

### Полировка
- [ ] Screen shake при попадании по игроку
- [ ] Particle effects (hit sparks, damage numbers, dust, combo sparks)
- [ ] Screen flash при комбо
- [ ] Audio: hit sound, hurt sound, background music
- [ ] Multiple music styles (переключение по уровням)
- [ ] Mute toggle (клавиша N)
- [ ] Level progression (6 уровней, score thresholds)
- [ ] Multiple background sheets (fone.png + fone2.png, region.sheet routing)
- [ ] Menu scene с полным controls list (move, jump, punch, up/down, mute, pause)
- [ ] Victory/GameOver scenes

---

*Последнее обновление: 2026-03-03*
