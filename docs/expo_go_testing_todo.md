# TODO — Getting Amiva testable in Expo Go

Everything below is required (or worth checking) to go from "bundles
cleanly" (verified — see session notes) to "actually usable on a phone in
Expo Go." Roughly in the order you'd do them.

---

## 1. Fix dependency version mismatches

Expo Go is strict about native module versions matching the SDK it was
built against — a mismatch here is a common cause of a red-screen crash
*specifically in Expo Go* that wouldn't show up in a Metro bundle check.
The dev server already flagged these on startup:

```
expo-image-picker@15.0.7            → expected ~15.1.0
react-native@0.74.1                 → expected 0.74.5
react-native-safe-area-context@4.10.1 → expected 4.10.5
typescript@5.9.3                    → expected ~5.3.3
```

- [ ] Run `npx expo install --fix` from `apps/mobile` to align every Expo
      SDK-adjacent package to the versions SDK 51 expects.
- [ ] Re-run `npm run typecheck -w apps/mobile` and `npm run test -w
      apps/mobile` after — a version bump can shift types.

## 2. Firebase project

- [ ] Create a Firebase project (or pick an existing one).
- [ ] **Enable the Blaze (pay-as-you-go) plan.** Cloud Functions cannot
      deploy at all on the free Spark plan — this is easy to hit
      unexpectedly. Usage at dev-testing scale stays within the free
      tier of Blaze; you're not signing up for a real bill, just
      unlocking Functions.
- [ ] Enable **Authentication** → Sign-in providers: Google, Facebook.
- [ ] Enable **Firestore** (production mode is fine — rules are already
      written).
- [ ] Enable **Storage**.
- [ ] Update `.firebaserc`'s `"default"` project id from the placeholder
      `"amiva-app"` to your real project id.
- [ ] Deploy the backend:
  ```bash
  firebase deploy --only firestore:rules,firestore:indexes,storage,functions
  ```
  The Firestore indexes step matters — several repository queries (e.g.
  the feed, trip-by-country lookups) will fail at runtime with a
  "this query requires an index" error and a console link until
  `firestore.indexes.json` is actually deployed.

## 3. Client config — `.env.local`

- [ ] `cp apps/mobile/.env.example apps/mobile/.env.local`
- [ ] Fill in the six `AMIVA_FIREBASE_*` values from Project Settings →
      General → "Your apps" → Web app config (register a Web app in the
      Firebase console even though this is a mobile app — the JS SDK
      uses the web-style config object, not `GoogleService-Info.plist`/
      `google-services.json`).

## 4. Google OAuth

- [ ] In Google Cloud Console (same project Firebase created), create an
      OAuth 2.0 client ID for the sign-in flow.
- [ ] **Verify the redirect URI Expo Go actually produces at runtime**
      (`AuthSession.makeRedirectUri()` inside `useGoogleSignIn.ts`) is
      registered as an authorized redirect URI. This is the one piece of
      this whole list I'm genuinely unsure will "just work": Expo's
      OAuth-proxy behavior has shifted across SDK versions, and Expo Go
      redirect URIs aren't as stable/predictable as a standalone build's
      custom scheme. **Console-log the value `promptAsync()` sends /
      the URI `useGoogleSignIn` builds on a real device before assuming
      it's wired correctly** — don't just trust that pointing a client ID
      into `.env.local` is sufficient.
- [ ] Set `AMIVA_GOOGLE_OAUTH_CLIENT_ID` in `.env.local`.

## 5. Facebook OAuth

- [ ] Create a Facebook App in Meta's developer console, add the
      Facebook Login product.
- [ ] Add yourself as a test user (or set the app Live) — a fresh FB app
      in development mode only allows logins from registered testers.
- [ ] Same redirect-URI caveat as Google above — verify against
      `useFacebookSignIn.ts`'s actual runtime redirect URI, don't assume.
- [ ] Set `AMIVA_FACEBOOK_APP_ID` in `.env.local`.

## 6. Google Places

- [ ] Enable the **Places API** in Google Cloud Console.
- [ ] Create/restrict an API key, set `AMIVA_GOOGLE_PLACES_API_KEY`.
- [ ] Without this, `PlacesAutocomplete` (experience location entry) will
      silently return zero results — worth a manual check that a search
      actually returns predictions.

## 7. Device / network

- [ ] Install Expo Go on a physical iOS or Android device (or an
      emulator/simulator with Expo Go installed).
- [ ] Phone and dev machine on the same Wi-Fi network, or run
      `npx expo start --tunnel` if that's not possible.
- [ ] `npm start -w apps/mobile`, scan the QR code.

## 8. Known limitations while testing in Expo Go specifically

- **Push notifications will not actually deliver.** `sendNotification`
  calls raw FCM (`admin.messaging().sendEachForMulticast`) server-side,
  and Expo Go does not support receiving raw FCM remote pushes (Android
  removed this from Expo Go entirely in recent SDKs; iOS never supported
  it in Expo Go). The four notification *types* still get created as
  Firestore docs and will show up correctly in `NotificationsScreen` —
  only the push-to-device half is untestable without a standalone/EAS
  dev-client build. Not a bug to fix tonight, just don't expect a phone
  buzz.
- **First run will look empty.** No seed data exists anywhere. Realistic
  test path: onboard → log one experience → it'll show up in your own
  Logbook and (once a second test account exists) in that account's
  Discovery feed with a match %. Testing Discovery/Trending/Social
  meaningfully basically requires **two Expo Go sessions signed in as
  two different accounts** (two devices, or one device + one simulator).
- **`@react-native-community/slider` and
  `@react-native-community/datetimepicker`** are the two third-party
  native modules in the dependency list (everything else is either an
  `expo-*` package, `firebase` pure-JS, or `react-native-svg`/navigation,
  all long-standard in Expo Go). Both are widely used in Expo Go and
  *should* work out of the box — flagged only because it's the one
  category of thing that can't be confirmed without an actual device,
  and would show up as an "unknown native module" red screen if wrong.

## 9. Things that do *not* need doing for Expo Go testing

Noting these explicitly so they don't get treated as blockers:

- Real app icon/splash art — the placeholder solid-color PNG is fine
  indefinitely; icon/splash only matter for a standalone/EAS build, not
  the Expo Go shell.
- `GoogleService-Info.plist` / `google-services.json` — not used; the
  Firebase JS SDK takes its config from `.env.local` → `app.config.js`
  → `extra`, by design (this is *why* the JS SDK was chosen over
  `@react-native-firebase`, which would need native linking Expo Go
  doesn't support).
- Xcode / Android Studio / CocoaPods — none of it; that's the whole
  point of Expo Go.

---

*Written after a real dev-server bundle check (iOS: 1131 modules,
Android: 1138 modules, both HTTP 200) — not from documentation alone.
Section 4/5's redirect-URI caveat and section 8's Expo Go module list
are flagged with the actual confidence level behind them, not asserted
as certain.*
