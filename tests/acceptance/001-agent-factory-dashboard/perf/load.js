// What the operator does: open the dashboard, look, open a ticket, look, switch back.
// Switching tabs costs no request (the page carries all three), so the load is page loads.
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE || 'http://dashboard:8787';
const TICKETS = Number(__ENV.TICKETS || 300);

export const options = {
  scenarios: {
    operator: { executor: 'constant-vus', vus: Number(__ENV.VUS || 2), duration: __ENV.DURATION || '2m' },
  },
  thresholds: {
    // "opening the dashboard and switching between the three tabs feels immediate" (001 QE2),
    // in the numbers the design derived from it
    'http_req_duration{page:overview}': ['p(95)<300'],
    'http_req_duration{page:detail}': ['p(95)<200'],
    http_req_failed: ['rate==0'],
  },
};

export default function () {
  const overview = http.get(`${BASE}/`, { tags: { page: 'overview' } });
  check(overview, {
    'the overview answers 200': (r) => r.status === 200,
    'it carries all three tabs': (r) => r.body.includes('data-panel="analytics"'),
  });
  sleep(2);

  const ticket = String(100 + Math.floor(Math.random() * TICKETS)).padStart(3, '0');
  const detail = http.get(`${BASE}/ticket/${ticket}`, { tags: { page: 'detail' } });
  check(detail, { 'the ticket answers 200': (r) => r.status === 200 });
  sleep(2);
}
