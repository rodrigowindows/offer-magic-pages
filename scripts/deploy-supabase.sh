#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SUPABASE_DIR="$PROJECT_ROOT/supabase"
FUNCTIONS_DIR="$SUPABASE_DIR/functions"
CONFIG_FILE="$SUPABASE_DIR/config.toml"

PROJECT_REF="${SUPABASE_PROJECT_REF:-}"
DB_PASSWORD="${SUPABASE_DB_PASSWORD:-}"
WITH_MIGRATIONS=false

usage() {
  cat <<EOF
Usage: scripts/deploy-supabase.sh [options]

Options:
  --project-ref <ref>      Supabase project ref (default: SUPABASE_PROJECT_REF or supabase/config.toml)
  --db-password <value>    Database password used when --with-migrations is enabled
  --with-migrations        Run 'supabase db push --include-all' before deploying functions
  --help                   Show this help message
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-ref)
      if [[ $# -lt 2 ]]; then
        echo "Error: --project-ref requires a value" >&2
        exit 1
      fi
      PROJECT_REF="$2"
      shift 2
      ;;
    --db-password)
      if [[ $# -lt 2 ]]; then
        echo "Error: --db-password requires a value" >&2
        exit 1
      fi
      DB_PASSWORD="$2"
      shift 2
      ;;
    --with-migrations)
      WITH_MIGRATIONS=true
      shift
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      echo "Error: unknown option '$1'" >&2
      usage
      exit 1
      ;;
  esac
done

if ! command -v supabase >/dev/null 2>&1; then
  echo "Error: Supabase CLI not found. Install with: npm install -g supabase" >&2
  exit 1
fi

if [[ -z "$PROJECT_REF" && -f "$CONFIG_FILE" ]]; then
  PROJECT_REF="$(awk -F'\"' '/^project_id[[:space:]]*=/ {print $2; exit}' "$CONFIG_FILE")"
fi

if [[ -z "$PROJECT_REF" ]]; then
  echo "Error: project ref not found. Use --project-ref, SUPABASE_PROJECT_REF, or set project_id in supabase/config.toml." >&2
  exit 1
fi

if [[ ! -d "$FUNCTIONS_DIR" ]]; then
  echo "Error: functions directory not found at $FUNCTIONS_DIR" >&2
  exit 1
fi

echo "Project ref: $PROJECT_REF"

if [[ "$WITH_MIGRATIONS" == true ]]; then
  if [[ -z "$DB_PASSWORD" ]]; then
    echo "Error: --with-migrations requires SUPABASE_DB_PASSWORD or --db-password." >&2
    exit 1
  fi

  echo "Applying migrations (supabase db push --include-all)..."
  supabase db push --project-ref "$PROJECT_REF" --password "$DB_PASSWORD" --include-all
fi

shopt -s nullglob
DEPLOYED_COUNT=0

for fn_dir in "$FUNCTIONS_DIR"/*/; do
  fn_name="$(basename "$fn_dir")"

  if [[ "$fn_name" == "_shared" ]]; then
    continue
  fi

  if [[ ! -f "$fn_dir/index.ts" && ! -f "$fn_dir/index.js" ]]; then
    echo "Skipping $fn_name (missing index.ts/index.js)"
    continue
  fi

  echo "Deploying function: $fn_name"
  supabase functions deploy "$fn_name" --project-ref "$PROJECT_REF"
  DEPLOYED_COUNT=$((DEPLOYED_COUNT + 1))
done

if [[ "$DEPLOYED_COUNT" -eq 0 ]]; then
  echo "Error: no deployable functions found in $FUNCTIONS_DIR" >&2
  exit 1
fi

echo "Deployment complete. Functions deployed: $DEPLOYED_COUNT"
