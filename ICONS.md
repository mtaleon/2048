# Icon Generation Guide

This document explains the icon setup for the 2048 game and how to regenerate them.

## Icon Files

### Source
- **`icon-1024.svg`** - High-resolution source icon (1024×1024)
  - Yellow background (`#edc22e`)
  - White "2048" text (`#f9f6f2`)
  - Used as the master source for all generated icons

### Web/PWA Icons
- **`favicon.svg`** - Scalable favicon (100×100 viewBox)
- **`icon-192.png`** - 192×192 PNG for web app manifest
- **`icon-512.png`** - 512×512 PNG for web app manifest
- **`icon-1024.png`** - 1024×1024 PNG (generated, not committed)

### Android Icons
Generated in various densities for Android launcher:
- **mdpi**: 48×48 (160dpi)
- **hdpi**: 72×72 (240dpi)
- **xhdpi**: 96×96 (320dpi)
- **xxhdpi**: 144×144 (480dpi)
- **xxxhdpi**: 192×192 (640dpi)

Each density includes:
- `ic_launcher.png` - Square icon
- `ic_launcher_round.png` - Round icon (for devices that support circular icons)
- `ic_launcher_foreground.png` - Foreground for adaptive icons

## Regenerating Icons

### Prerequisites
- macOS with `sips` (built-in)
- Or any OS with ImageMagick installed

### Regenerate All Icons

```bash
./generate-icons.sh
```

This script:
1. Converts `icon-1024.svg` to `icon-1024.png`
2. Generates all Android icon densities
3. Places them in `android/app/src/main/res/mipmap-*/`

### Regenerate Web Icons

```bash
# 192×192 for PWA
sips -z 192 192 icon-1024.png --out icon-192.png

# 512×512 for PWA
sips -z 512 512 icon-1024.png --out icon-512.png
```

## Modifying the Icon Design

To change the icon design:

1. Edit `icon-1024.svg` with your design
2. Keep the viewBox at `0 0 1024 1024` for consistency
3. Run `./generate-icons.sh` to regenerate all icons
4. Rebuild web: `npm run build`
5. Rebuild Android: `npm run android:build`

## Icon Specifications

### Android Launcher Icons
- **Dimensions**: Multiple densities (see above)
- **Format**: PNG, 32-bit RGBA
- **Safe zone**: Keep important content in center 66% (avoid outer 17% margin)
- **Corner radius**: Applied automatically by Android (adaptive icons)

### Web App Icons
- **192×192**: Minimum size for PWA installation prompt
- **512×512**: Used for splash screen on some devices
- **Format**: PNG with transparency support
- **Purpose**: Both "any" and "maskable" (icon works with/without shape mask)

### Favicon
- **Format**: SVG (scalable, works at any size)
- **Fallback**: Modern browsers support SVG favicons
- **Legacy**: Consider adding `favicon.ico` for older browsers

## References

- [Android Icon Guidelines](https://developer.android.com/guide/practices/ui_guidelines/icon_design_launcher)
- [Web App Manifest Icons](https://web.dev/add-manifest/#icons)
- [Maskable Icons](https://web.dev/maskable-icon/)
