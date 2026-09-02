# Claude Code Prompt — Amiva Travel-Style Taxonomy Migration (8 fixed categories → Google Places' 19 categories + 477 subcategory types)

Copy everything below this line into Claude Code as your instruction for this change.

---

## Task

Migrate Amiva's travel-style scoring system from the current **8 hand-picked categories** (Adventure, Luxury, Culture, Foodie, Relaxation, Social/Nightlife, Nature, Budget/Backpacker) to **Google Places' own 19 top-level categories**, with Google's **477 place types** layered in underneath as subcategories that drive the scoring algorithm. This repo already has `docs/functional_specification.md`, `docs/technical_specification.md`, and `CLAUDE.md` as governing references — this prompt supersedes only the parts of those documents that describe the 8-category travel-style model; everything else in them (Logbook, Planner, Discovery, Social, the Repository/Strategy/Single-Responsibility patterns, the visual style guide) still applies unchanged.

Two new data files are provided at the repo root of this task and should be moved into `packages/core/data/`:
- `googlePlacesCategories.json` — the 19 categories, each `{ id, label }`. `id` values (e.g. `food_and_drink`, `entertainment_and_recreation`) are the new fixed key set — treat this file as the literal source of truth for spelling/casing, don't retype the ids by hand.
- `googlePlacesTypes.json` — all 477 subcategory types, each `{ type, category, label }`, where `category` is one of the 19 ids above. This is Google's own Table A grouping, snapshotted 2026-09-02 from `https://developers.google.com/maps/documentation/places/web-service/place-types`. Google adds types periodically — don't treat this as permanently frozen; a periodic re-diff against that URL is worth a backlog ticket, not a blocker now.

## Decisions already made — implement these, don't re-litigate them

1. **No data migration.** This is pre-launch with no real user data. Do a clean schema swap — redefine the types, don't write backfill/crosswalk logic for existing `users.travelStyle` or `experiences.categoryScores`.
2. **Manual rating survives only at onboarding and in Settings, now across all 19 categories.** `TravelStyleSliders` goes from 8 sliders to 19 (order them by `googlePlacesCategories.json`'s array order). Onboarding and `EditTravelStyleScreen` keep working exactly as today, just wider. Manually editing in Settings still resets the baseline and the decay clock, per the existing behavior in the functional spec.
3. **Logging and saving an experience is no longer manually rated by category at all.** Remove the category-slider step from `CreateExperienceScreen` and `EditExperienceScreen`. An experience's (and a save's) `categoryScores` vector is now computed algorithmically from the linked Place's `googlePlaceType`, full stop — see below. The 1–5 star rating stays as its own separate field on the experience (unchanged), but now also feeds the scoring algorithm (see the star-rating section).
4. **Types are backend scoring inputs only.** Do not build any subcategory-based UI — no filter chips, no type icons, no "browse by type" screens. The 477 types exist solely to compute a 19-dimension category vector. If a later task wants types surfaced in UI, that's a separate, explicitly-scoped change.

## What actually changes, by layer

### `packages/core` — the source of truth

- Replace the 8 named `TravelStyleVector` keys with a `CategoryId` union type generated from `googlePlacesCategories.json`'s `id` values, and change `TravelStyleVector` from a fixed-property interface to `Record<CategoryId, number>` (still a closed, fixed key set — just a map instead of 19 hand-typed properties, since hand-typing 19 properties and keeping them in sync with the JSON is exactly the kind of drift this migration should avoid). Export `CATEGORY_IDS: readonly CategoryId[]` for iteration order (sliders, radar axes, etc.).
- **Grep the whole repo for the 8 old literal keys** (`adventure`, `luxury`, `culture`, `foodie`, `relaxation`, `socialNightlife`, `nature`, `budgetBackpacker`) and update every reference — component labels, `topCategories()` in `profileInsights.ts`, test fixtures, seed data, everything. There will be more of these than the obvious central type definition.
- Add a `PlaceTypeId` type generated from `googlePlacesTypes.json`'s `type` values, and a typed accessor over the 477-row table (`getCategoryForType(type): CategoryId`, etc.). This table is data, not logic — keep it as the imported JSON plus thin typed wrappers, not hand-copied into TypeScript.

### The type → category weight table (the actual new algorithm)

This is the piece that decides, given a Place's `googlePlaceType`, what 19-dimension vector that place contributes. Two-tier design:

**Default rule (covers all 477 types with zero manual effort):** a type's weight vector is `{ [type.category]: 1.0 }` — i.e., it inherits Google's own grouping from `googlePlacesTypes.json` at full weight, zero elsewhere. This is mechanical and needs no judgment calls.

**Override table (a curated exception list, hand-tuned for travel-style accuracy):** some types genuinely span two categories for a traveler's purposes even though Google files them under only one. Start with this table — these are real overlaps identified by inspection, not guesses to double-check, but the exact split numbers are a first pass, tunable later:

```ts
export const CATEGORY_WEIGHT_OVERRIDES: Partial<Record<PlaceTypeId, Partial<Record<CategoryId, number>>>> = {
  historical_landmark:        { entertainment_and_recreation: 0.6, culture: 0.4 },
  beer_garden:                { food_and_drink: 0.7, entertainment_and_recreation: 0.3 },
  indoor_playground:          { entertainment_and_recreation: 0.5, sports: 0.5 },
  miniature_golf_course:      { entertainment_and_recreation: 0.6, sports: 0.4 },
  vineyard:                   { entertainment_and_recreation: 0.5, food_and_drink: 0.5 },
  winery:                     { food_and_drink: 0.7, entertainment_and_recreation: 0.3 },
  tourist_information_center: { services: 0.3, entertainment_and_recreation: 0.7 },
};
```

