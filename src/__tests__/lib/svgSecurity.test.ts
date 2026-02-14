import { describe, it, expect } from '@jest/globals';
import { SecureSVGRenderer } from '@/lib/svgSecurity';

describe('svgSecurity', () => {
  describe('SecureSVGRenderer.sanitizeSVG', () => {
    it('should return empty string for null input', () => {
      const result = SecureSVGRenderer.sanitizeSVG(null as any);
      expect(result).toBe('');
    });

    it('should return empty string for undefined input', () => {
      const result = SecureSVGRenderer.sanitizeSVG(undefined as any);
      expect(result).toBe('');
    });

    it('should return empty string for non-string input', () => {
      const result = SecureSVGRenderer.sanitizeSVG(123 as any);
      expect(result).toBe('');
    });

    it('should remove script tags', () => {
      const svg = '<svg><script>alert("xss")</script><rect/></svg>';
      const result = SecureSVGRenderer.sanitizeSVG(svg);
      expect(result).not.toContain('<script>');
    });

    it('should remove javascript: protocol', () => {
      const svg = '<svg><a href="javascript:alert(1)">click</a></svg>';
      const result = SecureSVGRenderer.sanitizeSVG(svg);
      expect(result).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      const svg = '<svg><rect onclick="alert(1)"/></svg>';
      const result = SecureSVGRenderer.sanitizeSVG(svg);
      expect(result).not.toContain('onclick');
    });

    it('should allow safe SVG content', () => {
      const svg = '<svg viewBox="0 0 100 100"><rect width="50" height="50" fill="red"/></svg>';
      const result = SecureSVGRenderer.sanitizeSVG(svg);
      expect(result).toContain('<rect');
    });
  });

  describe('SecureSVGRenderer.sanitizeColor', () => {
    it('should accept valid hex colors', () => {
      expect(SecureSVGRenderer.sanitizeColor('#FF0000')).toBe('#FF0000');
      expect(SecureSVGRenderer.sanitizeColor('#fff')).toBe('#fff');
    });

    it('should accept valid color names', () => {
      expect(SecureSVGRenderer.sanitizeColor('red')).toBe('red');
      expect(SecureSVGRenderer.sanitizeColor('blue')).toBe('blue');
    });

    it('should remove angle brackets', () => {
      expect(SecureSVGRenderer.sanitizeColor('<script>')).toBe('script');
    });

    it('should remove javascript: protocol', () => {
      const result = SecureSVGRenderer.sanitizeColor('javascript:alert(1)');
      expect(result).not.toContain('javascript');
    });

    it('should remove event handlers', () => {
      const result = SecureSVGRenderer.sanitizeColor('onclick=alert(1)');
      expect(result).not.toContain('onclick');
    });

    it('should limit length to 50 characters', () => {
      const longColor = 'a'.repeat(100);
      const result = SecureSVGRenderer.sanitizeColor(longColor);
      expect(result.length).toBeLessThanOrEqual(50);
    });
  });

  describe('SecureSVGRenderer.createSecurePath', () => {
    it('should create valid SVG path', () => {
      const result = SecureSVGRenderer.createSecurePath('M 0 0 L 10 10', 'red', 'none', '0');
      expect(result).toContain('path');
      expect(result).toContain('d="M 0 0 L 10 10"');
      expect(result).toContain('fill="red"');
    });
  });

  describe('SecureSVGRenderer.createSecureSVG', () => {
    it('should create valid SVG wrapper', () => {
      const result = SecureSVGRenderer.createSecureSVG('0 0 100 100', '<rect/>', { style: 'width:100px' });
      expect(result).toContain('<svg');
      expect(result).toContain('viewBox="0 0 100 100"');
      expect(result).toContain('<rect/>');
    });
  });
});
