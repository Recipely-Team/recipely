#!/usr/bin/env bash
# Runs the Swift third of the envelope parity suite (see
# scripts/verify-swift-envelope.swift for why it is a script and not XCTest).
#
# Skips rather than fails where Swift cannot run, so the same command is safe in
# a Linux CI job: the iOS half is verified on the macOS runner that builds it.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE="$ROOT/modules/recipely-assistant-kit/ios/Envelope.swift"
WIRE="$ROOT/modules/recipely-assistant-kit/ios/RecipelyAssistantWire.swift"
HARNESS="$ROOT/scripts/verify-swift-envelope.swift"
FIXTURE="$ROOT/modules/recipely-assistant-kit/__fixtures__/aes-gcm-vectors.json"

if ! command -v swiftc >/dev/null 2>&1; then
  echo "envelope parity (Swift): skipped — swiftc not on this machine"
  exit 0
fi

for file in "$SOURCE" "$WIRE" "$HARNESS" "$FIXTURE"; do
  if [ ! -f "$file" ]; then
    echo "envelope parity (Swift): FAILED — missing $file" >&2
    exit 1
  fi
done

BIN="$(mktemp -d)/verify-envelope"
# -O so the harness runs the same optimisation the app ships with; a cipher that
# only agrees in debug has told you nothing about the build users get.
swiftc -O -o "$BIN" "$SOURCE" "$WIRE" "$HARNESS"

echo "envelope parity (Swift · CryptoKit):"
"$BIN" "$FIXTURE"
