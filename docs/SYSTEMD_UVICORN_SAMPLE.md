# systemd unit for uvicorn (loopback only)

Use this if you want uvicorn/FastAPI to bind to 127.0.0.1 and be fronted by NGINX.

Create `/etc/systemd/system/pipeline-service.service` with:

```
[Unit]
Description=Pipeline FastAPI service (uvicorn)
After=network.target

[Service]
WorkingDirectory=/opt/pipeline-service
ExecStart=/usr/bin/uvicorn app:app --host 127.0.0.1 --port 8001 --proxy-headers
User=pipeline
Group=pipeline
Restart=always
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
```

Adjust `WorkingDirectory`, `User`, `ExecStart` path and module `app:app` to your project.

Then:

```
sudo systemctl daemon-reload
sudo systemctl enable --now pipeline-service
sudo systemctl status pipeline-service
```

With NGINX from `docs/nginx.example.conf`, you can reach:

```
http://<host>:8080/pipeline-service/health
http://<host>:8080/pipeline-service/get_pipeline_info?limit=1
```