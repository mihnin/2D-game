import { EventBus } from '../../js/core/EventBus.js';

describe('EventBus', () => {
  let bus;

  beforeEach(() => {
    bus = new EventBus();
  });

  test('should call listener when event is emitted', () => {
    const cb = jest.fn();
    bus.on('test', cb);
    bus.emit('test', { value: 42 });
    expect(cb).toHaveBeenCalledWith({ value: 42 });
  });

  test('should support multiple listeners for same event', () => {
    const cb1 = jest.fn();
    const cb2 = jest.fn();
    bus.on('test', cb1);
    bus.on('test', cb2);
    bus.emit('test', 'data');
    expect(cb1).toHaveBeenCalledWith('data');
    expect(cb2).toHaveBeenCalledWith('data');
  });

  test('should remove listener with off()', () => {
    const cb = jest.fn();
    bus.on('test', cb);
    bus.off('test', cb);
    bus.emit('test');
    expect(cb).not.toHaveBeenCalled();
  });

  test('on() returns unsubscribe function', () => {
    const cb = jest.fn();
    const unsub = bus.on('test', cb);
    unsub();
    bus.emit('test');
    expect(cb).not.toHaveBeenCalled();
  });

  test('should not throw when emitting event with no listeners', () => {
    expect(() => bus.emit('nonexistent')).not.toThrow();
  });

  test('clear() removes all listeners', () => {
    const cb = jest.fn();
    bus.on('a', cb);
    bus.on('b', cb);
    bus.clear();
    bus.emit('a');
    bus.emit('b');
    expect(cb).not.toHaveBeenCalled();
  });

  test('off() does nothing for non-existent event', () => {
    expect(() => bus.off('nope', () => {})).not.toThrow();
  });
});
