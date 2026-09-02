import { estimateCategoryScoresFromPlace } from '../placeCategoryEstimate';
import { isApprovedPlace, resolvePlaceType } from '../placeGate';

describe('isApprovedPlace', () => {
  it('rejects a place whose type is not in the approved (post-reduction) set', () => {
    expect(isApprovedPlace({ primaryType: 'car_repair', types: ['car_repair'] })).toEqual({
      approved: false,
      reason: 'type_not_approved',
    });
    expect(isApprovedPlace({ primaryType: 'hospital', types: ['hospital', 'health'] }).approved).toBe(false);
  });

  it('accepts an approved non-places-of-worship type', () => {
    expect(isApprovedPlace({ primaryType: 'spa', types: ['spa', 'point_of_interest'] })).toEqual({
      approved: true,
    });
  });

  it('accepts a place of worship that also carries a landmark type', () => {
    expect(
      isApprovedPlace({ primaryType: 'church', types: ['church', 'historical_landmark'] }).approved,
    ).toBe(true);
  });

  it('rejects a place of worship with neither a landmark type nor enough reviews', () => {
    expect(isApprovedPlace({ primaryType: 'church', types: ['church'], userRatingCount: 12 })).toEqual({
      approved: false,
      reason: 'pow_no_landmark',
    });
  });

  it('accepts a place of worship on the popularity fallback alone (OR, not AND)', () => {
    expect(
      isApprovedPlace({ primaryType: 'mosque', types: ['mosque'], userRatingCount: 5000 }).approved,
    ).toBe(true);
  });

  it('honours a custom minRatingCount override', () => {
    const input = { primaryType: 'synagogue', types: ['synagogue'], userRatingCount: 200 };
    expect(isApprovedPlace(input, 500).approved).toBe(false);
    expect(isApprovedPlace(input, 100).approved).toBe(true);
  });

  it('resolves the categorising type from a secondary approved type when primaryType is pruned', () => {
    expect(resolvePlaceType({ primaryType: 'hospital', types: ['hospital', 'spa'] })).toBe('spa');
  });

  it('an accepted landmark church scores split 50/50 places_of_worship / culture', () => {
    // The gate has already passed; this is what estimateCategoryScoresFromPlace does with the stored type.
    const scores = estimateCategoryScoresFromPlace(['church']);
    expect(scores.places_of_worship).toBe(2.5);
    expect(scores.culture).toBe(2.5);
  });
});
