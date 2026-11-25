// Base URL API yang bisa dikonfigurasi saat build.
//
// - Development (Vite :5173): default `/api` -> diteruskan proxy Vite ke :8000.
// - Local lab (Nginx :8080): `/api` -> di-proxy Nginx ke Gunicorn.
// - Produksi (CloudFront + ALB): set `VITE_API_BASE_URL=https://<alb-dns>/api`.
const rawBase = import.meta.env.VITE_API_BASE_URL || '/api';

export const API_BASE = rawBase.replace(/\/+$/, '');

export default API_BASE;
