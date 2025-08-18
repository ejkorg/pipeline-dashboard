# Pipeline Dashboard: First Contribution Tutorial

Welcome! This guide walks you from zero context to a small merged change. It assumes **basic JavaScript** but **no prior Vue 3 / TypeScript** experience.

---
## 1. Goal of the App (What You Are Looking At)
A frontend dashboard that shows *pipeline runs* fetched from a backend API. It:
- Fetches JSON from `/get_pipeline_info` (polling + realtime ready)
- Normalizes inconsistent raw data
- Displays tables + charts
- Supports offline/sample mode + import/export
- Tracks user preferences (dark mode, sorting, pagination)

---
## 2. Local Dev Setup (5 minutes)
```bash
# Install dependencies
pnpm install
# Start dev server
pnpm dev
# Open the printed localhost URL in a browser
```
If you don't have pnpm: `npm i -g pnpm`.

---
## 3. Code Entry Points
| File | Why It Matters |
|------|----------------|
| `src/main.ts` | App bootstrap (Vue + Pinia + global styles + dark mode) |
| `src/App.vue` | Root layout, header, data-source badge |
| `src/components/Dashboard.vue` | Orchestrates fetches, offline toggle, charts, table |
| `src/stores/pipelines.ts` | Holds pipeline runs + polling/realtime flow |
| `src/services/pipelineApi.ts` | Fetch + schema validation + fallback logic |
| `src/utils/normalizePipeline.ts` | Converts raw API runs to normalized list |
| `src/composables/usePipelineFilters.ts` | Filtering/sorting/paging logic for the table |

Open each briefly; don’t deep-dive yet.

---
## 4. Vue 3 Quick Primer (Just Enough)
- **Single File Component (SFC)**: `.vue` file with `<template>`, `<script setup>`, `<style>`.
- **Reactive Ref**: `const count = ref(0);` → use `count.value` in JS, just `{{ count }}` in template.
- **Computed**: Derived reactive value: `const doubled = computed(()=> count.value * 2)`.
- **Props**: Component inputs (defined with `defineProps`).
- **Pinia Store**: Central reactive module: `const store = usePipelinesStore();`

---
## 5. Your First Tiny Change (Add a Column: Rows/sec)
1. Open `src/utils/normalizePipeline.ts` — add `rows_per_sec`.
2. Open `src/types/pipeline.ts` — extend `PipelineRun` interface.
3. Open `src/components/PipelineTable.vue` — add a header + cell.
4. Start server and verify new column appears.
5. Run tests: `pnpm test`.
6. Commit + push.

### 5.1 Modify Types (`src/types/pipeline.ts`)
Add:
```ts
rows_per_sec?: number;
```
### 5.2 Compute Value (`normalizePipeline.ts`)
Inside mapping:
```ts
rows_per_sec: elapsedNum ? rowsNum / elapsedNum : 0,
```
### 5.3 Display (`PipelineTable.vue`)
Add header `<th>Rows/sec</th>` and cell `{{ p.rows_per_sec.toFixed(2) }}`.

---
## 6. Where Data Comes From
`pipelineApi.ts` does:
1. Build URL from env `VITE_API_BASE_URL` or default.
2. Fetch JSON with timeout.
3. Zod-parse flexible envelope (array / single / map).
4. Fallback to bundled `data.js` if network or schema error (unless strict).
5. Normalize + trend tagging.

---
## 7. Environments & Flags
| Var | Meaning |
|-----|---------|
| `VITE_API_BASE_URL` | API root override |
| `VITE_OFFLINE_MODE` | Force offline sample on load |
| `VITE_STRICT_NO_FALLBACK` | Disable silent fallback |
| `VITE_API_POLL_SECONDS` | Poll interval default |
| `VITE_DEBUG_SCHEMA` | Log failing payload snippet |

---
## 8. Polling & Realtime
- Polling: `usePolling` composable + interval (stop/start functions).
- Realtime: `usePipelineRealtime` stub (can plug Socket.io events).

---
## 9. Filtering / Sorting / Pagination
`usePipelineFilters` takes the full list and returns:
- `paged` (current page slice)
- `page`, `pageSize`
- `sortKey`, `sortOrder`
- `search`

All wired to preferences store so settings persist.

---
## 10. Offline & Import/Export
- Toggle in `Dashboard` (Offline / Go Live buttons).
- Import merges or replaces dataset (persisted in `localStorage` if small enough).
- Export: JSON or CSV via `exporters.ts`.

---
## 11. Trend Logic
Runs are grouped by `pipeline_name` and sorted newest→oldest; each compares `elapsed_seconds` to the next older run (±10% threshold) → `up/down/flat`.

---
## 12. Schema Flexibility (Zod)
Accepts `results` as:
- Array of runs
- Single run object
- Object map `{ id: run }`
Extra keys are passed through (`.passthrough()`). Strings for numeric fields coerced later during normalization.

---
## 13. Error & Fallback Behavior
Network / schema errors:
- If `VITE_STRICT_NO_FALLBACK=true` → throw → UI shows error.
- Else → log warn + use `data.js` + mark source = `fallback`.
Offline mode marks source = `offline`.
Badge in header shows data source.

---
## 14. Testing Basics
Run all: `pnpm test`
Add watch UI: `pnpm test:ui`
Test locations: `src/__tests__/*.test.ts`
Focus areas covered: API parsing, normalization, store fetch logic, polling.

---
## 15. Style System (Tailwind)
Utility classes compose design quickly. Dark mode styles use `dark:` prefix; toggled by `document.documentElement.classList`.

---
## 16. Suggested Progression After First Change
1. Add a computed summary card (e.g., average rows/sec).
2. Show error toast when fallback occurs.
3. Implement an additional status color (e.g., `warning`).
4. Add a date range filter composable.

---
## 17. Common Pitfalls & Fixes
| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| `Property 'X' does not exist` | Type changed but not interface | Update `PipelineRun` or schema |
| Always sample data | Env overriding or network unreachable | Check console logs + `VITE_API_BASE_URL` |
| Dark mode ignored | Pref key mismatch | Clear `localStorage` entry or ensure prefs store logic used |
| Stale data after change | Cache hit | Call `getPipelineInfo(true)` (force) or clear cache module |

---
## 18. Architecture Diagram (Rough)
```
Browser
  │
  ▼
App.vue ── Header / Badge
  │
  ▼
Dashboard.vue
  ├─(fetches)→ pipelines store ─┐
  │                             │
  │ (filters)                   │ emits
  ▼                             │ source events
PipelineTable.vue ← usePipelineFilters ← pipelines store data
  │
  ├─ Charts (async components) ← normalized runs
  └─ Import/Export → exporters

pipelines store → calls → pipelineApi → fetch → Zod parse → normalize → cache
                                            ↑
                                    env flags / fallback
```

---
## 19. Glossary Cheat Sheet
- **Composable**: Reusable reactive function (prefix `use`)
- **Ref**: Reactive value holder
- **Computed**: Derived reactive ref
- **Store (Pinia)**: Central state module
- **Schema (Zod)**: Runtime shape validator
- **Fallback**: Using bundled sample instead of live API

---
## 20. Your First PR Checklist
- [ ] Created a feature branch
- [ ] Ran dev server & verified UI
- [ ] Implemented small change (type + normalization + UI)
- [ ] Added/updated tests if behavior changed
- [ ] `pnpm test` passes
- [ ] No TypeScript errors (`pnpm type-check` optional)
- [ ] Commit message concise (e.g. "feat: add rows/sec column")
- [ ] Open PR; describe change + screenshots if UI

---
Need help or want a follow-up exercise? Ask for a guided lab (I can generate one).
