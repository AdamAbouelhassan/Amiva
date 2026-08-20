import { useState } from 'react';
import { Platform, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button } from '../../../components/Button';
import { Privacy, PrivacyPicker } from '../../../components/PrivacyPicker';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { TextField } from '../../../components/TextField';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { spacing, typography } from '../../../theme';
import { useCreatePlannedTrip } from '../hooks/usePlannedTrips';

interface CreatePlannedTripScreenProps {
  navigation: { goBack: () => void };
}

export function CreatePlannedTripScreen({ navigation }: CreatePlannedTripScreenProps) {
  const { profile } = useCurrentUser();
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [visibility, setVisibility] = useState<Privacy>('private');
  const createPlannedTrip = useCreatePlannedTrip();

  async function submit() {
    if (!profile || !location.trim()) return;
    await createPlannedTrip.mutateAsync({
      ownerId: profile.uid,
      locations: [location.trim()],
      startDate,
      endDate,
      visibility,
    });
    navigation.goBack();
  }

  return (
    <ScreenContainer>
      <Text style={typography.displayMd}>New planned trip</Text>
      <TextField label="Where to?" value={location} onChangeText={setLocation} placeholder="Country or city" />

      <View style={{ gap: spacing.xs }}>
        <Text style={typography.subtitle}>Start date</Text>
        <DateTimePicker value={startDate} mode="date" display={Platform.OS === 'ios' ? 'inline' : 'default'} onChange={(_, d) => d && setStartDate(d)} />
      </View>
      <View style={{ gap: spacing.xs }}>
        <Text style={typography.subtitle}>End date</Text>
        <DateTimePicker value={endDate} mode="date" display={Platform.OS === 'ios' ? 'inline' : 'default'} onChange={(_, d) => d && setEndDate(d)} />
      </View>

      <View style={{ gap: spacing.xs }}>
        <Text style={typography.subtitle}>Visibility</Text>
        <PrivacyPicker value={visibility} onChange={setVisibility} />
      </View>

      <Button label="Create" onPress={submit} loading={createPlannedTrip.isPending} disabled={!location.trim()} />
    </ScreenContainer>
  );
}
