/**
 * A location picker with Google-Places-style autocomplete, restricted to
 * places (country / province / city), not businesses. Used by the Discovery
 * "Local" search and the trip forms. Returns a `{ label, country, city? }` —
 * `city` also carries a province/region when that's what was picked, which
 * is exactly what the recommendations query wants ("<subject> in <city>,
 * <country>").
 *
 * On Google Places API (New) — `v1/places:autocomplete` +
 * `v1/places/{id}` with an `X-Goog-FieldMask`, matching PlacesAutocomplete
 * (the legacy `maps/api/place/*` endpoints 403 now that only "Places API
 * (New)" is enabled on the project). Region-scoped via
 * `includedPrimaryTypes: ['(regions)']`.
 */
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Pressable, Text, View } from 'react-native';
import { env } from '../lib/env';
import { radius, spacing, useTheme } from '../theme';
import { TextField } from './TextField';

export interface SelectedLocation {
  /** Human string, e.g. "Lisbon, Portugal". */
  label: string;
  country: string;
  /** City, or a province/region, or undefined for a whole country. */
  city?: string;
}

interface LocationSearchFieldProps {
  value: SelectedLocation | null;
  onChange: (loc: SelectedLocation) => void;
  /** Shown while the current-location autofill is resolving. */
  loading?: boolean;
  /** Omit for a compact placeholder-only search bar. */
  label?: string;
}

interface Prediction {
  place_id: string;
  description: string;
}

const DEBOUNCE_MS = 300;
const AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';
const DETAILS_FIELD_MASK = 'addressComponents';

interface NewAddressComponent {
  longText?: string;
  shortText?: string;
  types?: string[];
}

function component(components: NewAddressComponent[], ...types: string[]): string {
  for (const type of types) {
    const hit = components.find((c) => c.types?.includes(type));
    if (hit?.longText) return hit.longText;
  }
  return '';
}

export function LocationSearchField({ value, onChange, loading, label }: LocationSearchFieldProps) {
  const t = useTheme();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [resolving, setResolving] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Mirror an externally-set value (e.g. current-location autofill) into
  // the field text while the user isn't actively editing.
  useEffect(() => {
    if (!editing && value) setQuery(value.label);
  }, [value, editing]);

  useEffect(() => {
    if (!editing || query.trim().length < 2) {
      setPredictions([]);
      return;
    }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      try {
        const res = await fetch(AUTOCOMPLETE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': env.googlePlacesApiKey,
          },
          body: JSON.stringify({ input: query, includedPrimaryTypes: ['(regions)'] }),
        });
        const json = await res.json();
        const suggestions: Array<{
          placePrediction?: { placeId: string; text?: { text?: string } };
        }> = json.suggestions ?? [];
        setPredictions(
          suggestions
            .filter((s) => s.placePrediction?.placeId)
            .slice(0, 5)
            .map((s) => ({
              place_id: s.placePrediction!.placeId,
              description: s.placePrediction!.text?.text ?? '',
            })),
        );
      } catch {
        setPredictions([]);
      }
    }, DEBOUNCE_MS);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query, editing]);

  async function pick(prediction: Prediction) {
    Keyboard.dismiss();
    setEditing(false);
    setPredictions([]);
    setQuery(prediction.description);
    setResolving(true);
    try {
      const res = await fetch(`https://places.googleapis.com/v1/places/${prediction.place_id}`, {
        headers: {
          'X-Goog-Api-Key': env.googlePlacesApiKey,
          'X-Goog-FieldMask': DETAILS_FIELD_MASK,
        },
      });
      const json = await res.json();
      const comps: NewAddressComponent[] = json.addressComponents ?? [];
      const country = component(comps, 'country');
      const city = component(
        comps,
        'locality',
        'postal_town',
        'administrative_area_level_2',
        'administrative_area_level_1',
      );
      if (country) {
        onChange({
          label: prediction.description,
          country,
          city: city && city !== country ? city : undefined,
        });
      }
    } finally {
      setResolving(false);
    }
  }

  return (
    <View>
      <TextField
        label={label}
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          setEditing(true);
        }}
        onFocus={() => setEditing(true)}
        placeholder="Search a country, city, or region"
        autoCapitalize="words"
        returnKeyType="search"
      />

      {(loading || resolving) && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xxs }}>
          <ActivityIndicator size="small" color={t.colors.accent} />
          <Text style={[t.type.caption, { color: t.colors.textSecondary }]}>
            {loading ? 'Finding your location…' : 'Loading…'}
          </Text>
        </View>
      )}

      {editing && predictions.length > 0 && (
        <View
          style={{
            marginTop: spacing.xxs,
            borderWidth: 1,
            borderColor: t.colors.border,
            borderRadius: radius.chip,
            backgroundColor: t.colors.surface,
            overflow: 'hidden',
          }}
        >
          {predictions.map((p, i) => (
            <Pressable
              key={p.place_id}
              onPress={() => pick(p)}
              style={{
                padding: spacing.sm,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: t.colors.border,
              }}
            >
              <Text style={t.type.body}>{p.description}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
