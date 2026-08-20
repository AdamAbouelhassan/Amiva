/**
 * Log an experience (functional_specification.md §3.3) — the other half
 * of the vertical slice's core scoring pipeline: this screen's submit is
 * what ultimately triggers `onExperienceCreated` server-side (travel
 * style decay + trip cover photo), which is what makes the match % show
 * up correctly back in the Discovery feed.
 */
import { useState } from 'react';
import { Platform, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TravelStyleVector, zeroTravelStyleVector } from '@amiva/core';
import { Button } from '../../../components/Button';
import { PlacesAutocomplete, SelectedPlace } from '../../../components/PlacesAutocomplete';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { TextField } from '../../../components/TextField';
import { TravelStyleSliders } from '../../../components/TravelStyleSliders';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { compressAndUploadImage } from '../../../lib/uploadImage';
import { spacing, typography } from '../../../theme';
import { PhotoPicker } from '../components/PhotoPicker';
import { StarRating } from '../components/StarRating';
import { useCreateExperience } from '../hooks/useExperiences';

interface CreateExperienceScreenProps {
  route: { params?: { tripId?: string } };
  navigation: { goBack: () => void };
}

export function CreateExperienceScreen({ route, navigation }: CreateExperienceScreenProps) {
  const { profile } = useCurrentUser();
  const tripId = route.params?.tripId;

  const [place, setPlace] = useState<SelectedPlace | undefined>();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(5);
  const [localPhotoUris, setLocalPhotoUris] = useState<string[]>([]);
  const [categoryScores, setCategoryScores] = useState<TravelStyleVector>(zeroTravelStyleVector());
  const [date, setDate] = useState(new Date());
  const [dateSource, setDateSource] = useState<'exif' | 'manual'>('manual');
  const [uploading, setUploading] = useState(false);

  const createExperience = useCreateExperience();

  async function submit() {
    if (!profile || !place || !title.trim() || localPhotoUris.length === 0) return;

    setUploading(true);
    try {
      const photoUrls = await Promise.all(
        localPhotoUris.map((uri, index) =>
          compressAndUploadImage(uri, `experiencePhotos/${profile.uid}/${Date.now()}-${index}.jpg`),
        ),
      );

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

  const canSubmit = !!place && !!title.trim() && localPhotoUris.length > 0;

  return (
    <ScreenContainer>
      <Text style={typography.displayMd}>Log an experience</Text>

      <PlacesAutocomplete onSelect={setPlace} />

      <TextField label="Title" value={title} onChangeText={setTitle} placeholder="What did you do?" />
      <TextField
        label="Notes (private)"
        value={notes}
        onChangeText={setNotes}
        placeholder="Your personal reflection — only you see this"
        multiline
      />

      <View style={{ gap: spacing.xs }}>
        <Text style={typography.subtitle}>Rating</Text>
        <StarRating value={rating} onChange={setRating} />
      </View>

      <PhotoPicker
        localUris={localPhotoUris}
        onChange={setLocalPhotoUris}
        onExifDateDetected={(exifDate) => {
          setDate(exifDate);
          setDateSource('exif');
        }}
      />

      <View style={{ gap: spacing.xs }}>
        <Text style={typography.subtitle}>Date {dateSource === 'exif' ? '(from photo)' : ''}</Text>
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(_, next) => {
            if (next) {
              setDate(next);
              setDateSource('manual');
            }
          }}
        />
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={typography.subtitle}>Category profile</Text>
        <Text style={typography.bodySmall}>
          Rate this experience across the same 8 categories — this is what powers everyone's match % against it.
        </Text>
        <TravelStyleSliders value={categoryScores} onChange={setCategoryScores} />
      </View>

      <Button label="Post" onPress={submit} loading={uploading || createExperience.isPending} disabled={!canSubmit} />
    </ScreenContainer>
  );
}
