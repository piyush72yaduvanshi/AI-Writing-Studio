#!/bin/sh
set -e

echo "Starting AI Writing Studio backend entrypoint..."

# Wait for PostgreSQL if configured
if [ -n "$POSTGRES_HOST" ] && [ "$POSTGRES_HOST" != "localhost" ]; then
    echo "Waiting for PostgreSQL at $POSTGRES_HOST:${POSTGRES_PORT:-5432}..."
    while ! nc -z "$POSTGRES_HOST" "${POSTGRES_PORT:-5432}"; do
        sleep 1
    done
    echo "PostgreSQL is available!"
fi

# Apply database migrations
echo "Applying database migrations..."
python manage.py migrate --noinput

# Seed default references and demo data
echo "Checking seed data..."
python manage.py seed_data || echo "Seed data skipped or already populated."

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput || echo "Collectstatic skipped."

echo "Starting application server..."
exec "$@"
