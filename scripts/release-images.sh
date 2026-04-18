#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REGISTRY="${REGISTRY:-ghcr.io/rogermello25/evocrm}"
TAG="${2:-latest}"
SERVICE="${1:-}"

if [[ -z "$SERVICE" ]]; then
  echo "usage: scripts/release-images.sh <gateway|auth|crm|frontend|processor|core|bot-runtime> [tag]" >&2
  exit 1
fi

case "$SERVICE" in
  gateway)
    IMAGE="evo-gateway-fixed"
    CONTEXT="$ROOT_DIR/nginx"
    DOCKERFILE="$ROOT_DIR/nginx/Dockerfile"
    ;;
  auth)
    IMAGE="evo-auth-fixed"
    CONTEXT="$ROOT_DIR/evo-auth-service-community"
    DOCKERFILE="$ROOT_DIR/evo-auth-service-community/Dockerfile"
    ;;
  crm)
    IMAGE="evo-crm-fixed"
    CONTEXT="$ROOT_DIR/evo-ai-crm-community"
    DOCKERFILE="$ROOT_DIR/evo-ai-crm-community/docker/Dockerfile"
    ;;
  frontend)
    IMAGE="evo-frontend-fixed"
    CONTEXT="$ROOT_DIR/evo-ai-frontend-community"
    DOCKERFILE="$ROOT_DIR/evo-ai-frontend-community/Dockerfile"
    ;;
  processor)
    IMAGE="evo-processor-fixed"
    CONTEXT="$ROOT_DIR/evo-ai-processor-community"
    DOCKERFILE="$ROOT_DIR/evo-ai-processor-community/Dockerfile"
    ;;
  core)
    IMAGE="evo-core-fixed"
    CONTEXT="$ROOT_DIR/evo-ai-core-service-community"
    DOCKERFILE="$ROOT_DIR/evo-ai-core-service-community/Dockerfile"
    ;;
  bot-runtime)
    IMAGE="evo-bot-runtime-fixed"
    CONTEXT="$ROOT_DIR/evo-bot-runtime"
    DOCKERFILE="$ROOT_DIR/evo-bot-runtime/Dockerfile"
    ;;
  *)
    echo "unknown service: $SERVICE" >&2
    exit 1
    ;;
esac

FULL_IMAGE="$REGISTRY/$IMAGE"

echo "Building $FULL_IMAGE:$TAG"
docker build -f "$DOCKERFILE" -t "$FULL_IMAGE:$TAG" -t "$FULL_IMAGE:latest" "$CONTEXT"

echo "Pushing $FULL_IMAGE:$TAG"
docker push "$FULL_IMAGE:$TAG"

if [[ "$TAG" != "latest" ]]; then
  echo "Pushing $FULL_IMAGE:latest"
  docker push "$FULL_IMAGE:latest"
fi

echo "Done: $FULL_IMAGE:$TAG"
