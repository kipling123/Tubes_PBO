import os

# Gunicorn dijalankan di belakang Nginx (EC2) atau langsung untuk lab lokal.
bind = os.getenv("GUNICORN_BIND", "127.0.0.1:8000")
workers = int(os.getenv("GUNICORN_WORKERS", "3"))
worker_class = "sync"
timeout = int(os.getenv("GUNICORN_TIMEOUT", "60"))
graceful_timeout = 30
keepalive = 5

accesslog = os.getenv("GUNICORN_ACCESS_LOG", "-")
errorlog = os.getenv("GUNICORN_ERROR_LOG", "-")
loglevel = os.getenv("GUNICORN_LOG_LEVEL", "info")

proc_name = "toko-maju-pos"
forwarded_allow_ips = "127.0.0.1"
