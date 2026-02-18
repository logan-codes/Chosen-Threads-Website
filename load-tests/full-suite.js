/**
 * Full Load Test Suite — Chosen Threads
 *
 * Orchestrates all scenarios concurrently with weighted VU distribution:
 *   • 50% public browsing
 *   • 20% user journeys
 *   • 20% admin operations
 *   • 10% auth attempts
 *
 * Generates an HTML summary report in load-tests/results/.
 *
 * Run:  k6 run load-tests/full-suite.js
 *       k6 run -e BASE_URL=https://chosen-threads.vercel.app load-tests/full-suite.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.1.0/index.js';
import { BASE_URL, JSON_HEADERS, DEFAULT_THRESHOLDS, loginAdmin } from './k6.config.js';

// ── Custom metrics ─────────────────────────────────────────────────────────
// Public
const homepageDuration   = new Trend('homepage_duration', true);
const shopDuration       = new Trend('shop_page_duration', true);
const productAPIDuration = new Trend('product_api_duration', true);
const catalogAPIDuration = new Trend('catalog_api_duration', true);
const publicErrorRate    = new Rate('public_error_rate');

// Journey
const journeyDuration    = new Trend('full_journey_duration', true);
const journeyCompletion  = new Rate('journey_completion_rate');

// Admin
const adminProductsDuration = new Trend('admin_products_duration', true);
const adminCustomersDuration = new Trend('admin_customers_duration', true);
const adminReviewsDuration  = new Trend('admin_reviews_duration', true);
const adminNotifDuration    = new Trend('admin_notifications_duration', true);
const adminErrorRate        = new Rate('admin_error_rate');

// Auth
const loginDuration      = new Trend('login_attempt_duration', true);
const rateLimitTriggered = new Counter('rate_limit_triggered');

// ── k6 options ─────────────────────────────────────────────────────────────
export const options = {
  scenarios: {
    public_browsing: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 15 },
        { duration: '1m',  target: 15 },
        { duration: '15s', target: 0 },
      ],
      exec: 'publicBrowsing',
      tags: { scenario: 'public' },
    },
    user_journeys: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 6 },
        { duration: '1m',  target: 6 },
        { duration: '15s', target: 0 },
      ],
      exec: 'userJourney',
      tags: { scenario: 'journey' },
    },
    admin_operations: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 6 },
        { duration: '1m',  target: 6 },
        { duration: '15s', target: 0 },
      ],
      exec: 'adminOperations',
      tags: { scenario: 'admin' },
    },
    auth_attempts: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 3 },
        { duration: '1m',  target: 3 },
        { duration: '15s', target: 0 },
      ],
      exec: 'authAttempts',
      tags: { scenario: 'auth' },
    },
  },
  thresholds: {
    ...DEFAULT_THRESHOLDS,
    homepage_duration:       ['p(95)<800'],
    shop_page_duration:      ['p(95)<800'],
    product_api_duration:    ['p(95)<400'],
    catalog_api_duration:    ['p(95)<400'],
    full_journey_duration:   ['p(95)<10000'],
    journey_completion_rate: ['rate>0.90'],
    admin_products_duration: ['p(95)<600'],
    admin_customers_duration:['p(95)<800'],
    admin_reviews_duration:  ['p(95)<600'],
    login_attempt_duration:  ['p(95)<1000'],
    public_error_rate:       ['rate<0.02'],
    admin_error_rate:        ['rate<0.05'],
  },
};

// ══════════════════════════════════════════════════════════════════════════
// LIFECYCLE
// ══════════════════════════════════════════════════════════════════════════

export function setup() {
  return loginAdmin(); // returns { token: string | null }
}

// ══════════════════════════════════════════════════════════════════════════
// SCENARIO FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════

export function publicBrowsing() {
  const productId = __ENV.PRODUCT_ID || '1';

  group('Public — Homepage', () => {
    const res = http.get(`${BASE_URL}/`);
    homepageDuration.add(res.timings.duration);
    publicErrorRate.add(res.status !== 200);
    check(res, { 'homepage 200': (r) => r.status === 200 });
  });

  sleep(rnd(1, 3));

  group('Public — Shop', () => {
    const res = http.get(`${BASE_URL}/shop`);
    shopDuration.add(res.timings.duration);
    publicErrorRate.add(res.status !== 200);
    check(res, { 'shop 200': (r) => r.status === 200 });
  });

  sleep(rnd(1, 3));

  group('Public — Product API', () => {
    const res = http.get(`${BASE_URL}/api/products/${productId}`, { headers: JSON_HEADERS });
    productAPIDuration.add(res.timings.duration);
    publicErrorRate.add(res.status !== 200);
    check(res, { 'product API 200': (r) => r.status === 200 });
  });

  sleep(rnd(1, 2));

  group('Public — Catalog API', () => {
    const res = http.get(`${BASE_URL}/api/admin/products`, { headers: JSON_HEADERS });
    catalogAPIDuration.add(res.timings.duration);
    publicErrorRate.add(res.status !== 200);
    check(res, { 'catalog API 200': (r) => r.status === 200 });
  });

  sleep(rnd(1, 3));
}

export function userJourney() {
  const productId = __ENV.PRODUCT_ID || '1';
  const start = Date.now();
  let failed = false;

  group('Journey — Homepage', () => {
    const res = http.get(`${BASE_URL}/`);
    if (res.status !== 200) failed = true;
    check(res, { 'journey homepage': (r) => r.status === 200 });
  });

  sleep(rnd(1, 2));

  group('Journey — Shop', () => {
    const res = http.get(`${BASE_URL}/shop`);
    if (res.status !== 200) failed = true;
    check(res, { 'journey shop': (r) => r.status === 200 });
  });

  sleep(rnd(1, 3));

  group('Journey — Product API', () => {
    const res = http.get(`${BASE_URL}/api/products/${productId}`, { headers: JSON_HEADERS });
    if (res.status !== 200) failed = true;
    check(res, { 'journey product': (r) => r.status === 200 });
  });

  sleep(rnd(1, 2));

  group('Journey — Design Areas', () => {
    const res = http.get(`${BASE_URL}/api/admin/products/${productId}/design-areas`, { headers: JSON_HEADERS });
    if (res.status !== 200) failed = true;
    check(res, { 'journey design areas': (r) => r.status === 200 });
  });

  sleep(rnd(1, 2));

  group('Journey — Customize Page', () => {
    const res = http.get(`${BASE_URL}/customize`);
    if (res.status !== 200) failed = true;
    check(res, { 'journey customize': (r) => r.status === 200 });
  });

  journeyDuration.add(Date.now() - start);
  journeyCompletion.add(!failed);

  sleep(rnd(2, 4));
}

export function adminOperations(data) {
  const productId = __ENV.PRODUCT_ID || '1';
  const headers = { ...JSON_HEADERS };
  
  if (data && data.token) {
    headers['Authorization'] = `Bearer ${data.token}`;
  } else if (__ENV.ADMIN_TOKEN) {
    headers['Authorization'] = `Bearer ${__ENV.ADMIN_TOKEN}`;
  }

  group('Admin — Products', () => {
    const res = http.get(`${BASE_URL}/api/admin/products`, { headers });
    adminProductsDuration.add(res.timings.duration);
    adminErrorRate.add(res.status !== 200);
    check(res, { 'admin products OK': (r) => r.status === 200 });
  });

  sleep(0.5);

  group('Admin — Customers', () => {
    const res = http.get(`${BASE_URL}/api/admin/customers?limit=20`, { headers });
    adminCustomersDuration.add(res.timings.duration);
    adminErrorRate.add(res.status !== 200);
    check(res, { 'admin customers OK': (r) => r.status === 200 });
  });

  sleep(0.5);

  group('Admin — Reviews', () => {
    const res = http.get(`${BASE_URL}/api/admin/reviews?status=all&limit=20`, { headers });
    adminReviewsDuration.add(res.timings.duration);
    adminErrorRate.add(res.status !== 200);
    check(res, { 'admin reviews OK': (r) => r.status === 200 });
  });

  sleep(0.5);

  group('Admin — Notifications', () => {
    const res = http.get(`${BASE_URL}/api/admin/notifications?limit=20`, { headers });
    adminNotifDuration.add(res.timings.duration);
    adminErrorRate.add(res.status !== 200);
    check(res, { 'admin notifications OK': (r) => r.status === 200 });
  });

  sleep(rnd(1, 2));
}

export function authAttempts() {
  const uniqueEmail = `loadtest-${__VU}-${Date.now()}@test.invalid`;
  const payload = JSON.stringify({
    email: uniqueEmail,
    password: 'wrong-password-loadtest',
  });

  group('Auth — Login Attempt', () => {
    const res = http.post(`${BASE_URL}/api/auth/admin-login`, payload, {
      headers: JSON_HEADERS,
      responseCallback: http.expectedStatuses(400, 401, 429),
    });
    loginDuration.add(res.timings.duration);

    if (res.status === 429) {
      rateLimitTriggered.add(1);
    }

    check(res, {
      'auth not 500': (r) => r.status < 500,
      'auth returns JSON': (r) => {
        try { JSON.parse(r.body); return true; } catch { return false; }
      },
    });
  });

  sleep(rnd(1, 3));
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function rnd(min, max) {
  return min + Math.random() * (max - min);
}

// ── HTML Report Generation ──────────────────────────────────────────────────
export function handleSummary(data) {
  const now = new Date().toISOString().replace(/[:.]/g, '-');
  return {
    stdout: textSummary(data, { indent: '  ', enableColors: true }),
    [`load-tests/results/summary-${now}.html`]: generateHTMLReport(data),
    [`load-tests/results/summary-${now}.json`]: JSON.stringify(data, null, 2),
  };
}

function generateHTMLReport(data) {
  const metrics = data.metrics;

  function metricRow(name, metric) {
    if (!metric || !metric.values) return '';
    const v = metric.values;
    if (v.avg !== undefined) {
      return `
        <tr>
          <td><code>${name}</code></td>
          <td>${fmt(v.min)}</td>
          <td>${fmt(v.avg)}</td>
          <td>${fmt(v.med)}</td>
          <td>${fmt(v['p(95)'])}</td>
          <td>${fmt(v['p(99)'])}</td>
          <td>${fmt(v.max)}</td>
          <td>${v.count || '-'}</td>
        </tr>`;
    }
    if (v.rate !== undefined) {
      return `
        <tr>
          <td><code>${name}</code></td>
          <td colspan="6">${(v.rate * 100).toFixed(2)}%</td>
          <td>${v.passes || '-'} / ${(v.passes || 0) + (v.fails || 0)}</td>
        </tr>`;
    }
    if (v.count !== undefined) {
      return `
        <tr>
          <td><code>${name}</code></td>
          <td colspan="7">${v.count}</td>
        </tr>`;
    }
    return '';
  }

  function fmt(ms) {
    if (ms === undefined || ms === null) return '-';
    if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
    return `${ms.toFixed(1)}ms`;
  }

  // Categorize metrics
  const customTrends = [];
  const customRates = [];
  const customCounters = [];
  const builtinMetrics = [];

  for (const [name, metric] of Object.entries(metrics)) {
    if (name.startsWith('http_req_') || name === 'http_reqs' ||
        name === 'iteration_duration' || name === 'iterations' ||
        name.startsWith('data_') || name.startsWith('vus')) {
      builtinMetrics.push([name, metric]);
    } else if (metric.type === 'trend') {
      customTrends.push([name, metric]);
    } else if (metric.type === 'rate') {
      customRates.push([name, metric]);
    } else if (metric.type === 'counter') {
      customCounters.push([name, metric]);
    }
  }

  const thresholdResults = [];
  for (const [name, metric] of Object.entries(metrics)) {
    if (metric.thresholds) {
      for (const [expr, result] of Object.entries(metric.thresholds)) {
        thresholdResults.push({ name, expr, ok: result.ok });
      }
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chosen Threads — Load Test Report</title>
  <style>
    :root {
      --bg: #0f172a; --surface: #1e293b; --border: #334155;
      --text: #e2e8f0; --muted: #94a3b8;
      --green: #22c55e; --red: #ef4444; --blue: #3b82f6; --yellow: #eab308;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: var(--bg); color: var(--text);
      padding: 2rem; line-height: 1.6;
    }
    h1 { font-size: 1.75rem; margin-bottom: 0.25rem; }
    h2 {
      font-size: 1.15rem; color: var(--blue); margin: 2rem 0 0.75rem;
      border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;
    }
    .subtitle { color: var(--muted); font-size: 0.9rem; margin-bottom: 1.5rem; }
    .dashboard {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem; margin-bottom: 2rem;
    }
    .card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 8px; padding: 1rem; text-align: center;
    }
    .card .label { color: var(--muted); font-size: 0.8rem; text-transform: uppercase; }
    .card .value { font-size: 1.5rem; font-weight: 700; margin-top: 0.25rem; }
    table {
      width: 100%; border-collapse: collapse; background: var(--surface);
      border: 1px solid var(--border); border-radius: 8px; overflow: hidden;
      font-size: 0.85rem; margin-bottom: 1.5rem;
    }
    th {
      background: #0f172a; color: var(--muted); text-align: left;
      padding: 0.6rem 0.75rem; font-weight: 600; text-transform: uppercase;
      font-size: 0.75rem; letter-spacing: 0.5px;
    }
    td { padding: 0.5rem 0.75rem; border-top: 1px solid var(--border); }
    tr:hover td { background: rgba(59,130,246,0.05); }
    code { font-family: 'Cascadia Code', 'Fira Code', monospace; font-size: 0.82rem; }
    .pass { color: var(--green); font-weight: 600; }
    .fail { color: var(--red); font-weight: 600; }
    .threshold-badge {
      display: inline-block; padding: 0.15rem 0.5rem; border-radius: 4px;
      font-size: 0.75rem; font-weight: 600;
    }
    .threshold-badge.pass { background: rgba(34,197,94,0.15); }
    .threshold-badge.fail { background: rgba(239,68,68,0.15); }
  </style>
</head>
<body>
  <h1>🧵 Chosen Threads — Load Test Report</h1>
  <p class="subtitle">Generated: ${new Date().toLocaleString()}</p>

  <div class="dashboard">
    <div class="card">
      <div class="label">Total Requests</div>
      <div class="value">${metrics.http_reqs?.values?.count || 0}</div>
    </div>
    <div class="card">
      <div class="label">Avg Response</div>
      <div class="value">${fmt(metrics.http_req_duration?.values?.avg)}</div>
    </div>
    <div class="card">
      <div class="label">P95 Response</div>
      <div class="value">${fmt(metrics.http_req_duration?.values?.['p(95)'])}</div>
    </div>
    <div class="card">
      <div class="label">P99 Response</div>
      <div class="value">${fmt(metrics.http_req_duration?.values?.['p(99)'])}</div>
    </div>
    <div class="card">
      <div class="label">Error Rate</div>
      <div class="value">${((metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2)}%</div>
    </div>
    <div class="card">
      <div class="label">Throughput</div>
      <div class="value">${(metrics.http_reqs?.values?.rate || 0).toFixed(1)}/s</div>
    </div>
  </div>

  <h2>📊 Threshold Results</h2>
  <table>
    <thead><tr><th>Metric</th><th>Threshold</th><th>Result</th></tr></thead>
    <tbody>
      ${thresholdResults.map(t => `
        <tr>
          <td><code>${t.name}</code></td>
          <td><code>${t.expr}</code></td>
          <td><span class="threshold-badge ${t.ok ? 'pass' : 'fail'}">${t.ok ? '✓ PASS' : '✗ FAIL'}</span></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>⏱️ Custom Endpoint Metrics (Trends)</h2>
  <table>
    <thead><tr><th>Metric</th><th>Min</th><th>Avg</th><th>Med</th><th>P95</th><th>P99</th><th>Max</th><th>Count</th></tr></thead>
    <tbody>${customTrends.map(([n, m]) => metricRow(n, m)).join('')}</tbody>
  </table>

  <h2>📈 Rates & Counters</h2>
  <table>
    <thead><tr><th>Metric</th><th colspan="6">Value</th><th>Details</th></tr></thead>
    <tbody>
      ${customRates.map(([n, m]) => metricRow(n, m)).join('')}
      ${customCounters.map(([n, m]) => metricRow(n, m)).join('')}
    </tbody>
  </table>

  <h2>🔧 Built-in HTTP Metrics</h2>
  <table>
    <thead><tr><th>Metric</th><th>Min</th><th>Avg</th><th>Med</th><th>P95</th><th>P99</th><th>Max</th><th>Count</th></tr></thead>
    <tbody>${builtinMetrics.map(([n, m]) => metricRow(n, m)).join('')}</tbody>
  </table>
</body>
</html>`;
}
