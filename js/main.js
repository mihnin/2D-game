import { GameLoop } from './core/GameLoop.js';
import { InputManager } from './core/InputManager.js';
import { AssetLoader } from './core/AssetLoader.js';
import { SceneManager } from './core/SceneManager.js';
import { AudioManager } from './core/AudioManager.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { PauseScene } from './scenes/PauseScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { VictoryScene } from './scenes/VictoryScene.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './config/constants.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;

    this.assets = new AssetLoader();
    this.input = new InputManager();
    this.audio = new AudioManager();
    this.sceneManager = new SceneManager();
    this.gameLoop = new GameLoop(
      (dt) => this.update(dt),
      () => this.render()
    );
  }

  async init() {
    const loadingBar = document.querySelector('.loading-bar');
    const loadingText = document.querySelector('.loading-text');

    // Load all assets
    const manifest = {
      hero: 'avatar.png',
      enemy2: 'solde2.png',
      enemy3: '3.png',
      backgrounds: 'fone.png',
      backgrounds2: 'fone2.png',
    };

    try {
      if (loadingText) loadingText.textContent = 'Loading sprites...';

      await this.assets.loadAll(manifest);

      // Remove white/checkerboard backgrounds from sprite sheets
      // Uses flood fill from edges — safe for all sprites
      if (loadingText) loadingText.textContent = 'Processing sprites...';
      this.assets.removeBackground('hero');
      this.assets.removeBackground('enemy2');
      this.assets.removeBackground('enemy3');

      if (loadingBar) loadingBar.style.width = '100%';
      if (loadingText) loadingText.textContent = 'Ready!';
    } catch (err) {
      console.error('Failed to load assets:', err);
      if (loadingText) loadingText.textContent = 'Error loading assets!';
      return;
    }

    // Init input
    this.input.init();

    // Unlock AudioContext on first user interaction (autoplay policy)
    const unlockAudio = () => {
      this.audio._ensureContext();
      this.audio.resume();
      document.removeEventListener('keydown', unlockAudio);
      document.removeEventListener('mousedown', unlockAudio);
    };
    document.addEventListener('keydown', unlockAudio);
    document.addEventListener('mousedown', unlockAudio);

    // Register scenes
    this.sceneManager.add('menu', new MenuScene(this.sceneManager, this.input, this.assets));
    this.sceneManager.add('game', new GameScene(this.sceneManager, this.input, this.assets, this.audio));
    this.sceneManager.add('pause', new PauseScene(this.sceneManager, this.input));
    this.sceneManager.add('gameover', new GameOverScene(this.sceneManager, this.input));
    this.sceneManager.add('victory', new VictoryScene(this.sceneManager, this.input));

    // Start at menu
    this.sceneManager.switch('menu');

    // Hide loading screen
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
      setTimeout(() => loadingScreen.remove(), 500);
    }

    // Start game loop
    this.gameLoop.start();
  }

  update(dt) {
    this.sceneManager.update(dt);
    this.input.update(); // Clear justPressed at end of frame
  }

  render() {
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.sceneManager.render(this.ctx);
  }
}

// Start game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.init();
});
