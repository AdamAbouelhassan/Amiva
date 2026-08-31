/**
 * The shared body of every trip create/edit form (Logbook + Planner). A
 * controlled component — the parent owns a `TripFormValue` and the submit /
 * mutation wiring; this just renders the fields.
 */
import { Text, View } from 'react-native';
import { generateTripName } from '@amiva/core';
import { spacing, useTheme } from '../theme';
import { DateRangeField } from './DateRangeField';
import { LocationSearchField, SelectedLocation } from './LocationSearchField';
import { PhotoGalleryPicker } from './PhotoGalleryPicker';
import { Privacy, PrivacyPicker } from './PrivacyPicker';
import { TextField } from './TextField';

export interface TripFormValue {
  location: SelectedLocation | null;
  name: string;
  startDate: Date;
  endDate: Date;
  notes: string;
  accommodation: string;
  /** Mixed remote URLs + local URIs; caller uploads the local ones on submit. */
  photoUris: string[];
  visibility: Privacy;
}

export function emptyTripFormValue(visibility: Privacy = 'private'): TripFormValue {
  const today = new Date();
  return {
    location: null,
    name: '',
    startDate: today,
    endDate: today,
    notes: '',
    accommodation: '',
    photoUris: [],
    visibility,
  };
}

interface TripFormFieldsProps {
  value: TripFormValue;
  onChange: (next: TripFormValue) => void;
  /** Forward-looking copy for the Planner. */
  planner?: boolean;
  /** Planner hides photos — those are added only on completion. */
  photos?: boolean;
}

export function TripFormFields({ value, onChange, planner, photos = true }: TripFormFieldsProps) {
  const t = useTheme();
  const set = <K extends keyof TripFormValue>(key: K, v: TripFormValue[K]) =>
    onChange({ ...value, [key]: v });

  const namePlaceholder = value.location
    ? generateTripName(value.location.label, { startDate: value.startDate, endDate: value.endDate })
    : 'Auto-generated from your location';

  return (
    <View style={{ gap: spacing.md }}>
      <LocationSearchField
        label={planner ? 'Where to?' : 'Location'}
        value={value.location}
        onChange={(loc) => set('location', loc)}
      />

      <TextField
        label="Trip name"
        value={value.name}
        onChangeText={(v) => set('name', v)}
        placeholder={namePlaceholder}
      />

      <DateRangeField
        startDate={value.startDate}
        endDate={value.endDate}
        onChange={({ startDate, endDate }) => onChange({ ...value, startDate, endDate })}
      />

      <TextField
        label="Notes"
        value={value.notes}
        onChangeText={(v) => set('notes', v)}
        placeholder="Anything worth remembering — optional"
        multiline
      />

      <TextField
        label={planner ? "Where you're staying" : 'Accommodation'}
        value={value.accommodation}
        onChangeText={(v) => set('accommodation', v)}
        placeholder="Hotel, hostel, a friend's couch — optional"
      />

      {photos && <PhotoGalleryPicker uris={value.photoUris} onChange={(uris) => set('photoUris', uris)} />}

      <View style={{ gap: spacing.xs }}>
        <Text style={[t.type.label, { color: t.colors.textSecondary }]}>Visibility</Text>
        <PrivacyPicker value={value.visibility} onChange={(v) => set('visibility', v)} />
      </View>
    </View>
  );
}
