/**
 * Contacts sync — functional_specification.md §6.3 mechanism #1: matches
 * the user's phone contacts against registered Amiva phone numbers.
 * Hashes are computed on-device; raw numbers never leave the device
 * (technical_specification.md §6, functions/src/lib/contactsMatch.ts).
 */
import * as Contacts from 'expo-contacts';
import { httpsCallable } from 'firebase/functions';
import { useState } from 'react';
import { functions } from '../../../firebase/client';
import { hashPhoneNumber } from '../../../lib/phoneHash';

interface ContactMatch {
  userId: string;
  name: string;
  username: string;
  profilePhotoUrl: string | null;
}

const matchContactsCallable = httpsCallable<{ contactPhoneHashes: string[] }, ContactMatch[]>(
  functions,
  'matchContacts',
);

export function useContactsSync() {
  const [matches, setMatches] = useState<ContactMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function sync() {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        setError(new Error('Contacts permission denied.'));
        return;
      }

      const { data } = await Contacts.getContactsAsync({ fields: [Contacts.Fields.PhoneNumbers] });
      const phoneNumbers = data.flatMap((contact) => contact.phoneNumbers?.map((p) => p.number).filter(Boolean) ?? []);
      const hashes = await Promise.all(phoneNumbers.filter((n): n is string => !!n).map(hashPhoneNumber));

      const result = await matchContactsCallable({ contactPhoneHashes: hashes });
      setMatches(result.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }

  return { matches, loading, error, sync };
}
