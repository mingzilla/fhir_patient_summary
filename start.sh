#!/bin/bash
set -e

cd "$(dirname "$0")" || exit 1

PORT=8021

fhir_summary::need_docker() {
  command -v docker >/dev/null 2>&1 || {
    echo "docker is not on PATH" >&2
    exit 1
  }
}

fhir_summary::need_free_port() {
  if curl -s -o /dev/null --max-time 1 "http://127.0.0.1:${PORT}/healthz"; then
    echo "port ${PORT} is already serving. Run ./stop.sh first." >&2
    exit 1
  fi
}

fhir_summary::services() {
  docker compose up -d fhir redis
  echo
  echo "fhir loads Synthea before it answers - /search returns 503 for about three minutes."
  echo "The patient list and the seven panels work already."
  echo
}

fhir_summary::app() {
  echo "open http://localhost:${PORT}"
  echo
  exec uv run uvicorn src.main:app --reload --port "$PORT"
}

fhir_summary::need_docker
fhir_summary::need_free_port
fhir_summary::services
fhir_summary::app
