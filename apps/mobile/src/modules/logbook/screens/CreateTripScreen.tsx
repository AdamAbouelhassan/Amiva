/**
 * Trip creation (functional_specification.md §3.2): a country + explicit
 * date range, explicitly created by the user. Name auto-generates from
 * country + date range; the user can rename later from TripDetailScreen.
 */
import { useState } from 'react';
import { Platform, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button } from '../../../components/Button';
import { Privacy, PrivacyPicker } from '../../../components/PrivacyPicker';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { TextField } from '../../../components/TextField';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { spacing, typography } from '../../../theme';
import { useCreateTrip } from '../hooks/useTrips';

interface CreateTripScreenProps {
  navigation: { goBack: () => void };
}

export function CreateTripScreen({ navigation }: CreateTripScreenProps) {
  const { profile } = useCurrentUser();
  const [country, setCountry] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [visibility, setVisibility] = useState<Privacy>(profile?.privacySetting ?? 'public');
  const createTrip = useCreateTrip();

  async function submit() {
    if (!profile || !country.trim()) return;
    await createTrip.mutateAsync({
      ownerId: profile.uid,
      countries: [country.trim()],
      startDate,
      endDate,
      visibility,
    });
    navigation.goBack();
  }

  return (
    <ScreenContainer>
      <Text style={typography.displayMd}>New trip</Text>
      <TextField label="Country" value={country} onChangeText={setCountry} placeholder="e.g. Japan" />

      <View style={{ gap: spacing.xs }}>
        <Text style={typography.subtitle}>Start date</Text>
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(_, date) => date && setStartDate(date)}
        />
      </View>

      <View style={{ gap: spacing.xs }}>
        <Text style={typography.subtitle}>End date</Text>
        <DateTimePicker
          value={endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(_, date) => date && setEndDate(date)}
        />
      </View>

      <View style={{ gap: spacing.xs }}>
        <Text style={typography.subtitle}>Visibility</Text>
        <PrivacyPicker value={visibility} onChange={setVisibility} />
      </View>

      <Button label="Create trip" onPress={submit} loading={createTrip.isPending} disabled={!country.trim()} />
    </ScreenContainer>
  );
}
