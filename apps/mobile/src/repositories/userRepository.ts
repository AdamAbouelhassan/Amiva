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
    phoneNumber: data.phoneNumber,
    phoneNumberHash: data.phoneNumberHash,
    profilePhotoUrl: data.profilePhotoUrl,
    privacySetting: data.privacySetting,
    travelStyle: data.travelStyle,
    travelStyleBaseline: data.travelStyleBaseline,
    travelStyleLastUpdated: toDate(data.travelStyleLastUpdated),
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
      createdAt: toTimestamp(user.createdAt),
      recentSearches: [],
    });
    batch.set(doc(db, USERNAMES_COLLECTION, user.username), { uid: user.uid });
    await batch.commit();
  },

  async updateProfile(
    uid: string,
    patch: Partial<Pick<UserDoc, 'name' | 'username' | 'phoneNumber' | 'phoneNumberHash' | 'profilePhotoUrl'>>,
  ): Promise<void> {
    await updateDoc(doc(db, COLLECTION, uid), patch);
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
