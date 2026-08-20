import * as functions from 'firebase-functions';
import { FirestoreContactsMatchStore } from '../adapters/contactsAdapter';
import { matchContacts as matchContactsLib } from '../lib/contactsMatch';

interface MatchContactsRequest {
  /** SHA-256 hex hashes of the caller's device contacts' phone numbers —
   * never raw phone numbers (technical_specification.md §6). */
  contactPhoneHashes: string[];
}

export const matchContacts = functions.https.onCall(async (data: MatchContactsRequest, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in.');
  }
  if (!Array.isArray(data.contactPhoneHashes)) {
    throw new functions.https.HttpsError('invalid-argument', 'contactPhoneHashes must be an array.');
  }
  return matchContactsLib(new FirestoreContactsMatchStore(), data.contactPhoneHashes);
});
