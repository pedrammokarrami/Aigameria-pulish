# AIGAMERIA — Production Deployment Guide

This document explains how to run AIGAMERIA as a real, production-ready product.
**Zero external AI APIs are required** — every intelligent feature (coach
consultation, symbiote, prosecutor, highlight copywriter, hologram dialogue,
content analyzer) is implemented as a deterministic in-app engine.

## 1. Requirements

- Node.js ≥ 24 (uses the built-in `node:sqlite` database — no native builds)
- npm ≥ 10

## 2. Setup

```bash
npm install                # install dependencies
cp .env.example .env       # configure (all values optional)
npm run dev:server         # development: Express API + Vite middleware on :3000
```

## 3. Production

```bash
npm run build              # vite build → dist/
NODE_ENV=production npm start   # tsx server.ts (serves API + static dist)
```

The server starts with migrations applied automatically and seeds the initial
ecosystem state on first boot. Data persists in `.data/aigameria.sqlite` (WAL).

## 4. Health & readiness

- `GET /health` — process + database + WS presence summary
- `GET /api/v1/health` — same payload inside the v1 envelope
- `GET /api/health` — legacy probe kept for UI compatibility

## 5. Architecture

```
Client (React 19 + Tailwind 4)
   │  fetch /api/v1/*        ws://…/ws/chat?token=…
   ▼
Express (security headers · CORS allowlist · rate limits · zod validation)
   │
   ├─ /api/v1 routes (standard envelope { success, data, error, meta })
   │     ├─ /auth (scrypt + rotating sessions, IDOR-safe)
   │     ├─ /accounts (multi-account linking, hashed 6-digit verification)
   │     ├─ /ingest (SSRF-hardened fetch → internal analyzer → publish)
   │     ├─ /agents (deterministic engines, cached by input hash, audited)
   │     └─ /chat (rooms + paginated history)
   ├─ /ws/chat (token auth at upgrade, typing/delivered/seen, anti-spam)
   ├─ legacy /api/* (compatibility with the existing UI)
   ▼
SQLite (node:sqlite, WAL) — users · sessions · linked_accounts ·
ingest_items · agent_runs · chat_* · security_log · kv (ecosystem state)
   ▲
Cache layer (in-memory TTL, cache-aside, tag-based invalidation)
```

### Internal agents (no external AI)

| Agent | Implementation | Audit |
|---|---|---|
| Coach Consultation Mesh | 4 deterministic rule agents over real query/tap/screenshot inputs + public community sources (Reddit/Wikipedia) with offline fallback | `agent_runs` + trace id |
| Coach Symbiote / Highlight Copy / Prosecutor | deterministic rule engines over real ecosystem state | `agent_runs` |
| Hologram Dialogue | intent routing + telemetry synthesis + locally synthesized WAV voice (pure PCM) | trace id |
| Ingest Content Analyzer | keyword/quality/safety heuristics over fetched/user content | `enriched_json` |

Every agent output is structured, traceable (`traceId` / `runId`) and computed
from real database/state data — never random filler text.

## 6. Testing

```bash
npm run test:e2e           # full E2E + security suite against a running server
npx tsx --test src/**/*.test.ts   # unit tests (agents, engines)
npm run lint               # tsc --noEmit
```

The E2E suite covers auth, account linking, ingest & publish, internal agents,
cache invalidation, WebSocket chat (realtime + history + rate limit + auth),
security headers, IDOR, SSRF, injection containment and 404 handling.

## 7. Security model

- Passwords: scrypt (N=16384) with per-user salt, constant-time verification
- Sessions: 256-bit random tokens stored only as SHA-256 hashes, 30-day TTL,
  rotation on refresh, revocation on logout and password change
- Every untrusted write validated with Zod; SQL is 100% parameterized
- SSRF guard: scheme allowlist, credential-in-URL rejection, private/loopback/
  link-local IP blocking incl. DNS resolution + IPv4-mapped IPv6
- Security headers: CSP (no external script sources), X-Frame-Options DENY,
  nosniff, referrer policy, HSTS behind TLS, restrictive CORS allowlist
- Rate limits: auth 10/min/IP, ingest 30/min/user, verify 15/min/user,
  chat 10 msgs/10s/connection
- `security_log` records every auth/account/ingest/chat security event with IP

## 8. Environment variables (see `.env.example`)

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `NODE_ENV` | – | `production` serves static `dist/` |
| `CORS_ORIGINS` | – | extra allowed origins (comma-separated) |
| `FORCE_HSTS` | `0` | emit HSTS behind TLS proxy |
| `AIGAMERIA_DATA_DIR` | `.data` | SQLite data directory |

No secret values are required at build or runtime — nothing is hardcoded.
