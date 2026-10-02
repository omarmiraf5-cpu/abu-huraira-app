# AHC App

The five-screen design (Home, Prayer Times, Donate, Events,
Notifications) as a plain web app in `www/`, wrapped with
[Capacitor](https://capacitorjs.com) into real native Android and iOS
app projects so it can be built and submitted to the Play Store / App
Store.

```
www/                 the actual app - HTML/CSS/JS, no build step
  index.html
  assets/
    mark-light.png   logo for dark backgrounds
    mark-navy.png    logo for light backgrounds
android/             native Android Studio project (Capacitor-generated)
ios/                 native Xcode project (Capacitor-generated)
resources/           source icon.png / splash.png used to generate all
                     app icon & splash sizes (via `npx capacitor-assets generate`)
capacitor.config.json
```

The only external request `www/index.html` makes is to Google Fonts.
Everything else is local; the native shells add no backend of their own.

---

## Building the native apps

**Android** (works on Windows/Mac/Linux):
1. Install [Android Studio](https://developer.android.com/studio).
2. Open the `android/` folder as a project.
3. Let it sync (downloads the Android Gradle Plugin/SDK - this needs
   normal internet access to Google's servers, which this dev sandbox
   didn't have, so it was never build-tested here).
4. Run on an emulator or a plugged-in phone via the ▶ button, or
   **Build → Generate Signed Bundle/APK** for a Play Store upload.
5. Play Store submission needs a [Google Play Console](https://play.google.com/console) account ($25 one-time, your own).

**iOS** (needs a Mac):
1. Install Xcode from the Mac App Store.
2. Open `ios/App/App.xcworkspace` (not the `.xcodeproj`).
3. Set your Team under **Signing & Capabilities** (needs your own
   [Apple Developer](https://developer.apple.com/programs/) account,
   $99/yr).
4. Run on the simulator or a plugged-in iPhone via ▶, or
   **Product → Archive** to upload to App Store Connect via TestFlight.

**After editing anything in `www/`**, re-sync both native projects
before rebuilding:
```
npx cap sync
```

**Regenerating icons/splash** after changing `resources/icon.png` or
`resources/splash.png`:
```
npx capacitor-assets generate
```

---

## Deploying the web preview (unchanged)

The `www/` folder is still a normal static site — Netlify is already
linked to this repo/branch (see `netlify.toml`) and auto-deploys to
`ahc-app-preview.netlify.app` on every push. To deploy it anywhere else
(Vercel, Cloudflare Pages, plain hosting), just publish the `www/`
folder the same way.

---

## Before you send the link

- [ ] Open it on your **phone** as well as desktop — the layout scrolls
      sideways and you want to confirm that feels natural on mobile.
- [ ] Tap through everything: switch screens from the bottom tab bar,
      toggle a notification, pick a donation amount, hit RSVP.
- [ ] Check the logo appears on all five screens.
- [ ] Open the link in a private/incognito window to be sure it's
      publicly reachable and not cached from your own session.

---

## A note on what this is

The UI is real and this now builds into real installable apps, but
there is still **no backend**. Prayer times are calculated client-side
(see below), and events/donation amounts/notifications are static or
client-only state — nothing persists across sessions, no payments
actually process, and no push notifications actually fire yet. Those
each need their own service (a small API/database, a payment
processor, Firebase Cloud Messaging or similar) before this is
production-ready, not just a store submission.

---

## Sample content to replace before launch

| Where | Currently | Needs |
|---|---|---|
| Prayer times | Live astronomical calculation (ISNA angles, standard Asr) for North York, ON, calibrated to abuhuraira.org's Sep 17 2026 schedule | Confirm the calculation method/Asr juristic school and Iqama offsets directly with AHC |
| Hijri date | 6 Rabi' al-Thānī 1448 | Live calculation |
| Events | Three known weekly classes | Full program list from AHC |
| Donation amounts | $10 / $25 / $50 / $100 | Confirm with AHC |
| Daily reflections | 100 Ayah/Hadith quotes (65/35) with Arabic + English, citations checked against sunnah.com/standard Mushaf numbering | **Arabic text was NOT verified against a Quran/hadith API** (none reachable from the dev environment) - have AHC's imam proofread every Arabic string, translation, and citation letter-for-letter before this is treated as authoritative or shown to the community |
