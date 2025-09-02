# NGINX CORS config for /pipeline-service

If you’re serving the API behind NGINX at a path like `/pipeline-service`, you can add CORS headers so the dashboard can call it from another origin. Important: choose a single place to handle CORS (either NGINX or the backend middleware), not both. Duplicate headers cause confusion and can be rejected by browsers.

Common scenarios
- No authorization: simplest. You do NOT need credentials. Allow common headers like `Content-Type` only, and specify your allowed origin(s).
- Cookies / session auth: you MUST use exact origins (no `*`) and set `Access-Control-Allow-Credentials: true`. Avoid wildcard origins with credentials.

Production + dev origins (no credentials, no authorization)
This example allows the production dashboard at `http://usaz15ls088:8080` and optionally a dev server like `http://localhost:5173`. If you don’t need dev, omit it.

```
map $http_origin $cors_allow_origin {
    default "";
    "http://usaz15ls088:8080" $http_origin;    # prod dashboard origin (no path)
    "http://localhost:5173"    $http_origin;    # dev Vite origin (optional)
}

location /pipeline-service/ {
    proxy_pass http://127.0.0.1:8000/;  # your Uvicorn/FastAPI/Gunicorn upstream

    # CORS: allow specific origins, no credentials
    if ($cors_allow_origin != "") { add_header Access-Control-Allow-Origin $cors_allow_origin always; }
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type" always;
    add_header Access-Control-Expose-Headers "Content-Length, Content-Range" always;
    add_header Vary Origin always;

    # Optional: enforce no-cache for API responses
    # add_header Cache-Control "no-store, no-cache, must-revalidate, max-age=0" always;
    # add_header Pragma "no-cache" always;

    # Preflight
    if ($request_method = OPTIONS) {
        add_header Access-Control-Max-Age 86400;
        add_header Content-Length 0;
        return 204;
    }
}
```

Credentials scenario (if you later add cookies/session auth)
If you use cookies, enable credentials and enumerate exact origins. Do not use `*` with credentials.

```
map $http_origin $cors_allow_origin {
    default "";
    "https://your-dashboard.example.com" $http_origin;
    # add staging/dev as needed
}

location /pipeline-service/ {
    proxy_pass http://127.0.0.1:8000/;
    if ($cors_allow_origin != "") { add_header Access-Control-Allow-Origin $cors_allow_origin always; }
    add_header Access-Control-Allow-Credentials true always;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type" always;
    add_header Access-Control-Expose-Headers "Content-Length, Content-Range" always;
    add_header Vary Origin always;
    if ($request_method = OPTIONS) { add_header Access-Control-Max-Age 86400; add_header Content-Length 0; return 204; }
}
```

Backend vs NGINX
- Backend handles CORS: remove the NGINX CORS headers (or avoid adding them) to prevent duplicates.
- NGINX handles CORS: remove any backend CORS middleware (e.g., FastAPI CORSMiddleware) or ensure the backend doesn’t emit CORS headers.

Development note
- In development, the Vite dev server is usually proxied to avoid CORS altogether. These configs are primarily for production deployments.

Full example config
- See `docs/nginx.example.conf` for a complete no-authorization, same-origin configuration serving the SPA and proxying the API without emitting CORS headers.
