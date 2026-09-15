#!/usr/bin/env bash
set -euo pipefail

cp public/pwa-icon.png public/elegance-move-icon-v7.png
sed -i 's#/pwa-icon.png?v=5#/elegance-move-icon-v7.png#g' public/index.html
sed -i 's#/pwa-icon.png#/elegance-move-icon-v7.png#g' public/index.html
sed -i 's#manifest.webmanifest?v=5#manifest.webmanifest?v=7#g' public/index.html
sed -i 's#/pwa-icon.png?v=5#/elegance-move-icon-v7.png#g' public/manifest.webmanifest
sed -i 's#/pwa-icon.png#/elegance-move-icon-v7.png#g' public/manifest.webmanifest
sed -i 's#/pwa-icon.png#/elegance-move-icon-v7.png#g' public/pwa-runtime.js
sed -i 's#elegance-move-pwa-v4#elegance-move-pwa-v7#g' public/sw.js
sed -i 's#/pwa-icon.png#/elegance-move-icon-v7.png#g' public/sw.js

echo PWA_ICON_V7_POSTBUILD_OK
