# Google Places taxonomy (reference data)

Raw reference data, not (yet) wired into any code — placed here ahead of a
rework of the travel-style category model and Google-Place-type → score
mapping. Not part of the TypeScript build (`packages/core/tsconfig.json`'s
`include` is `["src"]` only; this directory is a sibling of `src/`, not
inside it).

- **`google_places_types.json`** — all 477 Google Places API (New) Table A
  place types (`primaryType`/`types`/`includedType` values), each tagged
  with its Google-assigned top-level category.
- **`google_places_categories.json`** — the 19 top-level category
  groupings Google uses to organize those types. Not an API field itself,
  just Google's own documentation grouping.

Both retrieved 2026-09-02 from
<https://developers.google.com/maps/documentation/places/web-service/place-types>
— re-check that URL periodically, Google adds new types over time.

## Why this is here

Currently `../../src/placeCategoryEstimate.ts` hand-authors a much smaller
`GOOGLE_PLACE_TYPE_WEIGHTS` table (~35 entries) mapping a handful of Google
place types to Amiva's 8 fixed `TravelStyleCategory` values
(`TRAVEL_STYLE_CATEGORIES` in `../../src/types.ts`), used to estimate a
match score for a raw Google Place in Discover > Recommendations
(`functions/src/lib/placeRecommendations.ts`).

This data — Google's full type taxonomy plus its own 19-category
grouping — is meant to inform a broader rework of that scoring/matching
layer (and possibly the travel-style category model itself: whether it
stays a fixed 8, and how Google's 19/477 taxonomy maps onto it or replaces
part of it). That rework hasn't happened yet — this is placement only, per
CLAUDE.md's "DRY on types and constants" and "packages/core is pure, no
I/O" rules, whatever the eventual mapping/expansion looks like should live
as hand-authored TypeScript in `../../src/`, informed by this data rather
than importing it wholesale at runtime.
