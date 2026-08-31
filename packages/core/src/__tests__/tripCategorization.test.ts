import { deriveDefaultCoverPhoto, generateTripName } from '../tripCategorization';

describe('generateTripName', () => {
  const range = (a: string, b: string) => ({ startDate: new Date(a), endDate: new Date(b) });

  it('falls back to "Trip" for a blank location', () => {
    expect(generateTripName('   ', range('2026-01-01', '2026-01-10'))).toBe('Trip — Jan 1–10');
  });

  it('formats a same-month range as "Location — Mon D–D"', () => {
    expect(generateTripName('Japan', range('2026-01-01', '2026-01-10'))).toBe('Japan — Jan 1–10');
  });

  it('formats a cross-month range with both months', () => {
    expect(generateTripName('Lisbon, Portugal', range('2026-05-28', '2026-06-04'))).toBe(
      'Lisbon, Portugal — May 28–Jun 4',
    );
  });
});

describe('deriveDefaultCoverPhoto', () => {
  it('returns the first photo in date order', () => {
    const cover = deriveDefaultCoverPhoto([
      { photoUrls: [], date: new Date('2026-01-01') },
      { photoUrls: ['b.jpg'], date: new Date('2026-01-05') },
      { photoUrls: ['a.jpg'], date: new Date('2026-01-03') },
    ]);
    expect(cover).toBe('a.jpg');
  });

  it('returns undefined when no experience has a photo', () => {
    expect(deriveDefaultCoverPhoto([{ photoUrls: [], date: new Date() }])).toBeUndefined();
  });
});
