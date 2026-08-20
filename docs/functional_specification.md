# Amiva — Functional Specification

**Version:** 1.0
**Status:** MVP Definition
**Platform:** iOS + Android (React Native, single codebase)

---

## 1. Product Overview

Amiva is a mobile social travel-planning app. Users log and share travel experiences, and every user and every experience is scored against a shared "travel style" model made of 8 categories. This produces a quantitative match/compatibility percentage between users and content (experiences, other users, group trips), which powers the recommendation feed, search ranking, trending, and friend compatibility features.

Amiva has three functional pillars:

1. **Logbook** — a personal, structured record of everywhere a user has traveled and what they did there.
2. **Planner** — a forward-looking tool for organizing upcoming trips, solo or with friends.
3. **Discovery** — feed, search, recommendations, and trending, all ranked by travel-style match.

---

## 2. The Travel Style Model

### 2.1 Categories

Every user and every experience is scored across exactly **8 fixed categories**:

1. Adventure
2. Luxury
3. Culture
4. Foodie
5. Relaxation
6. Social/Nightlife
7. Nature
8. Budget/Backpacker

These categories are fixed for MVP (not user-extensible). Each category is scored on a continuous scale (e.g., 0–10).

### 2.2 Visualization

The 8 category scores are visualized as a **radar/spider chart** — one axis per category arranged around a circle, with the resulting polygon shape representing the "shape" of a user's style or an experience's profile. This visualization is used consistently everywhere a travel style appears (user profile, post detail, friend compatibility detail).

### 2.3 User Travel Style — Initial Capture

- Captured during account creation via **8 rating sliders**, one per category.
- This becomes the user's initial travel style vector.

### 2.4 User Travel Style — Ongoing Adjustment

The user's travel style is a **living score**, not fixed after onboarding:

- **Automatic adjustment:** Every time a user logs (posts) an experience or saves an experience, their travel style vector nudges toward that experience's category profile.
  - **Logged experiences carry ~3x the weight of saved experiences** (completing/logging a trip is a stronger signal of true preference than merely saving something for later).
  - Adjustment is **recency-weighted with decay** — recent activity influences the score more than older activity. This is a rolling model, not a flat lifetime average.
  - Each individual adjustment is **capped/incremental** — no single post or save can cause a large swing in the user's matrix. The style trends over time rather than spiking.
- **Manual adjustment:** Users can manually edit their travel style sliders at any time from Account Settings.
  - A manual edit sets a **new baseline**. Automatic adjustment continues from that new baseline going forward (it does not revert to a prior automatic trend, and it does not get silently overridden by old activity).

### 2.5 Experience Travel Style

- Every experience (post) is scored via the **same 8 sliders**, filled in manually by the user at the time of posting.
- An experience can score highly on multiple categories simultaneously (e.g., a high-end food tour scores high on both Luxury and Foodie) — there is no separate "composite category," composite experiences are just naturally represented by the shape of the polygon.

### 2.6 Similarity / Match Scoring

- **Method:** Cosine similarity between two 8-dimensional vectors.
- Used identically across three contexts:
  1. **User ↔ Experience** — powers the "match %" shown on feed posts and recommendations.
  2. **User ↔ User** — powers friend compatibility scores.
  3. **Group ↔ Experience** — powers group trip recommendations (see §6.4).
- **Display convention:** Shown as a percentage everywhere it appears (on feed posts, on friend profiles). Tapping/clicking the percentage opens a detail view showing both radar charts overlaid, so the user can see *which* categories are driving or hurting the match.
- Numeric category values are always visible (not just the visual shape) when a user views their own matrix or a match detail view.
- A user's matrix highlights their **top 3 categories** (e.g., as a summary or badge treatment) on their profile.

---

## 3. Logbook

The Logbook is a user's personal, structured travel history, accessible from their profile.

### 3.1 Structure

The Logbook is organized as a drill-down hierarchy:

**Country → City → Experience**

- A user's profile shows a list of countries they've logged experiences in.
- Tapping a country shows the cities visited within it.
- Tapping a city shows the individual experiences logged there.

### 3.2 Trips

