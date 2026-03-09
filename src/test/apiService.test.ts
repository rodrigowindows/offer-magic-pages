import { describe, it, expect } from 'vitest';
import { createFormData } from '@/services/api';

describe('createFormData', () => {
  it('creates FormData with string values', () => {
    const fd = createFormData({ name: 'John', email: 'john@test.com' });
    expect(fd.get('name')).toBe('John');
    expect(fd.get('email')).toBe('john@test.com');
  });

  it('converts numbers to strings', () => {
    const fd = createFormData({ count: 42 });
    expect(fd.get('count')).toBe('42');
  });

  it('skips null and undefined values', () => {
    const fd = createFormData({ a: 'hello', b: null, c: undefined });
    expect(fd.get('a')).toBe('hello');
    expect(fd.get('b')).toBeNull();
    expect(fd.get('c')).toBeNull();
  });

  it('converts boolean to string', () => {
    const fd = createFormData({ active: true });
    expect(fd.get('active')).toBe('true');
  });
});
