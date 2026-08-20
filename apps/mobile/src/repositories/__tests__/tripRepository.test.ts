jest.mock('firebase/firestore');
jest.mock('../../firebase/client', () => ({ db: {}, functions: {} }));
jest.mock('firebase/functions', () => ({
  httpsCallable: () => async () => ({ data: { success: true } }),
}));

import { Timestamp, __getRaw, __reset, __seed } from 'firebase/firestore';
import { TripRepository } from '../tripRepository';

describe('TripRepository.updateDateRange — recategorization', () => {
  beforeEach(() => __reset());

  it('evicts an experience whose date now falls outside a shrunk range, and pulls in a standalone one now inside it', async () => {
    __seed('trips', 'trip-1', {
      ownerId: 'alex',
      countries: ['Japan'],
      startDate: Timestamp.fromDate(new Date('2026-01-01')),
      endDate: Timestamp.fromDate(new Date('2026-01-20')),
      name: 'Japan — Jan 1–20',
      coverPhotoUrl: '',
      visibility: 'private',
      createdAt: Timestamp.fromDate(new Date('2025-01-01')),
    });

    __seed('experiences', 'exp-in-trip', {
      ownerId: 'alex',
      tripId: 'trip-1',
      country: 'Japan',
      city: 'Tokyo',
      date: Timestamp.fromDate(new Date('2026-01-18')), // will fall outside shrunk range
    });
    __seed('experiences', 'exp-standalone', {
      ownerId: 'alex',
      tripId: null,
      country: 'Japan',
      city: 'Osaka',
      date: Timestamp.fromDate(new Date('2026-01-08')), // falls inside shrunk range
    });

    // Shrink the range to Jan 1–10: exp-in-trip (Jan 18) should be evicted,
    // exp-standalone (Jan 8) should be pulled in.
    await TripRepository.updateDateRange('trip-1', new Date('2026-01-01'), new Date('2026-01-10'));

    expect(__getRaw('experiences', 'exp-in-trip')?.tripId).toBeNull();
    expect(__getRaw('experiences', 'exp-standalone')?.tripId).toBe('trip-1');
  });

  it('does not touch experiences belonging to a different trip', async () => {
    __seed('trips', 'trip-1', {
      ownerId: 'alex',
      countries: ['Japan'],
      startDate: Timestamp.fromDate(new Date('2026-01-01')),
      endDate: Timestamp.fromDate(new Date('2026-01-10')),
      name: 'Japan trip',
      coverPhotoUrl: '',
      visibility: 'private',
      createdAt: Timestamp.fromDate(new Date('2025-01-01')),
    });
    __seed('experiences', 'exp-other-trip', {
      ownerId: 'alex',
      tripId: 'some-other-trip',
      country: 'Japan',
      city: 'Kyoto',
      date: Timestamp.fromDate(new Date('2026-01-05')),
    });

    await TripRepository.updateDateRange('trip-1', new Date('2026-01-01'), new Date('2026-01-20'));

    expect(__getRaw('experiences', 'exp-other-trip')?.tripId).toBe('some-other-trip');
  });
});
