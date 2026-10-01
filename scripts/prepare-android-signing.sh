#!/usr/bin/env bash
set -euo pipefail

required=(
  KEYSTORE_BASE64
  KEYSTORE_PASSWORD
  KEY_ALIAS
  KEY_PASSWORD
  RUNNER_TEMP
  GITHUB_ENV
)

for name in "${required[@]}"; do
  if [[ -z "${!name:-}" ]]; then
    echo "Configuration de signature manquante : $name" >&2
    exit 1
  fi
done

export LC_ALL=C
keystore_path="$RUNNER_TEMP/maths-bac-release.jks"
printf '%s' "$KEYSTORE_BASE64" | base64 --decode > "$keystore_path"
chmod 600 "$keystore_path"

if ! keytool -list -keystore "$keystore_path" -storepass "$KEYSTORE_PASSWORD" >/dev/null 2>&1; then
  echo "Le keystore de publication est illisible avec le mot de passe configuré." >&2
  exit 1
fi

validate_private_key() {
  local alias_name="$1"
  local key_password="$2"
  local probe="$RUNNER_TEMP/maths-bac-signing-probe.p12"
  rm -f "$probe"
  if keytool -importkeystore       -srckeystore "$keystore_path"       -srcstorepass "$KEYSTORE_PASSWORD"       -srcalias "$alias_name"       -srckeypass "$key_password"       -destkeystore "$probe"       -deststoretype PKCS12       -deststorepass "maths-bac-ci-probe-2026"       -destkeypass "maths-bac-ci-probe-2026"       -noprompt >/dev/null 2>&1; then
    rm -f "$probe"
    return 0
  fi
  rm -f "$probe"
  return 1
}

selected_alias="$KEY_ALIAS"
selected_password="$KEY_PASSWORD"
store_type="$(
  keytool -list -v -keystore "$keystore_path" -storepass "$KEYSTORE_PASSWORD" 2>/dev/null |
    awk -F': ' '/^Keystore type: / { print toupper($2); exit }'
)"

if [[ "$store_type" == "PKCS12" ]] && validate_private_key "$selected_alias" "$KEYSTORE_PASSWORD"; then
  selected_password="$KEYSTORE_PASSWORD"
  echo "Keystore PKCS12 détecté ; utilisation du mot de passe du magasin pour la clé privée."
elif validate_private_key "$selected_alias" "$selected_password"; then
  echo "Clé privée de publication vérifiée."
elif [[ "$KEY_PASSWORD" != "$KEYSTORE_PASSWORD" ]] && validate_private_key "$selected_alias" "$KEYSTORE_PASSWORD"; then
  selected_password="$KEYSTORE_PASSWORD"
  echo "La clé privée utilise le même mot de passe que le keystore ; configuration automatique appliquée."
else
  mapfile -t private_aliases < <(
    keytool -list -v -keystore "$keystore_path" -storepass "$KEYSTORE_PASSWORD" 2>/dev/null |
      awk '
        /^Alias name: / { alias_name=substr($0, 13) }
        /^Entry type: PrivateKeyEntry/ && alias_name != "" { print alias_name }
      '
  )

  if [[ "${#private_aliases[@]}" -eq 1 ]]; then
    candidate_alias="${private_aliases[0]}"
    if validate_private_key "$candidate_alias" "$KEY_PASSWORD"; then
      selected_alias="$candidate_alias"
      selected_password="$KEY_PASSWORD"
      echo "Alias privé unique détecté et vérifié automatiquement."
    elif [[ "$KEY_PASSWORD" != "$KEYSTORE_PASSWORD" ]] && validate_private_key "$candidate_alias" "$KEYSTORE_PASSWORD"; then
      selected_alias="$candidate_alias"
      selected_password="$KEYSTORE_PASSWORD"
      echo "Alias privé unique détecté ; la clé utilise le mot de passe du keystore."
    else
      echo "Le keystore est valide, mais le mot de passe de la clé privée est incorrect." >&2
      echo "Mets à jour le secret MATHS_BAC_KEY_PASSWORD avec le mot de passe réel de la clé." >&2
      exit 1
    fi
  else
    echo "L’alias configuré ne donne pas accès à une clé privée et le keystore ne contient pas exactement une clé privée détectable." >&2
    echo "Vérifie le secret MATHS_BAC_KEY_ALIAS et MATHS_BAC_KEY_PASSWORD." >&2
    exit 1
  fi
fi

echo "::add-mask::$selected_alias"
echo "::add-mask::$selected_password"

{
  echo "MATHS_BAC_KEYSTORE_PATH=$keystore_path"
  echo "MATHS_BAC_KEYSTORE_PASSWORD=$KEYSTORE_PASSWORD"
  echo "MATHS_BAC_KEY_ALIAS=$selected_alias"
  echo "MATHS_BAC_KEY_PASSWORD=$selected_password"
} >> "$GITHUB_ENV"
