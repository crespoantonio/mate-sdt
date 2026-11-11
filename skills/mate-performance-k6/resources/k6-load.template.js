import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

/**
 * M.A.T.E. Framework - k6 Performance Oracle Template
 * Validates <performance_oracles> (ORA-LATENCY & ORA-ERRORS) inside rootless Podman.
 * Run with: npx mate-sdt k6 tests/nfr/load.k6.js
 */

const orderLatency = new Trend('mate_order_duration_ms', true);
const orderSuccessRate = new Rate('mate_order_success_rate');

export const options = {
  scenarios: {
    sustained_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 20 },  // Ramp-up
        { duration: '3m', target: 20 },  // Sustained SLA check
        { duration: '30s', target: 0 },  // Graceful ramp-down
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    // M.A.T.E. Sacred Performance Oracles (breaks CI if violated)
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<400', 'p(99)<800'],
    'mate_order_duration_ms': ['p(95)<400'],
    'mate_order_success_rate': ['rate>0.99'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const payload = JSON.stringify({
    garment_count: 3,
    service_type: 'WASH_AND_FOLD',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': `k6-${__VU}-${__ITER}-${Date.now()}`,
    },
    tags: { endpoint: 'create_order' },
  };

  const res = http.post(`${BASE_URL}/api/v1/orders`, payload, params);

  orderLatency.add(res.timings.duration);
  const passed = check(res, {
    'INV-STATUS: status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'ORA-LATENCY: response under 400ms': (r) => r.timings.duration < 400,
  });
  orderSuccessRate.add(passed);

  sleep(1);
}
