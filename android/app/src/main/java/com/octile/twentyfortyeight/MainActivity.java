package com.octile.twentyfortyeight;

import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.os.Bundle;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * MainActivity for 2048 with OTA (Over-The-Air) update support
 *
 * OTA Flow:
 * 1. App loads from OTA directory if available (ota_version > bundledVersionCode)
 * 2. Background check fetches version.json
 * 3. Downloads new bundle if available
 * 4. Verifies hash and required files
 * 5. Atomic swap: extract to ota_tmp, then rename to ota
 * 6. Notify JavaScript via evaluateJavascript
 * 7. Update applies on next app restart only (never mid-session)
 */
public class MainActivity extends BridgeActivity {

    private static final String TAG = "2048";
    private static final String PREFS_NAME = "2048_data";
    private static final String SITE_URL = "https://2048.octile.eu.cc/";
    private int bundledVersionCode;

    // Required files in OTA bundle (must all exist after extraction)
    private static final String[] OTA_REQUIRED_FILES = {
        "index.html",
        "app.js",
        "core/game.js",
        "core/board.js",
        "platforms/web-dom/styles.css",
        "version.json"
    };

    /**
     * JS Bridge for OTA download triggering
     * JavaScript can trigger background download via window.AndroidOTA.downloadUpdate()
     */
    public class AndroidOTA {
        @JavascriptInterface
        public void downloadUpdate(String bundleUrl, String bundleHash, int versionCode, String versionName) {
            Log.i(TAG, "OTA: JavaScript requested download for v" + versionCode);
            // Trigger download in background thread
            new Thread(() -> {
                try {
                    downloadAndInstallOta(bundleUrl, bundleHash, versionCode, versionName);
                } catch (Exception e) {
                    Log.w(TAG, "OTA download failed: " + e.getMessage());
                }
            }).start();
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Get bundled version code
        try {
            PackageInfo pInfo = getPackageManager().getPackageInfo(getPackageName(), 0);
            bundledVersionCode = pInfo.versionCode;
        } catch (Exception e) {
            bundledVersionCode = 1;
        }

        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);

        // Inject OTA bridge for JavaScript to trigger downloads
        getBridge().getWebView().post(() -> {
            getBridge().getWebView().addJavascriptInterface(new AndroidOTA(), "AndroidOTA");
            Log.d(TAG, "AndroidOTA bridge injected");
        });

        // Set window.otaVersion for JavaScript to know current version
        int otaVersion = prefs.getInt("ota_version", 0);
        int currentVersion = Math.max(bundledVersionCode, otaVersion);
        getBridge().getWebView().post(() -> {
            getBridge().getWebView().evaluateJavascript(
                "window.otaVersion = " + currentVersion + ";",
                null
            );
        });
    }

