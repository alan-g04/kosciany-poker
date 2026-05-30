#!/bin/sh
# Substitute the runtime VITE_WS_URL into the built bundle before nginx serves.
# The bundle was built with the literal placeholder `__VITE_WS_URL__` baked in
# (see Dockerfile). nginx:alpine's docker-entrypoint runs every executable in
# /docker-entrypoint.d/ at container start, so this fires once per cold start.
set -eu

WS_URL="${VITE_WS_URL:-ws://localhost:8000/ws}"
ROOT="/usr/share/nginx/html"

echo "[entrypoint] substituting __VITE_WS_URL__ -> ${WS_URL}"
# Use | as the sed delimiter so we don't have to escape slashes in URLs.
find "${ROOT}" -type f \( -name '*.js' -o -name '*.html' -o -name '*.css' \) \
  -exec sed -i "s|__VITE_WS_URL__|${WS_URL}|g" {} +
