import { zeroTravelStyleVector } from '@amiva/core';

jest.mock('firebase/firestore');
jest.mock('../../firebase/client', () => ({ db: {}, functions: {} }));
jest.mock('firebase/functions', () => ({
  httpsCallable: () => async () => ({ data: { success: true } }),
}));

import { __getRaw, __reset, __seed } from 'firebase/firestore';
import { ExperienceRepository } from '../experienceRepository';

const place = (overrides: Partial<{ country: string; city: string; placeId: string }> = {}) => ({
  placeId: overrides.placeId ?? 'place-1',
  name: 'Some Place',
  country: overrides.country ?? 'Japan',
  city: overrides.city ?? 'Tokyo',
  lat: 35.6,
  lng: 139.7,
  googlePlaceTypes: [] as string[],
});

const draft = (overrides: Record<string, unknown> = {}) => ({
  ownerId: 'alex',
  place: place(),
  title: 'Ramen',
  notes: '',
  rating: 5,
  photoUrls: [] as string[],
  categoryScores: zeroTravelStyleVector(),
  date: new Date('2026-01-05'),
  dateSource: 'manual' as const,
  ...overrides,
});

describe('ExperienceRepository.create — explicit trip attachment', () => {
  beforeEach(() => __reset());

  it('creates a standalone experience (tripId undefined) when none is given', async () => {
    const experience = await ExperienceRepository.create(draft());
    expect(experience.tripId).toBeUndefined();
  });

  it('attaches to the explicitly-provided tripId', async () => {
    const experience = await ExperienceRepository.create(draft({ tripId: 'explicit-trip' }));
    expect(experience.tripId).toBe('explicit-trip');
  });

  it('rejects more than MAX_EXPERIENCE_PHOTOS photos', async () => {
    await expect(
      ExperienceRepository.create(draft({ photoUrls: ['a', 'b', 'c', 'd', 'e', 'f'] })),
    ).rejects.toThrow(/at most/);
  });
});

describe('ExperienceRepository.setTrip', () => {
  beforeEach(() => __reset());

  it('attaches and detaches an experience', async () => {
    __seed('experiences', 'exp-1', { ownerId: 'alex', tripId: null });
    await ExperienceRepository.setTrip('exp-1', 'trip-9');
    expect(__getRaw('experiences', 'exp-1')?.tripId).toBe('trip-9');
    await ExperienceRepository.setTrip('exp-1', null);
    expect(__getRaw('experiences', 'exp-1')?.tripId).toBeNull();
  });
});
