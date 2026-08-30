import { matchContacts } from '../contactsMatch';
import { ContactsMatchStore } from '../contactsMatch';

describe('matchContacts', () => {
  it('returns matched users for the given hashes, deduplicating input', async () => {
    const store: ContactsMatchStore = {
      findUsersByPhoneHashes: async (hashes) =>
        hashes.map((h) => ({ userId: `user-${h}`, name: `Name ${h}`, username: `name-${h}`, profilePhotoUrl: null })),
    };
    const result = await matchContacts(store, ['hash-a', 'hash-b', 'hash-a']);
    expect(result).toEqual([
      { userId: 'user-hash-a', name: 'Name hash-a', username: 'name-hash-a', profilePhotoUrl: null },
      { userId: 'user-hash-b', name: 'Name hash-b', username: 'name-hash-b', profilePhotoUrl: null },
    ]);
  });

  it('returns an empty array without querying the store when given no hashes', async () => {
    const findUsersByPhoneHashes = jest.fn();
    const result = await matchContacts({ findUsersByPhoneHashes }, []);
    expect(result).toEqual([]);
    expect(findUsersByPhoneHashes).not.toHaveBeenCalled();
  });
});
