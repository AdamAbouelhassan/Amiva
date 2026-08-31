jest.mock('firebase/firestore');
jest.mock('../../firebase/client', () => ({ db: {}, functions: {} }));

import { __getRaw, __reset } from 'firebase/firestore';
import { TripRepository } from '../tripRepository';

const base = {
  ownerId: 'alex',
  location: 'Lisbon, Portugal',
  country: 'Portugal',
  startDate: new Date('2026-05-01'),
  endDate: new Date('2026-05-10'),
  visibility: 'private' as const,
};

describe('TripRepository.create', () => {
  beforeEach(() => __reset());

  it('auto-generates the name from location + dates when none is given', async () => {
    const trip = await TripRepository.create(base);
    expect(trip.name).toBe('Lisbon, Portugal — May 1–10');
    expect(__getRaw('trips', trip.tripId)?.name).toBe('Lisbon, Portugal — May 1–10');
  });

  it('keeps a user-supplied name', async () => {
    const trip = await TripRepository.create({ ...base, name: 'Honeymoon' });
    expect(trip.name).toBe('Honeymoon');
  });

  it('writes city as null when the location has no city', async () => {
    const trip = await TripRepository.create(base);
    expect(__getRaw('trips', trip.tripId)?.city).toBeNull();
    expect(trip.city).toBeUndefined();
  });

  it('defaults the cover photo to the first trip photo', async () => {
    const trip = await TripRepository.create({ ...base, photoUrls: ['a.jpg', 'b.jpg'] });
    expect(trip.coverPhotoUrl).toBe('a.jpg');
  });
});

describe('TripRepository.update', () => {
  beforeEach(() => __reset());

  it('applies a partial patch and a new date range', async () => {
    const trip = await TripRepository.create(base);
    await TripRepository.update(trip.tripId, {
      notes: 'rebooked',
      endDate: new Date('2026-05-14'),
    });
    const raw = __getRaw('trips', trip.tripId)!;
    expect(raw.notes).toBe('rebooked');
    expect(raw.name).toBe('Lisbon, Portugal — May 1–10'); // unchanged
  });
});
