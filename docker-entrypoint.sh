#!/bin/sh
set -e

echo "Running database migrations..."
# Use --force to skip confirmation prompt and auto-approve changes
npx drizzle-kit push --force || {
    echo "Warning: Database migration failed. This might be expected if the database is not yet available."
    echo "The application will attempt to continue, but may fail if the database schema is not up to date."
}

echo "Starting application..."
exec node build