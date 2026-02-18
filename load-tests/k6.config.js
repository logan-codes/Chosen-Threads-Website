/**
 * Shared k6 configuration for Chosen Threads load tests.
 * Override BASE_URL via environment: k6 run -e BASE_URL=https://your-site.vercel.app ...
 */

import http from 'k6/http';

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// ── Reusable load-stage presets ────────────────────────────────────────────
export const STAGES = {
  smoke: [
    { duration: '30s', target: 1 },   // 1 VU for 30s — sanity check
  ],
  load: [
    { duration: '30s', target: 10 },  // ramp up
    { duration: '1m',  target: 10 },  // steady state
    { duration: '15s', target: 0 },   // ramp down
  ],
  stress: [
    { duration: '30s', target: 20 },
    { duration: '1m',  target: 50 },
    { duration: '30s', target: 100 },
    { duration: '1m',  target: 100 }, // peak
    { duration: '30s', target: 0 },
  ],
  spike: [
    { duration: '10s', target: 5 },
    { duration: '5s',  target: 150 }, // sudden spike
    { duration: '30s', target: 150 },
    { duration: '10s', target: 5 },
    { duration: '15s', target: 0 },
  ],
};

/**
 * Pick a stage profile from env, defaulting to "load".
 * Usage: k6 run -e PROFILE=stress ...
 */
export function getStages() {
  const profile = (__ENV.PROFILE || 'load').toLowerCase();
  return STAGES[profile] || STAGES.load;
}

// ── Default thresholds (override per-scenario as needed) ───────────────────
export const DEFAULT_THRESHOLDS = {
  http_req_duration: ['p(95)<500', 'p(99)<1500'],
  http_req_failed:   ['rate<0.01'],  // < 1 % errors
};

// ── Common headers ─────────────────────────────────────────────────────────
export const JSON_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

// ── Supabase config (these are public NEXT_PUBLIC_ values) ─────────────────
export const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://qsjjcobwvyexjdwvrcff.supabase.co';
export const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzampjb2J3dnlleGpkd3ZyY2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MTIyMjUsImV4cCI6MjA4NjQ4ODIyNX0.BMi7wyg95qAyt1-q_bBFUbGDfoHsrYe_TvngcXDgo1Q';

// ── Admin authentication helper ────────────────────────────────────────────
/**
 * Authenticate with Supabase REST API and return an access token.
 * Call this in setup() so the token is shared across all VUs.
 *
 * Requires env vars: ADMIN_EMAIL, ADMIN_PASSWORD
 * Returns: { token: string } or { token: null } if credentials missing/invalid
 */
export function loginAdmin() {
  const email = __ENV.ADMIN_EMAIL;
  const password = __ENV.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn('⚠ ADMIN_EMAIL / ADMIN_PASSWORD not set — admin tests will run unauthenticated');
    return { token: null };
  }

  const res = http.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    JSON.stringify({ email, password }),
    {
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
      },
    },
  );

  if (res.status === 200) {
    const body = JSON.parse(res.body);
    console.log(`✓ Admin login successful (${email})`);
    return { token: body.access_token };
  }

  console.error(`✗ Admin login failed (${res.status}): ${res.body}`);
  return { token: null };
}
