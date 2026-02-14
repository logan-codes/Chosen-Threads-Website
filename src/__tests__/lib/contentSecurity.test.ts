import { describe, it, expect } from '@jest/globals';
import { SecureCSS, SecureHTML } from '@/lib/contentSecurity';

describe('contentSecurity', () => {
  describe('SecureCSS.sanitizeCSSValue', () => {
    it('should remove javascript:', () => {
      const result = SecureCSS.sanitizeCSSValue('javascript:alert(1)');
      expect(result).not.toContain('javascript');
    });

    it('should remove expression()', () => {
      const result = SecureCSS.sanitizeCSSValue('expression(alert(1))');
      expect(result).not.toContain('expression');
    });

    it('should remove @import', () => {
      const result = SecureCSS.sanitizeCSSValue('@import url(evil.css)');
      expect(result).not.toContain('@import');
    });

    it('should remove script tags', () => {
      const result = SecureCSS.sanitizeCSSValue('<script>alert(1)</script>');
      expect(result).not.toContain('<script');
    });

    it('should handle non-string input', () => {
      const result = SecureCSS.sanitizeCSSValue(null as any);
      expect(result).toBe('');
    });

    it('should limit length to 1000 characters', () => {
      const longValue = 'a'.repeat(2000);
      const result = SecureCSS.sanitizeCSSValue(longValue);
      expect(result.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('SecureCSS.isValidCSSProperty', () => {
    it('should return true for safe properties', () => {
      expect(SecureCSS.isValidCSSProperty('color')).toBe(true);
      expect(SecureCSS.isValidCSSProperty('font-size')).toBe(true);
      expect(SecureCSS.isValidCSSProperty('background-color')).toBe(true);
    });

    it('should return false for dangerous properties', () => {
      expect(SecureCSS.isValidCSSProperty('behavior')).toBe(false);
      expect(SecureCSS.isValidCSSProperty('-moz-binding')).toBe(false);
    });
  });

  describe('SecureHTML.escapeHtml', () => {
    it('should escape HTML entities', () => {
      const result = SecureHTML.escapeHtml('<script>');
      expect(result).toBe('&lt;script&gt;');
    });

    it('should escape quotes', () => {
      const result = SecureHTML.escapeHtml('"test"');
      expect(result).toContain('&quot;');
    });
  });

  describe('SecureHTML.sanitizeAttributeValue', () => {
    it('should remove javascript: protocol', () => {
      const result = SecureHTML.sanitizeAttributeValue('javascript:alert(1)');
      expect(result).not.toContain('javascript');
    });

    it('should remove event handlers', () => {
      const result = SecureHTML.sanitizeAttributeValue('onclick=alert(1)');
      expect(result).not.toContain('onclick');
    });
  });
});
