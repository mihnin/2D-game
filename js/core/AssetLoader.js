export class AssetLoader {
  constructor() {
    this.images = new Map();
    this.loaded = 0;
    this.total = 0;
  }

  loadImage(key, src) {
    this.total++;
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.images.set(key, img);
        this.loaded++;
        resolve(img);
      };
      img.onerror = () => reject(new Error(`Failed to load: ${src}`));
      img.src = src;
    });
  }

  async loadAll(manifest) {
    const promises = Object.entries(manifest).map(([key, src]) =>
      this.loadImage(key, src)
    );
    await Promise.all(promises);
    return this.images;
  }

  // Remove background using flood fill from image edges + fringe cleanup.
  // Preserves white/light areas INSIDE sprites (like t-shirts)
  // while removing white and checkerboard backgrounds connected to edges.
  removeBackground(key) {
    const img = this.images.get(key);
    if (!img) return;

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const w = canvas.width;
    const h = canvas.height;
    const totalPixels = w * h;

    // Is this pixel background-like? (white, light gray, checkerboard, near-white)
    function isBgLike(pos) {
      const idx = pos * 4;
      if (data[idx + 3] < 10) return true; // already transparent
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max - min;
      // Neutral color (low saturation) AND bright — catches white AND gray checkerboard
      return saturation < 30 && min > 155;
    }

    // --- Pass 1: Flood fill from edges ---
    const removed = new Uint8Array(totalPixels); // track which pixels we removed
    const visited = new Uint8Array(totalPixels);
    const stack = [];

    // Seed from all edge pixels
    for (let x = 0; x < w; x++) {
      stack.push(x);
      stack.push((h - 1) * w + x);
    }
    for (let y = 1; y < h - 1; y++) {
      stack.push(y * w);
      stack.push(y * w + w - 1);
    }

    while (stack.length > 0) {
      const pos = stack.pop();
      if (pos < 0 || pos >= totalPixels || visited[pos]) continue;
      if (!isBgLike(pos)) continue;

      visited[pos] = 1;
      removed[pos] = 1;
      data[pos * 4 + 3] = 0; // Make transparent

      const x = pos % w;
      const y = (pos - x) / w;

      if (x > 0) stack.push(pos - 1);
      if (x < w - 1) stack.push(pos + 1);
      if (y > 0) stack.push(pos - w);
      if (y < h - 1) stack.push(pos + w);
    }

    // --- Pass 2: Fringe cleanup ---
    // Pixels adjacent to removed background that are semi-bright get their alpha reduced.
    // This removes the white halo/fringe from anti-aliased edges.
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const pos = y * w + x;
        if (removed[pos]) continue; // already removed
        const idx = pos * 4;
        if (data[idx + 3] < 10) continue; // already transparent

        // Check if this pixel borders a removed pixel
        let bordersRemoved = false;
        if (x > 0 && removed[pos - 1]) bordersRemoved = true;
        else if (x < w - 1 && removed[pos + 1]) bordersRemoved = true;
        else if (y > 0 && removed[pos - w]) bordersRemoved = true;
        else if (y < h - 1 && removed[pos + w]) bordersRemoved = true;

        if (!bordersRemoved) continue;

        const r = data[idx], g = data[idx + 1], b = data[idx + 2];
        const brightness = (r + g + b) / 3;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max - min;

        // If this fringe pixel is very bright and neutral — it's anti-aliasing against white bg
        if (saturation < 40 && brightness > 200) {
          // Fade alpha based on how close to white
          const fade = Math.max(0, (brightness - 200) / 55); // 0 at 200, 1 at 255
          data[idx + 3] = Math.round(data[idx + 3] * (1 - fade));
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    this.images.set(key, canvas);
  }

  get(key) {
    return this.images.get(key);
  }

  getProgress() {
    return this.total === 0 ? 1 : this.loaded / this.total;
  }
}
