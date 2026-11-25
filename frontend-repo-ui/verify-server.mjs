// Local verification server for the repo-UI frontend: serves dist/ and
// reverse-proxies /api/v1/* to the FastAPI backend on :8090 (same-origin).
import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3001;
const UPSTREAM = process.env.UPSTREAM_API_BASE_URL || 'http://127.0.0.1:8090';
const distDir = path.join(__dirname, 'dist');

app.use(express.static(distDir));
app.use(express.json({ limit: '10mb' }));

app.all('/api/v1/*', (req, res) => {
  const target = new URL(req.originalUrl, UPSTREAM);
  const proxyReq = http.request(
    target,
    { method: req.method, headers: { ...req.headers, host: target.host } },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );
  proxyReq.on('error', () => res.status(502).json({ error: 'upstream unreachable' }));
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    proxyReq.write(JSON.stringify(req.body));
  }
  proxyReq.end();
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, () => console.log(`repo-ui verify server on :${PORT} → ${UPSTREAM}`));
