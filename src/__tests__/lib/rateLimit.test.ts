import { describe, it, expect } from '@jest/globals';
import { checkRateLimit, resetRateLimit, getRateLimitInfo } from '@/lib/rateLimit';

describe('rateLimit', () => {
  beforeEach(() => {
    // Reset rate limit store before each test
    resetRateLimit('test-identifier');
  });

  describe('checkRateLimit', () => {
    it('should allow first request', () => {
      const result = checkRateLimit('test-user-1');
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(4);
    });

    it('should allow requests within limit', () => {
      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(checkRateLimit('test-user-2'));
      }
      expect(results[0].allowed).toBe(true);
      expect(results[4].allowed).toBe(true);
    });

    it('should block after exceeding limit', () => {
      // Make 5 requests (at limit)
      for (let i = 0; i < 5; i++) {
        checkRateLimit('test-user-3');
      }
      // 6th request should be blocked
      const result = checkRateLimit('test-user-3');
      expect(result.allowed).toBe(false);
      expect(result.remainingAttempts).toBe(0);
    });

    it('should track different users separately', () => {
      checkRateLimit('user-a');
      checkRateLimit('user-a');
      checkRateLimit('user-a');
      checkRateLimit('user-a');
      checkRateLimit('user-a');
      
      // user-a should be blocked
      const blockedResult = checkRateLimit('user-a');
      expect(blockedResult.allowed).toBe(false);
      
      // user-b should still be allowed
      const allowedResult = checkRateLimit('user-b');
      expect(allowedResult.allowed).toBe(true);
    });
  });

  describe('resetRateLimit', () => {
    it('should reset the rate limit for an identifier', () => {
      // Use up the limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit('test-reset-user');
      }
      
      // Should be blocked
      expect(checkRateLimit('test-reset-user').allowed).toBe(false);
      
      // Reset
      resetRateLimit('test-reset-user');
      
      // Should be allowed again
      expect(checkRateLimit('test-reset-user').allowed).toBe(true);
    });
  });

  describe('getRateLimitInfo', () => {
    it('should return null for unknown identifier', () => {
      const result = getRateLimitInfo('unknown-user');
      expect(result).toBeNull();
    });

    it('should return correct count for known identifier', () => {
      checkRateLimit('test-info-user');
      checkRateLimit('test-info-user');
      
      const result = getRateLimitInfo('test-info-user');
      expect(result).not.toBeNull();
      expect(result?.count).toBe(2);
      expect(result?.remainingAttempts).toBe(3);
    });
  });

  describe('custom config', () => {
    it('should respect custom maxAttempts', () => {
      const result = checkRateLimit('custom-user', { maxAttempts: 2 });
      expect(result.remainingAttempts).toBe(1);
      
      const result2 = checkRateLimit('custom-user', { maxAttempts: 2 });
      expect(result2.allowed).toBe(false);
    });
  });
});
