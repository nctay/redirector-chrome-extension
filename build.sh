#!/bin/bash

# Скрипт для упаковки Chrome-расширения
# Использование: ./build.sh [version]

set -e

# Получаем версию из аргумента или используем из manifest.json
if [ -n "$1" ]; then
    VERSION="$1"
else
    VERSION=$(grep -o '"version": "[^"]*"' manifest.json | cut -d'"' -f4)
fi

NAME="oidc-redirector"
DIST_DIR="dist"
BUILD_DIR="${DIST_DIR}/${NAME}-v${VERSION}"
ZIP_NAME="${NAME}-v${VERSION}.zip"

echo "🔨 Building ${NAME} v${VERSION}..."

# Создаем директории
mkdir -p "${BUILD_DIR}"

# Копируем необходимые файлы
echo "📦 Copying files..."
cp manifest.json "${BUILD_DIR}/"
cp background.js "${BUILD_DIR}/"
cp popup.html "${BUILD_DIR}/"
cp popup.js "${BUILD_DIR}/"
cp icon.png "${BUILD_DIR}/"
cp README.md "${BUILD_DIR}/"

# Создаем ZIP
echo "🗜️  Creating ZIP archive..."
cd "${DIST_DIR}"
zip -r "${ZIP_NAME}" "${NAME}-v${VERSION}" > /dev/null
cd ..

# Перемещаем ZIP на уровень выше
mv "${DIST_DIR}/${ZIP_NAME}" .

# Очищаем временные файлы
rm -rf "${BUILD_DIR}"

echo "✅ Build complete!"
echo "📦 Package: ${ZIP_NAME}"
echo ""
echo "To install:"
echo "1. Extract the ZIP file"
echo "2. Open chrome://extensions/"
echo "3. Enable 'Developer mode'"
echo "4. Click 'Load unpacked' and select the extracted folder"
