#!/usr/bin/env bash
# Runs the Spotlight identifier checks (see scripts/verify-swift-spotlight.swift).
#
# Skips rather than fails where Swift cannot run, so the same command is safe in
# a Linux CI job; REQUIRE_SWIFT=1 on the macOS runner turns the skip into a
# failure, because there a skip would be a silent pass.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE="$ROOT/modules/recipely-assistant-kit/ios/RecipelySpotlightIndex.swift"
HARNESS="$ROOT/scripts/verify-swift-spotlight.swift"

if ! command -v swiftc >/dev/null 2>&1; then
  if [ "${REQUIRE_SWIFT:-0}" = "1" ]; then
    echo "spotlight identifiers (Swift): FAILED — swiftc is required here and missing" >&2
    exit 1
  fi
  echo "spotlight identifiers (Swift): skipped — swiftc not on this machine"
  exit 0
fi

for file in "$SOURCE" "$HARNESS"; do
  if [ ! -f "$file" ]; then
    echo "spotlight identifiers (Swift): FAILED — missing $file" >&2
    exit 1
  fi
done

BIN="$(mktemp -d)/verify-spotlight"
swiftc -O -o "$BIN" "$SOURCE" "$HARNESS"
"$BIN"
