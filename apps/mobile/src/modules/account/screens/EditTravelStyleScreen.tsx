import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { TravelStyleVector } from '@amiva/core';
import { Button } from '../../../components/Button';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { TravelStyleRadar } from '../../../components/TravelStyleRadar';
import { TravelStyleSliders } from '../../../components/TravelStyleSliders';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { spacing, useTheme } from '../../../theme';
import { useUpdateTravelStyleManual } from '../hooks/useUpdateTravelStyleManual';

export function EditTravelStyleScreen({ navigation }: { navigation: { goBack: () => void } }) {
  const t = useTheme();
  const { profile } = useCurrentUser();
  const [value, setValue] = useState<TravelStyleVector | undefined>(profile?.travelStyle);
  const mutation = useUpdateTravelStyleManual();

  useEffect(() => {
    if (profile?.travelStyle && !value) setValue(profile.travelStyle);
  }, [profile, value]);

  if (!value) return null;

  return (
    <ScreenContainer>
      <View style={{ gap: spacing.xs }}>
        <Text style={t.type.displayMd}>Edit travel style</Text>
        <Text style={[t.type.bodySmall, { color: t.colors.textSecondary }]}>
          This sets a new baseline. Your ongoing activity keeps nudging your style from these values — it won't
          revert to your old trend.
        </Text>
      </View>

      <View style={{ alignItems: 'center' }}>
        <TravelStyleRadar series={[{ vector: value }]} size={240} highlightTop />
      </View>

      <TravelStyleSliders value={value} onChange={setValue} />

      <Button
        label="Save"
        loading={mutation.isPending}
        onPress={() => mutation.mutate(value, { onSuccess: () => navigation.goBack() })}
      />

      {mutation.error ? (
        <Text style={[t.type.bodySmall, { color: t.colors.danger }]}>{mutation.error.message}</Text>
      ) : null}
    </ScreenContainer>
  );
}
