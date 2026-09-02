/**
 * Google Places (New) autocomplete for experience location entry
 * (functional_specification.md §3.3). Country and city are auto-derived
 * from the selected place's address components.
 *
 * Migrated from the legacy Places API (taxonomy-reduction pass,
 * 2026-09-02) — `v1/places:autocomplete` + `v1/places/{id}` with an
 * explicit `X-Goog-FieldMask`. The details call also pulls `primaryType`,
 * the full `types` array (the ingestion gate needs it), `priceLevel`,
 * `rating` and `userRatingCount` — all on the field-mask tier the gate
 * already pays for. "Places API (New)" must be enabled on the GCP project.
 */
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { TextField } from './TextField';
import { env } from '../lib/env';
import { radius, spacing, useTheme } from '../theme';

export interface SelectedPlace {
  placeId: string;
  name: string;
  country: string;
  city: string;
  lat: number;
  lng: number;
  /** Google Places (New) `primaryType` (raw type id, e.g. `sushi_restaurant`) —
   * named to match `PlaceDoc.googlePlaceType`. */
  googlePlaceType?: string;
  /** The full `types` array — the ingestion gate + category scoring need
   * every type, not just the primary one. */
  googlePlaceTypes: string[];
  /** Google Places (New) `priceLevel` enum string. */
  priceLevel?: string;
  /** Google crowd rating 1.0–5.0. */
  rating?: number;
  /** Number of Google reviews behind the rating (also the places-of-worship
   * landmark-gate fallback signal). */
  userRatingCount?: number;
  /** First Google photo resource name (`places/ID/photos/ID`) — the default
   * experience photo when the user doesn't add their own. */
  photoRef?: string;
}

interface Prediction {
  place_id: string;
  description: string;
}

interface PlacesAutocompleteProps {
  onSelect: (place: SelectedPlace) => void;
  /** Pre-fill the field with an already-known place (e.g. "Log this"
   * from an existing experience). The user can still overwrite it. */
  initialPlace?: SelectedPlace;
}

const DEBOUNCE_MS = 300;
const AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';
const DETAILS_FIELD_MASK =
  'id,displayName,location,addressComponents,primaryType,types,photos,priceLevel,rating,userRatingCount';

interface NewAddressComponent {
  longText?: string;
  shortText?: string;
  types?: string[];
}

function extractComponent(components: NewAddressComponent[], type: string): string {
  return components.find((c) => c.types?.includes(type))?.longText ?? '';
}

export function PlacesAutocomplete({ onSelect, initialPlace }: PlacesAutocompleteProps) {
  const t = useTheme();
  const [query, setQuery] = useState(initialPlace?.name ?? '');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [selected, setSelected] = useState<SelectedPlace | undefined>(initialPlace);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (selected || query.trim().length < 3) {
      setPredictions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const response = await fetch(AUTOCOMPLETE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': env.googlePlacesApiKey,
        },
        body: JSON.stringify({ input: query }),
      });
      const json = await response.json();
      const suggestions: Array<{ placePrediction?: { placeId: string; text?: { text?: string } } }> =
        json.suggestions ?? [];
      setPredictions(
        suggestions
          .filter((s) => s.placePrediction?.placeId)
          .map((s) => ({
            place_id: s.placePrediction!.placeId,
            description: s.placePrediction!.text?.text ?? '',
          })),
      );
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selected]);

  async function selectPrediction(prediction: Prediction) {
    const response = await fetch(`https://places.googleapis.com/v1/places/${prediction.place_id}`, {
      headers: {
        'X-Goog-Api-Key': env.googlePlacesApiKey,
        'X-Goog-FieldMask': DETAILS_FIELD_MASK,
      },
    });
    const result = await response.json();
    if (!result?.id) return;

    const components: NewAddressComponent[] = result.addressComponents ?? [];
    const place: SelectedPlace = {
      placeId: result.id,
      name: result.displayName?.text ?? prediction.description,
      country: extractComponent(components, 'country'),
      city:
        extractComponent(components, 'locality') ||
        extractComponent(components, 'postal_town') ||
        extractComponent(components, 'administrative_area_level_1'),
      lat: result.location?.latitude,
      lng: result.location?.longitude,
      googlePlaceType: result.primaryType,
      googlePlaceTypes: result.types ?? [],
      priceLevel: result.priceLevel,
      rating: typeof result.rating === 'number' ? result.rating : undefined,
      userRatingCount: typeof result.userRatingCount === 'number' ? result.userRatingCount : undefined,
      photoRef: result.photos?.[0]?.name,
    };

    setSelected(place);
    setQuery(place.name);
    setPredictions([]);
    onSelect(place);
  }

  return (
    <View>
      <TextField
        label="Location"
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          setSelected(undefined);
        }}
        placeholder="Search for a place"
      />
      {predictions.length > 0 && (
        // A plain View, not a FlatList — this list is ≤5 items and often
        // renders inside a ScrollView (CreateExperience etc.), where a
        // nested vertical VirtualizedList warns and breaks scrolling.
        <View
          style={{
            borderWidth: 1,
            borderColor: t.colors.border,
            borderRadius: radius.chip,
            marginTop: spacing.xxs,
            backgroundColor: t.colors.surface,
            overflow: 'hidden',
          }}
        >
          {predictions.slice(0, 5).map((item, i) => (
            <Pressable
              key={item.place_id}
              style={{
                padding: spacing.sm,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: t.colors.border,
              }}
              onPress={() => selectPrediction(item)}
            >
              <Text style={t.type.body}>{item.description}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
