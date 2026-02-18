/**
 * Admin API Load Test — Chosen Threads
 *
 * Targets admin-authenticated endpoints (read-only operations):
 *   • Products listing & detail sub-resources
 *   • Customers with order aggregation
 *   • Reviews with stats
 *   • Notifications
 *
 * NOTE: Some admin routes have auth commented out; others require cookies.
 *       This test exercises the routes that are currently accessible.
 *       For fully-authenticated tests, set ADMIN_TOKEN env variable.
 *
 * Run:  k6 run load-tests/scenarios/admin-api.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { BASE_URL, getStages, DEFAULT_THRESHOLDS, JSON_HEADERS, loginAdmin } from '../k6.config.js';

// ── Custom metrics ─────────────────────────────────────────────────────────
const productsListDuration   = new Trend('admin_products_list_duration', true);
const customersListDuration  = new Trend('admin_customers_list_duration', true);
const reviewsListDuration    = new Trend('admin_reviews_list_duration', true);
const notificationsListDuration = new Trend('admin_notifications_list_duration', true);
const variantsDuration       = new Trend('admin_variants_duration', true);
const designAreasDuration    = new Trend('admin_design_areas_duration', true);
const viewsDuration          = new Trend('admin_views_duration', true);
const adminErrorRate         = new Rate('admin_error_rate');

// ── k6 options ─────────────────────────────────────────────────────────────
export const options = {
  stages: getStages(),
  thresholds: {
    ...DEFAULT_THRESHOLDS,
    admin_products_list_duration:   ['p(95)<600'],
    admin_customers_list_duration:  ['p(95)<800'],
    admin_reviews_list_duration:    ['p(95)<600'],
    admin_notifications_list_duration: ['p(95)<500'],
    admin_variants_duration:        ['p(95)<500'],
    admin_design_areas_duration:    ['p(95)<500'],
    admin_views_duration:           ['p(95)<500'],
    admin_error_rate:               ['rate<0.05'],
  },
  tags: { scenario: 'admin-api' },
};

// ── Helpers ─────────────────────────────────────────────────────────────────
function adminHeaders() {
  const headers = { ...JSON_HEADERS };
  // If an admin token is provided, include it
  if (__ENV.ADMIN_TOKEN) {
    headers['Authorization'] = `Bearer ${__ENV.ADMIN_TOKEN}`;
  }
  return headers;
}

// ── Lifecycle ───────────────────────────────────────────────────────────────
export function setup() {
  return loginAdmin(); // returns { token: string | null }
}

function isSuccess(status) {
  return status === 200;
}

// ── Test ────────────────────────────────────────────────────────────────────
export default function (data) {
  const productId = __ENV.PRODUCT_ID || '1';
  const headers = adminHeaders();

  if (data && data.token) {
    headers['Authorization'] = `Bearer ${data.token}`;
  }

  // 1) List all products
  group('Admin — List Products', () => {
    const res = http.get(`${BASE_URL}/api/admin/products`, { headers });
    productsListDuration.add(res.timings.duration);
    adminErrorRate.add(!isSuccess(res.status));
    check(res, {
      'products list status 200': (r) => isSuccess(r.status),
      'products list returns JSON': (r) => {
        try { JSON.parse(r.body); return true; } catch { return false; }
      },
    });
  });

  sleep(0.5);

  // 2) List customers
  group('Admin — List Customers', () => {
    const res = http.get(`${BASE_URL}/api/admin/customers?limit=20`, { headers });
    customersListDuration.add(res.timings.duration);
    adminErrorRate.add(!isSuccess(res.status));
    check(res, {
      'customers list status 200': (r) => isSuccess(r.status),
    });
  });

  sleep(0.5);

  // 3) List reviews
  group('Admin — List Reviews', () => {
    const res = http.get(`${BASE_URL}/api/admin/reviews?status=all&limit=20`, { headers });
    reviewsListDuration.add(res.timings.duration);
    adminErrorRate.add(!isSuccess(res.status));
    check(res, {
      'reviews list status 200': (r) => isSuccess(r.status),
    });
  });

  sleep(0.5);

  // 4) List notifications
  group('Admin — List Notifications', () => {
    const res = http.get(`${BASE_URL}/api/admin/notifications?limit=20`, { headers });
    notificationsListDuration.add(res.timings.duration);
    adminErrorRate.add(!isSuccess(res.status));
    check(res, {
      'notifications list status 200': (r) => isSuccess(r.status),
    });
  });

  sleep(0.5);

  // 5) Product sub-resources (variants, design areas, views)
  group('Admin — Product Variants', () => {
    const res = http.get(`${BASE_URL}/api/admin/products/${productId}/variants`, { headers });
    variantsDuration.add(res.timings.duration);
    adminErrorRate.add(!isSuccess(res.status));
    check(res, {
      'variants status 200': (r) => isSuccess(r.status),
    });
  });

  sleep(0.3);

  group('Admin — Product Design Areas', () => {
    const res = http.get(`${BASE_URL}/api/admin/products/${productId}/design-areas`, { headers });
    designAreasDuration.add(res.timings.duration);
    adminErrorRate.add(!isSuccess(res.status));
    check(res, {
      'design areas status 200': (r) => isSuccess(r.status),
    });
  });

  sleep(0.3);

  group('Admin — Product Views', () => {
    const res = http.get(`${BASE_URL}/api/admin/products/${productId}/views`, { headers });
    viewsDuration.add(res.timings.duration);
    adminErrorRate.add(!isSuccess(res.status));
    check(res, {
      'views status 200': (r) => isSuccess(r.status),
    });
  });

  sleep(randomThinkTime());
}

function randomThinkTime() {
  return 1 + Math.random() * 2;
}
