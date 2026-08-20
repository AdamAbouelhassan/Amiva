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
npm install                          # installs all workspaces
cp apps/mobile/.env.example apps/mobile/.env.local   # fill in Firebase/Places/OAuth keys
```

Requires a Firebase project with Auth (Google + Facebook providers),
Firestore, Storage, and Functions enabled, plus a Google Places API key.
Update `.firebaserc`'s `default` project id.

## Running

```bash
npm run test                         # all workspaces
npm run test:core / test:functions / test:mobile

npm run typecheck --workspaces --if-present

npm run build -w functions           # compile Cloud Functions
firebase deploy --only functions,firestore:rules,firestore:indexes,storage

npm start -w apps/mobile             # expo start
```

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
- Contacts-sync and OAuth flows are wired for real but unverified against
  a live Firebase project / device — no credentials exist in this
  environment.
