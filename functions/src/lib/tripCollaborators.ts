/**
 * Backs the `addTripCollaborator` callable — adding a friend to a planned
 * trip as a co-editor (functional_specification.md §6.1: modeled like a
 * shared document, unlimited collaborators, direct-add, no invite/accept).
 *
 * A callable (not a client `arrayUnion` write) because adding a
 * collaborator also fires a `group_trip_joined` notification
 * (functional_specification.md §6.5), and notifications are Cloud-Function-
 * only writes (technical_specification.md §6). Mirrors `onFriendAdded`.
 */
import { NotificationStore } from './ports';

export interface CollaboratorPlannedTrip {
  ownerId: string;
  collaboratorIds: string[];
}

export interface TripCollaboratorStore extends NotificationStore {
  getPlannedTrip(plannedTripId: string): Promise<CollaboratorPlannedTrip | undefined>;
  userExists(userId: string): Promise<boolean>;
  addCollaborator(plannedTripId: string, collaboratorId: string): Promise<void>;
}

export interface AddTripCollaboratorInput {
  plannedTripId: string;
  actorId: string;
  collaboratorId: string;
  now: Date;
}

export async function addTripCollaborator(
  store: TripCollaboratorStore,
  input: AddTripCollaboratorInput,
): Promise<{ added: boolean }> {
  const { plannedTripId, actorId, collaboratorId } = input;

  if (collaboratorId === actorId) {
    throw new Error('You are already on this trip.');
  }

  const trip = await store.getPlannedTrip(plannedTripId);
  if (!trip) throw new Error('Planned trip not found.');

  const isParticipant = trip.ownerId === actorId || trip.collaboratorIds.includes(actorId);
  if (!isParticipant) throw new Error('Only someone on the trip can add collaborators.');

  if (trip.ownerId === collaboratorId || trip.collaboratorIds.includes(collaboratorId)) {
    return { added: false }; // already on the trip — idempotent
  }

  if (!(await store.userExists(collaboratorId))) {
    throw new Error('That user does not exist.');
  }

  await store.addCollaborator(plannedTripId, collaboratorId);
  await store.createNotification({
    recipientId: collaboratorId,
    type: 'group_trip_joined',
    payload: { plannedTripId, actorId },
    createdAt: input.now,
  });

  return { added: true };
}
