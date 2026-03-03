// Game constants
export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 540;

// World
export const WORLD_WIDTH = 3000;
export const GROUND_Y = 390; // Ground level Y position (top of entity; player bottom at 390+130=520)

// Player
export const PLAYER_MAX_HP = 100;
export const PLAYER_SPEED = 200; // px/sec
export const PLAYER_PUNCH_DAMAGE = 15;
export const PLAYER_INVULNERABILITY_TIME = 1000; // ms
export const PLAYER_START_X = 100;
export const PLAYER_START_Y = GROUND_Y;

// Y-axis movement (depth, Streets of Rage style)
export const MIN_WALK_Y = 300;        // upper boundary of walk zone
export const MAX_WALK_Y = 430;        // lower boundary
export const PLAYER_SPEED_Y = 150;    // player Y movement speed
export const ENEMY_Y_DRIFT_SPEED = 20; // enemy Y drift speed

// Jump physics
export const JUMP_VELOCITY = -500; // initial upward velocity
export const GRAVITY = 1200; // px/sec^2

// Enemy
export const ENEMY_CONTACT_DAMAGE = 10;
export const ENEMY_CONTACT_COOLDOWN = 1000; // ms
export const ENEMY_MAX_ON_SCREEN = 5;

// Level config
// musicStyle: 1 = default drum loop, 2 = intense loop, etc.
export const LEVELS = [
  {
    id: 1,
    name: 'Окраина города',
    scoreThreshold: 0,
    enemyHP: 30,
    enemySpeedMultiplier: 1.0,
    spawnInterval: 3000,
    background: 'level1',
    musicStyle: 1,
  },
  {
    id: 2,
    name: 'Центр руин',
    scoreThreshold: 500,
    enemyHP: 50,
    enemySpeedMultiplier: 1.3,
    spawnInterval: 2500,
    background: 'level2',
    musicStyle: 1,
  },
  {
    id: 3,
    name: 'Сердце хаоса',
    scoreThreshold: 1500,
    enemyHP: 70,
    enemySpeedMultiplier: 1.6,
    spawnInterval: 2000,
    background: 'level3',
    musicStyle: 1,
  },
  {
    id: 4,
    name: 'Пепелище',
    scoreThreshold: 3000,
    enemyHP: 90,
    enemySpeedMultiplier: 1.8,
    spawnInterval: 1800,
    background: 'level4',
    musicStyle: 2,
  },
  {
    id: 5,
    name: 'Мёртвый квартал',
    scoreThreshold: 5000,
    enemyHP: 110,
    enemySpeedMultiplier: 2.0,
    spawnInterval: 1500,
    background: 'level5',
    musicStyle: 2,
  },
  {
    id: 6,
    name: 'Точка невозврата',
    scoreThreshold: 8000,
    enemyHP: 140,
    enemySpeedMultiplier: 2.3,
    spawnInterval: 1200,
    background: 'level6',
    musicStyle: 2,
    boss: true,
  },
];

// Scoring
export const KILL_SCORE = 100;
export const VICTORY_SCORE = 12000;

// Combo
export const COMBO_TIMEOUT = 2000; // ms before combo resets
export const COMBO_MULTIPLIERS = [
  { hits: 10, multiplier: 5 },
  { hits: 6, multiplier: 3 },
  { hits: 3, multiplier: 2 },
];

// Camera
export const CAMERA_OFFSET_X = 0.3; // player at 30% from left
export const CAMERA_SHAKE_INTENSITY = 4; // px
export const CAMERA_SHAKE_DURATION = 200; // ms

// Enemy base speed
export const ENEMY_BASE_SPEED = 60; // px/sec

// Colors
export const COLORS = {
  background: '#1a1a2e',
  accent: '#e94560',
  secondary: '#d4a574',
  text: '#f5f5dc',
  playerHP: '#4ecca3',
  enemyHP: '#e94560',
  combo: '#ffc107',
};

// Animation
export const PUNCH_DURATION = 300; // ms
export const HURT_DURATION = 400; // ms
export const DEATH_ANIMATION_DURATION = 1000; // ms

// Hitstop — brief freeze on hit for punch impact feel
export const HITSTOP_DURATION = 50; // ms

// Knockback — push enemies away on punch hit
export const KNOCKBACK_FORCE = 150; // px

// Enemy AI — player seeking behavior
export const ENEMY_DETECT_RANGE = 350; // px — start chasing player
export const ENEMY_CHASE_SPEED_MULTIPLIER = 1.4; // faster when chasing

// Combo damage scaling — higher combo = more damage
// Effective damage = baseDamage * (1 + (comboMultiplier - 1) * COMBO_DAMAGE_SCALE)
export const COMBO_DAMAGE_SCALE = 0.25;

// Level-up announcement overlay duration
export const LEVEL_ANNOUNCE_DURATION = 2000; // ms

// Boss config (spawns on last level)
export const BOSS_HP_MULTIPLIER = 5;
export const BOSS_SIZE_MULTIPLIER = 1.6;
export const BOSS_SPEED_MULTIPLIER = 0.7; // slower but tanky