    @Override
    public String getStartUrl() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        return getWebLoadUrl(prefs);
    }

    /**
     * Determine which web root to load: OTA directory or bundled assets
     */
    private String getWebLoadUrl(SharedPreferences prefs) {
        int otaVersion = prefs.getInt("ota_version", 0);
        File otaDir = new File(getFilesDir(), "ota");
        File otaIndex = new File(otaDir, "index.html");

        if (otaVersion > bundledVersionCode && otaIndex.exists()) {
            Log.i(TAG, "OTA v" + otaVersion + " available, loading from ota/");
            return "file://" + otaIndex.getAbsolutePath();
        }

        // Bundled version caught up — clean up stale OTA directory
        if (otaVersion > 0 && otaVersion <= bundledVersionCode) {
            Log.i(TAG, "Bundled v" + bundledVersionCode + " >= OTA v" + otaVersion + ", cleaning up ota/");
            deleteDir(otaDir);
            prefs.edit().remove("ota_version").apply();
        }

        return "file:///android_asset/public/index.html";
    }

    /**
     * Download and install OTA update
     * Called from background thread via AndroidOTA bridge
     */
    private void downloadAndInstallOta(String bundleUrl, String expectedHash, int remoteVersion, String versionName) throws Exception {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        int otaVersion = prefs.getInt("ota_version", 0);
        int localMax = Math.max(bundledVersionCode, otaVersion);

        // Skip if already have this version
        if (remoteVersion <= localMax) {
            Log.d(TAG, "OTA: Already have v" + remoteVersion);
            return;
        }

        // Skip if this version previously failed
        int lastFailed = prefs.getInt("ota_last_failed", 0);
        if (remoteVersion == lastFailed) {
            Log.d(TAG, "OTA: v" + remoteVersion + " previously failed, skipping");
            return;
        }

        Log.i(TAG, "OTA: Downloading v" + remoteVersion + " from " + bundleUrl);

        // Download zip
        File zipFile = new File(getCacheDir(), "ota-bundle.zip");
        downloadFile(bundleUrl, zipFile);

        // Verify zip hash
        if (!expectedHash.isEmpty()) {
            String actualHash = "sha256:" + sha256(zipFile);
            if (!expectedHash.equals(actualHash)) {
                Log.e(TAG, "OTA: Hash mismatch! expected=" + expectedHash + " actual=" + actualHash);
                zipFile.delete();
                prefs.edit().putInt("ota_last_failed", remoteVersion).apply();
                return;
            }
            Log.d(TAG, "OTA: Hash verified");
        }

        // Atomic swap: extract to ota_tmp first, then rename to ota
        File otaTmp = new File(getFilesDir(), "ota_tmp");
        deleteDir(otaTmp);
        otaTmp.mkdirs();
        unzip(zipFile, otaTmp);
        zipFile.delete();

        // Verify all required files exist
        boolean allPresent = true;
        for (String fname : OTA_REQUIRED_FILES) {
            File f = new File(otaTmp, fname);
            if (!f.exists()) {
                Log.e(TAG, "OTA: Missing required file: " + fname);
                allPresent = false;
                break;
            }
        }

        if (!allPresent) {
            Log.e(TAG, "OTA: Verification failed, cleaning up");
            deleteDir(otaTmp);
            prefs.edit().putInt("ota_last_failed", remoteVersion).apply();
            return;
        }

        // Atomic swap: delete old ota/, rename ota_tmp/ → ota/
        File otaDir = new File(getFilesDir(), "ota");
        deleteDir(otaDir);
        if (!otaTmp.renameTo(otaDir)) {
            Log.e(TAG, "OTA: Atomic swap failed (rename)");
            deleteDir(otaTmp);
            prefs.edit().putInt("ota_last_failed", remoteVersion).apply();
            return;
        }

        // Save version, clear failed marker
        prefs.edit()
            .putInt("ota_version", remoteVersion)
            .remove("ota_last_failed")
            .apply();
        Log.i(TAG, "OTA: v" + remoteVersion + " ready, will load on next launch");

        // Notify WebView
        runOnUiThread(() -> {
            getBridge().getWebView().evaluateJavascript(
                "if(window.onOtaUpdateReady)window.onOtaUpdateReady(" + remoteVersion + ",'" + versionName + "');",
                null
            );
        });
    }

    // --- Utility methods ---

    private static void downloadFile(String urlStr, File dest) throws Exception {
        URL url = new URL(urlStr);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setConnectTimeout(15000);
        conn.setReadTimeout(30000);
        InputStream is = new BufferedInputStream(conn.getInputStream());
        FileOutputStream fos = new FileOutputStream(dest);
        byte[] buf = new byte[8192];
        int n;
        while ((n = is.read(buf)) != -1) {
            fos.write(buf, 0, n);
        }
        fos.close();
        is.close();
        conn.disconnect();
    }

    private static String sha256(File file) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        FileInputStream fis = new FileInputStream(file);
        byte[] buf = new byte[8192];
        int n;
        while ((n = fis.read(buf)) != -1) {
            digest.update(buf, 0, n);
        }
        fis.close();
        byte[] hash = digest.digest();
        StringBuilder sb = new StringBuilder();
        for (byte b : hash) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private static void unzip(File zipFile, File destDir) throws Exception {
        ZipInputStream zis = new ZipInputStream(new BufferedInputStream(new FileInputStream(zipFile)));
        ZipEntry entry;
        byte[] buf = new byte[8192];
        while ((entry = zis.getNextEntry()) != null) {
            if (entry.isDirectory()) {
                // Create directory structure
                File dir = new File(destDir, entry.getName());
                dir.mkdirs();
                continue;
            }

            // Extract file (preserving directory structure)
            File out = new File(destDir, entry.getName());

            // Guard against zip slip attack
            if (!out.getCanonicalPath().startsWith(destDir.getCanonicalPath())) {
                Log.w(TAG, "OTA: Skipping entry outside target dir: " + entry.getName());
                continue;
            }

            // Create parent directories if needed
            out.getParentFile().mkdirs();

            FileOutputStream fos = new FileOutputStream(out);
            int n;
            while ((n = zis.read(buf)) != -1) {
                fos.write(buf, 0, n);
            }
            fos.close();
            zis.closeEntry();
        }
        zis.close();
    }

    private static void deleteDir(File dir) {
        if (dir == null || !dir.exists()) return;
        File[] files = dir.listFiles();
        if (files != null) {
            for (File f : files) {
                if (f.isDirectory()) {
                    deleteDir(f);
                } else {
                    f.delete();
                }
            }
        }
        dir.delete();
    }
}
