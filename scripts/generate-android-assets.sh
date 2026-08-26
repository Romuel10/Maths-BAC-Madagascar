#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MASTER_ICON="$PROJECT_DIR/public/icon-android-master.png"
RES_DIR="$PROJECT_DIR/android/app/src/main/res"

if command -v magick >/dev/null 2>&1; then
  IMAGE_TOOL=(magick)
elif command -v convert >/dev/null 2>&1; then
  IMAGE_TOOL=(convert)
else
  echo "ImageMagick est requis : pkg install imagemagick" >&2
  exit 1
fi

if [[ ! -f "$MASTER_ICON" ]]; then
  echo "Icône maître introuvable : $MASTER_ICON" >&2
  exit 1
fi

create_launcher_icons() {
  local density="$1"
  local legacy_size="$2"
  local foreground_size="$3"
  local output_dir="$RES_DIR/mipmap-$density"

  "${IMAGE_TOOL[@]}" "$MASTER_ICON" -resize "${legacy_size}x${legacy_size}!" "$output_dir/ic_launcher.png"
  "${IMAGE_TOOL[@]}" "$MASTER_ICON" -resize "${legacy_size}x${legacy_size}!" "$output_dir/ic_launcher_round.png"
  "${IMAGE_TOOL[@]}" "$MASTER_ICON" -resize "${foreground_size}x${foreground_size}!" "$output_dir/ic_launcher_foreground.png"
}

create_splash() {
  local width="$1"
  local height="$2"
  local output="$3"
  local shortest_side="$width"
  if (( height < width )); then shortest_side="$height"; fi
  local icon_size=$(( shortest_side * 42 / 100 ))

  "${IMAGE_TOOL[@]}" -size "${width}x${height}" 'xc:#080B12' \
    \( "$MASTER_ICON" -resize "${icon_size}x${icon_size}!" \) \
    -gravity center -composite -depth 8 "$output"
}

create_launcher_icons mdpi 48 108
create_launcher_icons hdpi 72 162
create_launcher_icons xhdpi 96 216
create_launcher_icons xxhdpi 144 324
create_launcher_icons xxxhdpi 192 432

create_splash 480 320 "$RES_DIR/drawable/splash.png"
create_splash 480 320 "$RES_DIR/drawable-land-mdpi/splash.png"
create_splash 800 480 "$RES_DIR/drawable-land-hdpi/splash.png"
create_splash 1280 720 "$RES_DIR/drawable-land-xhdpi/splash.png"
create_splash 1600 960 "$RES_DIR/drawable-land-xxhdpi/splash.png"
create_splash 1920 1280 "$RES_DIR/drawable-land-xxxhdpi/splash.png"
create_splash 320 480 "$RES_DIR/drawable-port-mdpi/splash.png"
create_splash 480 800 "$RES_DIR/drawable-port-hdpi/splash.png"
create_splash 720 1280 "$RES_DIR/drawable-port-xhdpi/splash.png"
create_splash 960 1600 "$RES_DIR/drawable-port-xxhdpi/splash.png"
create_splash 1280 1920 "$RES_DIR/drawable-port-xxxhdpi/splash.png"

echo "Icônes et écrans de démarrage Android générés."
