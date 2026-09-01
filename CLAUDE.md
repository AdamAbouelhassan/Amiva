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

**UI/UX overhaul (2026-08-30):** the whole mobile app was re-skinned onto a
brand design system. What changed that you must not fight:
- **Theming is `useTheme()`, not static imports.** `import { colors,
  typography } from '../theme'` no longer exists. Components call
  `const t = useTheme()` and read `t.colors.*` (semantic), `t.type.*`
  (typography, colour baked per theme), `t.category(cat)` / `t.categoryText(cat)`
  (fills vs AA-safe text), `t.isDark`, `t.mode`, `t.setMode`. Static, theme-
  independent scales (`spacing`, `radius`, `shadow`) are still plain imports
  from `../theme`. Tokens live in `theme/{tokens,themes}.ts`; **full light +
  dark**. Never hardcode a hex in a component.
- **`<TravelStyleRadar>`** (was `RadarChart`) and **`<MatchScoreBadge>`**
  (was `MatchBadge`, opens `<MatchDetailSheet>` on tap) are the two shared
  signature components — reuse, don't reimplement. Radar axis *display*
  order is `RADAR_AXIS_ORDER` (theme), deliberately ≠ the canonical
  `TRAVEL_STYLE_CATEGORIES` in core (which stays locked to cosine-vector
  alignment).
- **Reanimated 4** drives the radar morph and the badge count-up. Two
  startup-crash traps, both surfacing as `Exception in HostFunction:
  <unknown>` at `[runtime not ready]`:
  1. **Never add the worklets/reanimated Babel plugin to
     `babel.config.js`** — `babel-preset-expo` 54 auto-adds it when
     `react-native-worklets` is installed; a manual entry double-transforms
     every worklet.
  2. **`react-native-worklets` must be pinned to `0.5.1` and
     `react-native-reanimated` to `4.1.1`** — the exact versions in
     `expo/bundledNativeModules.json` / Expo Go SDK 54. `npx expo install
     react-native-reanimated` alone resolves reanimated to `~4.1.7`, which
     drags in worklets `0.8.x`, and the 0.5↔0.8 JSI ABI change crashes
     against Expo Go's native `0.5.1`. Run `npx expo install --check` after
     touching these.
  Fonts: **Baloo 2** (display) + **Inter** (body) via `@expo-google-fonts`,
  loaded in `App.tsx`. Motion is gated by `useReducedMotion()`.
- **Brand art** is in `apps/mobile/assets/brand/` — `amiva-icon-card.png`
  (splash), `amiva-mobile-icon.png` (OS icon), `amiva-mark-gradient.png`
  (in-app, via `<BrandMark>`). They are still raw flattened rasters; the
  user swaps in cleaned/transparent versions at the SAME paths later.
  `app.config.js` already points at them. Don't crop/composite them here.
- Jest is unaffected (ts-jest, node env, no component render tests). `npx
  tsc --noEmit` + `npx expo export` both clean.

**Discovery redesign (2026-08-30):** Discovery is now 3 in-page
`<SegmentedControl>` tabs on one `DiscoveryScreen` (no landing screen, no
per-tab routes) — **Local** (Google-Places recs, was "For You"),
**Trending** (`getTrending` → a flat popularity-ranked list now, not
category-sectioned), **Friends** (was "Feed" — now a chronological
friend-*activity* feed: logged experiences/trips, saves, completed planned
trips, new connections, via the new `getFriendsActivity` callable). The
old `getFeed` (matched-experience feed) is deleted. This intentionally
diverges from functional_specification.md §5's Feed/Trending description —
product decision, not drift. `functions/src/lib/feed.ts` is now just the
shared `FeedCandidate`/`FeedStore` types.

