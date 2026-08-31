/**
 * Edit a logged experience (functional_specification.md §3.3 — "Experiences
 * can be edited or deleted after posting"). Title, notes, rating, photos,
 * category profile, and date. Location isn't editable (it defines the
 * experience's place); delete + re-log to move it.
 */
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TravelStyleVector, zeroTravelStyleVector } from '@amiva/core';
import { Button } from '../../../components/Button';
import { DateField } from '../../../components/DateField';
import { PhotoGalleryPicker } from '../../../components/PhotoGalleryPicker';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { TextField } from '../../../components/TextField';
import { TravelStyleRadar } from '../../../components/TravelStyleRadar';
import { TravelStyleSliders } from '../../../components/TravelStyleSliders';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { uploadPhotoSet } from '../../../lib/uploadPhotos';
import { ExperienceDoc } from '../../../repositories/types';
import { spacing, useTheme } from '../../../theme';
import { StarRating } from '../components/StarRating';
import { useDeleteExperience, useExperience, useUpdateExperience } from '../hooks/useExperiences';

interface EditExperienceScreenProps {
  route: { params: { experienceId: string } };
  navigation: { goBack: () => void };
}

interface FormState {
  title: string;
  notes: string;
  rating: number;
  photoUris: string[];
  categoryScores: TravelStyleVector;
  date: Date;
}

function toForm(exp: ExperienceDoc): FormState {
  return {
    title: exp.title,
    notes: exp.notes,
    rating: exp.rating,
    photoUris: exp.photoUrls,
    categoryScores: exp.categoryScores,
    date: exp.date,
  };
}

export function EditExperienceScreen({ route, navigation }: EditExperienceScreenProps) {
  const t = useTheme();
  const { experienceId } = route.params;
  const { profile } = useCurrentUser();
  const { data: experience } = useExperience(experienceId);
  const updateExperience = useUpdateExperience();
  const deleteExperience = useDeleteExperience();
  const nav = useNavigation<{ pop: (count?: number) => void }>();

  const [form, setForm] = useState<FormState>(() => ({
    title: '',
    notes: '',
    rating: 5,
    photoUris: [],
    categoryScores: zeroTravelStyleVector(),
    date: new Date(),
  }));
  const [saving, setSaving] = useState(false);
  const seeded = useRef(false);

  useEffect(() => {
    if (experience && !seeded.current) {
      seeded.current = true;
      setForm(toForm(experience));
    }
  }, [experience]);

  const set = <K extends keyof FormState>(key: K, v: FormState[K]) => setForm((p) => ({ ...p, [key]: v }));

  async function submit() {
    if (!profile || !seeded.current || !form.title.trim()) return;
    setSaving(true);
    try {
      const photoUrls = await uploadPhotoSet(form.photoUris, `experiencePhotos/${profile.uid}`);
      await updateExperience.mutateAsync({
        experienceId,
        patch: {
          title: form.title.trim(),
          notes: form.notes,
          rating: form.rating,
          photoUrls,
          categoryScores: form.categoryScores,
          date: form.date,
          dateSource: 'manual',
        },
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert('Delete this experience?', 'This can’t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteExperience.mutateAsync(experienceId);
            nav.pop(2); // close this modal + the now-stale detail screen
          } catch (err) {
            Alert.alert('Could not delete', err instanceof Error ? err.message : 'Please try again.');
          }
        },
      },
    ]);
  }

  if (!experience) return null;

  return (
    <ScreenContainer>
      <Text style={t.type.displayMd}>Edit experience</Text>

      <TextField label="Title" value={form.title} onChangeText={(v) => set('title', v)} />
      <TextField
        label="Notes (private)"
        value={form.notes}
        onChangeText={(v) => set('notes', v)}
        multiline
      />

      <View style={{ gap: spacing.xs }}>
        <Text style={t.type.subtitle}>Rating</Text>
        <StarRating value={form.rating} onChange={(v) => set('rating', v)} />
      </View>

      <PhotoGalleryPicker uris={form.photoUris} onChange={(uris) => set('photoUris', uris)} label="Photos" max={5} />

      <DateField label="Date" value={form.date} maximumDate={new Date()} onChange={(d) => d && set('date', d)} />

      <View style={{ gap: spacing.sm }}>
        <Text style={t.type.subtitle}>Category profile</Text>
        <View style={{ alignItems: 'center' }}>
          <TravelStyleRadar series={[{ vector: form.categoryScores }]} size={200} showLabels={false} />
        </View>
        <TravelStyleSliders value={form.categoryScores} onChange={(v) => set('categoryScores', v)} />
      </View>

      <Button
        label="Save changes"
        onPress={submit}
        loading={saving || updateExperience.isPending}
        disabled={!form.title.trim()}
      />

      <Pressable onPress={confirmDelete} style={{ alignSelf: 'center', paddingVertical: spacing.sm }}>
        <Text style={[t.type.label, { color: t.colors.danger }]}>
          {deleteExperience.isPending ? 'Deleting…' : 'Delete experience'}
        </Text>
      </Pressable>
    </ScreenContainer>
  );
}
