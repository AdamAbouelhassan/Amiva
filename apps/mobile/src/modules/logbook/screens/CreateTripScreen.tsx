/**
 * Trip creation (functional_specification.md §3.2, 2026-08 restructure): a
 * user-authored container — one location, optional dates, name (auto-fills
 * from location + dates), optional notes / accommodation / photos.
 * Experiences are attached explicitly later.
 */
import { useState } from 'react';
import { Text } from 'react-native';
import { Button } from '../../../components/Button';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { emptyTripFormValue, TripFormFields, TripFormValue } from '../../../components/TripFormFields';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { uploadTripPhotos } from '../../../lib/uploadTripPhotos';
import { useTheme } from '../../../theme';
import { useCreateTrip } from '../hooks/useTrips';

interface CreateTripScreenProps {
  navigation: { goBack: () => void };
}

export function CreateTripScreen({ navigation }: CreateTripScreenProps) {
  const t = useTheme();
  const { profile } = useCurrentUser();
  const [form, setForm] = useState<TripFormValue>(() =>
    emptyTripFormValue(profile?.privacySetting ?? 'public'),
  );
  const [saving, setSaving] = useState(false);
  const createTrip = useCreateTrip();

  async function submit() {
    if (!profile || !form.location) return;
    setSaving(true);
    try {
      const photoUrls = await uploadTripPhotos(form.photoUris, profile.uid);
      await createTrip.mutateAsync({
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
      <Text style={t.type.displayMd}>New trip</Text>
      <TripFormFields value={form} onChange={setForm} />
      <Button
        label="Create trip"
        onPress={submit}
        loading={saving || createTrip.isPending}
        disabled={!form.location}
      />
    </ScreenContainer>
  );
}
