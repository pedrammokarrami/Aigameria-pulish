# AIGAMERIA Frontend-Only Live API Contract (`/api/v1/*`)

The AIGAMERIA frontend (`src/`) is **100% API-driven with zero hardcoded games, skills, maps, controller sequences, coaching copy, or demo videos**. Every element stays strictly **hidden until its own API payload and required `.glb`/media asset resolve**, revealing independently with declarative Apple-grade spring physics.

Configure `VITE_API_BASE_URL` in `.env` (for example `VITE_API_BASE_URL="http://localhost:8090"` for your live FastAPI backend, or leave empty when reverse-proxied on the same origin).

## Live Backend Endpoints Wired Directly in `src/services/aigameriaApi.ts`

| Endpoint | Method | Purpose & Hidden-Until-Ready Behavior |
|---|---|---|
| `/api/v1/games` | `GET` | Loads available games & categories. Game selector and category filter bar remain hidden until non-empty games arrive, then emerge smoothly from behind the header bar. |
| `/api/v1/games/{id}` | `GET` | Loads game detail and topics/skills strictly scoped to `{id}`. Discovery board and search bar remain hidden until resolved. |
| `/api/v1/media/analyze` | `POST` | Accepts lightweight client-side pre-processed TV/monitor screen keyframes (downscaled, contrast-enhanced, optional screen-crop, selectable frames — zero heavy video retained) + user question (`lang=fa`/`en`/ISO code). Clears previous game cards immediately until detected `game_id`, `platform` (`PS5`/`Xbox`/`PC`/`iOS`), `puzzle_steps`, `symbol_sequence`, and `voice_explanation` return. |
| `/api/v1/coach/{gameId}/topics/{topic}` | `GET` / `POST` | Loads topic coaching brief, puzzle steps, symbol sequence, voice explanation, and quick prompts (`GET`), and sends topic-scoped questions (`POST`). Coaching panel slides in from right-to-left only once ready. |
| `/api/v1/media/stream/{gameId}?topic={topicId}` | `GET` | Returns 8h-cached (`TTL = 28800s`) free-stream walkthrough video links (`stream_url`, `chapters`, `ttl_seconds`) without downloading heavy video files locally. |
| `/api/v1/stage/{gameId}?topic={topicId}` | `GET` | Returns tactical/puzzle stage command (`mode`, `payload`), strictly guarded against `game.allowedStageModes` for `gameId` isolation. |
| `/api/v1/gamepad/{gameId}?topic={topicId}` | `GET` | Returns platform controller button sequences (`ps5`, `xbox`, `pc`, `ipad`) and optional `.glb` model URLs. Reveals immediately without waiting for slower video streams. |
| `/api/v1/ava/{gameId}` | `GET` | Returns style-matched 3D voice avatar config (`glb_url`, `style_key`, `animation_state` — e.g. `Xbot.glb` for `story`, `Soldier.glb` for `shooter`, `Michelle.glb` for `sports`). Voice button and Voice Walkthrough stay hidden until the style-matched `.glb` finishes loading into the Three.js point cloud. |

## Language Propagation & Purity

- Supports `EN`, `FA`, and all 184 ISO 639-1 world languages via the top-right searchable language picker.
- Every `/api/v1/*` request sends `Accept-Language: <code>` and `?lang=<code>`.
- Strict `EN` purity enforced (zero Persian/Arabic characters or raw repository slugs in `EN` mode).

## Multi-Latency Timing Simulation Mode (Removable on Final Freeze)

Open via the bottom-right **Timing** button, press `Alt+T`, or pass URL params:
- `?preset=live` — 0ms direct backend speed
- `?preset=fast-glb-slow-video` — Controller & AVA `.GLB` (~160ms) vs. delayed Video stream (2800ms)
- `?preset=staggered-waterfall` — Progressive staggered waterfall across every `/api/v1/*` endpoint
- `?preset=slow-backend` — High-latency simulation (1.2s–3.4s)
- Custom overrides: `?delayMedia=3000&delayGamepad=150&delayGlb=180&timing=open`
