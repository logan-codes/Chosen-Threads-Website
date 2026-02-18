/**
 * Public API Load Test — Chosen Threads
 *
 * Targets unauthenticated, customer-facing endpoints:
 *   • Homepage (SSR)
 *   • Shop listing page
 *   • Product views API
 *   • Product catalog API
 *
 * Run:  k6 run load-tests/scenarios/public-api.js
 *       k6 run -e PROFILE=stress load-tests/scenarios/public-api.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { BASE_URL, getStages, DEFAULT_THRESHOLDS, JSON_HEADERS } from '../k6.config.js';

// ── Custom metrics ─────────────────────────────────────────────────────────
const homepageDuration = new Trend('homepage_duration', true);
const shopDuration     = new Trend('shop_page_duration', true);
const productAPIDuration = new Trend('product_api_duration', true);
const catalogAPIDuration = new Trend('catalog_api_duration', true);
const errorRate = new Rate('public_error_rate');

// ── k6 options ─────────────────────────────────────────────────────────────
export const options = {
  stages: getStages(),
  thresholds: {
    ...DEFAULT_THRESHOLDS,
    homepage_duration:    ['p(95)<800'],
    shop_page_duration:   ['p(95)<800'],
    product_api_duration: ['p(95)<400'],
    catalog_api_duration: ['p(95)<400'],
    public_error_rate:    ['rate<0.01'],
  },
  tags: { scenario: 'public-api' },
};

// ── Test ────────────────────────────────────────────────────────────────────
export default function () {
  // 1) Homepage
  group('Homepage', () => {
    const res = http.get(`${BASE_URL}/`);
    homepageDuration.add(res.timings.duration);
    errorRate.add(res.status !== 200);
    check(res, {
      'homepage status 200': (r) => r.status === 200,
      'homepage has content': (r) => r.body && r.body.length > 0,
    });
  });

  sleep(randomThinkTime());

  // 2) Shop listing page
  group('Shop Page', () => {
    const res = http.get(`${BASE_URL}/shop`);
    shopDuration.add(res.timings.duration);
    errorRate.add(res.status !== 200);
    check(res, {
      'shop status 200': (r) => r.status === 200,
    });
  });

  sleep(randomThinkTime());

  // 3) Product views API (use product ID 1 as default, override with PRODUCT_ID env)
  group('Product Views API', () => {
    const productId = __ENV.PRODUCT_ID || '1';
    const res = http.get(`${BASE_URL}/api/products/${productId}`, { headers: JSON_HEADERS });
    productAPIDuration.add(res.timings.duration);
    errorRate.add(res.status !== 200);
    check(res, {
      'product API status 200': (r) => r.status === 200,
      'product API returns JSON': (r) => {
        try { JSON.parse(r.body); return true; } catch { return false; }
      },
      'product API has configuredViews': (r) => {
        try { return JSON.parse(r.body).configuredViews !== undefined; } catch { return false; }
      },
    });
  });

  sleep(randomThinkTime());

  // 4) Product catalog API
  group('Product Catalog API', () => {
    const res = http.get(`${BASE_URL}/api/admin/products`, { headers: JSON_HEADERS });
    catalogAPIDuration.add(res.timings.duration);
    errorRate.add(res.status !== 200);
    check(res, {
      'catalog API status 200': (r) => r.status === 200,
      'catalog API returns products array': (r) => {
        try { return Array.isArray(JSON.parse(r.body).products); } catch { return false; }
      },
    });
  });

  sleep(randomThinkTime());
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function randomThinkTime() {
  return 1 + Math.random() * 2; // 1-3 seconds
}
