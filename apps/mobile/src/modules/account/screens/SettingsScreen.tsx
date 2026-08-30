import { signOut } from 'firebase/auth';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '../../../components/Button';
import { Privacy, PrivacyPicker } from '../../../components/PrivacyPicker';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { auth } from '../../../firebase/client';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { UserRepository } from '../../../repositories/userRepository';
import { colors, spacing, typography } from '../../../theme';

interface SettingsScreenProps {
  navigation: { navigate: (screen: 'EditTravelStyle') => void };
}

export function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { firebaseUser, profile, refetchProfile } = useCurrentUser();
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function updatePrivacy(next: Privacy) {
    if (!firebaseUser) return;
    setSavingPrivacy(true);
    setError(undefined);
    try {
      await UserRepository.updatePrivacySetting(firebaseUser.uid, next);
      await refetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingPrivacy(false);
    }
  }

  return (
    <ScreenContainer>
      <Text style={typography.displayMd}>Settings</Text>

      <View style={{ gap: spacing.xs }}>
        <Text style={typography.subtitle}>Privacy</Text>
        <Text style={typography.bodySmall}>
          Controls who can see your Logbook, travel style matrix, and trips — public, friends-only, or private.
        </Text>
        {profile ? <PrivacyPicker value={profile.privacySetting} onChange={updatePrivacy} /> : null}
        {savingPrivacy ? <Text style={typography.caption}>Saving…</Text> : null}
      </View>

      <Button label="Edit travel style" variant="secondary" onPress={() => navigation.navigate('EditTravelStyle')} />

      <Button label="Sign out" variant="secondary" onPress={() => signOut(auth)} />

      {error ? <Text style={[typography.bodySmall, { color: colors.danger }]}>{error}</Text> : null}
    </ScreenContainer>
  );
}
