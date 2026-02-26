# Gurbani 24/7 (React Native)

A simple Android-ready React Native app that streams live Gurbani kirtan with:

- Play / Pause button
- "Gurbani 24/7" title
- Current song text fetched from:
  - `https://gurbanikirtan.radioca.st/currentsong?sid=1`
- Minimal animated visualizer
- Background playback enabled in the app audio mode
- Tailwind-based UI using NativeWind

## Stream URL

`https://gurbanikirtan.radioca.st/start.mp3`

## Run locally (development)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start Metro:
   ```bash
   npm run start
   ```
3. Run on Android device/emulator:
   ```bash
   npm run android
   ```

## Build self-contained APK with GitHub Actions

This repo includes a workflow at `.github/workflows/android-apk.yml` that:

1. Installs dependencies
2. Runs Expo prebuild for Android
3. Builds a **release APK** (`app-release.apk`)
4. Uploads the APK as a workflow artifact

Release APK includes the JS bundle and assets, so it does **not** require Metro (`npx react-native start`) at runtime.

To use it:

1. Push to `main` (or run manually with **workflow_dispatch**).
2. Open the workflow run in GitHub Actions.
3. Download artifact: `gurbani-247-release-apk`.
4. Install on your Android device (enable unknown sources if needed).

## Notes

- Use the release APK artifact for portable/manual install testing.
- If you later want Play Store distribution, add a dedicated release keystore/signing setup.
