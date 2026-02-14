import { describe, it, expect } from '@jest/globals';
import { cn } from '@/lib/utils';

describe('utils', () => {
  describe('cn (classnames)', () => {
    it('should combine class names', () => {
      const result = cn('foo', 'bar');
      expect(result).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      const result = cn('foo', false && 'bar', 'baz');
      expect(result).toBe('foo baz');
    });

    it('should handle undefined', () => {
      const result = cn('foo', undefined, 'bar');
      expect(result).toBe('foo bar');
    });

    it('should handle null', () => {
      const result = cn('foo', null, 'bar');
      expect(result).toBe('foo bar');
    });

    it('should handle arrays', () => {
      const result = cn(['foo', 'bar'], 'baz');
      expect(result).toBe('foo bar baz');
    });

    it('should handle objects', () => {
      const result = cn('foo', { bar: true, baz: false });
      expect(result).toBe('foo bar');
    });

    it('should handle mixed inputs', () => {
      const result = cn('foo', ['bar', 'baz'], { qux: true }, false && 'quux');
      expect(result).toBe('foo bar baz qux');
    });
  });
});
