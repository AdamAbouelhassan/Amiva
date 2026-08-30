/**
 * Shared hashing convention for contacts-sync friend discovery
 * (functional_specification.md §6.3, technical_specification.md §6):
 * SHA-256 hex digest of the phone number after trimming whitespace.
 *
 * Both sides of the match must agree on this exact convention: this
 * client hashes its own phone number the same way it hashes contacts'
 * numbers before sending them to the `matchContacts` callable (see
 * functions/src/adapters/contactsAdapter.ts) — never sending a raw phone
 * number over the wire in either direction.
 *
 * Assumption: true E.164 normalization (handling country codes,
 * formatting variants) would need a phone-parsing library not named
 * anywhere in technical_specification.md §1; this MVP convention only
 * matches when both numbers are stored in the same format.
 */
import * as Crypto from 'expo-crypto';

export async function hashPhoneNumber(phoneNumber: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, phoneNumber.trim());
}
