import { maybeSetTripCoverPhoto } from '../tripCoverPhoto';
import { FakeTripStore } from './fakes';

describe('maybeSetTripCoverPhoto', () => {
  it('sets the cover photo when the trip has none yet', async () => {
    const store = FakeTripStore.seeded({ 'trip-1': { tripId: 'trip-1' } });
    await maybeSetTripCoverPhoto(store, 'trip-1', ['https://photos/a.jpg', 'https://photos/b.jpg']);
    expect((await store.getTrip('trip-1'))?.coverPhotoUrl).toBe('https://photos/a.jpg');
  });

  it('never overwrites an existing cover photo (auto or manual)', async () => {
    const store = FakeTripStore.seeded({
      'trip-1': { tripId: 'trip-1', coverPhotoUrl: 'https://photos/manual-override.jpg' },
    });
    await maybeSetTripCoverPhoto(store, 'trip-1', ['https://photos/new.jpg']);
    expect((await store.getTrip('trip-1'))?.coverPhotoUrl).toBe('https://photos/manual-override.jpg');
  });

  it('does nothing when the new experience has no photos', async () => {
    const store = FakeTripStore.seeded({ 'trip-1': { tripId: 'trip-1' } });
    await maybeSetTripCoverPhoto(store, 'trip-1', []);
    expect((await store.getTrip('trip-1'))?.coverPhotoUrl).toBeUndefined();
  });

  it('does nothing when the trip does not exist', async () => {
    const store = FakeTripStore.seeded({});
    await expect(maybeSetTripCoverPhoto(store, 'missing', ['https://photos/a.jpg'])).resolves.toBeUndefined();
  });
});
