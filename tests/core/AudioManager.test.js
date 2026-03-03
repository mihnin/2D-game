import { AudioManager } from '../../js/core/AudioManager.js';

describe('AudioManager', () => {
  let audio;

  beforeEach(() => {
    audio = new AudioManager();
  });

  afterEach(() => {
    audio.destroy();
  });

  test('starts with no context', () => {
    expect(audio.ctx).toBeNull();
    expect(audio.muted).toBe(false);
    expect(audio.musicPlaying).toBe(false);
  });

  test('_ensureContext creates AudioContext', () => {
    audio._ensureContext();
    expect(audio.ctx).not.toBeNull();
    expect(audio.masterGain).not.toBeNull();
  });

  test('startMusic creates context and starts playing', () => {
    audio.startMusic();
    expect(audio.ctx).not.toBeNull();
    expect(audio.musicPlaying).toBe(true);
  });

  test('stopMusic clears state', () => {
    audio._ensureContext();
    audio.startMusic();
    audio.stopMusic();
    expect(audio.musicPlaying).toBe(false);
    expect(audio.musicNodes).toEqual([]);
  });

  test('toggleMute switches muted state', () => {
    audio._ensureContext();
    expect(audio.muted).toBe(false);
    audio.toggleMute();
    expect(audio.muted).toBe(true);
    audio.toggleMute();
    expect(audio.muted).toBe(false);
  });

  test('toggleMute does nothing without context', () => {
    audio.toggleMute();
    expect(audio.muted).toBe(false);
  });

  test('playHitSound does nothing without context', () => {
    expect(() => audio.playHitSound()).not.toThrow();
  });

  test('playPlayerHurtSound does nothing without context', () => {
    expect(() => audio.playPlayerHurtSound()).not.toThrow();
  });

  test('playHitSound works with context', () => {
    audio._ensureContext();
    expect(() => audio.playHitSound()).not.toThrow();
  });

  test('playPlayerHurtSound works with context', () => {
    audio._ensureContext();
    expect(() => audio.playPlayerHurtSound()).not.toThrow();
  });

  test('destroy cleans up', () => {
    audio._ensureContext();
    audio.startMusic();
    audio.destroy();
    expect(audio.ctx).toBeNull();
    expect(audio.musicPlaying).toBe(false);
  });

  test('resume does not throw without context', () => {
    expect(() => audio.resume()).not.toThrow();
  });
});
