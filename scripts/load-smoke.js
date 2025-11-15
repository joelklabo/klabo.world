import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.LOAD_BASE_URL || 'http://localhost:3000';
const ENDPOINTS = ['/', '/posts', '/apps', '/contexts', '/search?q=bitcoin', '/api/health'];

export const options = {
  vus: Number(__ENV.LOAD_VUS || 5),
  duration: __ENV.LOAD_DURATION || '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<750'],
  },
};

export default function () {
  for (const path of ENDPOINTS) {
    const url = `${BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
    const response = http.get(url);
    check(response, {
      [`status 200 ${path}`]: (res) => res.status === 200,
    });
    sleep(1);
  }
}
