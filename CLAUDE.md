# CLAUDE.md — Amiva

This file guides Claude Code when working in this repository. Read `docs/functional_specification.md` and `docs/technical_specification.md` before making structural changes — they are the source of truth for product behavior and architecture. This file governs *how* code gets written, not *what* gets built.

---

## Project Summary

Amiva is a React Native (Expo) mobile app for social travel planning. Users log travel experiences scored across 8 fixed "travel style" categories, visualized as a radar chart, and matched to other users/content via cosine similarity. Backend is Firebase (Auth, Firestore, Storage, Cloud Functions, FCM), location data via Google Places/Maps API.

---

## Current Status (as of 2026-08-30) — read this before doing anything else

The full scaffold is built (all 5 modules, `packages/core`, all 12 Cloud
Functions) and a real Firebase dev project is live and deployed. The stuff
below is what a fresh session needs to know that isn't obvious from reading
code cold — hard-won tonight, don't rediscover it the slow way.

**Live project:** `amivadev` (see `.firebaserc`). Firestore (`us-central1`
— must stay single-region, see gotcha below), Storage, security rules, and
all 12 Cloud Functions are deployed. `apps/mobile/.env.local` holds the
real credentials and is gitignored on purpose — get it from a teammate who
has it (Youssef or Adam), don't try to regenerate it from scratch unless
you also have Owner/Editor access on the Firebase project yourself.

**What's actually been verified on a real device** (Expo Go, SDK 54, not
just typechecked): sign-up via email/password, onboarding (profile +
8-slider travel style + photo upload to Storage), privacy setting edit,
and a manual travel-style edit round-tripping through a callable Cloud
Function. **Nothing in Logbook, Planner, Discovery, or Social has been
live-tested yet** — expect bugs of the same *kind* found tonight (silent
failures from missing error handling, Firestore rules rejecting a query
the code assumed would work, etc.), not necessarily the same bugs.

