#!/bin/bash
# make-ota-bundle.sh - Build OTA bundle for 2048
#
# Usage: ./scripts/make-ota-bundle.sh
#
# This script:
# 1. Reads otaVersionCode from version.json
# 2. Runs npm run build to generate www/
# 3. Creates zip bundle with directory structure intact
# 4. Computes SHA-256 hash
# 5. Updates version.json with bundleUrl and bundleHash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== 2048 OTA Bundle Builder ===${NC}"

# Check if version.json exists
if [ ! -f "version.json" ]; then
    echo -e "${RED}Error: version.json not found${NC}"
    exit 1
fi

# Read version from version.json
OTA_VERSION=$(node -p "JSON.parse(require('fs').readFileSync('version.json', 'utf8')).otaVersionCode")
if [ -z "$OTA_VERSION" ]; then
    echo -e "${RED}Error: otaVersionCode not found in version.json${NC}"
    exit 1
fi

echo -e "${YELLOW}Building OTA bundle v${OTA_VERSION}...${NC}"

# Create ota directory if it doesn't exist
mkdir -p ota

# Build the web app
echo -e "${YELLOW}Running npm run build...${NC}"
npm run build

if [ ! -d "www" ]; then
    echo -e "${RED}Error: www/ directory not found after build${NC}"
    exit 1
fi

# Create bundle zip (preserving directory structure)
BUNDLE_NAME="bundle-v${OTA_VERSION}.zip"
BUNDLE_PATH="ota/${BUNDLE_NAME}"

echo -e "${YELLOW}Creating bundle: ${BUNDLE_PATH}${NC}"

# Remove old bundle if exists
rm -f "$BUNDLE_PATH"

# Create zip with directory structure
(cd www && zip -r "../${BUNDLE_PATH}" . -x "*.DS_Store" "*node_modules*")

if [ ! -f "$BUNDLE_PATH" ]; then
    echo -e "${RED}Error: Failed to create bundle${NC}"
    exit 1
fi

# Compute SHA-256 hash
echo -e "${YELLOW}Computing SHA-256 hash...${NC}"
if command -v sha256sum &> /dev/null; then
    # Linux
    HASH=$(sha256sum "$BUNDLE_PATH" | awk '{print $1}')
elif command -v shasum &> /dev/null; then
    # macOS
    HASH=$(shasum -a 256 "$BUNDLE_PATH" | awk '{print $1}')
else
    echo -e "${RED}Error: Neither sha256sum nor shasum found${NC}"
    exit 1
fi

HASH_WITH_PREFIX="sha256:${HASH}"

echo -e "${GREEN}Bundle created: ${BUNDLE_PATH}${NC}"
echo -e "${GREEN}SHA-256: ${HASH_WITH_PREFIX}${NC}"

# Update version.json with bundleUrl and bundleHash
BUNDLE_URL="https://2048.octile.eu.cc/ota/${BUNDLE_NAME}"

echo -e "${YELLOW}Updating version.json...${NC}"

# Use node to update JSON (preserves formatting)
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('version.json', 'utf8'));
data.bundleUrl = '${BUNDLE_URL}';
data.bundleHash = '${HASH_WITH_PREFIX}';
fs.writeFileSync('version.json', JSON.stringify(data, null, 2) + '\n');
"

echo -e "${GREEN}=== Build Complete ===${NC}"
echo ""
echo -e "Next steps:"
echo -e "1. Upload ${BUNDLE_PATH} to https://2048.octile.eu.cc/ota/"
echo -e "2. Upload version.json to https://2048.octile.eu.cc/"
echo -e "3. Test OTA update on Android device"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Upload bundle BEFORE updating version.json in production${NC}"
