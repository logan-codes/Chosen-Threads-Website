const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX_ATTEMPTS = 5;

export interface RateLimitConfig {
  windowMs?: number;
  maxAttempts?: number;
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = {}
): { allowed: boolean; remainingAttempts: number; resetTime: number } {
  const windowMs = config.windowMs ?? DEFAULT_WINDOW_MS;
  const maxAttempts = config.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;

  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    const resetTime = now + windowMs;
    rateLimitStore.set(identifier, { count: 1, resetTime });
    return { allowed: true, remainingAttempts: maxAttempts - 1, resetTime };
  }

  const newCount = record.count + 1;
  
  if (newCount > maxAttempts) {
    return { 
      allowed: false, 
      remainingAttempts: 0, 
      resetTime: record.resetTime 
    };
  }

  record.count = newCount;
  rateLimitStore.set(identifier, record);

  return { 
    allowed: true, 
    remainingAttempts: maxAttempts - newCount, 
    resetTime: record.resetTime 
  };
}

export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

export function getRateLimitInfo(
  identifier: string
): { count: number; remainingAttempts: number; resetTime: number } | null {
  const record = rateLimitStore.get(identifier);
  if (!record) return null;
  
  const maxAttempts = DEFAULT_MAX_ATTEMPTS;
  return {
    count: record.count,
    remainingAttempts: Math.max(0, maxAttempts - record.count),
    resetTime: record.resetTime
  };
}
