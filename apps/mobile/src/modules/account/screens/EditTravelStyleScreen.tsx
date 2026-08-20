import { useState } from 'react';
import { Text, View } from 'react-native';
import { TravelStyleVector } from '@amiva/core';
import { Button } from '../../../components/Button';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { TravelStyleSliders } from '../../../components/TravelStyleSliders';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { spacing, typography } from '../../../theme';
import { useUpdateTravelStyleManual } from '../hooks/useUpdateTravelStyleManual';

export function EditTravelStyleScreen({ navigation }: { navigation: { goBack: () => void } }) {
  const { profile } = useCurrentUser();
  const [value, setValue] = useState<TravelStyleVector | undefined>(profile?.travelStyle);
  const mutation = useUpdateTravelStyleManual();

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
        onPress={() =>
          mutation.mutate(value, {
            onSuccess: () => navigation.goBack(),
          })
        }
      />
    </ScreenContainer>
  );
}
