/**
 * Google Places autocomplete for experience location entry
 * (functional_specification.md §3.3; technical_specification.md §1).
 * Country and city are auto-derived from the selected place's address
 * components, per spec.
 */
import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { TextField } from './TextField';
import { env } from '../lib/env';
import { colors, spacing, typography } from '../theme';

export interface SelectedPlace {
  placeId: string;
  name: string;
  country: string;
  city: string;
  lat: number;
  lng: number;
  googlePlaceType?: string;
}

interface Prediction {
  place_id: string;
  description: string;
}

interface PlacesAutocompleteProps {
  onSelect: (place: SelectedPlace) => void;
}

const DEBOUNCE_MS = 300;

function extractComponent(components: Array<{ long_name: string; types: string[] }>, type: string): string {
  return components.find((c) => c.types.includes(type))?.long_name ?? '';
}

export function PlacesAutocomplete({ onSelect }: PlacesAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [selected, setSelected] = useState<SelectedPlace | undefined>();
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
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=name,geometry,address_component,type&key=${env.googlePlacesApiKey}`;
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
        <FlatList
          style={styles.predictionList}
          data={predictions}
          keyExtractor={(item) => item.place_id}
          renderItem={({ item }) => (
            <Pressable style={styles.predictionRow} onPress={() => selectPrediction(item)}>
              <Text style={typography.body}>{item.description}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  predictionList: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginTop: spacing.xxs,
    backgroundColor: colors.surface,
  },
  predictionRow: {
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
