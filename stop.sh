#!/bin/bash
set -e

cd "$(dirname "$0")" || exit 1

fhir_summary::need_docker() {
  command -v docker >/dev/null 2>&1 || {
    echo "docker is not on PATH" >&2
    exit 1
  }
}

fhir_summary::app() {
  if pkill -f "uvicorn src.main:app" 2>/dev/null; then
    echo "stopped the app"
  else
    echo "the app was not running"
  fi
}

fhir_summary::services() {
  docker compose stop fhir redis
}

fhir_summary::need_docker
fhir_summary::app
fhir_summary::services
