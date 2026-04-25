# 2048 v1.0 Pre-Launch Checklist

## 🔴 BLOCKERS (Must Complete Before Submission)

These are the **only 3 items** that block Play Store submission. Everything else is nice-to-have.

---

### Blocker #1: Android Device Verification ✅

**Test on physical Android device - ALL 7 points must pass:**

- [ ] **1. App starts, game playable immediately** (before consent UI)
- [ ] **2. If consent required** → consent UI appears, game continues without interruption
- [ ] **3. Banner appears at bottom** of screen
- [ ] **4. Open help/about/win/lose modal** → banner disappears
- [ ] **5. Close modal** → banner reappears
- [ ] **6. Lose a game** → Network traffic shows `POST /2048/score`
- [ ] **7. Restart app** → Network traffic shows `GET version.json` (~3 seconds after startup)

**How to test:**
```bash
# 1. Build and install
npm run android:bundle
# Install APK on device via adb or Android Studio

# 2. Monitor network traffic
# Option A: Chrome DevTools (if WebView debugging enabled)
#   chrome://inspect → Select device → Network tab

# Option B: Android Logcat
adb logcat | grep "2048"
```

**Pass criteria**: All 7 behaviors verified ✅

---

### Blocker #2: Score Backend Verification ✅

**Verify backend API is live and responding:**

```bash
curl -v -X POST https://api.octile.eu.cc/2048/score \
  -H "Content-Type: application/json" \
  -d '{
    "submission_id":"prelaunch-test-1",
    "final_score":128,
    "max_tile":64,
    "moves":20,
    "time_seconds":60,
    "browser_uuid":"local-test",
    "timestamp_utc":"2026-04-25T00:00:00Z",
    "ota_version_code":1,
    "platform":"android"
  }'
```

**Expected response:**
```
HTTP/2 200 OK
Content-Type: application/json

{"status":"ok","submission_id":"prelaunch-test-1"}
```

**Pass criteria**: 
- [ ] Returns `200 OK`
- [ ] Response body is valid JSON
- [ ] HTTPS certificate valid

**Note**: Whether backend writes to DB or analyzes data is v1.1 concern. For v1.0, just need endpoint alive.

---

### Blocker #3: OTA Hosting Minimal Deployment ✅

**Set up minimal OTA infrastructure:**

**Required directory structure:**
```
https://2048.octile.eu.cc/
├── version.json
└── ota/
    └── bundle-v1.zip
```

**Deployment steps:**

1. **Generate first OTA bundle:**
   ```bash
   cd /Users/oouyang/ws/2048
   ./scripts/make-ota-bundle.sh
   # Generates: ota/bundle-v1.zip
   # Updates: version.json with bundleUrl and bundleHash
   ```

2. **Upload to hosting:**
   ```bash
   # Example: rsync to server
   rsync -avz ota/bundle-v1.zip user@server:/var/www/2048.octile.eu.cc/ota/
   rsync -avz version.json user@server:/var/www/2048.octile.eu.cc/
   
   # OR: Upload via cloud storage (S3, GCS, etc.)
   # OR: Push to GitHub Pages / Cloudflare Pages
   ```

3. **Verify accessibility:**
   ```bash
   # Test version.json
   curl -I https://2048.octile.eu.cc/version.json
   # Expected: 200 OK
   
   # Test bundle
   curl -I https://2048.octile.eu.cc/ota/bundle-v1.zip
   # Expected: 200 OK
   ```

**Pass criteria**:
- [ ] `version.json` accessible via HTTPS
- [ ] `bundle-v1.zip` accessible via HTTPS
- [ ] Hash in `version.json` matches actual bundle SHA-256
- [ ] HTTPS certificate valid

**Minimal hosting options** (choose one):
- **GitHub Pages**: Free, automatic HTTPS, good for static files
- **Cloudflare Pages**: Free, edge network, fast globally
- **Self-hosted Nginx**: Full control, requires SSL setup

---

## 🟢 CRITICAL (Must Do Before Play Store Submission)

### Generate Release Keystore

