/**
 * Google Places autocomplete for experience location entry
 * (functional_specification.md §3.3; technical_specification.md §1).
 * Country and city are auto-derived from the selected place's address
 * components, per spec.
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
  googlePlaceType?: string;
  /** First Google `photo_reference` — used as the default experience photo
   * when the user doesn't add their own. */
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

function extractComponent(components: Array<{ long_name: string; types: string[] }>, type: string): string {
  return components.find((c) => c.types.includes(type))?.long_name ?? '';
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
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${env.googlePlacesApiKey}`;
      const response = await fetch(url);
      const json = await response.json();
      setPredictions(json.predictions ?? []);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selected]);

  async function selectPrediction(prediction: Prediction) {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=name,geometry,address_component,type,photo&key=${env.googlePlacesApiKey}`;
    const response = await fetch(url);
    const json = await response.json();
    const result = json.result;
    if (!result) return;

    const place: SelectedPlace = {
      placeId: prediction.place_id,
      name: result.name,
      country: extractComponent(result.address_components ?? [], 'country'),
      city:
        extractComponent(result.address_components ?? [], 'locality') ||
        extractComponent(result.address_components ?? [], 'postal_town') ||
        extractComponent(result.address_components ?? [], 'administrative_area_level_1'),
      lat: result.geometry?.location?.lat,
      lng: result.geometry?.location?.lng,
      googlePlaceType: result.types?.[0],
      photoRef: result.photos?.[0]?.photo_reference,
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