**Google/Facebook OAuth sign-in does not work in Expo Go — this is
structural, not a bug to keep chasing.** Firebase auto-creates a "Web
application" type OAuth client; Google's OAuth policy only allows that
client type to redirect to HTTPS URLs, and Expo Go's redirect is a custom
`exp://` scheme, which Google rejects outright regardless of
configuration. Real fix is a development build (`eas build --profile
development`) with its own registered URL scheme and a matching
iOS/Android-type OAuth client — don't spend time on more Expo Go
workarounds for this specific error. Email/Password sign-in was added as
a working stand-in (functional_specification.md §7 already lists password
as a legitimate non-OAuth path, so this isn't scope creep) and is what
every test tonight used to authenticate.

**Gotchas worth knowing before you hit them again:**
- **`@amiva/core` is not an npm dependency of `functions/`, and must stay
  that way.** Firebase's remote Cloud Build reinstalls from
  `package.json` on every deploy and can't resolve a workspace-local
  package — it must stay resolved via esbuild's `--alias` (see
  `functions/package.json`'s `build` script) and a tsconfig `paths` entry,
  never added back to `dependencies`/`devDependencies`.
- **Cloud Functions callables can silently lack invoke permission.**
  Symptom: client is genuinely signed in, Firestore works fine, but a
  callable throws `unauthenticated [401]` — that's GCP IAM blocking the
  request before it ever reaches the function's own `context.auth` check,
  not an app bug. Check `gcloud functions get-iam-policy <name>` (or
  Console → Cloud Functions → function → Permissions) for an empty
  policy; grant `roles/cloudfunctions.invoker` to `allUsers`. `firebase
  deploy` usually sets this automatically on function creation but can
  skip it after an interrupted/partial deploy.
- **Firestore security rules can't gate a collection-query the way you'd
  gate a single-doc read.** If a read rule depends on per-document data
  (e.g. `privacySetting`), a `where(...)` query over that collection gets
  rejected outright — Firestore can't prove every possible match would
  pass the rule, so it refuses the whole query rather than filtering
  results. This is why username uniqueness is its own small
  `usernames/{username}` lookup collection instead of a query over
  `users` — same pattern applies to any other "look up by a field, gated
  by privacy" case.
- **React Query v5 throws if a `queryFn` ever resolves `undefined`**
  (v4 allowed it silently). Repositories use `T | undefined` for "not
  found" — wrap those calls with `orNull` (`apps/mobile/src/lib/
  queryHelpers.ts`) at the query boundary, don't return the repository
  result directly.
- **Metro needs `apps/mobile/metro.config.js`'s monorepo config to run at
  all** (`watchFolders` + `nodeModulesPaths`) — without it, expect
  bundling to succeed but the app to crash on a real device with an empty
  native-module registry, since Metro can end up serving two different
  copies of `react-native`.
- **`.gitignore` patterns must be anchored.** A bare `lib/` here once
  silently excluded `apps/mobile/src/lib/` and all of
  `functions/src/lib/` (the entire business-logic layer) from every
  commit for a good chunk of tonight. If a whole directory of expected
  files is missing after a fresh clone, check `git check-ignore -v
  <path>` before assuming it's a fetch/pull problem.
- **The Expo Go SDK on a physical device only ever tracks the latest
  release** (App Store won't install older versions) — if `expo start`
  reports an SDK mismatch, the project needs upgrading
  (`npx expo install expo@latest` then `npx expo install --fix`), not the
  device downgrading.

**Suggested next step for "start fixing bugs":** log a trip + experience
in the Logbook module for real (the original vertical-slice target:
Account → Logbook → Discovery feed showing that experience with a match
%) — that exercises Google Places autocomplete, photo upload, the
standalone/trip categorization rule, and the `onExperienceCreated`
travel-style-decay trigger all at once, and is the most likely place to
surface the next real bug.

---

## Repository Structure

Monorepo layout so scoring logic is shared between client and Cloud Functions:

```
/apps
  /mobile              # React Native (Expo) app
/functions             # Cloud Functions for Firebase
/packages
  /core                # Shared types + pure logic (TravelStyleVector, similarity fns) — no side effects, no Firestore imports
/docs
  functional_specification.md
  technical_specification.md
CLAUDE.md
```

**Rule:** Anything in `/packages/core` must be pure (no Firebase SDK, no React, no I/O). Both `/apps/mobile` and `/functions` depend on it. This is where the cosine similarity function and `TravelStyleVector` type live — defined once, used everywhere, unit-tested once.

### `/apps/mobile` internal structure

```
/apps/mobile/src
  /modules
    /logbook           # Country > City > Experience drill-down, trips
    /planner            # Planned trips, itinerary items, completion flow
    /discovery          # Feed, recommendations, search, trending
    /social              # Friends, compatibility, group trips, notifications
    /account             # Auth, onboarding sliders, settings, privacy
  /components           # Shared/presentational components only (no data fetching)
  /hooks                 # Shared hooks (e.g., useMatchScore, useTravelStyle)
  /repositories           # Data-access layer, one per Firestore collection
  /navigation
  /theme                  # Design tokens (see Style Guide below)
```

Each feature module owns its own screens, module-local components, and module-local hooks. Shared, reusable pieces only get promoted to top-level `/components` or `/hooks` once used by 2+ modules — don't pre-abstract.

---

## Engineering Principles

1. **Repository pattern, always.** No component or screen calls the Firestore SDK directly. Every collection has a repository (e.g., `ExperienceRepository.getByTripId(tripId)`) that the rest of the app depends on. This makes the data layer swappable and testable, and keeps query logic in one place per entity instead of duplicated across screens.

2. **Server is the source of truth for computed values.** Travel style scores, similarity/match percentages, and trending rankings are computed in Cloud Functions, not the client. The client may compute a similarity score locally for instant preview UI (e.g., live-updating a match estimate while a user drags sliders before saving), but the **persisted, displayed-everywhere-else value always comes from the server.** Never let client-side computation silently become the source of truth for something another user will see.

3. **Strategy pattern for scoring.** The match-scoring function is accessed through a single interface (e.g., `MatchScorer.score(vectorA, vectorB)`), currently implemented via cosine similarity. Don't hardcode the cosine formula inline at call sites — call the interface, so the underlying algorithm can be swapped later without touching UI or Cloud Function call sites.

4. **Single Responsibility for Cloud Functions.** One function, one job. Don't build a monolithic "onWrite" handler that branches into unrelated concerns (style decay vs. notifications vs. trending). Split them, even if it means multiple triggers on the same collection.

5. **Dependency inversion in the client.** Screens/components consume hooks (`useMatchScore()`, `useTravelStyle(userId)`, `useTrip(tripId)`), not raw Firestore calls or even raw repository calls directly in JSX. Hooks wrap repositories + React Query. This keeps components testable and keeps Firestore specifics out of the UI layer entirely.

6. **DRY on types and constants.** The 8 category names, the `TravelStyleVector` type, and any tunable constant (decay rate, max step, high-match threshold) live in one place in `/packages/core` and are imported everywhere — never redefined or hardcoded per-file.

7. **Extensibility over premature abstraction.** Follow the specific extensibility notes in the technical spec (e.g., the `Place` entity is already structured to support future POI pages) but don't build speculative features or config for things not in the spec. Build what's specified, shaped so the *known* future additions don't require a rewrite.

8. **No business logic in Cloud Function triggers themselves.** Triggers should be thin — extract the actual logic (e.g., the decay algorithm) into a plain function in `/packages/core` or a `/functions/src/lib` module, and unit-test that function directly rather than only through emulated triggers.

---

## Code Style

- **TypeScript everywhere**, strict mode on. No `any` without a comment justifying it.
- Functional React components with hooks only — no class components.
- Prefer composition over inheritance throughout.
- File naming: `PascalCase.tsx` for components, `camelCase.ts` for hooks/utils/repositories.
- Every repository method and every `/packages/core` function should have a corresponding unit test.
- Firestore collection/field names use `camelCase`, matching the TypeScript interfaces in the technical spec exactly — don't invent alternate field names during implementation.

---

## Style Guide (Visual)

- **Aesthetic:** Clean, modern, minimalist.
- **Palette:** Warm neutral base (off-white/sand backgrounds, charcoal text) with a single vibrant accent color (coral or teal — pick one and apply consistently) used for: match-score percentages, radar chart fills, primary CTAs, active nav states. Avoid multiple competing accent colors.
- **Radar charts:** Consistent component used everywhere a travel style appears (own profile, experience detail, friend compatibility detail, group trip view). Build this as one shared, reusable `RadarChart` component in `/apps/mobile/src/components` — don't reimplement it per screen.
- **Typography:** Clean sans-serif, clear hierarchy, generous whitespace — avoid dense/cluttered layouts given the amount of data (matrices, stats) being displayed.
- Design tokens (colors, spacing, type scale) live in `/apps/mobile/src/theme` and are the only source of style values — no inline hex codes or magic spacing numbers in components.

---

## What NOT to Build (MVP Exclusions)

Per the functional specification's explicit exclusions — do not implement these even if they seem like natural additions:

- Likes or comments on posts (save is the only engagement action)
- In-app people/user search (friends added via contacts sync or QR/link only)
- Map view of the logbook
- Trip revisit/duplication as a template
- Day-by-day itinerary scheduling or travel-time logistics in Planner
- Budget tracking
- Any built-out partnerships/promotions UI (architecture hooks only, per technical spec §7)
- Data import from Facebook/Instagram (OAuth for sign-in only)

If a task seems to imply one of these, stop and flag it rather than building it.

---

## Working Process for Claude Code

1. Before implementing a feature, check both spec docs for the relevant section — functional spec for behavior, technical spec for data model/algorithm.
2. Build `/packages/core` types and pure functions (travel style vector, similarity scoring) **first**, before UI, since both the mobile app and Cloud Functions depend on them.
3. Build repositories next, one per collection, matching the schemas in the technical spec exactly.
4. Build Cloud Functions for anything marked "server is source of truth" in the technical spec (style decay, compatibility scoring, notifications) before wiring up client UI that displays those values.
5. Build UI last, using hooks that wrap repositories/React Query — never wire a screen directly to Firestore.
6. Write unit tests alongside `/packages/core` and repository code as you go, not as an afterthought pass.
