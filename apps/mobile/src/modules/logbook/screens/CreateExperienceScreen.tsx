/**
 * Log an experience (functional_specification.md §3.3) — the other half
 * of the vertical slice's core scoring pipeline: this screen's submit is
 * what ultimately triggers `onExperienceCreated` server-side (travel
 * style decay + trip cover photo), which is what makes the match % show
 * up correctly back in the Discovery feed.
 *
 * Taxonomy migration (2026-09-02): the manual category-slider step is
 * gone — categoryScores is derived algorithmically from the selected
 * Place's Google types, full stop (docs/claude_code_prompt_taxonomy_migration.md
 * instruction #3). What's submitted here is a zero-vector placeholder
 * (CLAUDE.md principle #2: never let client computation become the
 * persisted, displayed-everywhere-else value) — onExperienceCreated
 * immediately overwrites it with the real, server-derived vector, the
 * same "create now, backfill a moment later" shape already used here for
 * the trip cover photo. The radar below is a live *preview only*, computed
 * client-side with the same pure estimateCategoryScoresFromPlace function
 * the server uses, purely so the user sees roughly what they're about to
 * get before posting.
 */
import { useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { estimateCategoryScoresFromPlace, zeroTravelStyleVector } from '@amiva/core';
import { Button } from '../../../components/Button';
import { DateField } from '../../../components/DateField';
import { PlacesAutocomplete, SelectedPlace } from '../../../components/PlacesAutocomplete';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { SelectField } from '../../../components/SelectField';
import { TextField } from '../../../components/TextField';
import { TravelStyleRadar } from '../../../components/TravelStyleRadar';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { placePhotoUrl } from '../../../lib/placePhoto';
import { uploadPhotoSet } from '../../../lib/uploadPhotos';
import { spacing, useTheme } from '../../../theme';
import { CreateExperienceParams } from '../../../navigation/types';
import { PhotoPicker } from '../components/PhotoPicker';
import { StarRating } from '../components/StarRating';
import { useCreateExperience } from '../hooks/useExperiences';
import { useTrips } from '../hooks/useTrips';

interface CreateExperienceScreenProps {
  route: { params?: NonNullable<CreateExperienceParams> };
  navigation: { goBack: () => void };
}

export function CreateExperienceScreen({ route, navigation }: CreateExperienceScreenProps) {
  const t = useTheme();
  const { profile } = useCurrentUser();
  const lockedTripId = route.params?.tripId;
  const prefill = route.params?.prefill;
  const { data: trips = [] } = useTrips(lockedTripId ? undefined : profile?.uid);

  const [selectedTripId, setSelectedTripId] = useState<string | undefined>(lockedTripId);
  const tripId = lockedTripId ?? selectedTripId;

  const [place, setPlace] = useState<SelectedPlace | undefined>(prefill?.place);
  const [title, setTitle] = useState(prefill?.title ?? '');
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(5);
  const [localPhotoUris, setLocalPhotoUris] = useState<string[]>([]);
  const [date, setDate] = useState(new Date());
  const [dateSource, setDateSource] = useState<'exif' | 'manual'>('manual');
  const [uploading, setUploading] = useState(false);

  // Preview only — never submitted. The server derives the real value
  // from the Place doc's stored types once the experience is created.
  const previewCategoryScores = useMemo(
    () => estimateCategoryScoresFromPlace(place?.googlePlaceTypes ?? []),
    [place],
  );

  const createExperience = useCreateExperience();

  async function submit() {
    if (!profile || !place || !title.trim()) return;

    setUploading(true);
    try {
      // No photo of your own? Fall back to the place's Google Maps photo.
      const googleFallback = place.photoRef ? placePhotoUrl(place.photoRef) : undefined;
      const photoUrls =
        localPhotoUris.length > 0
          ? await uploadPhotoSet(localPhotoUris, `experiencePhotos/${profile.uid}`)
          : googleFallback
            ? [googleFallback]
            : [];

      await createExperience.mutateAsync({
        ownerId: profile.uid,
        place,
        tripId,
        title: title.trim(),
        notes,
        rating,
        photoUrls,
        // Placeholder — onExperienceCreated derives and overwrites the
        // real value server-side (see header comment).
        categoryScores: zeroTravelStyleVector(),
        date,
        dateSource,
      });

      navigation.goBack();
    } catch (err) {
      Alert.alert(
        'Could not log this experience',
        err instanceof Error ? err.message : 'Please try again.',
      );
    } finally {
      setUploading(false);
    }
  }

  const canSubmit = !!place && !!title.trim();

  return (
    <ScreenContainer>
      <Text style={t.type.displayMd}>Log an experience</Text>
      {prefill ? (
        <Text style={[t.type.bodySmall, { color: t.colors.textSecondary }]}>
          Pre-filled from an experience you {prefill.title ? 'saw' : 'saved'} — the photos, rating, notes and
          date are yours to add.
        </Text>
      ) : null}

      <PlacesAutocomplete onSelect={setPlace} initialPlace={prefill?.place} />

      <TextField label="Title" value={title} onChangeText={setTitle} placeholder="What did you do?" />
      <TextField
        label="Notes (private)"
        value={notes}
        onChangeText={setNotes}
        placeholder="Your personal reflection — only you see this"
        multiline
      />

      <View style={{ gap: spacing.xs }}>
        <Text style={t.type.subtitle}>Rating</Text>
        <StarRating value={rating} onChange={setRating} />
      </View>

      <View style={{ gap: spacing.xxs }}>
        <PhotoPicker
          localUris={localPhotoUris}
          onChange={setLocalPhotoUris}
          onExifDateDetected={(exifDate) => {
            setDate(exifDate);
            setDateSource('exif');
          }}
        />
        {localPhotoUris.length === 0 && (
          <Text style={[t.type.caption, { color: t.colors.textSecondary }]}>
            Optional — we'll use the place's photo if you don't add one.
          </Text>
        )}
      </View>

      {!lockedTripId && trips.length > 0 && (
        <SelectField
          label="Trip (optional)"
          value={selectedTripId}
          onChange={setSelectedTripId}
          placeholder="No trip"
          options={[
            { value: undefined, label: 'No trip' },
            ...trips.map((tr) => ({ value: tr.tripId, label: tr.name })),
          ]}
        />
      )}

      <DateField
        label={`Date${dateSource === 'exif' ? ' (from photo)' : ''}`}
        value={date}
        maximumDate={new Date()}
        onChange={(next) => {
          if (next) {
            setDate(next);
            setDateSource('manual');
          }
        }}
      />

      {place && (
        <View style={{ gap: spacing.sm }}>
          <Text style={t.type.subtitle}>Category profile</Text>
          <Text style={[t.type.bodySmall, { color: t.colors.textSecondary }]}>
            Estimated automatically from {place.name} — this is what powers everyone's match % against it.
          </Text>
          <View style={{ alignItems: 'center' }}>
            <TravelStyleRadar series={[{ vector: previewCategoryScores }]} size={200} showLabels={false} />
          </View>
        </View>
      )}

      <Button label="Post" onPress={submit} loading={uploading || createExperience.isPending} disabled={!canSubmit} />
    </ScreenContainer>
  );
}
