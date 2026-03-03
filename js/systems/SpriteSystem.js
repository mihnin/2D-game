// Handles drawing sprites from sprite sheets
export class SpriteSystem {
  constructor(assetLoader) {
    this.assets = assetLoader;
  }

  // Draw a frame from a uniform grid sprite sheet (hero)
  drawGridFrame(ctx, sheetKey, row, col, frameWidth, frameHeight, dx, dy, dw, dh) {
    const img = this.assets.get(sheetKey);
    if (!img) return;

    const sx = col * frameWidth;
    const sy = row * frameHeight;
    ctx.drawImage(img, sx, sy, frameWidth, frameHeight, dx, dy, dw || frameWidth, dh || frameHeight);
  }

  // Draw a frame from explicit coordinates (enemy)
  drawFrame(ctx, sheetKey, frame, dx, dy, dw, dh) {
    const img = this.assets.get(sheetKey);
    if (!img) return;

    ctx.drawImage(img, frame.x, frame.y, frame.w, frame.h, dx, dy, dw || frame.w, dh || frame.h);
  }

  // Draw a region of an image (for backgrounds)
  drawRegion(ctx, sheetKey, region, dx, dy, dw, dh) {
    const img = this.assets.get(sheetKey);
    if (!img) return;

    ctx.drawImage(img, region.x, region.y, region.w, region.h, dx, dy, dw || region.w, dh || region.h);
  }
}
