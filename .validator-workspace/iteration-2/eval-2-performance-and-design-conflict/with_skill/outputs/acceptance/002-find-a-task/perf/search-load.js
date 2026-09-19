// QE5 load test: 500 tasks in the list, ten people in the room searching at the
// same time, 95 out of 100 searches answer in under half a second.
//
// Run it against a started stack, from the compose network:
//   docker run --rm -i --network <project>_default \
//     -e BASE_URL=http://app:8080 -v "$PWD:/perf" grafana/k6 run /perf/search-load.js
//
// The list must hold 500 tasks first; see seed.js next to this file.
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://app:8080';

// The search requests only, separated from the initial list load.
const searchDuration = new Trend('search_duration', true);

export const options = {
  scenarios: {
    ten_people_searching: {
      executor: 'constant-vus',
      vus: 10, // QE5: ten people in the room
      duration: __ENV.DURATION || '3m',
      gracefulStop: '10s',
    },
  },
  thresholds: {
    // QE5: 95 out of 100 searches answer in under half a second.
    'search_duration': ['p(95)<500'],
    // No search may fail.
    'http_req_failed': ['rate==0'],
    'checks': ['rate==1'],
  },
};

// A four-letter word the team would type, as in the requirements' example.
const WORDS = ['milk', 'plum', 'bill', 'crat', 'lamp', 'door', 'note', 'tape'];

export default function () {
  // 1. Open the list.
  const list = http.get(`${BASE_URL}/api/tasks`, { tags: { step: 'open-list' } });
  check(list, { 'list answers 200': (r) => r.status === 200 });
  sleep(1); // the person looks at the screen

  // 2. Type a four-letter query. The UI sends a request per keystroke.
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  for (let i = 1; i <= word.length; i++) {
    const q = word.slice(0, i);
    const response = http.get(`${BASE_URL}/api/tasks?q=${q}`, { tags: { step: 'search' } });
    searchDuration.add(response.timings.duration);
    check(response, { 'search answers 200': (r) => r.status === 200 });
    sleep(0.15); // typing speed
  }

  // 3. Read the result, then switch "open only" on.
  sleep(1);
  const filtered = http.get(`${BASE_URL}/api/tasks?q=${word}&open=true`, { tags: { step: 'search' } });
  searchDuration.add(filtered.timings.duration);
  check(filtered, { 'filtered search answers 200': (r) => r.status === 200 });
  sleep(2); // think time before the next search
}
