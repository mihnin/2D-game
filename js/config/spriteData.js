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

// Enemy sprite sheet: solder.png (373x1024)
// Precise coordinates verified by pixel analysis (maxRun>=15 threshold)
//
// Layout (actual sprite y-ranges, excluding text labels):
//   Row 1 (Walk Right):   6 frames, y=53-188
//   Row 2a (Death Left):  4 standing frames, y=227-360
//   Row 2b (Death Left):  3 prone frames, y=360-469
//   Row 3 (Walk Left):    6 frames, y=535-669
//   Row 4a (Death Right): 4 standing frames, y=630-849
//   Row 4b (Death Right): 3 prone frames, y=810-959

export const ENEMY_SPRITES = {
  sheet: 'enemy',
  animations: {
    // Row 1: Walk right (6 frames) — uniform 61px columns, text labels excluded
    walkRight: {
      frames: [
        { x: 3, y: 53, w: 61, h: 136 },
        { x: 64, y: 53, w: 61, h: 136 },
        { x: 125, y: 53, w: 61, h: 136 },
        { x: 186, y: 53, w: 61, h: 136 },
        { x: 247, y: 53, w: 61, h: 136 },
        { x: 308, y: 53, w: 61, h: 136 },
      ],
      fps: 8,
      loop: true,
    },
    // Row 2: Fall backwards left / death (7 frames across 2 sub-rows)
    deathLeft: {
      frames: [
        { x: 26, y: 227, w: 33, h: 134 },
        { x: 89, y: 227, w: 59, h: 134 },
        { x: 168, y: 227, w: 83, h: 134 },
        { x: 258, y: 227, w: 107, h: 134 },
        { x: 9, y: 380, w: 113, h: 90 },
        { x: 133, y: 380, w: 97, h: 90 },
        { x: 232, y: 380, w: 123, h: 90 },
      ],
      fps: 6,
      loop: false,
    },
    // Row 3: Walk left (6 frames) — uniform 61px columns, text labels excluded
    walkLeft: {
      frames: [
        { x: 4, y: 535, w: 61, h: 135 },
        { x: 65, y: 535, w: 61, h: 135 },
        { x: 126, y: 535, w: 61, h: 135 },
        { x: 187, y: 535, w: 61, h: 135 },
        { x: 248, y: 535, w: 61, h: 135 },
        { x: 309, y: 535, w: 61, h: 135 },
      ],
      fps: 8,
      loop: true,
    },
    // Row 4: Fall backwards right / death mirror (7 frames across 2 sub-rows)
    deathRight: {
      frames: [
        { x: 4, y: 630, w: 92, h: 220 },
        { x: 96, y: 630, w: 92, h: 220 },
        { x: 189, y: 630, w: 91, h: 220 },
        { x: 280, y: 630, w: 90, h: 220 },
        { x: 11, y: 810, w: 84, h: 150 },
        { x: 122, y: 810, w: 130, h: 150 },
        { x: 305, y: 810, w: 47, h: 48 },
      ],
      fps: 6,
      loop: false,
    },
  },
};

// Background sprites from fone.png (617x1024)
// Three backgrounds stacked vertically, each ~617x341
export const BACKGROUND_REGIONS = {
  level1: { x: 0, y: 0, w: 617, h: 341 },
  level2: { x: 0, y: 341, w: 617, h: 342 },
  level3: { x: 0, y: 683, w: 617, h: 341 },
};
