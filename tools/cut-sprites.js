const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');

/**
 * Remove background using flood fill from image edges.
 * Same algorithm as AssetLoader.removeBackground() in the browser.
 *
 * Preserves white/light areas INSIDE sprites (like t-shirts)
 * while removing white and checkerboard backgrounds connected to edges.
 *
 * Mutates the buffer in-place (RGBA).
 */
function removeBackgroundFloodFill(buf, w, h) {
  const totalPixels = w * h;

  // Is this pixel background-like? (white, light gray, checkerboard, near-white)
  function isBgLike(pos) {
    const idx = pos * 4;
    if (buf[idx + 3] < 10) return true; // already transparent
    const r = buf[idx], g = buf[idx + 1], b = buf[idx + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max - min;
    // Neutral color (low saturation) AND bright
    return saturation < 30 && min > 155;
  }

  // --- Pass 1: Flood fill from edges ---
  const removed = new Uint8Array(totalPixels);
  const visited = new Uint8Array(totalPixels);
  const stack = [];

  // Seed from all edge pixels
  for (let x = 0; x < w; x++) {
    stack.push(x);                  // top row
    stack.push((h - 1) * w + x);   // bottom row
  }
  for (let y = 1; y < h - 1; y++) {
    stack.push(y * w);              // left column
    stack.push(y * w + w - 1);     // right column
  }

  while (stack.length > 0) {
    const pos = stack.pop();
    if (pos < 0 || pos >= totalPixels || visited[pos]) continue;
    if (!isBgLike(pos)) continue;

    visited[pos] = 1;
    removed[pos] = 1;
    buf[pos * 4 + 3] = 0; // Make transparent

    const x = pos % w;
    const y = (pos - x) / w;

    if (x > 0) stack.push(pos - 1);
    if (x < w - 1) stack.push(pos + 1);
    if (y > 0) stack.push(pos - w);
    if (y < h - 1) stack.push(pos + w);
  }

  // --- Pass 2: Fringe cleanup ---
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const pos = y * w + x;
      if (removed[pos]) continue;
      const idx = pos * 4;
      if (buf[idx + 3] < 10) continue;

      // Check if this pixel borders a removed pixel
      let bordersRemoved = false;
      if (x > 0 && removed[pos - 1]) bordersRemoved = true;
      else if (x < w - 1 && removed[pos + 1]) bordersRemoved = true;
      else if (y > 0 && removed[pos - w]) bordersRemoved = true;
      else if (y < h - 1 && removed[pos + w]) bordersRemoved = true;

      if (!bordersRemoved) continue;

      const r = buf[idx], g = buf[idx + 1], b = buf[idx + 2];
      const brightness = (r + g + b) / 3;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max - min;

      // Bright neutral fringe pixel — anti-aliasing against white bg
      if (saturation < 40 && brightness > 200) {
        const fade = Math.max(0, (brightness - 200) / 55);
        buf[idx + 3] = Math.round(buf[idx + 3] * (1 - fade));
      }
    }
  }

  return buf;
}

/**
 * Extract a region from an image, remove its background via flood fill, and save it.
 */
async function extractAndSave(src, left, top, width, height, outPath, skipBgRemoval = false) {
  const meta = await sharp(src).metadata();
  const clampedLeft = Math.max(0, Math.min(left, meta.width - 1));
  const clampedTop = Math.max(0, Math.min(top, meta.height - 1));
  const clampedWidth = Math.min(width, meta.width - clampedLeft);
  const clampedHeight = Math.min(height, meta.height - clampedTop);

  const { data, info } = await sharp(src)
    .extract({ left: clampedLeft, top: clampedTop, width: clampedWidth, height: clampedHeight })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (!skipBgRemoval) {
    removeBackgroundFloodFill(data, info.width, info.height);
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
    .png()
    .toFile(outPath);
}

// ============================================================================
// 1. AVATAR (hero) - 617x1024, 4x4 grid, each frame 154x256
// ============================================================================
async function cutAvatar() {
  console.log('--- Cutting avatar.png (hero sprites) ---');
  const src = path.join(ROOT, 'avatar.png');
  const outDir = path.join(ROOT, 'assets', 'sprites', 'hero');

  const frameW = 154;
  const frameH = 256;

  const grid = [
    ['walkForward_0.png', 'walkForward_1.png', 'walkForward_2.png', 'walkForward_3.png'],
    ['idle.png', 'punchLeft.png', 'idleBack.png', 'punchRight.png'],
    ['jumpCrouch.png', 'jumpUp.png', 'jumpAir.png', 'jumpLand.png'],
    ['walkBack_0.png', 'walkBack_1.png', 'walkBack_2.png', 'walkBack_3.png'],
  ];

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const name = grid[row][col];
      const left = col * frameW;
      const top = row * frameH;
      const outPath = path.join(outDir, name);
      await extractAndSave(src, left, top, frameW, frameH, outPath);
      console.log(`  saved ${name}  (x=${left}, y=${top}, ${frameW}x${frameH})`);
    }
  }
}

