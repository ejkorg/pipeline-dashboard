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