Extend this table to other travel-relevant types you judge similarly split (restaurants, lodging, culture, entertainment, sports, nature, nightlife, wellness are the categories worth this attention — a traveler will rarely log a `car_wash` or `atm` as an experience, so don't spend effort splitting weights in Automotive/Business/Finance/Government/Facilities/Housing; the mechanical default is fine there). Add a one-line comment on each override explaining the split, same convention as assumption-comments elsewhere in this codebase.

This weight table becomes the single canonical source `estimateCategoryScoresFromPlace()` in `placeCategoryEstimate.ts` reads from — it's already the function used for Discover recommendations today; retarget it to 19 dimensions and this table, and **reuse this exact function** (don't fork a second implementation) for computing an experience's or a save's `categoryScores` at write time.

### Star-rating-modulated nudge — an important nuance

Add a governing constant (in `constants.ts`, alongside `W_LOGGED`/`W_SAVED`, and overridable via `remoteConfig.ts` like the others):

```ts
export const STAR_RATING_MULTIPLIER: Record<1|2|3|4|5, number> = {
  1: 0,
  2: 0.4,
  3: 0.7,
  4: 1.0,   // parity with today's flat W_LOGGED behavior
  5: 1.3,
};
```

**Keep two things conceptually separate, and don't conflate them:**
- `experiences/{id}.categoryScores` — the *place's* category profile (from `estimateCategoryScoresFromPlace()`, unmodified by any individual's rating). This is what gets used for User↔Experience, User↔User, and Group↔Experience match scoring — two different users logging the same restaurant should see the same match% against it regardless of who rated it how many stars.
- The **decay nudge applied to the logger's own `users/{uid}.travelStyle`** — this is where the star rating comes in. In `applyExperienceStyleEvent` (called from `onExperienceCreated`), compute the nudge as `W_LOGGED × STAR_RATING_MULTIPLIER[experience.starRating] × experience.categoryScores`, decayed and capped exactly as today. A save has no star rating, so `onSaveCreated` keeps nudging by the flat `W_SAVED × save.categoryScores` as it does now — the star-rating modulation only applies to the logging path.

### Cloud Functions data flow

`onExperienceCreated` / `onSaveCreated` currently have the category vector handed to them from client input (the slider values). Now they need to derive it themselves: read `experience.placeId` (or `save.placeId`) → look up `places/{placeId}.googlePlaceType` → run it through the weight table → write the resulting vector onto the experience/save document server-side (don't trust a client-supplied `categoryScores` at all anymore — there's no UI producing one, so any client-sent value here should be ignored or rejected by security rules).

### UI

- `TravelStyleSliders`: widen to 19, grouped/ordered per `CATEGORY_IDS`. Still used at onboarding and in Settings only.
- `CreateExperienceScreen` / `EditExperienceScreen`: remove the category-slider step entirely. Optionally (not required — your call during implementation) show the computed vector as a **read-only** preview via `TravelStyleRadar` right after the place is selected, so the user sees what got auto-derived. If you add this, make sure it's clearly non-interactive so it doesn't get confused with the still-manual onboarding/Settings sliders.
- `TravelStyleRadar`: flag for a follow-up design pass rather than solving now — a 19-spoke radar is visually cluttered, especially since several categories (Automotive, Business, Facilities, Finance, Government, Geographical Areas, Housing) will sit near-zero for essentially every user, since travelers rarely log experiences in those categories. That's expected, not a bug. A reasonable interim approach: keep the radar for the two-vector overlay/compare view (`MatchDetailSheet`) where it's already doing real comparative work, but consider a simpler ranked/bar display for single-vector contexts (profile summary, top-3 badge) where 19 spokes add more noise than signal. Note this as a follow-up in a code comment rather than blocking the migration on a full redesign.

### What doesn't need to change

- `matchScorer.ts`'s cosine similarity math works at any dimensionality — no algorithmic change needed. `HIGH_MATCH_THRESHOLD` and `CATEGORY_SECTION_THRESHOLD` may need recalibration once there's real usage data to look at, but there's nothing to calibrate against yet pre-launch — leave the current constants in place and flag this as a known follow-up.
- `feedSections.ts`'s `topCategories()`/top-3 sectioning and `groupBlending.ts`'s variance-threshold logic are dimension-agnostic — no structural change required.

## Testing expectations

- Unit tests for the weight table: every one of the 477 types resolves to a valid vector (weights are non-negative and defined only for real `CategoryId`s); the override table entries produce the specified splits; unmapped/unknown type strings fall back gracefully (log + zero vector, don't throw) rather than crashing ingestion if Google adds a new type your snapshot doesn't have yet.
- Unit tests for the star-rating multiplier table and for `applyExperienceStyleEvent` producing different nudge magnitudes across star ratings 1–5, while confirming `experience.categoryScores` itself is identical regardless of star rating (the separation-of-concerns point above).
- Unit test confirming a save's nudge is unaffected by any star-rating logic (saves have none).
- Update every existing test that references one of the 8 old category keys.

## Ask me before

Making any category/type judgment call that isn't covered by the override starter table above and that materially changes what a *travel style* score means (e.g., deciding that an entire one of the 19 categories should be excluded from scoring rather than just left to float near zero). Otherwise, proceed autonomously — extend the override table using your own judgment on the same pattern, note each addition with a one-line rationale comment, and continue.
