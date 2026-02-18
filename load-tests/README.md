# Load Tests — Chosen Threads

Performance testing suite built with [k6](https://k6.io) to extract key metrics from all API routes.

## Prerequisites

- **k6** installed (`winget install -e --id k6.k6` or [download](https://k6.io/docs/get-started/installation/))
- Next.js dev server running (`npm run dev`)

## Quick Start

```bash
# Start your dev server first
npm run dev

# Run the full suite (all scenarios, generates HTML report)
npm run loadtest

# Run individual scenarios
npm run loadtest:public    # Homepage, shop, product APIs
npm run loadtest:auth      # Login + rate limit verification
npm run loadtest:admin     # Admin dashboard APIs
npm run loadtest:journey   # End-to-end user flow simulation
```

## Load Profiles

Override the default "load" profile with the `PROFILE` env variable:

```bash
k6 run -e PROFILE=smoke   load-tests/scenarios/public-api.js   # 1 VU, 30s
k6 run -e PROFILE=load    load-tests/scenarios/public-api.js   # 10 VUs, ramp (default)
k6 run -e PROFILE=stress  load-tests/scenarios/public-api.js   # Up to 100 VUs
k6 run -e PROFILE=spike   load-tests/scenarios/public-api.js   # Sudden 150 VU spike
```

## Configuration

| Environment Variable | Default | Description |
|---|---|---|
| `BASE_URL` | `http://localhost:3000` | Target server URL |
| `PROFILE` | `load` | Stage profile: smoke, load, stress, spike |
| `PRODUCT_ID` | `1` | Product ID used in API calls |
| `SUPABASE_URL` | _(hardcoded)_ | Custom Supabase project URL |
| `SUPABASE_ANON_KEY` | _(hardcoded)_ | Custom Supabase anon key |
| `ADMIN_EMAIL` | _(none)_ | Admin email for authenticated tests |
| `ADMIN_PASSWORD` | _(none)_ | Admin password for authenticated tests |
| `ADMIN_TOKEN` | _(none)_ | Manual bearer token (alternative to email/password) |

## Authenticated Admin Testing

To test protected admin routes, you must provide credentials. These are used to obtain a real Supabase access token at the start of the test:

```bash
k6 run -e ADMIN_EMAIL=admin@example.com -e ADMIN_PASSWORD=your-secret load-tests/full-suite.js
```

> [!TIP]
> Authenticating via `ADMIN_EMAIL`/`ADMIN_PASSWORD` is preferred for long-running tests as the suite will automatically handle token acquisition in the `setup()` phase.

## Test Against Production

```bash
k6 run -e BASE_URL=https://your-site.vercel.app load-tests/full-suite.js
```

## Reports

After running the full suite, reports are saved to `load-tests/results/`:
- **HTML report** — visual dashboard with charts and threshold results
- **JSON report** — raw metrics data for CI/CD integration

## Key Metrics Collected

| Metric | Type | Description |
|---|---|---|
| `homepage_duration` | Trend | Homepage response time (p50/p95/p99) |
| `shop_page_duration` | Trend | Shop page response time |
| `product_api_duration` | Trend | Product views API response time |
| `full_journey_duration` | Trend | Complete user journey time |
| `journey_completion_rate` | Rate | % of journeys completing without errors |
| `admin_*_duration` | Trend | Admin endpoint response times (7 endpoints) |
| `login_attempt_duration` | Trend | Auth endpoint response time |
| `rate_limit_triggered` | Counter | Number of 429 rate limit responses |
| `http_req_failed` | Rate | Overall HTTP error rate |
| `http_reqs` | Counter | Requests per second (throughput) |

## Thresholds

Tests fail if these thresholds are breached:

- **p(95) response time** < 500ms (API), < 800ms (pages)
- **Error rate** < 1% (public), < 5% (admin)
- **Journey completion** > 90%

## File Structure

```
load-tests/
├── k6.config.js              # Shared config (URL, stages, thresholds)
├── full-suite.js              # Orchestrates all scenarios + HTML report
├── README.md
├── results/                   # Generated reports (gitignored)
└── scenarios/
    ├── public-api.js          # Homepage, shop, product APIs
    ├── auth-endpoints.js      # Login + rate limiting
    ├── admin-api.js           # Admin dashboard endpoints
    └── user-journey.js        # End-to-end user flow
```
