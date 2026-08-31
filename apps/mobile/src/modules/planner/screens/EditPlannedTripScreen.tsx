import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button } from '../../../components/Button';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { emptyTripFormValue, TripFormFields, TripFormValue } from '../../../components/TripFormFields';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { uploadTripPhotos } from '../../../lib/uploadTripPhotos';
import { PlannedTripDoc } from '../../../repositories/types';
import { spacing, useTheme } from '../../../theme';
import { usePlannedTrip } from '../../../hooks/usePlannedTripData';
import { useDeletePlannedTrip, useUpdatePlannedTrip } from '../hooks/usePlannedTrips';

interface EditPlannedTripScreenProps {
  route: { params: { plannedTripId: string } };
  navigation: { goBack: () => void };
}

function toForm(trip: PlannedTripDoc): TripFormValue {
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

export function EditPlannedTripScreen({ route, navigation }: EditPlannedTripScreenProps) {
  const t = useTheme();
  const { plannedTripId } = route.params;
  const { profile } = useCurrentUser();
  const { data: trip } = usePlannedTrip(plannedTripId);
  const updateTrip = useUpdatePlannedTrip();
  const deleteTrip = useDeletePlannedTrip();
  const nav = useNavigation<{ pop: (count?: number) => void }>();
  const [form, setForm] = useState<TripFormValue>(() => emptyTripFormValue());
  const [saving, setSaving] = useState(false);

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
        plannedTripId,
        patch: {
          location: form.location.label,
          country: form.location.country,
          city: form.location.city ?? null,
          name: form.name.trim() || form.location.label,
          startDate: form.startDate,
          endDate: form.endDate,
          notes: form.notes.trim(),
          accommodation: form.accommodation.trim(),
          photoUrls,
          visibility: form.visibility,
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
    Alert.alert('Delete this plan?', 'The plan and its itinerary are removed. This can’t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTrip.mutateAsync(plannedTripId);
            nav.pop(2);
          } catch (err) {
            Alert.alert('Could not delete plan', err instanceof Error ? err.message : 'Please try again.');
          }
        },
      },
    ]);
  }

  if (!trip) return null;

  return (
    <ScreenContainer>
      <Text style={t.type.displayMd}>Edit planned trip</Text>
      <TripFormFields value={form} onChange={setForm} planner photos={false} />
      <Button label="Save changes" onPress={submit} loading={saving || updateTrip.isPending} disabled={!form.location} />
      <Pressable onPress={confirmDelete} style={{ alignSelf: 'center', paddingVertical: spacing.sm }}>
        <Text style={[t.type.label, { color: t.colors.danger }]}>
          {deleteTrip.isPending ? 'Deleting…' : 'Delete plan'}
        </Text>
      </Pressable>
    </ScreenContainer>
  );
}
