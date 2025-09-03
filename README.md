# Pipeline Dashboard

A Vue 3 + TypeScript dashboard for viewing pipeline run metrics (duration, row counts, trends) with offline sample mode, import/export, filtering, and realtime-ready architecture.

## Scripts
```
pnpm dev        # start dev server
pnpm build      # type-check + production build
pnpm test       # run vitest suite
pnpm test:ui    # interactive test watcher
```

## Features
- Flexible API response parsing (array / single / map)
- Zod schema validation + optional strict mode
- Polling + realtime extensible composables
- Offline/sample mode & JSON import/merge
- Trend detection (run-to-run elapsed comparison)
- CSV/JSON export
- Dark mode + persisted UI preferences

## Env Variables
See `.env.example`. Notable flags:
| Var | Purpose |
|-----|---------|
| `VITE_API_BASE_URL` | Override backend base URL |
| `VITE_API_ENDPOINT_PATH` | Override path (e.g., `/api/pipelines`), defaults to `/get_pipeline_info` |
| `VITE_API_TIMEOUT_MS` | Request timeout (ms) |
| `VITE_API_POLL_SECONDS` | Default poll interval |
| `VITE_OFFLINE_MODE` | Force offline sample dataset |
| `VITE_STRICT_NO_FALLBACK` | Disable silent sample fallback |
| `VITE_DEBUG_SCHEMA` | Log failing payload snippet |

## Dev Proxy tip (FastAPI mounted under /pipeline-service)
In development, Vite proxies `/pipeline-service/*` to your backend at `VITE_DEV_PROXY_TARGET`.
By default it strips the `/pipeline-service` prefix before forwarding. If your upstream is actually mounted under `/pipeline-service` (as in your FastAPI reporting `/pipeline-service/openapi.json`), keep the prefix by adding a `.env.local` with:

```
VITE_DEV_PROXY_TARGET=http://127.0.0.1:8001
VITE_DEV_PROXY_STRIP_PREFIX=false
```

Then the dashboard will call `http://127.0.0.1:5173/pipeline-service/...` and the dev proxy will forward requests as `http://127.0.0.1:8001/pipeline-service/...` to match your upstream.

## Deployment (Option 2: NGINX front, uvicorn on loopback)
Recommended for intranet servers:
- Run FastAPI (uvicorn) bound to `127.0.0.1:8001` (see `docs/SYSTEMD_UVICORN_SAMPLE.md`).
- Put NGINX on a reachable port (e.g., 8080) and preserve the `/pipeline-service` prefix (see `docs/nginx.example.conf` lines under `location /pipeline-service/ { proxy_pass http://pipeline-service; }`).
- Access API via: `http://<host>:8080/pipeline-service/get_pipeline_info?...`

Develop locally but point to loopback upstream (if you’re on the server):

```
VITE_DEV_PROXY_TARGET=http://127.0.0.1:8001
VITE_DEV_PROXY_STRIP_PREFIX=false
```

Or tunnel remote loopback to your machine:

```
ssh -N -L 8001:127.0.0.1:8001 user@<host>
VITE_DEV_PROXY_TARGET=http://localhost:8001
VITE_DEV_PROXY_STRIP_PREFIX=false
```

## Onboarding Resources
New or ramping up? Start here:
| Document | Purpose |
|----------|---------|
| `docs/ONBOARDING_TUTORIAL.md` | Step-by-step first contribution guide |
| `docs/ARCHITECTURE_DIAGRAM.md` | High-level system & data flow diagram |
| `docs/ANNOTATED_KEY_FILES.md` | Commentary on critical source files |
| `docs/SUMMARY_DOWNLOAD.md` | Aggregated portable summary |

## High-Level Flow
`pipelineApi` → (fetch + validate + normalize) → `pipelines` store → filters/sorting → table & charts.

## Contributing (Quick Checklist)
1. Branch from `main`
2. Implement change + tests
3. `pnpm test` clean
4. Open PR with concise description

Happy building!
