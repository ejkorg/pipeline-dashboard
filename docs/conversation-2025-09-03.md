# Pipeline Dashboard – Conversation Transcript (2025-09-03)

This document summarizes the key decisions, configurations, and commands exchanged during the integration and deployment troubleshooting for the pipeline dashboard and FastAPI backend.

## Highlights
- Backend FastAPI is mounted at `/pipeline-service` and serves endpoints `/get_pipeline_info`, `/health`, `/pipelines`.
- Uvicorn listens on `127.0.0.1:8001` (loopback) and is fronted by NGINX on port `8080`.
- NGINX proxy preserves the `/pipeline-service` prefix (no trailing slash in `proxy_pass`).
- Frontend dev proxy can preserve the prefix via `VITE_DEV_PROXY_STRIP_PREFIX=false`.
- Archive preview limit is user-configurable in the dashboard (Preferences store), and file previews/downloads go through `/pipeline-service`.

## Backend Verification
```bash
# On the server
curl -sS "http://127.0.0.1:8001/docs" | head -20
curl -sS "http://127.0.0.1:8001/openapi.json" | python3 -m json.tool | head -80
curl -sS "http://127.0.0.1:8001/pipeline-service/openapi.json" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('\n'.join(sorted(d.get('paths',{}).keys())))"
# -> /get_pipeline_info, /health, /pipelines
```

## Working API URLs
```bash
# Direct (loopback, for server-side checks)
curl -sS "http://127.0.0.1:8001/pipeline-service/health" | python3 -m json.tool
curl -sS "http://127.0.0.1:8001/pipeline-service/get_pipeline_info?limit=1" | python3 -m json.tool

# Via NGINX (recommended for external clients)
curl -sS "http://usaz15ls088:8080/pipeline-service/health" | python3 -m json.tool
curl -sS "http://usaz15ls088:8080/pipeline-service/get_pipeline_info?limit=1" | python3 -m json.tool
```

## NGINX Config (prefix preserved)
```nginx
upstream pipeline-service { server 127.0.0.1:8001; keepalive 64; }

server {
  listen 8080;
  # ... SPA locations ...

  location /pipeline-service/ {
    proxy_pass http://pipeline-service;  # no trailing slash -> preserves prefix
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Prefix /pipeline-service;
  }

  location = /docs { return 301 /pipeline-service/docs; }
  location ^~ /docs/ { return 301 /pipeline-service$uri$is_args$args; }
  location = /openapi.json { return 301 /pipeline-service/openapi.json; }
}
```

## Uvicorn Runner (behind NGINX)
```bash
# Inside run.sh start_app(), after RELOAD handling
UVICORN_ARGS+=(--proxy-headers)
UVICORN_ARGS+=(--forwarded-allow-ips 127.0.0.1)
# Do NOT add --root-path because the app is mounted at /pipeline-service in code.
```

## Frontend Dev Proxy
```bash
# .env.local
VITE_DEV_PROXY_TARGET=http://127.0.0.1:8001
VITE_DEV_PROXY_STRIP_PREFIX=false

# Start dev
pnpm dev
```

## Dashboard Source URL Display
The Dashboard UI shows the computed source, e.g.
```
Source: /pipeline-service/get_pipeline_info?limit=10000&offset=0&all_data=true
```
When `VITE_API_BASE_URL` is an absolute URL (e.g., `http://usaz15ls088:8080/pipeline-service`), the UI will reflect that.

## Troubleshooting
- If the browser cannot reach `:8001`, use the NGINX URL on `:8080` or an SSH tunnel.
- If file preview/download fails, ensure the file paths are served under `/pipeline-service` with HEAD/GET in the backend.

```
ssh -N -L 8001:127.0.0.1:8001 user@usaz15ls088
open http://localhost:8001/pipeline-service/health
```

---
Generated for 2025-09-03 session.
