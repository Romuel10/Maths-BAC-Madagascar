#!/usr/bin/env bash
set -euo pipefail

required_variables=(
  MATHS_BAC_KEYSTORE_PATH
  MATHS_BAC_KEYSTORE_PASSWORD
  MATHS_BAC_KEY_ALIAS
  MATHS_BAC_KEY_PASSWORD
)

for variable_name in "${required_variables[@]}"; do
  if [[ -z "${!variable_name:-}" ]]; then
    echo "Variable de signature manquante : $variable_name" >&2
    echo "Consulte CAPACITOR_ANDROID.md avant de créer le bundle de publication." >&2
    exit 1
  fi
done

if [[ ! -f "$MATHS_BAC_KEYSTORE_PATH" ]]; then
  echo "Keystore introuvable : $MATHS_BAC_KEYSTORE_PATH" >&2
  exit 1
fi

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"
npm run cap:sync
cd android
bash ./gradlew bundleRelease

echo "Bundle signé créé : android/app/build/outputs/bundle/release/app-release.aab"
