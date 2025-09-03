#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/dist"
STAMP="$(date +%Y%m%d-%H%M%S)"
ARCHIVE="$OUT_DIR/conversation-2025-09-03-$STAMP.zip"

mkdir -p "$OUT_DIR"

# Files to include in the archive
FILES=(
  "docs/conversation-2025-09-03.md"
  "docs/nginx.example.conf"
  "docs/SYSTEMD_UVICORN_SAMPLE.md"
  "vite.config.ts"
  "src/services/pipelineApi.ts"
  "src/composables/usePipelineData.ts"
  "src/composables/usePipelineSummaryData.ts"
  "src/services/fileService.ts"
  "src/components/DetailsModal.vue"
  "README.md"
)

pushd "$ROOT_DIR" >/dev/null

echo "Creating archive: $ARCHIVE"
zip -q -r "$ARCHIVE" "${FILES[@]}"

popd >/dev/null

echo "Archive created: $ARCHIVE"
