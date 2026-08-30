/**
 * Backs a `matchContacts` callable. Not in technical_specification.md
 * §5's API table, but explicitly described as its own mechanism in §6:
 * "matching is done via a Cloud Function that takes a hashed contact list
 * and returns matched user IDs only, not raw phone numbers of other
 * users." Same category of addition as `updateTravelStyleManual` /
 * `upsertPlace` — required to make an already-specified feature
 * (functional_specification.md §6.3's contacts-sync friend discovery)
 * possible under the stated security model. The client hashes its
 * contacts' phone numbers before sending (never raw numbers over the
 * wire); this matches against phone-number hashes precomputed the same
 * way for every registered user.
 */
export interface ContactsMatchStore {
  /** Looks up which of the given phone-number hashes belong to a
   * registered user, returning only {userId, name} pairs — never a raw
   * phone number. */
  findUsersByPhoneHashes(hashes: string[]): Promise<Array<{ userId: string; name: string }>>;
}

export async function matchContacts(
  store: ContactsMatchStore,
  contactPhoneHashes: string[],
): Promise<Array<{ userId: string; name: string }>> {
  const uniqueHashes = [...new Set(contactPhoneHashes)];
  if (uniqueHashes.length === 0) return [];
  return store.findUsersByPhoneHashes(uniqueHashes);
}
