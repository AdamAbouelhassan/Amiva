import { FeedCandidate, FeedStore } from '../feed';
import { getGroupRecommendationCandidates } from '../groupRecommendationCandidates';
import { FakeVisibilityStore, vector } from './fakes';

class FakeCandidateStore implements Pick<FeedStore, 'listRecent'> {
  constructor(private candidates: FeedCandidate[]) {}
  async listRecent(): Promise<FeedCandidate[]> {
    return this.candidates;
  }
}

function candidate(overrides: Partial<FeedCandidate> & Pick<FeedCandidate, 'experienceId' | 'ownerId'>): FeedCandidate {
  return { title: 'Untitled', city: 'Anycity', country: 'Anyland', categoryScores: vector(), createdAt: new Date(), ...overrides };
}

describe('getGroupRecommendationCandidates', () => {
  it("includes a public stranger's experience", async () => {
    const candidateStore = new FakeCandidateStore([candidate({ experienceId: 'a', ownerId: 'stranger', title: 'Museum' })]);
    const visibilityStore = FakeVisibilityStore.seeded({ stranger: 'public' });

    const result = await getGroupRecommendationCandidates({ candidateStore, visibilityStore }, ['viewer', 'friend-1']);

    expect(result.map((c) => c.experienceId)).toEqual(['a']);
    expect(result[0]?.title).toBe('Museum');
  });

  it("excludes a private stranger's experience", async () => {
    const candidateStore = new FakeCandidateStore([candidate({ experienceId: 'a', ownerId: 'stranger' })]);
    const visibilityStore = FakeVisibilityStore.seeded({ stranger: 'private' });

    const result = await getGroupRecommendationCandidates({ candidateStore, visibilityStore }, ['viewer', 'friend-1']);

    expect(result).toHaveLength(0);
  });

  it("excludes a friends-only stranger's experience even though the caller might be their friend", async () => {
    // Deliberately conservative for a group pool — see this file's header.
    const candidateStore = new FakeCandidateStore([candidate({ experienceId: 'a', ownerId: 'stranger' })]);
    const visibilityStore = FakeVisibilityStore.seeded({ stranger: 'friends' });

    const result = await getGroupRecommendationCandidates({ candidateStore, visibilityStore }, ['viewer', 'friend-1']);

    expect(result).toHaveLength(0);
  });

  it("always includes a collaborator's own experience regardless of their privacy setting", async () => {
    const candidateStore = new FakeCandidateStore([candidate({ experienceId: 'a', ownerId: 'friend-1' })]);
    const visibilityStore = FakeVisibilityStore.seeded({ 'friend-1': 'private' });

    const result = await getGroupRecommendationCandidates({ candidateStore, visibilityStore }, ['viewer', 'friend-1']);

    expect(result.map((c) => c.experienceId)).toEqual(['a']);
  });

  it('respects the limit', async () => {
    const candidateStore = new FakeCandidateStore([
      candidate({ experienceId: 'a', ownerId: 'viewer' }),
      candidate({ experienceId: 'b', ownerId: 'viewer' }),
      candidate({ experienceId: 'c', ownerId: 'viewer' }),
    ]);
    const visibilityStore = FakeVisibilityStore.seeded({});

    const result = await getGroupRecommendationCandidates({ candidateStore, visibilityStore }, ['viewer'], 2);

    expect(result).toHaveLength(2);
  });
});
