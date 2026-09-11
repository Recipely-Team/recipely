#!/usr/bin/env bash
# Runs "Ask Recipely" on an iOS simulator through the Shortcuts app and prints
# what the system showed. See AskRecipelyProbeTests.swift for what it can and
# cannot reach, and docs/os-assistants-plan.md D26 for what it has found.
#
#   scripts/ios-intent-probe/run.sh <simulator-udid> <built .app> <intent-token-file> ["question"]
#
# PROBE_DECLINE=1 answers Siri's "continue in the app" with Cancel instead, to
# check that the queued request is withdrawn.
#
# The .app must be a simulator build SIGNED ad hoc (CODE_SIGN_IDENTITY=-): with
# CODE_SIGNING_ALLOWED=NO the App Group entitlement is not embedded and the
# intent cannot read the token. The token file holds a real intent token from
# POST /assistant/intent-token; it is written into the app's App Group, which
# is what the app itself does after sign-in.
set -euo pipefail

SIM="${1:?simulator udid}"
APP="${2:?path to the built .app}"
TOKEN_FILE="${3:?file holding an intent token}"
QUESTION="${4:-How many calories are in an egg?}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT="$(mktemp -d)"

command -v xcodegen >/dev/null || { echo "xcodegen is required: brew install xcodegen" >&2; exit 1; }

BUNDLE_ID="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$APP/Info.plist")"
GROUP="$(/usr/libexec/PlistBuddy -c 'Print :RecipelyAssistantAppGroup' "$APP/Info.plist")"
LANGUAGE="$(xcrun simctl spawn "$SIM" defaults read -g AppleLanguages 2>/dev/null | tr -d ' ",()\n' | cut -c1-2 || echo en)"

xcrun simctl boot "$SIM" 2>/dev/null || true
xcrun simctl bootstatus "$SIM" -b >/dev/null
xcrun simctl install "$SIM" "$APP"

CONTAINER="$(xcrun simctl get_app_container "$SIM" "$BUNDLE_ID" "$GROUP")"
PREFS="$CONTAINER/Library/Preferences/$GROUP.plist"
mkdir -p "$(dirname "$PREFS")"
# Through cfprefsd, never the file: the simulator's cfprefsd caches the domain,
# so a file edit can be overwritten by its cache and a file read can miss a
# write it has not flushed yet — both happened while this script was written.
prefs() { xcrun simctl spawn "$SIM" defaults "$1" "$PREFS" "${@:2}"; }
prefs delete recipely.assistant.invocationQueue 2>/dev/null || true
prefs write recipely.assistant.token -string "$(tr -d '\n' < "$TOKEN_FILE")"
prefs write recipely.assistant.language -string "${LANGUAGE:-en}"

cp -R "$HERE/." "$OUT/"
(cd "$OUT" && xcodegen generate >/dev/null)
TEST_RUNNER_PROBE_QUESTION="$QUESTION" TEST_RUNNER_PROBE_BUNDLE_ID="$BUNDLE_ID" TEST_RUNNER_PROBE_DECLINE="${PROBE_DECLINE:-0}" \
  xcodebuild test -project "$OUT/IntentProbe.xcodeproj" -scheme IntentProbe \
  -destination "id=$SIM" -resultBundlePath "$OUT/result.xcresult" >"$OUT/test.log" 2>&1 \
  || { echo "probe failed — see $OUT/test.log" >&2; exit 1; }

xcrun xcresulttool export attachments --path "$OUT/result.xcresult" --output-path "$OUT/attachments" >/dev/null
python3 - "$OUT/attachments" <<'PY'
import json, re, sys
root = sys.argv[1]
for test in json.load(open(f"{root}/manifest.json")):
    for a in sorted(test["attachments"], key=lambda a: a["suggestedHumanReadableName"]):
        name = a["suggestedHumanReadableName"].split("_")[0]
        body = open(f"{root}/{a['exportedFileName']}", errors="ignore").read() if not a["exportedFileName"].endswith(".png") else None
        if name in ("summary", "0-tiles"):
            print(f"{name}: {body}")
        elif name.endswith("-tree"):
            texts = re.findall(r"StaticText, [^\n]*?label: '([^']+)'", body)
            print(f"{name[:-5]}: {' | '.join(t for t in texts if not re.match(r'^\d{1,2}:\d{2}$', t))}")
        else:
            print(f"{name}: {root}/{a['exportedFileName']}")
PY
echo "queue afterwards: $(prefs read recipely.assistant.invocationQueue 2>/dev/null | grep -c invocationId || true) request(s)"
echo "full output: $OUT"
