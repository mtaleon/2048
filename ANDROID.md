# Android Build Guide

## Prerequisites

- **Node.js 22+** (for Capacitor CLI)
- **Android Studio** with SDK 33+
- **JDK 21** (Temurin or similar)

## Local Development

### Build Debug APK

```bash
npm run android:build
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

### Open in Android Studio

```bash
npm run android:open
```

### Build Release APK (requires signing)

```bash
npm run android:release
```

Output: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

## Signing for Production

To sign the release APK for Google Play:

1. **Generate keystore:**
   ```bash
   keytool -genkey -v -keystore my-release-key.keystore \
     -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Update `capacitor.config.json`:**
   ```json
   {
     "android": {
       "buildOptions": {
         "keystorePath": "path/to/my-release-key.keystore",
         "keystoreAlias": "my-key-alias"
       }
     }
   }
   ```

3. **Build signed release:**
   ```bash
   npm run android:release
   ```

## CI/CD (GitHub Actions)

### Automated Builds

- **On push to main:** Builds debug APK and uploads as artifact
- **On git tag (v*):** Builds release APK and creates GitHub release

### Triggering a Release

```bash
git tag v1.0.0
git push origin v1.0.0
```

This automatically:
1. Builds release APK
2. Creates GitHub release
3. Attaches APK to release

## Testing on Device

### Via ADB

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Via Android Studio

1. Open project: `npm run android:open`
2. Connect device or start emulator
3. Click "Run" (▶️)

## Troubleshooting

### JAVA_HOME not set

```bash
export JAVA_HOME=/path/to/jdk-21
```

### Gradle sync failed

Open in Android Studio and sync manually:
```bash
npm run android:open
```

Then: **File → Sync Project with Gradle Files**

### Build fails with SDK errors

Install required SDK packages in Android Studio:
- **Tools → SDK Manager**
- Install Android SDK 33 (API level 33)
- Install Android SDK Build-Tools 33.0.0

## App Signing for Google Play

For production release on Google Play:

1. Generate upload key
2. Configure in `capacitor.config.json`
3. Build release APK
4. Sign with Google Play App Signing (recommended)

See: https://developer.android.com/studio/publish/app-signing