**Trip / PlannedTrip restructure (2026-08-30):** a Trip is no longer
"country + date range" — it's a plain user-authored container: **one
`location`** (`location: string` label + scalar `country` / `city?`;
`countries: string[]` is gone), **required** `startDate` / `endDate`,
`name` (auto-fills from `generateTripName(location, range)`, UI label
"Trip name"), and optional `notes` / `accommodation` / `photoUrls`.
"By country" (`LogbookHomeScreen` → `CountryDetailScreen`) aggregates
**trips + experiences** by `trip.country`. The Firestore client sets
`ignoreUndefinedProperties: true` (`firebase/client.ts`) so repo patch
objects can carry sparse fields; repos still write `null` (not
`undefined`) for cleared optional fields. Trip photos upload to
`tripPhotos/{uid}/…` (`lib/uploadTripPhotos.ts`); `storage.rules` now uses
`{allPaths=**}` tails on all three photo prefixes (the old
`experiencePhotos/{uid}/{experienceId}/{fileName}` rule never matched the
client's flat `{uid}/<ts>-<i>.jpg` upload path — latent bug).
Experiences attach to trips **explicitly only** — a picker in
`CreateExperienceScreen` / "Add experience to this trip" on
`TripDetailScreen`; there is no auto-categorization, no
standalone-experience rule, no date-range recategorization
(`findOwningTrip` / `canExperienceBeStandalone` /
`computeTripRecategorization` deleted from `@amiva/core`). This
intentionally diverges from functional_specification.md §3.2 — product
decision, tracked here like the Discovery §5 divergence. `plannedTrips`
has the **same field shape** (a planned trip is a future trip) plus its
Planner extras (`collaboratorIds` / `status` / `itemIds` / `completedAt`);
they stay **two collections**. Shared UI: `<TripFormFields>` (all 4
create/edit screens), `<DateField>` / `<DateRangeField>` (the **only**
`@react-native-community/datetimepicker` importers — minimal collapsed
field that expands the picker on tap; used by every date input in the
app), `<PhotoGalleryPicker>`. `convertPlannedTripToLogbook` now creates
one fresh Logbook trip mirroring the planned trip. `trips` /
`plannedTrips` / `plannedTripItems` Firestore data was wiped on the
restructure. `firestore.indexes.json`: `trips` + `plannedTrips` list
queries now order by `createdAt` (was `startDate`, now nullable).

**Saved items + "Log this" (2026-08-31):** `SavedScreen` (Discovery stack,
"Saved" header button on `DiscoverHome`) is **one merged newest-first list**
(`useSavedItems`) of saved Amiva experiences (`saves`) and saved Google
Places (`savedPlaces`) — the user treats a recommended place and an
experience as the same thing. Each row has a photo, remove, and "Log this".
Save/unsave hooks live in `src/hooks/useSaves.ts` (promoted out of
`modules/planner`). **"Log this"** (`useLogExperienceNav` — `fromExperience`
/ `fromPlace`; also on `FeedItemCard`, `ExperienceDetailScreen`,
`PlaceRecommendationCard`) opens `CreateExperience` pre-seeded
(`ExperiencePrefill` nav param: place + title + categoryScores).
`CreateExperienceScreen` reads `route.params.prefill`; `PlacesAutocomplete`
takes `initialPlace` and renders predictions as a plain `View.map` (was a
`FlatList` — nested-VirtualizedList warning inside scroll screens).
`CreateExperience` is registered in the Discovery stack too (reuses the
Logbook screen). `savedPlaces` docs gained optional `lat` / `lng` /
`photoRef` (older ones lack them → `fetchPlaceCoords` re-resolves coords on
"Log this", thumbnail just omitted).

**Query cache policy (2026-08-31):** `lib/queryClient.ts` — `staleTime`
5 min, `gcTime` 1 h, `refetchOnWindowFocus`/`refetchOnReconnect` off. The
app is navigation-heavy; within 5 min, revisiting a screen or a profile is
served from cache. Mutations still `invalidateQueries` for immediate
refresh. (No AsyncStorage persistence yet — repo query data holds `Date`
objects that JSON round-tripping would break; needs a custom
serializer first.) **Pull-to-refresh** is `useRefresh()`
(`hooks/useRefresh.ts`) → `queryClient.refetchQueries({ type: 'active' })`
(re-fetches everything mounted, Facebook-style); wire `{ refreshing,
onRefresh }` into `ScreenContainer` (scroll screens — it renders the
`RefreshControl`) or a `FlatList`'s `refreshControl`. Every content/list/
detail screen has it; create/edit forms don't.

**Planner rework (2026-08-31):** the plan detail screen is **itinerary
only** — the old "Add from your saves / saved places" lists are gone.
Itinerary items are added from **`AddPlacesToPlanScreen`** (a nearby-Google-
Places search scoped to the trip's location, reusing the
`getPlaceRecommendations` callable; `PlaceRecommendationCard` takes
`onAdd`/`added` for "Add to plan" mode). `plannedTripItems` gained
denormalised `city/country/photoRef/lat/lng`. **Planning → Upcoming** is
derived (`lib/plannedTripStatus.ts` — `displayPlannedTripStatus`, 14-day
window) with a manual toggle; only the *stored* `status` field is written.
**Completion** (`CompletePlannedTripScreen`) collects **photos only**;
`convertPlannedTripToLogbook({ plannedTripId, photoUrls })` creates one
Logbook trip mirroring the plan + photos, sets
`plannedTrips.convertedToTripId`, no per-item experience conversion (user
logs into the new trip afterwards). Completion is gated to after
`endDate` (`canComplete`). **Revert**: new `revertCompletedTrip` callable
deletes that Logbook trip, detaches (never deletes) any experiences logged
into it, restores `status: 'planning'`. The planner create/edit form hides
the photo picker (`<TripFormFields photos={false}>`). Diverges from
functional_specification.md §4.2/§4.3 — documented product decision.

**Tab motion + icon actions (2026-08-31):** the bottom tab bar is
`position:'absolute'` + **opaque** (`t.colors.surface`, hairline top
border) — scroll content clears it via **`hooks/useTabBarInset.ts`**
(`BottomTabBarHeightContext`, 0 outside a tab nav) wired into
`ScreenContainer` (scroll) + every `scroll={false}`+FlatList screen's
`contentContainerStyle`. `tabBarShowLabel:false`; **no text labels** —
`NavIcon` is Ionicons, hollow (`*-outline`) when inactive / filled when
`focused` (Spotify-style). `MainTabs` wraps each tab in
**`components/FocusFade.tsx`** (fade+rise on focus — module-level
components, never inline render props). In-page tabs (Discovery / Logbook
/ FriendDetail) render panes through **`components/TabPanes.tsx`**
(kept-mounted, cross-dissolve). `SegmentedControl` has a spring-sliding
solid pill (`radius.chip - 3`, concentric; API unchanged). Card `Save` /
`Log this` / `Share` / `Remove` are **`components/IconButton.tsx`**
(Ionicons via `@expo/vector-icons`, `Ionicons.font` in `App.tsx`
`useFonts`; `tone="danger"` = red glyph on `colors.dangerMuted`).
`PlaceRecommendationCard` + saved-place rows: **tapping the card opens
Google Maps** (the "Maps" button is gone).

**Native Liquid Glass was tried and dropped (2026-08-31):** `expo-glass-effect`
`GlassView` only renders real glass on an iOS 26 device and looked broken
in the fallback / on-device (square pill, invisible on the tab bar), so
`GlassSurface.tsx` was deleted and the surfaces are plain solid. `expo-glass-effect`
/ `expo-blur` remain installed but unused. Don't re-add a glass wrapper
without an iOS 26 test device.

**Screen-body header actions (2026-08-31):** the "Saved" (Discovery) and
"Settings" (Profile) actions moved from `headerRight` into the screen
body as plain accent-text `Pressable`s — iOS 26 wraps native nav-bar
buttons in an unwanted bordered glass capsule. New `headerRight` actions
should go in the body too.

**Tab home screens have no native header (2026-09-01):** the 5 first
screens (`DiscoverHome`, `LogbookHome`, `PlannerOverview`, `FriendsList`,
`Profile`) set `headerShown:false` and render their own `displayMd` title
in-body (was showing the title twice). They pass `safeAreaTop` to
`ScreenContainer` (or `edges={['top',...]}` on a raw `SafeAreaView`) for
the notch inset. Nested/pushed screens keep their native header + back
button.

**Dangerous buttons are red (2026-08-31):** `<Button variant="danger">`
(red outline) for sign-out / revert / any high-regret action; delete
links stay red text (`colors.danger`). `colors.dangerMuted` is the faint
red disc behind `IconButton tone="danger"`.

**Date range picker (2026-08-31):** `<DateRangeField>` expands to one
**`components/RangeCalendar.tsx`** (custom month grid, no native picker) —
tap once for start, again for end, third tap restarts. `<DateField>`
(single date) still wraps `@react-native-community/datetimepicker`.

**Images + friend profiles (2026-08-31):** every network image now goes
through **`components/AppImage.tsx`** (wraps `expo-image` — real
memory+disk cache so lists don't re-download on remount — with a pulsing
`surfaceAlt` skeleton until `onLoadEnd`, gated by `useReducedMotion`).
Plain RN `<Image>` only survives for local `require()` assets
(`BrandMark`). **`FriendDetailScreen`** is now 3 tabs — Compatibility
(overlaid radar + % + top-3 `CategoryChip`s, **no** `TravelStyleValueList`
number dump), Trips (their visible logbook trips + non-completed plans, via
`ProfileTrip`/`ProfilePlannedTrip` display cards), Logbook (their visible
experience ids → `FeedItemCard`). Backed by the new **`getUserProfileContent`**
callable (`lib/userProfileContent.ts` + adapter) — Admin-SDK, the
enforcement point: per-trip/plan `visibility` via `isVisibleTo` (+ planned-
trip collaborators), experiences gated by the owner's *account*
`privacySetting` (they have no per-doc visibility). Payload never carries
`visibility`/`collaboratorIds`. `ExperienceDetail` + `CreateExperience` are
now also registered in the Social stack (reused from Logbook).

**Delete (2026-08-31):** experiences, Logbook trips, and planned trips can
all be deleted by their owner — destructive `Pressable` on the Edit screen
(`EditExperienceScreen` / `EditTripScreen` / `EditPlannedTripScreen`), plus
the completed-plan card on `PlannedTripDetailScreen`. `TripRepository.delete(tripId, ownerId)`
**detaches** attached experiences (`tripId → null`), never deletes them —
and the `ownerId` filter on that experiences query is **required**: the
`experiences` read rule does a per-doc `get(users/…)`, so a bare
`where('tripId','==')` collection query is rejected by rules (same gotcha
as the privacy-query one). `ExperienceRepository.listByTrip` takes
`ownerId` for the same reason (sorts client-side, no composite index).
`PlannedTripRepository.delete` also removes the `plannedTripItems` (items
first, then the parent, so the item rule's parent `get()` still resolves).
Existing firestore.rules already permit owner update/delete — no rules
change. Nav: delete → `navigation.pop(2)` (Edit modal + the now-stale
detail screen).

**Experiences: optional photo + editing (2026-08-31):** logging an
experience no longer requires a photo — if the user adds none,
`photoUrls[0]` defaults to the place's Google photo
(`SelectedPlace.photoRef` → `placePhotoUrl`, added to `PlacesAutocomplete`
details fetch + threaded through `ExperiencePrefill` / `useLogExperienceNav`).
New **`EditExperienceScreen`** (Logbook + Discovery stacks, "Edit" on
`ExperienceDetailScreen` for the owner) edits title/notes/rating/photos/
category/date via `useUpdateExperience` → `ExperienceRepository.update`.
Photo upload generalised to `lib/uploadPhotos.ts` `uploadPhotoSet(uris,
pathPrefix)` (`uploadTripPhotos` now delegates). **Rating does not affect
travel style** — only `categoryScores` feeds `computeStyleAdjustment`
(spec §3.3: rating is "separate from the category sliders").

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
  not an app bug. Confirm by curling the endpoint unauthenticated
  (`curl -i https://us-central1-amivadev.cloudfunctions.net/<name>`): a
  Google-Frontend `403 Forbidden` HTML page (not your function's JSON
  error) means `allUsers` is missing `roles/cloudfunctions.invoker`. The
  function's IAM policy will be empty (`:getIamPolicy` → just an etag).
  - **`firebase deploy` does NOT fix this for a function that already
    exists** — the CLI only sets the `allUsers` invoker binding on first
    *creation*, never on an update, and prints no warning. Redeploying a
    broken function is a no-op for IAM. Deleting + recreating hits the
    same wall (see next point).
  - **Fixing it needs Owner / Cloud Functions Admin — plain Editor
    can't** (`cloudfunctions.functions.setIamPolicy` isn't in the Editor
    role). `aabouelh@gmail.com` is now Owner of `amivadev` (was Editor
    until 2026-08-30). Per callable, run
    `gcloud functions add-iam-policy-binding <name> --region=us-central1
    --project=amivadev --member=allUsers --role=roles/cloudfunctions.invoker`
    (or Console → the function → Permissions → Grant access → `allUsers`
    = Cloud Functions Invoker). No gcloud in the Claude Code env — the
    working alternative is a `:setIamPolicy` POST to the Cloud Functions
    v1 REST API with the Firebase CLI token from
    `~/.config/configstore/firebase-tools.json` (`cloud-platform` scope),
    body `{"policy":{"bindings":[{"role":"roles/cloudfunctions.invoker","members":["allUsers"]}]}}`.
  - This actually happened 2026-08-30: all 8 callables lost the binding
    at once and were fixed via that REST loop. If it recurs and the
    setIamPolicy call fails with "users named in the policy do not belong
    to a permitted customer", **domain restricted sharing**
    (`constraints/iam.allowedPolicyMemberDomains`) has been enabled on
    the org — that org policy retroactively strips `allUsers` bindings.
    Real fix is an org-level exception; there's no app-side workaround.
    (It was NOT the cause in the 2026-08-30 incident — the bindings had
    just been wiped.)
  - The 8 callables affected: `updateTravelStyleManual`,
    `computeMatchScore`, `computeGroupRecommendation`,
    `convertPlannedTripToLogbook`, `getTrending`, `matchContacts`,
    `onFriendAdded`, `upsertPlace`. (Background triggers don't need
    invoker.)
- **Firestore security rules can't gate a collection-query the way you'd
  gate a single-doc read.** If a read rule depends on per-document data
  (e.g. `privacySetting`), a `where(...)` query over that collection gets
  rejected outright — Firestore can't prove every possible match would
  pass the rule, so it refuses the whole query rather than filtering
  results. This is why username uniqueness is its own small
  `usernames/{username}` lookup collection instead of a query over
  `users` — same pattern applies to any other "look up by a field, gated
  by privacy" case.
- **A read rule that dereferences `resource.data.*` denies a `get` on a
  MISSING doc** — `resource` is `null`, so `resource.data.userId` errors
  and the whole read is refused (client sees `permission-denied`, not
  "doesn't exist"). Bit `saves` / `savedPlaces` on 2026-09-01: the
  "is this saved?" check (`getDoc` of `{uid}_{id}`) threw for any *unsaved*
  item, so React Query kept the last `true` and the bookmark icon stuck
  filled after an un-save. Fix: rule has an explicit `resource == null`
  branch gated on the id prefix (`saveId.split('_')[0] == request.auth.uid`;
  Firebase uids never contain `_`), plus `isSaved()` swallows the error →
  `false` as a belt-and-braces client guard.
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
