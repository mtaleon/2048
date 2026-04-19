#!/bin/bash
set -e

echo "Generating Android icons from icon-1024.svg..."

# Create a temporary high-res PNG from SVG
echo "Converting SVG to PNG..."
sips -s format png icon-1024.svg --out icon-1024.png -z 1024 1024

# Generate icons for each density
generate_density() {
  density=$1
  size=$2
  output_dir="android/app/src/main/res/mipmap-${density}"

  echo "Generating ${density} icons (${size}x${size})..."

  # ic_launcher.png (square icon)
  sips -z $size $size icon-1024.png --out "${output_dir}/ic_launcher.png" >/dev/null 2>&1

  # ic_launcher_round.png (round icon for devices that support it)
  sips -z $size $size icon-1024.png --out "${output_dir}/ic_launcher_round.png" >/dev/null 2>&1

  # ic_launcher_foreground.png (for adaptive icons)
  sips -z $size $size icon-1024.png --out "${output_dir}/ic_launcher_foreground.png" >/dev/null 2>&1
}

# Generate all density variants
generate_density "mdpi" 48
generate_density "hdpi" 72
generate_density "xhdpi" 96
generate_density "xxhdpi" 144
generate_density "xxxhdpi" 192

echo "✅ Android icons generated successfully!"
echo ""
echo "Generated icons in:"
echo "  - android/app/src/main/res/mipmap-mdpi/"
echo "  - android/app/src/main/res/mipmap-hdpi/"
echo "  - android/app/src/main/res/mipmap-xhdpi/"
echo "  - android/app/src/main/res/mipmap-xxhdpi/"
echo "  - android/app/src/main/res/mipmap-xxxhdpi/"
echo ""
echo "You can now rebuild the Android app with: npm run android:build"
