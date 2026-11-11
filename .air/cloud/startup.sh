#!/usr/bin/env bash
# Air cloud startup script for pizza-world.
# Installs JDK 21 (Gradle toolchain) + frontend deps, primes Gradle/npm caches,
# then starts the Spring Boot backend (:8080) and Vite dev server (:3000) in the background.
set -euo pipefail

if [ "${AIR_STARTUP_MODE:-}" = warmup ]; then WARMUP=1; else WARMUP=; fi

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG_DIR=/tmp/pizza-world
mkdir -p "$LOG_DIR" "$HOME/.air"
cd "$REPO_DIR"

log() { echo "[startup] $(date +%H:%M:%S) $*"; }

# --- JDK 21 (build.gradle.kts pins a Java 21 toolchain) ---------------------
if [ ! -x /usr/lib/jvm/java-21-openjdk-amd64/bin/javac ]; then
  log "installing openjdk-21-jdk-headless"
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq openjdk-21-jdk-headless
  log "JDK 21 installed"
fi

# --- Gradle: route JVM traffic through the egress proxy ---------------------
mkdir -p "$HOME/.gradle"
proxy="${HTTPS_PROXY:-${https_proxy:-${HTTP_PROXY:-${http_proxy:-}}}}"
if [ -n "$proxy" ]; then
  hostport="${proxy#*://}"; hostport="${hostport##*@}"; hostport="${hostport%%/*}"
  phost="${hostport%:*}"; pport="${hostport##*:}"
  cat > "$HOME/.gradle/gradle.properties" <<EOF
systemProp.http.proxyHost=$phost
systemProp.http.proxyPort=$pport
systemProp.https.proxyHost=$phost
systemProp.https.proxyPort=$pport
systemProp.http.nonProxyHosts=localhost|127.0.0.1
systemProp.https.nonProxyHosts=localhost|127.0.0.1
EOF
  log "Gradle proxy configured ($phost:$pport)"
fi

# --- Backend: download Gradle + dependencies, compile ----------------------
chmod +x gradlew
log "gradle: compiling backend (downloads Gradle/deps on first run)"
./gradlew --no-daemon -q classes testClasses
log "gradle: done"

# --- Frontend: dependencies ------------------------------------------------
log "npm ci (frontend)"
(cd frontend && npm ci --no-audit --no-fund)
log "npm ci done"

# Vercel CLI is used by the AGENTS.md workflow to deploy previews.
# Installed into ~/.local (the nvm-managed global prefix is not user-writable).
if [ ! -x "$HOME/.local/bin/vercel" ]; then
  log "installing vercel CLI into ~/.local"
  npm install -g --prefix "$HOME/.local" vercel --no-audit --no-fund
  log "vercel CLI installed"
fi
ENV_FILE="$HOME/.air/pizza-world-env.sh"
echo 'case ":$PATH:" in *":$HOME/.local/bin:"*) ;; *) export PATH="$HOME/.local/bin:$PATH" ;; esac' > "$ENV_FILE"
SOURCE_LINE="[ -f \"$ENV_FILE\" ] && . \"$ENV_FILE\" # pizza-world-air-env"
profile="$HOME/.profile"
for f in "$HOME/.bash_profile" "$HOME/.bash_login" "$HOME/.profile"; do
  if [ -f "$f" ]; then profile="$f"; break; fi
done
for f in "$profile" "$HOME/.bashrc"; do
  grep -qF 'pizza-world-air-env' "$f" 2>/dev/null || echo "$SOURCE_LINE" >> "$f"
done

# Vite wrapper config: listen on 0.0.0.0 and accept the preview proxy's Host header
# without changing the committed frontend/vite.config.ts.
cat > "$HOME/.air/vite.config.mjs" <<EOF
import base from "$REPO_DIR/frontend/vite.config.ts";
export default { ...base, server: { ...base.server, host: "0.0.0.0", allowedHosts: true } };
EOF

# --- Start runtime servers in the background --------------------------------
if ! curl -sf -o /dev/null http://localhost:8080/api/pizzas; then
  log "starting backend: ./gradlew bootRun (log: $LOG_DIR/backend.log)"
  nohup ./gradlew bootRun >"$LOG_DIR/backend.log" 2>&1 &
fi
if ! curl -sf -o /dev/null http://localhost:3000/; then
  log "starting frontend: vite dev on :3000 (log: $LOG_DIR/frontend.log)"
  (cd frontend && nohup npx vite --config "$HOME/.air/vite.config.mjs" >"$LOG_DIR/frontend.log" 2>&1 &)
fi

healthcheck() {
  log "healthcheck: backend tests (./gradlew test)"
  ./gradlew --no-daemon test
  log "healthcheck: frontend lint/build/test"
  (cd frontend && npm run lint && npm run build && npm test)

  log "healthcheck: waiting for backend on :8080 and frontend on :3000"
  local n=0
  until curl -sf http://localhost:8080/api/pizzas | grep -q '"name"'; do
    if ! pgrep -f 'gradlew bootRun|GradleWrapperMain bootRun|PizzaWorldApplication' >/dev/null; then
      log "backend process is not running; last log lines:"; tail -n 40 "$LOG_DIR/backend.log"; return 1
    fi
    n=$((n + 1)); [ $((n % 10)) -eq 0 ] && log "still waiting for backend... ($(tail -n 1 "$LOG_DIR/backend.log"))"
    sleep 2
  done
  log "backend OK: /api/pizzas returns pizzas"
  # Probe the way the preview proxy arrives: a foreign Host header, /api proxied to the backend.
  until curl -sf -H 'Host: preview.example.com' http://localhost:3000/ | grep -q 'id="root"' \
     && curl -sf -H 'Host: preview.example.com' http://localhost:3000/api/pizzas | grep -q '"name"'; do
    if ! pgrep -f 'vite --config' >/dev/null; then
      log "frontend process is not running; last log lines:"; tail -n 40 "$LOG_DIR/frontend.log"; return 1
    fi
    n=$((n + 1)); [ $((n % 10)) -eq 0 ] && log "still waiting for frontend... ($(tail -n 1 "$LOG_DIR/frontend.log"))"
    sleep 2
  done
  log "frontend OK: index.html served and /api proxied to backend"
}

if [ -n "$WARMUP" ]; then healthcheck; fi
log "startup complete"
