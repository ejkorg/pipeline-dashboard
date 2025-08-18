# Annotated Key Files
Brief inline-style commentary to accelerate orientation.

## src/services/pipelineApi.ts
Highlights:
```ts
const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://10.253...';
// Builds endpoint; env override first.

// getPipelineInfo(force)
// 1. Optional cache short-circuit
// 2. Offline mode short-circuit (env or toggle)
// 3. Fetch JSON with timeout & optional auth token
// 4. Flexible schema parse (array | single object | object map)
// 5. Fallback on network/schema failure (unless strict)
// 6. Sanitize & trend annotate
```

## src/utils/normalizePipeline.ts
```ts
// Accepts array of RawPipelineRun
// - Coerces numeric strings to numbers
// - Ensures start_utc exists (fallback to start_local or now)
// - Derives elapsed_human when missing
// - Sorts newest first
// - Calls addTrends to append trend markers per pipeline_name
```

## src/stores/pipelines.ts
```ts
// Pinia store: pipelines state + fetching lifecycle
// lastFetchSource: 'live' | 'offline' | 'fallback'
// fetchPipelines sets loading, delegates to pipelineApi, handles errors
// Uses polling + realtime composables for updates
```

## src/stores/prefs.ts
```ts
// Persists user preferences (dark mode, page size, sort, search)
// Dark mode initial value order:
//   explicit ui:darkMode -> legacy app:dark -> system preference
// Offline mode intentionally NOT persisted now (always starts live unless env forces)
```

## src/components/Dashboard.vue
```vue
<!-- Orchestrates major actions: manual refresh, toggle offline, import/export -->
<!-- Restores persisted offline dataset if offlineMode active on mount -->
```

## src/components/PipelineTable.vue
```vue
<!-- Presents paginated, filterable pipeline runs -->
<!-- Status badge styling logic: success (green), failed (red), running/unknown (gray) -->
```

## src/composables/usePipelineFilters.ts
```ts
// Central place for search + sort + paging
// Accepts a getter function returning the current pipelines list
// Computed chain: filtered -> sorted -> paged
```

## src/types/pipelineSchema.ts
```ts
// Zod definitions for raw run shape (nullable-friendly)
// FlexibleResults union: array | record map | single object
// ApiEnvelopeSchema: { results?, pipelines? } .passthrough() to ignore extras
```

## src/types/pipeline.ts
```ts
// TypeScript interfaces for normalized (PipelineRun) and raw (RawPipelineRun)
// Used across app for static type safety
```

## src/composables/usePolling.ts
```ts
// Wraps setInterval with a reactive running flag + start/stop methods
// Accepts a factory for delay (ms) so poll interval changes reactively
```

## src/utils/exporters.ts
```ts
// Convert current pipelines to downloadable JSON or CSV
// CSV builder escapes quotes minimally (simple dataset assumption)
```

## src/utils/logger.ts
```ts
// Thin wrapper over console; could be replaced with structured logging adapter
```

## src/__tests__/pipelineApi.test.ts
```ts
// Ensures different shapes of API responses parse correctly
// Tests caching, force refetch, validation failure, trend logic
```

---
## Quick Navigation Suggestions
| Task | File(s) to Read First |
|------|-----------------------|
| Understand data lifecycle | pipelineApi.ts → normalizePipeline.ts → pipelines.ts |
| Change table display | PipelineTable.vue + usePipelineFilters.ts |
| Add new preference | prefs.ts + component using it |
| Modify status styling | PipelineTable.vue (status column) |
| Harden schema | pipelineSchema.ts + pipelineApi.test.ts |

