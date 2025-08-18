# Architecture Overview

Plain-text diagram and narrative showing how pieces connect.

## Diagram
```
App.vue (root)
  └─ Dashboard.vue
       ├─ PipelineSummary.vue
       ├─ PipelineTable.vue
       │    └─ usePipelineFilters (composable)
       ├─ PipelineChart.vue (async)
       ├─ RowCountChart.vue (async)
       ├─ OfflineBanner.vue
       └─ Import / Export actions

State Layer (Pinia Stores)
  pipelines.ts  ← fetch & realtime orchestrator
  prefs.ts      ← user prefs (dark, sorting, offline)
  toasts.ts     ← toast notifications

Services / Data
  pipelineApi.ts → fetch + Zod parse → normalizePipeline.ts → pipelines store
  realtime.ts    → (socket.io client placeholder) → pipelines store updates
  cache.ts       → in-memory cache between calls
  data.js        → bundled sample (offline/fallback)

Composables
  usePolling.ts        (interval control)
  usePipelineRealtime.ts (wires realtime events)
  usePipelineFilters.ts (search/sort/pagination logic)
  useLocalStorage.ts   (helper)
  useToasts.ts         (helper)

Utilities
  normalizePipeline.ts (sanitization & trend tagging)
  exporters.ts         (JSON/CSV export)
  logger.ts            (structured console logging)

Types & Schemas
  pipeline.ts          (TS interfaces)
  pipelineSchema.ts    (Zod runtime validation)
  env.d.ts             (env var typing)
```

## Flow
1. Dashboard triggers store fetch.
2. Store calls `pipelineApi.getPipelineInfo()`.
3. API service fetches JSON, validates with Zod, falls back if needed.
4. Normalized runs stored in `pipelines` store.
5. UI components consume store state; filters transform in-memory.
6. Polling & realtime append/replace runs.
7. Export/import act directly on store or offline dataset.

## Data Source States
- **live**: Successful network + schema parse.
- **offline**: Forced offline mode / imported dataset.
- **fallback**: Network or schema failure replaced with bundled sample (unless strict mode).

## Extension Points
| Area | How to Extend |
|------|---------------|
| New metric | Add field in `normalizePipeline` + interface + display component |
| New status color | Update class mapping in `PipelineTable.vue` |
| Realtime events | Implement socket events in `realtime.ts` |
| Auth headers | Add logic in `fetchJson` inside `pipelineApi.ts` |
| Retry logic | Wrap `fetchJson` with retry policy (exponential backoff) |
| Advanced caching | Replace `cache.ts` with LRU or persisted store |

## Testing Targets
- API parsing variants (array/single/map)
- Fallback path vs strict mode
- Offline import merge logic (missing—candidate for new test)
- Filtering correctness under search + sort + paging

## Risks / Watchpoints
- Silent fallback may hide persistent API problems (enable strict mode in staging).
- Trend logic assumes chronological order; incorrect timestamps degrade accuracy.
- Large offline imports (> ~1MB serialized) are not persisted.

## Planned Improvements (suggested)
- Add toast when source switches to fallback
- Add rows/sec computed metric
- Add tests for offline merge & import
- Provide clear button to purge persisted offline dataset

