/**
 * Backs `onExperienceCreated` (isLogged=true) and `onSaveCreated`
 * (isLogged=false) — technical_specification.md §5. Both triggers funnel
 * into this one lib function so the decay math (packages/core) is only
 * ever invoked from one place server-side (CLAUDE.md #8).
 */
import { computeStyleAdjustment, TravelStyleVector } from '@amiva/core';
import { DecayConfig } from '@amiva/core';
import { UserStore } from './ports';

export interface ApplyExperienceStyleEventInput {
  userId: string;
  experienceVector: TravelStyleVector;
  isLogged: boolean;
  eventDate: Date;
  decayConfig: DecayConfig;
}

export async function applyExperienceStyleEvent(
  store: UserStore,
  input: ApplyExperienceStyleEventInput,
): Promise<TravelStyleVector> {
  const current = await store.getUserStyle(input.userId);

  const { travelStyle } = computeStyleAdjustment({
    currentVector: current.travelStyle,
    travelStyleLastUpdated: current.travelStyleLastUpdated,
    experienceVector: input.experienceVector,
    isLogged: input.isLogged,
    eventDate: input.eventDate,
    config: input.decayConfig,
  });

  await store.saveAutomaticStyleUpdate(input.userId, travelStyle);
  return travelStyle;
}
