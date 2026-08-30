import isEqual from '../isEqual';

describe('isEqual', () => {
  it('is true for two objects with identical key/value pairs', () => {
    expect(isEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
  });
  it('is false when any value differs', () => {
    expect(isEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
  });
  it('is false when key counts differ', () => {
    expect(isEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });
});
