import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { TravelStyleVector } from '@amiva/core';
import { Button } from '../../../components/Button';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { TravelStyleSliders } from '../../../components/TravelStyleSliders';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { colors, spacing, typography } from '../../../theme';
import { useUpdateTravelStyleManual } from '../hooks/useUpdateTravelStyleManual';

export function EditTravelStyleScreen({ navigation }: { navigation: { goBack: () => void } }) {
  const { profile } = useCurrentUser();
  const [value, setValue] = useState<TravelStyleVector | undefined>(profile?.travelStyle);
  const mutation = useUpdateTravelStyleManual();

  // profile may still be loading on first render (this screen can be
  // reached before useCurrentUser's query resolves) — sync once it does,
  // rather than only reading it as a one-time useState initializer.
  useEffect(() => {
    if (profile?.travelStyle && !value) setValue(profile.travelStyle);
  }, [profile, value]);

  if (!value) return null;

  return (
    <ScreenContainer>
      <View style={{ gap: spacing.xs }}>
        <Text style={typography.displayMd}>Edit travel style</Text>
        <Text style={typography.bodySmall}>
          This sets a new baseline. From here, your ongoing activity (logging and saving experiences) will keep
          nudging your style starting from these values — it won't revert to your old trend.
        </Text>
      </View>

      <TravelStyleSliders value={value} onChange={setValue} />

      <Button
        label="Save"
        loading={mutation.isPending}
        onPress={() => {
          // TEMPORARY diagnostic log — remove once the save-doesn't-persist
          // issue is confirmed fixed. If this line never prints when
          // tapping Save, the bug is upstream of the mutation entirely
          // (touch handling / Button component), not in the save logic.
          console.log('[EditTravelStyleScreen] Save tapped, value =', JSON.stringify(value));
          mutation.mutate(value, {
            onSuccess: () => {
              console.log('[EditTravelStyleScreen] mutation onSuccess');
              navigation.goBack();
            },
            onError: (err) => {
              console.log('[EditTravelStyleScreen] mutation onError', err);
            },
          });
        }}
      />

      {mutation.error ? (
        <Text style={[typography.bodySmall, { color: colors.danger }]}>{mutation.error.message}</Text>
      ) : null}
    </ScreenContainer>
  );
}
