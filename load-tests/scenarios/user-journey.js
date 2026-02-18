/**
 * User Journey Load Test — Chosen Threads
 *
 * Simulates a realistic end-to-end customer flow:
 *   1. Visit homepage
 *   2. Browse shop page
 *   3. View a specific product's views
 *   4. Load product design areas (customizer prep)
 *   5. Load the customize page
 *
 * Think times between steps simulate real user behavior (1-3s).
 *
 * Run:  k6 run load-tests/scenarios/user-journey.js
 *       k6 run -e PRODUCT_ID=2 load-tests/scenarios/user-journey.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { BASE_URL, getStages, JSON_HEADERS } from '../k6.config.js';

// ── Custom metrics ─────────────────────────────────────────────────────────
const journeyDuration    = new Trend('full_journey_duration', true);
const stepHomepage       = new Trend('step_homepage_duration', true);
const stepShop           = new Trend('step_shop_duration', true);
const stepProductAPI     = new Trend('step_product_api_duration', true);
const stepDesignAreas    = new Trend('step_design_areas_duration', true);
const stepCustomize      = new Trend('step_customize_page_duration', true);
const journeyErrorRate   = new Rate('journey_error_rate');
const journeyCompletion  = new Rate('journey_completion_rate');

// ── k6 options ─────────────────────────────────────────────────────────────
export const options = {
  stages: getStages(),
  thresholds: {
    full_journey_duration:        ['p(95)<8000'], // entire journey under 8s
    step_homepage_duration:       ['p(95)<1000'],
    step_shop_duration:           ['p(95)<1000'],
    step_product_api_duration:    ['p(95)<500'],
    step_design_areas_duration:   ['p(95)<500'],
    step_customize_page_duration: ['p(95)<1500'],
    journey_error_rate:           ['rate<0.02'],
    journey_completion_rate:      ['rate>0.95'],
  },
  tags: { scenario: 'user-journey' },
};

// ── Test ────────────────────────────────────────────────────────────────────
export default function () {
  const productId = __ENV.PRODUCT_ID || '1';
  const journeyStart = Date.now();
  let journeyFailed = false;

  // Step 1: Visit homepage
  group('Journey — Homepage', () => {
    const res = http.get(`${BASE_URL}/`);
    stepHomepage.add(res.timings.duration);
    if (res.status !== 200) journeyFailed = true;
    journeyErrorRate.add(res.status !== 200);
    check(res, { 'homepage loaded': (r) => r.status === 200 });
  });

  sleep(thinkTime());

  // Step 2: Browse shop
  group('Journey — Shop', () => {
    const res = http.get(`${BASE_URL}/shop`);
    stepShop.add(res.timings.duration);
    if (res.status !== 200) journeyFailed = true;
    journeyErrorRate.add(res.status !== 200);
    check(res, { 'shop loaded': (r) => r.status === 200 });
  });

  sleep(thinkTime());

  // Step 3: View product details (API call the frontend makes)
  group('Journey — Product Views API', () => {
    const res = http.get(`${BASE_URL}/api/products/${productId}`, {
      headers: JSON_HEADERS,
    });
    stepProductAPI.add(res.timings.duration);
    if (res.status !== 200) journeyFailed = true;
    journeyErrorRate.add(res.status !== 200);
    check(res, {
      'product views loaded': (r) => r.status === 200,
      'has configuredViews': (r) => {
        try { return JSON.parse(r.body).configuredViews !== undefined; } catch { return false; }
      },
    });
  });

  sleep(thinkTime());

  // Step 4: Load design areas (customizer preparation)
  group('Journey — Design Areas', () => {
    const res = http.get(`${BASE_URL}/api/admin/products/${productId}/design-areas`, {
      headers: JSON_HEADERS,
    });
    stepDesignAreas.add(res.timings.duration);
    if (res.status !== 200) journeyFailed = true;
    journeyErrorRate.add(res.status !== 200);
    check(res, {
      'design areas loaded': (r) => r.status === 200,
    });
  });

  sleep(thinkTime());

  // Step 5: Load customize page
  group('Journey — Customize Page', () => {
    const res = http.get(`${BASE_URL}/customize`);
    stepCustomize.add(res.timings.duration);
    if (res.status !== 200) journeyFailed = true;
    journeyErrorRate.add(res.status !== 200);
    check(res, { 'customize page loaded': (r) => r.status === 200 });
  });

  // Record full journey
  const journeyTime = Date.now() - journeyStart;
  journeyDuration.add(journeyTime);
  journeyCompletion.add(!journeyFailed);

  sleep(thinkTime());
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function thinkTime() {
  return 1 + Math.random() * 2; // 1-3 seconds
}
