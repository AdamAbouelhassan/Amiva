# Amiva

Social travel planning — log trips, get matched to content and people by
travel style, plan what's next. Built per `docs/functional_specification.md`
and `docs/technical_specification.md`; conventions in `CLAUDE.md`.

## Structure

```
/apps/mobile     React Native (Expo) app
/functions       Cloud Functions for Firebase
/packages/core   Shared pure types + algorithms (no React, no Firebase SDK)
/docs            Functional & technical specs
firestore.rules, firestore.indexes.json, storage.rules, firebase.json
```

## Setup

```bash
npm install                          # installs all workspaces + builds packages/core (postinstall)
```

`packages/core`'s compiled `dist/` and `functions/lib/` are gitignored build
output, not checked in — `npm install`'s `postinstall` hook rebuilds
`packages/core/dist` automatically so `apps/mobile` can resolve `@amiva/core`.
You do *not* need to build `functions/` just to run the app — the app talks
to the already-deployed Cloud Functions on the live project, not local code;
only build/deploy `functions/` if you're changing backend logic.

**`apps/mobile/.env.local` is not in git** (it holds live credentials) —
get this file from a teammate who already has it, or, if you have
Owner/Editor access to the `amivadev` Firebase project yourself, pull the
values from Firebase Console → Project Settings → General → "Your apps"
(Firebase config) and Google Cloud Console → APIs & Services → Credentials
(Places API key, OAuth client ID). Use `apps/mobile/.env.example` as the
template for which keys go in it.

Deploying/managing the backend (not just running the app) additionally
needs `npm install -g firebase-tools`, `firebase login`, and project
access — see `.firebaserc` for the project id (`amivadev`).

## Running

```bash
npm run test                         # all workspaces
npm run test:core / test:functions / test:mobile

npm run typecheck --workspaces --if-present

npm run build -w functions           # compile Cloud Functions (only if deploying)
firebase deploy --only functions,firestore:rules,firestore:indexes,storage

npm start -w apps/mobile             # expo start -c is safer after a fresh clone (clears Metro cache)
```

**After deploying a *new* HTTPS callable function**, Firebase doesn't always
grant public-invoke permission automatically — if calls fail with
`unauthenticated [401]` even though the client is genuinely signed in, check
`gcloud functions get-iam-policy <name>` (or the Cloud Console → Cloud
Functions → function → Permissions tab) for an empty policy, and grant
`roles/cloudfunctions.invoker` to `allUsers`. This is normal Firebase
callable architecture — auth is enforced inside the function via
`context.auth`, not by IAM; IAM here just needs to let the request through
far enough to reach that check. We got bitten by this once already.

## Status

- `packages/core` — travel style types, cosine-similarity `MatchScorer`
  (Strategy pattern), decay/adjustment algorithm, feed tiering, group
  blending, trip categorization rule. 45 tests.
- `functions` — all 8 functions from the technical spec's API surface,
  each a thin trigger over a tested `lib/` function, plus three additions
  (`updateTravelStyleManual`, `upsertPlace`, `matchContacts`) needed to
  make already-specified features work under the security model — see the
  header comment in each for why. 31 tests.
- `apps/mobile` — repositories for all 8 collections, theme/design tokens,
  shared `RadarChart`/`MatchBadge`/`TravelStyleSliders` components, and
  all 5 feature modules (Account, Logbook, Planner, Discovery, Social)
  wired end-to-end through hooks + React Query — never a direct Firestore
  call from a screen.

### Live project status (`amivadev`)

Firestore, Storage, security rules, and all 12 Cloud Functions are deployed
and confirmed working end-to-end against a real device (Expo Go, SDK 54) —
account creation, Firestore reads/writes, privacy settings, and a manual
travel-style edit round-tripping through a callable Cloud Function have all
been verified for real, not just typechecked.

**Google/Facebook OAuth sign-in does not work in Expo Go, and this is a
known, structural limitation, not a bug to keep chasing:** Firebase
auto-creates a "Web application" type OAuth client, and Google's OAuth
policy only allows that client type to redirect to HTTPS URLs — Expo Go's
redirect is a custom `exp://` scheme, which Google rejects outright
regardless of configuration. Fixing this for real needs a development
build (`eas build --profile development`) with its own registered URL
scheme and a matching iOS/Android-type OAuth client — not more Expo Go
config. **Email/Password sign-in was added as a working stand-in**
(functional_specification.md §7's account table already lists password as
a legitimate non-OAuth path) and is what's been used for all testing so
far. Facebook OAuth hasn't been started at all yet.

### Known scaffold gaps (flagged, not silently skipped)

- Search and Recommendations rank over a fetched page of recent
  experiences client-side rather than a real search/recommendation
  index — Firestore has no full-text search and no such service is named
  in the tech stack.
- Trip cover-photo manual override and date-range-edit recategorization
  are implemented and tested in `TripRepository`, but `TripDetailScreen`
  doesn't yet expose UI for either.
- QR/link friend-add renders the shareable link as text rather than a
  scannable QR image (no QR-rendering library in the stack); pasting the
  link still works end-to-end.
