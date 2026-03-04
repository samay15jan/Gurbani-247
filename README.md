# Gurbani 24/7 (React Native)

A minimal mobile app that streams live Gurbani kirtan continuously with a clean interface and lightweight visualizer.

The project was originally created as an experiment in AI-assisted development to test how far AI coding tools could help in building a real application.

<img width="2240" height="1260" alt="App preview" src="https://github.com/user-attachments/assets/21337a6a-c9dd-4e19-946f-d0cdb7df1cfb" />

---

## Features

- Live Gurbani stream playback
- Play / Pause controls
- Minimal animated audio visualizer
- Current track text fetched from the radio endpoint
- Background playback support
- Android notification media controls
- Clean minimal UI
- Tailwind-style styling using NativeWind

---

## Tech Stack

- React Native
- Expo
- NativeWind (Tailwind CSS for React Native)

---

## Stream Source

Audio stream:

```

[https://gurbanikirtan.radioca.st/start.mp3](https://gurbanikirtan.radioca.st/start.mp3)

```

Metadata / current track info:

```

[https://gurbanikirtan.radioca.st](https://gurbanikirtan.radioca.st)

````

---

## Running Locally

### 1. Install dependencies

```bash
npm install
````

### 2. Start Metro

```bash
npm run start
```

### 3. Run on Android device or emulator

```bash
npm run android
```

---

## Building an APK with GitHub Actions

This repository includes a workflow:

```
.github/workflows/android-apk.yml
```

The workflow automatically:

1. Installs dependencies
2. Runs Expo prebuild for Android
3. Builds a debug APK
4. Uploads the APK as a GitHub Actions artifact

### How to use it

1. Push code to the `main` branch
   or run the workflow manually using **workflow_dispatch**.

2. Open the workflow run in **GitHub Actions**.

3. Download the artifact:

```
gurbani-247-debug-apk
```

4. Install the APK on your Android device
   (enable unknown sources if required).

---

## Notes

* The generated APK is a **debug build**, intended for testing and manual installs.
* For Play Store releases you will need to configure:

  * Android signing keystore
  * Release build configuration
  * AAB packaging

---

## Future Plans

Possible improvements:

* iOS builds and distribution

* Unsigned IPA generation using:

  [https://github.com/samay15jan/altux](https://github.com/samay15jan/altux)

* Improved visualizer

* Stream metadata improvements

---

## License

MIT License
