# Amiva — Technical Specification

**Version:** 1.0
**Companion document to:** `functional_specification.md`

---

## 1. Technology Stack

Chosen to stay within the Google/Firebase ecosystem wherever it fits the requirement; deviations only where Google has no offering (e.g., Apple App Store) or a third-party is clearly best-in-class (e.g., client state libraries).

| Layer | Technology | Rationale |
|---|---|---|
| Mobile framework | **React Native + Expo (managed workflow)**, TypeScript | Cross-platform from one codebase; Expo speeds up iteration and OTA updates; TypeScript for type safety across a data model with many related entities |
| Auth | **Firebase Authentication** | Native support for Google + Facebook OAuth providers; integrates directly with Firestore security rules |
| Primary database | **Cloud Firestore** | NoSQL document DB; fastest iteration path within Firebase; scales naturally for feed/social access patterns; relational structure handled via subcollections + denormalization (see §3) |
| Media storage | **Firebase Storage** | Image uploads (experience photos, profile photos), tightly integrated with Auth for access rules |
| Backend/serverless logic | **Cloud Functions for Firebase** (Node.js/TypeScript) | Similarity score computation, travel-style decay recalculation, trending aggregation, notification triggers, Firestore-triggered side effects |
| Push notifications | **Firebase Cloud Messaging (FCM)** | Native Firebase integration |
| Location & places | **Google Places API**, **Google Maps SDK (React Native)** | POI search/autocomplete, place details, EXIF-independent geocoding |
| CI/CD & infra | **Google Cloud Build**, Firebase Hosting (for any admin/web tooling) | Single GCP project umbrella |
| App distribution | **Apple App Store**, **Google Play Store** | No Google alternative exists for iOS distribution |
| Client server-state | **React Query (TanStack Query)** | Caching/sync of Firestore reads, optimistic updates for saves/edits |
| Client local/UI state | **Zustand** | Lightweight, avoids Redux boilerplate |
| Navigation | **React Navigation** | Standard for React Native |
| Image handling | **expo-image-picker** + client-side compression before upload to Firebase Storage | Keeps storage/bandwidth costs down, enforces 5-image cap client-side and server-side |

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    React Native App (Expo)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│  │ Logbook  │  │ Planner  │  │ Discovery│  │  Social   │ │
│  │  Module  │  │  Module  │  │  Module  │  │  Module   │ │
│  └──────────┘  └──────────┘  └──────────┘  └───────────┘ │
│         State: React Query (server) + Zustand (UI)         │
└───────────────────────────┬─────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                   ▼
   ┌─────────────┐   ┌───────────────┐   ┌───────────────┐
   │  Firebase   │   │    Cloud       │   │  Google Places │
   │    Auth     │   │   Firestore    │   │   / Maps API   │
   └─────────────┘   └───────┬───────┘   └───────────────┘
                              │
                     ┌────────┴────────┐
                     │  Cloud Functions │
                     │  - similarity    │
                     │    engine        │
                     │  - style decay   │
                     │  - trending agg  │
                     │  - notifications │
                     └────────┬────────┘
                              │
                     ┌────────┴────────┐
                     │ Firebase Storage │
                     │  (images)        │
                     └─────────────────┘
                              │
                     ┌────────┴────────┐
                     │       FCM        │
                     └─────────────────┘
```

**Design principle:** the client is a thin presentation layer over Firestore reads/writes (via React Query) for simple CRUD, but all **derived/computed state** — similarity scores, travel-style decay, trending aggregation — is computed server-side in Cloud Functions, never trusted to or computed by the client. This keeps scoring logic consistent, auditable, and un-spoofable.

---

## 3. Data Model (Firestore)

Firestore is a document database; relationships below are modeled via a mix of **subcollections**, **reference fields**, and **selective denormalization** for read performance (standard Firestore practice for feed-heavy apps).

### 3.1 `users/{userId}`

```typescript
interface User {
  uid: string;                    // Firebase Auth UID
  username: string;               // unique, used for profile link/QR
  name: string;
  email: string;
  phoneNumber?: string;           // optional, for contacts sync
  profilePhotoUrl?: string;
  privacySetting: 'public' | 'private' | 'friends';
  travelStyle: TravelStyleVector; // current, auto+manually adjusted
  travelStyleBaseline: TravelStyleVector; // last manual-edit baseline
  travelStyleLastUpdated: Timestamp;
  createdAt: Timestamp;
  recentSearches: string[];       // capped at 10, FIFO
}

