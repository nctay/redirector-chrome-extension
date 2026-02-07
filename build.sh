#!/bin/bash
set -e

VERSION=$(grep -o '"version": "[^"]*"' manifest.json | cut -d'"' -f4)
ZIP_NAME="oidc-redirector-v${VERSION}.zip"

echo "Building OIDC Redirector v${VERSION}..."

rm -rf dist
mkdir -p dist/extension

cp manifest.json background.js popup.html popup.js icon.png dist/extension/

cd dist/extension
zip -r "../../${ZIP_NAME}" . > /dev/null
cd ../..

rm -rf dist

echo "Done: ${ZIP_NAME}"
