#!/usr/bin/env bash
# Usage:
#   ./ralph.sh <iterations> [project_dir] [prompt_file]
#
# Examples:
#   ./ralph.sh 10
#   ./ralph.sh 20 ~/my-project ./prompt.md

set -euo pipefail

if [ "${1:-}" = "" ]; then
  echo "Usage: $0 <iterations> [project_dir] [prompt_file]"
  exit 1
fi

ITERATIONS="$1"
PROJECT_DIR="${2:-$PWD}"
PROMPT_FILE="${3:-prompt.md}"

if ! [[ "$ITERATIONS" =~ ^[0-9]+$ ]] || [ "$ITERATIONS" -lt 1 ]; then
  echo "Error: iterations must be a positive integer."
  exit 1
fi

if [ ! -f "$PROMPT_FILE" ]; then
  echo "Error: prompt file not found: $PROMPT_FILE"
  exit 1
fi

HARNESS_PROMPT="$(cat "$PROMPT_FILE")"

for ((i = 1; i <= ITERATIONS; i++)); do
  echo "=== Iteration $i/$ITERATIONS ==="

  result="$(
    docker sandbox run codex "$PROJECT_DIR" -p "$HARNESS_PROMPT"
  )"

  echo "$result"

  if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    echo "PRD complete, exiting."
    exit 0
  fi
done

echo "Reached iteration limit ($ITERATIONS) without COMPLETE signal."
