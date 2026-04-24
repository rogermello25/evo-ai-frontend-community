#!/bin/sh
set -e

cat > /usr/share/nginx/html/config.js <<EOF
window.__CONFIG__ = {
  apiUrl: "${VITE_API_URL:-}",
  authApiUrl: "${VITE_AUTH_API_URL:-}",
  wsUrl: "${VITE_WS_URL:-}",
  evoAiApiUrl: "${VITE_EVOAI_API_URL:-}",
  agentProcessorUrl: "${VITE_AGENT_PROCESSOR_URL:-}",
  evolutionApiUrl: "${VITE_EVOLUTION_API_URL:-}"
};
EOF

exec "$@"