// ============================================================================
// 2. SOLDER (enemy) - 373x1024, auto-detect frames
// ============================================================================
async function cutSolder() {
  console.log('\n--- Cutting solder.png (enemy sprites) ---');
  const src = path.join(ROOT, 'solder.png');
  const outDir = path.join(ROOT, 'assets', 'sprites', 'enemy');
  const meta = await sharp(src).metadata();
  const imgW = meta.width;
  const imgH = meta.height;

  console.log(`  Source: ${imgW}x${imgH}`);

  // Precise coordinates verified by pixel analysis (text labels excluded)
  const animations = {
    walkRight: [
      { x: 3, y: 53, w: 65, h: 136 },
      { x: 71, y: 53, w: 49, h: 136 },
      { x: 129, y: 53, w: 54, h: 136 },
      { x: 185, y: 53, w: 63, h: 136 },
      { x: 253, y: 53, w: 47, h: 136 },
      { x: 306, y: 53, w: 63, h: 136 },
    ],
    deathLeft: [
      { x: 26, y: 227, w: 33, h: 134 },
      { x: 89, y: 227, w: 59, h: 134 },
      { x: 168, y: 227, w: 83, h: 134 },
      { x: 258, y: 227, w: 107, h: 134 },
      { x: 9, y: 380, w: 113, h: 90 },
      { x: 133, y: 380, w: 97, h: 90 },
      { x: 232, y: 380, w: 123, h: 90 },
    ],
    walkLeft: [
      { x: 4, y: 535, w: 62, h: 135 },
      { x: 78, y: 535, w: 45, h: 135 },
      { x: 125, y: 535, w: 59, h: 135 },
      { x: 190, y: 535, w: 58, h: 135 },
      { x: 251, y: 535, w: 51, h: 135 },
      { x: 308, y: 535, w: 62, h: 135 },
    ],
    deathRight: [
      { x: 4, y: 630, w: 92, h: 220 },
      { x: 96, y: 630, w: 92, h: 220 },
      { x: 189, y: 630, w: 91, h: 220 },
      { x: 280, y: 630, w: 90, h: 220 },
      { x: 11, y: 810, w: 84, h: 150 },
      { x: 122, y: 810, w: 130, h: 150 },
      { x: 305, y: 810, w: 47, h: 48 },
    ],
  };

  for (const [animName, frames] of Object.entries(animations)) {
    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      const fileName = `${animName}_${i}.png`;
      const outPath = path.join(outDir, fileName);
      await extractAndSave(src, f.x, f.y, f.w, f.h, outPath);
      console.log(`  saved ${fileName}  (x=${f.x}, y=${f.y}, ${f.w}x${f.h})`);
    }
  }
}

// ============================================================================
// 3. FONE (backgrounds) - 617x1024, split into 3 levels
// NO background removal — these are full background images
// ============================================================================
async function cutFone() {
  console.log('\n--- Cutting fone.png (backgrounds) ---');
  const src = path.join(ROOT, 'fone.png');
  const outDir = path.join(ROOT, 'assets', 'backgrounds');

  const levels = [
    { name: 'level1.png', y: 0,   h: 341 },
    { name: 'level2.png', y: 341, h: 342 },
    { name: 'level3.png', y: 683, h: 341 },
  ];

  for (const level of levels) {
    const outPath = path.join(outDir, level.name);
    // Backgrounds keep all pixels intact — no background removal
    await extractAndSave(src, 0, level.y, 617, level.h, outPath, true);
    console.log(`  saved ${level.name}  (y=${level.y}, h=${level.h})`);
  }
}

// ============================================================================
// Main
// ============================================================================
async function main() {
  console.log('=== Sprite Cutter ===\n');

  await cutAvatar();
  await cutSolder();
  await cutFone();

  console.log('\n=== Done! ===');
}

main().catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
