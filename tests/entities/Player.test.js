import { Player, PlayerState } from '../../js/entities/Player.js';

describe('Player', () => {
  let player;

  beforeEach(() => {
    player = new Player();
  });

  test('initializes with correct default state', () => {
    expect(player.hp).toBe(100);
    expect(player.state).toBe(PlayerState.IDLE);
    expect(player.isAlive()).toBe(true);
    expect(player.facingRight).toBe(true);
    expect(player.isOnGround).toBe(true);
  });

  test('moves right on input', () => {
    const input = {
      isRight: () => true,
      isLeft: () => false,
      isPunch: () => false,
      isJump: () => false,
    };
    player.handleInput(input);
    expect(player.velocityX).toBeGreaterThan(0);
    expect(player.state).toBe(PlayerState.WALKING);
    expect(player.facingRight).toBe(true);
  });

  test('moves left on input', () => {
    const input = {
      isRight: () => false,
      isLeft: () => true,
      isPunch: () => false,
      isJump: () => false,
    };
    player.handleInput(input);
    expect(player.velocityX).toBeLessThan(0);
    expect(player.facingRight).toBe(false);
  });

  test('stops when no movement input', () => {
    const moveInput = {
      isRight: () => true,
      isLeft: () => false,
      isPunch: () => false,
      isJump: () => false,
    };
    player.handleInput(moveInput);
    expect(player.state).toBe(PlayerState.WALKING);

    const idleInput = {
      isRight: () => false,
      isLeft: () => false,
      isPunch: () => false,
      isJump: () => false,
    };
    player.handleInput(idleInput);
    expect(player.velocityX).toBe(0);
    expect(player.state).toBe(PlayerState.IDLE);
  });

  test('starts punch on punch input', () => {
    const input = {
      isRight: () => false,
      isLeft: () => false,
      isPunch: () => true,
      isJump: () => false,
    };
    player.handleInput(input);
    expect(player.state).toBe(PlayerState.PUNCHING);
    expect(player.attackBox).not.toBeNull();
  });

  test('punch creates attack box in front of player', () => {
    const input = {
      isRight: () => false,
      isLeft: () => false,
      isPunch: () => true,
      isJump: () => false,
    };
    player.facingRight = true;
    player.handleInput(input);
    expect(player.attackBox.x).toBeGreaterThanOrEqual(player.x + player.width);
  });

  test('starts jump on jump input', () => {
    const input = {
      isRight: () => false,
      isLeft: () => false,
      isPunch: () => false,
      isJump: () => true,
    };
    player.handleInput(input);
    expect(player.state).toBe(PlayerState.JUMPING);
    expect(player.velocityY).toBeLessThan(0);
    expect(player.isOnGround).toBe(false);
  });

  test('takes damage and enters hurt state', () => {
    player.takeDamage(10);
    expect(player.hp).toBe(90);
    expect(player.state).toBe(PlayerState.HURT);
    expect(player.invulnerable).toBe(true);
  });

  test('does not take damage while invulnerable', () => {
    player.takeDamage(10);
    expect(player.hp).toBe(90);
    player.takeDamage(10); // Should be ignored
    expect(player.hp).toBe(90);
  });

  test('dies when hp reaches 0', () => {
    player.invulnerable = false;
    player.takeDamage(100);
    expect(player.hp).toBe(0);
    expect(player.isAlive()).toBe(false);
    expect(player.state).toBe(PlayerState.DEAD);
  });

  test('ignores input when dead', () => {
    player.invulnerable = false;
    player.takeDamage(100);
    const input = {
      isRight: () => true,
      isLeft: () => false,
      isPunch: () => false,
      isJump: () => false,
    };
    player.handleInput(input);
    expect(player.velocityX).toBe(0);
  });

  test('punch ends after duration', () => {
    const input = {
      isRight: () => false,
      isLeft: () => false,
      isPunch: () => true,
      isJump: () => false,
    };
    player.handleInput(input);
    expect(player.state).toBe(PlayerState.PUNCHING);

    // Simulate time passing beyond punch duration
    player.update(0.5); // 500ms > PUNCH_DURATION (300ms)
    expect(player.state).toBe(PlayerState.IDLE);
    expect(player.attackBox).toBeNull();
  });

  test('reset restores initial state', () => {
    player.takeDamage(50);
    player.x = 500;
    player.reset();
    expect(player.hp).toBe(100);
    expect(player.state).toBe(PlayerState.IDLE);
    expect(player.alive).toBe(true);
  });

  test('lands after jump and returns to idle', () => {
    player.startJump();
    expect(player.state).toBe(PlayerState.JUMPING);
    expect(player.isOnGround).toBe(false);

    // Simulate fall back to ground
    player.onLand();
    expect(player.isOnGround).toBe(true);
    expect(player.state).toBe(PlayerState.IDLE);
  });
});
