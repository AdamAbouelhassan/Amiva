/**
 * Repository pattern (CLAUDE.md #1) — the only place in the app that
 * issues Firestore calls against `users/{uid}`.
 *
 * Deliberately has NO method to write `travelStyle` /
 * `travelStyleBaseline` directly: automatic adjustment is Cloud-Function-
 * only, and a manual edit goes through the `updateTravelStyleManual`
 * callable (see hooks/useUpdateTravelStyleManual.ts), never a raw
 * Firestore write — matching firestore.rules and
 * technical_specification.md §6.
 *
 * Username uniqueness is backed by a small `usernames/{username}` doc
 * (`{ uid }`), not a query over `users` filtered by username. Firestore
 * rejects a collection query outright if its per-document read rule
 * depends on data the query doesn't constrain (here, `privacySetting`) —
 * it can't prove every possible match would pass, so it refuses the
 * whole query rather than filtering results. `usernames` sidesteps this
 * by being its own tiny, intentionally world-readable collection —
 * consistent with the spec treating username as a public identifier
 * (functional_specification.md §7: "Used for shareable profile link/QR").
 */
import {
  DocumentData,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { clampPriceAffinity, coerceTravelStyleVector, PRICE_AFFINITY_NEUTRAL } from '@amiva/core';
import { db } from '../firebase/client';
import { toDate, toTimestamp } from '../firebase/timestamps';
import { PrivacySetting, UserDoc } from './types';

const COLLECTION = 'users';
const USERNAMES_COLLECTION = 'usernames';

function fromFirestore(id: string, data: DocumentData): UserDoc {
  return {
    uid: id,
    username: data.username,
    name: data.name,
    email: data.email,
    // `create` stores these as `null` when absent; normalize to
    // `undefined` so nothing above the repository sees `null`.
    phoneNumber: data.phoneNumber ?? undefined,
    phoneNumberHash: data.phoneNumberHash ?? undefined,
    profilePhotoUrl: data.profilePhotoUrl,
    privacySetting: data.privacySetting,
    // coerceTravelStyleVector: a pre-taxonomy-migration (2026-09-02)
    // document still has the old 8-category shape on disk — this reads as
    // (mostly) zero rather than crashing every screen that indexes by the
    // new 19 CATEGORY_IDS. See types.ts's coerceTravelStyleVector for why.
    travelStyle: coerceTravelStyleVector(data.travelStyle),
    travelStyleBaseline: coerceTravelStyleVector(data.travelStyleBaseline),
    travelStyleLastUpdated: toDate(data.travelStyleLastUpdated),
    priceLevelAffinity:
      typeof data.priceLevelAffinity === 'number'
        ? clampPriceAffinity(data.priceLevelAffinity)
        : PRICE_AFFINITY_NEUTRAL,
    createdAt: toDate(data.createdAt),
    recentSearches: data.recentSearches ?? [],
  };
}

export const UserRepository = {
  async getById(uid: string): Promise<UserDoc | undefined> {
    const snap = await getDoc(doc(db, COLLECTION, uid));
    return snap.exists() ? fromFirestore(snap.id, snap.data()) : undefined;
  },

  async isUsernameTaken(username: string): Promise<boolean> {
    const snap = await getDoc(doc(db, USERNAMES_COLLECTION, username));
    return snap.exists();
  },

  /** Account creation (functional_specification.md §7) — the one legal
   * client write of `travelStyle`, as the user's very first baseline.
   * Claims the username atomically alongside creating the profile so the
   * two can never end up out of sync. */
  async create(user: UserDoc): Promise<void> {
    const batch = writeBatch(db);
    batch.set(doc(db, COLLECTION, user.uid), {
      username: user.username,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber ?? null,
      phoneNumberHash: user.phoneNumberHash ?? null,
      profilePhotoUrl: user.profilePhotoUrl ?? null,
      privacySetting: user.privacySetting,
      travelStyle: user.travelStyle,
      travelStyleBaseline: user.travelStyle,
      travelStyleLastUpdated: toTimestamp(user.travelStyleLastUpdated),
      // No manual control — starts at the neutral midpoint and is nudged
      // automatically by logged/saved experiences (taxonomy-reduction pass).
      priceLevelAffinity: PRICE_AFFINITY_NEUTRAL,
      createdAt: toTimestamp(user.createdAt),
      recentSearches: [],
    });
    batch.set(doc(db, USERNAMES_COLLECTION, user.username), { uid: user.uid });
    await batch.commit();
  },

  /** Non-username profile fields (Account → Settings). `username` is
   * deliberately excluded — it has a uniqueness lookup to keep in sync,
   * so it goes through `changeUsername`. Pass `null` for `phoneNumber` /
   * `phoneNumberHash` to clear them; `undefined` keys are left untouched. */
  async updateProfile(
    uid: string,
    patch: {
      name?: string;
      profilePhotoUrl?: string;
      phoneNumber?: string | null;
      phoneNumberHash?: string | null;
    },
  ): Promise<void> {
    const clean = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
    if (Object.keys(clean).length === 0) return;
    await updateDoc(doc(db, COLLECTION, uid), clean);
  },

  /** Renames the user while keeping the `usernames/{username}` uniqueness
   * lookup in sync: claims the new name and releases the old one in one
   * atomic batch. The new claim is a `set` on a doc that must not exist
   * (firestore.rules forbids `update` on `usernames`), so a race where
   * someone else grabbed the name in the meantime fails the whole batch —
   * same guarantee `create` gives at signup. Call `isUsernameTaken`
   * first for a friendly message; this is the actual safety net. */
  async changeUsername(uid: string, currentUsername: string, newUsername: string): Promise<void> {
    const batch = writeBatch(db);
    batch.set(doc(db, USERNAMES_COLLECTION, newUsername), { uid });
    batch.delete(doc(db, USERNAMES_COLLECTION, currentUsername));
    batch.update(doc(db, COLLECTION, uid), { username: newUsername });
    await batch.commit();
  },

  async updatePrivacySetting(uid: string, privacySetting: PrivacySetting): Promise<void> {
    await updateDoc(doc(db, COLLECTION, uid), { privacySetting });
  },

  /** Recent searches are capped/FIFO at RECENT_SEARCHES_MAX
   * (@amiva/core) — enforced by the caller (useRecentSearches hook)
   * before persisting here. */
  async updateRecentSearches(uid: string, recentSearches: string[]): Promise<void> {
    await updateDoc(doc(db, COLLECTION, uid), { recentSearches });
  },
};
