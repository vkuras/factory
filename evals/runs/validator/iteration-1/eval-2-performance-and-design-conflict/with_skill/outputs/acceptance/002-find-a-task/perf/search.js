// QE5 load test: 500 tasks in the list, ten people in the room searching at the
// same time, 95 out of 100 searches under half a second.
//
// Scenario, as a team member uses it (002 S5, QE7: the search runs while typing):
//   1. open the list (unfiltered GET)
//   2. type a four-letter query, which the UI sends as one request per keystroke
//   3. read the result, then think for a moment
//
// Run against the compose stack, from the stack's own network:
//   docker run --rm --network <project>_default -e BASE_URL=http://app:8080 \
//     -v "$PWD/tests/acceptance/002-find-a-task/perf:/perf" grafana/k6 run /perf/search.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://app:8080';

const searchDuration = new Trend('search_duration', true);
const searchErrors = new Rate('search_errors');

export const options = {
  scenarios: {
    ten_people_searching: {
      executor: 'constant-vus',
      vus: 10, // QE5: ten people in the room search at the same time
      duration: '3m',
      gracefulStop: '10s',
    },
  },
  thresholds: {
    // QE5: 95 out of 100 searches answer in under half a second.
    'search_duration': ['p(95)<500'],
    'search_errors': ['rate==0'],
  },
};

const WORDS = ['milk', 'invo', 'prin', 'coff', 'cont', 'deli', 'offe', 'cust', 'meet', 'supp'];

export default function () {
  // 1. open the list
  const list = http.get(`${BASE_URL}/api/tasks`, { tags: { step: 'list' } });
  check(list, { 'list is 200': (r) => r.status === 200 });
  sleep(0.5);

  // 2. type a four-letter query, one request per keystroke
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  for (let i = 1; i <= word.length; i += 1) {
    const q = word.slice(0, i);
    const res = http.get(`${BASE_URL}/api/tasks?q=${encodeURIComponent(q)}`, {
      tags: { step: 'search' },
    });
    searchDuration.add(res.timings.duration);
    searchErrors.add(res.status !== 200);
    check(res, { 'search is 200': (r) => r.status === 200 });
    sleep(0.2); // typing speed
  }

  // every fourth round the person also hides the finished tasks
  if (Math.random() < 0.25) {
    const res = http.get(`${BASE_URL}/api/tasks?q=${word}&open=true`, { tags: { step: 'search' } });
    searchDuration.add(res.timings.duration);
    searchErrors.add(res.status !== 200);
  }

  sleep(2); // read the result and do something else
}
