/**
 * Cloud Functions entry point. Every export here is a thin trigger (see
 * src/triggers/*) delegating to a tested plain function in src/lib
 * (CLAUDE.md #4, #8). This file itself contains no business logic.
 */
export { onExperienceCreated } from './triggers/onExperienceCreated';
export { onSaveCreated } from './triggers/onSaveCreated';
export { onFriendAdded } from './triggers/onFriendAdded';
export { onTravelStyleChanged } from './triggers/onTravelStyleChanged';
export { computeMatchScore } from './triggers/computeMatchScore';
export { convertPlannedTripToLogbook } from './triggers/convertPlannedTripToLogbook';
export { revertCompletedTrip } from './triggers/revertCompletedTrip';
export { getTrending } from './triggers/getTrending';
export { sendNotification } from './triggers/sendNotification';

// Discovery tabs (Local / Trending / Friends). getTrending and
// getFriendsActivity are Admin-SDK-backed read aggregations, both the
// actual enforcement point for experience-read privacy across many owners
// (see each lib file's header). (getFeed — the old matched-experience
// "Feed" — was retired when the tab became a friend-activity feed.)
export { getFriendsActivity } from './triggers/getFriendsActivity';
export { getPlaceRecommendations } from './triggers/getPlaceRecommendations';

// Additions beyond the technical spec's §5 table, each required to make an
// already-specified product behavior actually work under §6's security
// model (server-only writes for computed fields) — see the header comment
// in each trigger file for why.
export { computeGroupRecommendation } from './triggers/computeGroupRecommendation';
// Fixes the same privacy-query bug Feed/Trending had — see
// functions/src/lib/groupRecommendationCandidates.ts.
export { getGroupRecommendationCandidates } from './triggers/getGroupRecommendationCandidates';
export { updateTravelStyleManual } from './triggers/updateTravelStyleManual';
export { upsertPlace } from './triggers/upsertPlace';
export { matchContacts } from './triggers/matchContacts';
