# Sharing the AHC app

Three ways to see the app, from quickest to most permanent. All three run the same React Native code in this folder.

## 1. Browser link (no install)

A web build of the app is hosted as a private link. Open it on a phone or a computer and tap through all five tabs.

- On the web, prayer times, events and causes show **sample data** (marked "Sample" / "Preview"), because browsers aren't allowed to call the Muslimoon API directly. On a phone the app loads live prayer times.
- Links that leave the app (the IRM checkout, the website) may not open from inside the preview page.

## 2. On your phone with Expo Go (live data, needs the developer's computer running)

On the developer's computer, in this folder:

```bash
npm install          # first time only
npm run share        # = npx expo start --tunnel
```

A QR code appears in the terminal.

- **iPhone:** install **Expo Go** from the App Store, then scan the QR code with the Camera app.
- **Android:** install **Expo Go** from Google Play, open it, and scan the QR code from inside Expo Go.

The tunnel makes the app reachable from any network, not just the same Wi-Fi. It only works while that terminal stays open, and tunnel links are public while they're running.

## 3. An installable test app (lasting link, no computer needed)

Requires a free Expo account (expo.dev). On the developer's computer:

```bash
npx eas-cli@latest login
npx eas-cli@latest init                 # links this project to the Expo account (first time only)
npm run build:android-preview           # Android: builds an installable APK in the cloud
```

When the build finishes, the terminal and the expo.dev dashboard give an install link and QR code. Anyone with an Android phone can install from it.

**iPhone** needs a paid Apple Developer account (US$99/year, ideally in AHC's name):

- **TestFlight** (recommended): `npx eas-cli@latest build --platform ios --profile production`, then `npx eas-cli@latest submit --platform ios`, then invite testers in App Store Connect.
- **Ad hoc**: register each iPhone with `npx eas-cli@latest device:create`, then build with `--profile preview`. Limited to 100 devices a year; adding a device means rebuilding.

Build profiles live in `eas.json` (`preview` = internal test builds, `production` = store builds).

## What's live and what's still sample

| Area | Status |
| --- | --- |
| Prayer times | Live from Muslimoon (on phones) |
| Events / programs | Connected; shows previews until AHC publishes events in Muslimoon |
| Donation causes | Connected to Muslimoon campaigns; shows the four default causes until campaigns are added |
| Donations | Opens AHC's IRM checkout (app.irm.io) |
| Reminders | Salah (at adhan or before iqamah, per prayer, Jumu'ah on Fridays) and class/event reminders — on the phone only; try **More → Notifications → Send a test reminder** in Expo Go |
| Sign-in | Not built yet (needed before the stores, with in-app account deletion) |
| Address / phone | Placeholders until confirmed |
