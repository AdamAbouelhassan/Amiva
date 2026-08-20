import {
  canExperienceBeStandalone,
  computeTripRecategorization,
  findOwningTrip,
  generateTripName,
  isDateWithinRange,
  TripForCategorization,
} from '../tripCategorization';

const japanTrip: TripForCategorization = {
  tripId: 'trip-japan-jan',
  countries: ['Japan'],
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-01-10'),
};

describe('isDateWithinRange', () => {
  it('includes the boundary dates', () => {
    expect(isDateWithinRange(new Date('2026-01-01'), japanTrip)).toBe(true);
    expect(isDateWithinRange(new Date('2026-01-10'), japanTrip)).toBe(true);
  });
  it('excludes dates outside the range', () => {
    expect(isDateWithinRange(new Date('2026-01-11'), japanTrip)).toBe(false);
  });
});

describe('findOwningTrip / canExperienceBeStandalone', () => {
  it('finds the trip covering a matching country + in-range date', () => {
    const found = findOwningTrip('Japan', new Date('2026-01-05'), [japanTrip]);
    expect(found?.tripId).toBe('trip-japan-jan');
  });

  it('allows standalone when no trip covers the date (same country, different date range)', () => {
    const allowed = canExperienceBeStandalone('Japan', new Date('2026-06-01'), [japanTrip]);
    expect(allowed).toBe(true);
  });

  it('disallows standalone when a matching trip already covers the date', () => {
    const allowed = canExperienceBeStandalone('Japan', new Date('2026-01-05'), [japanTrip]);
    expect(allowed).toBe(false);
  });

  it('allows standalone for a different country entirely', () => {
    const allowed = canExperienceBeStandalone('Italy', new Date('2026-01-05'), [japanTrip]);
    expect(allowed).toBe(true);
  });
});

describe('computeTripRecategorization', () => {
  it('evicts an experience from the trip once its date falls outside a shrunk range', () => {
    const shrunkTrip: TripForCategorization = {
      ...japanTrip,
      endDate: new Date('2026-01-03'),
    };
    const result = computeTripRecategorization(shrunkTrip, [
      { experienceId: 'exp-1', country: 'Japan', date: new Date('2026-01-08'), tripId: 'trip-japan-jan' },
    ]);
    expect(result.toRemove).toEqual(['exp-1']);
    expect(result.toAdd).toEqual([]);
  });

  it('pulls in a standalone experience once its date falls inside an expanded range', () => {
    const expandedTrip: TripForCategorization = {
      ...japanTrip,
      endDate: new Date('2026-01-20'),
    };
    const result = computeTripRecategorization(expandedTrip, [
      { experienceId: 'exp-2', country: 'Japan', date: new Date('2026-01-15') }, // standalone (no tripId)
    ]);
    expect(result.toAdd).toEqual(['exp-2']);
    expect(result.toRemove).toEqual([]);
  });

  it('does not touch an experience already correctly categorized', () => {
    const result = computeTripRecategorization(japanTrip, [
      { experienceId: 'exp-3', country: 'Japan', date: new Date('2026-01-05'), tripId: 'trip-japan-jan' },
    ]);
    expect(result.toAdd).toEqual([]);
    expect(result.toRemove).toEqual([]);
  });

  it('does not poach an experience that belongs to a different trip', () => {
    const expandedTrip: TripForCategorization = { ...japanTrip, endDate: new Date('2026-01-20') };
    const result = computeTripRecategorization(expandedTrip, [
      { experienceId: 'exp-4', country: 'Japan', date: new Date('2026-01-15'), tripId: 'some-other-trip' },
    ]);
    expect(result.toAdd).toEqual([]);
    expect(result.toRemove).toEqual([]);
  });
});

describe('generateTripName', () => {
  it('generates "Country — Mon D–D" for a same-month range', () => {
    expect(generateTripName(['Japan'], { startDate: new Date('2026-01-01'), endDate: new Date('2026-01-10') })).toBe(
      'Japan — Jan 1–10',
    );
  });

  it('appends a +N suffix for multi-country trips', () => {
    const name = generateTripName(['France', 'Italy', 'Spain'], {
      startDate: new Date('2026-05-01'),
      endDate: new Date('2026-05-15'),
    });
    expect(name).toBe('France +2 — May 1–15');
  });
});