interface TravelStyleVector {
  adventure: number;      // 0-10
  luxury: number;
  culture: number;
  foodie: number;
  relaxation: number;
  socialNightlife: number;
  nature: number;
  budgetBackpacker: number;
}
```

### 3.2 `places/{placeId}`

Keyed by **Google Places `place_id`** — a normalized internal entity so posts don't embed duplicate location data, and so place-level aggregation (trending, future POI pages) is possible without a future migration.

```typescript
interface Place {
  placeId: string;          // Google Places place_id (doc ID)
  name: string;
  country: string;
  city: string;
  lat: number;
  lng: number;
  googlePlaceType?: string;   // Places API (New) primaryType (raw type id)
  googlePlaceTypes: string[]; // full `types` array — feeds category scoring + the ingestion gate
  priceLevel?: string;       // Places API (New) PRICE_LEVEL_* enum → the priceLevelAffinity scalar
  rating?: number;           // Google crowd rating 1.0–5.0 (stored; feed-ranking use deferred)
  userRatingCount?: number;  // review count (also the places-of-worship landmark-gate fallback)
  createdAt: Timestamp;      // first time this place was referenced in Amiva
}
```

> **Taxonomy-reduction pass (2026-09-02):** a place is only written here if
> it passes `isApprovedPlace` (@amiva/core) — an approved travel-experience
> type, and for a place of worship, a landmark signal. Non-approved places
> are hard-rejected (never persisted, never surfaced). See CLAUDE.md.

**Relationship direction:** `Post → Place` via `placeId` reference field (many-to-one). Reverse queries (`Place → Posts`) are done via a Firestore query on `posts` filtered by `placeId` — no need to store a posts array on the Place doc (avoids unbounded array growth).

### 3.3 `trips/{tripId}` (Logbook — past trips)

```typescript
interface Trip {
  tripId: string;
  ownerId: string;              // ref to users
  countries: string[];          // usually 1, can be multiple if user grouped them
  startDate: Timestamp;
  endDate: Timestamp;
  name: string;                 // auto-generated, editable
  coverPhotoUrl: string;        // defaults to first experience photo, editable
  visibility: 'public' | 'private' | 'friends'; // inherited from account by default
  createdAt: Timestamp;
}
```

### 3.4 `experiences/{experienceId}` (Logbook entries / Posts)

```typescript
interface Experience {
  experienceId: string;
  ownerId: string;
  tripId?: string;               // null if truly standalone (see business rule §3.2 functional spec)
  placeId: string;                // ref to places
  city: string;                   // denormalized from place for query performance
  country: string;                // denormalized from place
  title: string;
  notes: string;                  // private personal reflection
  rating: number;                 // 1-5 stars
  photoUrls: string[];            // max 5
  categoryScores: TravelStyleVector; // this experience's 8-axis profile
  date: Timestamp;                // from EXIF or manual override
  dateSource: 'exif' | 'manual';
  postType: 'experience' | 'city' | 'trip'; // granularity of the shareable post
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 3.5 `saves/{userId}_{experienceId}`

Tracks saved (not liked) experiences, used both for Planner ingestion and travel-style decay input.

```typescript
interface Save {
  userId: string;
  experienceId: string;
  savedAt: Timestamp;
}
```

### 3.6 `plannedTrips/{plannedTripId}`

```typescript
interface PlannedTrip {
  plannedTripId: string;
  ownerId: string;
  collaboratorIds: string[];      // unlimited, direct-add, no invite/accept
  locations: string[];            // country/city level
  startDate: Timestamp;
  endDate: Timestamp;
  status: 'planning' | 'upcoming' | 'completed';
  visibility: 'public' | 'private' | 'friends'; // set per-trip
  itemIds: string[];               // ref to plannedTripItems
  createdAt: Timestamp;
}

interface PlannedTripItem {
  itemId: string;
  plannedTripId: string;
  source: 'saved' | 'recommended';
  placeId: string;
  title: string;
  categoryScores?: TravelStyleVector; // if known ahead of time (e.g., from a Place's aggregate)
  completed: boolean;
  convertedToExperienceId?: string; // set once converted at trip completion
}
```

### 3.7 `friends/{userId}_{friendId}`

Bidirectional edge, written twice (once per direction) for simple querying, or once with a composite query — implementation detail left to Cloud Function on add. Compatibility score is precomputed and cached here to avoid recomputation on every profile view.

```typescript
interface FriendEdge {
  userId: string;
  friendId: string;
  compatibilityScore: number;     // cached cosine similarity, recomputed on either user's style change
  addedVia: 'contacts_sync' | 'qr_link';
  createdAt: Timestamp;
}
```

### 3.8 `notifications/{notificationId}`

```typescript
interface Notification {
  notificationId: string;
  recipientId: string;
  type: 'trip_completed' | 'friend_added' | 'group_trip_joined' | 'new_match';
  payload: Record<string, unknown>; // contextual data (tripId, friendId, experienceId, etc.)
  read: boolean;
  createdAt: Timestamp;
}
```

---

## 4. Core Algorithms

### 4.1 Cosine Similarity (Match Score)

Used identically for User↔Experience, User↔User, and Group↔Experience.

```
similarity(A, B) = (A · B) / (||A|| × ||B||)
```

Where A and B are 8-dimensional vectors (one dimension per category). Result is in `[-1, 1]` for arbitrary vectors, but since all category scores are non-negative (0–10 scale), result is naturally in `[0, 1]`. Displayed to the user as a percentage: `matchPercent = round(similarity * 100)`.

Implemented as a pure, unit-tested utility function shared between client (for instant UI feedback where safe, e.g., previewing your own trip's match before posting) and Cloud Functions (source of truth, persisted value).

### 4.2 Travel Style Decay/Adjustment Algorithm

On every `logged` or `saved` experience event, a Cloud Function recomputes the user's travel style:

```
weight = isLogged ? W_LOGGED : W_SAVED         // W_LOGGED = 3 * W_SAVED
decayFactor = exp(-λ * daysSinceBaseline)       // recency weighting
delta = (experienceVector - currentUserVector) * weight * decayFactor
delta = clamp(delta, -MAX_STEP, MAX_STEP)       // per-category cap, prevents single-event spikes
newUserVector = currentUserVector + delta
```

- `MAX_STEP` and `λ` (decay constant) are tunable constants, stored in a config collection so they can be adjusted without redeploying.
- On a **manual edit** in Settings, `travelStyleBaseline` is reset to the manually-entered vector, and `travelStyleLastUpdated` resets — subsequent automatic adjustments compute deltas from this new baseline going forward.
- This computation runs in a Cloud Function (`onSaveCreated`, `onExperienceCreated`) — never client-side — so the algorithm can evolve without an app release and cannot be spoofed.

### 4.3 Feed Ranking

Feed query combines a **relationship tier** and a **match score**, producing a composite sort key computed server-side (Cloud Function on a schedule, or on-read via a Firestore extension/aggregation, depending on load — MVP can start with on-read computation given expected data volumes):

```
tier 1: isFriend && matchScore >= HIGH_THRESHOLD
tier 2: !isFriend && matchScore >= HIGH_THRESHOLD
tier 3: isFriend && matchScore < HIGH_THRESHOLD
tier 4: !isFriend && matchScore < HIGH_THRESHOLD
```

Sort by tier ascending, then matchScore descending within tier, then recency.

### 4.4 Group Recommendation Blending

For a planned trip with N collaborators:

1. Compute each collaborator's individual match score against a candidate experience.
2. Compute group cohesion = variance across those N scores.
3. If variance is below a threshold → surface a single blended recommendation (average vector match).
4. If variance is above the threshold → surface recommendations **segmented per collaborator** ("aligned with Alex," "aligned with Sam") rather than forcing one compromise pick, per functional spec §6.2.

---

## 5. API / Cloud Functions Surface

| Function | Trigger | Purpose |
|---|---|---|
| `onExperienceCreated` | Firestore trigger | Recompute owner's travel style (logged weight); update trip aggregate; check for trending signal |
| `onSaveCreated` | Firestore trigger | Recompute owner's travel style (saved weight) |
| `onFriendAdded` | Callable / Firestore trigger | Compute and cache compatibility score both directions; fire `friend_added` notification |
| `onTravelStyleChanged` | Firestore trigger | Recompute cached compatibility scores for all of that user's friend edges |
| `computeMatchScore` | Callable | On-demand similarity computation (e.g., previewing a match before data is persisted) |
| `convertPlannedTripToLogbook` | Callable | Triggered on trip completion flow; creates Experience docs from PlannedTripItems per user confirmation |
| `getTrending` | Callable (or scheduled aggregation + read) | Global / location-scoped / personalized trending queries |
| `sendNotification` | Firestore trigger on `notifications` collection create | Dispatches via FCM |

---

## 6. Security & Privacy

- **Firestore Security Rules** enforce:
  - A user can only write to their own `users/{uid}` document (except server-computed fields like `travelStyle`, which are Cloud-Function-only writes via Admin SDK).
  - Read access to `experiences`, `trips`, and the travel style fields on `users` is gated by the target user's `privacySetting` (public / friends / private), checked against the requester's friend-edge existence.
  - `places` collection is world-readable (not sensitive), writable only by Cloud Functions (to prevent client-side pollution of the normalized place list).
- **Phone numbers** (used for contacts sync) are never exposed in client-readable queries directly — matching is done via a Cloud Function that takes a hashed contact list and returns matched user IDs only, not raw phone numbers of other users.
- OAuth via Firebase Auth — no credentials handled or stored by Amiva directly.

---

## 7. Extensibility Notes (For Future Phases, Not MVP)

The following are explicitly out of scope for MVP but the schema above is shaped to support them without a breaking migration:

- **Map view of logbook** — `Place` already has `lat`/`lng`; a map view is a pure read-layer addition.
- **POI aggregate pages** ("all Amiva experiences at this restaurant") — enabled by the `Place` entity already being first-class and queryable via `experiences.where(placeId == X)`.
- **Partnerships/promotions** — add a `featured: boolean` / `sponsorId: string` field to `Place` or `Experience` later; no restructuring needed.
- **Category set expansion** — `TravelStyleVector` is currently a fixed 8-key object for simplicity/performance; if categories need to become dynamic, this would migrate to a `Map<categoryId, score>` structure. Flagged here so this isn't a surprise refactor later.

---

## 8. Design Patterns & Engineering Principles to Apply

(Elaborated further in `CLAUDE.md`, summarized here for the spec record)

- **Repository pattern** for all Firestore access — no raw Firestore calls scattered through UI components; a data-access layer per entity (e.g., `ExperienceRepository`, `TripRepository`) that the rest of the app depends on.
- **Strategy pattern** for the match-scoring algorithm — cosine similarity is the MVP strategy, but the interface should allow swapping in a different similarity function later without touching call sites.
- **Single Responsibility** — Cloud Functions are split by concern (style decay, notifications, trending) rather than one monolithic function.
- **Dependency Inversion** — UI components depend on hooks/services (e.g., `useMatchScore()`), not directly on Firestore SDK calls, so backend swaps or test mocking are straightforward.
- **DRY** — the cosine similarity function and the `TravelStyleVector` type are defined once in a shared package consumable by both the client and Cloud Functions (e.g., a shared `/packages/core` workspace in a monorepo layout).