```bash
cd /Users/oouyang/ws/2048/android

keytool -genkey -v -keystore 2048-release.keystore \
  -alias 2048-release-key \
  -keyalg RSA -keysize 2048 -validity 10000

# Follow prompts, save passwords securely!
```

### Create keystore.properties

```bash
# Copy template
cp keystore.properties.template keystore.properties

# Edit with actual credentials
nano keystore.properties
```

**Contents:**
```properties
storeFile=2048-release.keystore
storePassword=YOUR_ACTUAL_PASSWORD
keyAlias=2048-release-key
keyPassword=YOUR_ACTUAL_PASSWORD
```

### Replace Test AdMob IDs

Edit `android/app/src/main/res/values/strings.xml`:

**Change from:**
```xml
<string name="admob_app_id">ca-app-pub-3940256099942544~3347511713</string>
```

**Change to:**
```xml
<string name="admob_app_id">ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY</string>
```

Get your actual IDs from: https://apps.admob.com/

### Build Release AAB

```bash
npm run android:bundle

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

---

## 🟡 RECOMMENDED (Not Blocking, But Valuable)

### Add Analytics Toggle (Beyond Reset Button)

**Current:** Reset button clears UUID (good for "Optional: Yes")  
**Better:** Toggle to disable analytics completely

**Implementation** (30 minutes):
```javascript
// In settings/about modal
const analyticsEnabled = localStorage.getItem('2048-analytics-enabled') !== 'false';

// In score submission guard
if (
  window.config?.features?.score_submission &&
  isAndroidNative &&
  typeof submitScore === 'function' &&
  analyticsEnabled  // <-- Add this check
) {
  submitScore(...);
}
```

**Why:** Makes Data Safety "Optional: Yes" even stronger.

---

### Document EventBus Location in README

**Current assumption:** `core/events.js`  
**Reality:** Should verify and document actual location

**Add to README.md:**
```markdown
## Architecture Notes

- EventBus location: `core/events.js`
- EventBus contract: See plan section 1.2 for required events
```

**Why:** Prevents future confusion about file paths.

---

## 📋 Final Pre-Submission Checklist

Once all 3 blockers are complete:

- [ ] All Blocker #1 device tests passed (7/7)
- [ ] Blocker #2: Backend returns 200 OK
- [ ] Blocker #3: OTA hosting accessible via HTTPS
- [ ] Release keystore generated and secured
- [ ] keystore.properties created with actual credentials
- [ ] Test AdMob IDs replaced with production IDs
- [ ] Release AAB built successfully
- [ ] AAB uploaded to Play Store Console
- [ ] Data Safety form completed (anonymous gameplay statistics)
- [ ] Privacy policy URL provided: https://2048.octile.eu.cc/privacy.html
- [ ] Store listing screenshots uploaded

---

## 🚨 Common Pitfalls

### AdMob: App Crashes on Startup
**Symptom:** "Missing application ID" error  
**Fix:** Verify `AndroidManifest.xml` has `<meta-data>` for AdMob App ID

### Score Submission: Silent Failure
**Symptom:** No POST requests visible in network logs  
**Fix:** Check `isAndroidNative` is true, verify INTERNET permission

### OTA: Updates Not Downloading
**Symptom:** No "Update ready" banner appears  
**Fix:** Check `adb logcat | grep 2048` for errors, verify version.json accessible

### Banner: Overlaps Content
**Symptom:** Banner covers game board  
**Fix:** Verify `--ad-safe-bottom` CSS variable is set, check body padding

---

## 📞 Support

If blockers cannot be resolved:

1. **Check logs:** `adb logcat | grep -E "2048|AdMob|Capacitor"`
2. **Verify network:** Use Charles Proxy or mitmproxy to inspect HTTPS traffic
3. **Test on multiple devices:** Some issues are device-specific
4. **Consult plan:** `/Users/oouyang/.claude/plans/parallel-gathering-crane.md` has detailed troubleshooting

---

**Remember:** Only the 3 blockers prevent submission. Everything else can be fixed in v1.1 via OTA update! 🚀
