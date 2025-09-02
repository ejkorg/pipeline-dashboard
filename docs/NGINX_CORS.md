# NGINX CORS config for /pipeline-service

If you’re serving the API behind NGINX at a path like `/pipeline-service`, add CORS headers so the dashboard can call it from another origin.

Example minimal config (place inside your `server { ... }` block):

```
# Allow CORS preflight for the API prefix
location /pipeline-service/ {
    proxy_pass http://127.0.0.1:8000/;  # your Uvicorn/FastAPI/Gunicorn upstream

    # CORS: allow browser clients
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
    add_header 'Access-Control-Expose-Headers' 'Content-Length, Content-Range' always;
    add_header 'Access-Control-Allow-Credentials' 'false' always;

    # Handle preflight requests quickly
    if ($request_method = OPTIONS) {
        add_header 'Access-Control-Max-Age' 86400;
        return 204;
    }
}
```

Notes:
- If you need credentials (cookies or Authorization) across origins, set `Access-Control-Allow-Credentials: true` and limit `Access-Control-Allow-Origin` to an exact origin (not `*`).
- Ensure your upstream app does not also set conflicting CORS headers.
- In development, the Vite proxy is already configured to avoid CORS; this config is for production.
