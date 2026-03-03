export class SceneManager {
  constructor() {
    this.scenes = new Map();
    this.currentScene = null;
    this.currentSceneName = null;
  }

  add(name, scene) {
    this.scenes.set(name, scene);
  }

  switch(name, data) {
    if (this.currentScene && this.currentScene.exit) {
      this.currentScene.exit();
    }
    this.currentScene = this.scenes.get(name);
    this.currentSceneName = name;
    if (this.currentScene && this.currentScene.enter) {
      this.currentScene.enter(data);
    }
  }

  update(dt) {
    if (this.currentScene && this.currentScene.update) {
      this.currentScene.update(dt);
    }
  }

  render(ctx) {
    if (this.currentScene && this.currentScene.render) {
      this.currentScene.render(ctx);
    }
  }

  getCurrentName() {
    return this.currentSceneName;
  }
}
