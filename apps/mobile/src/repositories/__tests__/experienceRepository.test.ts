import { zeroTravelStyleVector } from '@amiva/core';

jest.mock('firebase/firestore');
jest.mock('../../firebase/client', () => ({ db: {}, functions: {} }));
jest.mock('firebase/functions', () => ({
  httpsCallable: () => async () => ({ data: { success: true } }),
}));

import { Timestamp, __reset, __seed } from 'firebase/firestore';
import { ExperienceRepository } from '../experienceRepository';

const place = (overrides: Partial<{ country: string; city: string; placeId: string }> = {}) => ({
  placeId: overrides.placeId ?? 'place-1',
  name: 'Some Place',
  country: overrides.country ?? 'Japan',
  city: overrides.city ?? 'Tokyo',
  lat: 35.6,
  lng: 139.7,
});

describe('ExperienceRepository.create — standalone/trip business rule', () => {
  beforeEach(() => __reset());

  it('auto-assigns to an existing trip that covers the country + date, when no tripId is given', async () => {
    __seed('trips', 'trip-japan', {
      ownerId: 'alex',
      countries: ['Japan'],
      startDate: Timestamp.fromDate(new Date('2026-01-01')),
      endDate: Timestamp.fromDate(new Date('2026-01-10')),
      name: 'Japan — Jan 1–10',
      coverPhotoUrl: '',
      visibility: 'private',
      createdAt: Timestamp.fromDate(new Date('2025-01-01')),
    });

    const experience = await ExperienceRepository.create({
      ownerId: 'alex',
      place: place(),
      title: 'Ramen',
      notes: '',
      rating: 5,
      photoUrls: [],
      categoryScores: zeroTravelStyleVector(),
      date: new Date('2026-01-05'),
      dateSource: 'manual',
    });

    expect(experience.tripId).toBe('trip-japan');
  });

  it('creates a standalone experience (tripId undefined) when no trip covers the date', async () => {
    __seed('trips', 'trip-japan', {
      ownerId: 'alex',
      countries: ['Japan'],
      startDate: Timestamp.fromDate(new Date('2026-01-01')),
      endDate: Timestamp.fromDate(new Date('2026-01-10')),
      name: 'Japan — Jan 1–10',
      coverPhotoUrl: '',
      visibility: 'private',
      createdAt: Timestamp.fromDate(new Date('2025-01-01')),
    });

    const experience = await ExperienceRepository.create({
      ownerId: 'alex',
      place: place({ country: 'Japan' }),
      title: 'Later trip',
      notes: '',
      rating: 4,
      photoUrls: [],
      categoryScores: zeroTravelStyleVector(),
      date: new Date('2026-06-01'), // outside trip-japan's range
      dateSource: 'manual',
    });

    expect(experience.tripId).toBeUndefined();
  });

  it('respects an explicitly-provided tripId without consulting the standalone rule', async () => {
    const experience = await ExperienceRepository.create({
      ownerId: 'alex',
      place: place({ country: 'Italy', city: 'Rome' }),
      tripId: 'explicit-trip',
      title: 'Colosseum',
      notes: '',
      rating: 5,
      photoUrls: [],
      categoryScores: zeroTravelStyleVector(),
      date: new Date('2026-03-01'),
      dateSource: 'manual',
    });

    expect(experience.tripId).toBe('explicit-trip');
  });

  it('rejects more than MAX_EXPERIENCE_PHOTOS photos', async () => {
    await expect(
      ExperienceRepository.create({
        ownerId: 'alex',
        place: place({ country: 'France', city: 'Paris' }),
        title: 'Too many photos',
        notes: '',
        rating: 3,
        photoUrls: ['a', 'b', 'c', 'd', 'e', 'f'],
        categoryScores: zeroTravelStyleVector(),
        date: new Date(),
        dateSource: 'manual',
      }),
    ).rejects.toThrow(/at most/);
  });
});
