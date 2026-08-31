/**
 * Log an experience (functional_specification.md §3.3) — the other half
 * of the vertical slice's core scoring pipeline: this screen's submit is
 * what ultimately triggers `onExperienceCreated` server-side (travel
 * style decay + trip cover photo), which is what makes the match % show
 * up correctly back in the Discovery feed.
 */
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { TravelStyleVector, zeroTravelStyleVector } from '@amiva/core';
import { Button } from '../../../components/Button';
import { DateField } from '../../../components/DateField';
import { PlacesAutocomplete, SelectedPlace } from '../../../components/PlacesAutocomplete';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { TextField } from '../../../components/TextField';
import { TravelStyleRadar } from '../../../components/TravelStyleRadar';
import { TravelStyleSliders } from '../../../components/TravelStyleSliders';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { placePhotoUrl } from '../../../lib/placePhoto';
import { uploadPhotoSet } from '../../../lib/uploadPhotos';
import { radius, spacing, useTheme } from '../../../theme';
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
  const [categoryScores, setCategoryScores] = useState<TravelStyleVector>(
    prefill?.categoryScores ?? zeroTravelStyleVector(),
  );
  const [date, setDate] = useState(new Date());
  const [dateSource, setDateSource] = useState<'exif' | 'manual'>('manual');
  const [uploading, setUploading] = useState(false);

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
        categoryScores,
        date,
        dateSource,
      });

      navigation.goBack();
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

      {!lockedTripId && trips.length > 0 && (
        <View style={{ gap: spacing.xs }}>
          <Text style={t.type.label}>Add to a trip (optional)</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {[{ tripId: undefined as string | undefined, name: 'No trip' }, ...trips].map((option) => {
              const selected = selectedTripId === option.tripId;
              return (
                <Pressable
                  key={option.tripId ?? 'none'}
                  onPress={() => setSelectedTripId(option.tripId)}
                  style={{
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                    borderRadius: radius.chip,
                    borderWidth: 1,
                    borderColor: selected ? t.colors.accent : t.colors.border,
                    backgroundColor: selected ? t.colors.accent : t.colors.surface,
                  }}
                >
                  <Text style={[t.type.label, { color: selected ? t.colors.textOnAccent : t.colors.textSecondary }]}>
                    {option.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

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

      <View style={{ gap: spacing.sm }}>
        <Text style={t.type.subtitle}>Category profile</Text>
        <Text style={[t.type.bodySmall, { color: t.colors.textSecondary }]}>
          Rate this experience across the same 8 categories — this is what powers everyone's match % against it.
        </Text>
        <View style={{ alignItems: 'center' }}>
          <TravelStyleRadar series={[{ vector: categoryScores }]} size={200} showLabels={false} />
        </View>
        <TravelStyleSliders value={categoryScores} onChange={setCategoryScores} />
      </View>

      <Button label="Post" onPress={submit} loading={uploading || createExperience.isPending} disabled={!canSubmit} />
    </ScreenContainer>
  );
}
