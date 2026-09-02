import { computeGroupRecommendationForCandidate } from '../groupRecommendation';
import { FakeExperienceStore, FakeUserStore, vector } from './fakes';

describe('computeGroupRecommendationForCandidate', () => {
  it('blends when collaborators are aligned', async () => {
    const userStore = FakeUserStore.seeded({
      alex: { travelStyle: vector({ culture: 8 }), travelStyleBaseline: vector(), travelStyleLastUpdated: new Date() },
      sam: { travelStyle: vector({ culture: 9 }), travelStyleBaseline: vector(), travelStyleLastUpdated: new Date() },
    });
    const experienceStore = FakeExperienceStore.seeded({
      'exp-1': {
        experienceId: 'exp-1',
        ownerId: 'other',
        placeId: 'p1',
        categoryScores: vector({ culture: 9 }),
        photoUrls: [],
        date: new Date(),
        rating: 5,
      },
    });

    const result = await computeGroupRecommendationForCandidate(
      { userStore, experienceStore },
      ['alex', 'sam'],
      'exp-1',
      0.05,
    );

    expect(result.type).toBe('blended');
  });

  it('segments when collaborators diverge', async () => {
    const userStore = FakeUserStore.seeded({
      alex: { travelStyle: vector({ lodging: 10 }), travelStyleBaseline: vector(), travelStyleLastUpdated: new Date() },
      sam: { travelStyle: vector({ sports: 10 }), travelStyleBaseline: vector(), travelStyleLastUpdated: new Date() },
    });
    const experienceStore = FakeExperienceStore.seeded({
      'exp-1': {
        experienceId: 'exp-1',
        ownerId: 'other',
        placeId: 'p1',
        categoryScores: vector({ lodging: 10 }),
        photoUrls: [],
        date: new Date(),
        rating: 5,
      },
    });

    const result = await computeGroupRecommendationForCandidate(
      { userStore, experienceStore },
      ['alex', 'sam'],
      'exp-1',
      0.02,
    );

    expect(result.type).toBe('segmented');
  });
});
