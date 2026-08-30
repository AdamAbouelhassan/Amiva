jest.mock('firebase/firestore');
jest.mock('../../firebase/client', () => ({ db: {} }));

import { __getRaw, __reset, __seed } from 'firebase/firestore';
import { UserRepository } from '../userRepository';

beforeEach(() => __reset());

describe('UserRepository.isUsernameTaken', () => {
  it('is true when a usernames/{username} claim exists, false otherwise', async () => {
    __seed('usernames', 'alex', { uid: 'user-1' });
    expect(await UserRepository.isUsernameTaken('alex')).toBe(true);
    expect(await UserRepository.isUsernameTaken('unclaimed')).toBe(false);
  });
});

describe('UserRepository.changeUsername', () => {
  beforeEach(() => {
    __seed('users', 'user-1', { username: 'oldname', name: 'Alex' });
    __seed('usernames', 'oldname', { uid: 'user-1' });
  });

  it('claims the new name, releases the old one, and updates the user doc — atomically', async () => {
    await UserRepository.changeUsername('user-1', 'oldname', 'newname');

    expect(__getRaw('usernames', 'newname')).toEqual({ uid: 'user-1' });
    expect(__getRaw('usernames', 'oldname')).toBeUndefined();
    expect(__getRaw('users', 'user-1')?.username).toBe('newname');
  });

  it('leaves the rest of the user doc untouched', async () => {
    await UserRepository.changeUsername('user-1', 'oldname', 'newname');
    expect(__getRaw('users', 'user-1')?.name).toBe('Alex');
  });
});

describe('UserRepository.updateProfile', () => {
  beforeEach(() => {
    __seed('users', 'user-1', {
      username: 'alex',
      name: 'Alex',
      phoneNumber: '555-0100',
      phoneNumberHash: 'oldhash',
    });
  });

  it('writes only the provided fields', async () => {
    await UserRepository.updateProfile('user-1', { name: 'Alexandra', profilePhotoUrl: 'https://x/p.jpg' });
    const doc = __getRaw('users', 'user-1')!;
    expect(doc.name).toBe('Alexandra');
    expect(doc.profilePhotoUrl).toBe('https://x/p.jpg');
    expect(doc.phoneNumber).toBe('555-0100'); // untouched
  });

  it('clears phone number and hash when passed null', async () => {
    await UserRepository.updateProfile('user-1', { phoneNumber: null, phoneNumberHash: null });
    const doc = __getRaw('users', 'user-1')!;
    expect(doc.phoneNumber).toBeNull();
    expect(doc.phoneNumberHash).toBeNull();
  });

  it('ignores undefined keys and no-ops on an empty patch', async () => {
    await UserRepository.updateProfile('user-1', { name: undefined });
    expect(__getRaw('users', 'user-1')?.name).toBe('Alex');
  });
});
