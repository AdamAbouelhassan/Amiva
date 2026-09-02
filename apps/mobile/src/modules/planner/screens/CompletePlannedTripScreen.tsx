/**
 * "Add this trip to your Logbook" (functional_specification.md §4.3, 2026-09
 * shared-trip rework): collect *your* photos, then the callable creates a
 * Logbook trip mirroring the plan, owned by you. On a shared trip every
 * participant does this independently — separate trips, separate photos.
 * Only reachable once the planned end date has passed.
 */
import { useState } from 'react';
import { Alert, Text } from 'react-native';
import { Button } from '../../../components/Button';
import { PhotoGalleryPicker } from '../../../components/PhotoGalleryPicker';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { uploadTripPhotos } from '../../../lib/uploadTripPhotos';
import { spacing, useTheme } from '../../../theme';
import { usePlannedTrip } from '../../../hooks/usePlannedTripData';
import { useCompletePlannedTrip } from '../hooks/useConvertPlannedTrip';

interface CompletePlannedTripScreenProps {
  route: { params: { plannedTripId: string } };
  navigation: { goBack: () => void };
}

export function CompletePlannedTripScreen({ route, navigation }: CompletePlannedTripScreenProps) {
  const t = useTheme();
  const { plannedTripId } = route.params;
  const { profile } = useCurrentUser();
  const { data: trip } = usePlannedTrip(plannedTripId);
  const complete = useCompletePlannedTrip(plannedTripId);
  const [uris, setUris] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!profile) return;
    setSaving(true);
    try {
      const photoUrls = await uploadTripPhotos(uris, profile.uid);
      await complete.mutateAsync(photoUrls);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Could not complete trip', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (!trip) return null;

  return (
    <ScreenContainer>
      <Text style={t.type.displayMd}>Add “{trip.name || trip.location}” to your Logbook</Text>
      <Text style={[t.type.body, { color: t.colors.textSecondary }]}>
        Add your photos — you'll get your own Logbook trip keeping its dates, notes, and place. Log your own
        experiences into it afterwards.
      </Text>

      <PhotoGalleryPicker uris={uris} onChange={setUris} label="Your trip photos" />

      <Button
        label="Add to my Logbook"
        variant="warm"
        onPress={submit}
        loading={saving || complete.isPending}
      />
      <Text style={[t.type.caption, { color: t.colors.textSecondary, marginTop: spacing.xs }]}>
        Changed your mind? You can remove your copy from the trip afterwards.
      </Text>
    </ScreenContainer>
  );
}
