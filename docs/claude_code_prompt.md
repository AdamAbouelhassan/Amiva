# Claude Code Prompt — Amiva MVP Build

Copy everything below this line into Claude Code as your initial instruction.

---

## Task

Build the initial codebase for **Amiva**, a React Native mobile app for social travel planning. This repository includes three reference documents that are the authoritative source of truth for this build — read all three in full before writing any code:

- `docs/functional_specification.md` — defines all product behavior, business rules, and feature scope (including explicit MVP exclusions). This governs *what* the app does.
- `docs/technical_specification.md` — defines the technology stack, data model (Firestore schemas), core algorithms (cosine similarity matching, travel-style decay, feed ranking, group recommendation blending), API/Cloud Functions surface, and security rules. This governs *how* it's built.
- `CLAUDE.md` — defines repository structure, engineering principles, design patterns to apply, code style, and the visual style guide. This governs *conventions* for every file you write.

Do not deviate from the technology choices, data model, or algorithms specified in the technical specification. Do not build any feature listed under "Out of Scope for MVP" / "What NOT to Build" in the spec docs. If you find an ambiguity the docs don't resolve, make the most reasonable assumption consistent with the rest of the spec, note the assumption in a code comment, and continue rather than stopping.

## Build Order

Follow the working process defined in `CLAUDE.md` §"Working Process for Claude Code":

1. **Scaffold the monorepo** — `/apps/mobile` (Expo + TypeScript), `/functions` (Cloud Functions for Firebase, TypeScript), `/packages/core` (shared pure logic), per the structure in `CLAUDE.md`.
2. **`/packages/core` first** — implement the `TravelStyleVector` type, the 8 fixed categories, the cosine similarity function (as a swappable `MatchScorer` strategy interface per the Strategy pattern), and the travel-style decay/adjustment algorithm as pure, unit-tested functions. Nothing here should import React or the Firebase SDK.
3. **Firestore schema + repositories** — implement the collections exactly as defined in the technical specification (`users`, `places`, `trips`, `experiences`, `saves`, `plannedTrips`, `friends`, `notifications`), with a repository class/module per collection in `/apps/mobile/src/repositories`, following the Repository pattern described in `CLAUDE.md`.
4. **Cloud Functions** — implement each function listed in the technical specification's API surface table (`onExperienceCreated`, `onSaveCreated`, `onFriendAdded`, `onTravelStyleChanged`, `computeMatchScore`, `convertPlannedTripToLogbook`, `getTrending`, `sendNotification`), each as a thin trigger calling into a testable function in a `/functions/src/lib` module, per the Single Responsibility principle in `CLAUDE.md`.
5. **Firebase Authentication** — Google + Facebook OAuth sign-in flows, and the account creation / onboarding flow capturing all fields listed in the functional specification §7 (name, email, username, optional phone, optional profile photo, the 8 travel-style onboarding sliders, and default privacy setting).
6. **Firestore Security Rules** — implement per technical specification §6 (privacy-setting-gated reads, server-only writes for computed fields, no client-exposed raw phone number matching).
7. **Client UI, module by module**, using hooks that wrap repositories + React Query (never direct Firestore calls from components):
   - **Account module** — auth, onboarding sliders, settings (including manual travel-style editing, which resets the baseline per the decay algorithm), privacy controls.
   - **Logbook module** — Country → City → Experience drill-down, trip creation/editing (including date-range edit triggering recategorization), experience CRUD (location via Google Places autocomplete, up to 5 photos, title, private notes, 1–5 star rating, category sliders, EXIF-or-manual date), standalone-experience business rule, trip cover photo logic, filtering, aggregate stats, chronological timeline view, three posting granularities (experience / city / trip).
   - **Planner module** — planned trip CRUD with status (`Planning → Upcoming → Completed`), multi-trip overview, adding items from saved-then-recommended sources, unordered itinerary checklist (no scheduling), completion flow prompting logbook conversion with skip option.
   - **Discovery module** — social feed with the tiered ranking algorithm (friend/non-friend × high/low match), save-only engagement (no likes/comments — do not build these), recommendations surface, search (text + location + category, personalized ranking, recent-search history capped at 10), trending (global / location-scoped / personalized).
   - **Social module** — friends via contacts sync and QR/shareable link (no in-app people search), direct-add with no invite/accept step, friend compatibility score display (percentage + detail view with overlaid radar charts, mutual/two-way), group trip collaboration (unlimited collaborators, shared-doc-style co-editing, group recommendation blending with per-individual segmentation on high divergence per the technical spec's variance-threshold logic), notifications (trip completed, friend added, group trip joined, new match — and nothing else).
   - **Shared `RadarChart` component** — one reusable implementation used everywhere a travel style is visualized (own profile, experience detail, compatibility detail, group trip view), per the visual style guide in `CLAUDE.md`.
8. **Apply the visual style guide** from `CLAUDE.md` throughout: clean/modern/minimalist, warm neutral base palette with a single consistent accent color, design tokens centralized in `/apps/mobile/src/theme`, no inline magic values.

## Testing Expectations

- Unit tests for every function in `/packages/core`, especially the cosine similarity implementation and the decay/adjustment algorithm (test the weighting difference between logged vs. saved, the recency decay, the per-step cap, and the baseline-reset-on-manual-edit behavior explicitly).
- Unit tests for repository methods.
- Cloud Function business logic should be tested as plain functions (extracted from the trigger wrapper), not only via emulator-dependent trigger tests.

## Deliverable for This Session

Produce a working scaffold with the architecture, data layer, Cloud Functions, and core screens wired end-to-end for at least one full vertical slice — recommend starting with **Account (onboarding) → Logbook (create a trip and log one experience) → Discovery (feed showing that experience with a match score)** — so the core scoring pipeline (client → repository → Cloud Function → Firestore → back to client) is proven out before building every remaining screen. Then continue building out the remaining modules in the order listed above.

Ask me before making any decision that contradicts something explicitly stated in the three reference documents. Otherwise, proceed autonomously through the build order above.
