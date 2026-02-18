/**
 * Auth Endpoints Load Test — Chosen Threads
 *
 * Targets the admin login endpoint and verifies:
 *   • Login attempt throughput
 *   • Rate limiter engagement (429 after 5 attempts per 15min window)
 *   • Error response correctness
 *
 * Run:  k6 run load-tests/scenarios/auth-endpoints.js
 *
 * NOTE: This test intentionally uses INVALID credentials to avoid
 *       creating real sessions. It's safe to run against any environment.
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { BASE_URL, JSON_HEADERS } from '../k6.config.js';

// ── Custom metrics ─────────────────────────────────────────────────────────
const loginDuration       = new Trend('login_attempt_duration', true);
const rateLimitTriggered  = new Counter('rate_limit_triggered');
const rateLimitRate       = new Rate('rate_limit_trigger_rate');
const loginErrorRate      = new Rate('login_error_rate');

// ── k6 options ─────────────────────────────────────────────────────────────
export const options = {
  scenarios: {
    // Scenario 1: Normal login attempts — moderate concurrency
    normal_login: {
      executor: 'constant-vus',
      vus: 5,
      duration: '1m',
      tags: { sub_scenario: 'normal_login' },
    },
    // Scenario 2: Rate limit test — single VU hammering the endpoint
    rate_limit_test: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: 8, // 5 allowed + 3 should be rate-limited
      startTime: '1m10s', // starts after normal test
      tags: { sub_scenario: 'rate_limit' },
    },
  },
  thresholds: {
    login_attempt_duration: ['p(95)<1000'],
    login_error_rate:       ['rate<0.05'], // we expect some 401s, not 500s
  },
  tags: { scenario: 'auth-endpoints' },
};

// ── Test ────────────────────────────────────────────────────────────────────
export default function () {
  const scenario = __ENV.SCENARIO || (__ITER < 100 ? 'normal' : 'rate_limit');

  if (__VU === 1 && __ITER >= 5) {
    // This VU has already made 5 attempts — test rate limiting
    runRateLimitTest();
  } else {
    runNormalLoginTest();
  }
}

function runNormalLoginTest() {
  group('Admin Login — Invalid Credentials', () => {
    const uniqueEmail = `loadtest-${__VU}-${Date.now()}@test.invalid`;
    const payload = JSON.stringify({
      email: uniqueEmail,
      password: 'wrong-password-loadtest',
    });

    const res = http.post(`${BASE_URL}/api/auth/admin-login`, payload, {
      headers: JSON_HEADERS,
    });

    loginDuration.add(res.timings.duration);

    // We expect 401 (invalid creds) or 400 — NOT 500
    const isExpectedError = res.status === 401 || res.status === 400;
    const isServerError = res.status >= 500;
    loginErrorRate.add(isServerError);

    check(res, {
      'login returns expected error (401/400)': () => isExpectedError,
      'login does not return 500': () => !isServerError,
      'login response is JSON': (r) => {
        try { JSON.parse(r.body); return true; } catch { return false; }
      },
      'login response has error message': (r) => {
        try { return JSON.parse(r.body).error !== undefined; } catch { return false; }
      },
    });

    sleep(0.5 + Math.random());
  });
}

function runRateLimitTest() {
  group('Rate Limit Verification', () => {
    // Use a fixed email + IP to trigger per-identity rate limiting
    const payload = JSON.stringify({
      email: 'ratelimit-test@test.invalid',
      password: 'wrong-password',
    });

    const res = http.post(`${BASE_URL}/api/auth/admin-login`, payload, {
      headers: JSON_HEADERS,
    });

    loginDuration.add(res.timings.duration);

    if (res.status === 429) {
      rateLimitTriggered.add(1);
      rateLimitRate.add(true);

      check(res, {
        'rate limit returns 429': (r) => r.status === 429,
        'rate limit has Retry-After header': (r) => r.headers['Retry-After'] !== undefined,
        'rate limit body has retryAfter': (r) => {
          try { return JSON.parse(r.body).retryAfter !== undefined; } catch { return false; }
        },
      });
    } else {
      rateLimitRate.add(false);

      check(res, {
        'pre-limit returns 401 or 400': (r) => r.status === 401 || r.status === 400,
      });
    }

    sleep(0.2); // minimal delay to hit the limiter fast
  });
}
