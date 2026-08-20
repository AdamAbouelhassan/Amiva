import { signOut } from 'firebase/auth';
import { Text, View } from 'react-native';
import { Button } from '../../../components/Button';
import { Privacy, PrivacyPicker } from '../../../components/PrivacyPicker';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { auth } from '../../../firebase/client';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { UserRepository } from '../../../repositories/userRepository';
import { spacing, typography } from '../../../theme';

interface SettingsScreenProps {
  navigation: { navigate: (screen: 'EditTravelStyle') => void };
}

export function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { firebaseUser, profile, refetchProfile } = useCurrentUser();

  async function updatePrivacy(next: Privacy) {
    if (!firebaseUser) return;
    await UserRepository.updatePrivacySetting(firebaseUser.uid, next);
    await refetchProfile();
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
      </View>

      <Button label="Edit travel style" variant="secondary" onPress={() => navigation.navigate('EditTravelStyle')} />

      <Button label="Sign out" variant="secondary" onPress={() => signOut(auth)} />
    </ScreenContainer>
  );
}
