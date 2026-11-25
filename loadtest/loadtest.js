/* global __ENV */
import http from 'k6/http';
import { check } from 'k6';

const baseUrl = (__ENV.BASE_URL || '').replace(/\/+$/, '');
if (!baseUrl) {
  throw new Error('Set BASE_URL to the authorized API origin, e.g. https://your-alb-dns.');
}

export const options = {
  stages: [
    { duration: '20s', target: 5 },
    { duration: '40s', target: 5 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<2000'],
  },
};

export default function () {
  const response = http.get(`${baseUrl}/api/products/`, {
    tags: { name: 'GET /api/products/' },
  });

  check(response, {
    'status is 200': (res) => res.status === 200,
    'response is JSON': (res) => res.headers['Content-Type']?.includes('application/json'),
  });
}
