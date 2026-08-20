import { db as defaultDb } from '../adminApp';
import { ContactsMatchStore } from '../lib/contactsMatch';

/**
 * Matches against `users/{uid}.phoneNumberHash` — a hash of the user's
 * own phone number, computed and stored client-side alongside
 * `phoneNumber` (see apps/mobile/src/lib/phoneHash.ts for the shared
 * convention: SHA-256 hex of the trimmed phone string). This is not a
 * server-computed field, so it doesn't need a dedicated trigger — the
 * user's own phone number isn't something that needs protecting from the
 * user themselves. Firestore's `in` operator caps at 30 values, so
 * lookups are chunked.
 */
const FIRESTORE_IN_LIMIT = 30;

export class FirestoreContactsMatchStore implements ContactsMatchStore {
  constructor(private readonly db: FirebaseFirestore.Firestore = defaultDb) {}

  async findUsersByPhoneHashes(hashes: string[]): Promise<Array<{ userId: string; name: string }>> {
    const results: Array<{ userId: string; name: string }> = [];

    for (let i = 0; i < hashes.length; i += FIRESTORE_IN_LIMIT) {
      const chunk = hashes.slice(i, i + FIRESTORE_IN_LIMIT);
      const snap = await this.db.collection('users').where('phoneNumberHash', 'in', chunk).get();
      for (const doc of snap.docs) {
        results.push({ userId: doc.id, name: doc.data().name });
      }
    }

    return results;
  }
}
