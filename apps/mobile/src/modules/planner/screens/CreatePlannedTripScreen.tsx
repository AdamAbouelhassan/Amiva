import { useState } from 'react';
import { Text } from 'react-native';
import { Button } from '../../../components/Button';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { emptyTripFormValue, TripFormFields, TripFormValue } from '../../../components/TripFormFields';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { uploadTripPhotos } from '../../../lib/uploadTripPhotos';
import { useTheme } from '../../../theme';
import { useCreatePlannedTrip } from '../hooks/usePlannedTrips';

interface CreatePlannedTripScreenProps {
  navigation: { goBack: () => void };
}

export function CreatePlannedTripScreen({ navigation }: CreatePlannedTripScreenProps) {
  const t = useTheme();
  const { profile } = useCurrentUser();
  const [form, setForm] = useState<TripFormValue>(() => emptyTripFormValue('private'));
  const [saving, setSaving] = useState(false);
  const createPlannedTrip = useCreatePlannedTrip();

  async function submit() {
    if (!profile || !form.location) return;
    setSaving(true);
    try {
      const photoUrls = await uploadTripPhotos(form.photoUris, profile.uid);
      await createPlannedTrip.mutateAsync({
        ownerId: profile.uid,
        location: form.location.label,
        country: form.location.country,
        city: form.location.city,
        startDate: form.startDate,
        endDate: form.endDate,
        name: form.name.trim() || undefined,
        notes: form.notes.trim() || undefined,
        accommodation: form.accommodation.trim() || undefined,
        photoUrls,
        visibility: form.visibility,
      });
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenContainer>
      <Text style={t.type.displayMd}>New planned trip</Text>
      <TripFormFields value={form} onChange={setForm} planner photos={false} />
      <Button
        label="Create"
        variant="warm"
        onPress={submit}
        loading={saving || createPlannedTrip.isPending}
        disabled={!form.location}
      />
    </ScreenContainer>
  );
}
