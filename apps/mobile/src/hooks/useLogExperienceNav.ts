/**
 * "Log this" — turn an existing experience (a friend's post, one you saved)
 * or a saved place into a pre-filled "Log an experience" form. Every stack
 * that surfaces a "Log this" affordance (Discovery, Logbook, Social,
 * Planner) registers `CreateExperience`, so `navigate` resolves in-stack
 * and closing the form returns to where you started.
 */
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TravelStyleVector } from '@amiva/core';
import { fetchPlaceCoords } from '../lib/placeDetails';
import { PlaceRepository } from '../repositories/placeRepository';
import { ExperienceDoc } from '../repositories/types';
import { DiscoveryStackParamList, ExperiencePrefill } from '../navigation/types';

/** Anything place-shaped enough to seed an experience — a saved place, a
 * Local recommendation, etc. */
interface PlaceLike {
  placeId: string;
  name: string;
  city: string;
  country: string;
  lat?: number;
  lng?: number;
  photoRef?: string;
  categoryScores: TravelStyleVector;
}

export function useLogExperienceNav() {
  // Typed against the Discovery stack; both stacks that register
  // `CreateExperience` share an identical param shape, and this hook only
  // ever runs on a screen belonging to one of them.
  const navigation = useNavigation<NativeStackNavigationProp<DiscoveryStackParamList>>();
  const [preparing, setPreparing] = useState(false);

  async function fromExperience(experience: ExperienceDoc) {
    setPreparing(true);
    try {
      const place = await PlaceRepository.getById(experience.placeId);
      const prefill: ExperiencePrefill = {
        place: place
          ? {
              placeId: place.placeId,
              name: place.name,
              country: place.country,
              city: place.city,
              lat: place.lat,
              lng: place.lng,
              googlePlaceTypes: place.googlePlaceTypes,
            }
          : {
              placeId: experience.placeId,
              name: experience.title,
              country: experience.country,
              city: experience.city,
              lat: 0,
              lng: 0,
              googlePlaceTypes: [],
            },
        title: experience.title,
        categoryScores: experience.categoryScores,
      };
      navigation.navigate('CreateExperience', { prefill });
    } finally {
      setPreparing(false);
    }
  }

  async function fromPlace(place: PlaceLike, opts?: { tripId?: string }) {
    setPreparing(true);
    try {
      let { lat, lng } = place;
      if (lat == null || lng == null) {
        const coords = await fetchPlaceCoords(place.placeId);
        lat = coords?.lat ?? 0;
        lng = coords?.lng ?? 0;
      }
      navigation.navigate('CreateExperience', {
        tripId: opts?.tripId,
        prefill: {
          place: {
            placeId: place.placeId,
            name: place.name,
            country: place.country,
            city: place.city,
            lat,
            lng,
            photoRef: place.photoRef,
            // PlaceLike (a saved place / Local recommendation) only ever
            // carries an already-computed categoryScores, not raw Google
            // types — unlike the PlacesAutocomplete path, this place may
            // not exist in `places` yet, so onExperienceCreated's
            // server-side derivation (functions/src/lib/
            // experienceCategoryDerivation.ts) has nothing to look up and
            // falls back to the zero vector. Known gap, not the primary
            // logging path the taxonomy migration targets — flagged
            // rather than silently mis-scored.
            googlePlaceTypes: [],
          },
          categoryScores: place.categoryScores,
        },
      });
    } finally {
      setPreparing(false);
    }
  }

  return { fromExperience, fromPlace, preparing };
}
