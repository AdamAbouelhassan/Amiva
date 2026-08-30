import { TravelStyleVector, zeroTravelStyleVector } from '@amiva/core';
import {
  ExperienceRecord,
  ExperienceStore,
  FriendStore,
  NotificationRecord,
  NotificationStore,
  TripRecord,
  TripStore,
  UserStore,
  UserStyleRecord,
  VisibilityStore,
} from '../ports';

export function vector(overrides: Partial<TravelStyleVector> = {}): TravelStyleVector {
  return { ...zeroTravelStyleVector(), ...overrides };
}

/** Merges several fake store instances into one object exposing all of
 * their (bound) methods — lets a test satisfy a lib function's combined
 * port type (e.g. `UserStore & FriendStore & NotificationStore`) from
 * several small, single-purpose fakes instead of one monolithic fake. */
export function combineStores<T>(...parts: object[]): T {
  const result: Record<string, unknown> = {};
  for (const part of parts) {
    let proto = Object.getPrototypeOf(part);
    while (proto && proto !== Object.prototype) {
      for (const key of Object.getOwnPropertyNames(proto)) {
        if (key === 'constructor') continue;
        const value = (part as Record<string, unknown>)[key];
        if (typeof value === 'function') {
          result[key] = value.bind(part);
        }
      }
      proto = Object.getPrototypeOf(proto);
    }
  }
  return result as T;
}

export class FakeUserStore implements UserStore {
  constructor(private users: Map<string, UserStyleRecord> = new Map()) {}

  static seeded(entries: Record<string, UserStyleRecord>): FakeUserStore {
    return new FakeUserStore(new Map(Object.entries(entries)));
  }

  async getUserStyle(userId: string): Promise<UserStyleRecord> {
    const record = this.users.get(userId);
    if (!record) throw new Error(`FakeUserStore: no user ${userId}`);
    return record;
  }

  async saveAutomaticStyleUpdate(userId: string, travelStyle: TravelStyleVector): Promise<void> {
    const existing = await this.getUserStyle(userId);
    this.users.set(userId, { ...existing, travelStyle });
  }

  async saveManualStyleEdit(userId: string, record: UserStyleRecord): Promise<void> {
    this.users.set(userId, record);
  }
}

export class FakeExperienceStore implements ExperienceStore {
  constructor(private experiences: Map<string, ExperienceRecord> = new Map()) {}

  static seeded(entries: Record<string, ExperienceRecord>): FakeExperienceStore {
    return new FakeExperienceStore(new Map(Object.entries(entries)));
  }

  async getExperience(experienceId: string): Promise<ExperienceRecord> {
    const record = this.experiences.get(experienceId);
    if (!record) throw new Error(`FakeExperienceStore: no experience ${experienceId}`);
    return record;
  }
}

export class FakeTripStore implements TripStore {
  constructor(private trips: Map<string, TripRecord> = new Map()) {}

  static seeded(entries: Record<string, TripRecord>): FakeTripStore {
    return new FakeTripStore(new Map(Object.entries(entries)));
  }

  async getTrip(tripId: string): Promise<TripRecord | undefined> {
    return this.trips.get(tripId);
  }

  async setCoverPhotoIfUnset(tripId: string, photoUrl: string): Promise<void> {
    const trip = this.trips.get(tripId);
    if (!trip) throw new Error(`FakeTripStore: no trip ${tripId}`);
    this.trips.set(tripId, { ...trip, coverPhotoUrl: photoUrl });
  }
}

export class FakeFriendStore implements FriendStore {
  edges: Array<{ userId: string; friendId: string; compatibilityScore: number }> = [];

  async createFriendEdgePair(edge: Parameters<FriendStore['createFriendEdgePair']>[0]): Promise<void> {
    this.edges.push({ userId: edge.userId, friendId: edge.friendId, compatibilityScore: edge.compatibilityScore });
    this.edges.push({ userId: edge.friendId, friendId: edge.userId, compatibilityScore: edge.compatibilityScore });
  }

  async getFriendIdsOf(userId: string): Promise<string[]> {
    return this.edges.filter((e) => e.userId === userId).map((e) => e.friendId);
  }

  async updateCompatibilityScore(userId: string, friendId: string, score: number): Promise<void> {
    const edge = this.edges.find((e) => e.userId === userId && e.friendId === friendId);
    if (edge) edge.compatibilityScore = score;
  }
}

export class FakeVisibilityStore implements VisibilityStore {
  constructor(private settings: Map<string, 'public' | 'private' | 'friends'> = new Map()) {}

  static seeded(entries: Record<string, 'public' | 'private' | 'friends'>): FakeVisibilityStore {
    return new FakeVisibilityStore(new Map(Object.entries(entries)));
  }

  async getPrivacySettings(userIds: string[]): Promise<Record<string, 'public' | 'private' | 'friends'>> {
    const result: Record<string, 'public' | 'private' | 'friends'> = {};
    for (const id of userIds) {
      const setting = this.settings.get(id);
      if (setting) result[id] = setting;
    }
    return result;
  }
}

export class FakeNotificationStore implements NotificationStore {
  notifications: NotificationRecord[] = [];
  private nextId = 1;

  async createNotification(input: Omit<NotificationRecord, 'notificationId' | 'read'>): Promise<string> {
    const notificationId = `notif-${this.nextId++}`;
    this.notifications.push({ ...input, notificationId, read: false });
    return notificationId;
  }
}
