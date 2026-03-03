# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm test                          # Run all tests (Jest + jsdom)
npm test -- --watch               # Watch mode
npx jest tests/core/Camera.test.js  # Run a single test file
npx jest --testPathPattern="Combat"  # Run tests matching a pattern
npx serve .                       # Start local dev server (open in browser)
node tools/cut-sprites.js         # Re-generate pre-cut sprite PNGs in assets/
```

## Architecture

**Boxing Liberation** is a 2D side-scrolling beat-em-up built on HTML5 Canvas with vanilla ES6 modules (no bundler). Jest + Babel transforms ESM for testing.

### Directory Layout

`js/` is organized as: `config/` (constants, sprite data), `core/` (Game loop, Camera, EventBus, InputManager, SceneManager, AssetLoader, AudioManager), `entities/` (Entity base, Player, Enemy), `scenes/` (Menu, Game, Pause, GameOver, Victory), `systems/` (Animation, Collision, Combat, Level, Particle, Physics, Spawn, Sprite), `utils/` (helpers). Tests mirror this under `tests/`.

### Key Layers

- **`js/main.js`** — Entry point. Creates `Game` class that wires together `AssetLoader`, `InputManager`, `AudioManager`, `SceneManager`, and `GameLoop`. Assets loaded: `avatar.png` (hero), `solde2.png` (enemy2), `3.png` (enemy3), `fone.png` (backgrounds 1-3), `fone2.png` (backgrounds 4-6). AudioContext is unlocked on first user interaction.
- **`js/config/constants.js`** — All gameplay tuning values (HP, speeds, level thresholds, combo multipliers, colors, Y-axis walk zone). Key values: `VICTORY_SCORE=12000`, `WORLD_WIDTH=3000`, 6 levels across 2 worlds with progressively harder enemies. Each level has a `musicStyle` field (1=standard, 2=intense).
- **`js/config/spriteData.js`** — Frame coordinates for sprite sheets. Hero uses uniform 4x4 grid (154x256 per frame). Enemies use explicit `{x, y, w, h}` rectangles per frame. `ENEMY2_SPRITES` and `ENEMY3_SPRITES` both have `mirrorLeft: true` — the renderer flips via `ctx.scale(-1,1)` for left-facing animations. `BACKGROUND_REGIONS` has a `sheet` property per region pointing to the loaded image key.

### Scene System

Scenes have `enter(data)`, `exit()`, `update(dt)`, `render(ctx)` lifecycle. SceneManager handles switching. Five scenes: `menu`, `game`, `pause`, `gameover`, `victory`. The pause scene holds a reference to the game scene to render behind its overlay and manages audio pause/resume.

### GameScene Orchestration

`GameScene` constructor takes `(sceneManager, inputManager, assetLoader, audioManager)`. `enter()` creates a fresh `Player`, resets all systems, wires up an `EventBus`, and starts music. The update loop: mute check → pause check → player input → player update → enemy spawn/update → collision detection → combat processing → camera follow → particles → screen flash decay. The EventBus connects combat outcomes to progression (`enemyKilled` → `LevelSystem.checkProgression` → potential `levelUp` or `victory` emit → scene switch).

Rendering uses **depth sorting**: all entities (player + enemies) are sorted by Y position before drawing. Screen flash overlay triggers on combo hits >= 3.

On `levelUp`, GameScene updates the background key, reconfigures `SpawnSystem`, and calls `audio.setMusicStyle()` to switch music when entering a new world.

### Y-axis Movement (Depth System)

The game uses a Streets-of-Rage-style Y-axis depth system. Player and enemies move freely within `[MIN_WALK_Y, MAX_WALK_Y]` (default 300–430). Player's `groundY` tracks current depth position and serves as the landing target after jumps. Enemies drift vertically with periodic direction changes. `SpawnSystem` spawns enemies at random Y within the walk zone.

### Entity State Machines

`Player` and `Enemy` each manage their own state (idle/walking/jumping/punching/hurt/dead). State determines which animation plays and what actions are allowed. Player handles its own gravity in `update()`. Entities carry an `AnimationController` from `AnimationSystem.js` that tracks current frame.

### Multiple Enemy Types

`Enemy` constructor accepts `enemyType` (default `'enemy2'`). The `SPRITE_CONFIGS` map in `Enemy.js` routes type strings to sprite configs: `enemy2` → `ENEMY2_SPRITES`, `enemy3` → `ENEMY3_SPRITES`. `SpawnSystem.spawn()` randomly picks between `enemy2` and `enemy3` (50/50).

Enemies with `mirrorLeft: true` in their sprite config expose `needsFlip` in render data; `GameScene.renderEnemy()` applies `ctx.scale(-1,1)` horizontal flip for left-facing animations.

**Walk frame normalization:** Enemy2 and Enemy3 have variable-width walk frames. `renderEnemy()` detects walk animations and scales each frame proportionally to the widest frame in the set, preventing visual jitter. Death animations intentionally use variable sizing.

**To add a new enemy type:** add sprite config to `spriteData.js` (with `mirrorLeft: true` if only right-facing frames exist), register in `SPRITE_CONFIGS` in `Enemy.js`, add to manifest in `main.js`, add `removeBackground()` call, update `SpawnSystem.spawn()` probability, and add cutting function in `tools/cut-sprites.js`.

### Level Progression (2 Worlds, 6 Levels)

Levels 1-3 use `fone.png` (backgrounds sheet), levels 4-6 use `fone2.png` (backgrounds2 sheet). `BACKGROUND_REGIONS` entries include a `sheet` property (`'backgrounds'` or `'backgrounds2'`), and `renderBackground()` uses `this.assets.get(region.sheet)`.

Score thresholds: 0, 500, 1500, 3000, 5000, 8000. Victory at 12000. Levels 4-6 have `musicStyle: 2` which triggers a faster, more intense drum loop.

**To add a new background world:** place PNG in root (e.g., `fone3.png`), add 3 regions to `BACKGROUND_REGIONS` with `sheet: 'backgrounds3'`, add to manifest in `main.js` (no `removeBackground`!), add 3 LEVELS entries in `constants.js` with `musicStyle`, increase `VICTORY_SCORE`, add cutting function in `tools/cut-sprites.js` with `skipBgRemoval=true`, and update LevelSystem tests.

### Audio System

`AudioManager` uses Web Audio API for procedural sound generation — no audio files. Two music styles: style 1 (120 BPM, standard kick/snare/hihat) and style 2 (140 BPM, double-time syncopated with aggressive bass). `setMusicStyle(style)` restarts the loop with the new pattern. Hit sounds, player hurt sounds, and mute toggle. AudioContext is created lazily via `_ensureContext()`. All methods are no-ops without a context.

### Sprite Rendering and Background Removal

Sprites are drawn directly from source sprite sheets via `ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)` — no pre-cut files at runtime. The `AnimationController.getCurrentFrameData()` returns either `{type:'grid', row, col}` (hero) or `{type:'rect', frame:{x,y,w,h}}` (enemy). Pre-cut sprite PNGs exist in `assets/sprites/{hero,enemy,enemy2,enemy3}/` for reference (generated by `node tools/cut-sprites.js`).

The source PNGs have white/checkerboard backgrounds instead of true alpha transparency. `AssetLoader.removeBackground(key)` uses **flood fill from image edges** + fringe cleanup at init time. Do NOT apply background removal to background images (`fone.png`, `fone2.png`).

**Important:** When modifying enemy sprite coordinates, use pixel analysis with maxRun>=15 threshold to distinguish real sprite content from small text labels. Use `debug-sprites.html` in the browser to visually analyze sprite sheet coordinates.

### Combat → Score → Level Flow

`CollisionSystem` returns hit lists → `CombatSystem.processAttackHits()` applies damage, tracks combo, emits events → `LevelSystem.checkProgression()` checks score thresholds and can advance multiple levels in one call (uses `while` loop) → emits `levelUp` which reconfigures `SpawnSystem` difficulty, swaps background region, and switches music style. `comboUpdate` event triggers screen flash and combo sparks when combo count >= 3.

### Test Setup

`tests/setup.js` mocks Canvas 2D context, `requestAnimationFrame`, `performance.now`, `Image`, and `AudioContext` (with createGain, createOscillator, createBuffer, createBiquadFilter). Tests import source modules directly; Babel (`babel.config.json`, test env only) transforms ESM to CJS for Jest. The `sharp` dependency is used only by `tools/cut-sprites.js` (Node.js sprite cutter), not at runtime. Test files live in `tests/` mirroring `js/` structure.
