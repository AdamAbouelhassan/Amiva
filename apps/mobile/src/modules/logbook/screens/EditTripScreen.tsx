import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button } from '../../../components/Button';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { emptyTripFormValue, TripFormFields, TripFormValue } from '../../../components/TripFormFields';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { uploadTripPhotos } from '../../../lib/uploadTripPhotos';
import { LogbookStackParamList } from '../../../navigation/types';
import { TripDoc } from '../../../repositories/types';
import { spacing, useTheme } from '../../../theme';
import { useDeleteTrip, useTrip, useUpdateTrip } from '../hooks/useTrips';

interface EditTripScreenProps {
  route: { params: { tripId: string } };
  navigation: { goBack: () => void };
}

function toForm(trip: TripDoc): TripFormValue {
  return {
    location: { label: trip.location, country: trip.country, city: trip.city },
    name: trip.name,
    startDate: trip.startDate,
    endDate: trip.endDate,
    notes: trip.notes ?? '',
    accommodation: trip.accommodation ?? '',
    photoUris: trip.photoUrls,
    visibility: trip.visibility,
  };
}

export function EditTripScreen({ route, navigation }: EditTripScreenProps) {
  const t = useTheme();
  const { tripId } = route.params as LogbookStackParamList['EditTrip'];
  const { profile } = useCurrentUser();
  const { data: trip } = useTrip(tripId);
  const updateTrip = useUpdateTrip();
  const deleteTrip = useDeleteTrip();
  const nav = useNavigation<{ pop: (count?: number) => void }>();
  const [form, setForm] = useState<TripFormValue>(() => emptyTripFormValue());
  const [saving, setSaving] = useState(false);

  // Seed the form from the trip exactly once — a later background refetch
  // must not wipe edits in progress.
  const seeded = useRef(false);
  useEffect(() => {
    if (trip && !seeded.current) {
      seeded.current = true;
      setForm(toForm(trip));
    }
  }, [trip]);

  async function submit() {
    if (!profile || !form.location || !seeded.current) return;
    setSaving(true);
    try {
      const photoUrls = await uploadTripPhotos(form.photoUris, profile.uid);
      await updateTrip.mutateAsync({
        tripId,
        patch: {
          location: form.location.label,
          country: form.location.country,
          city: form.location.city ?? null,
          name: form.name.trim() || form.location.label,
          startDate: form.startDate,
          endDate: form.endDate,
          notes: form.notes.trim(),
          accommodation: form.accommodation.trim(),
          visibility: form.visibility,
          photoUrls,
          // Keep the cover in sync with the gallery's first photo; leave an
          // experience-derived cover alone only when the gallery is empty.
          ...(photoUrls.length > 0 ? { coverPhotoUrl: photoUrls[0] } : {}),
        },
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Could not save trip', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    if (!trip) return;
    Alert.alert(
      'Delete this trip?',
      'The trip is removed. Experiences in it are kept as standalone logbook entries.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTrip.mutateAsync({ tripId, ownerId: trip.ownerId });
              nav.pop(2);
            } catch (err) {
              Alert.alert('Could not delete trip', err instanceof Error ? err.message : 'Please try again.');
            }
          },
        },
      ],
    );
  }

  if (!trip) return null;

  return (
    <ScreenContainer>
      <Text style={t.type.displayMd}>Edit trip</Text>
      <TripFormFields value={form} onChange={setForm} />
      <Button label="Save changes" onPress={submit} loading={saving || updateTrip.isPending} disabled={!form.location} />
      <Pressable onPress={confirmDelete} style={{ alignSelf: 'center', paddingVertical: spacing.sm }}>
        <Text style={[t.type.label, { color: t.colors.danger }]}>
          {deleteTrip.isPending ? 'Deleting…' : 'Delete trip'}
        </Text>
      </Pressable>
    </ScreenContainer>
  );
}
