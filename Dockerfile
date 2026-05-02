# Docker-in-Docker: runs the full docker-compose stack as a single Railway service.
# Base image ships the Docker daemon + CLI; we add Compose v2 and supervisord on top.
FROM docker:27-dind

# ── System dependencies ────────────────────────────────────────────────────────
RUN apk add --no-cache \
    docker-compose \
    supervisor \
    bash \
    curl

# ── Copy project ───────────────────────────────────────────────────────────────
WORKDIR /app
COPY . .

# ── supervisord config ─────────────────────────────────────────────────────────
# Program 1 – Docker daemon (dockerd)
# Program 2 – startup script that waits for dockerd then runs docker-compose up
COPY supervisord.conf /etc/supervisord.conf

# ── Startup script ─────────────────────────────────────────────────────────────
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Expose frontend (80) and backend API (3000)
EXPOSE 80 3000

# supervisord manages both dockerd and the compose launcher
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
