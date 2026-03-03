// Hero sprite sheet: avatar.png (617x1024)
// 4x4 grid: each frame ~154x256
export const HERO_SPRITES = {
  sheet: 'hero',
  frameWidth: 154, // 617 / 4 ≈ 154.25
  frameHeight: 256, // 1024 / 4
  animations: {
    // Row 1: Walking forward in boxing stance (4a, 4b, 4c, 4d)
    walkForward: { row: 0, col: 0, frames: 4, fps: 8, loop: true },
    // Row 2: Idle stance (2a), Left jab (2b), Rear stance (3a), Right punch rear (3b)
    idle: { row: 1, col: 0, frames: 1, fps: 1, loop: true },
    punchLeft: { row: 1, col: 1, frames: 1, fps: 1, loop: false },
    idleBack: { row: 1, col: 2, frames: 1, fps: 1, loop: true },
    punchRight: { row: 1, col: 3, frames: 1, fps: 1, loop: false },
    // Row 3: Jump sequence (6a crouch, 6b takeoff, 6c air, 6d landing)
    jumpCrouch: { row: 2, col: 0, frames: 1, fps: 1, loop: false },
    jumpUp: { row: 2, col: 1, frames: 1, fps: 1, loop: false },
    jumpAir: { row: 2, col: 2, frames: 1, fps: 1, loop: false },
    jumpLand: { row: 2, col: 3, frames: 1, fps: 1, loop: false },
    // Row 4: Walking backward casual (5a, 5b, 5c, 5d)
    walkBack: { row: 3, col: 0, frames: 4, fps: 8, loop: true },
  },
};

// Enemy2 sprite sheet: solde2.png (890x1024)
// Only walkRight and deathRight exist; walkLeft/deathLeft use the same frames + canvas flip.
// mirrorLeft flag tells the renderer to horizontally flip when playing "left" animations.
const enemy2WalkFrames = [
  { x: 45, y: 79, w: 145, h: 316 },
  { x: 203, y: 79, w: 115, h: 316 },
  { x: 339, y: 79, w: 105, h: 316 },
  { x: 465, y: 79, w: 121, h: 316 },
  { x: 604, y: 79, w: 118, h: 316 },
  { x: 735, y: 79, w: 138, h: 315 },
];
const enemy2DeathFrames = [
  { x: 73, y: 483, w: 109, h: 296 },
  { x: 266, y: 496, w: 162, h: 280 },
  { x: 439, y: 534, w: 182, h: 242 },
  { x: 635, y: 560, w: 231, h: 188 },
  { x: 52, y: 856, w: 265, h: 126 },
  { x: 329, y: 850, w: 226, h: 132 },
  { x: 568, y: 877, w: 296, h: 104 },
];

export const ENEMY2_SPRITES = {
  sheet: 'enemy2',
  mirrorLeft: true,
  animations: {
    walkRight: { frames: enemy2WalkFrames, fps: 8, loop: true },
    walkLeft: { frames: enemy2WalkFrames, fps: 8, loop: true },
    deathRight: { frames: enemy2DeathFrames, fps: 6, loop: false },
    deathLeft: { frames: enemy2DeathFrames, fps: 6, loop: false },
  },
};

// Enemy3 sprite sheet: 3.png (718x1024)
// Only walkRight and deathRight exist; walkLeft/deathLeft use the same frames + canvas flip.
const enemy3WalkFrames = [
  { x: 5, y: 24, w: 119, h: 245 },
  { x: 131, y: 24, w: 97, h: 245 },
  { x: 241, y: 24, w: 108, h: 245 },
  { x: 363, y: 24, w: 104, h: 245 },
  { x: 475, y: 24, w: 123, h: 244 },
  { x: 602, y: 24, w: 97, h: 245 },
];
const enemy3DeathFrames = [
  { x: 17, y: 308, w: 137, h: 235 },
  { x: 163, y: 340, w: 161, h: 205 },
  { x: 329, y: 363, w: 175, h: 182 },
  { x: 509, y: 388, w: 204, h: 153 },
  { x: 28, y: 618, w: 288, h: 136 },
  { x: 378, y: 617, w: 299, h: 124 },
  { x: 39, y: 810, w: 279, h: 153 },
  { x: 360, y: 808, w: 341, h: 162 },
];

export const ENEMY3_SPRITES = {
  sheet: 'enemy3',
  mirrorLeft: true,
  animations: {
    walkRight: { frames: enemy3WalkFrames, fps: 8, loop: true },
    walkLeft: { frames: enemy3WalkFrames, fps: 8, loop: true },
    deathRight: { frames: enemy3DeathFrames, fps: 6, loop: false },
    deathLeft: { frames: enemy3DeathFrames, fps: 6, loop: false },
  },
};

// Background sprites — each region specifies which sheet image to use
// fone.png (617x1024): 3 strips stacked vertically
// fone2.png (610x1024): 3 strips stacked vertically
export const BACKGROUND_REGIONS = {
  level1: { sheet: 'backgrounds', x: 0, y: 0, w: 617, h: 341 },
  level2: { sheet: 'backgrounds', x: 0, y: 341, w: 617, h: 342 },
  level3: { sheet: 'backgrounds', x: 0, y: 683, w: 617, h: 341 },
  level4: { sheet: 'backgrounds2', x: 0, y: 0, w: 610, h: 341 },
  level5: { sheet: 'backgrounds2', x: 0, y: 341, w: 610, h: 342 },
  level6: { sheet: 'backgrounds2', x: 0, y: 683, w: 610, h: 341 },
};
