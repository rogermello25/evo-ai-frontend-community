#!/usr/bin/env bash
set -euo pipefail

REGISTRY="${REGISTRY:-ghcr.io/rogermello25/evocrm}"
TARGET="${1:-}"
TAG="${2:-latest}"

if [[ -z "$TARGET" ]]; then
  echo "usage: scripts/deploy-swarm.sh <gateway|frontend|crm|auth|processor|core|bot-runtime> [tag]" >&2
  exit 1
fi

update_service() {
  local service_name="$1"
  local image_name="$2"
  echo "Updating $service_name -> $REGISTRY/$image_name:$TAG"
  docker service update --image "$REGISTRY/$image_name:$TAG" --force "$service_name"
}

case "$TARGET" in
  gateway)
    update_service "evocrm_evocrm_gateway" "evo-gateway-fixed"
    ;;
  frontend)
    update_service "evocrm_evocrm_frontend" "evo-frontend-fixed"
    ;;
  crm)
    update_service "evocrm_evocrm_crm" "evo-crm-fixed"
    update_service "evocrm_evocrm_crm_sidekiq" "evo-crm-fixed"
    ;;
  auth)
    update_service "evocrm_evocrm_auth" "evo-auth-fixed"
    update_service "evocrm_evocrm_auth_sidekiq" "evo-auth-fixed"
    ;;
  processor)
    update_service "evocrm_evocrm_processor" "evo-processor-fixed"
    ;;
  core)
    update_service "evocrm_evocrm_core" "evo-core-fixed"
    ;;
  bot-runtime)
    update_service "evocrm_evocrm_bot_runtime" "evo-bot-runtime-fixed"
    ;;
  *)
    echo "unknown target: $TARGET" >&2
    exit 1
    ;;
esac

echo "Waiting for service state..."
docker service ls --format '{{.Name}} {{.Replicas}}' | grep 'evocrm_'