- A **Trip** is a user-created container defined by a **country + explicit start/end date range**, explicitly created by the user (not auto-generated silently).
- Trip name auto-generates from country + date range (e.g., "Japan — Jan 1–10") but the underlying date range can be edited manually later. Editing a trip's date range may trigger **recategorization** of experiences into/out of that trip based on their dates, with no other retroactive effects.
- **Same country, different date range = a different, separate trip.**
- A trip can optionally **group multiple countries together** into one trip if the user wants (e.g., a multi-country Euro-trip), though the default/simple case is single-country.
- Experiences can be **added to a trip retroactively** (a trip doesn't need to be created before its experiences are logged).
- **Standalone experiences** are permitted — an experience with no trip — **only if** no other trip already exists for that country within an overlapping date range. If a matching trip exists, the experience must belong to it.
- **Trip cover photo:** defaults to the first image among the trip's experiences; user can manually override it.

### 3.3 Experiences (Logbook Entries)

Each logged experience includes:

- **Location** — a Google Places POI (see §7 Data Model — Place entity). Country and city are auto-derived from this.
- **Title** (user-entered)
- **Caption / personal notes** — private reflection, not a public review.
- **Star rating** — 1–5 stars, separate from the category sliders.
- **Photos** — up to 5 images, no video, per experience.
- **Category sliders** — the experience's own 8-category travel style profile, set by the user at posting time.
- **Date** — defaults from photo EXIF metadata if available; user can manually override.

Experiences can be **edited or deleted** after posting. Editing does not retroactively affect other data except possible trip recategorization if the date changes.

### 3.4 Posting Granularity

A user can create a post at three levels of granularity, all shareable to the feed:

1. **A single experience.**
2. **A whole city** — bundling multiple experiences under that city into one shareable post.
3. **A whole trip** — bundling all cities/experiences within a trip into one shareable post (a trip recap).

### 3.5 Logbook Features

- **Filtering** — users can filter their own logbook (e.g., by category, date).
- **Aggregate stats** — the logbook displays summary stats (e.g., "X countries, Y cities, Z experiences").
- **Chronological timeline view** — in addition to the geographic drill-down, a reverse-chronological list of past trips/experiences is available.
- **Map view** — explicitly deferred to a later phase (not MVP).
- **Trip revisit/duplication** — not supported (no MVP requirement to use a past trip as a template).

### 3.6 Visibility

- Logbook visibility follows the account-wide privacy setting: **Public, Private, or Friends-only.**
- This setting cascades to the Logbook, individual experiences, the travel style matrix, and friend compatibility visibility — it is a single account-level control, not set per-item.
- The Logbook (and its contents) is viewable by the owner always, and by others according to the visibility setting.

---

## 4. Planner

The Planner is the forward-looking counterpart to the Logbook — for trips that haven't happened yet.

### 4.1 Planned Trips

- A planned trip has **location(s) and a date range**, set by the user.
- A planned trip has a **status**: `Planning → Upcoming → Completed`.
- Users can plan **multiple trips concurrently** (an overview list of all planned trips).
- Planned trip visibility: **Private, Public, or Friends** (set per trip, independent of the account-wide default, since trips may be shared with specific collaborators — see §6).

### 4.2 Adding Experiences to a Plan

- Experiences are added to a planned trip's itinerary from two sources, in priority order:
  1. **The user's saved experiences** (saved via the feed/recommendations — see §5.3).
  2. **Recommended experiences** (pulled from Google Places / the recommendation engine).
- The itinerary is an **unordered list/checklist** of experiences for the trip — there is no day-by-day time-slot scheduling and no travel-time/logistics optimization in MVP.

### 4.3 Completing a Planned Trip

- When a planned trip's dates pass (or the user marks it complete), its status becomes `Completed`.
- On completion, the app **prompts the user to convert** the planned items into real Logbook entries — asking for the required Logbook fields (photos, rating, caption, actual category sliders) per item, with an option to **skip** any item that wasn't actually done or that the user doesn't want to log.

---

## 5. Discovery (Feed, Recommendations, Search, Trending)

### 5.1 Social Feed

- A social-media-style feed showing experience posts from friends and other users.
- Every post displays its **match % ** against the viewing user's travel style (via cosine similarity, §2.6).
- **Feed ranking priority (highest to lowest):**
  1. High-match posts from friends
  2. High-match posts from non-friends
  3. Low-match posts from friends
  4. Low-match posts from non-friends
- **Engagement model:** Posts can be **saved** only. There is no like or comment functionality in Amiva.

### 5.2 Recommendations

- A dedicated recommendations surface showing experiences the user hasn't logged, each with a personality/match score (same cosine similarity mechanic).
- Sourced from both existing user-generated posts and the broader Google Places catalog (not limited to what other Amiva users have posted).
- Filterable by location.
- No explicit feedback mechanism (no thumbs up/down) in MVP.
- Recommended experiences can be **saved**, feeding directly into the Planner (§4.2).

### 5.3 Search

- Search covers experiences worldwide, combining **free text, location, and category** filters.
- Search draws from both in-app user-generated content and Google Places data.
- Default ranking is personalized (weighted by the user's travel-style match), per standard UX best practice for this kind of app.
- **No people/user search** in MVP — friend discovery happens exclusively via contacts sync and QR/link sharing (§8).
- **Recent searches** are retained (last 5–10) for quick re-access.

### 5.4 Trending

Trending is surfaced in three views:

1. **Global** — trending across all of Amiva.
2. **Location-scoped** — trending within a specific country/city the user is browsing.
3. **Personalized** — trending among users with a similar travel style to the viewer.

### 5.5 Partnerships & Promotions

- Not built in MVP, but the data model and content pipeline should be **architected to extend cleanly** later (e.g., a "featured/sponsored" flag on an experience or place, without requiring a schema rework).

---

## 6. Group Trips & Social Features

### 6.1 Group Trip Collaboration

- A planned trip can have friends added as collaborators, modeled like a **shared document / shared photo album** — all added collaborators can co-edit the itinerary.
- **Unlimited collaborators** per trip.
- Adding a friend to a trip is **direct — no invite/accept step required.**

### 6.2 Group Recommendations

- When a trip has multiple collaborators, the recommendation engine attempts to surface experiences that satisfy the group as a whole (a blended/overlap match across all collaborators' travel styles).
- If the group's travel styles diverge significantly (low overlap), the app should **not force a single flattened compromise** — instead, it should surface recommendations aligned with each individual's style, making the trade-off visible to the group rather than hiding it.

### 6.3 Friends

- **Adding friends** happens via two mechanisms (no in-app people search):
  1. **Contacts sync** — the app matches the user's phone contacts against registered Amiva phone numbers and surfaces "people you may know."
  2. **QR code / shareable profile link** — every user has a unique scannable QR code and shareable link; scanning/opening it adds the friend directly.
- Friend adds are **direct, with no invite/accept confirmation step** required from the other party.

### 6.4 Friend Compatibility

- Every friend relationship shows a **compatibility score** — cosine similarity between the two users' travel style vectors.
- Displayed the same way as a post's match score: a **percentage on the friend's profile**, tappable for a detail view showing both radar charts overlaid.
- Compatibility is **mutual/two-way** (both users see the same score toward each other).
- Visibility of another user's travel style/compatibility score follows that user's account-wide privacy setting (§3.6).

### 6.5 Notifications

Users are notified for:

- A friend completes a trip.
- A friend is added (new friend connection made).
- Someone joins a group trip the user is part of.
- A new recommendation/match alert (a new experience surfaces that strongly matches the user's travel style).

There is **no notification for likes or comments**, since neither feature exists in Amiva — saving is the only engagement action on a post, and it does not trigger a notification.

---

## 7. Account Creation

Required and optional fields at sign-up:

| Field | Required? | Notes |
|---|---|---|
| Name | Required | |
| Email | Required | Used for auth if not using OAuth |
| Password | Required (if not OAuth) | |
| Username | Required | Used for shareable profile link/QR |
| Phone number | Optional | Enables contacts-sync friend discovery; skippable |
| Profile photo | Optional | |
| Travel style sliders (8 categories) | Required | Sets initial travel style vector |
| Default account privacy (Public/Private/Friends) | Required | Cascades to logbook, matrix, trips |

### 7.1 Authentication

- Sign-in via **Google OAuth** and **Facebook/Instagram OAuth**.
- These are authentication methods only — Amiva does **not** import data (photos, trips, etc.) from these platforms.

---

## 8. Out of Scope for MVP (Explicitly Deferred)

- Map view of past locations (Logbook)
- Trip revisit/duplication as a template
- In-app people search
- Likes/comments on posts
- Feedback mechanism on recommendations (thumbs up/down)
- Day-by-day itinerary scheduling / travel-time logistics in Planner
- Budget tracking in Planner
- Built-out partnerships/promotions (architecture only)
- POI-level aggregate pages (e.g., a public "Eiffel Tower" page) — though the data model supports adding this later (see Technical Specification, Place entity)
