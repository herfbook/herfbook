#!/bin/bash
set -e

echo "Waiting for database..."
until pg_isready -h "${POSTGRES_HOST:-herfbook-db}" -p "${POSTGRES_PORT:-5432}" -U "${POSTGRES_USER:-herfbook}" 2>/dev/null; do
  sleep 1
done

echo "Running database migrations..."
alembic upgrade head

echo "Starting application..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 "$@"
