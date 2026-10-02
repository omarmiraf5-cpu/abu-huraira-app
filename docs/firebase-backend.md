# Firebase backend

Scaffolded, not deployed — this is CLAUDE.md's "Still to build" item 1. The code
is real and typechecks, but it needs a real Firebase project and a handful of
secrets/config values before any of it actually runs.

## What's here

```
firebase.json            Firebase CLI config (functions + firestore)
firestore.rules           Deny-all for clients — every write goes through a
                          Cloud Function using the Admin SDK, which bypasses
                          these rules. No admin console exists yet, so this
                          is the safe default rather than guessed-at rules.
firestore.indexes.json    Empty for now
.firebaserc               Placeholder project id — replace with the real one

functions/                Separate npm project (its own package.json,
                          node_modules, tsconfig) — the root tsconfig
                          excludes it so `npx tsc --noEmit` at the repo root
                          doesn't try to typecheck Node-only Admin SDK code.
  src/index.ts             The five functions (below)
  src/lib/expoPush.ts       Send push via Expo's push API (no expo-server-sdk
                            dependency — plain REST calls, see file comment)
  src/lib/youtube.ts        YouTube Data API v3 — quota-aware (see file comment)
  src/lib/muslimoonProxy.ts Forwards to Muslimoon's /forms — auth scheme TBD

src/config/firebase.ts     Client init — Functions only, no Firestore SDK on
                           the client (nothing it's allowed to read directly)
src/notifications/
  pushToken.ts              Gets an Expo push token, registers it
  PushTokenSync.tsx         Mounted in app/(tabs)/_layout.tsx, runs once on launch
```

## The five functions

1. **`onAnnouncementCreated`** — Firestore trigger on `announcements/{id}`.
   Pushes the doc's `title`/`body` to every registered device. No admin UI
   exists yet (CLAUDE.md item 4), so until one does, writing a doc by hand
   in the Firebase console or `firebase firestore:` CLI is how you'd send
   an announcement today.
2. **`registerPushToken`** — callable. Saves `{ token, platform }` to
   `deviceTokens/{token}` (doc id = token, so re-registering just updates
   the same doc instead of creating duplicates).
3. **`getYoutubeLatest`** — callable. Latest uploads via the channel's
   uploads playlist (`playlistItems.list`, 1 quota unit), cached in
   Firestore for 10 minutes.
4. **`checkYoutubeLive`** — scheduled, every 15 minutes. Live detection only
   has one official API path (`search.list`, 100 quota units/call — the
   default daily quota is 10,000), which is why this doesn't poll more
   often. See the comment in `youtube.ts` for the quota math and for
   PubSubHubbub/WebSub as the real fix once this is worth the extra setup.
   Tracks the last-notified video id so it pushes once per broadcast, not
   once per 15-minute tick.
5. **`submitMuslimoonForm`** — callable proxy for Muslimoon's `/forms`
   endpoint, which 401s without credentials nobody has yet (CLAUDE.md open
   question). The plumbing is ready; `lib/muslimoonProxy.ts` has a
   placeholder `Bearer` auth header to replace once Muslimoon/AHC's IT
   confirm the real scheme.

## To actually deploy this

1. **Create the Firebase project** (console.firebase.google.com), enable
   Firestore (production mode — the rules here already deny all client
   access) and Cloud Functions. Put the real project id in `.firebaserc`.
2. **Register a Firebase web app** in that project, copy its config values
   into `.env` (see `.env.example` — `EXPO_PUBLIC_FIREBASE_*`).
3. **Link an EAS project** — `npx eas-cli@latest init` — and make sure
   `app.json`'s `extra.eas.projectId` gets set. Without it,
   `pushToken.ts` no-ops instead of registering (same fallback style as
   the rest of the notifications code), since `getExpoPushTokenAsync`
   needs it.
4. **Set the secrets** the functions need:
   ```bash
   firebase functions:secrets:set YOUTUBE_API_KEY
   firebase functions:secrets:set MUSLIMOON_API_KEY   # once the real auth scheme is known
   firebase functions:config:set  # or an .env in functions/ — see below
   ```
   `YOUTUBE_CHANNEL_ID` isn't secret, just not known yet — set it via a
   `functions/.env` file (`YOUTUBE_CHANNEL_ID=UC...`) once AHC confirms
   their channel.
5. **Deploy**: `cd functions && npm run build && firebase deploy --only functions,firestore`.

## What's still a placeholder, on purpose

- `MUSLIMOON_API_KEY` / the Bearer auth scheme in `muslimoonProxy.ts` —
  waiting on Muslimoon/AHC's IT to say how `/forms` auth actually works.
- `YOUTUBE_CHANNEL_ID` — waiting on AHC's channel handle.
- The announcements write path — there's no admin UI yet (CLAUDE.md item 4
  is separate scope), so sending one today means writing to Firestore by
  hand.
